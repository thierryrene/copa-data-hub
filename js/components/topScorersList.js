import { escapeHTML } from '../util/html.js';
import { slugify } from '../util/slug.js';

export function renderTopScorersList(scorers) {
  if (!scorers?.length) {
    return '<p class="text-sm text-muted">Artilheiros não disponíveis.</p>';
  }

  return `
    <div class="top-scorers">
      ${scorers.map((p, i) => {
        const slug = slugify(p.name);
        return `
          <a class="top-scorer" href="/jogadores/${slug}" data-route-link data-player-id="${p.id}" aria-label="Ver detalhes de ${escapeHTML(p.name)}">
            <span class="top-scorer__rank">${i + 1}</span>
            ${p.photo
              ? `<img class="top-scorer__photo" src="${escapeHTML(p.photo)}" alt="" loading="lazy" onerror="this.style.display='none'">`
              : '<span class="top-scorer__photo-placeholder">⚽</span>'}
            <div class="top-scorer__info">
              <span class="top-scorer__name">${escapeHTML(p.name)}</span>
              <span class="top-scorer__team">${escapeHTML(p.team.name)}</span>
            </div>
            <span class="top-scorer__goals">${p.goals}⚽</span>
          </a>
        `;
      }).join('')}
    </div>
  `;
}

export function renderTopScorersSkeleton() {
  return `
    <div class="top-scorers">
      ${Array.from({ length: 5 }, () => `
        <div class="top-scorer">
          <div class="team-page__skeleton" style="height:40px"></div>
        </div>
      `).join('')}
    </div>
  `;
}
