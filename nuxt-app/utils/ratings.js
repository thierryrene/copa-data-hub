// Extrai ratings (nota do jogador) do bloco `players` da API-Football.
// Retorna lista ordenada descendente — útil para MatchRatings e HighlightCards.

export function extractRatings(playersBlock) {
  if (!playersBlock?.length) return [];
  const result = [];
  playersBlock.forEach((teamBlock) => {
    const teamName = teamBlock.team?.name;
    (teamBlock.players || []).forEach((p) => {
      const stats = p.statistics?.[0] || {};
      const rating = stats.games?.rating ? parseFloat(stats.games.rating) : null;
      if (rating) result.push({ name: p.player?.name, team: teamName, rating });
    });
  });
  return result.sort((a, b) => b.rating - a.rating);
}
