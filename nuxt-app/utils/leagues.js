// Catálogo de campeonatos suportados. Port de js/data/leagues.js.
export const LEAGUES = {
  'champions-league': {
    slug: 'champions-league',
    code: 'CL',
    season: 2025,
    status: 'active',
    name: 'UEFA Champions League',
    shortName: 'Champions League',
    emoji: '⭐',
    country: 'Europa',
    countryFlag: '🇪🇺',
    color: '#1a237e',
    accent: '#ffd700',
    description: 'A principal competição de clubes da Europa. Acompanhe jogos, classificação e artilheiros da temporada 2025/26.',
    keywords: 'champions league, uefa, ucl, liga dos campeões, futebol europeu'
  },
  'brasileirao': {
    slug: 'brasileirao',
    code: 'BSA',
    season: 2026,
    status: 'active',
    name: 'Brasileirão Série A',
    shortName: 'Brasileirão',
    emoji: '🇧🇷',
    countryFlag: '🇧🇷',
    country: 'Brasil',
    color: '#059669',
    accent: '#fbbf24',
    description: 'O principal campeonato de futebol do Brasil. Classificação, próximos jogos e artilheiros da Série A 2026.',
    keywords: 'brasileirão, série a, campeonato brasileiro, cbf, futebol brasil'
  },
  'premier-league': {
    slug: 'premier-league',
    code: 'PL',
    season: 2025,
    status: 'active',
    name: 'Premier League',
    shortName: 'Premier League',
    emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    country: 'Inglaterra',
    color: '#37003c',
    accent: '#00ff87',
    description: 'O campeonato inglês de futebol. Jogos, tabela e artilharia da Premier League 2025/26.',
    keywords: 'premier league, inglaterra, futebol inglês, epl, english premier'
  }
};

export function getLeague(slug) {
  return LEAGUES[slug] || null;
}

export function listLeagues() {
  return Object.values(LEAGUES);
}
