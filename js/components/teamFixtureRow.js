import { icon } from '../icons.js';
import { getTeam, getStadium } from '../data.js';

export function renderTeamFixtureRow(fixture, teamCode, userPrediction) {
  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  const stadium = getStadium(fixture.stadium);
  const isHome = fixture.home === teamCode;
  const opponent = isHome ? away : home;
  const isLive = fixture.status.startsWith('LIVE');
  const isFinished = fixture.status === 'FT';

  const dateStr = new Date(`${fixture.date}T${fixture.time}`).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short'
  });

  let scoreHTML;
  if (isLive || isFinished) {
    const homeScore = fixture.homeScore ?? 0;
    const awayScore = fixture.awayScore ?? 0;
    scoreHTML = `<span class="team-fixture__score">${homeScore} <span class="team-fixture__score-sep">:</span> ${awayScore}</span>`;
  } else {
    scoreHTML = `<span class="team-fixture__time">${fixture.time}</span>`;
  }

  const statusLabel = isLive ? 'AO VIVO' : isFinished ? 'ENCERRADO' : dateStr;
  const statusClass = isLive ? 'team-fixture__status--live' : '';

  const predictionHTML = userPrediction
    ? `<span class="team-fixture__prediction">Seu palpite: ${userPrediction.homeScore} × ${userPrediction.awayScore}</span>`
    : '';

  return `
    <div class="card team-fixture">
      <div class="team-fixture__meta">
        <span class="team-fixture__group">Grupo ${fixture.group}</span>
        <span class="team-fixture__status ${statusClass}">${statusLabel}</span>
      </div>
      <div class="team-fixture__body">
        <span class="team-fixture__vs-label">${isHome ? 'vs' : 'em'}</span>
        <a class="team-fixture__opponent" href="/team/${encodeURIComponent(opponent.code)}" data-route-link data-team-prefetch="${opponent.code}">
          <span class="team-fixture__flag">${opponent.flag}</span>
          <span class="team-fixture__name">${opponent.name}</span>
        </a>
        ${scoreHTML}
      </div>
      <div class="team-fixture__footer">
        ${icon('mapPin', 12)} ${stadium ? `${stadium.city}, ${stadium.country}` : '—'}
        ${predictionHTML}
      </div>
    </div>
  `;
}
