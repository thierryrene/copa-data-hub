// Renderiza um campo de futebol SVG com os 11 titulares posicionados.
// Usa o `grid` ("linha:coluna") da API-Football quando presente; cai para
// agrupamento por posição (G/D/M/F) quando ausente.

import { escapeHTML } from '../../util/html.js';

const FIELD_W = 220;
const FIELD_H = 320;

// Agrupa jogadores por linha, levando em conta `grid` ou `pos`.
function groupByRow(players) {
  const rows = new Map();
  const fallback = { G: 1, D: 2, M: 3, F: 4 };

  players.forEach(p => {
    let row;
    if (p.grid && /^\d+:\d+$/.test(p.grid)) {
      row = parseInt(p.grid.split(':')[0], 10);
    } else {
      row = fallback[p.pos] || 3;
    }
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row).push(p);
  });

  // Ordena cada linha por coluna (grid "linha:coluna") quando presente.
  rows.forEach(arr => {
    arr.sort((a, b) => {
      const colA = a.grid ? parseInt(a.grid.split(':')[1] || '0', 10) : 0;
      const colB = b.grid ? parseInt(b.grid.split(':')[1] || '0', 10) : 0;
      return colA - colB;
    });
  });

  return [...rows.entries()].sort((a, b) => a[0] - b[0]);
}

function playerCircle(x, y, p, side) {
  const num = p.number ?? '';
  const lastName = (p.name || '').split(' ').slice(-1).join('') || (p.name || '');
  const safeName = escapeHTML(p.name || '');
  const safePos = escapeHTML(p.pos || '');
  const safeLast = escapeHTML(lastName);

  return `
    <g class="lineup-field__player lineup-field__player--${side}"
       data-player-card="${safeName}"
       transform="translate(${x},${y})"
       tabindex="0"
       role="button"
       aria-label="${safeName} (${safePos}) número ${num}">
      <title>${safeName} · ${safePos} · #${num}</title>
      <circle r="13" class="lineup-field__circle"></circle>
      <text y="4" text-anchor="middle" class="lineup-field__num">${num}</text>
      <text y="26" text-anchor="middle" class="lineup-field__name">${safeLast}</text>
    </g>
  `;
}

// Desenha as linhas básicas do campo (gramado + bordas + linha do meio).
function fieldBackground() {
  return `
    <rect x="0" y="0" width="${FIELD_W}" height="${FIELD_H}" class="lineup-field__pitch"></rect>
    <rect x="4" y="4" width="${FIELD_W - 8}" height="${FIELD_H - 8}" class="lineup-field__bounds"></rect>
    <line x1="4" y1="${FIELD_H / 2}" x2="${FIELD_W - 4}" y2="${FIELD_H / 2}" class="lineup-field__midline"></line>
    <circle cx="${FIELD_W / 2}" cy="${FIELD_H / 2}" r="22" class="lineup-field__center"></circle>
    <rect x="${(FIELD_W - 80) / 2}" y="4" width="80" height="28" class="lineup-field__box"></rect>
    <rect x="${(FIELD_W - 80) / 2}" y="${FIELD_H - 32}" width="80" height="28" class="lineup-field__box"></rect>
  `;
}

export function renderLineupField(lineup, side = 'home', teamName = '') {
  if (!lineup?.startXI?.length) {
    return `
      <div class="lineup-field-empty">
        <p class="text-sm text-muted">Escalação ainda não publicada.</p>
      </div>
    `;
  }

  const rows = groupByRow(lineup.startXI);
  const totalRows = rows.length || 1;
  const slots = [];

  rows.forEach(([_rowNum, players], rowIdx) => {
    // distribuir verticalmente: linha 0 = base do próprio time (perto do gol);
    // 'home' joga de baixo p/ cima, 'away' do topo p/ baixo (espelhado).
    const yPct = (rowIdx + 0.5) / totalRows;
    const y = side === 'home'
      ? FIELD_H - yPct * FIELD_H + 14
      : yPct * FIELD_H + 6;

    players.forEach((p, colIdx) => {
      const xPct = (colIdx + 0.5) / players.length;
      const x = xPct * FIELD_W;
      slots.push(playerCircle(x, y, p, side));
    });
  });

  const formationLbl = lineup.formation ? `Formação ${escapeHTML(lineup.formation)}` : '';
  const coachLbl = lineup.coach ? `Técnico: ${escapeHTML(lineup.coach)}` : '';

  return `
    <div class="lineup-field lineup-field--${side}">
      <div class="lineup-field__head">
        <span class="lineup-field__team">${escapeHTML(teamName)}</span>
        <span class="lineup-field__formation">${formationLbl}</span>
      </div>
      <svg viewBox="0 0 ${FIELD_W} ${FIELD_H}" class="lineup-field__svg" role="img" aria-label="Campo com escalação ${escapeHTML(teamName)}">
        ${fieldBackground()}
        ${slots.join('')}
      </svg>
      ${coachLbl ? `<div class="lineup-field__coach">${coachLbl}</div>` : ''}
    </div>
  `;
}

// Renderiza dois campos lado a lado (mandante / visitante) + lista de banco.
export function renderLineupsBoard(lineups, home, away) {
  if (!lineups?.length) {
    return `
      <div class="lineup-board-empty">
        <p class="text-sm text-muted">Escalações ainda não foram divulgadas. Volte mais perto do kickoff.</p>
      </div>
    `;
  }

  const homeLineup = lineups.find(l => l.teamId === home.id) || lineups[0];
  const awayLineup = lineups.find(l => l.teamId === away.id) || lineups[1];

  const benchHTML = (lineup, side) => {
    if (!lineup?.substitutes?.length) return '';
    return `
      <div class="lineup-bench lineup-bench--${side}">
        <div class="lineup-bench__lbl">Banco</div>
        <ul class="lineup-bench__list">
          ${lineup.substitutes.map(p => `
            <li data-player-card="${escapeHTML(p.name || '')}">
              <span class="lineup-bench__num">${p.number ?? ''}</span>
              <span class="lineup-bench__name">${escapeHTML(p.name || '')}</span>
              <span class="lineup-bench__pos">${escapeHTML(p.pos || '')}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  };

  return `
    <div class="lineup-board">
      <div class="lineup-board__col">
        ${renderLineupField(homeLineup, 'home', home.name)}
        ${benchHTML(homeLineup, 'home')}
      </div>
      <div class="lineup-board__col">
        ${renderLineupField(awayLineup, 'away', away.name)}
        ${benchHTML(awayLineup, 'away')}
      </div>
    </div>
  `;
}
