<script setup>
import { computed, ref } from 'vue';

definePageMeta({ name: 'jogos' });

useSeoMeta({
  title: 'Match Center — Jogos do Mundial 2026',
  description: 'Calendário completo do Mundial 2026 com 104 jogos. Filtre por rodada, sede (EUA, Canadá, México) ou status.'
});
useHead({ link: [{ rel: 'canonical', href: '/jogos' }] });

const user = useUserStore();
const mock = useMockStore();

const STADIUM_COUNTRY = Object.fromEntries(STADIUMS.map(s => [s.id, s.country]));

const MATCHDAY = (() => {
  const byGroup = {};
  FIXTURES.forEach(f => {
    if (!byGroup[f.group]) byGroup[f.group] = [];
    byGroup[f.group].push(f);
  });
  const map = {};
  Object.values(byGroup).forEach(fixtures => {
    fixtures.slice()
      .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
      .forEach((f, i) => { map[f.id] = Math.floor(i / 2) + 1; });
  });
  return map;
})();

const fixtures = computed(() => applyMockToFixtures(FIXTURES, mock.scenario));
const statusFilter = ref('all');
const matchdayFilter = ref('all');
const sedeFilter = ref('all');

const counts = computed(() => ({
  live: fixtures.value.filter(f => matchPhase(f) === 'live').length,
  pre: fixtures.value.filter(f => matchPhase(f) === 'pre').length,
  fin: fixtures.value.filter(f => matchPhase(f) === 'finished').length
}));
const rdCount = computed(() => [1,2,3].map(d => fixtures.value.filter(f => MATCHDAY[f.id] === d).length));
const sedeCount = computed(() => ({
  EUA: fixtures.value.filter(f => STADIUM_COUNTRY[f.stadium] === 'EUA').length,
  'Canadá': fixtures.value.filter(f => STADIUM_COUNTRY[f.stadium] === 'Canadá').length,
  'México': fixtures.value.filter(f => STADIUM_COUNTRY[f.stadium] === 'México').length
}));

const filtered = computed(() => fixtures.value.filter(f => {
  const phase = matchPhase(f);
  const statusOk = statusFilter.value === 'all'
    || (statusFilter.value === 'live' && phase === 'live')
    || (statusFilter.value === 'upcoming' && phase === 'pre')
    || (statusFilter.value === 'finished' && phase === 'finished');
  const mdOk = matchdayFilter.value === 'all' || String(MATCHDAY[f.id]) === matchdayFilter.value;
  const sedeOk = sedeFilter.value === 'all' || STADIUM_COUNTRY[f.stadium] === sedeFilter.value;
  return statusOk && mdOk && sedeOk;
}));

function predFor(f) {
  return user.predictions.find(p => p.fixtureId === f.id) || null;
}
</script>

<template>
  <div>
    <h1 class="section-title">Match Center</h1>
    <p class="section-subtitle">Calendário completo de partidas do Mundial 2026 com cobertura ao vivo.</p>

    <div class="filter-tabs">
      <button class="filter-tab" :class="{ active: statusFilter === 'all' }" @click="statusFilter = 'all'">
        Todos ({{ fixtures.length }})
      </button>
      <button v-if="counts.live" class="filter-tab" :class="{ active: statusFilter === 'live' }" @click="statusFilter = 'live'">
        🔴 Ao Vivo ({{ counts.live }})
      </button>
      <button class="filter-tab" :class="{ active: statusFilter === 'upcoming' }" @click="statusFilter = 'upcoming'">
        Próximos ({{ counts.pre }})
      </button>
      <button class="filter-tab" :class="{ active: statusFilter === 'finished' }" @click="statusFilter = 'finished'">
        Encerrados ({{ counts.fin }})
      </button>
    </div>

    <div class="match-filters-row">
      <div class="filter-tabs filter-tabs--compact">
        <span class="filter-tabs__label">Rodada</span>
        <button class="filter-tab" :class="{ active: matchdayFilter === 'all' }" @click="matchdayFilter = 'all'">Todas</button>
        <button v-for="d in [1,2,3]" :key="d" class="filter-tab" :class="{ active: matchdayFilter === String(d) }" @click="matchdayFilter = String(d)">
          {{ d }}ª <span class="filter-tab__count">{{ rdCount[d-1] }}</span>
        </button>
      </div>

      <div class="filter-tabs filter-tabs--compact">
        <span class="filter-tabs__label">Sede</span>
        <button class="filter-tab" :class="{ active: sedeFilter === 'all' }" @click="sedeFilter = 'all'">Todas</button>
        <button class="filter-tab" :class="{ active: sedeFilter === 'EUA' }" @click="sedeFilter = 'EUA'">
          🇺🇸 EUA <span class="filter-tab__count">{{ sedeCount.EUA }}</span>
        </button>
        <button class="filter-tab" :class="{ active: sedeFilter === 'Canadá' }" @click="sedeFilter = 'Canadá'">
          🇨🇦 Canadá <span class="filter-tab__count">{{ sedeCount['Canadá'] }}</span>
        </button>
        <button class="filter-tab" :class="{ active: sedeFilter === 'México' }" @click="sedeFilter = 'México'">
          🇲🇽 México <span class="filter-tab__count">{{ sedeCount['México'] }}</span>
        </button>
      </div>
    </div>

    <div class="matches-list">
      <MatchCard v-for="f in filtered" :key="f.id" :fixture="f" :prediction="predFor(f)" />
    </div>
  </div>
</template>
