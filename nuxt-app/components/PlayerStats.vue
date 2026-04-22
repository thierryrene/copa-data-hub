<script setup>
import { computed } from 'vue';

const props = defineProps({
  player: { type: Object, default: null }
});

const s = computed(() => props.player?.stats || null);

const ratingStr = computed(() =>
  props.player?.rating ? props.player.rating.toFixed(1) : '—'
);

const passAcc = computed(() => {
  const v = s.value?.passAccuracy;
  return v != null ? `${v}%` : '—';
});

const dribblesStr = computed(() => {
  const st = s.value;
  return st?.dribblesAttempts ? `${st.dribblesSuccess}/${st.dribblesAttempts}` : '—';
});

const minutesStr = computed(() =>
  s.value?.minutes ? s.value.minutes.toLocaleString('pt-BR') : '—'
);

const leagueName = computed(() =>
  props.player?.currentLeague?.name || 'Temporada atual'
);

const seasonLabel = computed(() => {
  const season = props.player?.currentLeague?.season;
  if (!season) return '';
  return `${season}/${String(season + 1).slice(2)}`;
});

const ratingBadgeClass = computed(() => {
  const r = props.player?.rating;
  if (r == null) return '';
  if (r >= 8) return 'badge-rating--elite';
  if (r >= 7) return 'badge-rating--great';
  if (r >= 6) return 'badge-rating--good';
  return 'badge-rating--avg';
});

const ratingBadgeValue = computed(() =>
  props.player?.rating != null ? props.player.rating.toFixed(1) : null
);

const items = computed(() => {
  if (!s.value) return [];
  const st = s.value;
  const p = props.player;
  const list = [
    { emoji: '⚽', label: 'Gols', value: st.goals, highlight: st.goals > 0 },
    { emoji: '🎯', label: 'Assist.', value: st.assists, highlight: st.assists > 0 },
    { emoji: '📋', label: 'Jogos', value: st.appearances },
    { emoji: '⏱', label: 'Minutos', value: minutesStr.value },
    { emoji: '📊', label: 'Rating', value: ratingStr.value, highlight: p.rating >= 7.0 },
    { emoji: '🎯', label: 'Passes', value: passAcc.value },
    { emoji: '💨', label: 'Dribles', value: dribblesStr.value },
    { emoji: '🔥', label: 'Chutes', value: st.shotsTotal || '—' },
    { emoji: '🛡', label: 'Desarmes', value: st.tackles || '—' },
    { emoji: '🟡', label: 'Amarelos', value: st.yellowCards },
    { emoji: '🟥', label: 'Vermelhos', value: st.redCards }
  ];
  if (p.position === 'Goalkeeper') {
    list.push({ emoji: '🧤', label: 'Defesas', value: st.saves });
  }
  return list;
});
</script>

<template>
  <div v-if="player?.stats" class="player-stats-wrap">
    <div class="player-viz-row">
      <SpiderChart :player="player" />
      <PlayerHeatmap :player="player" />
    </div>

    <div class="player-stats">
      <div class="player-stats__header">
        <span class="player-stats__title">Estatísticas {{ seasonLabel }}</span>
        <div class="player-stats__header-right">
          <span
            v-if="ratingBadgeValue"
            class="badge-rating"
            :class="ratingBadgeClass"
            title="Avaliação média na temporada"
          >{{ ratingBadgeValue }}</span>
          <span class="player-stats__league">{{ leagueName }}</span>
        </div>
      </div>
      <div class="player-stats__grid">
        <div
          v-for="(it, i) in items"
          :key="i"
          class="player-stats__item"
          :class="{ 'player-stats__item--highlight': it.highlight }"
        >
          <span class="player-stats__emoji">{{ it.emoji }}</span>
          <span class="player-stats__value">{{ it.value ?? '—' }}</span>
          <span class="player-stats__label">{{ it.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
