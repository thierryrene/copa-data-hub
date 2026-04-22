// Pinia store: modo demo. Sobrescreve fixtures com cenários plausíveis
// (pre/halftime/live/finished/injuries-heavy) para inspecionar a UI sem API.
// Persiste em sessionStorage `cdh_mock_scenario`. Query `?mock=...` sobrescreve.

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

const STORAGE_KEY = 'cdh_mock_scenario';

export const SCENARIOS = ['pre', 'halftime', 'live', 'finished', 'injuries-heavy'];

export const SCENARIO_LABEL = {
  pre: 'Pré-jogo',
  halftime: 'Intervalo',
  live: 'Ao vivo (65\')',
  finished: 'Encerrado',
  'injuries-heavy': 'Pré-jogo c/ desfalques'
};

// Mapeia cenário → mutação a aplicar num fixture único.
const SCENARIO_STATE = {
  pre:               { status: 'NS', kickoffOffsetMs:  +2 * 86400000, homeScore: null, awayScore: null },
  'injuries-heavy':  { status: 'NS', kickoffOffsetMs:  +1 * 86400000, homeScore: null, awayScore: null },
  halftime:          { status: 'HT', kickoffOffsetMs: -45 * 60000,    homeScore: 1,    awayScore: 0    },
  live:              { status: '2H', kickoffOffsetMs: -65 * 60000,    homeScore: 2,    awayScore: 1    },
  finished:          { status: 'FT', kickoffOffsetMs: -3 * 86400000,  homeScore: 3,    awayScore: 1    }
};

// --- Helpers puros (exportados livres, não são actions) -----------------

export function applyMockToFixture(fixture, scenario) {
  if (!scenario || !SCENARIO_STATE[scenario]) return fixture;
  const cfg = SCENARIO_STATE[scenario];
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

// Distribui uma lista: ~50% FT com placar, 4 ao vivo, restante NS.
export function applyMockToFixtures(fixtures, scenario) {
  if (!scenario || !Array.isArray(fixtures) || !fixtures.length) return fixtures;

  const sorted = [...fixtures].sort((a, b) =>
    new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
  );

  const total = sorted.length;
  const finishedCount = Math.floor(total * 0.5);
  const liveCount = Math.min(4, total - finishedCount);

  const idToState = new Map();
  sorted.forEach((f, i) => {
    if (i < finishedCount) {
      idToState.set(f.id, { status: 'FT', ...distributedScore(f.id) });
    } else if (i < finishedCount + liveCount) {
      const liveStatus = (i % 2 === 0) ? '2H' : 'HT';
      idToState.set(f.id, { status: liveStatus, ...distributedScore(f.id) });
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

// --- Store ------------------------------------------------------------

function readQueryScenario() {
  if (!import.meta.client) return undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('mock');
    if (!v) return undefined;
    if (v === 'off') return null;
    if (SCENARIOS.includes(v)) return v;
    return undefined;
  } catch { return undefined; }
}

function readSession() {
  if (!import.meta.client) return null;
  try { return sessionStorage.getItem(STORAGE_KEY) || null; }
  catch { return null; }
}

export const useMockStore = defineStore('mock', () => {
  const scenario = ref(null);

  const isActive = computed(() => scenario.value !== null);

  function setScenario(v) {
    if (!v || v === 'off') {
      scenario.value = null;
      return;
    }
    if (SCENARIOS.includes(v)) scenario.value = v;
  }

  // Lê query (sobrescreve) e/ou sessionStorage. Chame em um plugin client-only
  // ou no onMounted de app.vue.
  function boot() {
    if (!import.meta.client) return;
    const fromQuery = readQueryScenario();
    if (fromQuery === undefined) {
      scenario.value = readSession();
    } else {
      scenario.value = fromQuery; // null para ?mock=off
    }
  }

  if (import.meta.client) {
    watch(scenario, (val) => {
      try {
        if (val) sessionStorage.setItem(STORAGE_KEY, val);
        else sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) { console.warn('[mock store] save falhou:', e); }
    });
  }

  return {
    scenario,
    isActive,
    setScenario,
    boot,
    SCENARIOS,
    SCENARIO_LABEL
  };
});
