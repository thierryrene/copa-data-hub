// Constantes de tema/paleta reaproveitadas pelo settings store e componentes.
// As funções de aplicação no DOM vivem no próprio store (são side-effects client-only).

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
