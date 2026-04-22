<script setup>
// Overlay de busca global: seleções, estádios e partidas.
// Controlado pelo composable useSearchOverlay (isOpen/open/close).
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

const { isOpen, close } = useSearchOverlay();

const query = ref('');
const debounced = ref('');
const inputEl = ref(null);
let debounceTimer = null;

const searchIcon = computed(() => icon('search', 24));
const searchIconSm = computed(() => icon('search', 18, 'search-overlay__icon'));
const closeIcon = computed(() => icon('x', 18));
const infoIcon = computed(() => icon('info', 20));
const shieldIcon = computed(() => icon('shield', 14));
const calendarIcon = computed(() => icon('calendar', 14));
const pinIcon = computed(() => icon('mapPin', 14));

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const q = computed(() => debounced.value.trim());

const teamResults = computed(() => {
  if (q.value.length < 2) return [];
  const n = normalize(q.value);
  return Object.values(TEAMS).filter(t =>
    normalize(t.name).includes(n) ||
    normalize(t.code).includes(n) ||
    normalize(t.confederation).includes(n)
  ).slice(0, 5);
});

const stadiumResults = computed(() => {
  if (q.value.length < 2) return [];
  const n = normalize(q.value);
  return STADIUMS.filter(s =>
    normalize(s.name).includes(n) ||
    normalize(s.city).includes(n) ||
    normalize(s.country).includes(n)
  ).slice(0, 4);
});

const fixtureResults = computed(() => {
  if (q.value.length < 2) return [];
  const n = normalize(q.value);
  return FIXTURES.filter(f => {
    const h = getTeam(f.home);
    const a = getTeam(f.away);
    return (
      normalize(h?.name).includes(n) ||
      normalize(a?.name).includes(n) ||
      normalize(h?.code).includes(n) ||
      normalize(a?.code).includes(n) ||
      normalize(f.date).includes(n)
    );
  }).slice(0, 4);
});

const hasAnyResult = computed(() =>
  teamResults.value.length || stadiumResults.value.length || fixtureResults.value.length
);

const isShort = computed(() => !q.value || q.value.length < 2);

function teamMeta(team) {
  return `${team.code} · ${team.confederation} · Ranking ${team.ranking}`;
}

function stadiumMeta(s) {
  return `${s.city}, ${s.country} · ${Number(s.capacity || 0).toLocaleString('pt-BR')} lug.`;
}

function fixtureHref(f) {
  const home = getTeam(f.home);
  const away = getTeam(f.away);
  if (!home || !away) return '#';
  return `/partida/${home.slug}-vs-${away.slug}-${f.date}`;
}

function fixtureLabel(f) {
  const h = getTeam(f.home);
  const a = getTeam(f.away);
  return `${h?.code ?? f.home} × ${a?.code ?? f.away}`;
}

function fixtureFlags(f) {
  const h = getTeam(f.home);
  const a = getTeam(f.away);
  return `${h?.flag ?? ''} ${a?.flag ?? ''}`;
}

function fixtureMeta(f) {
  const dateStr = new Date(`${f.date}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  });
  const score = f.homeScore != null ? `${f.homeScore}–${f.awayScore}` : f.time;
  return `Grupo ${f.group} · ${dateStr} · ${score}`;
}

function onInput(e) {
  query.value = e.target.value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounced.value = query.value;
  }, 160);
}

function onResultClick() {
  // Nuxt Link resolve a navegação; só fechamos após um tick pra não abortar.
  setTimeout(close, 80);
}

function onKeydown(e) {
  if (e.key === 'Escape' && isOpen.value) close();
}

watch(isOpen, async (open) => {
  if (!import.meta.client) return;
  if (open) {
    document.body.style.overflow = 'hidden';
    await nextTick();
    setTimeout(() => inputEl.value?.focus(), 80);
  } else {
    document.body.style.overflow = '';
    query.value = '';
    debounced.value = '';
  }
});

onMounted(() => {
  if (import.meta.client) document.addEventListener('keydown', onKeydown);
});
onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('keydown', onKeydown);
    document.body.style.overflow = '';
  }
});
</script>

<template>
  <div
    v-if="isOpen"
    class="search-overlay search-overlay--open"
    role="dialog"
    aria-label="Busca global"
    aria-modal="true"
    @keydown="onKeydown"
  >
    <div class="search-overlay__backdrop" @click="close"></div>
    <div class="search-overlay__panel">
      <div class="search-overlay__bar">
        <span v-html="searchIconSm"></span>
        <input
          ref="inputEl"
          type="search"
          class="search-overlay__input"
          placeholder="Buscar seleção, estádio ou partida…"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label="Campo de busca"
          :value="query"
          @input="onInput"
        >
        <button
          class="search-overlay__close"
          type="button"
          aria-label="Fechar busca"
          @click="close"
        >
          <span v-html="closeIcon"></span>
        </button>
      </div>
      <div class="search-overlay__results">
        <div v-if="isShort" class="search-empty">
          <span v-html="searchIcon"></span>
          <span>Digite para buscar seleções, estádios ou partidas</span>
        </div>
        <div v-else-if="!hasAnyResult" class="search-empty">
          <span v-html="infoIcon"></span>
          <span>Nenhum resultado para "<strong>{{ q }}</strong>"</span>
        </div>
        <template v-else>
          <div v-if="teamResults.length" class="search-group">
            <div class="search-group__label">
              <span v-html="shieldIcon"></span> Seleções
            </div>
            <a
              v-for="team in teamResults"
              :key="team.code"
              class="search-result search-result--team"
              :href="`/selecoes/${team.slug}`"
              data-route-link
              @click="onResultClick"
            >
              <span class="search-result__icon">{{ team.flag }}</span>
              <div>
                <div class="search-result__name">{{ team.name }}</div>
                <div class="search-result__meta">{{ teamMeta(team) }}</div>
              </div>
            </a>
          </div>
          <div v-if="fixtureResults.length" class="search-group">
            <div class="search-group__label">
              <span v-html="calendarIcon"></span> Partidas
            </div>
            <a
              v-for="f in fixtureResults"
              :key="f.id"
              class="search-result search-result--fixture"
              :href="fixtureHref(f)"
              data-route-link
              @click="onResultClick"
            >
              <span class="search-result__flags">{{ fixtureFlags(f) }}</span>
              <div>
                <div class="search-result__name">{{ fixtureLabel(f) }}</div>
                <div class="search-result__meta">{{ fixtureMeta(f) }}</div>
              </div>
            </a>
          </div>
          <div v-if="stadiumResults.length" class="search-group">
            <div class="search-group__label">
              <span v-html="pinIcon"></span> Estádios
            </div>
            <a
              v-for="s in stadiumResults"
              :key="s.id"
              class="search-result search-result--stadium"
              href="/sedes"
              data-route-link
              @click="onResultClick"
            >
              <span class="search-result__icon">📍</span>
              <div>
                <div class="search-result__name">{{ s.name }}</div>
                <div class="search-result__meta">{{ stadiumMeta(s) }}</div>
              </div>
            </a>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
