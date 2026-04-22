<script setup>
// Hero da partida: bandeiras, placar OU countdown, estádio.
// Ex-renderMatchHero de js/components/match/matchHero.js
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  fixture: { type: Object, required: true },
  home: { type: Object, required: true },
  away: { type: Object, required: true }
});

const emit = defineEmits(['open-modo-jogo']);

const phase = computed(() => matchPhase(props.fixture));
const stadium = computed(() => getStadium(props.fixture.stadium));

const countdown = ref(timeUntilKickoff(props.fixture));
let timer = null;

function tick() {
  countdown.value = timeUntilKickoff(props.fixture);
}

onMounted(() => {
  if (phase.value === 'pre') {
    timer = setInterval(tick, 1000);
  }
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

const kickoffDateLabel = computed(() => {
  const d = new Date(`${props.fixture.date}T12:00:00`);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
});

const maximizeIcon = computed(() => icon('maximize', 14));
</script>

<template>
  <section class="match-hero" :class="`match-hero--${phase}`">
    <div class="match-hero__teams">
      <a
        class="match-hero__team"
        :href="`/selecoes/${home.slug}`"
        data-route-link
      >
        <span class="match-hero__flag">{{ home.flag }}</span>
        <span class="match-hero__name">{{ home.name }}</span>
      </a>

      <div class="match-hero__center">
        <!-- PRE-MATCH -->
        <template v-if="phase === 'pre'">
          <template v-if="countdown">
            <div
              class="match-hero__countdown"
              id="match-countdown"
              :data-kickoff="`${fixture.date}T${fixture.time}`"
            >
              <span><b id="cd-d">{{ countdown.days }}</b>d</span>
              <span><b id="cd-h">{{ countdown.hours }}</b>h</span>
              <span><b id="cd-m">{{ countdown.mins }}</b>m</span>
              <span><b id="cd-s">{{ countdown.secs }}</b>s</span>
            </div>
            <div class="match-hero__kickoff">
              {{ fixture.time }} · {{ kickoffDateLabel }}
            </div>
          </template>
          <div v-else class="match-hero__live match-hero__live--pulse">
            ⚽ AO VIVO
          </div>
        </template>

        <!-- LIVE -->
        <template v-else-if="phase === 'live'">
          <div class="match-hero__score match-hero__score--live">
            <span id="live-score-home">{{ fixture.homeScore ?? 0 }}</span>
            <span class="match-hero__sep">:</span>
            <span id="live-score-away">{{ fixture.awayScore ?? 0 }}</span>
          </div>
          <div class="match-hero__live match-hero__live--pulse">
            <span class="match-hero__live-dot"></span>
            AO VIVO
          </div>
          <button
            class="match-hero__modo-jogo"
            id="btn-modo-jogo"
            type="button"
            @click="emit('open-modo-jogo')"
          >
            <span v-html="maximizeIcon"></span> Modo Jogo
          </button>
        </template>

        <!-- FINISHED -->
        <template v-else>
          <div class="match-hero__score">
            <span>{{ fixture.homeScore ?? 0 }}</span>
            <span class="match-hero__sep">:</span>
            <span>{{ fixture.awayScore ?? 0 }}</span>
          </div>
          <div class="match-hero__finished">ENCERRADO</div>
        </template>
      </div>

      <a
        class="match-hero__team"
        :href="`/selecoes/${away.slug}`"
        data-route-link
      >
        <span class="match-hero__flag">{{ away.flag }}</span>
        <span class="match-hero__name">{{ away.name }}</span>
      </a>
    </div>

    <div class="match-hero__meta">
      Grupo {{ fixture.group }}<template v-if="stadium"> · {{ stadium.name }}, {{ stadium.city }}</template>
    </div>
  </section>
</template>
