// Helpers que compõem fragmentos repetidos de UI dentro das páginas.

import { icon } from '../icons.js';

export function renderSectionTitle(iconName, label, size = 20) {
  return `
    <div class="section-title">
      ${icon(iconName, size)} ${label}
    </div>
  `;
}

export function renderSectionSubtitle(text) {
  return `<p class="section-subtitle">${text}</p>`;
}

export function renderInstallBanner() {
  return `
    <div class="install-banner hidden" id="install-banner">
      <div class="install-banner__icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      </div>
      <div class="install-banner__text">
        <div class="install-banner__title">Instalar CopaDataHub</div>
        <div class="install-banner__desc">Acesso rápido na tela inicial</div>
      </div>
      <button class="install-banner__btn" id="install-btn">Instalar</button>
      <button class="install-banner__close" id="install-close" aria-label="Fechar">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  `;
}
