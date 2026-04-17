// Coleção de componentes secundários da página de partida.
// Reune h2h, key players, pulse, poll, timeline, ratings, recap.

import { escapeHTML } from '../../util/html.js';
import { slugify } from '../../util/slug.js';
import { icon } from '../../icons.js';

// ── Head-to-head ──
export function renderH2H(history, home, away) {
  if (!history?.length) {
    return '<p class="text-sm text-muted">Sem histórico de confrontos disponível.</p>';
  }
  const wins = { home: 0, away: 0, draw: 0 };
  history.forEach((g) => {
    if (g.homeScore == null) return;
    const sameOrder = g.homeName === home.name;
    const winnerIsHome = g.homeScore > g.awayScore;
    if (g.homeScore === g.awayScore) wins.draw++;
    else if (sameOrder ? winnerIsHome : !winnerIsHome) wins.home++;
    else wins.away++;
  });
  return `
    <div class="h2h">
      <div class="h2h__summary">
        <div><b>${wins.home}</b><span>${escapeHTML(home.code)}</span></div>
        <div><b>${wins.draw}</b><span>Empates</span></div>
        <div><b>${wins.away}</b><span>${escapeHTML(away.code)}</span></div>
      </div>
      <ul class="h2h__list">
        ${history.slice(0, 5).map(g => `
          <li>
            <span>${new Date(g.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <strong>${escapeHTML(g.homeName)} ${g.homeScore ?? '-'} × ${g.awayScore ?? '-'} ${escapeHTML(g.awayName)}</strong>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

// ── Forma recente (últimos 5 simulados a partir de FIXTURES não disponível, recebe array) ──
export function renderForm(formArr) {
  if (!formArr?.length) return '<span class="text-xs text-muted">—</span>';
  return `<div class="form-strip">${formArr.map(r => `<span class="form-strip__pill form-strip__pill--${r.toLowerCase()}">${r}</span>`).join('')}</div>`;
}

// ── Jogadores-chave ──
export function renderKeyPlayers(players) {
  if (!players?.length) return '<p class="text-sm text-muted">Jogadores-chave indisponíveis.</p>';
  return `
    <div class="key-players">
      ${players.slice(0, 3).map(p => `
        <a class="key-player" href="/jogadores/${slugify(p.name)}" data-route-link>
          ${p.photo ? `<img src="${escapeHTML(p.photo)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none'">` : '<span class="key-player__avatar">⚽</span>'}
          <span class="key-player__name">${escapeHTML(p.name)}</span>
          <span class="key-player__meta">${p.goals != null ? `${p.goals}⚽ ${p.assists ?? 0}🎯` : ''}</span>
        </a>
      `).join('')}
    </div>
  `;
}

// ── Timeline de eventos ──
const EVENT_EMOJI = { Goal: '⚽', Card: '🟨', subst: '🔄', Var: '📺' };
export function renderTimeline(events, home, away) {
  if (!events?.length) return '<p class="text-sm text-muted">Sem eventos registrados.</p>';
  const sorted = [...events].sort((a, b) => b.minute - a.minute);
  return `
    <ul class="timeline">
      ${sorted.map(ev => {
        const side = ev.teamName === home.name ? 'home' : ev.teamName === away.name ? 'away' : '';
        const emoji = ev.detail === 'Yellow Card' ? '🟨' : ev.detail === 'Red Card' ? '🟥' : EVENT_EMOJI[ev.type] || '•';
        return `
          <li class="timeline__item timeline__item--${side}">
            <span class="timeline__min">${ev.minute}'${ev.extra ? `+${ev.extra}` : ''}</span>
            <span class="timeline__emoji">${emoji}</span>
            <span class="timeline__txt"><b>${escapeHTML(ev.playerName || '?')}</b>${ev.assistName ? ` (assist: ${escapeHTML(ev.assistName)})` : ''}${ev.detail && ev.type !== 'Card' ? ` — ${escapeHTML(ev.detail)}` : ''}</span>
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

// ── Pulse de torcida ──
const PULSE_EMOJIS = ['⚽', '🔥', '😱', '🙏'];
export function renderPulse(fixtureId) {
  const counts = loadPulse(fixtureId);
  return `
    <div class="pulse" data-fixture="${escapeHTML(String(fixtureId))}">
      ${PULSE_EMOJIS.map(e => `
        <button class="pulse__btn" data-emoji="${e}" type="button">
          <span class="pulse__emoji">${e}</span>
          <span class="pulse__count" data-emoji-count="${e}">${counts[e] || 0}</span>
        </button>
      `).join('')}
    </div>
  `;
}

export function bindPulse() {
  document.querySelectorAll('.pulse').forEach((root) => {
    const fixtureId = root.dataset.fixture;
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.pulse__btn');
      if (!btn) return;
      const emoji = btn.dataset.emoji;
      const counts = loadPulse(fixtureId);
      counts[emoji] = (counts[emoji] || 0) + 1;
      savePulse(fixtureId, counts);
      const c = btn.querySelector('.pulse__count');
      if (c) c.textContent = counts[emoji];
      btn.classList.add('pulse__btn--bump');
      setTimeout(() => btn.classList.remove('pulse__btn--bump'), 300);
    });
  });
}

function loadPulse(fixtureId) {
  try { return JSON.parse(localStorage.getItem(`cdh_pulse_${fixtureId}`) || '{}'); }
  catch { return {}; }
}
function savePulse(fixtureId, counts) {
  try { localStorage.setItem(`cdh_pulse_${fixtureId}`, JSON.stringify(counts)); }
  catch {}
}

// ── Poll efêmero ──
export function renderPoll(fixtureId, question, options) {
  const saved = loadPoll(fixtureId);
  const total = Object.values(saved.votes || {}).reduce((a, b) => a + b, 0);
  const myVote = saved.myVote;
  return `
    <div class="poll" data-fixture="${escapeHTML(String(fixtureId))}" data-question="${escapeHTML(question)}">
      <div class="poll__q">${escapeHTML(question)}</div>
      ${options.map((opt) => {
        const votes = saved.votes?.[opt] || 0;
        const pct = total ? Math.round((votes / total) * 100) : 0;
        const mine = myVote === opt;
        return `
          <button class="poll__opt ${myVote ? 'poll__opt--voted' : ''} ${mine ? 'poll__opt--mine' : ''}" data-opt="${escapeHTML(opt)}" type="button" ${myVote ? 'disabled' : ''}>
            <span class="poll__bar" style="width:${pct}%"></span>
            <span class="poll__lbl">${escapeHTML(opt)}</span>
            ${myVote ? `<span class="poll__pct">${pct}%</span>` : ''}
          </button>
        `;
      }).join('')}
      ${myVote ? `<div class="poll__total">${total} voto${total === 1 ? '' : 's'}</div>` : ''}
    </div>
  `;
}

export function bindPolls(onVote) {
  document.querySelectorAll('.poll').forEach((root) => {
    const fixtureId = root.dataset.fixture;
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.poll__opt');
      if (!btn || btn.disabled) return;
      const opt = btn.dataset.opt;
      const saved = loadPoll(fixtureId);
      saved.votes = saved.votes || {};
      saved.votes[opt] = (saved.votes[opt] || 0) + 1;
      saved.myVote = opt;
      savePoll(fixtureId, saved);
      if (onVote) onVote();
    });
  });
}

function loadPoll(fixtureId) {
  try { return JSON.parse(localStorage.getItem(`cdh_poll_${fixtureId}`) || '{}'); }
  catch { return {}; }
}
function savePoll(fixtureId, data) {
  try { localStorage.setItem(`cdh_poll_${fixtureId}`, JSON.stringify(data)); }
  catch {}
}

// ── Estatísticas ao vivo ──
const STAT_LABELS = {
  'Ball Possession': 'Posse de Bola',
  'Total Shots': 'Chutes Totais',
  'Shots on Goal': 'Chutes ao Gol',
  'Corner Kicks': 'Escanteios',
  'Fouls': 'Faltas',
  'Yellow Cards': 'Cartões Amarelos',
  'Passes accurate': 'Passes Certos',
  'Passes %': 'Precisão Passes'
};

export function renderLiveStats(stats, home, away) {
  if (!stats || !stats[home.id] || !stats[away.id]) {
    return '<p class="text-sm text-muted">Estatísticas indisponíveis.</p>';
  }
  const keys = Object.keys(STAT_LABELS).filter(k => stats[home.id][k] != null || stats[away.id][k] != null);
  if (!keys.length) return '<p class="text-sm text-muted">Estatísticas ainda não foram registradas.</p>';
  return `
    <div class="live-stats">
      ${keys.map(k => {
        const h = stats[home.id][k] ?? '—';
        const a = stats[away.id][k] ?? '—';
        return `
          <div class="live-stats__row">
            <span class="live-stats__h">${escapeHTML(String(h))}</span>
            <span class="live-stats__lbl">${STAT_LABELS[k]}</span>
            <span class="live-stats__a">${escapeHTML(String(a))}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ── Recap pós-jogo (narrativa template-based) ──
export function renderRecap(fixture, events, home, away) {
  if (!events?.length) {
    return `<p class="match-recap__txt">Partida encerrada em ${fixture.homeScore ?? 0} a ${fixture.awayScore ?? 0}.</p>`;
  }
  const goals = events.filter(e => e.type === 'Goal').sort((a, b) => a.minute - b.minute);
  const parts = [];
  if (fixture.homeScore > fixture.awayScore) {
    parts.push(`${home.name} venceu ${away.name} por ${fixture.homeScore} a ${fixture.awayScore}.`);
  } else if (fixture.awayScore > fixture.homeScore) {
    parts.push(`${away.name} venceu ${home.name} por ${fixture.awayScore} a ${fixture.homeScore}.`);
  } else {
    parts.push(`${home.name} e ${away.name} empataram em ${fixture.homeScore} a ${fixture.awayScore}.`);
  }
  goals.forEach(g => {
    parts.push(`${g.playerName} marcou aos ${g.minute}'${g.assistName ? ` (assistência de ${g.assistName})` : ''}.`);
  });
  return `
    <div class="match-recap">
      ${parts.map(p => `<p>${escapeHTML(p)}</p>`).join('')}
    </div>
  `;
}

// ── Player Ratings ──
export function renderRatings(ratings) {
  if (!ratings?.length) return '<p class="text-sm text-muted">Avaliações ainda não foram publicadas.</p>';
  return `
    <div class="ratings">
      ${ratings.slice(0, 6).map(r => `
        <a class="rating-item" href="/jogadores/${slugify(r.name)}" data-route-link>
          <span class="rating-item__pos">${escapeHTML(r.team)}</span>
          <span class="rating-item__name">${escapeHTML(r.name)}</span>
          <span class="rating-item__score rating-item__score--${r.rating >= 8 ? 'top' : r.rating >= 6.5 ? 'mid' : 'low'}">${r.rating.toFixed(1)}</span>
        </a>
      `).join('')}
    </div>
  `;
}

// Extrai ratings dos players do fixture (formato API-Football)
export function extractRatings(playersBlock) {
  if (!playersBlock?.length) return [];
  const result = [];
  playersBlock.forEach((teamBlock) => {
    const teamName = teamBlock.team?.name;
    (teamBlock.players || []).forEach((p) => {
      const stats = p.statistics?.[0] || {};
      const rating = stats.games?.rating ? parseFloat(stats.games.rating) : null;
      if (rating) {
        result.push({ name: p.player?.name, team: teamName, rating });
      }
    });
  });
  return result.sort((a, b) => b.rating - a.rating);
}
