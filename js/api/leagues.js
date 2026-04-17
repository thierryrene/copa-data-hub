// Fetch de fixtures, classificação e artilheiros da API-Football por liga.
// Cache sessionStorage TTL 30min (dados dinâmicos, mudam durante rodadas).

import { loadState } from '../state.js';

const API_BASE = 'https://v3.football.api-sports.io';
const CACHE_PREFIX = 'cdh_league_';
const CACHE_TTL = 30 * 60 * 1000;

function getApiKey() {
  const state = loadState();
  return state?.settings?.apiKey || '';
}

function cacheKey(kind, leagueId, season) {
  return `${CACHE_PREFIX}${kind}_${leagueId}_${season}`;
}

function getCached(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch (_e) {
    return null;
  }
}

function setCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch (_e) {}
}

async function apiGet(path) {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'x-apisports-key': apiKey }
  });
  if (!response.ok) return null;
  return response.json();
}

export async function fetchLeagueFixtures(league, { next = 10 } = {}) {
  const key = cacheKey('fixtures', league.apiId, league.season);
  const cached = getCached(key);
  if (cached) return cached;

  const data = await apiGet(`/fixtures?league=${league.apiId}&season=${league.season}&next=${next}`);
  const fixtures = (data?.response || []).map(parseFixture);
  setCache(key, fixtures);
  return fixtures;
}

export async function fetchLeagueStandings(league) {
  const key = cacheKey('standings', league.apiId, league.season);
  const cached = getCached(key);
  if (cached) return cached;

  const data = await apiGet(`/standings?league=${league.apiId}&season=${league.season}`);
  const groups = data?.response?.[0]?.league?.standings || [];
  const flat = groups.flat().map(parseStanding);
  setCache(key, flat);
  return flat;
}

export async function fetchLeagueTopScorers(league, { limit = 10 } = {}) {
  const key = cacheKey('scorers', league.apiId, league.season);
  const cached = getCached(key);
  if (cached) return cached;

  const data = await apiGet(`/players/topscorers?league=${league.apiId}&season=${league.season}`);
  const scorers = (data?.response || []).slice(0, limit).map(parseScorer);
  setCache(key, scorers);
  return scorers;
}

function parseFixture(entry) {
  const f = entry.fixture || {};
  const league = entry.league || {};
  const teams = entry.teams || {};
  const goals = entry.goals || {};
  return {
    id: f.id,
    date: f.date,
    timestamp: f.timestamp,
    status: f.status?.short || 'NS',
    round: league.round || '',
    venue: f.venue?.name || '',
    city: f.venue?.city || '',
    home: {
      id: teams.home?.id,
      name: teams.home?.name || '',
      logo: teams.home?.logo || ''
    },
    away: {
      id: teams.away?.id,
      name: teams.away?.name || '',
      logo: teams.away?.logo || ''
    },
    homeScore: goals.home,
    awayScore: goals.away
  };
}

function parseStanding(s) {
  return {
    rank: s.rank,
    team: {
      id: s.team?.id,
      name: s.team?.name || '',
      logo: s.team?.logo || ''
    },
    points: s.points,
    played: s.all?.played || 0,
    won: s.all?.win || 0,
    drawn: s.all?.draw || 0,
    lost: s.all?.lose || 0,
    goalsFor: s.all?.goals?.for || 0,
    goalsAgainst: s.all?.goals?.against || 0,
    goalDiff: (s.all?.goals?.for || 0) - (s.all?.goals?.against || 0),
    form: s.form || '',
    description: s.description || ''
  };
}

function parseScorer(entry) {
  const p = entry.player || {};
  const stats = entry.statistics?.[0] || {};
  return {
    id: p.id,
    name: p.name,
    photo: p.photo || '',
    nationality: p.nationality || '',
    team: {
      id: stats.team?.id,
      name: stats.team?.name || '',
      logo: stats.team?.logo || ''
    },
    goals: stats.goals?.total || 0,
    assists: stats.goals?.assists || 0,
    appearances: stats.games?.appearences || 0,
    minutes: stats.games?.minutes || 0
  };
}
