// Busca e cache de elencos de seleções via API-Football (api-sports.io v3).
// Cache em sessionStorage com TTL de 24h para economizar o limite de 100 req/dia.

import { getTeamApiId, getTeamFormation } from '../data.js';
import { loadState } from '../state.js';

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
  const state = loadState();
  return state?.settings?.apiKey || '';
}

function getCached(teamCode) {
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
  try {
    sessionStorage.setItem(CACHE_PREFIX + teamCode, JSON.stringify({ ts: Date.now(), data }));
  } catch (_e) {
    // sessionStorage cheio — ignora silenciosamente
  }
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

  // Se formação tem mais de 3 linhas (ex: 4-2-3-1), distribui entre MID e FWD.
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
  const cached = getCached(teamCode);
  if (cached) return cached;

  const apiId = getTeamApiId(teamCode);
  if (!apiId) return null;

  const apiKey = getApiKey();
  if (!apiKey) return null;

  const response = await fetch(`${API_BASE}/players/squads?team=${apiId}`, {
    headers: { 'x-apisports-key': apiKey }
  });

  if (!response.ok) return null;

  const data = await response.json();
  const squad = parseSquadResponse(data, teamCode);

  if (squad) setCache(teamCode, squad);
  return squad;
}

export function buildLineup(squad) {
  return pickStarting11(squad);
}

export { POSITION_LABELS, POSITION_SHORT };
