// Fetch de fixtures, classificação e artilheiros via football-data.org v4.
// Cache sessionStorage TTL 30min.

import { loadState } from '../state.js';

// Em localhost usa proxy local para contornar CORS (ver scripts/dev-server.js).
// Em produção as requests vão direto — requer Vercel Function como proxy.
const IS_DEV = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const API_BASE = IS_DEV ? '/api/football/v4' : 'https://api.football-data.org/v4';
const CACHE_PREFIX = 'cdh_league_';
const CACHE_TTL = 30 * 60 * 1000;

function getApiKey() {
  const state = loadState();
  return state?.settings?.apiKey || '';
}

function cacheKey(kind, code) {
  return `${CACHE_PREFIX}${kind}_${code}`;
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

export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function apiGet(path) {
  const apiKey = getApiKey();
  if (!apiKey) throw new ApiError('NO_KEY', 'Chave de API não configurada. Acesse Configurações para adicionar sua chave da football-data.org.');

  // Em dev o token vai como _token na query para o proxy injetá-lo no header server-side.
  // Em produção vai direto no header (requer Vercel Function como proxy).
  const sep = path.includes('?') ? '&' : '?';
  const reqUrl = IS_DEV ? `${API_BASE}${path}${sep}_token=${apiKey}` : `${API_BASE}${path}`;
  const reqInit = IS_DEV ? {} : { headers: { 'X-Auth-Token': apiKey } };

  let response;
  try {
    response = await fetch(reqUrl, reqInit);
  } catch (_e) {
    throw new ApiError('NETWORK', 'Sem conexão com a internet. Verifique sua rede e tente novamente.');
  }

  if (response.status === 401 || response.status === 403) throw new ApiError('AUTH', 'Chave de API inválida ou sem permissão. Verifique em Configurações.');
  if (response.status === 429) throw new ApiError('RATE_LIMIT', 'Limite de requisições atingido. Aguarde alguns minutos e tente novamente.');
  if (response.status === 404) throw new ApiError('NOT_FOUND', 'Liga não encontrada na API.');
  if (!response.ok) throw new ApiError('HTTP_ERROR', `Erro ao buscar dados (HTTP ${response.status}).`);

  return response.json();
}

// mode: 'next' | 'last' | 'mixed'
// football-data filtra por status: SCHEDULED/TIMED = próximos | FINISHED = encerrados
export async function fetchLeagueFixtures(league, { next = 10, last = 5, mode = 'next' } = {}) {
  const key = cacheKey(`fixtures_${mode}`, league.code);
  const cached = getCached(key);
  if (cached) return cached;

  let fixtures;

  if (mode === 'mixed') {
    const [dataNext, dataLast] = await Promise.all([
      apiGet(`/competitions/${league.code}/matches?status=TIMED,SCHEDULED`),
      apiGet(`/competitions/${league.code}/matches?status=FINISHED`)
    ]);
    const nextMatches = (dataNext?.matches || []).slice(0, next);
    const lastMatches = (dataLast?.matches || []).slice(-(last));
    const combined = [...lastMatches, ...nextMatches];
    const seen = new Set();
    fixtures = combined
      .filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; })
      .map(parseFixture)
      .sort((a, b) => a.timestamp - b.timestamp);
  } else if (mode === 'last') {
    const data = await apiGet(`/competitions/${league.code}/matches?status=FINISHED`);
    fixtures = (data?.matches || []).slice(-(last)).map(parseFixture);
  } else {
    const data = await apiGet(`/competitions/${league.code}/matches?status=TIMED,SCHEDULED`);
    fixtures = (data?.matches || []).slice(0, next).map(parseFixture);
  }

  setCache(key, fixtures);
  return fixtures;
}

export async function fetchLeagueStandings(league) {
  const key = cacheKey('standings', league.code);
  const cached = getCached(key);
  if (cached) return cached;

  const data = await apiGet(`/competitions/${league.code}/standings`);
  // UCL tem múltiplos grupos — flatten de todos os grupos
  const groups = data?.standings || [];
  const flat = groups.flatMap(g => g.table || []).map(parseStanding);

  // Para ligas com grupos, pode haver duplicatas (mesmo time em grupo diferente) — deduplica por team.id
  const seen = new Set();
  const deduped = flat.filter(s => {
    if (seen.has(s.team.id)) return false;
    seen.add(s.team.id);
    return true;
  });

  setCache(key, deduped);
  return deduped;
}

export async function fetchLeagueTopScorers(league, { limit = 10 } = {}) {
  const key = cacheKey('scorers', league.code);
  const cached = getCached(key);
  if (cached) return cached;

  const data = await apiGet(`/competitions/${league.code}/scorers?limit=${limit}`);
  const scorers = (data?.scorers || []).map(parseScorer);
  setCache(key, scorers);
  return scorers;
}

function statusShort(status) {
  switch (status) {
    case 'FINISHED': return 'FT';
    case 'IN_PLAY': return 'LIVE';
    case 'PAUSED': return 'HT';
    case 'TIMED':
    case 'SCHEDULED': return 'NS';
    case 'POSTPONED': return 'PST';
    case 'CANCELLED':
    case 'SUSPENDED': return 'CANC';
    default: return 'NS';
  }
}

function parseFixture(m) {
  return {
    id: m.id,
    date: m.utcDate,
    timestamp: new Date(m.utcDate).getTime(),
    status: statusShort(m.status),
    round: m.matchday ? `Rodada ${m.matchday}` : (m.stage || ''),
    venue: '',
    city: '',
    home: {
      id: m.homeTeam?.id,
      name: m.homeTeam?.shortName || m.homeTeam?.name || '',
      logo: m.homeTeam?.crest || ''
    },
    away: {
      id: m.awayTeam?.id,
      name: m.awayTeam?.shortName || m.awayTeam?.name || '',
      logo: m.awayTeam?.crest || ''
    },
    homeScore: m.score?.fullTime?.home ?? null,
    awayScore: m.score?.fullTime?.away ?? null
  };
}

function parseStanding(s) {
  return {
    rank: s.position,
    team: {
      id: s.team?.id,
      name: s.team?.shortName || s.team?.name || '',
      logo: s.team?.crest || ''
    },
    points: s.points,
    played: s.playedGames || 0,
    won: s.won || 0,
    drawn: s.draw || 0,
    lost: s.lost || 0,
    goalsFor: s.goalsFor || 0,
    goalsAgainst: s.goalsAgainst || 0,
    goalDiff: s.goalDifference || 0,
    form: s.form || '',
    description: ''
  };
}

function parseScorer(entry) {
  return {
    id: entry.player?.id,
    name: entry.player?.name || '',
    photo: '',
    nationality: entry.player?.nationality || '',
    team: {
      id: entry.team?.id,
      name: entry.team?.shortName || entry.team?.name || '',
      logo: entry.team?.crest || ''
    },
    goals: entry.goals || 0,
    assists: entry.assists || 0,
    appearances: entry.playedMatches || 0,
    minutes: 0
  };
}
