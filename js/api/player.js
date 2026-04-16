// Busca detalhes de jogadores combinando API-Football (stats) + Wikipedia (bio).
// Cache em sessionStorage com TTL 24h — mesmo padrão de squad.js.

import { loadState } from '../state.js';
import { fetchWikipediaPlayerSummary } from './wikipedia.js';

const API_BASE = 'https://v3.football.api-sports.io';
const CACHE_PREFIX = 'cdh_player_';
const CACHE_TTL = 24 * 60 * 60 * 1000;
const CURRENT_SEASON = 2024;

function getApiKey() {
  const state = loadState();
  return state?.settings?.apiKey || '';
}

function getCached(playerId) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + playerId);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_PREFIX + playerId);
      return null;
    }
    return entry.data;
  } catch (_e) {
    return null;
  }
}

function setCache(playerId, data) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + playerId, JSON.stringify({ ts: Date.now(), data }));
  } catch (_e) {}
}

function parsePlayerResponse(apiData) {
  const entry = apiData?.response?.[0];
  if (!entry) return null;

  const p = entry.player || {};
  const stats = entry.statistics || [];
  const current = stats[0] || {};
  const league = current.league || {};
  const team = current.team || {};
  const games = current.games || {};
  const goals = current.goals || {};
  const passes = current.passes || {};
  const cards = current.cards || {};
  const dribbles = current.dribbles || {};
  const shots = current.shots || {};
  const tackles = current.tackles || {};

  return {
    id: p.id,
    name: p.name,
    firstname: p.firstname || '',
    lastname: p.lastname || '',
    age: p.age,
    nationality: p.nationality || '',
    height: p.height || '',
    weight: p.weight || '',
    photo: p.photo || '',
    birth: {
      date: p.birth?.date || '',
      place: p.birth?.place || '',
      country: p.birth?.country || ''
    },
    currentTeam: {
      id: team.id,
      name: team.name || '',
      logo: team.logo || ''
    },
    currentLeague: {
      id: league.id,
      name: league.name || '',
      country: league.country || '',
      logo: league.logo || '',
      season: league.season
    },
    position: games.position || '',
    number: games.number,
    captain: games.captain || false,
    rating: games.rating ? parseFloat(games.rating) : null,
    stats: {
      appearances: games.appearences || 0,
      minutes: games.minutes || 0,
      goals: goals.total || 0,
      assists: goals.assists || 0,
      saves: goals.saves || 0,
      yellowCards: cards.yellow || 0,
      redCards: cards.red || 0,
      passAccuracy: passes.accuracy ? parseInt(passes.accuracy) : null,
      keyPasses: passes.key || 0,
      dribblesSuccess: dribbles.success || 0,
      dribblesAttempts: dribbles.attempts || 0,
      shotsTotal: shots.total || 0,
      shotsOn: shots.on || 0,
      tackles: tackles.total || 0
    },
    fetchedAt: Date.now()
  };
}

export async function fetchPlayerDetails(playerId) {
  const cached = getCached(playerId);
  if (cached) return cached;

  const apiKey = getApiKey();
  if (!apiKey) return null;

  const url = `${API_BASE}/players?id=${encodeURIComponent(playerId)}&season=${CURRENT_SEASON}`;
  const response = await fetch(url, {
    headers: { 'x-apisports-key': apiKey }
  });

  if (!response.ok) return null;
  const data = await response.json();
  const player = parsePlayerResponse(data);

  if (player) setCache(playerId, player);
  return player;
}

export async function fetchPlayerDossier(playerId) {
  const [player, wiki] = await Promise.all([
    fetchPlayerDetails(playerId).catch(() => null),
    fetchPlayerWiki(playerId).catch(() => null)
  ]);
  return { player, wiki };
}

async function fetchPlayerWiki(playerId) {
  const player = await fetchPlayerDetails(playerId);
  if (!player?.name) return null;
  return fetchWikipediaPlayerSummary(player.name);
}
