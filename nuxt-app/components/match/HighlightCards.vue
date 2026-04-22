<script setup>
// 4 cards de insights automáticos pós-jogo.
// Ex-renderHighlightCards de js/components/match/matchSections.js
import { computed } from 'vue';
import { extractRatings } from '~/utils/ratings';

const props = defineProps({
  fixture: { type: Object, required: true },
  events: { type: Array, default: () => [] },
  statistics: { type: Object, default: null },
  players: { type: Array, default: () => [] },
  home: { type: Object, required: true },
  away: { type: Object, required: true }
});

const insights = computed(() => {
  const out = [];
  const f = props.fixture;

  // 1. Resultado
  if (f.homeScore != null) {
    if (f.homeScore > f.awayScore) {
      out.push({ icon: '🏆', text: `${props.home.name} venceu por ${f.homeScore}–${f.awayScore}` });
    } else if (f.awayScore > f.homeScore) {
      out.push({ icon: '🏆', text: `${props.away.name} venceu por ${f.awayScore}–${f.homeScore}` });
    } else {
      out.push({ icon: '🤝', text: `Empate: ${f.homeScore}–${f.awayScore}` });
    }
  }

  // 2. Posse de bola
  const statH = props.statistics?.[props.home.id] || {};
  const statA = props.statistics?.[props.away.id] || {};
  const poss = statH['Ball Possession'];
  if (poss != null) {
    const dominant = parseInt(poss) > 50 ? props.home : props.away;
    out.push({
      icon: '⚽',
      text: `${dominant.name} dominou com ${parseInt(poss) > 50 ? poss : statA['Ball Possession']}% de posse`
    });
  }

  // 3. Artilheiro da partida
  const goals = (props.events || []).filter((e) => e.type === 'Goal').sort((a, b) => a.minute - b.minute);
  const scorers = {};
  goals.forEach((g) => {
    scorers[g.playerName] = (scorers[g.playerName] || 0) + 1;
  });
  const topScorer = Object.entries(scorers).sort((a, b) => b[1] - a[1])[0];
  if (topScorer) {
    out.push({
      icon: '⚡',
      text: `${topScorer[0]} artilheiro da partida (${topScorer[1]} gol${topScorer[1] > 1 ? 's' : ''})`
    });
  }

  // 4. Melhor jogador (maior rating)
  const ratings = extractRatings(props.players);
  if (ratings.length) {
    const top = ratings[0];
    out.push({ icon: '⭐', text: `${top.name} melhor em campo — nota ${top.rating.toFixed(1)}` });
  }

  // 5. Chutes ao gol
  const shotsH = statH['Shots on Goal'];
  const shotsA = statA['Shots on Goal'];
  if (shotsH != null && shotsA != null) {
    out.push({ icon: '🎯', text: `Chutes ao gol: ${props.home.code} ${shotsH} × ${shotsA} ${props.away.code}` });
  }

  return out.slice(0, 4);
});
</script>

<template>
  <div v-if="insights.length" class="highlight-cards">
    <div v-for="(ins, idx) in insights" :key="idx" class="highlight-card">
      <span class="highlight-card__icon">{{ ins.icon }}</span>
      <span class="highlight-card__text">{{ ins.text }}</span>
    </div>
  </div>
</template>
