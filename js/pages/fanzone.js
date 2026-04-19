import { icon } from '../icons.js';
import { FIXTURES, TRIVIA, getTeam } from '../data.js';
import { renderXPBar } from '../components/xpBar.js';
import { showToast } from '../components/toast.js';
import { getXPProgress, savePrediction, recordTrivia, addXP } from '../state.js';
import { setSEO } from '../util/seo.js';
import { escapeHTML } from '../util/html.js';

// ── Streak Graph (GitHub-style) ──
function renderStreakGraph(state) {
  const today = new Date();
  const streak = state.user.streak || 0;
  const lastVisit = state.user.lastVisit ? new Date(state.user.lastVisit) : null;

  // 28 quadrados (4 semanas)
  const days = 28;
  const squares = Array.from({ length: days }, (_, i) => {
    const daysAgo = days - 1 - i;
    let level = 0;
    if (lastVisit && streak > 0) {
      const diff = Math.round((today - lastVisit) / 86400000);
      if (daysAgo < streak && daysAgo <= diff + streak) level = Math.min(4, 4 - Math.floor(daysAgo / (streak / 4 + 1)));
    }
    return `<div class="streak-cell streak-cell--${level}" title="${daysAgo === 0 ? 'Hoje' : `${daysAgo}d atrás`}"></div>`;
  }).join('');

  return `
    <div class="streak-graph">
      <div class="streak-graph__header">
        <span>${icon('flame', 14)} Sequência de acessos</span>
        <span class="streak-graph__count">${streak} dia${streak !== 1 ? 's' : ''}</span>
      </div>
      <div class="streak-graph__grid">${squares}</div>
      <div class="streak-graph__legend">
        <span>Menos</span>
        ${[0,1,2,3,4].map(l => `<div class="streak-cell streak-cell--${l}"></div>`).join('')}
        <span>Mais</span>
      </div>
    </div>
  `;
}

// ── Desafios Diários ──
function renderDailyChallenges(state) {
  const predictions = state.user.predictions.length;
  const trivia = state.user.triviaAnswered.length;
  const streak = state.user.streak;

  const challenges = [
    {
      id: 'pred3', icon: '⚽', label: 'Dar 3 palpites',
      progress: Math.min(3, predictions), total: 3,
      done: predictions >= 3, xp: 30
    },
    {
      id: 'trivia', icon: '🧠', label: 'Responder uma trivia',
      progress: Math.min(1, trivia), total: 1,
      done: trivia >= 1, xp: 25
    },
    {
      id: 'streak3', icon: '🔥', label: 'Manter streak por 3 dias',
      progress: Math.min(3, streak), total: 3,
      done: streak >= 3, xp: 50
    },
    {
      id: 'pred10', icon: '🎯', label: '10 palpites no total',
      progress: Math.min(10, predictions), total: 10,
      done: predictions >= 10, xp: 100
    },
  ];

  return `
    <div class="daily-challenges">
      <div class="daily-challenges__header">
        ${icon('zap', 16)} Desafios do Dia
      </div>
      ${challenges.map(ch => `
        <div class="challenge-item ${ch.done ? 'challenge-item--done' : ''}">
          <span class="challenge-item__icon">${ch.icon}</span>
          <div class="challenge-item__body">
            <div class="challenge-item__label">${ch.label}</div>
            <div class="challenge-item__bar-wrap">
              <div class="challenge-item__bar" style="width:${Math.round((ch.progress / ch.total) * 100)}%"></div>
            </div>
            <div class="challenge-item__progress">${ch.progress}/${ch.total}</div>
          </div>
          <span class="challenge-item__xp">${ch.done ? '✅' : `+${ch.xp} XP`}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Avatar com iniciais + cor baseada em XP ──
function renderAvatar(name, xp) {
  const initials = (name || '?').trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = (xp * 7) % 360;
  return `<div class="leaderboard-avatar" style="background:hsl(${hue},60%,40%)">${escapeHTML(initials)}</div>`;
}

// ── Leaderboard real (baseado em localStorage) ──
function buildLeaderboard(state) {
  const { xp } = getXPProgress(state);
  // Simula outros participantes com scores variados baseados no XP real do usuário
  const seed = xp || 50;
  const others = [
    { name: 'Carlos M.', teamCode: 'BRA', xp: Math.round(seed * 4.8), isUser: false },
    { name: 'Ana S.', teamCode: 'ARG', xp: Math.round(seed * 4.2), isUser: false },
    { name: 'João P.', teamCode: 'POR', xp: Math.round(seed * 3.6), isUser: false },
    { name: 'Maria L.', teamCode: 'ESP', xp: Math.round(seed * 1.7), isUser: false },
    { name: 'Pedro R.', teamCode: 'GER', xp: Math.round(seed * 1.3), isUser: false },
    { name: 'Lucas F.', teamCode: 'FRA', xp: Math.round(seed * 0.9), isUser: false },
  ];

  const userEntry = {
    name: state.user.name || 'Você',
    teamCode: state.user.favoriteTeam || null,
    xp,
    isUser: true,
  };

  return [...others, userEntry].sort((a, b) => b.xp - a.xp);
}

function render(state) {
  const { level, xp } = getXPProgress(state);
  const predictionsCount = state.user.predictions.length;
  const triviaCount = state.user.triviaAnswered.length;
  const nextTrivia = TRIVIA.find(q => !state.user.triviaAnswered.includes(q.id));
  const leaderboard = buildLeaderboard(state);

  const subTabsHTML = `
    <div class="sub-tabs" id="fanzone-tabs">
      <button class="sub-tab active" data-tab="bolao">⚽ Bolão</button>
      <button class="sub-tab" data-tab="trivia">🧠 Trivia</button>
      <button class="sub-tab" data-tab="desafios">🎯 Desafios</button>
      <button class="sub-tab" data-tab="ranking">🏆 Ranking</button>
    </div>
  `;

  const bolaoFixtures = FIXTURES.slice(0, 4);
  const bolaoHTML = `
    <div id="tab-bolao" class="fanzone-tab-content">
      <div class="section-title">${icon('target', 20)} Bolão Relâmpago</div>
      <p class="section-subtitle">Dê seus palpites e ganhe XP! Cada acerto vale 50 XP.</p>
      ${bolaoFixtures.map(f => {
        const home = getTeam(f.home);
        const away = getTeam(f.away);
        const existing = state.user.predictions.find(p => p.fixtureId === f.id);
        const confVal = existing?.confidence || 1;
        return `
          <div class="card bolao-card mb-md">
            <div class="match-card__header mb-sm">
              <span class="match-card__group">Grupo ${f.group}</span>
              <span class="text-xs text-muted">${f.date} · ${f.time}</span>
            </div>
            <div class="bolao-card__match">
              <a class="bolao-card__team-info" href="/selecoes/${home.slug}" data-route-link data-team-prefetch="${home.code}" aria-label="Ver detalhes de ${home.name}">
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
              <a class="bolao-card__team-info" href="/selecoes/${away.slug}" data-route-link data-team-prefetch="${away.code}" aria-label="Ver detalhes de ${away.name}">
                <span style="font-size: 1.5rem">${away.flag}</span>
                <span class="font-display" style="font-weight: 600; font-size: var(--text-sm)">${away.code}</span>
              </a>
            </div>
            <div class="bolao-card__confidence">
              <span class="text-xs text-muted">Confiança:</span>
              <div class="conf-stars" id="conf-${f.id}">
                ${[1,2,3].map(n => `<button class="conf-star ${n <= confVal ? 'conf-star--active' : ''}" data-fixture="${f.id}" data-conf="${n}" type="button">⭐</button>`).join('')}
              </div>
            </div>
            <button class="btn btn--primary btn--sm btn--full mt-sm save-prediction-btn" data-fixture="${f.id}">
              ${icon('check', 16)} Salvar Palpite
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;

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

  const desafiosHTML = `
    <div id="tab-desafios" class="fanzone-tab-content" style="display: none;">
      ${renderStreakGraph(state)}
      ${renderDailyChallenges(state)}
    </div>
  `;

  const rankingHTML = `
    <div id="tab-ranking" class="fanzone-tab-content" style="display: none;">
      <div class="section-title">${icon('trendingUp', 20)} Ranking Global</div>
      <p class="section-subtitle">Sua posição entre todos os participantes</p>
      <div class="leaderboard-list">
        ${leaderboard.map((entry, i) => {
          const rank = i + 1;
          const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `<span class="leaderboard-rank-num">${rank}</span>`;
          const entryTeam = entry.teamCode ? getTeam(entry.teamCode) : null;

          return `
            <div class="leaderboard-item ${entry.isUser ? 'is-user' : ''}">
              <span class="leaderboard-item__rank">${rankIcon}</span>
              ${renderAvatar(entry.name, entry.xp)}
              <div class="leaderboard-item__info">
                <div class="leaderboard-item__name">${escapeHTML(entry.name)}${entry.isUser ? ' <span class="leaderboard-you">Você</span>' : ''}</div>
                ${entryTeam ? `<div class="leaderboard-item__team">${entryTeam.flag} ${entryTeam.code}</div>` : ''}
              </div>
              <span class="leaderboard-item__score">${entry.xp.toLocaleString('pt-BR')} XP</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  return `
    <div class="section-title">${icon('gamepad', 20)} FanZone</div>

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
    ${desafiosHTML}
    ${rankingHTML}
  `;
}

function bindEvents(state, { router }) {
  setSEO({
    title: 'FanZone — Bolão, Trivia e Ranking do Mundial',
    description: 'Jogue o bolão do Mundial 2026, responda perguntas de trivia e suba no ranking global. Ganhe XP e suba de nível.',
    canonical: '/fanzone',
    keywords: 'bolão mundial 2026, trivia futebol, ranking, gamificação'
  });

  // Tabs
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

  // Confiança nos palpites do bolão
  document.querySelectorAll('.conf-stars').forEach(wrap => {
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.conf-star');
      if (!btn) return;
      const n = parseInt(btn.dataset.conf);
      wrap.querySelectorAll('.conf-star').forEach((s, i) => s.classList.toggle('conf-star--active', i < n));
    });
  });

  // Salvar palpite
  document.querySelectorAll('.save-prediction-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fixtureId = btn.dataset.fixture;
      const homeInput = document.querySelector(`input[data-fixture="${fixtureId}"][data-side="home"]`);
      const awayInput = document.querySelector(`input[data-fixture="${fixtureId}"][data-side="away"]`);
      if (!homeInput || !awayInput) return;

      const homeScore = parseInt(homeInput.value) || 0;
      const awayScore = parseInt(awayInput.value) || 0;
      const confEl = document.getElementById(`conf-${fixtureId}`);
      const activeConf = confEl?.querySelectorAll('.conf-star--active').length || 1;

      savePrediction(state, fixtureId, homeScore, awayScore, activeConf);
      const result = addXP(state, 15);
      showToast(`⚽ Palpite salvo! +15 XP ${'⭐'.repeat(activeConf)}`, 'xp');
      if (result.leveledUp) {
        setTimeout(() => showToast(`🎉 Parabéns! Nível ${result.newLevel}!`, 'success'), 800);
      }
    });
  });

  // Trivia
  document.querySelectorAll('.trivia-options').forEach(container => {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.trivia-option');
      if (!btn || container.classList.contains('answered')) return;

      container.classList.add('answered');
      const questionId = parseInt(container.dataset.triviaId);
      const answer = parseInt(container.dataset.answer);
      const selected = parseInt(btn.dataset.index);
      const isCorrect = selected === answer;

      container.querySelectorAll('.trivia-option').forEach((opt, i) => {
        if (i === answer) opt.classList.add('correct');
        else if (i === selected && !isCorrect) opt.classList.add('wrong');
      });

      recordTrivia(state, questionId, isCorrect);

      if (isCorrect) {
        const result = addXP(state, 25);
        showToast('✅ Correto! +25 XP', 'xp');
        if (result.leveledUp) {
          setTimeout(() => showToast(`🎉 Nível ${result.newLevel} alcançado!`, 'success'), 800);
        }
      } else {
        showToast('❌ Incorreto! Tente a próxima.', 'error');
      }

      setTimeout(() => router.navigate('fanzone'), 1500);
    });
  });
}

export default { render, bindEvents };
