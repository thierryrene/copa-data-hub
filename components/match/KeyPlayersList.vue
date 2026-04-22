<script setup>
// Lista dos 3 jogadores-chave. Ex-renderKeyPlayers (matchSections.js).
import { computed } from 'vue';

const props = defineProps({
  players: { type: Array, default: () => [] }
});

const hasPlayers = computed(() => !!props.players?.length);
const top3 = computed(() => (props.players || []).slice(0, 3));

function onImgError(e) {
  e.target.style.display = 'none';
}
</script>

<template>
  <p v-if="!hasPlayers" class="text-sm text-muted">Jogadores-chave indisponíveis.</p>

  <div v-else class="key-players">
    <a
      v-for="(p, idx) in top3"
      :key="idx"
      class="key-player"
      :href="`/jogadores/${slugify(p.name)}`"
      data-route-link
    >
      <img
        v-if="p.photo"
        :src="p.photo"
        :alt="p.name"
        loading="lazy"
        @error="onImgError"
      >
      <span v-else class="key-player__avatar">⚽</span>
      <span class="key-player__name">{{ p.name }}</span>
      <span class="key-player__meta">
        <template v-if="p.goals != null">{{ p.goals }}⚽ {{ p.assists ?? 0 }}🎯</template>
      </span>
    </a>
  </div>
</template>
