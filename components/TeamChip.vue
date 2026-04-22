<script setup>
// Chip compacto com bandeira + código da seleção + ranking.
// Aceita `team` (objeto) ou `code` (string). `asLink=false` renderiza <span>.
import { computed } from 'vue';

const props = defineProps({
  team: { type: Object, default: null },
  code: { type: String, default: '' },
  asLink: { type: Boolean, default: true }
});

const resolved = computed(() => {
  if (props.team) return props.team;
  if (props.code) return getTeam(props.code);
  return null;
});
</script>

<template>
  <a
    v-if="resolved && asLink"
    class="team-chip"
    :href="`/selecoes/${resolved.slug}`"
    data-route-link
    :data-team-prefetch="resolved.code"
  >
    <span class="team-chip__flag">{{ resolved.flag }}</span>
    <span class="team-chip__name">{{ resolved.code }}</span>
    <span class="team-chip__ranking">#{{ resolved.ranking }}</span>
  </a>
  <span v-else-if="resolved" class="team-chip">
    <span class="team-chip__flag">{{ resolved.flag }}</span>
    <span class="team-chip__name">{{ resolved.code }}</span>
    <span class="team-chip__ranking">#{{ resolved.ranking }}</span>
  </span>
</template>
