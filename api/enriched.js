// Acesso ao data/enriched/teams.json com cache em memória.
// Carrega uma única vez e serve sincronamente depois.
//
// Em SSR o `fetch('/data/...')` relativo pode falhar; para manter o MVP,
// fazemos early-return no servidor (consumidores pegam o dado no client).
// Em Nuxt, `public/data/enriched/teams.json` é servido na raiz.

const cache = new Map();
let loadPromise = null;

export async function loadEnrichedTeams() {
  if (cache.size > 0) return cache;
  if (!import.meta.client) return cache; // SSR: evita fetch relativo
  if (loadPromise) return loadPromise;

  loadPromise = fetch('/data/enriched/teams.json')
    .then(r => {
      if (!r.ok) throw new Error(`enriched: HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      Object.entries(data.teams || {}).forEach(([code, team]) => {
        cache.set(code, team);
      });
      return cache;
    })
    .catch(err => {
      console.warn('[enriched] Falha ao carregar teams.json:', err.message);
      loadPromise = null;
      return cache;
    });

  return loadPromise;
}

// Retorna os dados enriquecidos de uma seleção (síncrono após loadEnrichedTeams).
export function getTeamEnriched(code) {
  return cache.get(code) || null;
}
