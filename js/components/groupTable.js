import { icon } from '../icons.js';
import { getTeam } from '../data.js';

export function renderGroupTable(groupId, teamCodes) {
  const standings = teamCodes.map((code, i) => ({
    code,
    team: getTeam(code),
    pos: i + 1,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0
  }));

  const rows = standings.map((s, i) => {
    let rowClass = '';
    if (i < 2) rowClass = 'qualified';
    else if (i === 2) rowClass = 'third';

    return `
      <tr class="${rowClass}">
        <td>
          <button class="team-cell team-cell--button" type="button" data-team-detail="${s.code}" aria-label="Ver detalhes de ${s.team.name}">
            <span class="team-cell__pos">${s.pos}</span>
            <span class="team-cell__flag">${s.team.flag}</span>
            ${s.team.code}
          </button>
        </td>
        <td>${s.played}</td>
        <td>${s.won}</td>
        <td>${s.drawn}</td>
        <td>${s.lost}</td>
        <td>${s.gd > 0 ? '+' : ''}${s.gd}</td>
        <td><strong>${s.pts}</strong></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card group-card">
      <div class="group-card__title">
        ${icon('shield', 18, 'text-gold')} Grupo ${groupId}
      </div>
      <table class="group-table">
        <thead>
          <tr>
            <th>Seleção</th>
            <th>J</th>
            <th>V</th>
            <th>E</th>
            <th>D</th>
            <th>SG</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
