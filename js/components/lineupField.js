import { escapeHTML } from '../util/html.js';

function shortName(fullName) {
  if (!fullName) return '?';
  const parts = fullName.split(' ');
  if (parts.length === 1) return parts[0];
  return parts[parts.length - 1];
}

function renderFieldPlayer(p, isGk) {
  const cls = isGk ? 'lineup-field__player lineup-field__player--gk' : 'lineup-field__player';
  const href = p.id ? `/player/${encodeURIComponent(p.id)}` : '#';
  const photoHTML = p.photo ? `<img class="lineup-field__photo" src="${escapeHTML(p.photo)}" alt="" loading="lazy" onerror="this.style.display='none'">` : '';
  return `
    <a class="${cls}" href="${href}" ${p.id ? 'data-route-link' : ''} title="${escapeHTML(p.name)}" aria-label="Ver detalhes de ${escapeHTML(p.name)}">
      ${photoHTML}
      <span class="lineup-field__number">${p.number || (isGk ? '1' : '')}</span>
      <span class="lineup-field__name">${escapeHTML(shortName(p.name))}</span>
    </a>
  `;
}

export function renderLineupField(lineup, teamFlag) {
  if (!lineup || !lineup.gk) {
    return `
      <div class="lineup-field lineup-field--empty">
        <div class="lineup-field__pitch">
          <div class="lineup-field__message">Escalação indisponível no momento</div>
        </div>
      </div>
    `;
  }

  const flag = teamFlag || '⚽';

  const gkHTML = lineup.gk ? `
    <div class="lineup-field__row lineup-field__row--gk">
      ${renderFieldPlayer(lineup.gk, true)}
    </div>
  ` : '';

  const linesHTML = lineup.lines.map((line) => {
    if (!line.length) return '';
    const playersHTML = line.map((p) => renderFieldPlayer(p, false)).join('');
    return `<div class="lineup-field__row">${playersHTML}</div>`;
  }).join('');

  return `
    <div class="lineup-field">
      <div class="lineup-field__header">
        <span class="lineup-field__flag">${flag}</span>
        <span class="lineup-field__formation">${escapeHTML(lineup.formation)}</span>
      </div>
      <div class="lineup-field__pitch">
        <div class="lineup-field__lines">
          ${linesHTML}
          ${gkHTML}
        </div>
        <div class="lineup-field__markings">
          <div class="lineup-field__center-circle"></div>
          <div class="lineup-field__center-line"></div>
          <div class="lineup-field__penalty-area lineup-field__penalty-area--top"></div>
          <div class="lineup-field__penalty-area lineup-field__penalty-area--bottom"></div>
        </div>
      </div>
    </div>
  `;
}

export function renderLineupSkeleton() {
  return `
    <div class="lineup-field lineup-field--skeleton">
      <div class="lineup-field__pitch">
        <div class="lineup-field__lines">
          <div class="lineup-field__row">
            <div class="lineup-field__player-skeleton"></div>
            <div class="lineup-field__player-skeleton"></div>
            <div class="lineup-field__player-skeleton"></div>
          </div>
          <div class="lineup-field__row">
            <div class="lineup-field__player-skeleton"></div>
            <div class="lineup-field__player-skeleton"></div>
            <div class="lineup-field__player-skeleton"></div>
          </div>
          <div class="lineup-field__row">
            <div class="lineup-field__player-skeleton"></div>
            <div class="lineup-field__player-skeleton"></div>
            <div class="lineup-field__player-skeleton"></div>
            <div class="lineup-field__player-skeleton"></div>
          </div>
          <div class="lineup-field__row lineup-field__row--gk">
            <div class="lineup-field__player-skeleton"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
