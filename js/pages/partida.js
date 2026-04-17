import { icon } from '../icons.js';
import { escapeHTML } from '../util/html.js';
import { setSEO } from '../util/seo.js';
import { matchSlug, findFixtureBySlug, matchPhase, predictionResultXP } from '../util/match.js';
import { FIXTURES, getTeam, getStadium, getTeamApiId } from '../data.js';
import { fetchMatchData, fetchHeadToHead } from '../api/match.js';
import { fetchSquad } from '../api/squad.js';
import { showToast } from '../components/toast.js';
import { renderPredictionBar } from '../components/predictionBar.js';
import { renderMatchHero, tickCountdown } from '../components/match/matchHero.js';
import {
  renderH2H, renderKeyPlayers, renderTimeline,
  renderPulse, bindPulse, renderPoll, bindPolls,
  renderLiveStats, renderRecap, renderRatings, extractRatings
} from '../components/match/matchSections.js';
import { savePrediction, addXP } from '../state.js';

let pollTimer = null;
let countdownTimer = null;

function notFound(slug) {
  return `
    <div class="team-page__notfound">
      <div class="section-title">${icon('info', 20)} Partida não encontrada</div>
      <p class="section-subtitle">O jogo <strong>${escapeHTML(slug)}</strong> não existe no calendário do Mundial 2026.</p>
      <a class="btn btn--primary" href="/jogos" data-route-link>${icon('calendar', 16)} Ver calendário</a>
    </div>
  `;
}

function predictionBox(state, fixture) {
  const existing = state.user.predictions.find(p => p.fixtureId === fixture.id);
  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  const phase = matchPhase(fixture);

  if (phase === 'finished') {
    if (!existing) return '';
    const xp = predictionResultXP(existing, fixture);
    const labelMap = { 100: '🎯 Placar exato!', 50: '✅ Acertou o vencedor', 5: '💪 Tente na próxima' };
    return `
      <div class="card prediction-result">
        <div class="prediction-result__lbl">Seu palpite</div>
        <div class="prediction-result__score">${existing.homeScore} × ${existing.awayScore}</div>
        <div class="prediction-result__xp">+${xp} XP · ${labelMap[xp] || '—'}</div>
      </div>
    `;
  }

  if (phase === 'live') {
    return existing ? `
      <div class="card prediction-locked">
        <div class="text-xs text-muted">Seu palpite (jogo iniciado)</div>
        <div class="font-display font-bold">${existing.homeScore} × ${existing.awayScore}</div>
      </div>
    ` : '';
  }

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
      <button class="btn btn--primary btn--sm btn--full" id="pred-save">${icon('check', 16)} Salvar Palpite</button>
    </div>
  `;
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

function render(state, params) {
  const slug = String(params?.slug || '').toLowerCase();
  const fixture = findFixtureBySlug(FIXTURES, slug);
  if (!fixture) return notFound(slug);

  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  if (!home || !away) return notFound(slug);

  const phase = matchPhase(fixture);
  const stadium = getStadium(fixture.stadium);

  return `
    <button class="team-page__back" id="match-back-btn" type="button" aria-label="Voltar">
      ${icon('arrowLeft', 18)} <span>Voltar</span>
    </button>

    ${renderMatchHero(fixture, home, away)}

    <div class="match-page" data-fixture="${escapeHTML(String(fixture.id))}" data-phase="${phase}">

      ${predictionBox(state, fixture)}

      ${phase === 'pre' ? `
        <section class="match-section">
          <div class="section-title">${icon('zap', 18)} Previsão IA</div>
          ${renderPredictionBar(55, 25, 20, fixture.home, fixture.away)}
        </section>

        <section class="match-section">
          <div class="section-title">${icon('shield', 18)} Confronto Direto</div>
          <div id="match-h2h"><p class="text-sm text-muted">Carregando histórico…</p></div>
        </section>

        <section class="match-section">
          <div class="section-title">${icon('users', 18)} Jogadores em Destaque</div>
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
      ` : ''}

      ${phase === 'live' ? `
        <section class="match-section">
          <div class="section-title">${icon('flame', 18)} Pulse da Torcida</div>
          ${renderPulse(fixture.id)}
        </section>

        <section class="match-section">
          <div class="section-title">${icon('zap', 18)} Enquete da Partida</div>
          ${renderPoll(fixture.id, 'Quem vai marcar o próximo gol?', [home.code, away.code, 'Sem gols'])}
        </section>

        <section class="match-section">
          <div class="section-title">${icon('barChart', 18)} Estatísticas Ao Vivo</div>
          <div id="match-live-stats"><p class="text-sm text-muted">Carregando estatísticas…</p></div>
        </section>

        <section class="match-section">
          <div class="section-title">${icon('calendar', 18)} Eventos da Partida</div>
          <div id="match-timeline"><p class="text-sm text-muted">Aguardando eventos…</p></div>
        </section>
      ` : ''}

      ${phase === 'finished' ? `
        <section class="match-section">
          <div class="section-title">${icon('sparkles', 18)} Resumo</div>
          <div id="match-recap"><p class="text-sm text-muted">Carregando resumo…</p></div>
        </section>

        <section class="match-section">
          <div class="section-title">${icon('award', 18)} Avaliações</div>
          <div id="match-ratings"><p class="text-sm text-muted">Carregando avaliações…</p></div>
        </section>

        <section class="match-section">
          <div class="section-title">${icon('barChart', 18)} Estatísticas Finais</div>
          <div id="match-final-stats"></div>
        </section>

        <section class="match-section">
          <div class="section-title">${icon('calendar', 18)} Eventos</div>
          <div id="match-timeline"></div>
        </section>
      ` : ''}

      <section class="match-section">
        ${transmissaoBox(stadium)}
      </section>

    </div>
  `;
}

async function loadPreMatch(fixture, home, away) {
  const homeApi = getTeamApiId(home.code);
  const awayApi = getTeamApiId(away.code);

  const [h2h, homeSquad, awaySquad] = await Promise.all([
    fetchHeadToHead(homeApi, awayApi).catch(() => []),
    fetchSquad(home.code).catch(() => null),
    fetchSquad(away.code).catch(() => null)
  ]);

  const h2hEl = document.getElementById('match-h2h');
  if (h2hEl) h2hEl.innerHTML = renderH2H(h2h, home, away);

  const keyHomeEl = document.getElementById('match-key-home');
  const keyAwayEl = document.getElementById('match-key-away');
  if (keyHomeEl) keyHomeEl.innerHTML = renderKeyPlayers((homeSquad?.players || []).slice(0, 3));
  if (keyAwayEl) keyAwayEl.innerHTML = renderKeyPlayers((awaySquad?.players || []).slice(0, 3));
}

async function loadLiveOrFinished(fixture, home, away, phase) {
  const data = await fetchMatchData(fixture.id, phase);
  if (!data) return;

  const timelineEl = document.getElementById('match-timeline');
  if (timelineEl) timelineEl.innerHTML = renderTimeline(data.events, home, away);

  if (phase === 'live') {
    const statsEl = document.getElementById('match-live-stats');
    if (statsEl) statsEl.innerHTML = renderLiveStats(data.statistics, data.home, data.away);
  } else {
    const recapEl = document.getElementById('match-recap');
    if (recapEl) recapEl.innerHTML = renderRecap(fixture, data.events, home, away);
    const ratingsEl = document.getElementById('match-ratings');
    if (ratingsEl) ratingsEl.innerHTML = renderRatings(extractRatings(data.players));
    const fStatsEl = document.getElementById('match-final-stats');
    if (fStatsEl) fStatsEl.innerHTML = renderLiveStats(data.statistics, data.home, data.away);
  }
}

function bindEvents(state, { router, params }) {
  const slug = String(params?.slug || '').toLowerCase();
  const fixture = findFixtureBySlug(FIXTURES, slug);

  if (!fixture) {
    setSEO({ title: 'Partida não encontrada', description: 'Jogo não localizado no calendário.', canonical: window.location.pathname });
    return;
  }

  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  const phase = matchPhase(fixture);
  const dateLabel = new Date(`${fixture.date}T${fixture.time}:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  setSEO({
    title: `${home.name} vs ${away.name} — ${dateLabel}`,
    description: `${home.name} enfrenta ${away.name} pelo Grupo ${fixture.group} do Mundial 2026 em ${dateLabel}. Acompanhe escalações, estatísticas, eventos ao vivo e palpites.`,
    canonical: window.location.pathname,
    keywords: `${home.name} x ${away.name}, mundial 2026, grupo ${fixture.group}, ao vivo, escalação`,
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

  // Palpite
  const saveBtn = document.getElementById('pred-save');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    const h = parseInt(document.getElementById('pred-home').value) || 0;
    const a = parseInt(document.getElementById('pred-away').value) || 0;
    savePrediction(state, fixture.id, h, a);
    const r = addXP(state, 15);
    showToast(`⚽ Palpite salvo! +15 XP`, 'xp');
    if (r.leveledUp) setTimeout(() => showToast(`🎉 Nível ${r.newLevel}!`, 'success'), 800);
    setTimeout(() => router.navigate('partida', { params: { slug }, replace: true }), 600);
  });

  // Pulse + Polls
  bindPulse();
  bindPolls();

  // Countdown ticker
  if (countdownTimer) clearInterval(countdownTimer);
  if (phase === 'pre') {
    countdownTimer = setInterval(() => tickCountdown(fixture), 1000);
  }

  // Carregamento por fase
  if (phase === 'pre') {
    loadPreMatch(fixture, home, away);
  } else {
    loadLiveOrFinished(fixture, home, away, phase);
    // Polling 30s para LIVE
    if (pollTimer) clearInterval(pollTimer);
    if (phase === 'live') {
      pollTimer = setInterval(() => loadLiveOrFinished(fixture, home, away, phase), 30000);
    }
  }
}

export default { render, bindEvents };
