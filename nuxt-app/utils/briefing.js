// Helpers para o MatchBriefing.vue.
// Calcula classificação do grupo a partir dos fixtures (respeitando mock)
// e deriva rótulo de rodada + texto do que está em jogo.

import { FIXTURES, GROUPS, getTeam } from './data.js';
import { matchPhase } from './match.js';

export function computeGroupStandings(groupId) {
  const groupTeams = GROUPS[groupId]?.teams || [];
  const allFixtures = FIXTURES;
  return groupTeams
    .map((code) => {
      const played = allFixtures.filter(
        (f) =>
          f.group === groupId &&
          (f.home === code || f.away === code) &&
          matchPhase(f) === 'finished'
      );
      let pts = 0;
      let gf = 0;
      let ga = 0;
      played.forEach((f) => {
        const isHome = f.home === code;
        const gs = isHome ? f.homeScore ?? 0 : f.awayScore ?? 0;
        const gc = isHome ? f.awayScore ?? 0 : f.homeScore ?? 0;
        gf += gs;
        ga += gc;
        if (gs > gc) pts += 3;
        else if (gs === gc) pts += 1;
      });
      return { code, pts, gd: gf - ga, gf, played: played.length };
    })
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

export function matchdayLabel(fixture) {
  const groupFixtures = FIXTURES
    .filter((f) => f.group === fixture.group && (f.home === fixture.home || f.home === fixture.away))
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  const idx = groupFixtures.findIndex((f) => f.id === fixture.id);
  return idx >= 0 ? `Rodada ${idx + 1}` : 'Fase de Grupos';
}

export function stakesText(standings, homeCode, awayCode, groupId) {
  const hSt = standings.find((s) => s.code === homeCode) || { pts: 0, played: 0 };
  const aSt = standings.find((s) => s.code === awayCode) || { pts: 0, played: 0 };
  const home = getTeam(homeCode);
  const away = getTeam(awayCode);

  if (hSt.played === 0 && aSt.played === 0) {
    return `Abertura do Grupo ${groupId}. Ambas as seleções estreiam no torneio.`;
  }
  const lines = [];
  if (hSt.pts >= 6) lines.push(`${home.flag} ${home.code} já garantido nas oitavas com ${hSt.pts} pts.`);
  else if (hSt.pts === 0 && hSt.played > 0) lines.push(`${home.flag} ${home.code} precisa reagir — ainda sem pontos.`);
  else lines.push(`${home.flag} ${home.code} tem ${hSt.pts} pt${hSt.pts !== 1 ? 's' : ''} em ${hSt.played} jogo${hSt.played !== 1 ? 's' : ''}.`);

  if (aSt.pts >= 6) lines.push(`${away.flag} ${away.code} já garantido nas oitavas com ${aSt.pts} pts.`);
  else if (aSt.pts === 0 && aSt.played > 0) lines.push(`${away.flag} ${away.code} precisa reagir — ainda sem pontos.`);
  else lines.push(`${away.flag} ${away.code} tem ${aSt.pts} pt${aSt.pts !== 1 ? 's' : ''} em ${aSt.played} jogo${aSt.played !== 1 ? 's' : ''}.`);

  return lines.join(' ');
}
