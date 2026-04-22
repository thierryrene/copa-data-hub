<script setup>
// Linha de fixture exibida nas páginas de seleção (/selecoes/:slug).
// Mostra adversário ("vs" ou "em"), status, placar/horário e estádio.
import { computed } from 'vue';

const props = defineProps({
  fixture: { type: Object, required: true },
  teamCode: { type: String, required: true },
  userPrediction: { type: Object, default: null }
});

const home = computed(() => getTeam(props.fixture.home));
const away = computed(() => getTeam(props.fixture.away));
const stadium = computed(() => getStadium(props.fixture.stadium));

const isHome = computed(() => props.fixture.home === props.teamCode);
const opponent = computed(() => (isHome.value ? away.value : home.value));

const isLive = computed(() => String(props.fixture.status || '').startsWith('LIVE'));
const isFinished = computed(() => props.fixture.status === 'FT');

const dateStr = computed(() =>
  new Date(`${props.fixture.date}T${props.fixture.time}`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  })
);

const statusLabel = computed(() => {
  if (isLive.value) return 'AO VIVO';
  if (isFinished.value) return 'ENCERRADO';
  return dateStr.value;
});

const homeScore = computed(() => props.fixture.homeScore ?? 0);
const awayScore = computed(() => props.fixture.awayScore ?? 0);

const pinIcon = computed(() => icon('mapPin', 12));
</script>

<template>
  <div class="card team-fixture">
    <div class="team-fixture__meta">
      <span class="team-fixture__group">Grupo {{ fixture.group }}</span>
      <span
        class="team-fixture__status"
        :class="{ 'team-fixture__status--live': isLive }"
      >{{ statusLabel }}</span>
    </div>
    <div class="team-fixture__body">
      <span class="team-fixture__vs-label">{{ isHome ? 'vs' : 'em' }}</span>
      <a
        v-if="opponent"
        class="team-fixture__opponent"
        :href="`/selecoes/${opponent.slug}`"
        data-route-link
        :data-team-prefetch="opponent.code"
      >
        <span class="team-fixture__flag">{{ opponent.flag }}</span>
        <span class="team-fixture__name">{{ opponent.name }}</span>
      </a>
      <span v-if="isLive || isFinished" class="team-fixture__score">
        {{ homeScore }}
        <span class="team-fixture__score-sep">:</span>
        {{ awayScore }}
      </span>
      <span v-else class="team-fixture__time">{{ fixture.time }}</span>
    </div>
    <div class="team-fixture__footer">
      <span v-html="pinIcon"></span>
      {{ stadium ? `${stadium.city}, ${stadium.country}` : '—' }}
      <span v-if="userPrediction" class="team-fixture__prediction">
        Seu palpite: {{ userPrediction.homeScore }} × {{ userPrediction.awayScore }}
      </span>
    </div>
  </div>
</template>
