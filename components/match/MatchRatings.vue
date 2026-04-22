<script setup>
// Player Ratings com badges coloridos por faixa de nota.
// Recebe tanto `ratings` já extraídos ou o bloco `players` bruto (auto-extrai).
// Ex-renderRatings de js/components/match/matchSections.js
import { computed } from 'vue';
import { extractRatings } from '~/utils/ratings';

const props = defineProps({
  ratings: { type: Array, default: null },
  players: { type: Array, default: null }
});

const list = computed(() => {
  if (props.ratings?.length) return props.ratings;
  if (props.players?.length) return extractRatings(props.players);
  return [];
});

const hasRatings = computed(() => !!list.value.length);

function badgeClass(rating) {
  if (rating >= 8) return 'badge-rating--elite';
  if (rating >= 7) return 'badge-rating--great';
  if (rating >= 6) return 'badge-rating--good';
  return 'badge-rating--avg';
}
</script>

<template>
  <p v-if="!hasRatings" class="text-sm text-muted">
    Avaliações ainda não foram publicadas.
  </p>

  <div v-else class="ratings">
    <a
      v-for="(r, idx) in list.slice(0, 6)"
      :key="idx"
      class="rating-item"
      :href="`/jogadores/${slugify(r.name)}`"
      data-route-link
    >
      <span class="rating-item__pos">{{ r.team }}</span>
      <span class="rating-item__name">{{ r.name }}</span>
      <span class="badge-rating" :class="badgeClass(r.rating)">{{ r.rating.toFixed(1) }}</span>
    </a>
  </div>
</template>
