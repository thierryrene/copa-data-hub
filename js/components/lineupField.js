import { escapeHTML } from '../util/html.js';

function shortName(fullName) {
  if (!fullName) return '?';
  const parts = fullName.split(' ');
  if (parts.length === 1) return parts[0];
  return parts[parts.length - 1];
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
      <div class="lineup-field__player lineup-field__player--gk" title="${escapeHTML(lineup.gk.name)}">
        ${lineup.gk.photo ? `<img class="lineup-field__photo" src="${escapeHTML(lineup.gk.photo)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}
        <span class="lineup-field__number">${lineup.gk.number || '1'}</span>
        <span class="lineup-field__name">${escapeHTML(shortName(lineup.gk.name))}</span>
      </div>
    </div>
  ` : '';

  const linesHTML = lineup.lines.map((line, i) => {
    if (!line.length) return '';
    const playersHTML = line.map((p) => `
      <div class="lineup-field__player" title="${escapeHTML(p.name)}">
        ${p.photo ? `<img class="lineup-field__photo" src="${escapeHTML(p.photo)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}
        <span class="lineup-field__number">${p.number || ''}</span>
        <span class="lineup-field__name">${escapeHTML(shortName(p.name))}</span>
      </div>
    `).join('');
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
