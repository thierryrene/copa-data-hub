import { icon } from '../icons.js';
import { getTeam, getStadium } from '../data.js';

export function renderMatchCard(fixture) {
  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  const stadium = getStadium(fixture.stadium);
  const isLive = fixture.status.startsWith('LIVE');
  const isFinished = fixture.status === 'FT';

  const dateStr = new Date(`${fixture.date}T${fixture.time}`).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short'
  });

  const centerContent = (isLive || isFinished)
    ? `
      <div class="match-card__score">
        <span>${fixture.homeScore}</span>
        <span class="match-card__score-sep">:</span>
        <span>${fixture.awayScore}</span>
      </div>
    `
    : `<div class="match-card__vs">${fixture.time}</div>`;

  const statusHTML = isLive
    ? `<span class="match-card__status live">AO VIVO</span>`
    : isFinished
      ? `<span class="match-card__status">ENCERRADO</span>`
      : `<span class="match-card__status">${dateStr}</span>`;

  return `
    <div class="card match-card" data-fixture="${fixture.id}">
      <div class="match-card__header">
        <span class="match-card__group">Grupo ${fixture.group}</span>
        ${statusHTML}
      </div>
      <div class="match-card__teams">
        <a class="match-card__team match-card__team--link" href="/team/${encodeURIComponent(home.code)}" data-route-link data-team-prefetch="${home.code}" aria-label="Ver detalhes de ${home.name}">
          <span class="match-card__flag">${home.flag}</span>
          <span class="match-card__name">${home.code}</span>
        </a>
        ${centerContent}
        <a class="match-card__team match-card__team--link" href="/team/${encodeURIComponent(away.code)}" data-route-link data-team-prefetch="${away.code}" aria-label="Ver detalhes de ${away.name}">
          <span class="match-card__flag">${away.flag}</span>
          <span class="match-card__name">${away.code}</span>
        </a>
      </div>
      <div class="match-card__footer">
        ${icon('mapPin', 14)} ${stadium ? stadium.city : '—'}
      </div>
    </div>
  `;
}
