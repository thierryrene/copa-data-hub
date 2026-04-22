// Coleção de componentes secundários da página de partida.
// Reune h2h, key players, pulse, poll, timeline, ratings, recap, highlight cards.

import { escapeHTML } from '../../util/html.js';
import { slugify } from '../../util/slug.js';
import { icon } from '../../icons.js';
import { FIXTURES, GROUPS, getTeam } from '../../data.js';
import { matchPhase } from '../../util/match.js';
import { applyMockToFixtures } from '../../util/mockMode.js';

// ── Briefing Pré-Jogo ──
function computeGroupStandings(groupId) {
  const groupTeams = GROUPS[groupId]?.teams || [];
  const allFixtures = applyMockToFixtures(FIXTURES);
  return groupTeams.map(code => {
    const played = allFixtures.filter(f =>
      f.group === groupId &&
      (f.home === code || f.away === code) &&
      matchPhase(f) === 'finished'
    );
    let pts = 0, gf = 0, ga = 0;
    played.forEach(f => {
      const isHome = f.home === code;
      const gs = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
      const gc = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
      gf += gs; ga += gc;
      if (gs > gc) pts += 3; else if (gs === gc) pts += 1;
    });
    return { code, pts, gd: gf - ga, gf, played: played.length };
  }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

function matchdayLabel(fixture) {
  const groupFixtures = FIXTURES
    .filter(f => f.group === fixture.group && (f.home === fixture.home || f.home === fixture.away))
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  const idx = groupFixtures.findIndex(f => f.id === fixture.id);
  return idx >= 0 ? `Rodada ${idx + 1}` : 'Fase de Grupos';
}

function stakesText(standings, homeCode, awayCode, groupId) {
  const hPos = standings.findIndex(s => s.code === homeCode);
  const aPos = standings.findIndex(s => s.code === awayCode);
  const hSt = standings[hPos] || { pts: 0, played: 0 };
  const aSt = standings[aPos] || { pts: 0, played: 0 };
  const home = getTeam(homeCode);
  const away = getTeam(awayCode);

  if (hSt.played === 0 && aSt.played === 0) {
    return `Abertura do Grupo ${groupId}. Ambas as seleções estreiam no torneio.`;
  }
  const lines = [];
  if (hSt.pts >= 6) lines.push(`${home.flag} ${home.code} já garantido nas oitavas com ${hSt.pts} pts.`);
  else if (hSt.pts === 0 && hSt.played > 0) lines.push(`${home.flag} ${home.code} precisa reagir — ainda sem pontos.`);
  else lines.push(`${home.flag} ${home.code} tem ${hSt.pts} pt${hSt.pts !== 1 ? 's' : ''} em ${hSt.played} jogo${hSt.played !== 1 ? 's' : ''}.`);

  if (aSt.pts >= 6) lines.push(`${away.flag} ${away.code} já garantido nas oitavas com ${aSt.pts} pts.`);
  else if (aSt.pts === 0 && aSt.played > 0) lines.push(`${away.flag} ${away.code} precisa reagir — ainda sem pontos.`);
  else lines.push(`${away.flag} ${away.code} tem ${aSt.pts} pt${aSt.pts !== 1 ? 's' : ''} em ${aSt.played} jogo${aSt.played !== 1 ? 's' : ''}.`);

  return lines.join(' ');
}

export function renderMatchBriefing(fixture, home, away) {
  const standings = computeGroupStandings(fixture.group);
  const hSt = standings.find(s => s.code === fixture.home) || { pts: 0, played: 0 };
  const aSt = standings.find(s => s.code === fixture.away) || { pts: 0, played: 0 };
  const hPos = standings.findIndex(s => s.code === fixture.home) + 1;
  const aPos = standings.findIndex(s => s.code === fixture.away) + 1;
  const rdLabel = matchdayLabel(fixture);
  const stakes = stakesText(standings, fixture.home, fixture.away, fixture.group);

  return `
    <div class="match-briefing">
      <div class="match-briefing__header">
        <span class="match-briefing__tag">${icon('calendar', 12)} Grupo ${fixture.group} · ${rdLabel}</span>
      </div>

      <div class="match-briefing__stakes">
        <div class="match-briefing__stakes-title">${icon('zap', 14)} O que está em jogo</div>
        <p class="match-briefing__stakes-text">${escapeHTML(stakes)}</p>
      </div>

      <div class="match-briefing__standings">
        <div class="match-briefing__team-row">
          <span class="match-briefing__pos">${hPos}º</span>
          <span class="match-briefing__flag">${home.flag}</span>
          <span class="match-briefing__name">${escapeHTML(home.code)}</span>
          <span class="match-briefing__pts">${hSt.pts} pts</span>
          <span class="match-briefing__played">${hSt.played}J</span>
        </div>
        <div class="match-briefing__team-row">
          <span class="match-briefing__pos">${aPos}º</span>
          <span class="match-briefing__flag">${away.flag}</span>
          <span class="match-briefing__name">${escapeHTML(away.code)}</span>
          <span class="match-briefing__pts">${aSt.pts} pts</span>
          <span class="match-briefing__played">${aSt.played}J</span>
        </div>
      </div>
    </div>
  `;
}

// ── Head-to-head visual melhorado ──
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

  const total = wins.home + wins.draw + wins.away || 1;
  const homePct = Math.round((wins.home / total) * 100);
  const drawPct = Math.round((wins.draw / total) * 100);
  const awayPct = 100 - homePct - drawPct;

  return `
    <div class="h2h">
      <div class="h2h__bar-wrap">
        <div class="h2h__bar-label">${escapeHTML(home.flag)} <b>${wins.home}</b></div>
        <div class="h2h__bar">
          <div class="h2h__bar-seg h2h__bar-seg--home" style="width:${homePct}%" title="${escapeHTML(home.name)}: ${wins.home} vitórias"></div>
          <div class="h2h__bar-seg h2h__bar-seg--draw" style="width:${drawPct}%" title="Empates: ${wins.draw}"></div>
          <div class="h2h__bar-seg h2h__bar-seg--away" style="width:${awayPct}%" title="${escapeHTML(away.name)}: ${wins.away} vitórias"></div>
        </div>
        <div class="h2h__bar-label h2h__bar-label--away"><b>${wins.away}</b> ${escapeHTML(away.flag)}</div>
      </div>
      <div class="h2h__draw-count">${wins.draw} empate${wins.draw !== 1 ? 's' : ''}</div>

      <ul class="h2h__list">
        ${history.slice(0, 5).map(g => {
          const date = new Date(g.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
          const sameOrder = g.homeName === home.name;
          const hs = sameOrder ? g.homeScore : g.awayScore;
          const as_ = sameOrder ? g.awayScore : g.homeScore;
          let outcome = 'draw';
          if (hs != null && as_ != null) outcome = hs > as_ ? 'win' : hs < as_ ? 'loss' : 'draw';
          const badge = outcome === 'win' ? 'V' : outcome === 'loss' ? 'D' : 'E';
          return `
            <li class="h2h__item">
              <span class="h2h__item-date">${date}</span>
              <span class="h2h__item-teams">${escapeHTML(g.homeName)} <b>${g.homeScore ?? '?'} × ${g.awayScore ?? '?'}</b> ${escapeHTML(g.awayName)}</span>
              <span class="h2h__badge h2h__badge--${outcome}">${badge}</span>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `;
}

// ── Forma recente ──
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

// ── Timeline de eventos animada ──
const EVENT_EMOJI = { Goal: '⚽', Card: '🟨', subst: '🔄', Var: '📺' };
export function renderTimeline(events, home, away) {
  if (!events?.length) return '<p class="text-sm text-muted">Sem eventos registrados.</p>';
  const sorted = [...events].sort((a, b) => a.minute - b.minute);
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

// ── Highlight Cards — insights automáticos pós-jogo ──
export function renderHighlightCards(fixture, events, statistics, players, home, away) {
  const insights = [];

  // Insight 1: resultado
  if (fixture.homeScore != null) {
    if (fixture.homeScore > fixture.awayScore) {
      insights.push({ icon: '🏆', text: `${home.name} venceu por ${fixture.homeScore}–${fixture.awayScore}` });
    } else if (fixture.awayScore > fixture.homeScore) {
      insights.push({ icon: '🏆', text: `${away.name} venceu por ${fixture.awayScore}–${fixture.homeScore}` });
    } else {
      insights.push({ icon: '🤝', text: `Empate: ${fixture.homeScore}–${fixture.awayScore}` });
    }
  }

  // Insight 2: posse de bola
  const statH = statistics?.[home.id] || {};
  const statA = statistics?.[away.id] || {};
  const poss = statH['Ball Possession'];
  if (poss != null) {
    const dominant = parseInt(poss) > 50 ? home : away;
    insights.push({ icon: '⚽', text: `${dominant.name} dominou com ${parseInt(poss) > 50 ? poss : statA['Ball Possession']}% de posse` });
  }

  // Insight 3: artilheiro da partida
  const goals = (events || []).filter(e => e.type === 'Goal').sort((a, b) => a.minute - b.minute);
  const scorers = {};
  goals.forEach(g => { scorers[g.playerName] = (scorers[g.playerName] || 0) + 1; });
  const topScorer = Object.entries(scorers).sort((a, b) => b[1] - a[1])[0];
  if (topScorer) {
    insights.push({ icon: '⚡', text: `${topScorer[0]} artilheiro da partida (${topScorer[1]} gol${topScorer[1] > 1 ? 's' : ''})` });
  }

  // Insight 4: melhor jogador (maior rating)
  const ratings = extractRatings(players);
  if (ratings.length) {
    const top = ratings[0];
    insights.push({ icon: '⭐', text: `${top.name} melhor em campo — nota ${top.rating.toFixed(1)}` });
  }

  // Insight 5: chutes ao gol
  const shotsH = statH['Shots on Goal'];
  const shotsA = statA['Shots on Goal'];
  if (shotsH != null && shotsA != null) {
    insights.push({ icon: '🎯', text: `Chutes ao gol: ${home.code} ${shotsH} × ${shotsA} ${away.code}` });
  }

  if (!insights.length) return '';

  return `
    <div class="highlight-cards">
      ${insights.slice(0, 4).map(ins => `
        <div class="highlight-card">
          <span class="highlight-card__icon">${ins.icon}</span>
          <span class="highlight-card__text">${escapeHTML(ins.text)}</span>
        </div>
      `).join('')}
    </div>
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

// ── Estatísticas ao vivo (barras visuais) ──
// Ordem reflete fluxo visual: posse → ofensivo → defensivo → disciplina.
const STAT_LABELS = {
  'Ball Possession': 'Posse de Bola',
  'Total Shots': 'Chutes Totais',
  'Shots on Goal': 'Chutes ao Gol',
  'Shots off Goal': 'Chutes para Fora',
  'Blocked Shots': 'Chutes Bloqueados',
  'Corner Kicks': 'Escanteios',
  'Offsides': 'Impedimentos',
  'Goalkeeper Saves': 'Defesas do Goleiro',
  'Total passes': 'Passes Totais',
  'Passes accurate': 'Passes Certos',
  'Passes %': 'Precisão de Passes',
  'Fouls': 'Faltas',
  'Yellow Cards': 'Cartões Amarelos',
  'Red Cards': 'Cartões Vermelhos',
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
        const h = parseFloat(stats[home.id][k]) || 0;
        const a = parseFloat(stats[away.id][k]) || 0;
        const total = h + a || 1;
        const hPct = Math.round((h / total) * 100);
        const aPct = 100 - hPct;
        const isPct = k.includes('%') || k.includes('Possession');
        const hDisplay = escapeHTML(String(stats[home.id][k] ?? '—'));
        const aDisplay = escapeHTML(String(stats[away.id][k] ?? '—'));
        return `
          <div class="live-stats__row">
            <span class="live-stats__h">${hDisplay}</span>
            <div class="live-stats__center">
              <span class="live-stats__lbl">${STAT_LABELS[k]}</span>
              <div class="live-stats__bar-wrap">
                <div class="live-stats__bar-home" style="width:${hPct}%"></div>
                <div class="live-stats__bar-away" style="width:${aPct}%"></div>
              </div>
            </div>
            <span class="live-stats__a">${aDisplay}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ── Recap pós-jogo ──
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

// ── Player Ratings (com badge colorido) ──
export function renderRatings(ratings) {
  if (!ratings?.length) return '<p class="text-sm text-muted">Avaliações ainda não foram publicadas.</p>';
  return `
    <div class="ratings">
      ${ratings.slice(0, 6).map(r => {
        const cls = r.rating >= 8 ? 'badge-rating--elite' : r.rating >= 7 ? 'badge-rating--great' : r.rating >= 6 ? 'badge-rating--good' : 'badge-rating--avg';
        return `
          <a class="rating-item" href="/jogadores/${slugify(r.name)}" data-route-link>
            <span class="rating-item__pos">${escapeHTML(r.team)}</span>
            <span class="rating-item__name">${escapeHTML(r.name)}</span>
            <span class="badge-rating ${cls}">${r.rating.toFixed(1)}</span>
          </a>
        `;
      }).join('')}
    </div>
  `;
}

export function extractRatings(playersBlock) {
  if (!playersBlock?.length) return [];
  const result = [];
  playersBlock.forEach((teamBlock) => {
    const teamName = teamBlock.team?.name;
    (teamBlock.players || []).forEach((p) => {
      const stats = p.statistics?.[0] || {};
      const rating = stats.games?.rating ? parseFloat(stats.games.rating) : null;
      if (rating) result.push({ name: p.player?.name, team: teamName, rating });
    });
  });
  return result.sort((a, b) => b.rating - a.rating);
}

// ── Tabs da partida ──
export function renderMatchTabs(phase) {
  const tabs = phase === 'pre'
    ? [
        { id: 'overview', label: icon('zap', 14) + ' Pré-Jogo', active: true },
        { id: 'lineups', label: icon('users', 14) + ' Provável XI', active: false },
      ]
    : phase === 'live'
    ? [
        { id: 'live', label: '🔴 Ao Vivo', active: true },
        { id: 'lineups', label: icon('users', 14) + ' Escalação', active: false },
        { id: 'stats', label: icon('barChart', 14) + ' Stats', active: false },
        { id: 'events', label: icon('calendar', 14) + ' Eventos', active: false },
      ]
    : [
        { id: 'recap', label: icon('sparkles', 14) + ' Resumo', active: true },
        { id: 'lineups', label: icon('users', 14) + ' Escalação', active: false },
        { id: 'stats', label: icon('barChart', 14) + ' Stats', active: false },
        { id: 'vizual', label: icon('target', 14) + ' Visuais', active: false },
        { id: 'events', label: icon('calendar', 14) + ' Eventos', active: false },
      ];

  return `
    <div class="match-tabs" id="match-tabs-nav" role="tablist">
      ${tabs.map(t => `
        <button class="match-tab ${t.active ? 'match-tab--active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${t.active}">
          ${t.label}
        </button>
      `).join('')}
    </div>
  `;
}

export function bindMatchTabs() {
  const nav = document.getElementById('match-tabs-nav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.match-tab');
    if (!btn) return;
    const tabId = btn.dataset.tab;

    nav.querySelectorAll('.match-tab').forEach(b => {
      b.classList.toggle('match-tab--active', b.dataset.tab === tabId);
      b.setAttribute('aria-selected', b.dataset.tab === tabId);
    });

    document.querySelectorAll('.match-tab-panel').forEach(panel => {
      panel.hidden = panel.dataset.panel !== tabId;
    });
  });
}
