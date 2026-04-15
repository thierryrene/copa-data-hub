// CopaDataHub 2026 — Main Application Controller

import { Router } from './router.js';
import { icon } from './icons.js';
import { TEAMS, getTeam } from './data.js';
import { loadState, saveState, addXP, savePrediction, recordTrivia, updateStreak } from './state.js';
import { updateCountdown, showToast } from './components.js';
import { renderHome, renderMatches, renderGroups, renderFanzone, renderStadiums, renderSettings } from './pages.js';
import { registerServiceWorker, setupInstallPrompt, renderInstallBanner, triggerInstall, hideInstallBanner } from './pwa.js';

const WIKIPEDIA_API_BASE = 'https://pt.wikipedia.org/w/api.php';
const WIKIPEDIA_SUMMARY_BASE = 'https://pt.wikipedia.org/api/rest_v1/page/summary/';
const WIKIMEDIA_FEATURED_BASE = 'https://api.wikimedia.org/feed/v1/wikipedia/pt/featured';
const MAX_TEAM_NEWS_ITEMS = 3;
const MAX_TEAM_CURIOSITIES = 3;
const MIN_CURIOSITY_LENGTH = 40;

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

class App {
  constructor() {
    this.state = loadState();
    this.router = new Router();
    this.countdownInterval = null;

    this.init();
  }

  init() {
    // Always hide the welcome overlay first (safety net)
    const overlay = document.getElementById('welcome-overlay');

    // Check if onboarding needed
    if (!this.state.user.onboarded) {
      // Show overlay for new users
      if (overlay) overlay.style.display = 'flex';
      this.showWelcome();
    } else {
      // Returning user — ensure overlay is hidden and go straight to app
      if (overlay) overlay.style.display = 'none';
      this.startApp();
    }
  }

  startApp() {
    // Safety: always hide welcome overlay when entering the app
    const overlay = document.getElementById('welcome-overlay');
    if (overlay) overlay.style.display = 'none';

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

    // Team details (Groups page)
    const teamDetailsPanel = document.getElementById('team-details-panel');
    if (teamDetailsPanel) {
      document.querySelectorAll('[data-team-detail]').forEach((trigger) => {
        trigger.addEventListener('click', () => this.loadTeamDetails(trigger.dataset.teamDetail));
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

  async loadTeamDetails(teamCode) {
    const panel = document.getElementById('team-details-panel');
    const team = getTeam(teamCode);
    if (!panel || !team) return;

    panel.dataset.teamCode = teamCode;
    panel.innerHTML = `
      <div class="team-insights__title">${team.flag} ${escapeHTML(team.name)} (${escapeHTML(team.code)})</div>
      <p class="text-sm text-muted">Carregando dados da Wikipedia e APIs públicas...</p>
    `;

    try {
      const wiki = await this.fetchWikipediaTeamSummary(team);
      const news = await this.fetchTeamNews(team);

      if (panel.dataset.teamCode !== teamCode) return;

      const curiosities = this.extractCuriosities(wiki?.extract || '');
      const confederation = escapeHTML(team.confederation);
      const ranking = escapeHTML(String(team.ranking));
      const wikiDescription = wiki?.description ? escapeHTML(wiki.description) : 'Sem descrição disponível.';
      const wikiExtract = wiki?.extract ? escapeHTML(wiki.extract) : 'Não foi possível recuperar detalhes enciclopédicos no momento.';
      const wikiUrl = wiki?.url ? `<a href="${escapeHTML(wiki.url)}" target="_blank" rel="noopener noreferrer">Abrir na Wikipedia</a>` : '';

      panel.innerHTML = `
        <div class="team-insights__title">${team.flag} ${escapeHTML(team.name)} (${escapeHTML(team.code)})</div>
        <div class="team-insights__meta">Confederação: ${confederation} · Ranking FIFA: #${ranking}</div>
        <p class="team-insights__description"><strong>${wikiDescription}</strong><br>${wikiExtract}</p>

        <div class="team-insights__section-title">Curiosidades (Wikipedia)</div>
        <ul class="team-insights__list">
          ${curiosities.length ? curiosities.map(item => `<li>${escapeHTML(item)}</li>`).join('') : '<li>Sem curiosidades disponíveis para esta seleção.</li>'}
        </ul>

        <div class="team-insights__section-title">Notícias em destaque (Wikimedia)</div>
        <ul class="team-insights__list">
          ${news.length
            ? news.map(item => `<li><a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.title)}</a></li>`).join('')
            : '<li>Não encontramos notícias recentes relacionadas; tente novamente mais tarde.</li>'}
        </ul>
        ${wikiUrl ? `<div class="team-insights__link">${wikiUrl}</div>` : ''}
      `;
    } catch (error) {
      panel.innerHTML = `
        <div class="team-insights__title">${team.flag} ${escapeHTML(team.name)} (${escapeHTML(team.code)})</div>
        <p class="text-sm text-muted">Não foi possível carregar os detalhes agora. Tente novamente em instantes.</p>
      `;
    }
  }

  async fetchWikipediaTeamSummary(team) {
    const searchQueries = [
      `Seleção ${team.name} futebol`,
      `${team.name} seleção nacional de futebol`,
      `${team.name} futebol`
    ];

    let pageTitle = '';
    for (const query of searchQueries) {
      const searchUrl = `${WIKIPEDIA_API_BASE}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`;
      const response = await fetch(searchUrl);
      if (!response.ok) continue;
      const data = await response.json();
      pageTitle = data?.query?.search?.[0]?.title || '';
      if (pageTitle) break;
    }

    if (!pageTitle) {
      return null;
    }

    const summaryUrl = `${WIKIPEDIA_SUMMARY_BASE}${encodeURIComponent(pageTitle)}`;
    const summaryResponse = await fetch(summaryUrl);
    if (!summaryResponse.ok) return null;
    const summaryData = await summaryResponse.json();

    return {
      title: summaryData?.title || pageTitle,
      description: summaryData?.description || '',
      extract: summaryData?.extract || '',
      url: summaryData?.content_urls?.desktop?.page || ''
    };
  }

  async fetchTeamNews(team) {
    const today = new Date();
    const teamName = normalizeText(team.name);

    for (let offset = 0; offset <= 3; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      const url = `${WIKIMEDIA_FEATURED_BASE}/${year}/${month}/${day}`;
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();
        const stories = (data?.news || []).map((story) => {
          const firstLink = story?.links?.[0];
          return {
            title: firstLink?.title || story?.story || '',
            url: firstLink?.content_urls?.desktop?.page || '',
            description: firstLink?.description || firstLink?.extract || ''
          };
        }).filter(item => item.title && item.url);

        const related = stories.filter((item) => {
          const fullText = normalizeText(`${item.title} ${item.description}`);
          return fullText.includes(teamName);
        });

        if (related.length) return related.slice(0, MAX_TEAM_NEWS_ITEMS);
      } catch (error) {
        continue;
      }
    }

    return [];
  }

  extractCuriosities(text) {
    if (!text) return [];
    return text
      .split(/[.!?]\s+/)
      .map(item => item.trim())
      .filter(item => item.length > MIN_CURIOSITY_LENGTH)
      .slice(0, MAX_TEAM_CURIOSITIES);
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
