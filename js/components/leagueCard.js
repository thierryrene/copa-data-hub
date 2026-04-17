import { escapeHTML } from '../util/html.js';
import { icon } from '../icons.js';

export function renderLeagueCard(league) {
  return `
    <a class="league-card" href="/campeonatos/${league.slug}" data-route-link
       style="--league-color: ${league.color}; --league-accent: ${league.accent};"
       aria-label="Ver ${league.name}">
      <div class="league-card__emoji">${league.emoji}</div>
      <div class="league-card__body">
        <div class="league-card__name">${escapeHTML(league.name)}</div>
        <div class="league-card__meta">${escapeHTML(league.country)} · Temporada ${league.season}/${String(league.season + 1).slice(2)}</div>
        <div class="league-card__desc">${escapeHTML(league.description)}</div>
      </div>
      <div class="league-card__arrow">${icon('chevronRight', 20)}</div>
    </a>
  `;
}
