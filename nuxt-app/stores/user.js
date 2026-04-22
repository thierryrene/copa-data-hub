// Pinia store: estado do usuário (XP, level, streak, palpites, trivia).
// Persistência manual em localStorage (chave `copadatahub_user`) via watch.

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

const STORAGE_KEY = 'copadatahub_user';
const STATE_VERSION = 4;

// XP thresholds por nível (índice = nível-1).
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

function defaultUser() {
  return {
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
  };
}

// Consolida o state salvo para v4: só garante defaults; migrations antigas
// (v1→v4 da versão vanilla) são desnecessárias pois o shape final é igual.
function migrate(raw) {
  if (!raw || typeof raw !== 'object') return { _version: STATE_VERSION, ...defaultUser() };
  const base = defaultUser();
  const merged = { ...base, ...raw };
  // Garante arrays (localStorage pode retornar undefined de versões quebradas).
  if (!Array.isArray(merged.predictions)) merged.predictions = [];
  if (!Array.isArray(merged.triviaAnswered)) merged.triviaAnswered = [];
  if (!Array.isArray(merged.badges)) merged.badges = [];
  merged._version = STATE_VERSION;
  return merged;
}

function loadFromStorage() {
  if (!import.meta.client) return { _version: STATE_VERSION, ...defaultUser() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { _version: STATE_VERSION, ...defaultUser() };
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn('[user store] load falhou:', e);
    return { _version: STATE_VERSION, ...defaultUser() };
  }
}

export const useUserStore = defineStore('user', () => {
  const initial = loadFromStorage();

  const _version = ref(initial._version || STATE_VERSION);
  const id = ref(initial.id);
  const name = ref(initial.name);
  const xp = ref(initial.xp);
  const level = ref(initial.level);
  const streak = ref(initial.streak);
  const lastVisit = ref(initial.lastVisit);
  const favoriteTeam = ref(initial.favoriteTeam);
  const favoriteTeamChanged = ref(initial.favoriteTeamChanged);
  const predictions = ref(initial.predictions);
  const triviaAnswered = ref(initial.triviaAnswered);
  const badges = ref(initial.badges);
  const onboarded = ref(initial.onboarded);

  const xpProgress = computed(() => getXPProgress());

  function getXPProgress() {
    const lvl = level.value;
    const currentThreshold = LEVEL_THRESHOLDS[lvl - 1] || 0;
    const nextThreshold = LEVEL_THRESHOLDS[lvl] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 1.5;
    const xpInLevel = xp.value - currentThreshold;
    const xpNeeded = nextThreshold - currentThreshold;
    const percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
    return { level: lvl, xp: xp.value, percent, xpInLevel, xpNeeded, nextThreshold };
  }

  function addXP(amount) {
    const oldLevel = level.value;
    xp.value += amount;
    let newLevel = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp.value >= LEVEL_THRESHOLDS[i]) { newLevel = i + 1; break; }
    }
    level.value = newLevel;
    return { newXp: xp.value, newLevel, leveledUp: newLevel > oldLevel };
  }

  function savePrediction(fixtureId, homeScore, awayScore, confidence = 1) {
    const safeConf = Math.max(1, Math.min(3, Math.round(confidence)));
    const pred = { fixtureId, homeScore, awayScore, confidence: safeConf, timestamp: Date.now() };
    const idx = predictions.value.findIndex(p => p.fixtureId === fixtureId);
    if (idx >= 0) predictions.value[idx] = pred;
    else predictions.value.push(pred);
  }

  function recordTrivia(questionId, _wasCorrect) {
    if (!triviaAnswered.value.includes(questionId)) {
      triviaAnswered.value.push(questionId);
      return true;
    }
    return false;
  }

  function setFavoriteTeam(teamCode) {
    if (!teamCode || favoriteTeam.value === teamCode) {
      return { changed: false, xpAwarded: 0, leveledUp: false, newLevel: level.value };
    }
    const wasFirstChange = !favoriteTeamChanged.value;
    favoriteTeam.value = teamCode;
    favoriteTeamChanged.value = true;
    if (wasFirstChange) {
      const r = addXP(10);
      return { changed: true, xpAwarded: 10, leveledUp: r.leveledUp, newLevel: r.newLevel };
    }
    return { changed: true, xpAwarded: 0, leveledUp: false, newLevel: level.value };
  }

  function updateStreak() {
    const today = new Date().toDateString();
    if (lastVisit.value) {
      const last = new Date(lastVisit.value).toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (last === yesterday) streak.value += 1;
      else if (last !== today) streak.value = 1;
    } else {
      streak.value = 1;
    }
    lastVisit.value = Date.now();
  }

  // Persistência: serializa qualquer mudança reativa no state público.
  function snapshot() {
    return {
      _version: _version.value,
      id: id.value,
      name: name.value,
      xp: xp.value,
      level: level.value,
      streak: streak.value,
      lastVisit: lastVisit.value,
      favoriteTeam: favoriteTeam.value,
      favoriteTeamChanged: favoriteTeamChanged.value,
      predictions: predictions.value,
      triviaAnswered: triviaAnswered.value,
      badges: badges.value,
      onboarded: onboarded.value
    };
  }

  if (import.meta.client) {
    watch(snapshot, (val) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(val)); }
      catch (e) { console.warn('[user store] save falhou:', e); }
    }, { deep: true });
  }

  return {
    _version,
    id, name, xp, level, streak, lastVisit,
    favoriteTeam, favoriteTeamChanged,
    predictions, triviaAnswered, badges, onboarded,
    xpProgress,
    addXP,
    getXPProgress,
    savePrediction,
    recordTrivia,
    setFavoriteTeam,
    updateStreak
  };
});
