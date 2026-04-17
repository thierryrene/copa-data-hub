// Helpers para estado e identificação de partidas.

import { getTeam } from '../data.js';

const LIVE_STATUSES = new Set(['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P']);
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);

export function matchSlug(fixture) {
  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  if (!home || !away) return fixture.id;
  return `${home.slug}-vs-${away.slug}-${fixture.date}`;
}

export function findFixtureBySlug(fixtures, slug) {
  return fixtures.find(f => matchSlug(f) === slug) || fixtures.find(f => f.id === slug) || null;
}

export function matchKickoff(fixture) {
  return new Date(`${fixture.date}T${fixture.time}:00`).getTime();
}

export function matchPhase(fixture) {
  if (FINISHED_STATUSES.has(fixture.status)) return 'finished';
  if (LIVE_STATUSES.has(fixture.status)) return 'live';
  if (matchKickoff(fixture) - Date.now() < 0) return 'live';
  return 'pre';
}

export function isLive(fixture) {
  return matchPhase(fixture) === 'live';
}

export function isFinished(fixture) {
  return matchPhase(fixture) === 'finished';
}

export function timeUntilKickoff(fixture) {
  const diff = matchKickoff(fixture) - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, totalMs: diff };
}

export function predictionResultXP(prediction, fixture) {
  if (!prediction || !isFinished(fixture)) return 0;
  if (fixture.homeScore === null || fixture.awayScore === null) return 0;
  const exact = prediction.homeScore === fixture.homeScore && prediction.awayScore === fixture.awayScore;
  if (exact) return 100;
  const realDiff = Math.sign(fixture.homeScore - fixture.awayScore);
  const predDiff = Math.sign(prediction.homeScore - prediction.awayScore);
  if (realDiff === predDiff) return 50;
  return 5;
}
