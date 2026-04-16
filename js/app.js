// CopaDataHub 2026 — Main Application Controller

import { Router } from './router.js';
import { icon } from './icons.js';
import { TEAMS, getTeam } from './data.js';
import { loadState, saveState, addXP, savePrediction, recordTrivia, updateStreak, setFavoriteTeam } from './state.js';
import { updateCountdown, showToast } from './components.js';
import { renderHome, renderMatches, renderGroups, renderFanzone, renderStadiums, renderSettings, renderTeam } from './pages.js';
import { setupInstallPrompt, triggerInstall, hideInstallBanner } from './pwa.js';

const WIKIPEDIA_API_BASE = 'https://pt.wikipedia.org/w/api.php';
const WIKIPEDIA_SUMMARY_BASE = 'https://pt.wikipedia.org/api/rest_v1/page/summary/';
const WIKIMEDIA_FEATURED_BASE = 'https://api.wikimedia.org/feed/v1/wikipedia/pt/featured';
const MAX_TEAM_NEWS_ITEMS = 3;
const MAX_TEAM_CURIOSITIES = 3;
const MAX_NEWS_SEARCH_DAYS = 3;
const MIN_CURIOSITY_LENGTH = 40;
const HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const PT_SENTENCE_SEGMENTER = (typeof Intl !== 'undefined' && Intl.Segmenter)
  ? new Intl.Segmenter('pt', { granularity: 'sentence' })
  : null;

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isTrustedWikiUrl(rawUrl = '') {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    return (
      parsed.hostname === 'wikipedia.org' ||
      parsed.hostname.endsWith('.wikipedia.org') ||
      parsed.hostname === 'wikimedia.org' ||
      parsed.hostname.endsWith('.wikimedia.org')
    );
  } catch (error) {
    return false;
  }
}

class App {
  constructor() {
    this.state = loadState();
    this.router = new Router();
    this.countdownInterval = null;
    this.teamCache = new Map();
    this.teamPrefetches = new Map();

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

    updateStreak(this.state);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }

    setupInstallPrompt(this.state.settings.installDismissed);

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

    const renderPage = (renderFn, ...args) => {
      pageContainer.innerHTML = renderFn(this.state, ...args);
      window.scrollTo(0, 0);
      this.bindPageEvents();
    };

    this.router.addRoute('home', () => renderPage(renderHome));
    this.router.addRoute('matches', () => renderPage(renderMatches));
    this.router.addRoute('groups', () => renderPage(renderGroups));
    this.router.addRoute('fanzone', () => renderPage(renderFanzone));
    this.router.addRoute('stadiums', () => renderPage(renderStadiums));
    this.router.addRoute('settings', () => renderPage(renderSettings));
    this.router.addRoute('team', (params) => {
      const rawCode = (params?.[0] || '').toUpperCase();
      renderPage(renderTeam, rawCode);
      const team = getTeam(rawCode);
      if (team) this.loadTeamPageContent(team);
    });

    this.router.onNavigate = (route) => this.updateNavHighlight(route);
  }

  setupNavigation() {
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

    // Navegação para a página de detalhes do time (Grupos + outras páginas)
    document.querySelectorAll('[data-team-detail]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const code = trigger.dataset.teamDetail;
        if (code) this.router.navigate('team', { params: [code] });
      });
    });

    // Prefetch Wikipedia ao hover/touchstart em links de time
    document.querySelectorAll('[data-team-prefetch]').forEach((el) => {
      const prefetch = () => {
        const code = el.dataset.teamPrefetch;
        if (!code) return;
        const team = getTeam(code);
        if (team) this.prefetchTeamSummary(team);
      };
      el.addEventListener('mouseenter', prefetch, { passive: true });
      el.addEventListener('touchstart', prefetch, { passive: true });
    });

    // Eventos específicos da página de time
    this.bindTeamPageEvents();

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

  bindTeamPageEvents() {
    const hero = document.querySelector('.team-page__hero');
    if (!hero) return;

    const backBtn = document.getElementById('team-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          this.router.navigate('groups');
        }
      });
    }

    const favoriteBtn = document.getElementById('team-favorite-btn');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', () => {
        const code = favoriteBtn.dataset.team;
        const result = setFavoriteTeam(this.state, code);
        if (!result.changed) {
          showToast('Esta já é a sua seleção favorita.', 'info');
          return;
        }
        const team = getTeam(code);
        const flag = team ? team.flag : '⚽';
        if (result.xpAwarded > 0) {
          showToast(`${flag} Seleção favorita definida! +${result.xpAwarded} XP`, 'xp');
        } else {
          showToast(`${flag} Nova seleção favorita: ${team?.name || code}`, 'success');
        }
        if (result.leveledUp) {
          setTimeout(() => showToast(`🎉 Nível ${result.newLevel} alcançado!`, 'success'), 800);
        }
        this.router.navigate('team', { params: [code], replace: true });
      });
    }

    const shareBtn = document.getElementById('team-share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const code = shareBtn.dataset.team;
        const team = getTeam(code);
        if (!team) return;
        const shareData = {
          title: `${team.name} no CopaDataHub 2026`,
          text: `Veja o dossiê de ${team.flag} ${team.name} no CopaDataHub 2026!`,
          url: `${window.location.origin}/team/${encodeURIComponent(code)}`
        };
        try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareData.url);
            showToast('🔗 Link copiado para a área de transferência', 'success');
          } else {
            showToast('Compartilhamento não suportado neste navegador.', 'error');
          }
        } catch (error) {
          if (error?.name !== 'AbortError') {
            showToast('Não foi possível compartilhar agora.', 'error');
          }
        }
      });
    }
  }

  async loadTeamPageContent(team) {
    const hero = document.querySelector('.team-page__hero');
    if (!hero || hero.dataset.teamCode !== team.code) return;

    const wikiEl = document.getElementById('team-wiki-content');
    const curiositiesEl = document.getElementById('team-curiosities');
    const newsEl = document.getElementById('team-news');
    const linkEl = document.getElementById('team-wiki-link');

    const cached = this.teamCache.get(team.code);
    if (cached) {
      this.renderTeamContent(team, cached, { wikiEl, curiositiesEl, newsEl, linkEl });
      return;
    }

    try {
      const [wiki, news] = await Promise.all([
        this.fetchWikipediaTeamSummary(team),
        this.fetchTeamNews(team)
      ]);

      const payload = { wiki, news };
      this.teamCache.set(team.code, payload);

      const currentHero = document.querySelector('.team-page__hero');
      if (!currentHero || currentHero.dataset.teamCode !== team.code) return;

      this.renderTeamContent(team, payload, {
        wikiEl: document.getElementById('team-wiki-content'),
        curiositiesEl: document.getElementById('team-curiosities'),
        newsEl: document.getElementById('team-news'),
        linkEl: document.getElementById('team-wiki-link')
      });
    } catch (error) {
      console.error('Erro ao carregar dossiê da seleção:', error);
      if (wikiEl) {
        wikiEl.innerHTML = '<p class="text-sm text-muted">Não foi possível carregar o dossiê agora. Verifique sua conexão e tente novamente.</p>';
      }
      if (curiositiesEl) curiositiesEl.innerHTML = '<li class="text-sm text-muted">Curiosidades indisponíveis no momento.</li>';
      if (newsEl) newsEl.innerHTML = '<p class="text-sm text-muted">Notícias indisponíveis no momento.</p>';
    }
  }

  renderTeamContent(team, { wiki, news }, { wikiEl, curiositiesEl, newsEl, linkEl }) {
    if (wikiEl) {
      const description = wiki?.description ? escapeHTML(wiki.description) : '';
      const extract = wiki?.extract
        ? escapeHTML(wiki.extract)
        : 'Não foi possível recuperar o resumo enciclopédico desta seleção.';
      wikiEl.innerHTML = `
        ${description ? `<p class="team-page__wiki-lead"><strong>${description}</strong></p>` : ''}
        <p class="team-page__wiki-body">${extract}</p>
      `;
    }

    if (curiositiesEl) {
      const curiosities = this.extractCuriosities(wiki?.extract || '');
      curiositiesEl.innerHTML = curiosities.length
        ? curiosities.map(item => `<li>${escapeHTML(item)}</li>`).join('')
        : '<li class="text-sm text-muted">Sem curiosidades disponíveis para esta seleção.</li>';
    }

    if (newsEl) {
      const safeNews = (news || []).filter(item => isTrustedWikiUrl(item.url));
      if (safeNews.length) {
        newsEl.innerHTML = safeNews.map(item => `
          <a class="team-page__news-item" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">
            <span class="team-page__news-title">${escapeHTML(item.title)}</span>
            ${item.description ? `<span class="team-page__news-desc">${escapeHTML(item.description)}</span>` : ''}
          </a>
        `).join('');
      } else {
        newsEl.innerHTML = '<p class="text-sm text-muted">Nenhuma notícia recente relacionada nos últimos dias.</p>';
      }
    }

    if (linkEl) {
      const safeWikiUrl = isTrustedWikiUrl(wiki?.url) ? wiki.url : '';
      linkEl.innerHTML = safeWikiUrl
        ? `<a href="${escapeHTML(safeWikiUrl)}" target="_blank" rel="noopener noreferrer">${icon('globe', 14)} Abrir na Wikipedia</a>`
        : '';
    }
  }

  prefetchTeamSummary(team) {
    if (this.teamCache.has(team.code) || this.teamPrefetches.has(team.code)) return;
    const promise = Promise.all([
      this.fetchWikipediaTeamSummary(team).catch(() => null),
      this.fetchTeamNews(team).catch(() => [])
    ]).then(([wiki, news]) => {
      this.teamCache.set(team.code, { wiki, news });
      this.teamPrefetches.delete(team.code);
    });
    this.teamPrefetches.set(team.code, promise);
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
    const baseTime = Date.now();
    const teamName = normalizeText(team.name);

    for (let offset = 0; offset <= MAX_NEWS_SEARCH_DAYS; offset++) {
      const date = new Date(baseTime - (offset * 24 * 60 * 60 * 1000));
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

    const sentences = PT_SENTENCE_SEGMENTER
      ? Array.from(PT_SENTENCE_SEGMENTER.segment(text), part => part.segment.trim())
      : text.split(/[.!?](?:\s+|$)/).map(item => item.trim());

    return sentences
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
