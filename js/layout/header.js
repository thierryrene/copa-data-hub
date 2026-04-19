import { getXPProgress } from '../state.js';
import { icon } from '../icons.js';

export function renderHeader(state) {
  const { xp } = getXPProgress(state);
  return `
    <header class="app-header">
      <div class="app-header__logo">
        <span style="font-size: 1.5rem;">🏆</span>
        <div>
          <div class="app-header__title">CopaDataHub</div>
          <div class="app-header__subtitle">2026 · EUA · CAN · MEX</div>
        </div>
      </div>
      <div class="app-header__actions">
        <button class="app-header__search-btn" id="header-search-btn" aria-label="Buscar seleções, estádios ou partidas">
          ${icon('search', 18)}
        </button>
        <div class="app-header__badge" id="header-xp-badge">
          ⚡ <span id="header-xp">${xp}</span> XP
        </div>
      </div>
    </header>
  `;
}

export function updateHeaderXP(state) {
  const el = document.getElementById('header-xp');
  if (!el) return;
  const { xp } = getXPProgress(state);
  el.textContent = xp;
}
