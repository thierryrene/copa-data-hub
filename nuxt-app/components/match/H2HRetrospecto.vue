<script setup>
// Head-to-head: gráfico de barras + lista dos últimos confrontos.
// Ex-renderH2H de js/components/match/matchSections.js
import { computed } from 'vue';

const props = defineProps({
  history: { type: Array, default: () => [] },
  home: { type: Object, required: true },
  away: { type: Object, required: true }
});

const hasHistory = computed(() => !!props.history?.length);

const wins = computed(() => {
  const w = { home: 0, away: 0, draw: 0 };
  (props.history || []).forEach((g) => {
    if (g.homeScore == null) return;
    const sameOrder = g.homeName === props.home.name;
    const winnerIsHome = g.homeScore > g.awayScore;
    if (g.homeScore === g.awayScore) w.draw++;
    else if (sameOrder ? winnerIsHome : !winnerIsHome) w.home++;
    else w.away++;
  });
  return w;
});

const total = computed(() => wins.value.home + wins.value.draw + wins.value.away || 1);
const homePct = computed(() => Math.round((wins.value.home / total.value) * 100));
const drawPct = computed(() => Math.round((wins.value.draw / total.value) * 100));
const awayPct = computed(() => 100 - homePct.value - drawPct.value);

const items = computed(() =>
  (props.history || []).slice(0, 5).map((g) => {
    const date = new Date(g.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const sameOrder = g.homeName === props.home.name;
    const hs = sameOrder ? g.homeScore : g.awayScore;
    const as_ = sameOrder ? g.awayScore : g.homeScore;
    let outcome = 'draw';
    if (hs != null && as_ != null) outcome = hs > as_ ? 'win' : hs < as_ ? 'loss' : 'draw';
    const badge = outcome === 'win' ? 'V' : outcome === 'loss' ? 'D' : 'E';
    return { g, date, outcome, badge };
  })
);
</script>

<template>
  <p v-if="!hasHistory" class="text-sm text-muted">
    Sem histórico de confrontos disponível.
  </p>

  <div v-else class="h2h">
    <div class="h2h__bar-wrap">
      <div class="h2h__bar-label">{{ home.flag }} <b>{{ wins.home }}</b></div>
      <div class="h2h__bar">
        <div
          class="h2h__bar-seg h2h__bar-seg--home"
          :style="{ width: `${homePct}%` }"
          :title="`${home.name}: ${wins.home} vitórias`"
        ></div>
        <div
          class="h2h__bar-seg h2h__bar-seg--draw"
          :style="{ width: `${drawPct}%` }"
          :title="`Empates: ${wins.draw}`"
        ></div>
        <div
          class="h2h__bar-seg h2h__bar-seg--away"
          :style="{ width: `${awayPct}%` }"
          :title="`${away.name}: ${wins.away} vitórias`"
        ></div>
      </div>
      <div class="h2h__bar-label h2h__bar-label--away"><b>{{ wins.away }}</b> {{ away.flag }}</div>
    </div>
    <div class="h2h__draw-count">{{ wins.draw }} empate{{ wins.draw !== 1 ? 's' : '' }}</div>

    <ul class="h2h__list">
      <li v-for="(it, i) in items" :key="i" class="h2h__item">
        <span class="h2h__item-date">{{ it.date }}</span>
        <span class="h2h__item-teams">
          {{ it.g.homeName }}
          <b>{{ it.g.homeScore ?? '?' }} × {{ it.g.awayScore ?? '?' }}</b>
          {{ it.g.awayName }}
        </span>
        <span class="h2h__badge" :class="`h2h__badge--${it.outcome}`">{{ it.badge }}</span>
      </li>
    </ul>
  </div>
</template>
