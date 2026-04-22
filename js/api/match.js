// API-Football wrappers de partida com cache adaptativo por estado:
// LIVE = 30s, pré-jogo = 5min, encerrado = 24h.

import { loadState } from '../state.js';
import { setApiError, clearApiError, classifyHttpStatus, ERROR_KIND } from '../util/apiStatus.js';
import { isMockActive } from '../util/mockMode.js';
import { mockMatchData, mockH2H, mockInjuries, mockTeamForm, mockWeather } from '../util/mockData.js';
import { FIXTURES, TEAM_API_IDS } from '../data.js';

function findFixtureById(id) {
  return FIXTURES.find(f => f.id === id) || null;
}
function teamCodeFromApiId(apiId) {
  return Object.keys(TEAM_API_IDS).find(k => TEAM_API_IDS[k] === apiId) || null;
}
function teamNameFromApiId(apiId) {
  // usado só para mock H2H — buscar via fixtures
  const fx = FIXTURES.find(f => TEAM_API_IDS[f.home] === apiId || TEAM_API_IDS[f.away] === apiId);
  if (!fx) return '';
  if (TEAM_API_IDS[fx.home] === apiId) return fx.home;
  return fx.away;
}

const API_BASE = 'https://v3.football.api-sports.io';
const CACHE_PREFIX = 'cdh_match_';

const TTL_LIVE = 30 * 1000;
const TTL_PRE = 5 * 60 * 1000;
const TTL_DONE = 24 * 60 * 60 * 1000;

function getApiKey() {
  const s = loadState()?.settings;
  return s?.apiSportsKey || s?.apiKey || '';
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
  if (!apiKey) {
    setApiError(ERROR_KIND.NO_KEY);
    console.warn(`[api-football] sem chave; ignorando ${path}`);
    return null;
  }
  try {
    const r = await fetch(`${API_BASE}${path}`, {
      headers: { 'x-apisports-key': apiKey }
    });
    if (!r.ok) {
      const kind = classifyHttpStatus(r.status);
      setApiError(kind, `HTTP ${r.status}`);
      console.error(`[api-football] ${r.status} em ${path}`);
      return null;
    }
    const json = await r.json();
    // API-Football retorna 200 mesmo em erros lógicos — verificar payload.
    if (json?.errors && Object.keys(json.errors).length) {
      const firstErr = Object.values(json.errors)[0];
      const isQuota = String(firstErr).toLowerCase().includes('limit') || String(firstErr).toLowerCase().includes('quota');
      setApiError(isQuota ? ERROR_KIND.RATE_LIMIT : ERROR_KIND.HTTP, String(firstErr));
      console.error(`[api-football] payload errors em ${path}:`, json.errors);
      return null;
    }
    clearApiError();
    return json;
  } catch (e) {
    setApiError(ERROR_KIND.NETWORK, e?.message || '');
    console.error(`[api-football] network fail em ${path}:`, e);
    return null;
  }
}

async function apiGetExternal(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return r.json();
  } catch (e) {
    console.warn(`[external-api] falha em ${url}:`, e?.message);
    return null;
  }
}

export async function fetchMatchData(fixtureId, phase = 'pre') {
  if (!fixtureId) return null;

  if (isMockActive()) {
    const fx = findFixtureById(fixtureId);
    if (fx) return mockMatchData(fx);
  }

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

  if (isMockActive()) {
    return mockH2H(teamNameFromApiId(homeApiId), teamNameFromApiId(awayApiId));
  }

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

// Desfalques (lesionados/suspensos) por partida — TTL pré-jogo (5min).
export async function fetchInjuries(fixtureId) {
  if (!fixtureId) return [];

  if (isMockActive()) {
    const fx = findFixtureById(fixtureId);
    if (fx) return mockInjuries(fx);
  }

  const key = `${CACHE_PREFIX}injuries_${fixtureId}`;
  const cached = getCached(key, TTL_PRE);
  if (cached) return cached;

  const data = await apiGet(`/injuries?fixture=${fixtureId}`);
  const result = (data?.response || []).map(e => ({
    teamId: e.team?.id,
    teamName: e.team?.name,
    playerName: e.player?.name,
    playerPos: e.player?.position,
    type: e.player?.type,         // "Missing Fixture" | "Questionable"
    reason: e.player?.reason       // ex: "Knock", "Suspended"
  }));

  setCache(key, result);
  return result;
}

// Forma recente do time — últimos N jogos com W/D/L. Cache 24h.
export async function fetchTeamForm(teamApiId, last = 5) {
  if (!teamApiId) return [];

  if (isMockActive()) {
    return mockTeamForm(teamApiId, teamCodeFromApiId(teamApiId));
  }

  const key = `${CACHE_PREFIX}form_${teamApiId}_${last}`;
  const cached = getCached(key, TTL_DONE);
  if (cached) return cached;

  const data = await apiGet(`/fixtures?team=${teamApiId}&last=${last}`);
  const result = (data?.response || []).map(e => {
    const isHome = e.teams?.home?.id === teamApiId;
    const gf = isHome ? e.goals?.home : e.goals?.away;
    const ga = isHome ? e.goals?.away : e.goals?.home;
    let res = 'D';
    if (gf > ga) res = 'W';
    else if (gf < ga) res = 'L';
    return {
      date: e.fixture?.date,
      opponent: isHome ? e.teams?.away?.name : e.teams?.home?.name,
      opponentLogo: isHome ? e.teams?.away?.logo : e.teams?.home?.logo,
      gf, ga, result: res, home: isHome,
      league: e.league?.name
    };
  });

  setCache(key, result);
  return result;
}

// Clima do estádio na hora do kickoff — open-meteo (gratuito, sem chave).
// Retorna { temperature, windKmh, precipProbability, weatherCode } ou null.
export async function fetchWeather(lat, lng, isoDateTime) {
  if (isMockActive()) return mockWeather();
  if (lat == null || lng == null || !isoDateTime) return null;
  const dt = new Date(isoDateTime);
  if (isNaN(dt.getTime())) return null;
  const dateStr = dt.toISOString().slice(0, 10);
  const key = `${CACHE_PREFIX}weather_${lat}_${lng}_${dateStr}_${dt.getUTCHours()}`;
  const cached = getCached(key, TTL_PRE);
  if (cached) return cached;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weathercode` +
    `&start_date=${dateStr}&end_date=${dateStr}&timezone=UTC`;
  const data = await apiGetExternal(url);
  if (!data?.hourly?.time?.length) return null;

  const targetIso = `${dateStr}T${String(dt.getUTCHours()).padStart(2, '0')}:00`;
  const idx = data.hourly.time.findIndex(t => t.startsWith(targetIso)) || 0;
  const safeIdx = idx >= 0 ? idx : 0;
  const result = {
    temperature: data.hourly.temperature_2m?.[safeIdx],
    windKmh: data.hourly.wind_speed_10m?.[safeIdx],
    precipProbability: data.hourly.precipitation_probability?.[safeIdx],
    weatherCode: data.hourly.weathercode?.[safeIdx]
  };

  setCache(key, result);
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
