<script setup>
// Card de partida (grupo/fase, placar ou horário, escudos e palpite do usuário).
// Ex-js/components/matchCard.js.
import { computed } from 'vue';

const props = defineProps({
  fixture: { type: Object, required: true },
  prediction: { type: Object, default: null }
});

const home = computed(() => getTeam(props.fixture.home));
const away = computed(() => getTeam(props.fixture.away));
const stadium = computed(() => getStadium(props.fixture.stadium));

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

const matchHref = computed(() => `/partida/${matchSlug(props.fixture)}`);

const pinIcon = computed(() => icon('mapPin', 14));
</script>

<template>
  <div class="card match-card" :data-fixture="fixture.id">
    <a
      class="match-card__link"
      :href="matchHref"
      data-route-link
      :aria-label="`Detalhes da partida ${fixture.home} vs ${fixture.away}`"
    >
      <div class="match-card__header">
        <span class="match-card__group">Grupo {{ fixture.group }}</span>
        <span
          class="match-card__status"
          :class="{ live: isLive }"
        >{{ statusLabel }}</span>
      </div>
    </a>
    <div class="match-card__teams">
      <a
        v-if="home"
        class="match-card__team match-card__team--link"
        :href="`/selecoes/${home.slug}`"
        data-route-link
        :data-team-prefetch="home.code"
        :aria-label="`Ver detalhes de ${home.name}`"
      >
        <span class="match-card__flag">{{ home.flag }}</span>
        <span class="match-card__name">{{ home.code }}</span>
      </a>

      <div v-if="isLive || isFinished" class="match-card__score">
        <span>{{ fixture.homeScore }}</span>
        <span class="match-card__score-sep">:</span>
        <span>{{ fixture.awayScore }}</span>
      </div>
      <div v-else class="match-card__vs">{{ fixture.time }}</div>

      <a
        v-if="away"
        class="match-card__team match-card__team--link"
        :href="`/selecoes/${away.slug}`"
        data-route-link
        :data-team-prefetch="away.code"
        :aria-label="`Ver detalhes de ${away.name}`"
      >
        <span class="match-card__flag">{{ away.flag }}</span>
        <span class="match-card__name">{{ away.code }}</span>
      </a>
    </div>

    <div v-if="prediction" class="match-card__prediction">
      <span class="match-card__prediction-label">Meu palpite</span>
      <span class="match-card__prediction-score">
        {{ prediction.homeScore }} × {{ prediction.awayScore }}
      </span>
      <span class="match-card__prediction-stars">
        {{ '⭐'.repeat(prediction.confidence || 1) }}
      </span>
    </div>

    <a class="match-card__footer" :href="matchHref" data-route-link>
      <span v-html="pinIcon"></span>
      {{ stadium ? stadium.city : '—' }}
      <span class="match-card__cta">Ver partida →</span>
    </a>
  </div>
</template>
