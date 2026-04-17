import { escapeHTML } from '../util/html.js';
import { icon } from '../icons.js';

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

function statusLabel(fixture) {
  const s = fixture.status;
  if (s === 'FT' || s === 'AET' || s === 'PEN') return 'Encerrado';
  if (s === 'LIVE' || s === '1H' || s === '2H' || s === 'HT' || s === 'ET' || s === 'BT' || s === 'P') return 'AO VIVO';
  if (s === 'PST') return 'Adiado';
  if (s === 'CANC') return 'Cancelado';
  return formatDateTime(fixture.date);
}

function renderTeamCell(team) {
  const logo = team.logo
    ? `<img class="league-fixture__logo" src="${escapeHTML(team.logo)}" alt="" loading="lazy" onerror="this.style.display='none'">`
    : '<span class="league-fixture__logo-fallback">⚽</span>';
  return `
    <span class="league-fixture__team">
      ${logo}
      <span class="league-fixture__team-name">${escapeHTML(team.name)}</span>
    </span>
  `;
}

export function renderLeagueFixtureList(fixtures) {
  if (!fixtures?.length) {
    return '<p class="text-sm text-muted">Nenhum jogo agendado no momento.</p>';
  }

  return `
    <div class="league-fixtures">
      ${fixtures.map(f => {
        const isLive = ['LIVE', '1H', '2H', 'HT', 'ET'].includes(f.status);
        const isFinished = f.status === 'FT';
        const centerContent = (isLive || isFinished)
          ? `<span class="league-fixture__score">${f.homeScore ?? 0} <span class="league-fixture__score-sep">:</span> ${f.awayScore ?? 0}</span>`
          : `<span class="league-fixture__vs">vs</span>`;

        return `
          <div class="card league-fixture ${isLive ? 'league-fixture--live' : ''}">
            <div class="league-fixture__meta">
              <span>${escapeHTML(f.round || '')}</span>
              <span class="${isLive ? 'league-fixture__status--live' : ''}">${statusLabel(f)}</span>
            </div>
            <div class="league-fixture__body">
              ${renderTeamCell(f.home)}
              ${centerContent}
              ${renderTeamCell(f.away)}
            </div>
            ${f.venue ? `<div class="league-fixture__footer">${icon('mapPin', 12)} ${escapeHTML(f.venue)}${f.city ? ', ' + escapeHTML(f.city) : ''}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function renderLeagueFixtureSkeleton() {
  return `
    <div class="league-fixtures">
      ${Array.from({ length: 4 }, () => `
        <div class="card league-fixture league-fixture--skeleton">
          <div class="team-page__skeleton" style="height:14px;width:40%;margin-bottom:var(--space-sm)"></div>
          <div class="team-page__skeleton" style="height:40px;margin-bottom:var(--space-sm)"></div>
          <div class="team-page__skeleton" style="height:10px;width:60%"></div>
        </div>
      `).join('')}
    </div>
  `;
}
