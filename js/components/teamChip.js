import { getTeam } from '../data.js';

export function renderTeamChip(teamCode, { asLink = true } = {}) {
  const team = getTeam(teamCode);
  if (!team) return '';
  const content = `
    <span class="team-chip__flag">${team.flag}</span>
    <span class="team-chip__name">${team.code}</span>
    <span class="team-chip__ranking">#${team.ranking}</span>
  `;
  if (asLink) {
    return `<a class="team-chip" href="/selecoes/${team.slug}" data-route-link data-team-prefetch="${team.code}">${content}</a>`;
  }
  return `<span class="team-chip">${content}</span>`;
}
