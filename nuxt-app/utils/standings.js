// Compute group-stage standings from fixtures.
// Returns array sorted by pts, goal diff, goals for.
export function computeStandings(groupId, teamCodes, fixtures) {
  const groupFixtures = fixtures.filter(f => f.group === groupId);

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
