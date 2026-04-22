<script setup>
// Hero com contagem regressiva até o apito inicial do Mundial 2026.
// `targetDate` é ISO; emite `done` quando chega a zero.
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const DEFAULT_TARGET = '2026-06-11T20:00:00-04:00';

const props = defineProps({
  targetDate: { type: String, default: DEFAULT_TARGET }
});
const emit = defineEmits(['done', 'notify', 'share']);

const now = ref(Date.now());
let timer = null;

const targetMs = computed(() => new Date(props.targetDate).getTime());
const diff = computed(() => targetMs.value - now.value);
const isLive = computed(() => diff.value <= 0);

const days = computed(() => Math.max(0, Math.floor(diff.value / (1000 * 60 * 60 * 24))));
const hours = computed(() => Math.max(0, Math.floor((diff.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))));
const mins = computed(() => Math.max(0, Math.floor((diff.value % (1000 * 60 * 60)) / (1000 * 60))));
const secs = computed(() => Math.max(0, Math.floor((diff.value % (1000 * 60)) / 1000)));

const trophyIcon = computed(() => icon('trophy', 14));
const bellIcon = computed(() => icon('bell', 16));
const shareIcon = computed(() => icon('share2', 16));
const pinIcon = computed(() => icon('mapPin', 16));
const calendarIcon = computed(() => icon('calendar', 16));

// Dispara "done" uma única vez ao atingir zero.
let firedDone = false;
watch(isLive, (v) => {
  if (v && !firedDone) {
    firedDone = true;
    emit('done');
  }
});

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now(); }, 1000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <section
    class="countdown-hero"
    :class="{ 'countdown-hero--live': isLive }"
  >
    <div class="countdown-hero__intro">
      <span class="countdown-hero__badge">
        <span v-html="trophyIcon"></span>
        Contagem Oficial 2026
      </span>
      <h1 class="countdown-hero__title">
        O Mundo se une em<br>
        <span class="countdown-hero__title-accent">Junho de 2026</span>
      </h1>
      <p class="countdown-hero__description">
        Prepare-se para a maior edição da história. 48 seleções, 3 países sede e um único sonho. Acompanhe cada segundo até o apito inicial.
      </p>
      <div class="countdown-hero__actions">
        <button
          class="btn btn--primary"
          type="button"
          @click="emit('notify')"
        >
          <span v-html="bellIcon"></span>
          Ativar Notificação
        </button>
        <button
          class="btn btn--secondary"
          type="button"
          @click="emit('share')"
        >
          <span v-html="shareIcon"></span>
          Compartilhar
        </button>
      </div>
    </div>

    <div class="countdown-hero__meta">
      <div v-if="isLive" class="countdown-live-banner">
        ⚽ Torneio em andamento!
      </div>
      <div v-else class="countdown-grid">
        <div class="countdown-item">
          <span class="countdown-number">{{ days }}</span>
          <span class="countdown-label">Dias</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number">{{ hours }}</span>
          <span class="countdown-label">Horas</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number">{{ mins }}</span>
          <span class="countdown-label">Minutos</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number">{{ secs }}</span>
          <span class="countdown-label">Segundos</span>
        </div>
      </div>

      <div class="countdown-info">
        <div class="countdown-info__item">
          <span class="countdown-info__icon countdown-info__icon--blue" v-html="pinIcon"></span>
          <div>
            <span class="countdown-info__label">Locais</span>
            <span class="countdown-info__value">EUA, Canadá e México</span>
          </div>
        </div>
        <div class="countdown-info__divider"></div>
        <div class="countdown-info__item">
          <span class="countdown-info__icon countdown-info__icon--emerald" v-html="calendarIcon"></span>
          <div>
            <span class="countdown-info__label">Início</span>
            <span class="countdown-info__value">11 Jun 2026</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
