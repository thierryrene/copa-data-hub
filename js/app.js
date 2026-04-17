// CopaDataHub 2026 — Bootstrap, roteamento e bind de shell do app.

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

// Tabela declarativa de rotas do app.
// name: identificador usado em router.navigate() e para destaque da nav.
// pattern: path pattern com :params opcionais.
// page: chave em pages/index.js que implementa { render, bindEvents }.
const ROUTE_TABLE = [
  { name: 'home',         pattern: '/',                      page: 'inicio' },
  { name: 'jogos',        pattern: '/jogos',                 page: 'jogos' },
  { name: 'partida',      pattern: '/partida/:slug',         page: 'partida' },
  { name: 'grupos',       pattern: '/grupos',                page: 'grupos' },
  { name: 'fanzone',      pattern: '/fanzone',               page: 'fanzone' },
  { name: 'sedes',        pattern: '/sedes',                 page: 'sedes' },
  { name: 'configuracoes',pattern: '/configuracoes',         page: 'configuracoes' },
  { name: 'selecoes',     pattern: '/selecoes/:slug',        page: 'selecoes' },
  { name: 'jogadores',    pattern: '/jogadores/:slug',       page: 'jogadores' },
  { name: 'campeonatos',  pattern: '/campeonatos',           page: 'campeonatos' },
  { name: 'liga',         pattern: '/campeonatos/:slug',     page: 'campeonatos' }
];

// Rotas que o bottom-nav destaca (algumas rotas usam o mesmo nav).
const NAV_HIGHLIGHT = {
  home: 'home',
  jogos: 'jogos',
  partida: 'jogos',
  grupos: 'grupos',
  fanzone: 'fanzone',
  sedes: 'sedes',
  configuracoes: null,
  selecoes: 'grupos',
  jogadores: null,
  campeonatos: null,
  liga: null
};

class App {
  constructor() {
    this.state = loadState();
    this.router = new Router();
    this.countdownInterval = null;
    this.init();
  }

  init() {
    this.mountShell();
    this.setupRoutes();
    this.bindInstallBanner();

    if (!this.state.user.onboarded) {
      mountWelcome(this.state, () => this.startApp());
    } else {
      this.startApp();
    }
  }

  mountShell() {
    const root = document.getElementById('app-root');
    if (!root) {
      console.error('[app] Elemento #app-root não encontrado no HTML.');
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

    this.countdownInterval = setInterval(() => updateCountdown(), 1000);

    this.router.start();

    if (this.state.user.streak > 1) {
      setTimeout(() => {
        showToast(`🔥 Streak de ${this.state.user.streak} dias! +10 XP`, 'xp');
        addXP(this.state, 10);
        updateHeaderXP(this.state);
      }, 1000);
    }
  }

  setupRoutes() {
    const pageContainer = () => document.getElementById('page-container');

    const renderRoute = (name, pageModule, params) => {
      const container = pageContainer();
      if (!container) return;
      try {
        container.innerHTML = pageModule.render(this.state, params);
      } catch (err) {
        console.error(`[app] erro no render de "${name}":`, err);
        container.innerHTML = this.renderErrorState(name);
        return;
      }
      window.scrollTo(0, 0);
      try {
        pageModule.bindEvents(this.state, { router: this.router, params });
      } catch (err) {
        console.error(`[app] erro no bindEvents de "${name}":`, err);
      }
      this.bindCrossPageEvents();
      updateHeaderXP(this.state);
    };

    ROUTE_TABLE.forEach((route) => {
      const pageModule = pages[route.page];
      if (!pageModule) {
        console.error(`[app] página "${route.page}" não encontrada para rota "${route.name}"`);
        return;
      }
      this.router.addRoute(route.name, route.pattern, ({ params, name }) => {
        renderRoute(name, pageModule, params);
      });
    });

    // Fallback 404 — rota desconhecida ou erro de renderização.
    this.router.addRoute('*', null, () => {
      const container = pageContainer();
      if (container) container.innerHTML = this.renderNotFound();
      updateHeaderXP(this.state);
      updateBottomNavHighlight(null);
    });

    this.router.onNavigate = (name) => {
      updateBottomNavHighlight(NAV_HIGHLIGHT[name] || null);
    };
  }

  renderNotFound() {
    return `
      <div class="team-page__notfound">
        <div class="section-title">🔎 Página não encontrada</div>
        <p class="section-subtitle">A URL acessada não corresponde a nenhuma página deste site.</p>
        <a class="btn btn--primary" href="/" data-route-link>← Voltar ao início</a>
      </div>
    `;
  }

  renderErrorState(routeName) {
    return `
      <div class="team-page__notfound">
        <div class="section-title">⚠️ Erro ao carregar</div>
        <p class="section-subtitle">Ocorreu um erro ao renderizar "${routeName}". Tente recarregar a página.</p>
        <a class="btn btn--primary" href="/" data-route-link>← Voltar ao início</a>
      </div>
    `;
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

    if (installBtn) installBtn.addEventListener('click', () => triggerInstall());
    if (installClose) installClose.addEventListener('click', () => {
      hideInstallBanner();
      this.state.settings.installDismissed = true;
      saveState(this.state);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
