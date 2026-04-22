import { icon } from '../icons.js';
import { escapeHTML } from '../util/html.js';
import { setSEO } from '../util/seo.js';
import { matchSlug, findFixtureBySlug, matchPhase, predictionResultXP } from '../util/match.js';
import { FIXTURES, getTeam, getStadium, getTeamApiId } from '../data.js';
import { fetchMatchData, fetchHeadToHead, fetchInjuries, fetchTeamForm, fetchWeather } from '../api/match.js';
import { fetchSquad } from '../api/squad.js';
import { getApiError, describeApiError, ERROR_KIND, onApiStatusChange } from '../util/apiStatus.js';
import { applyMockToFixture } from '../util/mockMode.js';
import { showToast } from '../components/toast.js';
import { renderPredictionBar } from '../components/predictionBar.js';
import { renderMatchHero, tickCountdown } from '../components/match/matchHero.js';
import {
  renderH2H, renderKeyPlayers, renderTimeline,
  renderPulse, bindPulse, renderPoll, bindPolls,
  renderLiveStats, renderRecap, renderRatings, extractRatings,
  renderHighlightCards, renderMatchTabs, bindMatchTabs,
  renderMatchBriefing
} from '../components/match/matchSections.js';
import {
  renderRefereeCard, renderWeatherCard, renderInjuriesList,
  renderTeamForm, renderGoalBreakdown
} from '../components/match/matchInfoCards.js';
import { renderLineupsBoard } from '../components/match/lineupField.js';
import { renderMomentumChart } from '../components/attackMomentum.js';
import { renderShotMap } from '../components/shotMap.js';
import { renderXgTimeline } from '../components/xgTimeline.js';
import { savePrediction, addXP } from '../state.js';
import { openModoJogo, closeModoJogo } from '../components/matchModoJogo.js';
import { bindPlayerCards } from '../components/playerQuickCard.js';

let pollTimer = null;
let countdownTimer = null;
let apiStatusUnsub = null;

function renderApiBanner(err) {
  const host = document.getElementById('match-api-banner');
  if (!host) return;
  const msg = describeApiError(err);
  if (!msg) {
    host.innerHTML = '';
    return;
  }
  host.innerHTML = `
    <div class="api-warning" role="status">
      <span class="api-warning__icon" aria-hidden="true">⚠️</span>
      <div class="api-warning__body">
        ${escapeHTML(msg).replace('Configurações', '<a href="/configuracoes" data-route-link>Configurações</a>')}
      </div>
    </div>
  `;
}

function notFound(slug) {
  return `
    <div class="team-page__notfound">
      <div class="section-title">${icon('info', 20)} Partida não encontrada</div>
      <p class="section-subtitle">O jogo <strong>${escapeHTML(slug)}</strong> não existe no calendário do Mundial 2026.</p>
      <a class="btn btn--primary" href="/jogos" data-route-link>${icon('calendar', 16)} Ver calendário</a>
    </div>
  `;
}

function predictionBox(state, fixture, confidence) {
  const existing = state.user.predictions.find(p => p.fixtureId === fixture.id);
  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  const phase = matchPhase(fixture);

  if (phase === 'finished') {
    if (!existing) return '';
    const xp = predictionResultXP(existing, fixture);
    const multiplier = existing.confidence || 1;
    const earnedXP = Math.round(xp * multiplier);
    const labelMap = { 100: '🎯 Placar exato!', 50: '✅ Acertou o vencedor', 5: '💪 Tente na próxima' };
    return `
      <div class="card prediction-result">
        <div class="prediction-result__lbl">Seu palpite</div>
        <div class="prediction-result__score">${existing.homeScore} × ${existing.awayScore}</div>
        ${existing.confidence > 1 ? `<div class="prediction-result__conf">${'⭐'.repeat(existing.confidence)} confiança</div>` : ''}
        <div class="prediction-result__xp">+${earnedXP} XP · ${labelMap[xp] || '—'}</div>
      </div>
    `;
  }

  if (phase === 'live') {
    return existing ? `
      <div class="card prediction-locked">
        <div class="text-xs text-muted">Seu palpite (jogo iniciado)</div>
        <div class="font-display font-bold">${existing.homeScore} × ${existing.awayScore}</div>
        ${existing.confidence > 1 ? `<div class="text-xs text-muted mt-xs">${'⭐'.repeat(existing.confidence)} confiança</div>` : ''}
      </div>
    ` : '';
  }

  const confValue = existing?.confidence || 1;
  return `
    <div class="card prediction-box">
      <div class="prediction-box__title">${icon('target', 16)} Seu Palpite ${existing ? '(salvo)' : '(+15 XP)'}</div>
      <div class="prediction-box__inputs">
        <span>${home.flag} ${home.code}</span>
        <input type="number" min="0" max="20" id="pred-home" value="${existing?.homeScore ?? ''}" placeholder="0" aria-label="Placar ${home.name}">
        <span class="prediction-box__sep">×</span>
        <input type="number" min="0" max="20" id="pred-away" value="${existing?.awayScore ?? ''}" placeholder="0" aria-label="Placar ${away.name}">
        <span>${away.flag} ${away.code}</span>
      </div>
      <div class="prediction-box__confidence">
        <span class="prediction-box__conf-label">Confiança:</span>
        <div class="conf-stars" id="conf-stars">
          ${[1, 2, 3].map(n => `
            <button class="conf-star ${n <= confValue ? 'conf-star--active' : ''}" data-conf="${n}" type="button" aria-label="${n} estrela${n > 1 ? 's' : ''} de confiança">⭐</button>
          `).join('')}
        </div>
        <span class="prediction-box__conf-hint" id="conf-hint">${confXpHint(confValue)}</span>
      </div>
      <button class="btn btn--primary btn--sm btn--full" id="pred-save">${icon('check', 16)} Salvar Palpite</button>
    </div>
  `;
}

function confXpHint(conf) {
  const map = { 1: 'Bônus normal', 2: '1.5× XP no acerto', 3: '2× XP no acerto' };
  return map[conf] || '';
}

function transmissaoBox(stadium) {
  if (!stadium) return '';
  return `
    <div class="card transmission">
      ${icon('mapPin', 16)}
      <div>
        <div class="font-display font-bold">${escapeHTML(stadium.name)}</div>
        <div class="text-xs text-muted">${escapeHTML(stadium.city)}, ${escapeHTML(stadium.country)} · ${stadium.capacity.toLocaleString('pt-BR')} lugares</div>
      </div>
    </div>
  `;
}

function renderPreContent(fixture, home, away) {
  return `
    <div class="match-tab-panel" data-panel="overview">
      ${renderMatchBriefing(fixture, home, away)}
      ${renderPredictionBar(55, 25, 20, fixture.home, fixture.away)}

      <section class="match-section">
        <div class="section-title">${icon('zap', 18)} Forma Recente</div>
        <div id="match-form"><p class="text-sm text-muted">Carregando últimos jogos…</p></div>
      </section>

      <section class="match-section">
        <div class="section-title">${icon('eye', 18)} Olho neles</div>
        <div class="key-grid">
          <div>
            <div class="key-grid__lbl">${home.flag} ${escapeHTML(home.code)}</div>
            <div id="match-key-home"><p class="text-sm text-muted">Carregando…</p></div>
          </div>
          <div>
            <div class="key-grid__lbl">${away.flag} ${escapeHTML(away.code)}</div>
            <div id="match-key-away"><p class="text-sm text-muted">Carregando…</p></div>
          </div>
        </div>
      </section>

      <section class="match-section">
        <div class="section-title">${icon('shield', 18)} Retrospecto</div>
        <div id="match-h2h"><p class="text-sm text-muted">Carregando histórico…</p></div>
      </section>

      <section class="match-section">
        <div class="section-title">${icon('info', 18)} Informações da Partida</div>
        <div class="match-info-grid">
          <div id="match-referee"></div>
          <div id="match-weather"></div>
        </div>
      </section>

      <section class="match-section">
        <div class="section-title">🩹 Desfalques</div>
        <div id="match-injuries"><p class="text-sm text-muted">Carregando desfalques…</p></div>
      </section>
    </div>

    <div class="match-tab-panel" data-panel="lineups" hidden>
      <section class="match-section">
        <div class="section-title">${icon('users', 18)} Provável Escalação</div>
        <div id="match-lineups"><p class="text-sm text-muted">Buscando escalação provável…</p></div>
      </section>
    </div>
  `;
}

function renderLiveContent(fixture, home, away) {
  return `
    <div class="match-tab-panel" data-panel="live">
      <section class="match-section">
        <div class="section-title">${icon('flame', 18)} Pulse da Torcida</div>
        ${renderPulse(fixture.id)}
      </section>
      <section class="match-section">
        <div class="section-title">${icon('zap', 18)} Enquete da Partida</div>
        ${renderPoll(fixture.id, 'Quem vai marcar o próximo gol?', [home.code, away.code, 'Sem gols'])}
      </section>
      <section class="match-section">
        <div class="section-title">${icon('info', 18)} Arbitragem</div>
        <div id="match-referee"></div>
      </section>
    </div>
    <div class="match-tab-panel" data-panel="lineups" hidden>
      <section class="match-section">
        <div class="section-title">${icon('users', 18)} Escalação</div>
        <div id="match-lineups"><p class="text-sm text-muted">Carregando escalação…</p></div>
      </section>
    </div>
    <div class="match-tab-panel" data-panel="stats" hidden>
      <section class="match-section">
        <div class="section-title">${icon('barChart', 18)} Estatísticas Ao Vivo</div>
        <div id="match-live-stats"><p class="text-sm text-muted">Carregando estatísticas…</p></div>
      </section>
      <section class="match-section" id="match-momentum-wrap" style="display:none">
        <div class="section-title">${icon('zap', 18)} Pressão da Partida</div>
        <div id="match-momentum"></div>
      </section>
    </div>
    <div class="match-tab-panel" data-panel="events" hidden>
      <section class="match-section">
        <div class="section-title">${icon('calendar', 18)} Eventos da Partida</div>
        <div id="match-timeline"><p class="text-sm text-muted">Aguardando eventos…</p></div>
      </section>
    </div>
  `;
}

function renderFinishedContent(fixture, home, away) {
  return `
    <div class="match-tab-panel" data-panel="recap">
      <section class="match-section">
        <div class="section-title">${icon('sparkles', 18)} Destaques</div>
        <div id="match-highlights"><p class="text-sm text-muted">Carregando destaques…</p></div>
        <div id="match-goal-breakdown"></div>
      </section>
      <section class="match-section">
        <div class="section-title">${icon('award', 18)} Avaliações</div>
        <div id="match-ratings"><p class="text-sm text-muted">Carregando avaliações…</p></div>
      </section>
      <section class="match-section">
        <div class="section-title">${icon('info', 18)} Resumo</div>
        <div id="match-recap"><p class="text-sm text-muted">Carregando resumo…</p></div>
      </section>
      <section class="match-section">
        <div class="section-title">${icon('whistle', 18)} Arbitragem</div>
        <div id="match-referee"></div>
      </section>
    </div>
    <div class="match-tab-panel" data-panel="lineups" hidden>
      <section class="match-section">
        <div class="section-title">${icon('users', 18)} Escalação Final</div>
        <div id="match-lineups"><p class="text-sm text-muted">Carregando escalação…</p></div>
      </section>
    </div>
    <div class="match-tab-panel" data-panel="stats" hidden>
      <section class="match-section">
        <div class="section-title">${icon('barChart', 18)} Estatísticas Finais</div>
        <div id="match-final-stats"></div>
      </section>
      <section class="match-section" id="match-momentum-wrap" style="display:none">
        <div class="section-title">${icon('zap', 18)} Pressão da Partida</div>
        <div id="match-momentum"></div>
      </section>
      <section class="match-section" id="match-xg-wrap" style="display:none">
        <div class="section-title">${icon('target', 18)} Expected Goals</div>
        <div id="match-xg"></div>
      </section>
    </div>
    <div class="match-tab-panel" data-panel="vizual" hidden>
      <section class="match-section">
        <div id="match-shotmap"><p class="text-sm text-muted">Carregando mapa de chutes…</p></div>
      </section>
    </div>
    <div class="match-tab-panel" data-panel="events" hidden>
      <section class="match-section">
        <div class="section-title">${icon('calendar', 18)} Eventos</div>
        <div id="match-timeline"></div>
      </section>
    </div>
  `;
}

function render(state, params) {
  const slug = String(params?.slug || '').toLowerCase();
  let fixture = findFixtureBySlug(FIXTURES, slug);
  if (!fixture) return notFound(slug);

  fixture = applyMockToFixture(fixture);

  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  if (!home || !away) return notFound(slug);

  const phase = matchPhase(fixture);
  const stadium = getStadium(fixture.stadium);

  const tabContent = phase === 'pre'
    ? renderPreContent(fixture, home, away)
    : phase === 'live'
    ? renderLiveContent(fixture, home, away)
    : renderFinishedContent(fixture, home, away);

  return `
    <button class="team-page__back" id="match-back-btn" type="button" aria-label="Voltar">
      ${icon('arrowLeft', 18)} <span>Voltar</span>
    </button>

    ${renderMatchHero(fixture, home, away)}

    <div class="match-page" data-fixture="${escapeHTML(String(fixture.id))}" data-phase="${phase}">

      <div id="match-api-banner"></div>

      ${predictionBox(state, fixture)}

      ${renderMatchTabs(phase)}

      ${tabContent}

      <section class="match-section">
        ${transmissaoBox(stadium)}
      </section>

    </div>
  `;
}

async function loadPreMatch(fixture, home, away, loadedSquads = {}) {
  const homeApi = getTeamApiId(home.code);
  const awayApi = getTeamApiId(away.code);
  const stadium = getStadium(fixture.stadium);
  const kickoffISO = `${fixture.date}T${fixture.time}:00Z`;

  const [h2h, homeSquad, awaySquad, injuries, formHome, formAway, weather, matchData] = await Promise.all([
    fetchHeadToHead(homeApi, awayApi).catch(() => []),
    fetchSquad(home.code).catch(() => null),
    fetchSquad(away.code).catch(() => null),
    fetchInjuries(fixture.id).catch(() => []),
    fetchTeamForm(homeApi).catch(() => []),
    fetchTeamForm(awayApi).catch(() => []),
    fetchWeather(stadium?.lat, stadium?.lng, kickoffISO).catch(() => null),
    fetchMatchData(fixture.id, 'pre').catch(() => null)
  ]);

  if (homeSquad) loadedSquads[home.code] = homeSquad;
  if (awaySquad) loadedSquads[away.code] = awaySquad;

  const noKeyMsg = '<p class="text-sm text-muted">Indisponível — configure sua chave da API em <a href="/configuracoes" data-route-link>Configurações</a>.</p>';
  const emptyMsg = '<p class="text-sm text-muted">Dados indisponíveis no momento.</p>';

  const h2hEl = document.getElementById('match-h2h');
  if (h2hEl) {
    h2hEl.innerHTML = h2h?.length
      ? renderH2H(h2h, home, away)
      : (getApiError()?.kind === ERROR_KIND.NO_KEY ? noKeyMsg : '<p class="text-sm text-muted">Sem histórico de confrontos disponível.</p>');
  }

  const formEl = document.getElementById('match-form');
  if (formEl) {
    const hasForm = (formHome?.length || 0) + (formAway?.length || 0) > 0;
    formEl.innerHTML = hasForm
      ? renderTeamForm(formHome, formAway, home, away)
      : (getApiError()?.kind === ERROR_KIND.NO_KEY ? noKeyMsg : '<p class="text-sm text-muted">Forma recente indisponível.</p>');
  }

  const refEl = document.getElementById('match-referee');
  if (refEl) refEl.innerHTML = renderRefereeCard(matchData?.referee)
    || '<p class="text-xs text-muted">Árbitro ainda não confirmado.</p>';

  const wxEl = document.getElementById('match-weather');
  if (wxEl) wxEl.innerHTML = renderWeatherCard(weather, stadium)
    || '<p class="text-xs text-muted">Previsão do tempo indisponível.</p>';

  const injEl = document.getElementById('match-injuries');
  if (injEl) {
    const apiHome = { id: homeApi, name: home.name, flag: home.flag };
    const apiAway = { id: awayApi, name: away.name, flag: away.flag };
    if (!injuries?.length && getApiError()?.kind === ERROR_KIND.NO_KEY) {
      injEl.innerHTML = noKeyMsg;
    } else {
      injEl.innerHTML = renderInjuriesList(injuries, apiHome, apiAway);
    }
  }

  const lineupsEl = document.getElementById('match-lineups');
  if (lineupsEl) {
    const apiHome = { id: homeApi, name: home.name };
    const apiAway = { id: awayApi, name: away.name };
    if (!matchData?.lineups?.length && getApiError()?.kind === ERROR_KIND.NO_KEY) {
      lineupsEl.innerHTML = noKeyMsg;
    } else {
      lineupsEl.innerHTML = renderLineupsBoard(matchData?.lineups, apiHome, apiAway);
    }
  }

  const keyHomeEl = document.getElementById('match-key-home');
  const keyAwayEl = document.getElementById('match-key-away');
  const fallback = getApiError()?.kind === ERROR_KIND.NO_KEY ? noKeyMsg : emptyMsg;

  if (keyHomeEl) {
    if (homeSquad?.players?.length) {
      keyHomeEl.innerHTML = renderKeyPlayers(homeSquad.players.slice(0, 3));
      keyHomeEl.querySelectorAll('.key-player').forEach((el, i) => {
        const p = homeSquad.players[i];
        const name = p?.player?.name || p?.name || '';
        if (name) el.setAttribute('data-player-card', escapeHTML(name));
        el.setAttribute('data-team-code', home.code);
      });
    } else {
      keyHomeEl.innerHTML = fallback;
    }
  }
  if (keyAwayEl) {
    if (awaySquad?.players?.length) {
      keyAwayEl.innerHTML = renderKeyPlayers(awaySquad.players.slice(0, 3));
      keyAwayEl.querySelectorAll('.key-player').forEach((el, i) => {
        const p = awaySquad.players[i];
        const name = p?.player?.name || p?.name || '';
        if (name) el.setAttribute('data-player-card', escapeHTML(name));
        el.setAttribute('data-team-code', away.code);
      });
    } else {
      keyAwayEl.innerHTML = fallback;
    }
  }
}

async function loadLiveOrFinished(fixture, home, away, phase) {
  const data = await fetchMatchData(fixture.id, phase);
  if (!data) return;

  const timelineEl = document.getElementById('match-timeline');
  if (timelineEl) timelineEl.innerHTML = renderTimeline(data.events, home, away);

  const refEl = document.getElementById('match-referee');
  if (refEl) refEl.innerHTML = renderRefereeCard(data.referee)
    || '<p class="text-xs text-muted">Árbitro não informado.</p>';

  const lineupsEl = document.getElementById('match-lineups');
  if (lineupsEl) {
    const apiHome = { id: data.home?.id, name: data.home?.name || home.name };
    const apiAway = { id: data.away?.id, name: data.away?.name || away.name };
    lineupsEl.innerHTML = renderLineupsBoard(data.lineups, apiHome, apiAway);
  }

  if (phase === 'live') {
    const statsEl = document.getElementById('match-live-stats');
    if (statsEl) statsEl.innerHTML = renderLiveStats(data.statistics, data.home, data.away);

    const momEl = document.getElementById('match-momentum');
    const momWrap = document.getElementById('match-momentum-wrap');
    if (momEl && data.events?.length) {
      momEl.innerHTML = renderMomentumChart(data.events, home, away);
      if (momWrap) momWrap.style.display = '';
    }
  } else {
    const highlightsEl = document.getElementById('match-highlights');
    if (highlightsEl) {
      highlightsEl.innerHTML = renderHighlightCards(fixture, data.events, data.statistics, data.players, home, away)
        || '<p class="text-sm text-muted">Destaques indisponíveis.</p>';
    }

    const breakdownEl = document.getElementById('match-goal-breakdown');
    if (breakdownEl) breakdownEl.innerHTML = renderGoalBreakdown(data.events);

    const recapEl = document.getElementById('match-recap');
    if (recapEl) recapEl.innerHTML = renderRecap(fixture, data.events, home, away);

    const ratingsEl = document.getElementById('match-ratings');
    if (ratingsEl) ratingsEl.innerHTML = renderRatings(extractRatings(data.players));

    const fStatsEl = document.getElementById('match-final-stats');
    if (fStatsEl) fStatsEl.innerHTML = renderLiveStats(data.statistics, data.home, data.away);

    const momEl = document.getElementById('match-momentum');
    const momWrap = document.getElementById('match-momentum-wrap');
    if (momEl && data.events?.length) {
      momEl.innerHTML = renderMomentumChart(data.events, home, away);
      if (momWrap) momWrap.style.display = '';
    }

    const xgEl = document.getElementById('match-xg');
    const xgWrap = document.getElementById('match-xg-wrap');
    if (xgEl && data.events?.length) {
      xgEl.innerHTML = renderXgTimeline(data.events, home, away);
      if (xgWrap) xgWrap.style.display = '';
    }

    const shotEl = document.getElementById('match-shotmap');
    if (shotEl) {
      shotEl.innerHTML = renderShotMap(data.events, home, away, data.statistics);
    }
  }
}

function bindEvents(state, { router, params }) {
  const slug = String(params?.slug || '').toLowerCase();
  const rawFixture = findFixtureBySlug(FIXTURES, slug);

  if (!rawFixture) {
    setSEO({ title: 'Partida não encontrada', description: 'Jogo não localizado.', canonical: window.location.pathname });
    return;
  }

  const fixture = applyMockToFixture(rawFixture);
  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  const phase = matchPhase(fixture);

  const dateLabel = new Date(`${fixture.date}T${fixture.time}:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  setSEO({
    title: `${home.name} vs ${away.name} — ${dateLabel}`,
    description: `${home.name} enfrenta ${away.name} pelo Grupo ${fixture.group} do Mundial 2026 em ${dateLabel}.`,
    canonical: window.location.pathname,
    keywords: `${home.name} x ${away.name}, mundial 2026, grupo ${fixture.group}`,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `${home.name} vs ${away.name}`,
      startDate: `${fixture.date}T${fixture.time}:00`,
      sport: 'Soccer',
      homeTeam: { '@type': 'SportsTeam', name: home.name },
      awayTeam: { '@type': 'SportsTeam', name: away.name },
      location: { '@type': 'Place', name: getStadium(fixture.stadium)?.name || '' }
    }
  });

  // Voltar
  const backBtn = document.getElementById('match-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else router.navigate('jogos');
  });

  // Tabs
  bindMatchTabs();

  // Banner de status da API (re-renderiza quando estado muda)
  renderApiBanner(getApiError());
  if (apiStatusUnsub) apiStatusUnsub();
  apiStatusUnsub = onApiStatusChange((err) => renderApiBanner(err));

  // Confiança no palpite
  const confStars = document.getElementById('conf-stars');
  let selectedConf = parseInt(confStars?.querySelector('.conf-star--active')?.dataset.conf || '1');
  if (confStars) {
    confStars.addEventListener('click', (e) => {
      const btn = e.target.closest('.conf-star');
      if (!btn) return;
      selectedConf = parseInt(btn.dataset.conf);
      confStars.querySelectorAll('.conf-star').forEach((s, idx) => {
        s.classList.toggle('conf-star--active', idx < selectedConf);
      });
      const hint = document.getElementById('conf-hint');
      if (hint) hint.textContent = confXpHint(selectedConf);
    });
  }

  // Palpite
  const saveBtn = document.getElementById('pred-save');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    const h = parseInt(document.getElementById('pred-home')?.value) || 0;
    const a = parseInt(document.getElementById('pred-away')?.value) || 0;
    savePrediction(state, fixture.id, h, a, selectedConf);
    const xpBase = 15;
    const r = addXP(state, xpBase);
    showToast(`⚽ Palpite salvo! +${xpBase} XP ${'⭐'.repeat(selectedConf)}`, 'xp');
    if (r.leveledUp) setTimeout(() => showToast(`🎉 Nível ${r.newLevel}!`, 'success'), 800);
    setTimeout(() => router.navigate('partida', { params: { slug }, replace: true }), 600);
  });

  // Pulse + Polls
  bindPulse();
  bindPolls();

  // Countdown
  if (countdownTimer) clearInterval(countdownTimer);
  if (phase === 'pre') {
    countdownTimer = setInterval(() => tickCountdown(fixture), 1000);
  }

  // Modo Jogo (segunda tela ao vivo)
  const modoJogoBtn = document.getElementById('btn-modo-jogo');
  if (modoJogoBtn) {
    modoJogoBtn.addEventListener('click', () => openModoJogo(fixture, home, away));
  }

  // PlayerQuickCard — delegação de cliques no .match-page
  const matchPageEl = document.querySelector('.match-page');
  const loadedSquads = {};
  if (matchPageEl) bindPlayerCards(matchPageEl, loadedSquads, home, away);

  // Carregamento por fase
  if (phase === 'pre') {
    loadPreMatch(fixture, home, away, loadedSquads);
  } else {
    loadLiveOrFinished(fixture, home, away, phase);
    if (pollTimer) clearInterval(pollTimer);
    if (phase === 'live') {
      pollTimer = setInterval(() => loadLiveOrFinished(fixture, home, away, phase), 30000);
    }
  }

  // Fecha Modo Jogo ao sair da página
  return () => {
    closeModoJogo();
    if (apiStatusUnsub) { apiStatusUnsub(); apiStatusUnsub = null; }
  };
}

export default { render, bindEvents };
