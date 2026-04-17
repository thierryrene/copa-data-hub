// API-Football wrappers de partida com cache adaptativo por estado:
// LIVE = 30s, pré-jogo = 5min, encerrado = 24h.

import { loadState } from '../state.js';

const API_BASE = 'https://v3.football.api-sports.io';
const CACHE_PREFIX = 'cdh_match_';

const TTL_LIVE = 30 * 1000;
const TTL_PRE = 5 * 60 * 1000;
const TTL_DONE = 24 * 60 * 60 * 1000;

function getApiKey() {
  return loadState()?.settings?.apiKey || '';
}

function ttlFor(phase) {
  if (phase === 'live') return TTL_LIVE;
  if (phase === 'finished') return TTL_DONE;
  return TTL_PRE;
}

function getCached(key, ttl) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts > ttl) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch (_e) { return null; }
}

function setCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch (_e) {}
}

async function apiGet(path) {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    const r = await fetch(`${API_BASE}${path}`, {
      headers: { 'x-apisports-key': apiKey }
    });
    if (!r.ok) return null;
    return r.json();
  } catch (_e) { return null; }
}

export async function fetchMatchData(fixtureId, phase = 'pre') {
  if (!fixtureId) return null;
  const key = `${CACHE_PREFIX}${fixtureId}`;
  const cached = getCached(key, ttlFor(phase));
  if (cached) return cached;

  const data = await apiGet(`/fixtures?id=${fixtureId}`);
  const entry = data?.response?.[0];
  if (!entry) return null;

  const parsed = {
    id: entry.fixture?.id,
    date: entry.fixture?.date,
    status: entry.fixture?.status?.short || 'NS',
    elapsed: entry.fixture?.status?.elapsed,
    venue: entry.fixture?.venue?.name,
    referee: entry.fixture?.referee,
    home: { id: entry.teams?.home?.id, name: entry.teams?.home?.name, logo: entry.teams?.home?.logo },
    away: { id: entry.teams?.away?.id, name: entry.teams?.away?.name, logo: entry.teams?.away?.logo },
    homeScore: entry.goals?.home,
    awayScore: entry.goals?.away,
    events: (entry.events || []).map(parseEvent),
    statistics: parseStatistics(entry.statistics),
    lineups: (entry.lineups || []).map(parseLineup),
    players: entry.players || []
  };

  setCache(key, parsed);
  return parsed;
}

export async function fetchHeadToHead(homeApiId, awayApiId, limit = 5) {
  if (!homeApiId || !awayApiId) return [];
  const key = `${CACHE_PREFIX}h2h_${homeApiId}_${awayApiId}`;
  const cached = getCached(key, TTL_DONE);
  if (cached) return cached;

  const data = await apiGet(`/fixtures/headtohead?h2h=${homeApiId}-${awayApiId}&last=${limit}`);
  const result = (data?.response || []).map(e => ({
    date: e.fixture?.date,
    homeName: e.teams?.home?.name,
    awayName: e.teams?.away?.name,
    homeScore: e.goals?.home,
    awayScore: e.goals?.away,
    league: e.league?.name
  }));

  setCache(key, result);
  return result;
}

function parseEvent(e) {
  return {
    minute: e.time?.elapsed || 0,
    extra: e.time?.extra,
    teamId: e.team?.id,
    teamName: e.team?.name,
    playerName: e.player?.name,
    assistName: e.assist?.name,
    type: e.type,
    detail: e.detail,
    comments: e.comments
  };
}

function parseStatistics(arr) {
  if (!arr || !arr.length) return null;
  const result = {};
  arr.forEach((teamStats) => {
    const teamId = teamStats.team?.id;
    if (!teamId) return;
    result[teamId] = {};
    (teamStats.statistics || []).forEach((s) => {
      result[teamId][s.type] = s.value;
    });
  });
  return result;
}

function parseLineup(l) {
  return {
    teamId: l.team?.id,
    formation: l.formation,
    coach: l.coach?.name,
    startXI: (l.startXI || []).map(p => ({
      id: p.player?.id,
      name: p.player?.name,
      number: p.player?.number,
      pos: p.player?.pos,
      grid: p.player?.grid
    })),
    substitutes: (l.substitutes || []).map(p => ({
      id: p.player?.id,
      name: p.player?.name,
      number: p.player?.number,
      pos: p.player?.pos
    }))
  };
}
