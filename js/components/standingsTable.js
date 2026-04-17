import { escapeHTML } from '../util/html.js';

export function renderStandingsTable(standings) {
  if (!standings?.length) {
    return '<p class="text-sm text-muted">Classificação não disponível.</p>';
  }

  return `
    <div class="standings-wrap">
      <table class="standings-table">
        <thead>
          <tr>
            <th></th>
            <th>Equipe</th>
            <th>J</th>
            <th>V</th>
            <th>E</th>
            <th>D</th>
            <th>SG</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          ${standings.map(s => `
            <tr>
              <td>${s.rank}</td>
              <td>
                <span class="standings-team">
                  ${s.team.logo ? `<img class="standings-team__logo" src="${escapeHTML(s.team.logo)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}
                  <span class="standings-team__name">${escapeHTML(s.team.name)}</span>
                </span>
              </td>
              <td>${s.played}</td>
              <td>${s.won}</td>
              <td>${s.drawn}</td>
              <td>${s.lost}</td>
              <td>${s.goalDiff > 0 ? '+' : ''}${s.goalDiff}</td>
              <td><strong>${s.points}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function renderStandingsSkeleton() {
  return `
    <div class="standings-wrap">
      ${Array.from({ length: 8 }, () => `
        <div class="team-page__skeleton" style="height:36px;margin-bottom:var(--space-xs)"></div>
      `).join('')}
    </div>
  `;
}
