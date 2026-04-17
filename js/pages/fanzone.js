import { icon } from '../icons.js';
import { FIXTURES, TRIVIA, getTeam } from '../data.js';
import { renderXPBar } from '../components/xpBar.js';
import { showToast } from '../components/toast.js';
import { getXPProgress, savePrediction, recordTrivia, addXP } from '../state.js';
import { setSEO } from '../util/seo.js';

function render(state) {
  const { level, xp } = getXPProgress(state);
  const predictionsCount = state.user.predictions.length;
  const triviaCount = state.user.triviaAnswered.length;
  const nextTrivia = TRIVIA.find(q => !state.user.triviaAnswered.includes(q.id));

  const leaderboard = [
    { name: 'Carlos M.', teamCode: 'BRA', score: 2450, isUser: false },
    { name: 'Ana S.', teamCode: 'ARG', score: 2280, isUser: false },
    { name: 'João P.', teamCode: 'POR', score: 1950, isUser: false },
    { name: state.user.name || 'Você', teamCode: state.user.favoriteTeam || null, score: xp, isUser: true },
    { name: 'Maria L.', teamCode: 'ESP', score: 890, isUser: false },
    { name: 'Pedro R.', teamCode: 'GER', score: 720, isUser: false },
    { name: 'Lucas F.', teamCode: 'FRA', score: 540, isUser: false }
  ].sort((a, b) => b.score - a.score);

  const subTabsHTML = `
    <div class="sub-tabs" id="fanzone-tabs">
      <button class="sub-tab active" data-tab="bolao">⚽ Bolão</button>
      <button class="sub-tab" data-tab="trivia">🧠 Trivia</button>
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
            ? `<a class="leaderboard-item__team leaderboard-item__team--link" href="/selecoes/${entryTeam.slug}" data-route-link data-team-prefetch="${entryTeam.code}" aria-label="Ver detalhes de ${entryTeam.name}">${entryTeam.flag} ${entryTeam.code}</a>`
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

  document.querySelectorAll('.save-prediction-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fixtureId = btn.dataset.fixture;
      const homeInput = document.querySelector(`input[data-fixture="${fixtureId}"][data-side="home"]`);
      const awayInput = document.querySelector(`input[data-fixture="${fixtureId}"][data-side="away"]`);
      if (!homeInput || !awayInput) return;

      const homeScore = parseInt(homeInput.value) || 0;
      const awayScore = parseInt(awayInput.value) || 0;
      savePrediction(state, fixtureId, homeScore, awayScore);
      const result = addXP(state, 15);
      showToast(`⚽ Palpite salvo! +15 XP`, 'xp');
      if (result.leveledUp) {
        setTimeout(() => showToast(`🎉 Parabéns! Você subiu para o Nível ${result.newLevel}!`, 'success'), 800);
      }
    });
  });

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
