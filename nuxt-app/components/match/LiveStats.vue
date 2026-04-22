<script setup>
// Estatísticas ao vivo com barras duplas (home vs away).
// Ex-renderLiveStats de js/components/match/matchSections.js
import { computed } from 'vue';

const props = defineProps({
  stats: { type: Object, default: null },
  home: { type: Object, required: true },
  away: { type: Object, required: true }
});

const STAT_LABELS = {
  'Ball Possession': 'Posse de Bola',
  'Total Shots': 'Chutes Totais',
  'Shots on Goal': 'Chutes ao Gol',
  'Shots off Goal': 'Chutes para Fora',
  'Blocked Shots': 'Chutes Bloqueados',
  'Corner Kicks': 'Escanteios',
  'Offsides': 'Impedimentos',
  'Goalkeeper Saves': 'Defesas do Goleiro',
  'Total passes': 'Passes Totais',
  'Passes accurate': 'Passes Certos',
  'Passes %': 'Precisão de Passes',
  'Fouls': 'Faltas',
  'Yellow Cards': 'Cartões Amarelos',
  'Red Cards': 'Cartões Vermelhos'
};

const hasStats = computed(
  () => !!(props.stats && props.stats[props.home.id] && props.stats[props.away.id])
);

const rows = computed(() => {
  if (!hasStats.value) return [];
  const sH = props.stats[props.home.id];
  const sA = props.stats[props.away.id];
  const keys = Object.keys(STAT_LABELS).filter(
    (k) => sH[k] != null || sA[k] != null
  );
  return keys.map((k) => {
    const h = parseFloat(sH[k]) || 0;
    const a = parseFloat(sA[k]) || 0;
    const total = h + a || 1;
    const hPct = Math.round((h / total) * 100);
    const aPct = 100 - hPct;
    return {
      key: k,
      label: STAT_LABELS[k],
      hDisplay: String(sH[k] ?? '—'),
      aDisplay: String(sA[k] ?? '—'),
      hPct,
      aPct
    };
  });
});
</script>

<template>
  <p v-if="!hasStats" class="text-sm text-muted">Estatísticas indisponíveis.</p>
  <p v-else-if="!rows.length" class="text-sm text-muted">
    Estatísticas ainda não foram registradas.
  </p>

  <div v-else class="live-stats">
    <div v-for="row in rows" :key="row.key" class="live-stats__row">
      <span class="live-stats__h">{{ row.hDisplay }}</span>
      <div class="live-stats__center">
        <span class="live-stats__lbl">{{ row.label }}</span>
        <div class="live-stats__bar-wrap">
          <div class="live-stats__bar-home" :style="{ width: `${row.hPct}%` }"></div>
          <div class="live-stats__bar-away" :style="{ width: `${row.aPct}%` }"></div>
        </div>
      </div>
      <span class="live-stats__a">{{ row.aDisplay }}</span>
    </div>
  </div>
</template>
