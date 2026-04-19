import { icon } from '../icons.js';
import { getTeam, FIXTURES } from '../data.js';

// Calcula pontos e form (últimos 3 resultados) para cada time no grupo
function computeStandings(groupId, teamCodes) {
  const groupFixtures = FIXTURES.filter(f => f.group === groupId);

  const stats = {};
  teamCodes.forEach(code => {
    stats[code] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0, form: [] };
  });

  groupFixtures.forEach(f => {
    if (f.homeScore == null || f.awayScore == null) return;
    const h = f.home, a = f.away;
    if (!stats[h] || !stats[a]) return;

    stats[h].played++; stats[a].played++;
    stats[h].gf += f.homeScore; stats[h].ga += f.awayScore;
    stats[a].gf += f.awayScore; stats[a].ga += f.homeScore;

    if (f.homeScore > f.awayScore) {
      stats[h].won++; stats[h].pts += 3;
      stats[a].lost++;
      stats[h].form.push('W'); stats[a].form.push('L');
    } else if (f.homeScore < f.awayScore) {
      stats[a].won++; stats[a].pts += 3;
      stats[h].lost++;
      stats[a].form.push('W'); stats[h].form.push('L');
    } else {
      stats[h].drawn++; stats[h].pts += 1;
      stats[a].drawn++; stats[a].pts += 1;
      stats[h].form.push('D'); stats[a].form.push('D');
    }
  });

  return teamCodes
    .map(code => ({ code, ...stats[code], team: getTeam(code), gd: stats[code].gf - stats[code].ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

function renderFormStrip(form) {
  const last3 = form.slice(-3);
  if (!last3.length) return '<span class="form-strip__empty">—</span>';
  return `<div class="form-strip">${last3.map(r => `<span class="form-strip__pill form-strip__pill--${r.toLowerCase()}">${r}</span>`).join('')}</div>`;
}

function renderScenarios(standings, groupId) {
  const played = standings.some(s => s.played > 0);
  if (!played) return '';

  const totalGames = standings[0].played + standings[1].played + standings[2].played + standings[3].played;
  const maxGamesPerTeam = 3; // fase de grupos = 3 jogos

  const notes = standings.map((s, i) => {
    const gamesLeft = maxGamesPerTeam - s.played;
    if (gamesLeft === 0) return null;

    const maxPossible = s.pts + gamesLeft * 3;
    const needed = standings[1].pts - s.pts + 1; // pontos para passar de 2º

    if (i < 2) {
      return `${s.team.flag} <b>${s.team.code}</b> já está classificado` + (s.played === maxGamesPerTeam ? '.' : ` — ainda joga ${gamesLeft}x.`);
    }
    if (i === 2) {
      if (maxPossible < standings[1].pts) {
        return `${s.team.flag} <b>${s.team.code}</b> disputará vaga como melhor 3º.`;
      }
      return `${s.team.flag} <b>${s.team.code}</b> precisa de ${Math.max(0, needed)} pts para passar de 2º.`;
    }
    return `${s.team.flag} <b>${s.team.code}</b> precisa vencer todos os jogos restantes para ter chance.`;
  }).filter(Boolean);

  if (!notes.length) return '';

  return `
    <div class="group-scenarios">
      <div class="group-scenarios__title">${icon('zap', 12)} Cenários</div>
      <ul class="group-scenarios__list">
        ${notes.map(n => `<li>${n}</li>`).join('')}
      </ul>
    </div>
  `;
}

export function renderGroupTable(groupId, teamCodes) {
  const standings = computeStandings(groupId, teamCodes);

  const rows = standings.map((s, i) => {
    let rowClass = '';
    if (i < 2) rowClass = 'qualified';
    else if (i === 2) rowClass = 'third';

    return `
      <tr class="${rowClass}">
        <td>
          <button class="team-cell team-cell--button" type="button" data-team-detail="${s.code}" aria-label="Ver detalhes de ${s.team?.name || s.code}">
            <span class="team-cell__pos">${i + 1}</span>
            <span class="team-cell__flag">${s.team?.flag || ''}</span>
            ${s.code}
          </button>
        </td>
        <td>${s.played}</td>
        <td>${s.won}</td>
        <td>${s.drawn}</td>
        <td>${s.lost}</td>
        <td>${s.gd > 0 ? '+' : ''}${s.gd}</td>
        <td><strong>${s.pts}</strong></td>
        <td class="group-table__form">${renderFormStrip(s.form)}</td>
      </tr>
    `;
  }).join('');

  const scenarios = renderScenarios(standings, groupId);

  return `
    <div class="card group-card">
      <div class="group-card__title">
        ${icon('shield', 18, 'text-gold')} Grupo ${groupId}
      </div>
      <table class="group-table">
        <thead>
          <tr>
            <th>Seleção</th>
            <th title="Jogos">J</th>
            <th title="Vitórias">V</th>
            <th title="Empates">E</th>
            <th title="Derrotas">D</th>
            <th title="Saldo de Gols">SG</th>
            <th title="Pontos">Pts</th>
            <th title="Forma recente">Forma</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="group-card__legend">
        <span class="group-card__legend-dot group-card__legend-dot--q"></span> Classificado direto
        <span class="group-card__legend-dot group-card__legend-dot--t3"></span> Melhor 3º
      </div>
      ${scenarios}
    </div>
  `;
}
