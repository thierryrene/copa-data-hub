<script setup>
// Card flutuante com a partida AO VIVO no momento.
// - Aparece quando há fixture live, some em /partida/:slug da própria partida.
// - Dispensável por 1h via sessionStorage (chave cdh_live_dismissed_<id>).
// - Polling a cada 30s. Enriquece com minuto + último evento via fetchMatchData.
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { FIXTURES, getTeam } from '~/utils/data';
import { matchPhase, matchSlug } from '~/utils/match';
import { escapeHTML } from '~/utils/html';
import { applyMockToFixtures } from '~/stores/mock';
import { fetchMatchData } from '~/api/match';

const DISMISS_KEY_PREFIX = 'cdh_live_dismissed_';
const DISMISS_TTL_MS = 60 * 60 * 1000;
const REFRESH_MS = 30 * 1000;

const mock = useMockStore();
const route = useRoute();
const router = useRouter();

const tick = ref(0);           // gatilho de re-cálculo a cada 30s
const dismissTick = ref(0);    // gatilho quando o usuário dispensa
const extras = ref(null);      // { elapsed, lastEvent }

function isDismissed(fixtureId) {
  if (!import.meta.client) return false;
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY_PREFIX + fixtureId);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Date.now() - ts > DISMISS_TTL_MS) {
      sessionStorage.removeItem(DISMISS_KEY_PREFIX + fixtureId);
      return false;
    }
    return true;
  } catch { return false; }
}

function markDismissed(fixtureId) {
  if (!import.meta.client) return;
  try { sessionStorage.setItem(DISMISS_KEY_PREFIX + fixtureId, String(Date.now())); }
  catch {}
}

// Slug da rota /partida/:slug (se o usuário estiver vendo uma partida).
const currentPartidaSlug = computed(() => {
  const p = route.params?.slug;
  if (route.path.startsWith('/partida/') && p) return Array.isArray(p) ? p[0] : p;
  return null;
});

const fixture = computed(() => {
  // Depende de tick/dismissTick para recomputar.
  // eslint-disable-next-line no-unused-expressions
  tick.value; dismissTick.value;
  const list = applyMockToFixtures(FIXTURES, mock.scenario).filter(f => matchPhase(f) === 'live');
  if (!list.length) return null;
  for (const fx of list) {
    if (currentPartidaSlug.value && matchSlug(fx) === currentPartidaSlug.value) continue;
    if (isDismissed(fx.id)) continue;
    return fx;
  }
  return null;
});

const home = computed(() => fixture.value ? getTeam(fixture.value.home) : null);
const away = computed(() => fixture.value ? getTeam(fixture.value.away) : null);

const minuteLabel = computed(() => {
  const fx = fixture.value;
  if (!fx) return '';
  if (extras.value?.elapsed != null) return `${extras.value.elapsed}'`;
  if (fx.status === 'HT') return 'INT';
  return 'AO VIVO';
});

const lastEventHtml = computed(() => {
  const ev = extras.value?.lastEvent;
  if (!ev) return '';
  const isGoal = ev.type === 'Goal';
  const isRed = ev.type === 'Card' && /red/i.test(ev.detail || '');
  const isYellow = ev.type === 'Card' && /yellow/i.test(ev.detail || '');
  const ico = isGoal ? '⚽' : isRed ? '🟥' : isYellow ? '🟨' : '•';
  const player = ev.playerName ? escapeHTML(ev.playerName) : '';
  return `${ico} ${ev.minute}'<span class="live-card__last-name"> ${player}</span>`;
});

// Enriquecer com dados da API (elapsed + último evento). Silencioso em caso de falha.
async function loadExtras(fixtureId) {
  try {
    const data = await fetchMatchData(fixtureId, 'live');
    if (!data) return null;
    const evs = (data.events || []).filter(e => e.type === 'Goal' || e.type === 'Card');
    return { elapsed: data.elapsed, lastEvent: evs[evs.length - 1] || null };
  } catch { return null; }
}

// Quando o fixture mudar (novo jogo live ou sumiu), recarrega extras.
watch(
  () => fixture.value?.id,
  async (id) => {
    extras.value = null;
    if (!id) return;
    const ex = await loadExtras(id);
    // Confirma que ainda é o mesmo fixture no momento da resposta.
    if (fixture.value?.id === id) extras.value = ex;
  },
  { immediate: true }
);

function onCardClick(e) {
  e.preventDefault();
  const fx = fixture.value;
  if (!fx) return;
  router.push(`/partida/${matchSlug(fx)}`);
}

function onDismiss(e) {
  e.preventDefault();
  e.stopPropagation();
  const fx = fixture.value;
  if (!fx) return;
  markDismissed(fx.id);
  dismissTick.value++;
}

let timer = null;
onMounted(() => {
  timer = setInterval(() => { tick.value++; }, REFRESH_MS);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div
    v-if="fixture && home && away"
    class="live-match-card"
    role="region"
    :aria-label="`Partida ao vivo: ${home.name} contra ${away.name}`"
  >
    <a
      class="live-match-card__main"
      :href="`/partida/${matchSlug(fixture)}`"
      aria-label="Abrir detalhes da partida"
      @click="onCardClick"
    >
      <div class="live-match-card__pulse">
        <span class="live-match-card__dot"></span>
        <span class="live-match-card__min">{{ minuteLabel }}</span>
      </div>
      <div class="live-match-card__teams">
        <div class="live-match-card__team">
          <span class="live-match-card__flag">{{ home.flag }}</span>
          <span class="live-match-card__code">{{ home.code }}</span>
        </div>
        <div class="live-match-card__score">
          <span>{{ fixture.homeScore ?? 0 }}</span>
          <span class="live-match-card__sep">×</span>
          <span>{{ fixture.awayScore ?? 0 }}</span>
        </div>
        <div class="live-match-card__team live-match-card__team--away">
          <span class="live-match-card__code">{{ away.code }}</span>
          <span class="live-match-card__flag">{{ away.flag }}</span>
        </div>
      </div>
      <div v-if="lastEventHtml" class="live-match-card__last" v-html="lastEventHtml"></div>
    </a>
    <button
      class="live-match-card__close"
      type="button"
      aria-label="Dispensar"
      @click="onDismiss"
    >×</button>
  </div>
</template>
