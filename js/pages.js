// CopaDataHub 2026 — Page Renderers

import { icon } from './icons.js';
import { TEAMS, GROUPS, STADIUMS, FIXTURES, TRIVIA, getTeam, getTodayFixtures, getTeamFixtures, getGroupForTeam } from './data.js';
import {
  renderCountdown, renderXPBar, renderMatchCard,
  renderGroupTable, renderStadiumCard, renderStatBar,
  renderPredictionBar, showToast, renderTeamChip, renderTeamFixtureRow
} from './components.js';
import { getXPProgress, addXP, savePrediction, recordTrivia } from './state.js';

const HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

/**
 * ── HOME PAGE ──
 */
export function renderHome(state) {
  const fixtures = getTodayFixtures();
  const matchCards = fixtures.map(f => renderMatchCard(f)).join('');

  return `
    ${renderCountdown()}
    ${renderXPBar(state)}

    <!-- Cross-app link to UCL -->
    <a href="/champions" style="text-decoration: none; color: inherit; display: block; margin-bottom: var(--space-xl);">
      <div class="card card--interactive" style="background: linear-gradient(135deg, rgba(30,58,138,0.2), rgba(10,14,26,0.95)); border: 1px solid rgba(147,197,253,0.2);">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-md">
            <span style="font-size: 1.5rem;">⭐</span>
            <div>
              <div class="font-display font-bold" style="color: var(--color-ucl-star, #ffd700);">UCL DataHub Ao Vivo</div>
              <div class="text-sm text-muted">Acesso aos jogos reais (Ao Vivo) da Champions</div>
            </div>
          </div>
          ${icon('chevronRight', 20, 'text-muted')}
        </div>
      </div>
    </a>

    <div class="section-title">
      ${icon('calendar', 20)} Próximos Jogos
    </div>
    <div class="matches-list">
      ${matchCards}
    </div>

    <div class="mt-xl">
      <div class="section-title">
        ${icon('barChart', 20)} Torneio em Números
      </div>
      <div class="fanzone-stats">
        <div class="fanzone-stat">
          <span class="fanzone-stat__value fanzone-stat__value--gold">48</span>
          <span class="fanzone-stat__label">Seleções</span>
        </div>
        <div class="fanzone-stat">
          <span class="fanzone-stat__value fanzone-stat__value--emerald">104</span>
          <span class="fanzone-stat__label">Jogos</span>
        </div>
        <div class="fanzone-stat">
          <span class="fanzone-stat__value fanzone-stat__value--blue">16</span>
          <span class="fanzone-stat__label">Estádios</span>
        </div>
      </div>
    </div>

    <div class="mt-xl">
      <div class="section-title">
        ${icon('trophy', 20)} Acesse as Seções
      </div>
      <div class="matches-list">
        <div class="card card--interactive card--gold" data-nav="groups">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-md">
              ${icon('shield', 24, 'text-gold')}
              <div>
                <div class="font-display font-bold">Grupos & Classificação</div>
                <div class="text-sm text-muted">12 grupos, 48 seleções</div>
              </div>
            </div>
            ${icon('chevronRight', 20, 'text-muted')}
          </div>
        </div>

        <div class="card card--interactive" data-nav="matches">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-md">
              ${icon('target', 24, 'text-blue')}
              <div>
                <div class="font-display font-bold">Match Center</div>
                <div class="text-sm text-muted">Estatísticas e previsões ao vivo</div>
              </div>
            </div>
            ${icon('chevronRight', 20, 'text-muted')}
          </div>
        </div>

        <div class="card card--interactive" data-nav="fanzone">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-md">
              ${icon('gamepad', 24, 'text-emerald')}
              <div>
                <div class="font-display font-bold">FanZone</div>
                <div class="text-sm text-muted">Bolão, trivia e ranking</div>
              </div>
            </div>
            ${icon('chevronRight', 20, 'text-muted')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * ── MATCHES / MATCH CENTER PAGE ──
 */
export function renderMatches(state) {
  const allFixtures = FIXTURES;

  // Simulated live match for demo
  const demoMatch = {
    home: getTeam('BRA'),
    away: getTeam('FRA'),
    homeScore: 1,
    awayScore: 0,
    clock: '68:12',
    status: 'LIVE_2H'
  };

  return `
    <div class="section-title">
      ${icon('target', 20)} Match Center
    </div>
    <p class="section-subtitle">Acompanhe partidas ao vivo com estatísticas e previsão de IA</p>

    <!-- Demo Live Match -->
    <div class="card card--gold mb-xl">
      <div class="match-card">
        <div class="match-card__header">
          <span class="match-card__group">Grupo H</span>
          <span class="match-card__status live">AO VIVO · ${demoMatch.clock}</span>
        </div>
        <div class="match-card__teams">
          <a class="match-card__team match-card__team--link" href="/team/${encodeURIComponent(demoMatch.home.code)}" data-route-link data-team-prefetch="${demoMatch.home.code}" aria-label="Ver detalhes de ${demoMatch.home.name}">
            <span class="match-card__flag">${demoMatch.home.flag}</span>
            <span class="match-card__name">${demoMatch.home.code}</span>
          </a>
          <div class="match-card__score">
            <span>${demoMatch.homeScore}</span>
            <span class="match-card__score-sep">:</span>
            <span>${demoMatch.awayScore}</span>
          </div>
          <a class="match-card__team match-card__team--link" href="/team/${encodeURIComponent(demoMatch.away.code)}" data-route-link data-team-prefetch="${demoMatch.away.code}" aria-label="Ver detalhes de ${demoMatch.away.name}">
            <span class="match-card__flag">${demoMatch.away.flag}</span>
            <span class="match-card__name">${demoMatch.away.code}</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="card mb-lg" style="display: flex; flex-direction: column; gap: var(--space-lg); padding: var(--space-xl);">
      <div class="section-title" style="margin-bottom: 0;">${icon('barChart', 18)} Estatísticas</div>
      ${renderStatBar('Posse de Bola', 58, 42, true)}
      ${renderStatBar('Chutes ao Gol', 6, 3)}
      ${renderStatBar('Precisão de Passes', 89, 81, true)}
      ${renderStatBar('xG (Gols Esperados)', 1.84, 0.92)}
      ${renderStatBar('Escanteios', 5, 2)}
    </div>

    <!-- AI Prediction -->
    ${renderPredictionBar(65, 20, 15, 'BRA', 'FRA')}

    <!-- Upcoming matches -->
    <div class="mt-xl">
      <div class="section-title">${icon('calendar', 20)} Calendário</div>
      <div class="matches-list">
        ${allFixtures.slice(0, 8).map(f => renderMatchCard(f)).join('')}
      </div>
    </div>
  `;
}

/**
 * ── GROUPS PAGE ──
 */
export function renderGroups(state) {
  const groupEntries = Object.entries(GROUPS);

  // Filter tabs
  const filterHTML = `
    <div class="filter-tabs" id="group-filters">
      <button class="filter-tab active" data-filter="all">Todos</button>
      ${groupEntries.map(([id]) => `
        <button class="filter-tab" data-filter="${id}">Grupo ${id}</button>
      `).join('')}
    </div>
  `;

  const tablesHTML = groupEntries.map(([id, group]) => {
    return `<div class="group-wrapper" data-group="${id}">${renderGroupTable(id, group.teams)}</div>`;
  }).join('');

  return `
    <div class="section-title">
      ${icon('shield', 20)} Fase de Grupos
    </div>
    <p class="section-subtitle">12 grupos · Os 2 primeiros classificam-se diretamente + 8 melhores terceiros</p>

    ${filterHTML}

    <div class="groups-grid" id="groups-container">
      ${tablesHTML}
    </div>

    <p class="text-sm text-muted mt-md">
      ${icon('info', 14)} Toque em uma seleção para ver dossiê completo, jogos do time e curiosidades.
    </p>
  `;
}

/**
 * ── TEAM DETAIL PAGE ──
 */
export function renderTeam(state, teamCode) {
  const team = getTeam(teamCode);

  if (!team) {
    return `
      <div class="team-page__notfound">
        <div class="section-title">${icon('info', 20)} Seleção não encontrada</div>
        <p class="section-subtitle">O código <strong>${escapeHTML(String(teamCode || '').toUpperCase())}</strong> não corresponde a uma das 48 seleções.</p>
        <a class="btn btn--primary" href="/groups" data-route-link>${icon('shield', 16)} Voltar aos grupos</a>
      </div>
    `;
  }

  const group = getGroupForTeam(team.code);
  const teamFixtures = getTeamFixtures(team.code);
  const isFavorite = state.user.favoriteTeam === team.code;
  const favoriteTeam = state.user.favoriteTeam ? getTeam(state.user.favoriteTeam) : null;
  const canCompare = favoriteTeam && favoriteTeam.code !== team.code;

  const predictionsByFixture = new Map(
    (state.user.predictions || []).map(p => [p.fixtureId, p])
  );

  const groupRivals = group
    ? group.teams.filter(code => code !== team.code).map(code => renderTeamChip(code)).join('')
    : '';

  const fixturesHTML = teamFixtures.length
    ? teamFixtures.map(f => renderTeamFixtureRow(f, team.code, predictionsByFixture.get(f.id))).join('')
    : '<p class="text-sm text-muted">Nenhum jogo cadastrado ainda para esta seleção no MVP.</p>';

  const compareHTML = canCompare ? `
    <div class="team-page__compare" id="team-compare">
      <div class="team-page__compare-header">
        ${icon('gitCompare', 18, 'text-blue')}
        <span class="team-page__compare-title">Comparar com ${favoriteTeam.flag} ${escapeHTML(favoriteTeam.name)}</span>
      </div>
      <div class="team-page__compare-grid">
        <div class="team-page__compare-col">
          <div class="team-page__compare-flag">${favoriteTeam.flag}</div>
          <div class="team-page__compare-name">${escapeHTML(favoriteTeam.name)}</div>
          <div class="team-page__compare-row"><span>Ranking</span><strong>#${favoriteTeam.ranking}</strong></div>
          <div class="team-page__compare-row"><span>Confederação</span><strong>${escapeHTML(favoriteTeam.confederation)}</strong></div>
          <div class="team-page__compare-row"><span>Grupo</span><strong>${getGroupForTeam(favoriteTeam.code)?.id || '—'}</strong></div>
        </div>
        <div class="team-page__compare-vs">VS</div>
        <div class="team-page__compare-col">
          <div class="team-page__compare-flag">${team.flag}</div>
          <div class="team-page__compare-name">${escapeHTML(team.name)}</div>
          <div class="team-page__compare-row"><span>Ranking</span><strong>#${team.ranking}</strong></div>
          <div class="team-page__compare-row"><span>Confederação</span><strong>${escapeHTML(team.confederation)}</strong></div>
          <div class="team-page__compare-row"><span>Grupo</span><strong>${group?.id || '—'}</strong></div>
        </div>
      </div>
      <div class="team-page__compare-hint">
        Ranking FIFA mais baixo é melhor · diferença de ${Math.abs(favoriteTeam.ranking - team.ranking)} posições
      </div>
    </div>
  ` : '';

  const favoriteLabel = isFavorite ? 'Sua seleção' : 'Definir como favorita';
  const favoriteIcon = isFavorite ? 'heartFilled' : 'heart';

  return `
    <button class="team-page__back" id="team-back-btn" type="button" aria-label="Voltar">
      ${icon('arrowLeft', 18)} <span>Voltar</span>
    </button>

    <section class="team-page__hero" data-team-code="${escapeHTML(team.code)}">
      <div class="team-page__hero-flag" aria-hidden="true">${team.flag}</div>
      <div class="team-page__hero-info">
        <div class="team-page__hero-kicker">Seleção Nacional</div>
        <h1 class="team-page__hero-name">${escapeHTML(team.name)}</h1>
        <div class="team-page__hero-tags">
          <span class="team-page__tag">${escapeHTML(team.code)}</span>
          <span class="team-page__tag team-page__tag--muted">${escapeHTML(team.confederation)}</span>
          ${group ? `<span class="team-page__tag team-page__tag--muted">Grupo ${group.id}</span>` : ''}
          ${isFavorite ? `<span class="team-page__tag team-page__tag--gold">${icon('heartFilled', 12)} Sua seleção</span>` : ''}
        </div>
      </div>
      <div class="team-page__hero-stats">
        <div class="team-page__hero-stat">
          <span class="team-page__hero-stat-value">#${team.ranking}</span>
          <span class="team-page__hero-stat-label">Ranking FIFA</span>
        </div>
        <div class="team-page__hero-stat">
          <span class="team-page__hero-stat-value">${teamFixtures.length}</span>
          <span class="team-page__hero-stat-label">Jogos no MVP</span>
        </div>
        <div class="team-page__hero-stat">
          <span class="team-page__hero-stat-value">${group ? group.id : '—'}</span>
          <span class="team-page__hero-stat-label">Grupo</span>
        </div>
      </div>
    </section>

    <div class="team-page__actions">
      <button class="btn ${isFavorite ? 'btn--gold' : 'btn--primary'} team-page__action" id="team-favorite-btn" data-team="${escapeHTML(team.code)}" aria-pressed="${isFavorite}">
        ${icon(favoriteIcon, 16)} <span>${favoriteLabel}</span>
      </button>
      <button class="btn btn--ghost team-page__action" id="team-share-btn" data-team="${escapeHTML(team.code)}">
        ${icon('share2', 16)} <span>Compartilhar</span>
      </button>
    </div>

    ${compareHTML}

    <div class="team-page__section">
      <div class="section-title">${icon('calendar', 18)} Jogos da seleção</div>
      <p class="section-subtitle">Toque em um adversário para ver o dossiê dele.</p>
      <div class="team-page__fixtures">
        ${fixturesHTML}
      </div>
    </div>

    ${group ? `
      <div class="team-page__section">
        <div class="section-title">${icon('shield', 18)} Adversários no Grupo ${group.id}</div>
        <div class="team-page__chips">
          ${groupRivals}
        </div>
      </div>
    ` : ''}

    <div class="team-page__section" id="team-wiki-section">
      <div class="section-title">${icon('globe', 18)} Dossiê enciclopédico</div>
      <div class="team-page__wiki" id="team-wiki-content">
        <div class="team-page__skeleton team-page__skeleton--lg"></div>
        <div class="team-page__skeleton"></div>
        <div class="team-page__skeleton"></div>
      </div>
    </div>

    <div class="team-page__section" id="team-curiosities-section">
      <div class="section-title">${icon('sparkles', 18)} Curiosidades</div>
      <ul class="team-page__curiosities" id="team-curiosities">
        <li class="team-page__skeleton"></li>
        <li class="team-page__skeleton"></li>
        <li class="team-page__skeleton"></li>
      </ul>
    </div>

    <div class="team-page__section" id="team-news-section">
      <div class="section-title">${icon('newspaper', 18)} Notícias em destaque</div>
      <div class="team-page__news" id="team-news">
        <div class="team-page__skeleton"></div>
        <div class="team-page__skeleton"></div>
      </div>
    </div>

    <div class="team-page__source" id="team-wiki-link"></div>
  `;
}

/**
 * ── FANZONE PAGE ──
 */
export function renderFanzone(state) {
  const { level, xp, percent } = getXPProgress(state);
  const predictionsCount = state.user.predictions.length;
  const triviaCount = state.user.triviaAnswered.length;

  // Get next unanswered trivia
  const nextTrivia = TRIVIA.find(q => !state.user.triviaAnswered.includes(q.id));

  // Leaderboard data (mock) — teamCode liga cada entry à página de detalhes.
  const leaderboard = [
    { name: 'Carlos M.', teamCode: 'BRA', score: 2450, isUser: false },
    { name: 'Ana S.', teamCode: 'ARG', score: 2280, isUser: false },
    { name: 'João P.', teamCode: 'POR', score: 1950, isUser: false },
    { name: state.user.name || 'Você', teamCode: state.user.favoriteTeam || null, score: xp, isUser: true },
    { name: 'Maria L.', teamCode: 'ESP', score: 890, isUser: false },
    { name: 'Pedro R.', teamCode: 'GER', score: 720, isUser: false },
    { name: 'Lucas F.', teamCode: 'FRA', score: 540, isUser: false }
  ].sort((a, b) => b.score - a.score);

  // Sub-tabs
  const subTabsHTML = `
    <div class="sub-tabs" id="fanzone-tabs">
      <button class="sub-tab active" data-tab="bolao">⚽ Bolão</button>
      <button class="sub-tab" data-tab="trivia">🧠 Trivia</button>
      <button class="sub-tab" data-tab="ranking">🏆 Ranking</button>
    </div>
  `;

  // Bolão section
  const bolaoFixtures = FIXTURES.slice(0, 4);
  const bolaoHTML = `
    <div id="tab-bolao" class="fanzone-tab-content">
      <div class="section-title">${icon('target', 20)} Bolão Relâmpago</div>
      <p class="section-subtitle">Dê seus palpites e ganhe XP! Cada acerto vale 50 XP.</p>
      ${bolaoFixtures.map(f => {
        const home = getTeam(f.home);
        const away = getTeam(f.away);
        const existing = state.user.predictions.find(p => p.fixtureId === f.id);
        return `
          <div class="card bolao-card mb-md">
            <div class="match-card__header mb-sm">
              <span class="match-card__group">Grupo ${f.group}</span>
              <span class="text-xs text-muted">${f.date} · ${f.time}</span>
            </div>
            <div class="bolao-card__match">
              <a class="bolao-card__team-info" href="/team/${encodeURIComponent(home.code)}" data-route-link data-team-prefetch="${home.code}" aria-label="Ver detalhes de ${home.name}">
                <span style="font-size: 1.5rem">${home.flag}</span>
                <span class="font-display" style="font-weight: 600; font-size: var(--text-sm)">${home.code}</span>
              </a>
              <input type="number" class="bolao-card__input" min="0" max="20"
                     data-fixture="${f.id}" data-side="home"
                     value="${existing ? existing.homeScore : ''}"
                     placeholder="0" aria-label="Placar ${home.name}">
              <span class="bolao-card__sep">✕</span>
              <input type="number" class="bolao-card__input" min="0" max="20"
                     data-fixture="${f.id}" data-side="away"
                     value="${existing ? existing.awayScore : ''}"
                     placeholder="0" aria-label="Placar ${away.name}">
              <a class="bolao-card__team-info" href="/team/${encodeURIComponent(away.code)}" data-route-link data-team-prefetch="${away.code}" aria-label="Ver detalhes de ${away.name}">
                <span style="font-size: 1.5rem">${away.flag}</span>
                <span class="font-display" style="font-weight: 600; font-size: var(--text-sm)">${away.code}</span>
              </a>
            </div>
            <button class="btn btn--primary btn--sm btn--full mt-sm save-prediction-btn" data-fixture="${f.id}">
              ${icon('check', 16)} Salvar Palpite
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Trivia section
  const triviaHTML = nextTrivia ? `
    <div id="tab-trivia" class="fanzone-tab-content" style="display: none;">
      <div class="section-title">${icon('zap', 20)} Trivia do Mundial</div>
      <p class="section-subtitle">Cada resposta correta vale 25 XP! · ${triviaCount}/${TRIVIA.length} respondidas</p>
      <div class="card trivia-card">
        <div class="trivia-question">${nextTrivia.question}</div>
        <div class="trivia-options" data-trivia-id="${nextTrivia.id}" data-answer="${nextTrivia.answer}">
          ${nextTrivia.options.map((opt, i) => `
            <button class="trivia-option" data-index="${i}">
              <span class="trivia-option__letter">${String.fromCharCode(65 + i)}</span>
              ${opt}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  ` : `
    <div id="tab-trivia" class="fanzone-tab-content" style="display: none;">
      <div class="section-title">${icon('zap', 20)} Trivia do Mundial</div>
      <div class="card text-center" style="padding: var(--space-3xl);">
        <div style="font-size: 3rem; margin-bottom: var(--space-lg);">🎉</div>
        <div class="font-display font-bold mb-sm">Todas respondidas!</div>
        <div class="text-muted">Você completou todas as ${TRIVIA.length} perguntas. Volte em breve para mais!</div>
      </div>
    </div>
  `;

  // Ranking section
  const rankingHTML = `
    <div id="tab-ranking" class="fanzone-tab-content" style="display: none;">
      <div class="section-title">${icon('trendingUp', 20)} Ranking Global</div>
      <p class="section-subtitle">Sua posição entre todos os participantes</p>
      <div class="leaderboard-list">
        ${leaderboard.map((entry, i) => {
          const rank = i + 1;
          let rankClass = '';
          if (rank === 1) rankClass = 'leaderboard-item__rank--gold';
          else if (rank === 2) rankClass = 'leaderboard-item__rank--silver';
          else if (rank === 3) rankClass = 'leaderboard-item__rank--bronze';

          const entryTeam = entry.teamCode ? getTeam(entry.teamCode) : null;
          const teamMarkup = entryTeam
            ? `<a class="leaderboard-item__team leaderboard-item__team--link" href="/team/${encodeURIComponent(entryTeam.code)}" data-route-link data-team-prefetch="${entryTeam.code}" aria-label="Ver detalhes de ${entryTeam.name}">${entryTeam.flag} ${entryTeam.code}</a>`
            : `<span class="leaderboard-item__team">⚽</span>`;

          return `
            <div class="leaderboard-item ${entry.isUser ? 'is-user' : ''}">
              <span class="leaderboard-item__rank ${rankClass}">${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}</span>
              <div class="leaderboard-item__info">
                <div class="leaderboard-item__name">${entry.name}</div>
                ${teamMarkup}
              </div>
              <span class="leaderboard-item__score">${entry.score.toLocaleString('pt-BR')} XP</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  return `
    <div class="section-title">
      ${icon('gamepad', 20)} FanZone
    </div>

    <!-- Stats Summary -->
    <div class="fanzone-stats">
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--gold">${level}</span>
        <span class="fanzone-stat__label">Nível</span>
      </div>
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--emerald">${predictionsCount}</span>
        <span class="fanzone-stat__label">Palpites</span>
      </div>
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--blue">${state.user.streak}</span>
        <span class="fanzone-stat__label">Streak</span>
      </div>
    </div>

    ${renderXPBar(state)}
    ${subTabsHTML}
    ${bolaoHTML}
    ${triviaHTML}
    ${rankingHTML}
  `;
}

/**
 * ── STADIUMS/MAP PAGE ──
 */
export function renderStadiums(state) {
  const byCountry = {
    'EUA': STADIUMS.filter(s => s.country === 'EUA'),
    'México': STADIUMS.filter(s => s.country === 'México'),
    'Canadá': STADIUMS.filter(s => s.country === 'Canadá')
  };

  // Filter tabs
  const filterHTML = `
    <div class="filter-tabs" id="stadium-filters">
      <button class="filter-tab active" data-filter="all">Todos (16)</button>
      <button class="filter-tab" data-filter="EUA">🇺🇸 EUA (11)</button>
      <button class="filter-tab" data-filter="México">🇲🇽 México (3)</button>
      <button class="filter-tab" data-filter="Canadá">🇨🇦 Canadá (2)</button>
    </div>
  `;

  return `
    <div class="section-title">
      ${icon('mapPin', 20)} Sedes & Estádios
    </div>
    <p class="section-subtitle">16 estádios em 3 países · 4 fusos horários</p>

    <!-- Summary stats -->
    <div class="fanzone-stats mb-xl">
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--blue">11</span>
        <span class="fanzone-stat__label">🇺🇸 EUA</span>
      </div>
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--emerald">3</span>
        <span class="fanzone-stat__label">🇲🇽 México</span>
      </div>
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--gold">2</span>
        <span class="fanzone-stat__label">🇨🇦 Canadá</span>
      </div>
    </div>

    ${filterHTML}

    <div class="stadium-grid" id="stadiums-container">
      ${STADIUMS.map(s => `<div class="stadium-wrapper" data-country="${s.country}">${renderStadiumCard(s)}</div>`).join('')}
    </div>
  `;
}

/**
 * ── SETTINGS PAGE ──
 */
export function renderSettings(state) {
  const { level, xp } = getXPProgress(state);
  const favTeam = state.user.favoriteTeam ? getTeam(state.user.favoriteTeam) : null;

  return `
    <div class="section-title">
      ${icon('settings', 20)} Configurações
    </div>

    <!-- Profile Card -->
    <div class="card card--gold mb-xl">
      <div class="flex items-center gap-lg">
        ${favTeam
          ? `<a class="settings-profile__avatar settings-profile__avatar--link" href="/team/${encodeURIComponent(favTeam.code)}" data-route-link data-team-prefetch="${favTeam.code}" aria-label="Ver detalhes de ${favTeam.name}">${favTeam.flag}</a>`
          : `<div class="settings-profile__avatar">⚽</div>`}
        <div>
          <div class="font-display font-bold" style="font-size: var(--text-lg);">${state.user.name || 'Torcedor'}</div>
          <div class="text-sm text-muted">Nível ${level} · ${xp} XP · ${state.user.streak} dias de streak</div>
          ${favTeam
            ? `<a class="settings-profile__team-link" href="/team/${encodeURIComponent(favTeam.code)}" data-route-link data-team-prefetch="${favTeam.code}">${favTeam.flag} ${escapeHTML(favTeam.name)} →</a>`
            : ''}
        </div>
      </div>
      ${renderXPBar(state)}
    </div>

    <!-- General Settings -->
    <div class="settings-group">
      <div class="settings-group__title">Geral</div>

      <div class="settings-item" id="setting-install">
        <div class="settings-item__left">
          ${icon('download', 20, 'text-gold')}
          <div>
            <div class="settings-item__label">Instalar App</div>
            <div class="settings-item__desc">Adicionar à tela inicial do celular</div>
          </div>
        </div>
        ${icon('chevronRight', 18, 'text-muted')}
      </div>

      <div class="settings-item" id="setting-notifications">
        <div class="settings-item__left">
          ${icon('bell', 20, 'text-blue')}
          <div>
            <div class="settings-item__label">Notificações</div>
            <div class="settings-item__desc">Alertas de gols e resultados</div>
          </div>
        </div>
        <div class="toggle ${state.settings.notifications ? 'active' : ''}" id="toggle-notifications"></div>
      </div>
    </div>

    <!-- About -->
    <div class="settings-group">
      <div class="settings-group__title">Sobre</div>

      <div class="settings-item">
        <div class="settings-item__left">
          ${icon('info', 20, 'text-muted')}
          <div>
            <div class="settings-item__label">CopaDataHub 2026</div>
            <div class="settings-item__desc">MVP v1.0 · PWA Instalável</div>
          </div>
        </div>
      </div>

      <div class="settings-item">
        <div class="settings-item__left">
          ${icon('shield', 20, 'text-muted')}
          <div>
            <div class="settings-item__label">Privacidade</div>
            <div class="settings-item__desc">Seus dados ficam no seu dispositivo</div>
          </div>
        </div>
        ${icon('chevronRight', 18, 'text-muted')}
      </div>
    </div>

    <!-- Reset -->
    <div class="mt-xl text-center">
      <button class="btn btn--ghost btn--sm text-rose" id="btn-reset-data">
        Resetar todos os dados
      </button>
    </div>
  `;
}
