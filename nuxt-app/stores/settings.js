// Pinia store: configurações (theme, palette, chaves de API, notificações).
// Persiste em localStorage `copadatahub_settings`.
// Aplica tema/paleta no <html> via bootThemeAndPalette() (client-only).

import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { THEMES, PALETTES } from '~/utils/theme';

const STORAGE_KEY = 'copadatahub_settings';
const STATE_VERSION = 4;

function defaultSettings() {
  return {
    notifications: true,
    installDismissed: false,
    // api-sports.io (header x-apisports-key): partidas, escalações, jogadores.
    apiSportsKey: '63dac64042df41209e99b787a87da1b4',
    // football-data.org v4 (header X-Auth-Token): campeonatos externos.
    footballDataKey: '',
    theme: 'auto',
    palette: 'stadium'
  };
}

function migrate(raw) {
  if (!raw || typeof raw !== 'object') return { _version: STATE_VERSION, ...defaultSettings() };
  const base = defaultSettings();
  const merged = { ...base, ...raw };
  // v1→v4: se houver apiKey antiga, herda para apiSportsKey e descarta.
  if (raw.apiKey && !raw.apiSportsKey) merged.apiSportsKey = raw.apiKey;
  delete merged.apiKey;
  // Sanitiza valores fora do enum.
  if (!THEMES.includes(merged.theme)) merged.theme = 'auto';
  if (!PALETTES.includes(merged.palette)) merged.palette = 'stadium';
  merged._version = STATE_VERSION;
  return merged;
}

function loadFromStorage() {
  if (!import.meta.client) return { _version: STATE_VERSION, ...defaultSettings() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { _version: STATE_VERSION, ...defaultSettings() };
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn('[settings store] load falhou:', e);
    return { _version: STATE_VERSION, ...defaultSettings() };
  }
}

// --- DOM helpers (client-only) ---
let osMatcher = null;
let osListenerAttached = false;

function computeEffectiveTheme(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  return osMatcher?.matches ? 'light' : 'dark';
}

function setRootAttrs(effectiveTheme, palette) {
  if (!import.meta.client) return;
  const html = document.documentElement;
  html.setAttribute('data-theme', effectiveTheme);
  html.setAttribute('data-palette', palette);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', effectiveTheme === 'light' ? '#f8fafc' : '#0a0e1a');
}

export const useSettingsStore = defineStore('settings', () => {
  const initial = loadFromStorage();

  const _version = ref(initial._version || STATE_VERSION);
  const notifications = ref(initial.notifications);
  const installDismissed = ref(initial.installDismissed);
  const apiSportsKey = ref(initial.apiSportsKey);
  const footballDataKey = ref(initial.footballDataKey);
  const theme = ref(initial.theme);
  const palette = ref(initial.palette);

  function setTheme(value) {
    if (!THEMES.includes(value)) value = 'auto';
    theme.value = value;
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme-pref', value);
      setRootAttrs(computeEffectiveTheme(value), palette.value);
    }
  }

  function setPalette(value) {
    if (!PALETTES.includes(value)) value = 'stadium';
    palette.value = value;
    if (import.meta.client) {
      setRootAttrs(computeEffectiveTheme(theme.value), value);
    }
  }

  // Aplica tema/paleta salvos — deve rodar o mais cedo possível client-side
  // (ex: plugin `plugins/theme.client.ts` ou no onMounted de app.vue).
  function bootThemeAndPalette() {
    if (!import.meta.client) return;
    if (!osMatcher && typeof window !== 'undefined' && window.matchMedia) {
      osMatcher = window.matchMedia('(prefers-color-scheme: light)');
    }
    document.documentElement.setAttribute('data-theme-pref', theme.value);
    setRootAttrs(computeEffectiveTheme(theme.value), palette.value);

    if (osMatcher && !osListenerAttached) {
      const handler = () => {
        if (theme.value === 'auto') {
          setRootAttrs(computeEffectiveTheme('auto'), palette.value);
        }
      };
      if (osMatcher.addEventListener) osMatcher.addEventListener('change', handler);
      else if (osMatcher.addListener) osMatcher.addListener(handler);
      osListenerAttached = true;
    }
  }

  function snapshot() {
    return {
      _version: _version.value,
      notifications: notifications.value,
      installDismissed: installDismissed.value,
      apiSportsKey: apiSportsKey.value,
      footballDataKey: footballDataKey.value,
      theme: theme.value,
      palette: palette.value
    };
  }

  if (import.meta.client) {
    watch(snapshot, (val) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(val)); }
      catch (e) { console.warn('[settings store] save falhou:', e); }
    }, { deep: true });
  }

  return {
    _version,
    notifications, installDismissed,
    apiSportsKey, footballDataKey,
    theme, palette,
    setTheme, setPalette,
    bootThemeAndPalette
  };
});

// Re-exporta constantes para conveniência de quem importa o store.
export { THEMES, THEME_LABEL, PALETTES, PALETTE_META } from '~/utils/theme';
