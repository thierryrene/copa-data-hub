// Aplicação de tema (auto/light/dark) e paleta de cores no <html>.
// O CSS reage via [data-theme] e [data-palette] em :root.

import { loadState, saveState } from '../state.js';

export const THEMES = ['auto', 'light', 'dark'];
export const THEME_LABEL = { auto: 'Automático', light: 'Claro', dark: 'Escuro' };

export const PALETTES = ['stadium', 'sunset', 'pitch', 'brasil', 'royal', 'volcano', 'ocean', 'champion'];
export const PALETTE_META = {
  stadium:  { label: 'Stadium Night', swatches: ['#f59e0b', '#3b82f6', '#f43f5e'] },
  sunset:   { label: 'Sunset',        swatches: ['#f97316', '#ec4899', '#fbbf24'] },
  pitch:    { label: 'Pitch',         swatches: ['#22c55e', '#1d4ed8', '#eab308'] },
  brasil:   { label: 'Brasil',        swatches: ['#facc15', '#16a34a', '#1e3a8a'] },
  royal:    { label: 'Royal',         swatches: ['#a855f7', '#06b6d4', '#ec4899'] },
  volcano:  { label: 'Volcano',       swatches: ['#dc2626', '#ea580c', '#fbbf24'] },
  ocean:    { label: 'Ocean',         swatches: ['#0ea5e9', '#0d9488', '#1e40af'] },
  champion: { label: 'Champion',      swatches: ['#fbbf24', '#b45309', '#10b981'] }
};

let osMatcher = null;
let osListenerAttached = false;

function effectiveTheme(setting) {
  if (setting === 'light' || setting === 'dark') return setting;
  // auto: segue OS
  return osMatcher?.matches ? 'light' : 'dark';
}

function setRootAttrs(theme, palette) {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  html.setAttribute('data-palette', palette);
  // meta theme-color para barra do navegador
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'light' ? '#f8fafc' : '#0a0e1a');
  }
}

export function applyTheme(setting) {
  const html = document.documentElement;
  html.setAttribute('data-theme-pref', setting);
  setRootAttrs(effectiveTheme(setting), html.getAttribute('data-palette') || 'stadium');
}

export function applyPalette(palette) {
  if (!PALETTES.includes(palette)) palette = 'stadium';
  const html = document.documentElement;
  setRootAttrs(html.getAttribute('data-theme') || 'dark', palette);
}

export function setTheme(state, value) {
  if (!THEMES.includes(value)) value = 'auto';
  state.settings.theme = value;
  saveState(state);
  applyTheme(value);
}

export function setPalette(state, value) {
  if (!PALETTES.includes(value)) value = 'stadium';
  state.settings.palette = value;
  saveState(state);
  applyPalette(value);
}

// Aplica tema/paleta salvos. Deve rodar o mais cedo possível para evitar flash.
export function bootThemeAndPalette() {
  // Inicializa matcher do OS uma vez
  if (!osMatcher && typeof window !== 'undefined' && window.matchMedia) {
    osMatcher = window.matchMedia('(prefers-color-scheme: light)');
  }

  const state = loadState();
  const theme = state?.settings?.theme || 'auto';
  const palette = state?.settings?.palette || 'stadium';

  applyTheme(theme);
  applyPalette(palette);

  // Re-aplica quando o OS muda (só faz diferença em modo auto)
  if (osMatcher && !osListenerAttached) {
    const handler = () => {
      const cur = loadState()?.settings?.theme || 'auto';
      if (cur === 'auto') applyTheme('auto');
    };
    if (osMatcher.addEventListener) osMatcher.addEventListener('change', handler);
    else if (osMatcher.addListener) osMatcher.addListener(handler);
    osListenerAttached = true;
  }
}
