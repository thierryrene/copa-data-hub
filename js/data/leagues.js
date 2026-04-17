// Catálogo de campeonatos suportados. Indexado por slug (URL-friendly).

export const LEAGUES = {
  'champions-league': {
    slug: 'champions-league',
    apiId: 2,
    season: 2025,
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
    apiId: 71,
    season: 2025,
    name: 'Brasileirão Série A',
    shortName: 'Brasileirão',
    emoji: '🇧🇷',
    countryFlag: '🇧🇷',
    country: 'Brasil',
    color: '#059669',
    accent: '#fbbf24',
    description: 'O principal campeonato de futebol do Brasil. Classificação, próximos jogos e artilheiros da Série A.',
    keywords: 'brasileirão, série a, campeonato brasileiro, cbf, futebol brasil'
  },
  'premier-league': {
    slug: 'premier-league',
    apiId: 39,
    season: 2025,
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
