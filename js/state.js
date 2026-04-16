// CopaDataHub 2026 — State Management (LocalStorage)

const STORAGE_KEY = 'copadatahub_state';

const DEFAULT_STATE = {
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
    apiKey: 'ec01475ea2eeb3485b0664b8ae9cd21e'
  }
};

// XP thresholds per level
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

/**
 * Load state from localStorage
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Merge with defaults for new fields
      return deepMerge(DEFAULT_STATE, saved);
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
 * Save a prediction
 */
export function savePrediction(state, fixtureId, homeScore, awayScore) {
  const existing = state.user.predictions.findIndex(p => p.fixtureId === fixtureId);
  const pred = { fixtureId, homeScore, awayScore, timestamp: Date.now() };

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
