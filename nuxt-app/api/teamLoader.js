// Cache em memória e prefetch da combinação Wikipedia summary + Wikimedia news.
// Compartilhado entre páginas/componentes -- qualquer link de time pode disparar.

import { fetchWikipediaTeamSummary, fetchTeamNews } from '~/api/wikipedia';

const cache = new Map();
const inflight = new Map();

export function getTeamDossierCached(code) {
  return cache.get(code) || null;
}

export async function loadTeamDossier(team) {
  if (cache.has(team.code)) return cache.get(team.code);
  if (inflight.has(team.code)) return inflight.get(team.code);

  const promise = (async () => {
    const [wiki, news] = await Promise.all([
      fetchWikipediaTeamSummary(team).catch(() => null),
      fetchTeamNews(team).catch(() => [])
    ]);
    const payload = { wiki, news };
    cache.set(team.code, payload);
    inflight.delete(team.code);
    return payload;
  })();

  inflight.set(team.code, promise);
  return promise;
}

export function prefetchTeamDossier(team) {
  if (!import.meta.client) return; // prefetch faz sentido só no client
  if (cache.has(team.code) || inflight.has(team.code)) return;
  loadTeamDossier(team).catch(() => {});
}
