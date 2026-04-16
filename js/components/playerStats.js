import { escapeHTML } from '../util/html.js';

function statItem(emoji, label, value, highlight = false) {
  const cls = highlight ? 'player-stats__item player-stats__item--highlight' : 'player-stats__item';
  return `
    <div class="${cls}">
      <span class="player-stats__emoji">${emoji}</span>
      <span class="player-stats__value">${value ?? '—'}</span>
      <span class="player-stats__label">${label}</span>
    </div>
  `;
}

export function renderPlayerStats(player) {
  if (!player?.stats) return '';

  const s = player.stats;
  const ratingStr = player.rating ? player.rating.toFixed(1) : '—';
  const passAcc = s.passAccuracy != null ? `${s.passAccuracy}%` : '—';
  const dribblesStr = s.dribblesAttempts ? `${s.dribblesSuccess}/${s.dribblesAttempts}` : '—';

  const leagueName = player.currentLeague?.name
    ? escapeHTML(player.currentLeague.name)
    : 'Temporada atual';
  const season = player.currentLeague?.season || '';
  const seasonLabel = season ? `${season}/${String(season + 1).slice(2)}` : '';

  return `
    <div class="player-stats">
      <div class="player-stats__header">
        <span class="player-stats__title">Estatísticas ${seasonLabel}</span>
        <span class="player-stats__league">${leagueName}</span>
      </div>
      <div class="player-stats__grid">
        ${statItem('⚽', 'Gols', s.goals, s.goals > 0)}
        ${statItem('🎯', 'Assist.', s.assists, s.assists > 0)}
        ${statItem('📋', 'Jogos', s.appearances)}
        ${statItem('⏱', 'Minutos', s.minutes ? s.minutes.toLocaleString('pt-BR') : '—')}
        ${statItem('📊', 'Rating', ratingStr, player.rating >= 7.0)}
        ${statItem('🎯', 'Passes', passAcc)}
        ${statItem('💨', 'Dribles', dribblesStr)}
        ${statItem('🔥', 'Chutes', s.shotsTotal || '—')}
        ${statItem('🛡', 'Desarmes', s.tackles || '—')}
        ${statItem('🟡', 'Amarelos', s.yellowCards)}
        ${statItem('🟥', 'Vermelhos', s.redCards)}
        ${player.position === 'Goalkeeper' ? statItem('🧤', 'Defesas', s.saves) : ''}
      </div>
    </div>
  `;
}

export function renderPlayerStatsSkeleton() {
  return `
    <div class="player-stats player-stats--skeleton">
      <div class="player-stats__header">
        <div class="team-page__skeleton" style="width:120px;height:14px"></div>
      </div>
      <div class="player-stats__grid">
        ${Array.from({ length: 8 }, () => `
          <div class="player-stats__item">
            <div class="team-page__skeleton" style="width:32px;height:32px;border-radius:var(--radius-md)"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
