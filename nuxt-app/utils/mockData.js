// Geradores de dados mockados para o modo demo. Todos os fetches da API
// chamam estes helpers quando o mock store está ativo.
//
// Diferente da versão vanilla (js/util/mockData.js), estas funções são PURAS:
// recebem `scenario` como argumento em vez de ler do mockMode. Isso mantém o
// módulo desacoplado do Pinia — quem chama resolve via useMockStore().scenario.

import { getTeam, getTeamApiId, getStadium, getTeamFormation } from './data.js';

// -- Pools de nomes para gerador procedural --
const FIRST_NAMES = [
  'Lucas','Diego','João','Carlos','Gabriel','Pedro','Felipe','André','Rafael','Marco',
  'Antonio','Mateo','Daniel','Bruno','Vitor','Hugo','Sergio','Pablo','Nicolas','Tomás',
  'Adrián','Iván','Manuel','Alejandro','Javier','Francisco','Roberto','Eduardo','Fernando','Ricardo',
  'Miguel','Alberto','Cristian','Jorge','Ahmed','Youssef','Karim','Mohamed','Hiroshi','Takashi',
  'Hans','Klaus','Jürgen','Lars','Erik','Olav','Pierre','Jean','Henri','Liam'
];
const LAST_NAMES = [
  'Silva','Santos','Lopez','Garcia','Martinez','Rodriguez','Hernandez','Pereira','Costa','Ferreira',
  'Almeida','Oliveira','Cardoso','Moreira','Mendes','Souza','Rocha','Carvalho','Gomes','Fonseca',
  'Diaz','Torres','Vargas','Castro','Romero','Gutierrez','Acosta','Ortega','Reyes','Cruz',
  'Morales','Jimenez','Ruiz','Vega','Suárez','Aguilar','Schneider','Müller','Becker','Hoffmann',
  'Andersen','Hansen','Eriksson','Lindqvist','Dubois','Lefevre','Tanaka','Nakamura','Khan','Hassan'
];

// Hash determinístico simples (sempre mesmo time = mesmos jogadores).
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function nameFor(teamCode, slot) {
  const seed = hash(teamCode + ':' + slot);
  const first = FIRST_NAMES[seed % FIRST_NAMES.length];
  const last = LAST_NAMES[(seed * 31) % LAST_NAMES.length];
  return `${first} ${last}`;
}

// -- Squad procedural (23 jogadores) --
// Layout: 3 GK + 8 DEF + 8 MID + 4 FWD = 23
const SQUAD_LAYOUT = [
  { pos: 'Goalkeeper', count: 3, numbers: [1, 12, 22] },
  { pos: 'Defender',   count: 8, numbers: [2, 3, 4, 5, 13, 14, 15, 16] },
  { pos: 'Midfielder', count: 8, numbers: [6, 7, 8, 17, 18, 19, 20, 23] },
  { pos: 'Attacker',   count: 4, numbers: [9, 10, 11, 21] }
];

const POSITION_SHORT = { Goalkeeper: 'GK', Defender: 'DEF', Midfielder: 'MID', Attacker: 'FWD' };
const POSITION_LABEL = { Goalkeeper: 'Goleiros', Defender: 'Defensores', Midfielder: 'Meio-campistas', Attacker: 'Atacantes' };

export function mockSquad(teamCode) {
  const players = [];
  let slot = 0;
  SQUAD_LAYOUT.forEach(group => {
    group.numbers.forEach((num) => {
      slot++;
      const id = hash(teamCode + ':p' + slot) % 100000;
      players.push({
        id,
        name: nameFor(teamCode, slot),
        age: 20 + (id % 15),
        number: num,
        position: group.pos,
        positionShort: POSITION_SHORT[group.pos],
        positionLabel: POSITION_LABEL[group.pos],
        photo: ''
      });
    });
  });

  const grouped = {};
  players.forEach(p => {
    if (!grouped[p.position]) grouped[p.position] = [];
    grouped[p.position].push(p);
  });

  return {
    teamCode,
    formation: getTeamFormation(teamCode),
    players,
    grouped,
    totalPlayers: players.length,
    fetchedAt: Date.now()
  };
}

// -- Lineup com grid (linha:coluna) baseado em formação --
function buildLineupForApi(squad, teamApiId, _side) {
  const formation = squad.formation || '4-3-3';
  const lines = formation.split('-').map(Number);
  const gks = squad.grouped.Goalkeeper || [];
  const defs = squad.grouped.Defender || [];
  const mids = squad.grouped.Midfielder || [];
  const fwds = squad.grouped.Attacker || [];

  const startXI = [];

  // GK = linha 1, coluna 1
  if (gks[0]) startXI.push({ ...gks[0], grid: '1:1' });

  // Distribui linhas conforme formação
  const pools = lines.length === 4 ? [defs, mids, mids.slice(lines[1]), fwds] : [defs, mids, fwds];
  let row = 2;
  lines.forEach((count, idx) => {
    const pool = pools[idx] || [];
    for (let col = 0; col < count; col++) {
      const p = pool[col];
      if (p) startXI.push({ ...p, grid: `${row}:${col + 1}` });
    }
    row++;
  });

  // Banco = restante até 12
  const used = new Set(startXI.map(p => p.id));
  const subs = squad.players.filter(p => !used.has(p.id)).slice(0, 12);

  return {
    teamId: teamApiId,
    formation,
    coach: nameFor('COACH-' + squad.teamCode, 0),
    startXI: startXI.map(p => ({
      id: p.id, name: p.name, number: p.number, pos: POSITION_SHORT[p.position], grid: p.grid
    })),
    substitutes: subs.map(p => ({
      id: p.id, name: p.name, number: p.number, pos: POSITION_SHORT[p.position]
    }))
  };
}

// -- Eventos (gols, cartões, subs) por cenário --
function buildEvents(scenario, homeApiId, awayApiId, homeName, awayName, homeSquad, awaySquad) {
  if (scenario === 'pre' || scenario === 'injuries-heavy') return [];

  const e = [];
  const pickPlayer = (squad, idx) => squad.players[idx % squad.players.length]?.name || 'Player';

  // Gol home aos 23'
  e.push({
    minute: 23, extra: null, teamId: homeApiId, teamName: homeName,
    playerName: pickPlayer(homeSquad, 9), assistName: pickPlayer(homeSquad, 7),
    type: 'Goal', detail: 'Normal Goal', comments: null
  });

  // Cartão amarelo away aos 35'
  e.push({
    minute: 35, extra: null, teamId: awayApiId, teamName: awayName,
    playerName: pickPlayer(awaySquad, 5), assistName: null,
    type: 'Card', detail: 'Yellow Card', comments: 'Falta tática'
  });

  if (scenario === 'halftime') return e;

  // Pênalti home aos 58'
  e.push({
    minute: 58, extra: null, teamId: homeApiId, teamName: homeName,
    playerName: pickPlayer(homeSquad, 10), assistName: null,
    type: 'Goal', detail: 'Penalty', comments: null
  });

  // Gol away aos 62'
  e.push({
    minute: 62, extra: null, teamId: awayApiId, teamName: awayName,
    playerName: pickPlayer(awaySquad, 9), assistName: pickPlayer(awaySquad, 8),
    type: 'Goal', detail: 'Normal Goal', comments: null
  });

  // Substituição home aos 64'
  e.push({
    minute: 64, extra: null, teamId: homeApiId, teamName: homeName,
    playerName: pickPlayer(homeSquad, 17), assistName: pickPlayer(homeSquad, 7),
    type: 'subst', detail: 'Substitution 1', comments: null
  });

  if (scenario === 'live') return e;

  // Cartão vermelho away aos 78'
  e.push({
    minute: 78, extra: null, teamId: awayApiId, teamName: awayName,
    playerName: pickPlayer(awaySquad, 4), assistName: null,
    type: 'Card', detail: 'Red Card', comments: 'Segundo amarelo'
  });

  // Gol home aos 88' (3x1)
  e.push({
    minute: 88, extra: null, teamId: homeApiId, teamName: homeName,
    playerName: pickPlayer(homeSquad, 11), assistName: pickPlayer(homeSquad, 10),
    type: 'Goal', detail: 'Normal Goal', comments: null
  });

  return e;
}

// -- Estatísticas por cenário --
function buildStatistics(scenario, homeApiId, awayApiId) {
  if (scenario === 'pre' || scenario === 'injuries-heavy') return null;
  const factor = scenario === 'halftime' ? 0.5 : (scenario === 'live' ? 0.72 : 1.0);
  const r = (n) => Math.round(n * factor);

  return {
    [homeApiId]: {
      'Ball Possession': `${Math.round(56 * (factor < 1 ? 1 : 1))}%`,
      'Total Shots': r(14),
      'Shots on Goal': r(7),
      'Shots off Goal': r(5),
      'Blocked Shots': r(2),
      'Corner Kicks': r(6),
      'Offsides': r(2),
      'Goalkeeper Saves': r(3),
      'Total passes': r(520),
      'Passes accurate': r(460),
      'Passes %': '88%',
      'Fouls': r(8),
      'Yellow Cards': r(2),
      'Red Cards': 0
    },
    [awayApiId]: {
      'Ball Possession': '44%',
      'Total Shots': r(9),
      'Shots on Goal': r(4),
      'Shots off Goal': r(3),
      'Blocked Shots': r(2),
      'Corner Kicks': r(3),
      'Offsides': r(3),
      'Goalkeeper Saves': r(5),
      'Total passes': r(380),
      'Passes accurate': r(310),
      'Passes %': '82%',
      'Fouls': r(11),
      'Yellow Cards': r(3),
      'Red Cards': scenario === 'finished' ? 1 : 0
    }
  };
}

// -- Bloco players com ratings (formato API-Football) --
function buildPlayersBlock(scenario, homeApiId, awayApiId, homeName, awayName, homeSquad, awaySquad) {
  if (scenario === 'pre' || scenario === 'injuries-heavy' || scenario === 'halftime') return [];

  const ratingFor = (idx) => {
    const base = [9.1, 8.4, 8.1, 7.9, 7.6, 7.3, 7.0, 6.8, 6.6, 6.4, 6.5];
    return base[idx % base.length];
  };

  const block = (apiId, name, squad) => ({
    team: { id: apiId, name },
    players: squad.players.slice(0, 14).map((p, i) => ({
      player: { id: p.id, name: p.name, photo: '' },
      statistics: [{
        games: { rating: ratingFor(i).toFixed(2), minutes: 90, position: p.positionShort },
        goals: { total: i === 0 ? 1 : 0, assists: i === 1 ? 1 : 0 },
        passes: { total: 40 + (i * 3), accuracy: 80 + (i % 10) },
        shots: { total: i < 4 ? 3 : 1, on: i < 4 ? 2 : 0 }
      }]
    }))
  });

  return [block(homeApiId, homeName, homeSquad), block(awayApiId, awayName, awaySquad)];
}

// -- ENTRY POINT: matchData mock --
// `scenario` vem do caller (useMockStore().scenario)
export function mockMatchData(fixture, scenario) {
  if (!scenario) return null;

  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  const homeApiId = getTeamApiId(fixture.home) || 9001;
  const awayApiId = getTeamApiId(fixture.away) || 9002;

  const homeSquad = mockSquad(fixture.home);
  const awaySquad = mockSquad(fixture.away);

  const SCENARIO_STATUS = {
    pre: 'NS', 'injuries-heavy': 'NS',
    halftime: 'HT', live: '2H', finished: 'FT'
  };
  const SCENARIO_ELAPSED = { halftime: 45, live: 65, finished: 90 };
  const SCENARIO_SCORE = {
    halftime: { h: 1, a: 0 }, live: { h: 2, a: 1 }, finished: { h: 3, a: 1 }
  };
  const score = SCENARIO_SCORE[scenario] || { h: null, a: null };

  return {
    id: fixture.id,
    date: new Date().toISOString(),
    status: SCENARIO_STATUS[scenario],
    elapsed: SCENARIO_ELAPSED[scenario] || null,
    venue: getStadium(fixture.stadium)?.name || '—',
    referee: 'Esteban Ríos (CHI)',
    home: { id: homeApiId, name: home.name, logo: '' },
    away: { id: awayApiId, name: away.name, logo: '' },
    homeScore: score.h,
    awayScore: score.a,
    events: buildEvents(scenario, homeApiId, awayApiId, home.name, away.name, homeSquad, awaySquad),
    statistics: buildStatistics(scenario, homeApiId, awayApiId),
    lineups: [
      buildLineupForApi(homeSquad, homeApiId, 'home'),
      buildLineupForApi(awaySquad, awayApiId, 'away')
    ],
    players: buildPlayersBlock(scenario, homeApiId, awayApiId, home.name, away.name, homeSquad, awaySquad)
  };
}

// Provável XI mesmo em pré-jogo
export function mockProbableLineups(fixture) {
  const homeApiId = getTeamApiId(fixture.home) || 9001;
  const awayApiId = getTeamApiId(fixture.away) || 9002;
  return [
    buildLineupForApi(mockSquad(fixture.home), homeApiId, 'home'),
    buildLineupForApi(mockSquad(fixture.away), awayApiId, 'away')
  ];
}

// -- H2H (5 últimos confrontos) --
export function mockH2H(homeName, awayName) {
  const today = new Date();
  const past = (yearsAgo, month, day) => {
    const d = new Date(today.getFullYear() - yearsAgo, month, day);
    return d.toISOString();
  };
  return [
    { date: past(1, 5, 15), homeName, awayName, homeScore: 2, awayScore: 1, league: 'Amistoso' },
    { date: past(2, 8, 3),  homeName: awayName, awayName: homeName, homeScore: 0, awayScore: 0, league: 'Eliminatórias' },
    { date: past(3, 2, 22), homeName, awayName, homeScore: 1, awayScore: 3, league: 'Copa do Mundo' },
    { date: past(4, 10, 8), homeName: awayName, awayName: homeName, homeScore: 2, awayScore: 2, league: 'Amistoso' },
    { date: past(6, 6, 11), homeName, awayName, homeScore: 4, awayScore: 0, league: 'Copa América' }
  ];
}

// -- Forma recente (últimos 5 jogos) --
export function mockTeamForm(teamApiId, teamCode) {
  const seed = hash(teamCode || String(teamApiId));
  const results = ['W', 'W', 'D', 'L', 'W'];
  const offset = seed % 5;
  const rotated = [...results.slice(offset), ...results.slice(0, offset)];
  return rotated.map((res, i) => ({
    date: new Date(Date.now() - (5 - i) * 7 * 86400000).toISOString(),
    opponent: nameFor('OPP-' + teamCode, i),
    opponentLogo: '',
    gf: res === 'W' ? 2 : (res === 'D' ? 1 : 0),
    ga: res === 'L' ? 2 : (res === 'D' ? 1 : 0),
    result: res,
    home: i % 2 === 0,
    league: 'Amistoso'
  }));
}

// -- Desfalques (varia por cenário) --
export function mockInjuries(fixture, scenario) {
  if (!scenario) return [];
  const homeApiId = getTeamApiId(fixture.home) || 9001;
  const awayApiId = getTeamApiId(fixture.away) || 9002;
  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);

  if (scenario === 'injuries-heavy') {
    return [
      { teamId: homeApiId, teamName: home.name, playerName: nameFor(fixture.home, 4),  playerPos: 'D', type: 'Missing Fixture', reason: 'Knee Injury' },
      { teamId: homeApiId, teamName: home.name, playerName: nameFor(fixture.home, 6),  playerPos: 'M', type: 'Missing Fixture', reason: 'Suspended' },
      { teamId: homeApiId, teamName: home.name, playerName: nameFor(fixture.home, 11), playerPos: 'F', type: 'Questionable',    reason: 'Knock' },
      { teamId: awayApiId, teamName: away.name, playerName: nameFor(fixture.away, 2),  playerPos: 'D', type: 'Missing Fixture', reason: 'Hamstring' },
      { teamId: awayApiId, teamName: away.name, playerName: nameFor(fixture.away, 7),  playerPos: 'M', type: 'Missing Fixture', reason: 'Muscle Injury' },
      { teamId: awayApiId, teamName: away.name, playerName: nameFor(fixture.away, 10), playerPos: 'F', type: 'Questionable',    reason: 'Illness' }
    ];
  }

  return [
    { teamId: homeApiId, teamName: home.name, playerName: nameFor(fixture.home, 5), playerPos: 'D', type: 'Missing Fixture', reason: 'Suspended' },
    { teamId: awayApiId, teamName: away.name, playerName: nameFor(fixture.away, 8), playerPos: 'M', type: 'Questionable',    reason: 'Knock' }
  ];
}

// -- Clima --
export function mockWeather() {
  return {
    temperature: 24,
    windKmh: 12,
    precipProbability: 15,
    weatherCode: 1
  };
}

// -- Times fictícios para campeonatos externos --
const LEAGUE_TEAMS = {
  CL:  ['Real Madrid','Manchester City','Bayern','PSG','Inter','Liverpool','Barcelona','Arsenal','Atlético','Milan'],
  BSA: ['Palmeiras','Flamengo','Atlético-MG','Botafogo','Fluminense','São Paulo','Internacional','Grêmio','Corinthians','Bahia'],
  PL:  ['Manchester City','Arsenal','Liverpool','Tottenham','Manchester Utd','Newcastle','Chelsea','Aston Villa','Brighton','West Ham'],
  PD:  ['Real Madrid','Barcelona','Atlético Madrid','Real Sociedad','Athletic Club','Real Betis','Villarreal','Sevilla','Valencia','Girona'],
  SA:  ['Inter','Milan','Juventus','Napoli','Roma','Atalanta','Lazio','Fiorentina','Bologna','Torino']
};

function teamsFor(code) {
  return LEAGUE_TEAMS[code] || ['Time A','Time B','Time C','Time D','Time E','Time F','Time G','Time H','Time I','Time J'];
}

export function mockLeagueFixtures(league, { next = 10, last = 5, mode = 'next' } = {}) {
  const teams = teamsFor(league.code);
  const total = (mode === 'mixed' ? next + last : (mode === 'last' ? last : next));
  const out = [];
  for (let i = 0; i < total; i++) {
    const home = teams[i % teams.length];
    const away = teams[(i + 3) % teams.length];
    if (home === away) continue;
    const isPast = mode === 'last' || (mode === 'mixed' && i < last);
    const id = hash(`${league.code}-${i}`);
    const date = new Date(Date.now() + (isPast ? -1 : +1) * (i + 1) * 86400000);
    const sc = isPast ? { h: id % 4, a: (id >> 4) % 4 } : { h: null, a: null };
    out.push({
      id,
      date: date.toISOString(),
      timestamp: date.getTime(),
      status: isPast ? 'FT' : 'NS',
      round: `Rodada ${(i % 12) + 1}`,
      venue: '',
      city: '',
      home: { id: hash('h-' + home), name: home, logo: '' },
      away: { id: hash('a-' + away), name: away, logo: '' },
      homeScore: sc.h,
      awayScore: sc.a
    });
  }
  return out.sort((a, b) => a.timestamp - b.timestamp);
}

export function mockLeagueStandings(league) {
  const teams = teamsFor(league.code);
  return teams.map((name, i) => {
    const seed = hash(league.code + ':' + name);
    const played = 10 + (seed % 6);
    const won = Math.max(0, Math.round(played * (0.85 - i * 0.07)));
    const drawn = Math.min(played - won, (seed % 4));
    const lost = played - won - drawn;
    const gf = won * 2 + drawn;
    const ga = lost * 2 + drawn;
    return {
      rank: i + 1,
      team: { id: hash(name), name, logo: '' },
      played, won, drawn, lost,
      goalsFor: gf, goalsAgainst: ga, goalDiff: gf - ga,
      points: won * 3 + drawn,
      form: 'WDLWW'
    };
  });
}

export function mockLeagueTopScorers(league, { limit = 10 } = {}) {
  const teams = teamsFor(league.code);
  const out = [];
  for (let i = 0; i < limit; i++) {
    const team = teams[i % teams.length];
    out.push({
      player: {
        id: hash(`scorer-${league.code}-${i}`),
        name: nameFor(`SCORER-${league.code}`, i),
        photo: '',
        nationality: '—',
        position: 'Attacker'
      },
      team: { id: hash(team), name: team, logo: '' },
      goals: 18 - i,
      assists: Math.max(0, 8 - Math.floor(i / 2)),
      penalties: Math.max(0, 4 - i)
    });
  }
  return out;
}

// -- Detalhes de jogador --
export function mockPlayerDetails(playerId) {
  const seed = Math.abs(Number(playerId) || 1);
  const teamCode = ['BRA','FRA','ARG','ENG','GER'][seed % 5];
  const name = nameFor('P-' + playerId, seed);
  return {
    id: playerId,
    name,
    firstname: name.split(' ')[0],
    lastname: name.split(' ').slice(-1)[0],
    age: 22 + (seed % 14),
    birthDate: '2000-01-01',
    birthPlace: '—',
    nationality: getTeam(teamCode)?.name || '—',
    height: `${175 + (seed % 20)} cm`,
    weight: `${68 + (seed % 18)} kg`,
    photo: '',
    teamCode,
    position: ['Goalkeeper','Defender','Midfielder','Attacker'][seed % 4],
    seasonStats: {
      games: 28 + (seed % 8),
      minutes: 2400 + (seed % 200),
      goals: seed % 18,
      assists: seed % 12,
      yellowCards: seed % 6,
      redCards: seed % 2,
      rating: (6.5 + ((seed % 25) / 10)).toFixed(2)
    },
    recentMatches: Array.from({ length: 5 }).map((_, i) => ({
      date: new Date(Date.now() - (i + 1) * 7 * 86400000).toISOString(),
      opponent: nameFor('OPP-' + playerId, i),
      minutes: 90,
      goals: i === 0 ? 1 : 0,
      assists: i === 1 ? 1 : 0,
      rating: (6.8 + ((seed + i) % 20) / 10).toFixed(2)
    }))
  };
}
