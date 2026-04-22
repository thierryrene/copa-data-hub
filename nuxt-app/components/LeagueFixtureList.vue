<script setup>
const props = defineProps({
  fixtures: { type: Array, default: () => [] }
});

const mapPinIcon = icon('mapPin', 12);

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

function statusLabel(fixture) {
  const s = fixture.status;
  if (s === 'FT' || s === 'AET' || s === 'PEN') return 'Encerrado';
  if (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(s)) return 'AO VIVO';
  if (s === 'PST') return 'Adiado';
  if (s === 'CANC') return 'Cancelado';
  return formatDateTime(fixture.date);
}

function isLive(f) {
  return ['LIVE', '1H', '2H', 'HT', 'ET'].includes(f.status);
}
function isFinished(f) {
  return f.status === 'FT';
}
</script>

<template>
  <p v-if="!fixtures?.length" class="text-sm text-muted">Nenhum jogo agendado no momento.</p>
  <div v-else class="league-fixtures">
    <div
      v-for="(f, i) in fixtures"
      :key="i"
      class="card league-fixture"
      :class="{ 'league-fixture--live': isLive(f) }"
    >
      <div class="league-fixture__meta">
        <span>{{ f.round || '' }}</span>
        <span :class="{ 'league-fixture__status--live': isLive(f) }">{{ statusLabel(f) }}</span>
      </div>
      <div class="league-fixture__body">
        <span class="league-fixture__team">
          <img
            v-if="f.home.logo"
            class="league-fixture__logo"
            :src="f.home.logo"
            alt=""
            loading="lazy"
            onerror="this.style.display='none'"
          >
          <span v-else class="league-fixture__logo-fallback">⚽</span>
          <span class="league-fixture__team-name">{{ f.home.name }}</span>
        </span>

        <span v-if="isLive(f) || isFinished(f)" class="league-fixture__score">
          {{ f.homeScore ?? 0 }} <span class="league-fixture__score-sep">:</span> {{ f.awayScore ?? 0 }}
        </span>
        <span v-else class="league-fixture__vs">vs</span>

        <span class="league-fixture__team">
          <img
            v-if="f.away.logo"
            class="league-fixture__logo"
            :src="f.away.logo"
            alt=""
            loading="lazy"
            onerror="this.style.display='none'"
          >
          <span v-else class="league-fixture__logo-fallback">⚽</span>
          <span class="league-fixture__team-name">{{ f.away.name }}</span>
        </span>
      </div>
      <div v-if="f.venue" class="league-fixture__footer">
        <span v-html="mapPinIcon"></span>
        {{ f.venue }}{{ f.city ? ', ' + f.city : '' }}
      </div>
    </div>
  </div>
</template>
