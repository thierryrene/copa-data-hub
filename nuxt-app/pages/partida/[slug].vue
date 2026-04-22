<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { fetchMatchData, fetchHeadToHead, fetchInjuries, fetchTeamForm, fetchWeather } from '~/api/match';
import { fetchSquad } from '~/api/squad';

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const mock = useMockStore();
const { showToast } = useToast();

const slug = computed(() => String(route.params.slug || '').toLowerCase());

const rawFixture = computed(() => findFixtureBySlug(FIXTURES, slug.value));
const fixture = computed(() => {
  if (!rawFixture.value) return null;
  const arr = applyMockToFixtures([rawFixture.value], mock.scenario);
  return arr[0];
});
const home = computed(() => fixture.value ? getTeam(fixture.value.home) : null);
const away = computed(() => fixture.value ? getTeam(fixture.value.away) : null);
const stadium = computed(() => fixture.value ? getStadium(fixture.value.stadium) : null);
const phase = computed(() => fixture.value ? matchPhase(fixture.value) : null);

const tab = ref('overview');
watch(phase, (p) => {
  if (p === 'pre') tab.value = 'overview';
  else if (p === 'live') tab.value = 'live';
  else tab.value = 'recap';
}, { immediate: true });

// ── Palpite ──
const existingPred = computed(() =>
  fixture.value ? user.predictions.find(p => p.fixtureId === fixture.value.id) : null
);
const predHome = ref('');
const predAway = ref('');
const selectedConf = ref(1);

watch(existingPred, (p) => {
  predHome.value = p?.homeScore ?? '';
  predAway.value = p?.awayScore ?? '';
  selectedConf.value = p?.confidence || 1;
}, { immediate: true });

function savePred() {
  if (!fixture.value) return;
  const h = parseInt(predHome.value) || 0;
  const a = parseInt(predAway.value) || 0;
  user.savePrediction(fixture.value.id, h, a, selectedConf.value);
  const r = user.addXP(15);
  showToast(`⚽ Palpite salvo! +15 XP ${'⭐'.repeat(selectedConf.value)}`, 'xp');
  if (r.leveledUp) setTimeout(() => showToast(`🎉 Nível ${r.newLevel}!`, 'success'), 800);
}

function confXpHint(c) {
  const map = { 1: 'Bônus normal', 2: '1.5× XP no acerto', 3: '2× XP no acerto' };
  return map[c] || '';
}

// ── Dados carregados ──
const dataPre = ref({ h2h: null, formHome: null, formAway: null, weather: null, referee: null, injuries: null, keyHome: null, keyAway: null, lineups: null });
const dataLive = ref({ events: [], stats: null, lineups: null, referee: null, apiHome: null, apiAway: null, players: [] });

let pollTimer = null;

async function loadPre() {
  if (!fixture.value || !home.value || !away.value) return;
  const homeApi = getTeamApiId(home.value.code);
  const awayApi = getTeamApiId(away.value.code);
  const st = stadium.value;
  const kickoffISO = `${fixture.value.date}T${fixture.value.time}:00Z`;

  const [h2h, homeSquad, awaySquad, injuries, formHome, formAway, weather, matchData] = await Promise.all([
    fetchHeadToHead(homeApi, awayApi).catch(() => []),
    fetchSquad(home.value.code).catch(() => null),
    fetchSquad(away.value.code).catch(() => null),
    fetchInjuries(fixture.value.id).catch(() => []),
    fetchTeamForm(homeApi).catch(() => []),
    fetchTeamForm(awayApi).catch(() => []),
    fetchWeather(st?.lat, st?.lng, kickoffISO).catch(() => null),
    fetchMatchData(fixture.value.id, 'pre').catch(() => null)
  ]);

  dataPre.value = {
    h2h: h2h || [],
    formHome: formHome || [],
    formAway: formAway || [],
    weather,
    referee: matchData?.referee || null,
    injuries: injuries || [],
    keyHome: homeSquad?.players?.slice(0, 3) || [],
    keyAway: awaySquad?.players?.slice(0, 3) || [],
    lineups: matchData?.lineups || []
  };
}

async function loadLiveOrFinished() {
  if (!fixture.value || !home.value || !away.value) return;
  const data = await fetchMatchData(fixture.value.id, phase.value).catch(() => null);
  if (!data) return;
  dataLive.value = {
    events: data.events || [],
    stats: data.statistics || null,
    lineups: data.lineups || [],
    referee: data.referee || null,
    apiHome: data.home || null,
    apiAway: data.away || null,
    players: data.players || []
  };
}

function startLoad() {
  if (phase.value === 'pre') loadPre();
  else {
    loadLiveOrFinished();
    if (pollTimer) clearInterval(pollTimer);
    if (phase.value === 'live') {
      pollTimer = setInterval(() => loadLiveOrFinished(), 30000);
    }
  }
}

onMounted(startLoad);
onBeforeUnmount(() => { if (pollTimer) clearInterval(pollTimer); });

watch([() => fixture.value?.id, phase], () => startLoad());

// SEO
watch(fixture, (f) => {
  if (!f || !home.value || !away.value) return;
  const dateLabel = new Date(`${f.date}T${f.time}:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  useSeoMeta({
    title: `${home.value.name} vs ${away.value.name} — ${dateLabel}`,
    description: `${home.value.name} enfrenta ${away.value.name} pelo Grupo ${f.group} do Mundial 2026 em ${dateLabel}.`
  });
  useHead({ link: [{ rel: 'canonical', href: `/partida/${slug.value}` }] });
}, { immediate: true });

function goBack() {
  if (window.history.length > 1) window.history.back();
  else router.push('/jogos');
}

// Modo Jogo
const modoJogoOpen = ref(false);
</script>

<template>
  <div>
    <div v-if="!fixture" class="team-page__notfound">
      <div class="section-title">Partida não encontrada</div>
      <NuxtLink class="btn btn--primary" to="/jogos">Ver calendário</NuxtLink>
    </div>
    <template v-else>
      <button class="team-page__back" type="button" @click="goBack">← Voltar</button>

      <MatchHero :fixture="fixture" :home="home" :away="away" @open-modo-jogo="modoJogoOpen = true" />

      <div class="match-page" :data-phase="phase">
        <!-- Prediction box -->
        <div v-if="phase === 'finished' && existingPred" class="card prediction-result">
          <div class="prediction-result__lbl">Seu palpite</div>
          <div class="prediction-result__score">{{ existingPred.homeScore }} × {{ existingPred.awayScore }}</div>
          <div v-if="existingPred.confidence > 1" class="prediction-result__conf">
            {{ '⭐'.repeat(existingPred.confidence) }} confiança
          </div>
        </div>
        <div v-else-if="phase === 'live' && existingPred" class="card prediction-locked">
          <div class="text-xs text-muted">Seu palpite (jogo iniciado)</div>
          <div class="font-display font-bold">{{ existingPred.homeScore }} × {{ existingPred.awayScore }}</div>
        </div>
        <div v-else-if="phase === 'pre'" class="card prediction-box">
          <div class="prediction-box__title">Seu Palpite {{ existingPred ? '(salvo)' : '(+15 XP)' }}</div>
          <div class="prediction-box__inputs">
            <span>{{ home.flag }} {{ home.code }}</span>
            <input v-model="predHome" type="number" min="0" max="20" placeholder="0">
            <span class="prediction-box__sep">×</span>
            <input v-model="predAway" type="number" min="0" max="20" placeholder="0">
            <span>{{ away.flag }} {{ away.code }}</span>
          </div>
          <div class="prediction-box__confidence">
            <span class="prediction-box__conf-label">Confiança:</span>
            <div class="conf-stars">
              <button
                v-for="n in 3"
                :key="n"
                class="conf-star"
                :class="{ 'conf-star--active': n <= selectedConf }"
                type="button"
                @click="selectedConf = n"
              >⭐</button>
            </div>
            <span class="prediction-box__conf-hint">{{ confXpHint(selectedConf) }}</span>
          </div>
          <button class="btn btn--primary btn--sm btn--full" @click="savePred">Salvar Palpite</button>
        </div>

        <MatchTabs v-model="tab" :phase="phase" />

        <!-- PRE -->
        <div v-if="phase === 'pre'">
          <div v-show="tab === 'overview'" class="match-tab-panel">
            <MatchBriefing :fixture="fixture" :home="home" :away="away" />
            <PredictionBar :home="55" :draw="25" :away="20" :home-code="fixture.home" :away-code="fixture.away" />

            <section class="match-section">
              <div class="section-title">Forma Recente</div>
              <TeamForm :form-home="dataPre.formHome || []" :form-away="dataPre.formAway || []" :home="home" :away="away" />
            </section>

            <section class="match-section">
              <div class="section-title">Olho neles</div>
              <div class="key-grid">
                <div>
                  <div class="key-grid__lbl">{{ home.flag }} {{ home.code }}</div>
                  <KeyPlayersList :players="dataPre.keyHome || []" />
                </div>
                <div>
                  <div class="key-grid__lbl">{{ away.flag }} {{ away.code }}</div>
                  <KeyPlayersList :players="dataPre.keyAway || []" />
                </div>
              </div>
            </section>

            <section class="match-section">
              <div class="section-title">Retrospecto</div>
              <H2HRetrospecto :history="dataPre.h2h || []" :home="home" :away="away" />
            </section>

            <section class="match-section">
              <div class="section-title">Informações</div>
              <div class="match-info-grid">
                <RefereeCard :referee="dataPre.referee || ''" />
                <WeatherCard :weather="dataPre.weather" :stadium="stadium" />
              </div>
            </section>

            <section class="match-section">
              <div class="section-title">🩹 Desfalques</div>
              <InjuriesList :injuries="dataPre.injuries || []" :home="home" :away="away" />
            </section>
          </div>

          <div v-show="tab === 'lineups'" class="match-tab-panel">
            <section class="match-section">
              <div class="section-title">Provável Escalação</div>
              <LineupBoard :lineups="dataPre.lineups || []" :home="home" :away="away" />
            </section>
          </div>
        </div>

        <!-- LIVE -->
        <div v-else-if="phase === 'live'">
          <div v-show="tab === 'live'" class="match-tab-panel">
            <section class="match-section">
              <div class="section-title">Pulse da Torcida</div>
              <PulseWidget :fixture-id="fixture.id" />
            </section>
            <section class="match-section">
              <div class="section-title">Enquete</div>
              <PollWidget :fixture-id="fixture.id" question="Quem vai marcar o próximo gol?" :options="[home.code, away.code, 'Sem gols']" />
            </section>
            <section class="match-section">
              <div class="section-title">Arbitragem</div>
              <RefereeCard :referee="dataLive.referee || ''" />
            </section>
          </div>

          <div v-show="tab === 'lineups'" class="match-tab-panel">
            <section class="match-section">
              <div class="section-title">Escalação</div>
              <LineupBoard :lineups="dataLive.lineups || []" :home="home" :away="away" />
            </section>
          </div>

          <div v-show="tab === 'stats'" class="match-tab-panel">
            <section class="match-section">
              <div class="section-title">Estatísticas Ao Vivo</div>
              <LiveStats :stats="dataLive.stats" :home="dataLive.apiHome || home" :away="dataLive.apiAway || away" />
            </section>
            <section v-if="dataLive.events?.length" class="match-section">
              <div class="section-title">Pressão</div>
              <AttackMomentum :events="dataLive.events" :home="home" :away="away" />
            </section>
          </div>

          <div v-show="tab === 'events'" class="match-tab-panel">
            <section class="match-section">
              <div class="section-title">Eventos</div>
              <MatchTimeline :events="dataLive.events || []" :home="home" :away="away" />
            </section>
          </div>
        </div>

        <!-- FINISHED -->
        <div v-else>
          <div v-show="tab === 'recap'" class="match-tab-panel">
            <section class="match-section">
              <div class="section-title">Destaques</div>
              <HighlightCards :fixture="fixture" :events="dataLive.events || []" :statistics="dataLive.stats" :players="dataLive.players || []" :home="home" :away="away" />
              <GoalBreakdown :events="dataLive.events || []" />
            </section>
            <section class="match-section">
              <div class="section-title">Avaliações</div>
              <MatchRatings :players="dataLive.players || []" />
            </section>
            <section class="match-section">
              <div class="section-title">Resumo</div>
              <MatchRecap :fixture="fixture" :events="dataLive.events || []" :home="home" :away="away" />
            </section>
            <section class="match-section">
              <div class="section-title">Arbitragem</div>
              <RefereeCard :referee="dataLive.referee || ''" />
            </section>
          </div>

          <div v-show="tab === 'lineups'" class="match-tab-panel">
            <section class="match-section">
              <div class="section-title">Escalação Final</div>
              <LineupBoard :lineups="dataLive.lineups || []" :home="home" :away="away" />
            </section>
          </div>

          <div v-show="tab === 'stats'" class="match-tab-panel">
            <section class="match-section">
              <div class="section-title">Estatísticas Finais</div>
              <LiveStats :stats="dataLive.stats" :home="dataLive.apiHome || home" :away="dataLive.apiAway || away" />
            </section>
            <section v-if="dataLive.events?.length" class="match-section">
              <div class="section-title">Pressão</div>
              <AttackMomentum :events="dataLive.events" :home="home" :away="away" />
            </section>
            <section v-if="dataLive.events?.length" class="match-section">
              <div class="section-title">Expected Goals</div>
              <XgTimeline :events="dataLive.events" :home="home" :away="away" />
            </section>
          </div>

          <div v-show="tab === 'vizual'" class="match-tab-panel">
            <section class="match-section">
              <ShotMap :events="dataLive.events || []" :home="home" :away="away" :statistics="dataLive.stats" />
            </section>
          </div>

          <div v-show="tab === 'events'" class="match-tab-panel">
            <section class="match-section">
              <div class="section-title">Eventos</div>
              <MatchTimeline :events="dataLive.events || []" :home="home" :away="away" />
            </section>
          </div>
        </div>

        <section v-if="stadium" class="match-section">
          <div class="card transmission">
            <div>
              <div class="font-display font-bold">{{ stadium.name }}</div>
              <div class="text-xs text-muted">{{ stadium.city }}, {{ stadium.country }} · {{ Number(stadium.capacity).toLocaleString('pt-BR') }} lugares</div>
            </div>
          </div>
        </section>
      </div>

      <MatchModoJogo
        v-if="modoJogoOpen"
        v-model="modoJogoOpen"
        :fixture="fixture"
        :home="home"
        :away="away"
        :events="dataLive.events || []"
        :statistics="dataLive.stats"
        @close="modoJogoOpen = false"
      />
    </template>
  </div>
</template>
