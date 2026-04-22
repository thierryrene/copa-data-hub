<script setup>
const props = defineProps({
  league: { type: Object, required: true }
});

const arrowIcon = icon('chevronRight', 20);
</script>

<template>
  <a
    class="league-card"
    :href="`/campeonatos/${league.slug}`"
    data-route-link
    :style="`--league-color: ${league.color}; --league-accent: ${league.accent};`"
    :aria-label="`Ver ${league.name}`"
  >
    <div class="league-card__emoji">{{ league.emoji }}</div>
    <div class="league-card__body">
      <div class="league-card__name">{{ league.name }}</div>
      <div class="league-card__meta">{{ league.country }} · Temporada {{ league.season }}/{{ String(league.season + 1).slice(2) }}</div>
      <div class="league-card__desc">{{ league.description }}</div>
    </div>
    <div class="league-card__arrow" v-html="arrowIcon"></div>
  </a>
</template>
