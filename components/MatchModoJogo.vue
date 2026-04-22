<script setup>
// Overlay fullscreen "Modo Jogo" — segunda tela para acompanhar partidas ao vivo.
// Ex-js/components/matchModoJogo.js
//
// Diferença vs vanilla: nesta versão as seções (timeline, stats) são componentes
// internos (ou slots) em vez de "ler do DOM já renderizado". O pai passa os
// mesmos dados que passou para MatchTimeline / LiveStats na página principal.
import { computed, watch, onBeforeUnmount } from 'vue';
import MatchTimeline from './match/MatchTimeline.vue';
import LiveStats from './match/LiveStats.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false }, // open
  fixture: { type: Object, required: true },
  home: { type: Object, required: true },
  away: { type: Object, required: true },
  events: { type: Array, default: () => [] },
  statistics: { type: Object, default: null }
});

const emit = defineEmits(['update:modelValue', 'close']);

const SABIA_QUE_FACTS = [
  'Você sabia? A Copa de 2026 é a primeira com 48 seleções e 3 países-sede.',
  'Você sabia? O Brasil é a única seleção a disputar todas as Copas do Mundo da história.',
  'Você sabia? A Argentina é a atual campeã mundial — título conquistado no Catar em 2022.',
  'Você sabia? A Copa de 2026 terá 104 jogos, o maior número da história do torneio.',
  'Você sabia? A final será disputada no MetLife Stadium, em Nova Jersey — o maior da Copa.',
  'Você sabia? França e Alemanha são as seleções com mais Copas entre si: 4 e 4.'
];

const fact = computed(
  () => SABIA_QUE_FACTS[Math.floor(Math.random() * SABIA_QUE_FACTS.length)]
);

const minuteLabel = computed(() =>
  props.fixture.minute ? `${props.fixture.minute}'` : 'AO VIVO'
);

const score = computed(() =>
  props.fixture.homeScore != null
    ? `${props.fixture.homeScore} – ${props.fixture.awayScore}`
    : '– – –'
);

const xIcon = computed(() => icon('x', 20));
const calendarIcon = computed(() => icon('calendar', 14));
const barChartIcon = computed(() => icon('barChart', 14));

function close() {
  emit('update:modelValue', false);
  emit('close');
}

function onBackdropClick(e) {
  if (e.target === e.currentTarget) close();
}

// Bloqueia scroll do body quando aberto.
watch(
  () => props.modelValue,
  (open) => {
    if (!import.meta.client) return;
    document.body.style.overflow = open ? 'hidden' : '';
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modo-jogo"
      id="modo-jogo-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Modo Jogo Ao Vivo"
      @click="onBackdropClick"
    >
      <div class="modo-jogo__header">
        <button
          class="modo-jogo__close"
          id="modo-jogo-close"
          type="button"
          aria-label="Fechar Modo Jogo"
          v-html="xIcon"
          @click="close"
        ></button>
        <span class="modo-jogo__live-badge">
          <span class="modo-jogo__pulse"></span>AO VIVO
        </span>
        <span class="modo-jogo__minute">{{ minuteLabel }}</span>
      </div>

      <div class="modo-jogo__score-block">
        <span class="modo-jogo__team">
          {{ home.flag }}<br><span>{{ home.code }}</span>
        </span>
        <span class="modo-jogo__score">{{ score }}</span>
        <span class="modo-jogo__team">
          {{ away.flag }}<br><span>{{ away.code }}</span>
        </span>
      </div>

      <div class="modo-jogo__sections">
        <div class="modo-jogo__section">
          <div class="modo-jogo__section-title">
            <span v-html="calendarIcon"></span> Eventos
          </div>
          <div class="modo-jogo__timeline">
            <MatchTimeline :events="events" :home="home" :away="away" />
          </div>
        </div>

        <div class="modo-jogo__section">
          <div class="modo-jogo__section-title">
            <span v-html="barChartIcon"></span> Estatísticas
          </div>
          <div class="modo-jogo__stats">
            <LiveStats :stats="statistics" :home="home" :away="away" />
          </div>
        </div>

        <div class="modo-jogo__fact">
          <span class="modo-jogo__fact-icon">💡</span>
          <span>{{ fact }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
