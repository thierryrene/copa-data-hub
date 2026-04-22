<script setup>
import { ref, computed, onMounted } from 'vue';
import { getLeague } from '~/utils/leagues';
import { fetchLeagueFixtures, fetchLeagueStandings, fetchLeagueTopScorers } from '~/api/leagues';

const route = useRoute();
const router = useRouter();

const slug = computed(() => String(route.params.slug || '').toLowerCase());
const league = computed(() => getLeague(slug.value));

const tab = ref('jogos');
const fixtures = ref(null);
const standings = ref(null);
const scorers = ref(null);
const errors = ref({ fixtures: null, standings: null, scorers: null });
const loading = ref(false);

watchEffect(() => {
  if (league.value) {
    useSeoMeta({
      title: league.value.name,
      description: league.value.description
    });
    useHead({ link: [{ rel: 'canonical', href: `/campeonatos/${league.value.slug}` }] });
  }
});

async function load(bust = false) {
  if (!league.value) return;
  loading.value = true;
  if (bust && import.meta.client) {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith('cdh_league_') && k.includes(`_${league.value.apiId || league.value.code}_`))
      .forEach(k => sessionStorage.removeItem(k));
  }

  const opts = league.value.status === 'finished'
    ? { mode: 'last', last: 10 }
    : { mode: 'mixed', last: 5, next: 10 };

  const [f, s, sc] = await Promise.allSettled([
    fetchLeagueFixtures(league.value, opts),
    fetchLeagueStandings(league.value),
    fetchLeagueTopScorers(league.value, { limit: 10 })
  ]);
  fixtures.value = f.status === 'fulfilled' ? f.value : [];
  errors.value.fixtures = f.status === 'rejected' ? f.reason?.message : null;
  standings.value = s.status === 'fulfilled' ? s.value : [];
  errors.value.standings = s.status === 'rejected' ? s.reason?.message : null;
  scorers.value = sc.status === 'fulfilled' ? sc.value : [];
  errors.value.scorers = sc.status === 'rejected' ? sc.reason?.message : null;
  loading.value = false;
}

onMounted(() => load());

function goBack() {
  if (window.history.length > 1) window.history.back();
  else router.push('/campeonatos');
}
</script>

<template>
  <div>
    <div v-if="!league" class="team-page__notfound">
      <div class="section-title">Campeonato não encontrado</div>
      <NuxtLink class="btn btn--primary" to="/campeonatos">Ver campeonatos</NuxtLink>
    </div>
    <template v-else>
      <button class="team-page__back" type="button" @click="goBack">
        <span>← Voltar</span>
      </button>

      <section
        class="league-hero"
        :style="`--league-color: ${league.color}; --league-accent: ${league.accent};`"
      >
        <div class="league-hero__emoji">{{ league.emoji }}</div>
        <div class="league-hero__info">
          <div class="league-hero__kicker">Temporada {{ league.season }}</div>
          <h1 class="league-hero__name">{{ league.name }}</h1>
          <div class="league-hero__country">{{ league.countryFlag }} {{ league.country }}</div>
        </div>
      </section>

      <div class="sub-tabs">
        <button class="sub-tab" :class="{ active: tab === 'jogos' }" @click="tab = 'jogos'">⚽ Jogos</button>
        <button class="sub-tab" :class="{ active: tab === 'classificacao' }" @click="tab = 'classificacao'">🏆 Classificação</button>
        <button class="sub-tab" :class="{ active: tab === 'artilheiros' }" @click="tab = 'artilheiros'">🥇 Artilheiros</button>
        <button class="sub-tab sub-tab--refresh" :disabled="loading" type="button" @click="load(true)">🔄</button>
      </div>

      <div v-show="tab === 'jogos'">
        <div v-if="errors.fixtures" class="league-error">
          <span class="league-error__icon">⚠️</span>
          <p class="league-error__msg">{{ errors.fixtures }}</p>
        </div>
        <LeagueFixtureList v-else :fixtures="fixtures || []" />
      </div>

      <div v-show="tab === 'classificacao'">
        <div v-if="errors.standings" class="league-error">
          <span class="league-error__icon">⚠️</span>
          <p class="league-error__msg">{{ errors.standings }}</p>
        </div>
        <StandingsTable v-else :standings="standings || []" />
      </div>

      <div v-show="tab === 'artilheiros'">
        <div v-if="errors.scorers" class="league-error">
          <span class="league-error__icon">⚠️</span>
          <p class="league-error__msg">{{ errors.scorers }}</p>
        </div>
        <TopScorersList v-else :scorers="scorers || []" />
      </div>
    </template>
  </div>
</template>
