// Busca e cache de elencos de seleções via API-Football (api-sports.io v3).
// Cache em sessionStorage com TTL de 24h para economizar o limite de 100 req/dia.

import { useSettingsStore } from '~/stores/settings';
import { useApiStatusStore, ERROR_KIND } from '~/stores/apiStatus';
import { useMockStore } from '~/stores/mock';
import { mockSquad } from '~/utils/mockData';
import { getTeamApiId, getTeamFormation } from '~/utils/data';

const API_BASE = 'https://v3.football.api-sports.io';
const CACHE_PREFIX = 'cdh_squad_';
const CACHE_TTL = 24 * 60 * 60 * 1000;

const POSITION_ORDER = { Goalkeeper: 0, Defender: 1, Midfielder: 2, Attacker: 3 };
const POSITION_LABELS = {
  Goalkeeper: 'Goleiros',
  Defender: 'Defensores',
  Midfielder: 'Meio-campistas',
  Attacker: 'Atacantes'
};
const POSITION_SHORT = {
  Goalkeeper: 'GK',
  Defender: 'DEF',
  Midfielder: 'MID',
  Attacker: 'FWD'
};

function getApiKey() {
  const s = useSettingsStore();
  return s.apiSportsKey || '';
}

function getCached(teamCode) {
  if (!import.meta.client) return null;
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + teamCode);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_PREFIX + teamCode);
      return null;
    }
    return entry.data;
  } catch (_e) {
    return null;
  }
}

function setCache(teamCode, data) {
  if (!import.meta.client) return;
  try {
    sessionStorage.setItem(CACHE_PREFIX + teamCode, JSON.stringify({ ts: Date.now(), data }));
  } catch (_e) {}
}

function parseSquadResponse(apiData, teamCode) {
  const teamEntry = apiData?.response?.[0];
  if (!teamEntry?.players?.length) return null;

  const players = teamEntry.players.map((p) => ({
    id: p.id,
    name: p.name,
    age: p.age,
    number: p.number,
    position: p.position,
    positionShort: POSITION_SHORT[p.position] || '?',
    positionLabel: POSITION_LABELS[p.position] || p.position,
    photo: p.photo || ''
  }));

  players.sort((a, b) => {
    const posA = POSITION_ORDER[a.position] ?? 9;
    const posB = POSITION_ORDER[b.position] ?? 9;
    if (posA !== posB) return posA - posB;
    return (a.number || 99) - (b.number || 99);
  });

  const grouped = {};
  for (const p of players) {
    const key = p.position || 'Unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  }

  return {
    teamCode,
    formation: getTeamFormation(teamCode),
    players,
    grouped,
    totalPlayers: players.length,
    fetchedAt: Date.now()
  };
}

function pickStarting11(squad) {
  if (!squad) return null;

  const formation = squad.formation;
  const lines = formation.split('-').map(Number);

  const gks = squad.grouped.Goalkeeper || [];
  const defs = squad.grouped.Defender || [];
  const mids = squad.grouped.Midfielder || [];
  const fwds = squad.grouped.Attacker || [];

  const starter = { formation, lines: [], gk: null };

  starter.gk = gks[0] || null;

  const pools = [defs, mids, fwds];
  let poolIdx = 0;
  for (const count of lines) {
    const pool = pools[poolIdx] || [];
    starter.lines.push(pool.slice(0, count));
    poolIdx++;
  }

  if (lines.length === 4) {
    starter.lines = [
      defs.slice(0, lines[0]),
      mids.slice(0, lines[1]),
      mids.slice(lines[1], lines[1] + lines[2]),
      fwds.slice(0, lines[3])
    ];
  }

  return starter;
}

export async function fetchSquad(teamCode) {
  const mock = useMockStore();
  if (mock.isActive) return mockSquad(teamCode);

  const cached = getCached(teamCode);
  if (cached) return cached;

  const apiId = getTeamApiId(teamCode);
  if (!apiId) return null;

  const api = useApiStatusStore();
  const apiKey = getApiKey();
  if (!apiKey) {
    api.setError(ERROR_KIND.NO_KEY);
    console.warn(`[fetchSquad] sem chave; ignorando ${teamCode}`);
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/players/squads?team=${apiId}`, {
      headers: { 'x-apisports-key': apiKey }
    });

    if (!response.ok) {
      api.setError(api.classifyHttpStatus(response.status), `HTTP ${response.status}`);
      console.error(`[fetchSquad] HTTP ${response.status} para team=${apiId} (${teamCode})`);
      return null;
    }

    const data = await response.json();
    if (data?.errors && Object.keys(data.errors).length) {
      const firstErr = Object.values(data.errors)[0];
      const isQuota = String(firstErr).toLowerCase().includes('limit') || String(firstErr).toLowerCase().includes('quota');
      api.setError(isQuota ? ERROR_KIND.RATE_LIMIT : ERROR_KIND.HTTP, String(firstErr));
      console.error(`[fetchSquad] payload errors:`, data.errors);
      return null;
    }

    const squad = parseSquadResponse(data, teamCode);
    if (squad) {
      api.clearError();
      setCache(teamCode, squad);
    }
    return squad;
  } catch (e) {
    api.setError(ERROR_KIND.NETWORK, e?.message || '');
    console.error(`[fetchSquad] network fail para ${teamCode}:`, e);
    return null;
  }
}

export function buildLineup(squad) {
  return pickStarting11(squad);
}

export { POSITION_LABELS, POSITION_SHORT };
