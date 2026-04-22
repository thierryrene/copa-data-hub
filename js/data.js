// CopaDataHub 2026 — Tournament Data Module
// All 48 teams, 12 groups, 16 stadiums, and fixture schedule

import { slugify } from './util/slug.js';

export const TOURNAMENT = {
  name: "Campeonato Mundial de Seleções 2026",
  startDate: "2026-06-11",
  endDate: "2026-07-19",
  totalTeams: 48,
  totalMatches: 104,
  hostCountries: ["EUA", "Canadá", "México"]
};

// Team database with emoji flags
export const TEAMS = {
  // ── Pot 1 (Hosts + Top Seeds) ──
  USA: { name: "Estados Unidos", flag: "🇺🇸", code: "USA", confederation: "CONCACAF", ranking: 11 },
  CAN: { name: "Canadá", flag: "🇨🇦", code: "CAN", confederation: "CONCACAF", ranking: 43 },
  MEX: { name: "México", flag: "🇲🇽", code: "MEX", confederation: "CONCACAF", ranking: 15 },
  ARG: { name: "Argentina", flag: "🇦🇷", code: "ARG", confederation: "CONMEBOL", ranking: 1 },
  FRA: { name: "França", flag: "🇫🇷", code: "FRA", confederation: "UEFA", ranking: 2 },
  ENG: { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "ENG", confederation: "UEFA", ranking: 3 },
  ESP: { name: "Espanha", flag: "🇪🇸", code: "ESP", confederation: "UEFA", ranking: 4 },
  BRA: { name: "Brasil", flag: "🇧🇷", code: "BRA", confederation: "CONMEBOL", ranking: 5 },
  POR: { name: "Portugal", flag: "🇵🇹", code: "POR", confederation: "UEFA", ranking: 6 },
  GER: { name: "Alemanha", flag: "🇩🇪", code: "GER", confederation: "UEFA", ranking: 7 },
  NED: { name: "Holanda", flag: "🇳🇱", code: "NED", confederation: "UEFA", ranking: 8 },
  BEL: { name: "Bélgica", flag: "🇧🇪", code: "BEL", confederation: "UEFA", ranking: 9 },

  // ── Pot 2 ──
  ITA: { name: "Itália", flag: "🇮🇹", code: "ITA", confederation: "UEFA", ranking: 10 },
  CRO: { name: "Croácia", flag: "🇭🇷", code: "CRO", confederation: "UEFA", ranking: 12 },
  COL: { name: "Colômbia", flag: "🇨🇴", code: "COL", confederation: "CONMEBOL", ranking: 13 },
  MAR: { name: "Marrocos", flag: "🇲🇦", code: "MAR", confederation: "CAF", ranking: 14 },
  URU: { name: "Uruguai", flag: "🇺🇾", code: "URU", confederation: "CONMEBOL", ranking: 16 },
  JPN: { name: "Japão", flag: "🇯🇵", code: "JPN", confederation: "AFC", ranking: 17 },
  SUI: { name: "Suíça", flag: "🇨🇭", code: "SUI", confederation: "UEFA", ranking: 18 },
  DEN: { name: "Dinamarca", flag: "🇩🇰", code: "DEN", confederation: "UEFA", ranking: 19 },
  AUT: { name: "Áustria", flag: "🇦🇹", code: "AUT", confederation: "UEFA", ranking: 20 },
  SEN: { name: "Senegal", flag: "🇸🇳", code: "SEN", confederation: "CAF", ranking: 21 },
  KOR: { name: "Coreia do Sul", flag: "🇰🇷", code: "KOR", confederation: "AFC", ranking: 22 },
  AUS: { name: "Austrália", flag: "🇦🇺", code: "AUS", confederation: "AFC", ranking: 23 },

  // ── Pot 3 ──
  UKR: { name: "Ucrânia", flag: "🇺🇦", code: "UKR", confederation: "UEFA", ranking: 24 },
  TUR: { name: "Turquia", flag: "🇹🇷", code: "TUR", confederation: "UEFA", ranking: 25 },
  IRN: { name: "Irã", flag: "🇮🇷", code: "IRN", confederation: "AFC", ranking: 26 },
  SRB: { name: "Sérvia", flag: "🇷🇸", code: "SRB", confederation: "UEFA", ranking: 27 },
  POL: { name: "Polônia", flag: "🇵🇱", code: "POL", confederation: "UEFA", ranking: 28 },
  SCO: { name: "Escócia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", code: "SCO", confederation: "UEFA", ranking: 29 },
  ECU: { name: "Equador", flag: "🇪🇨", code: "ECU", confederation: "CONMEBOL", ranking: 30 },
  NGA: { name: "Nigéria", flag: "🇳🇬", code: "NGA", confederation: "CAF", ranking: 31 },
  PAR: { name: "Paraguai", flag: "🇵🇾", code: "PAR", confederation: "CONMEBOL", ranking: 32 },
  EGY: { name: "Egito", flag: "🇪🇬", code: "EGY", confederation: "CAF", ranking: 33 },
  CMR: { name: "Camarões", flag: "🇨🇲", code: "CMR", confederation: "CAF", ranking: 34 },
  CRC: { name: "Costa Rica", flag: "🇨🇷", code: "CRC", confederation: "CONCACAF", ranking: 35 },

  // ── Pot 4 ──
  GHA: { name: "Gana", flag: "🇬🇭", code: "GHA", confederation: "CAF", ranking: 36 },
  TUN: { name: "Tunísia", flag: "🇹🇳", code: "TUN", confederation: "CAF", ranking: 37 },
  SAU: { name: "Arábia Saudita", flag: "🇸🇦", code: "SAU", confederation: "AFC", ranking: 38 },
  JAM: { name: "Jamaica", flag: "🇯🇲", code: "JAM", confederation: "CONCACAF", ranking: 39 },
  QAT: { name: "Catar", flag: "🇶🇦", code: "QAT", confederation: "AFC", ranking: 40 },
  PER: { name: "Peru", flag: "🇵🇪", code: "PER", confederation: "CONMEBOL", ranking: 41 },
  CHL: { name: "Chile", flag: "🇨🇱", code: "CHL", confederation: "CONMEBOL", ranking: 42 },
  BOL: { name: "Bolívia", flag: "🇧🇴", code: "BOL", confederation: "CONMEBOL", ranking: 44 },
  ALG: { name: "Argélia", flag: "🇩🇿", code: "ALG", confederation: "CAF", ranking: 45 },
  CIV: { name: "Costa do Marfim", flag: "🇨🇮", code: "CIV", confederation: "CAF", ranking: 46 },
  NZL: { name: "Nova Zelândia", flag: "🇳🇿", code: "NZL", confederation: "OFC", ranking: 47 },
  HON: { name: "Honduras", flag: "🇭🇳", code: "HON", confederation: "CONCACAF", ranking: 48 }
};

// Popular slug em cada seleção + índice reverso slug → code
const SLUG_TO_CODE = {};
for (const [code, team] of Object.entries(TEAMS)) {
  team.slug = slugify(team.name);
  SLUG_TO_CODE[team.slug] = code;
}

// 12 Groups of 4 teams
export const GROUPS = {
  A: { teams: ["USA", "SEN", "TUR", "NZL"] },
  B: { teams: ["CAN", "ITA", "ECU", "TUN"] },
  C: { teams: ["MEX", "MAR", "SRB", "JAM"] },
  D: { teams: ["ARG", "JPN", "NGA", "CHL"] },
  E: { teams: ["FRA", "COL", "UKR", "SAU"] },
  F: { teams: ["ENG", "URU", "POL", "GHA"] },
  G: { teams: ["ESP", "AUS", "EGY", "HON"] },
  H: { teams: ["BRA", "DEN", "CMR", "QAT"] },
  I: { teams: ["POR", "KOR", "IRN", "BOL"] },
  J: { teams: ["GER", "CRO", "SCO", "CIV"] },
  K: { teams: ["NED", "SUI", "PAR", "ALG"] },
  L: { teams: ["BEL", "AUT", "CRC", "PER"] }
};

// 16 Stadiums across 3 countries — coordenadas verificadas em latlong.net (Apr/2026).
export const STADIUMS = [
  { id: "met", name: "MetLife Stadium", city: "East Rutherford, NJ", country: "EUA", capacity: 82500, lat: 40.813477, lng: -74.074951, timezone: "EST", isFinal: true },
  { id: "att", name: "AT&T Stadium", city: "Arlington, TX", country: "EUA", capacity: 80000, lat: 32.748138, lng: -97.093231, timezone: "CST", isFinal: false },
  { id: "har", name: "Hard Rock Stadium", city: "Miami, FL", country: "EUA", capacity: 65326, lat: 25.957830, lng: -80.239326, timezone: "EST", isFinal: false },
  { id: "sof", name: "SoFi Stadium", city: "Los Angeles, CA", country: "EUA", capacity: 70240, lat: 33.953438, lng: -118.339447, timezone: "PST", isFinal: false },
  { id: "lum", name: "Lumen Field", city: "Seattle, WA", country: "EUA", capacity: 69000, lat: 47.595135, lng: -122.331917, timezone: "PST", isFinal: false },
  { id: "gil", name: "Gillette Stadium", city: "Foxborough, MA", country: "EUA", capacity: 65878, lat: 42.090790, lng: -71.264404, timezone: "EST", isFinal: false },
  { id: "nrg", name: "NRG Stadium", city: "Houston, TX", country: "EUA", capacity: 72220, lat: 29.684702, lng: -95.410965, timezone: "CST", isFinal: false },
  { id: "mer", name: "Mercedes-Benz Stadium", city: "Atlanta, GA", country: "EUA", capacity: 71000, lat: 33.755371, lng: -84.401436, timezone: "EST", isFinal: false },
  { id: "lin", name: "Lincoln Financial Field", city: "Filadélfia, PA", country: "EUA", capacity: 69796, lat: 39.901325, lng: -75.167862, timezone: "EST", isFinal: false },
  { id: "arr", name: "Arrowhead Stadium", city: "Kansas City, MO", country: "EUA", capacity: 76416, lat: 39.048855, lng: -94.484474, timezone: "CST", isFinal: false },
  { id: "lev", name: "Levi's Stadium", city: "Santa Clara, CA", country: "EUA", capacity: 68500, lat: 37.403297, lng: -121.969765, timezone: "PST", isFinal: false },
  { id: "azt", name: "Estadio Azteca", city: "Cidade do México", country: "México", capacity: 87523, lat: 19.302837, lng: -99.150803, timezone: "CST", isFinal: false },
  { id: "bbv", name: "Estadio BBVA", city: "Monterrey", country: "México", capacity: 53500, lat: 25.669132, lng: -100.244621, timezone: "CST", isFinal: false },
  { id: "akr", name: "Estadio Akron", city: "Guadalajara", country: "México", capacity: 49850, lat: 20.681721, lng: -103.463135, timezone: "CST", isFinal: false },
  { id: "bmo", name: "BMO Field", city: "Toronto", country: "Canadá", capacity: 45736, lat: 43.633087, lng: -79.418961, timezone: "EST", isFinal: false },
  { id: "bcp", name: "BC Place", city: "Vancouver", country: "Canadá", capacity: 54500, lat: 49.276646, lng: -123.112564, timezone: "PST", isFinal: false }
];

// Group stage fixtures (sample — first round of all groups)
export const FIXTURES = [
  // ── Matchday 1 ──
  { id: "m01", group: "A", home: "USA", away: "NZL", date: "2026-06-11", time: "20:00", stadium: "met", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m02", group: "A", home: "SEN", away: "TUR", date: "2026-06-11", time: "17:00", stadium: "lin", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m03", group: "B", home: "CAN", away: "TUN", date: "2026-06-12", time: "13:00", stadium: "bmo", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m04", group: "B", home: "ITA", away: "ECU", date: "2026-06-12", time: "16:00", stadium: "har", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m05", group: "C", home: "MEX", away: "JAM", date: "2026-06-12", time: "19:00", stadium: "azt", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m06", group: "C", home: "MAR", away: "SRB", date: "2026-06-12", time: "22:00", stadium: "nrg", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m07", group: "D", home: "ARG", away: "CHL", date: "2026-06-13", time: "13:00", stadium: "har", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m08", group: "D", home: "JPN", away: "NGA", date: "2026-06-13", time: "16:00", stadium: "att", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m09", group: "E", home: "FRA", away: "SAU", date: "2026-06-13", time: "19:00", stadium: "sof", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m10", group: "E", home: "COL", away: "UKR", date: "2026-06-13", time: "22:00", stadium: "mer", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m11", group: "F", home: "ENG", away: "GHA", date: "2026-06-14", time: "13:00", stadium: "lum", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m12", group: "F", home: "URU", away: "POL", date: "2026-06-14", time: "16:00", stadium: "arr", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m13", group: "G", home: "ESP", away: "HON", date: "2026-06-14", time: "19:00", stadium: "att", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m14", group: "G", home: "AUS", away: "EGY", date: "2026-06-14", time: "22:00", stadium: "lev", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m15", group: "H", home: "BRA", away: "QAT", date: "2026-06-15", time: "16:00", stadium: "sof", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m16", group: "H", home: "DEN", away: "CMR", date: "2026-06-15", time: "13:00", stadium: "bcp", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m17", group: "I", home: "POR", away: "BOL", date: "2026-06-15", time: "19:00", stadium: "met", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m18", group: "I", home: "KOR", away: "IRN", date: "2026-06-15", time: "22:00", stadium: "nrg", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m19", group: "J", home: "GER", away: "CIV", date: "2026-06-16", time: "13:00", stadium: "mer", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m20", group: "J", home: "CRO", away: "SCO", date: "2026-06-16", time: "16:00", stadium: "gil", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m21", group: "K", home: "NED", away: "ALG", date: "2026-06-16", time: "19:00", stadium: "lin", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m22", group: "K", home: "SUI", away: "PAR", date: "2026-06-16", time: "22:00", stadium: "bbv", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m23", group: "L", home: "BEL", away: "PER", date: "2026-06-17", time: "13:00", stadium: "arr", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m24", group: "L", home: "AUT", away: "CRC", date: "2026-06-17", time: "16:00", stadium: "akr", status: "SCHEDULED", homeScore: null, awayScore: null },

  // ── Matchday 2 (sample) ──
  { id: "m25", group: "A", home: "USA", away: "SEN", date: "2026-06-16", time: "19:00", stadium: "met", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m26", group: "A", home: "TUR", away: "NZL", date: "2026-06-16", time: "16:00", stadium: "att", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m27", group: "D", home: "ARG", away: "JPN", date: "2026-06-18", time: "19:00", stadium: "har", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "m28", group: "H", home: "BRA", away: "DEN", date: "2026-06-20", time: "19:00", stadium: "att", status: "SCHEDULED", homeScore: null, awayScore: null }
];

// Trivia questions for FanZone
export const TRIVIA = [
  { id: 1, question: "Qual país venceu a primeira edição do torneio mundial em 1930?", options: ["Argentina", "Uruguai", "Brasil", "Itália"], answer: 1 },
  { id: 2, question: "Quem é o maior artilheiro da história dos mundiais?", options: ["Pelé", "Ronaldo", "Miroslav Klose", "Just Fontaine"], answer: 2 },
  { id: 3, question: "Quantos times participam do formato 2026?", options: ["32", "40", "48", "64"], answer: 2 },
  { id: 4, question: "Em que ano o Brasil venceu seu último título mundial?", options: ["1998", "2002", "2006", "2010"], answer: 1 },
  { id: 5, question: "Qual é o estádio da final em 2026?", options: ["SoFi Stadium", "Estadio Azteca", "MetLife Stadium", "Hard Rock Stadium"], answer: 2 },
  { id: 6, question: "Quantos países sediam o torneio de 2026?", options: ["1", "2", "3", "4"], answer: 2 },
  { id: 7, question: "Qual seleção detém o recorde de títulos mundiais?", options: ["Alemanha", "Itália", "Argentina", "Brasil"], answer: 3 },
  { id: 8, question: "Quantos jogos terá o torneio de 2026?", options: ["64", "80", "104", "128"], answer: 2 },
  { id: 9, question: "Qual jogador marcou o 'Gol do Século' em 1986?", options: ["Pelé", "Zidane", "Maradona", "Ronaldo"], answer: 2 },
  { id: 10, question: "Quantos grupos existem no formato de 48 times?", options: ["8", "10", "12", "16"], answer: 2 },
  { id: 11, question: "Qual país foi anfitrião e campeão em 1998?", options: ["Alemanha", "Brasil", "França", "Japão"], answer: 2 },
  { id: 12, question: "Qual é o xG (Expected Goals) de uma cobrança de pênalti?", options: ["0.56", "0.76", "0.82", "1.00"], answer: 1 }
];

// Mapeamento código interno → ID da API-Football (api-sports.io v3).
// IDs oficiais de seleções nacionais. Fonte: /teams?league=1&season=2026
export const TEAM_API_IDS = {
  USA: 2384, CAN: 5529, MEX: 16, ARG: 26, FRA: 2, ENG: 10, ESP: 9,
  BRA: 6, POR: 27, GER: 25, NED: 1118, BEL: 1, ITA: 768, CRO: 3,
  COL: 1573, MAR: 31, URU: 7, JPN: 12, SUI: 15, DEN: 21, AUT: 4,
  SEN: 28, KOR: 17, AUS: 20, UKR: 44, TUR: 135, IRN: 22, SRB: 14,
  POL: 24, SCO: 1108, ECU: 2382, NGA: 33, PAR: 29, EGY: 30, CMR: 1530,
  CRC: 2383, GHA: 32, TUN: 34, SAU: 23, JAM: 2395, QAT: 1569, PER: 2381,
  CHL: 2397, BOL: 2380, ALG: 1532, CIV: 5765, NZL: 1572, HON: 2385
};

// Formação tática padrão por seleção (estimativa até escalação oficial).
// Formato: array de linhas de trás pra frente (GK implícito).
export const TEAM_FORMATIONS = {
  USA: '4-3-3', CAN: '4-4-2', MEX: '4-3-3', ARG: '4-3-3', FRA: '4-3-3',
  ENG: '4-2-3-1', ESP: '4-3-3', BRA: '4-3-3', POR: '4-3-3', GER: '4-2-3-1',
  NED: '4-3-3', BEL: '4-3-3', ITA: '3-5-2', CRO: '4-3-3', COL: '4-3-3',
  MAR: '4-3-3', URU: '4-4-2', JPN: '4-2-3-1', SUI: '3-4-2-1', DEN: '3-4-3',
  AUT: '4-2-3-1', SEN: '4-3-3', KOR: '4-2-3-1', AUS: '4-4-2', UKR: '4-3-3',
  TUR: '4-2-3-1', IRN: '4-4-2', SRB: '3-4-2-1', POL: '3-5-2', SCO: '3-5-2',
  ECU: '4-3-3', NGA: '4-3-3', PAR: '4-4-2', EGY: '4-3-3', CMR: '4-3-3',
  CRC: '4-4-2', GHA: '4-2-3-1', TUN: '4-3-3', SAU: '4-3-3', JAM: '4-3-3',
  QAT: '3-5-2', PER: '4-3-3', CHL: '4-3-3', BOL: '3-5-2', ALG: '4-3-3',
  CIV: '4-3-3', NZL: '4-4-2', HON: '4-4-2'
};

export function getTeamApiId(code) {
  return TEAM_API_IDS[code] || null;
}

export function getTeamFormation(code) {
  return TEAM_FORMATIONS[code] || '4-4-2';
}

/**
 * Get team info by code
 */
export function getTeam(code) {
  return TEAMS[code] || null;
}

/**
 * Resolve team by its URL slug (e.g. "brasil" → TEAMS.BRA).
 */
export function getTeamBySlug(slug) {
  const code = SLUG_TO_CODE[slug];
  return code ? TEAMS[code] : null;
}

export function slugToCode(slug) {
  return SLUG_TO_CODE[slug] || null;
}

/**
 * Get upcoming fixtures (next N)
 */
export function getUpcomingFixtures(n = 4) {
  const now = new Date();
  return FIXTURES
    .filter(f => new Date(`${f.date}T${f.time}`) >= now || f.status === 'SCHEDULED')
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .slice(0, n);
}

/**
 * Get fixtures by group
 */
export function getFixturesByGroup(groupId) {
  return FIXTURES.filter(f => f.group === groupId);
}

/**
 * Slug semântico de uma partida: "brasil-vs-franca-2026-06-20"
 */
export function getMatchSlug(fixture) {
  const home = TEAMS[fixture.home];
  const away = TEAMS[fixture.away];
  if (!home || !away) return fixture.id;
  return `${home.slug}-vs-${away.slug}-${fixture.date}`;
}

/**
 * Get fixtures for a given team (as home or away), ordered by date.
 */
export function getTeamFixtures(teamCode) {
  return FIXTURES
    .filter(f => f.home === teamCode || f.away === teamCode)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
}

/**
 * Find the group containing a given team.
 */
export function getGroupForTeam(teamCode) {
  for (const [id, group] of Object.entries(GROUPS)) {
    if (group.teams.includes(teamCode)) return { id, teams: group.teams };
  }
  return null;
}

/**
 * Get stadium info by id
 */
export function getStadium(id) {
  return STADIUMS.find(s => s.id === id) || null;
}

/**
 * Get fixtures for "today" (or next available matchday for demo)
 */
export function getTodayFixtures() {
  // For the MVP, return the first matchday fixtures
  return FIXTURES.filter(f => f.date === '2026-06-11' || f.date === '2026-06-12').slice(0, 6);
}
