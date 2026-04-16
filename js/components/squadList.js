import { escapeHTML } from '../util/html.js';
import { POSITION_LABELS } from '../api/squad.js';

const GROUP_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

export function renderSquadList(squad) {
  if (!squad || !squad.players.length) {
    return '<p class="text-sm text-muted">Elenco não disponível no momento.</p>';
  }

  const sections = GROUP_ORDER
    .filter(pos => squad.grouped[pos]?.length)
    .map(pos => {
      const label = POSITION_LABELS[pos] || pos;
      const players = squad.grouped[pos];
      const rows = players.map(p => `
        <div class="squad-list__player">
          <span class="squad-list__number">${p.number || '—'}</span>
          ${p.photo ? `<img class="squad-list__photo" src="${escapeHTML(p.photo)}" alt="" loading="lazy" onerror="this.style.display='none'">` : '<span class="squad-list__photo-placeholder">⚽</span>'}
          <div class="squad-list__info">
            <span class="squad-list__name">${escapeHTML(p.name)}</span>
            ${p.age ? `<span class="squad-list__age">${p.age} anos</span>` : ''}
          </div>
          <span class="squad-list__pos-badge">${escapeHTML(p.positionShort)}</span>
        </div>
      `).join('');

      return `
        <div class="squad-list__group">
          <div class="squad-list__group-title">${label} (${players.length})</div>
          ${rows}
        </div>
      `;
    }).join('');

  const dateStr = squad.fetchedAt
    ? new Date(squad.fetchedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : '';

  return `
    <div class="squad-list">
      ${sections}
      <div class="squad-list__footer">
        ${squad.totalPlayers} jogadores · Fonte: API-Football${dateStr ? ` · Atualizado em ${dateStr}` : ''}
      </div>
    </div>
  `;
}

export function renderSquadSkeleton() {
  return `
    <div class="squad-list">
      ${Array.from({ length: 6 }, () => `
        <div class="squad-list__player squad-list__player--skeleton">
          <div class="team-page__skeleton" style="width:24px;height:24px;border-radius:50%"></div>
          <div class="team-page__skeleton" style="width:60%;height:14px"></div>
        </div>
      `).join('')}
    </div>
  `;
}
