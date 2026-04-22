<script setup>
// Desfalques (lesionados/suspensos), dividido em duas colunas por time.
import { computed } from 'vue';

const props = defineProps({
  injuries: { type: Array, default: () => [] },
  home: { type: Object, required: true },
  away: { type: Object, required: true }
});

function reasonIcon(reason = '') {
  const r = reason.toLowerCase();
  if (r.includes('suspend')) return '🟥';
  if (r.includes('illness') || r.includes('virus')) return '🤒';
  if (r.includes('doubt') || r.includes('quest')) return '❓';
  return '🩹';
}

function reasonLabelPt(reason = '') {
  const map = {
    'Suspended': 'Suspenso',
    'Knock': 'Pancada',
    'Muscle Injury': 'Lesão muscular',
    'Illness': 'Doente',
    'Hamstring': 'Posterior de coxa',
    'Knee Injury': 'Lesão no joelho',
    'Ankle Injury': 'Lesão no tornozelo',
    'Concussion': 'Concussão',
    'Broken leg': 'Perna fraturada',
    'Coronavirus': 'Covid',
    'Calf Injury': 'Lesão na panturrilha'
  };
  return map[reason] || reason || 'Indisponível';
}

const hasInjuries = computed(() => !!props.injuries?.length);

const split = computed(() => {
  const s = { home: [], away: [] };
  (props.injuries || []).forEach((i) => {
    if (i.teamId === props.home.id) s.home.push(i);
    else if (i.teamId === props.away.id) s.away.push(i);
  });
  return s;
});
</script>

<template>
  <div v-if="!hasInjuries" class="injuries-list injuries-list--empty">
    <p class="text-sm text-muted">Nenhum desfalque informado para este jogo.</p>
  </div>

  <div v-else class="injuries-grid" aria-label="Desfalques">
    <div class="injuries-col">
      <div class="injuries-col__head">
        <span v-if="home.flag">{{ home.flag }}</span>
        <span>{{ home.name || '' }}</span>
        <span class="injuries-col__count">{{ split.home.length }}</span>
      </div>
      <p v-if="split.home.length === 0" class="text-xs text-muted">Sem desfalques.</p>
      <ul v-else class="injuries-list">
        <li
          v-for="(i, idx) in split.home"
          :key="`h-${idx}`"
          class="injury-item"
          :data-player-card="i.playerName || ''"
        >
          <span class="injury-item__icon" aria-hidden="true">{{ reasonIcon(i.reason) }}</span>
          <span class="injury-item__name">{{ i.playerName || '' }}</span>
          <span class="injury-item__reason">{{ reasonLabelPt(i.reason) }}</span>
        </li>
      </ul>
    </div>

    <div class="injuries-col">
      <div class="injuries-col__head">
        <span v-if="away.flag">{{ away.flag }}</span>
        <span>{{ away.name || '' }}</span>
        <span class="injuries-col__count">{{ split.away.length }}</span>
      </div>
      <p v-if="split.away.length === 0" class="text-xs text-muted">Sem desfalques.</p>
      <ul v-else class="injuries-list">
        <li
          v-for="(i, idx) in split.away"
          :key="`a-${idx}`"
          class="injury-item"
          :data-player-card="i.playerName || ''"
        >
          <span class="injury-item__icon" aria-hidden="true">{{ reasonIcon(i.reason) }}</span>
          <span class="injury-item__name">{{ i.playerName || '' }}</span>
          <span class="injury-item__reason">{{ reasonLabelPt(i.reason) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
