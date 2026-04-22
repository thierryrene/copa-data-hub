// Modo demo: sobrescreve todas as fontes de dados com mocks plausíveis para
// inspecionar a UI em diferentes estados sem depender da API-Football.
//
// Ativação:
//   ?mock=pre              — pré-jogo, kickoff em ~2 dias
//   ?mock=halftime         — intervalo (1x0)
//   ?mock=live             — 2º tempo, 65min, 2x1
//   ?mock=finished         — encerrado 3x1
//   ?mock=injuries-heavy   — pré-jogo com muitos desfalques
//   ?mock=off              — desativa
//
// Persiste em sessionStorage para sobreviver à navegação interna.

const STORAGE_KEY = 'cdh_mock_scenario';

export const SCENARIOS = ['pre', 'halftime', 'live', 'finished', 'injuries-heavy'];

export const SCENARIO_LABEL = {
  pre: 'Pré-jogo',
  halftime: 'Intervalo',
  live: 'Ao vivo (65\')',
  finished: 'Encerrado',
  'injuries-heavy': 'Pré-jogo c/ desfalques'
};

function readQueryScenario() {
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('mock');
    if (!v) return undefined;
    if (v === 'off') return null;
    if (SCENARIOS.includes(v)) return v;
    return undefined;
  } catch (_e) { return undefined; }
}

// Inicializa: se houver query param, persiste/limpa em sessionStorage.
function syncFromQuery() {
  const fromQuery = readQueryScenario();
  if (fromQuery === undefined) return;
  if (fromQuery === null) sessionStorage.removeItem(STORAGE_KEY);
  else sessionStorage.setItem(STORAGE_KEY, fromQuery);
}

export function getMockScenario() {
  syncFromQuery();
  try { return sessionStorage.getItem(STORAGE_KEY) || null; }
  catch { return null; }
}

export function isMockActive() {
  return getMockScenario() !== null;
}

export function setMockScenario(scenario) {
  if (!scenario || scenario === 'off') {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  if (SCENARIOS.includes(scenario)) {
    sessionStorage.setItem(STORAGE_KEY, scenario);
  }
}

// Mapeia cenário → status + delta de tempo (em ms relativos a agora) +
// scores artificiais. Usado para mutar o fixture antes de chamar matchPhase.
const SCENARIO_STATE = {
  pre:               { status: 'NS', kickoffOffsetMs:  +2 * 86400000, homeScore: null, awayScore: null },
  'injuries-heavy':  { status: 'NS', kickoffOffsetMs:  +1 * 86400000, homeScore: null, awayScore: null },
  halftime:          { status: 'HT', kickoffOffsetMs: -45 * 60000,    homeScore: 1,    awayScore: 0    },
  live:              { status: '2H', kickoffOffsetMs: -65 * 60000,    homeScore: 2,    awayScore: 1    },
  finished:          { status: 'FT', kickoffOffsetMs: -3 * 86400000,  homeScore: 3,    awayScore: 1    }
};

// Sobrescreve o fixture conforme o cenário. Retorna NOVO objeto (não muta).
export function applyMockToFixture(fixture) {
  const s = getMockScenario();
  if (!s || !SCENARIO_STATE[s]) return fixture;
  const cfg = SCENARIO_STATE[s];
  const target = new Date(Date.now() + cfg.kickoffOffsetMs);
  const date = target.toISOString().slice(0, 10);
  const time = target.toISOString().slice(11, 16);
  return {
    ...fixture,
    status: cfg.status,
    homeScore: cfg.homeScore,
    awayScore: cfg.awayScore,
    date,
    time
  };
}

// Hash determinístico para gerar placar plausível por id de partida.
function hashId(id) {
  let h = 5381;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function distributedScore(id) {
  const h = hashId(id);
  return { homeScore: h % 4, awayScore: (h >> 4) % 4 };
}

// Distribui uma lista de fixtures para parecer uma Copa em andamento:
// • Primeiros ~50% (ordenados por kickoff) viram FT com placar plausível.
// • Próximos 4 viram 2H/HT (ao vivo).
// • Restantes ficam NS (futuros).
// Aplicado APENAS quando há mock ativo.
export function applyMockToFixtures(fixtures) {
  const s = getMockScenario();
  if (!s || !Array.isArray(fixtures) || !fixtures.length) return fixtures;

  const sorted = [...fixtures].sort((a, b) =>
    new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
  );

  const total = sorted.length;
  const finishedCount = Math.floor(total * 0.5);
  const liveCount = Math.min(4, total - finishedCount);

  const idToState = new Map();
  sorted.forEach((f, i) => {
    if (i < finishedCount) {
      const sc = distributedScore(f.id);
      idToState.set(f.id, { status: 'FT', ...sc });
    } else if (i < finishedCount + liveCount) {
      const sc = distributedScore(f.id);
      const liveStatus = (i % 2 === 0) ? '2H' : 'HT';
      idToState.set(f.id, { status: liveStatus, ...sc });
    } else {
      idToState.set(f.id, { status: 'NS', homeScore: null, awayScore: null });
    }
  });

  return fixtures.map(f => {
    const st = idToState.get(f.id);
    if (!st) return f;
    return { ...f, ...st };
  });
}
