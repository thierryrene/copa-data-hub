<script setup>
// Breakdown dos gols por tipo: jogada / pênalti / contra.
import { computed } from 'vue';

const props = defineProps({
  events: { type: Array, default: () => [] }
});

function classifyGoal(detail = '') {
  const d = detail.toLowerCase();
  if (d.includes('penalty')) return 'pen';
  if (d.includes('own')) return 'og';
  return 'open';
}

const pills = computed(() => {
  const goals = (props.events || []).filter((e) => e.type === 'Goal');
  if (!goals.length) return [];
  const counts = { open: 0, pen: 0, og: 0 };
  goals.forEach((g) => {
    counts[classifyGoal(g.detail)]++;
  });
  return [
    { lbl: 'Jogada', val: counts.open, cls: 'goal-breakdown__pill--open', ico: '⚽' },
    { lbl: 'Pênalti', val: counts.pen, cls: 'goal-breakdown__pill--pen', ico: '🎯' },
    { lbl: 'Contra', val: counts.og, cls: 'goal-breakdown__pill--og', ico: '🔄' }
  ].filter((p) => p.val > 0);
});
</script>

<template>
  <div v-if="pills.length" class="goal-breakdown" aria-label="Distribuição dos gols">
    <span
      v-for="(p, idx) in pills"
      :key="idx"
      class="goal-breakdown__pill"
      :class="p.cls"
    >
      <span aria-hidden="true">{{ p.ico }}</span>
      <strong>{{ p.val }}</strong>
      {{ p.lbl }}
    </span>
  </div>
</template>
