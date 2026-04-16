import { escapeHTML } from '../util/html.js';

export function renderPlayerHero(player) {
  if (!player) return '';

  const birthStr = player.birth?.date
    ? new Date(player.birth.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const birthPlace = [player.birth?.place, player.birth?.country].filter(Boolean).join(', ');

  const positionMap = {
    Goalkeeper: 'Goleiro',
    Defender: 'Defensor',
    Midfielder: 'Meio-campista',
    Attacker: 'Atacante'
  };
  const positionLabel = positionMap[player.position] || player.position || '';

  const teamLogoHTML = player.currentTeam?.logo
    ? `<img class="player-hero__team-logo" src="${escapeHTML(player.currentTeam.logo)}" alt="" loading="lazy" onerror="this.style.display='none'">`
    : '';

  const physicalHTML = [player.height, player.weight].filter(Boolean).join(' · ');

  return `
    <section class="player-hero">
      <div class="player-hero__photo-wrap">
        ${player.photo
          ? `<img class="player-hero__photo" src="${escapeHTML(player.photo)}" alt="${escapeHTML(player.name)}" loading="lazy">`
          : `<div class="player-hero__photo-placeholder">⚽</div>`}
        ${player.number ? `<span class="player-hero__number">#${player.number}</span>` : ''}
      </div>
      <div class="player-hero__info">
        <div class="player-hero__kicker">${escapeHTML(positionLabel)}</div>
        <h1 class="player-hero__name">${escapeHTML(player.name)}</h1>
        <div class="player-hero__tags">
          <span class="player-hero__tag">${escapeHTML(player.nationality)}</span>
          ${player.currentTeam?.name ? `
            <span class="player-hero__tag player-hero__tag--club">
              ${teamLogoHTML} ${escapeHTML(player.currentTeam.name)}
            </span>
          ` : ''}
          ${player.captain ? '<span class="player-hero__tag player-hero__tag--gold">© Capitão</span>' : ''}
        </div>
        <div class="player-hero__meta">
          ${player.age ? `${player.age} anos` : ''}
          ${physicalHTML ? ` · ${physicalHTML}` : ''}
          ${birthStr ? ` · Nasc. ${birthStr}` : ''}
        </div>
        ${birthPlace ? `<div class="player-hero__meta">${escapeHTML(birthPlace)}</div>` : ''}
      </div>
    </section>
  `;
}

export function renderPlayerHeroSkeleton() {
  return `
    <section class="player-hero player-hero--skeleton">
      <div class="player-hero__photo-wrap">
        <div class="player-hero__photo-placeholder team-page__skeleton" style="width:80px;height:80px;border-radius:50%"></div>
      </div>
      <div class="player-hero__info">
        <div class="team-page__skeleton" style="width:80px;height:12px"></div>
        <div class="team-page__skeleton team-page__skeleton--lg" style="width:60%;margin-top:var(--space-sm)"></div>
        <div class="team-page__skeleton" style="width:50%;margin-top:var(--space-sm)"></div>
      </div>
    </section>
  `;
}
