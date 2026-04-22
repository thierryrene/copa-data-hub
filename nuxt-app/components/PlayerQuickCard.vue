<script setup>
// Bottom sheet "Ficha Rápida" de jogador — controlado pelo parent via prop `player`.
// null = fechado. Emite 'close'.
// Data shape aceita tanto o objeto da API-Football quanto um {name, number, ...} simples.
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  player: { type: Object, default: null },
  teamFlag: { type: String, default: '' },
  teamName: { type: String, default: '' }
});
const emit = defineEmits(['close']);

const isOpen = computed(() => !!props.player);
const animateIn = ref(false);

const POS_MAP = {
  G: 'Goleiro', D: 'Defensor', M: 'Meia', F: 'Atacante',
  GK: 'Goleiro', DEF: 'Defensor', MID: 'Meia', FWD: 'Atacante'
};

const p = computed(() => props.player || {});

const name = computed(() => p.value.player?.name || p.value.name || 'Jogador');
const number = computed(() => p.value.player?.number || p.value.number || '');
const pos = computed(() => p.value.statistics?.[0]?.games?.position || p.value.position || '');
const posLabel = computed(() => POS_MAP[pos.value] || pos.value || '—');
const age = computed(() => p.value.player?.age || '');
const club = computed(() => p.value.statistics?.[0]?.team?.name || p.value.club || '');
const photo = computed(() => p.value.player?.photo || '');
const slug = computed(() => slugify(name.value));

const goals = computed(() => p.value.statistics?.[0]?.goals?.total ?? p.value.goals ?? null);
const assists = computed(() => p.value.statistics?.[0]?.goals?.assists ?? p.value.assists ?? null);
const apps = computed(() => p.value.statistics?.[0]?.games?.appearences ?? p.value.apps ?? null);
const rating = computed(() => {
  const r = p.value.statistics?.[0]?.games?.rating;
  return r ? parseFloat(r).toFixed(1) : null;
});

const hasStats = computed(() =>
  goals.value != null || assists.value != null || apps.value != null || rating.value != null
);

const xIcon = computed(() => icon('x', 18));
const userIcon = computed(() => icon('user', 14));

function onImgError(e) {
  e.target.style.display = 'none';
}

function close() {
  emit('close');
}

watch(isOpen, async (open) => {
  if (!import.meta.client) return;
  if (open) {
    animateIn.value = false;
    await new Promise(requestAnimationFrame);
    animateIn.value = true;
  } else {
    animateIn.value = false;
  }
});

function onKeydown(e) {
  if (e.key === 'Escape' && isOpen.value) close();
}

onMounted(() => {
  if (import.meta.client) document.addEventListener('keydown', onKeydown);
});
onUnmounted(() => {
  if (import.meta.client) document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="pqc-root">
      <div class="pqc-backdrop" @click="close"></div>
      <div
        class="pqc"
        :class="{ 'pqc--open': animateIn }"
        role="dialog"
        aria-modal="true"
        :aria-label="`Ficha de ${name}`"
      >
        <div class="pqc__drag"></div>
        <div class="pqc__header">
          <div class="pqc__avatar">
            <img
              v-if="photo"
              :src="photo"
              :alt="name"
              loading="lazy"
              @error="onImgError"
            >
            <span v-else class="pqc__avatar-icon">⚽</span>
          </div>
          <div class="pqc__info">
            <div class="pqc__name">{{ name }}</div>
            <div class="pqc__meta">
              {{ teamFlag }} {{ teamName }}
              <template v-if="pos"> · {{ posLabel }}</template>
              <template v-if="number"> · Camisa {{ number }}</template>
            </div>
            <div v-if="age" class="pqc__age">
              {{ age }} anos<template v-if="club"> · {{ club }}</template>
            </div>
          </div>
          <button
            class="pqc__close"
            type="button"
            aria-label="Fechar"
            @click="close"
          >
            <span v-html="xIcon"></span>
          </button>
        </div>

        <div v-if="hasStats" class="pqc__stats">
          <div v-if="goals != null" class="pqc__stat">
            <span class="pqc__stat-val">{{ goals }}</span>
            <span class="pqc__stat-lbl">gols</span>
          </div>
          <div v-if="assists != null" class="pqc__stat">
            <span class="pqc__stat-val">{{ assists }}</span>
            <span class="pqc__stat-lbl">assist.</span>
          </div>
          <div v-if="apps != null" class="pqc__stat">
            <span class="pqc__stat-val">{{ apps }}</span>
            <span class="pqc__stat-lbl">jogos</span>
          </div>
          <div v-if="rating" class="pqc__stat">
            <span class="pqc__stat-val pqc__stat-val--gold">{{ rating }}</span>
            <span class="pqc__stat-lbl">nota</span>
          </div>
        </div>

        <a
          class="pqc__link"
          :href="`/jogadores/${slug}`"
          data-route-link
          @click="close"
        >
          <span v-html="userIcon"></span>
          Ver perfil completo
        </a>
      </div>
    </div>
  </Teleport>
</template>
