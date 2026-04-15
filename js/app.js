// CopaDataHub 2026 — Main Application Controller

import { Router } from './router.js';
import { icon } from './icons.js';
import { TEAMS, getTeam } from './data.js';
import { loadState, saveState, addXP, savePrediction, recordTrivia, updateStreak } from './state.js';
import { updateCountdown, showToast } from './components.js';
import { renderHome, renderMatches, renderGroups, renderFanzone, renderStadiums, renderSettings } from './pages.js';
import { registerServiceWorker, setupInstallPrompt, renderInstallBanner, triggerInstall, hideInstallBanner } from './pwa.js';

class App {
  constructor() {
    this.state = loadState();
    this.router = new Router();
    this.countdownInterval = null;

    this.init();
  }

  init() {
    // Check if onboarding needed
    if (!this.state.user.onboarded) {
      this.showWelcome();
    } else {
      this.startApp();
    }
  }

  startApp() {
    // Update streak
    updateStreak(this.state);

    // DEV MODE: Disable PWA and unregister any existing service workers to clear cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
          console.log('DEV MODE: Service worker removido para facilitar testes limpos.');
        }
      });
    }
    // PWA resources temporarily disabled for development
    // registerServiceWorker();
    // setupInstallPrompt(this.state.settings.installDismissed);

    // Setup routes
    this.setupRoutes();

    // Setup navigation
    this.setupNavigation();

    // Start countdown timer
    this.countdownInterval = setInterval(() => updateCountdown(), 1000);

    // Start router
    this.router.start('home');

    // Show welcome-back toast
    if (this.state.user.streak > 1) {
      setTimeout(() => {
        showToast(`🔥 Streak de ${this.state.user.streak} dias! +10 XP`, 'xp');
        addXP(this.state, 10);
      }, 1000);
    }
  }

  setupRoutes() {
    const pageContainer = document.getElementById('page-container');

    const renderPage = (renderFn) => {
      pageContainer.innerHTML = renderFn(this.state);
      window.scrollTo(0, 0);
      this.bindPageEvents();
    };

    this.router.addRoute('home', () => renderPage(renderHome));
    this.router.addRoute('matches', () => renderPage(renderMatches));
    this.router.addRoute('groups', () => renderPage(renderGroups));
    this.router.addRoute('fanzone', () => renderPage(renderFanzone));
    this.router.addRoute('stadiums', () => renderPage(renderStadiums));
    this.router.addRoute('settings', () => renderPage(renderSettings));

    this.router.onNavigate = (route) => this.updateNavHighlight(route);
  }

  setupNavigation() {
    // Bottom nav clicks
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.dataset.route;
        if (route) this.router.navigate(route);
      });
    });

    // Install banner events
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

  updateNavHighlight(route) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === route);
    });
  }

  /**
   * Bind dynamic events for the current page
   */
  bindPageEvents() {
    // Navigation cards on home
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => {
        this.router.navigate(el.dataset.nav);
      });
    });

    // Group filter tabs
    const groupFilters = document.getElementById('group-filters');
    if (groupFilters) {
      groupFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-tab');
        if (!btn) return;
        const filter = btn.dataset.filter;

        groupFilters.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.group-wrapper').forEach(g => {
          g.style.display = (filter === 'all' || g.dataset.group === filter) ? '' : 'none';
        });
      });
    }

    // Stadium filter tabs
    const stadiumFilters = document.getElementById('stadium-filters');
    if (stadiumFilters) {
      stadiumFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-tab');
        if (!btn) return;
        const filter = btn.dataset.filter;

        stadiumFilters.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.stadium-wrapper').forEach(s => {
          s.style.display = (filter === 'all' || s.dataset.country === filter) ? '' : 'none';
        });
      });
    }

    // FanZone sub-tabs
    const fanzoneTabs = document.getElementById('fanzone-tabs');
    if (fanzoneTabs) {
      fanzoneTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.sub-tab');
        if (!btn) return;
        const tab = btn.dataset.tab;

        fanzoneTabs.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.fanzone-tab-content').forEach(c => {
          c.style.display = c.id === `tab-${tab}` ? 'block' : 'none';
        });
      });
    }

    // Save prediction buttons
    document.querySelectorAll('.save-prediction-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fixtureId = btn.dataset.fixture;
        const homeInput = document.querySelector(`input[data-fixture="${fixtureId}"][data-side="home"]`);
        const awayInput = document.querySelector(`input[data-fixture="${fixtureId}"][data-side="away"]`);

        if (homeInput && awayInput) {
          const homeScore = parseInt(homeInput.value) || 0;
          const awayScore = parseInt(awayInput.value) || 0;
          savePrediction(this.state, fixtureId, homeScore, awayScore);
          const result = addXP(this.state, 15);
          showToast(`⚽ Palpite salvo! +15 XP`, 'xp');

          if (result.leveledUp) {
            setTimeout(() => showToast(`🎉 Parabéns! Você subiu para o Nível ${result.newLevel}!`, 'success'), 800);
          }
        }
      });
    });

    // Trivia answers
    document.querySelectorAll('.trivia-options').forEach(container => {
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('.trivia-option');
        if (!btn || container.classList.contains('answered')) return;

        container.classList.add('answered');
        const questionId = parseInt(container.dataset.triviaId);
        const answer = parseInt(container.dataset.answer);
        const selected = parseInt(btn.dataset.index);
        const isCorrect = selected === answer;

        // Highlight correct/wrong
        container.querySelectorAll('.trivia-option').forEach((opt, i) => {
          if (i === answer) opt.classList.add('correct');
          else if (i === selected && !isCorrect) opt.classList.add('wrong');
        });

        recordTrivia(this.state, questionId, isCorrect);

        if (isCorrect) {
          const result = addXP(this.state, 25);
          showToast('✅ Correto! +25 XP', 'xp');
          if (result.leveledUp) {
            setTimeout(() => showToast(`🎉 Nível ${result.newLevel} alcançado!`, 'success'), 800);
          }
        } else {
          showToast('❌ Incorreto! Tente a próxima.', 'error');
        }

        // Load next question after delay
        setTimeout(() => {
          this.router.navigate('fanzone');
        }, 1500);
      });
    });

    // Settings: Install button
    const settingInstall = document.getElementById('setting-install');
    if (settingInstall) {
      settingInstall.addEventListener('click', () => triggerInstall());
    }

    // Settings: Notifications toggle
    const toggleNotifications = document.getElementById('toggle-notifications');
    if (toggleNotifications) {
      toggleNotifications.addEventListener('click', () => {
        this.state.settings.notifications = !this.state.settings.notifications;
        saveState(this.state);
        toggleNotifications.classList.toggle('active');
        showToast(
          this.state.settings.notifications ? '🔔 Notificações ativadas' : '🔕 Notificações desativadas',
          'success'
        );
      });
    }

    // Settings: Reset data
    const resetBtn = document.getElementById('btn-reset-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Tem certeza? Todos os seus dados (XP, palpites, trivia) serão apagados.')) {
          localStorage.clear();
          window.location.reload();
        }
      });
    }
  }

  /**
   * Show onboarding/welcome screen
   */
  showWelcome() {
    const overlay = document.getElementById('welcome-overlay');
    if (!overlay) return;

    overlay.style.display = 'flex';

    // Build team selector
    const teamSelector = overlay.querySelector('.team-selector');
    if (teamSelector) {
      const teamEntries = Object.entries(TEAMS).sort((a, b) => a[1].name.localeCompare(b[1].name));
      teamSelector.innerHTML = teamEntries.map(([code, team]) => `
        <button class="team-selector-item" data-code="${code}">
          <span class="team-selector-item__flag">${team.flag}</span>
          <span>${team.code}</span>
        </button>
      `).join('');

      teamSelector.addEventListener('click', (e) => {
        const item = e.target.closest('.team-selector-item');
        if (!item) return;
        teamSelector.querySelectorAll('.team-selector-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        this.state.user.favoriteTeam = item.dataset.code;
      });
    }

    // Start button
    const startBtn = overlay.querySelector('#welcome-start');
    const nameInput = overlay.querySelector('.welcome-name-input');

    const handleStart = () => {
      try {
        console.log('🚀 Iniciando onboarding...');
        if (nameInput && nameInput.value.trim()) {
          this.state.user.name = nameInput.value.trim();
        } else {
          this.state.user.name = 'Torcedor';
        }

        // Using purely safe Math.random to avoid ANY secure context issues with cryptoAPI
        const safeId = Math.random().toString(36).substring(2, 10);
        this.state.user.id = 'usr_' + safeId;
        this.state.user.onboarded = true;
        
        console.log('Salvando estado com:', this.state.user);
        saveState(this.state);
        
        console.log('✅ Estado salvo, fechando overlay...');

        // Animate out
        overlay.classList.add('closing');
        setTimeout(() => {
          overlay.style.display = 'none';
          try {
            console.log('Iniciando app principal...');
            this.startApp();
            console.log('App iniciado com sucesso!');
          } catch(e) {
            console.error('Erro fatal ao rodar startApp:', e);
            alert('Erro ao iniciar o aplicativo: ' + e.message);
          }
        }, 500);

      } catch (err) {
        console.error('Erro no onboarding:', err);
        alert('Ocorreu um erro no setup inicial: ' + err.message);
      }
    };

    if (startBtn) {
      startBtn.addEventListener('click', handleStart);
    }

    if (nameInput) {
      nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleStart();
      });
    }
  }
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
