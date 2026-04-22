<script setup>
const props = defineProps({
  scorers: { type: Array, default: () => [] }
});
</script>

<template>
  <p v-if="!scorers?.length" class="text-sm text-muted">Artilheiros não disponíveis.</p>
  <div v-else class="top-scorers">
    <a
      v-for="(p, i) in scorers"
      :key="p.id || i"
      class="top-scorer"
      :href="`/jogadores/${slugify(p.name)}`"
      data-route-link
      :data-player-id="p.id"
      :aria-label="`Ver detalhes de ${p.name}`"
    >
      <span class="top-scorer__rank">{{ i + 1 }}</span>
      <img
        v-if="p.photo"
        class="top-scorer__photo"
        :src="p.photo"
        alt=""
        loading="lazy"
        onerror="this.style.display='none'"
      >
      <span v-else class="top-scorer__photo-placeholder">⚽</span>
      <div class="top-scorer__info">
        <span class="top-scorer__name">{{ p.name }}</span>
        <span class="top-scorer__team">{{ p.team.name }}</span>
      </div>
      <span class="top-scorer__goals">{{ p.goals }}⚽</span>
    </a>
  </div>
</template>
