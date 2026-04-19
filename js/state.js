// CopaDataHub 2026 — State Management (LocalStorage)
//
// VERSIONAMENTO: ao mudar qualquer valor default em settings (ex: apiKey, provider),
// incremente STATE_VERSION e adicione uma função em MIGRATIONS para corrigir o estado
// salvo. Isso garante que usuários com localStorage antigo recebam a atualização
// automaticamente, sem perder dados de usuário (XP, palpites, streak).

const STORAGE_KEY = 'copadatahub_state';
const STATE_VERSION = 2;

const DEFAULT_STATE = {
  _version: STATE_VERSION,
  user: {
    id: null,
    name: '',
    xp: 0,
    level: 1,
    streak: 0,
    lastVisit: null,
    favoriteTeam: null,
    favoriteTeamChanged: false,
    predictions: [],
    triviaAnswered: [],
    badges: [],
    onboarded: false
  },
  settings: {
    notifications: true,
    installDismissed: false,
    apiKey: '63dac64042df41209e99b787a87da1b4'
  }
};

// Cada entrada recebe o state e retorna o state migrado.
// Índice 0 = migração da v1 para v2, índice 1 = v2 para v3, etc.
const MIGRATIONS = [
  // v1 → v2: troca chave api-sports pela chave football-data.org
  (state) => {
    state.settings.apiKey = DEFAULT_STATE.settings.apiKey;
    return state;
  }
];

// XP thresholds per level
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

function runMigrations(state) {
  const savedVersion = state._version || 1;
  if (savedVersion >= STATE_VERSION) return state;
  let s = state;
  for (let v = savedVersion; v < STATE_VERSION; v++) {
    if (MIGRATIONS[v - 1]) s = MIGRATIONS[v - 1](s);
  }
  s._version = STATE_VERSION;
  return s;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const savedVersion = saved._version || 1;
      // Migra antes do merge para que os valores corretos vençam o deepMerge
      const migrated = savedVersion < STATE_VERSION ? runMigrations(saved) : saved;
      const state = deepMerge(DEFAULT_STATE, migrated);
      state._version = STATE_VERSION;
      if (savedVersion < STATE_VERSION) saveState(state);
      return state;
    }
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
  return structuredClone(DEFAULT_STATE);
}

/**
 * Save state to localStorage
 */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

/**
 * Add XP and recalculate level. Returns { newXp, newLevel, leveledUp }
 */
export function addXP(state, amount) {
  const oldLevel = state.user.level;
  state.user.xp += amount;

  // Calculate new level
  let newLevel = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (state.user.xp >= LEVEL_THRESHOLDS[i]) {
      newLevel = i + 1;
      break;
    }
  }

  state.user.level = newLevel;
  saveState(state);

  return {
    newXp: state.user.xp,
    newLevel,
    leveledUp: newLevel > oldLevel
  };
}

/**
 * Get XP progress info for current level
 */
export function getXPProgress(state) {
  const level = state.user.level;
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 1.5;
  const xpInLevel = state.user.xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  return { level, xp: state.user.xp, percent, xpInLevel, xpNeeded, nextThreshold };
}

/**
 * Save a prediction (confidence: 1=normal, 2=1.5×XP, 3=2×XP)
 */
export function savePrediction(state, fixtureId, homeScore, awayScore, confidence = 1) {
  const existing = state.user.predictions.findIndex(p => p.fixtureId === fixtureId);
  const safeConf = Math.max(1, Math.min(3, Math.round(confidence)));
  const pred = { fixtureId, homeScore, awayScore, confidence: safeConf, timestamp: Date.now() };

  if (existing >= 0) {
    state.user.predictions[existing] = pred;
  } else {
    state.user.predictions.push(pred);
  }

  saveState(state);
}

/**
 * Record a trivia answer
 */
export function recordTrivia(state, questionId, wasCorrect) {
  if (!state.user.triviaAnswered.includes(questionId)) {
    state.user.triviaAnswered.push(questionId);
    saveState(state);
  }
  return !state.user.triviaAnswered.includes(questionId);
}

/**
 * Change favorite team. Rewards +10 XP once (first change after onboarding).
 * Returns { changed, xpAwarded, leveledUp, newLevel }.
 */
export function setFavoriteTeam(state, teamCode) {
  if (!teamCode || state.user.favoriteTeam === teamCode) {
    return { changed: false, xpAwarded: 0, leveledUp: false, newLevel: state.user.level };
  }

  const wasFirstChange = !state.user.favoriteTeamChanged;
  state.user.favoriteTeam = teamCode;
  state.user.favoriteTeamChanged = true;
  saveState(state);

  if (wasFirstChange) {
    const result = addXP(state, 10);
    return { changed: true, xpAwarded: 10, leveledUp: result.leveledUp, newLevel: result.newLevel };
  }

  return { changed: true, xpAwarded: 0, leveledUp: false, newLevel: state.user.level };
}

/**
 * Update streak
 */
export function updateStreak(state) {
  const today = new Date().toDateString();
  if (state.user.lastVisit) {
    const last = new Date(state.user.lastVisit).toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (last === yesterday) {
      state.user.streak += 1;
    } else if (last !== today) {
      state.user.streak = 1;
    }
  } else {
    state.user.streak = 1;
  }
  state.user.lastVisit = Date.now();
  saveState(state);
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
