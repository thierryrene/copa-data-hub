// CopaDataHub 2026 — Bootstrap, roteamento e bind de shell do app.
// Páginas e componentes vivem em /js/pages e /js/components.

import { Router } from './router.js';
import { loadState, saveState, addXP, updateStreak } from './state.js';
import { getTeam } from './data.js';
import { setupInstallPrompt, triggerInstall, hideInstallBanner } from './pwa.js';
import { showToast } from './components/toast.js';
import { updateCountdown } from './components/countdown.js';
import { renderHeader, updateHeaderXP } from './layout/header.js';
import { renderBottomNav, updateBottomNavHighlight } from './layout/bottomNav.js';
import { renderWelcomeOverlay, mountWelcome } from './layout/welcome.js';
import { renderInstallBanner } from './layout/layout.js';
import { prefetchTeamDossier } from './api/teamLoader.js';
import { pages } from './pages/index.js';

class App {
  constructor() {
    this.state = loadState();
    this.router = new Router();
    this.countdownInterval = null;
    this.init();
  }

  init() {
    this.mountShell();

    if (!this.state.user.onboarded) {
      mountWelcome(this.state, () => this.startApp());
    } else {
      this.startApp();
    }
  }

  mountShell() {
    const root = document.getElementById('app-root');
    if (!root) {
      console.error('Elemento #app-root não encontrado no HTML.');
      return;
    }
    root.innerHTML = `
      ${renderWelcomeOverlay()}
      ${renderHeader(this.state)}
      <div class="toast-container" id="toast-container"></div>
      <main id="app">
        <div class="page active" id="page-container"></div>
      </main>
      ${renderInstallBanner()}
      ${renderBottomNav('home')}
    `;
  }

  startApp() {
    const overlay = document.getElementById('welcome-overlay');
    if (overlay) overlay.style.display = 'none';

    updateStreak(this.state);
    updateHeaderXP(this.state);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }

    setupInstallPrompt(this.state.settings.installDismissed);

    this.setupRoutes();
    this.bindInstallBanner();

    this.countdownInterval = setInterval(() => updateCountdown(), 1000);

    this.router.start('home');

    if (this.state.user.streak > 1) {
      setTimeout(() => {
        showToast(`🔥 Streak de ${this.state.user.streak} dias! +10 XP`, 'xp');
        addXP(this.state, 10);
        updateHeaderXP(this.state);
      }, 1000);
    }
  }

  setupRoutes() {
    const pageContainer = document.getElementById('page-container');

    Object.entries(pages).forEach(([name, pageModule]) => {
      this.router.addRoute(name, (params) => {
        pageContainer.innerHTML = pageModule.render(this.state, params);
        window.scrollTo(0, 0);
        pageModule.bindEvents(this.state, { router: this.router, params });
        this.bindCrossPageEvents();
        updateHeaderXP(this.state);
      });
    });

    this.router.onNavigate = (route) => updateBottomNavHighlight(route);
  }

  bindCrossPageEvents() {
    document.querySelectorAll('[data-team-prefetch]').forEach((el) => {
      if (el.dataset.prefetchBound === '1') return;
      const handler = () => {
        const code = el.dataset.teamPrefetch;
        if (!code) return;
        const team = getTeam(code);
        if (team) prefetchTeamDossier(team);
      };
      el.addEventListener('mouseenter', handler, { passive: true });
      el.addEventListener('touchstart', handler, { passive: true });
      el.dataset.prefetchBound = '1';
    });
  }

  bindInstallBanner() {
    const installBtn = document.getElementById('install-btn');
    const installClose = document.getElementById('install-close');

    if (installBtn) {
      installBtn.addEventListener('click', () => triggerInstall());
    }
    if (installClose) {
      installClose.addEventListener('click', () => {
        hideInstallBanner();
        this.state.settings.installDismissed = true;
        saveState(this.state);
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
