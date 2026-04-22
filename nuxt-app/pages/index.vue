<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';

definePageMeta({ name: 'home' });

useSeoMeta({
  title: 'CopaDataHub 2026 — Dados, Previsões e Bolão do Mundial',
  description: 'Acompanhe o Mundial 2026 com dados ao vivo, previsões de IA, simulador de chaveamento e bolão gamificado. 48 seleções, 104 jogos, 16 estádios.'
});
useHead({ link: [{ rel: 'canonical', href: '/' }] });

const user = useUserStore();
const mock = useMockStore();
const { showToast } = useToast();

const now = ref(Date.now());
onMounted(() => {
  const t = setInterval(() => { now.value = Date.now(); }, 60000);
  onBeforeUnmount(() => clearInterval(t));
});

const allFixtures = computed(() => applyMockToFixtures(FIXTURES, mock.scenario));

const liveFixtures = computed(() => allFixtures.value.filter(f => matchPhase(f) === 'live'));
const liveFirst = computed(() => liveFixtures.value[0] || null);
const liveHome = computed(() => liveFirst.value ? getTeam(liveFirst.value.home) : null);
const liveAway = computed(() => liveFirst.value ? getTeam(liveFirst.value.away) : null);

const todayFixtures = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return allFixtures.value.filter(f => f.date === today);
});

const isTournamentStarted = computed(() =>
  now.value >= new Date('2026-06-11T20:00:00-04:00').getTime()
);

const upcoming = computed(() =>
  allFixtures.value
    .filter(f => matchPhase(f) === 'pre')
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .slice(0, 4)
);

const pendingInView = computed(() =>
  upcoming.value.filter(f => !user.predictions.find(p => p.fixtureId === f.id)).length
);

const played = computed(() => allFixtures.value.filter(f => matchPhase(f) === 'finished'));
const totalGoals = computed(() =>
  played.value.reduce((s, f) => s + (f.homeScore ?? 0) + (f.awayScore ?? 0), 0)
);
const avgGoals = computed(() =>
  played.value.length ? (totalGoals.value / played.value.length).toFixed(1) : '—'
);

const favTeam = computed(() =>
  user.favoriteTeam ? getTeam(user.favoriteTeam) : null
);
const favGroup = computed(() =>
  user.favoriteTeam ? getGroupForTeam(user.favoriteTeam) : null
);
const favTeamFixtures = computed(() => {
  if (!user.favoriteTeam) return [];
  return applyMockToFixtures(
    FIXTURES.filter(f => f.home === user.favoriteTeam || f.away === user.favoriteTeam),
    mock.scenario
  );
});
const favNextFixture = computed(() => favTeamFixtures.value.find(f => matchPhase(f) === 'pre') || null);
const favLastFinished = computed(() => [...favTeamFixtures.value].reverse().find(f => matchPhase(f) === 'finished') || null);

function pred(f) {
  return user.predictions.find(p => p.fixtureId === f.id) || null;
}

function slug(f) { return matchSlug(f); }

function fmtDate(isoDate) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

async function onImportCalendar() {
  try {
    const m = await import('~/utils/calendar');
    m.downloadCalendar();
    showToast('Calendário exportado! Abra o arquivo .ics para importar', 'success');
  } catch {
    showToast('Erro ao gerar calendário', 'error');
  }
}
</script>

<template>
  <div>
    <a v-if="liveFirst && liveHome && liveAway" class="live-banner" :href="`/partida/${slug(liveFirst)}`">
      <span class="live-banner__pulse"></span>
      <span class="live-banner__label">AO VIVO</span>
      <span class="live-banner__match">
        {{ liveHome.flag }} {{ liveHome.code }}
        <b>{{ liveFirst.homeScore ?? 0 }}–{{ liveFirst.awayScore ?? 0 }}</b>
        {{ liveAway.code }} {{ liveAway.flag }}
      </span>
      <span class="live-banner__minute">{{ liveFirst.minute ? liveFirst.minute + "'" : '' }}</span>
      <span v-if="liveFixtures.length > 1" class="live-banner__extra">+{{ liveFixtures.length - 1 }} ao vivo</span>
    </a>

    <div v-if="isTournamentStarted && todayFixtures.length" class="today-widget">
      <div class="today-widget__header">
        <span class="today-widget__badge">HOJE</span>
        <span class="today-widget__count">{{ todayFixtures.length }} jogo{{ todayFixtures.length > 1 ? 's' : '' }}</span>
      </div>
      <div class="today-widget__matches">
        <a
          v-for="f in todayFixtures"
          :key="f.id"
          class="today-widget__match"
          :href="`/partida/${slug(f)}`"
        >
          <span class="today-widget__team">{{ getTeam(f.home)?.flag }} {{ getTeam(f.home)?.code }}</span>
          <span class="today-widget__center">
            <b v-if="matchPhase(f) !== 'pre'">{{ f.homeScore ?? 0 }}–{{ f.awayScore ?? 0 }}</b>
            <span v-else class="today-widget__time">{{ f.time }}</span>
          </span>
          <span class="today-widget__team today-widget__team--right">{{ getTeam(f.away)?.code }} {{ getTeam(f.away)?.flag }}</span>
        </a>
      </div>
    </div>

    <CountdownTimer v-if="!isTournamentStarted" />

    <div v-if="isTournamentStarted" class="tournament-numbers">
      <div class="tournament-numbers__title">Copa em Números</div>
      <div class="tournament-numbers__grid">
        <div class="tournament-numbers__stat">
          <span class="tournament-numbers__val" style="color:var(--color-gold)">{{ played.length }}</span>
          <span class="tournament-numbers__lbl">jogos</span>
        </div>
        <div class="tournament-numbers__stat">
          <span class="tournament-numbers__val" style="color:var(--color-emerald)">{{ totalGoals }}</span>
          <span class="tournament-numbers__lbl">gols</span>
        </div>
        <div class="tournament-numbers__stat">
          <span class="tournament-numbers__val" style="color:var(--color-blue)">{{ avgGoals }}</span>
          <span class="tournament-numbers__lbl">gols/jogo</span>
        </div>
      </div>
    </div>

    <XpBar />

    <div v-if="favTeam" class="meu-copa card card--gold">
      <div class="meu-copa__header">
        <span class="meu-copa__flag">{{ favTeam.flag }}</span>
        <div>
          <div class="meu-copa__name">{{ favTeam.name }}</div>
          <div class="meu-copa__sub">Meu Copa</div>
        </div>
        <div class="meu-copa__pos">
          <span class="meu-copa__pos-lbl">Grupo {{ favGroup?.id || '?' }}</span>
        </div>
      </div>
      <div class="meu-copa__info">
        <NuxtLink
          v-if="favNextFixture"
          :to="`/partida/${slug(favNextFixture)}`"
          class="meu-copa__match"
        >
          Próximo: {{ getTeam(favNextFixture.home === favTeam.code ? favNextFixture.away : favNextFixture.home)?.flag }}
          {{ getTeam(favNextFixture.home === favTeam.code ? favNextFixture.away : favNextFixture.home)?.code }}
          · {{ fmtDate(favNextFixture.date) }}
        </NuxtLink>
        <span v-else class="text-xs text-muted">Sem próximos jogos</span>
      </div>
    </div>

    <NuxtLink to="/campeonatos" style="text-decoration: none; color: inherit; display: block; margin-bottom: var(--space-xl);">
      <div class="card card--interactive" style="background: linear-gradient(135deg, rgba(30,58,138,0.2), rgba(10,14,26,0.95)); border: 1px solid rgba(147,197,253,0.2);">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-md">
            <span style="font-size: 1.5rem;">⭐</span>
            <div>
              <div class="font-display font-bold" style="color: var(--color-ucl-star, #ffd700);">Campeonatos Ao Vivo</div>
              <div class="text-sm text-muted">Champions League, Brasileirão, Premier League</div>
            </div>
          </div>
        </div>
      </div>
    </NuxtLink>

    <h1 class="section-title">
      Próximos Jogos
      <span v-if="pendingInView > 0" class="pending-badge">{{ pendingInView }} sem palpite</span>
    </h1>
    <div class="matches-list matches-list--grid">
      <MatchCard
        v-for="f in upcoming"
        :key="f.id"
        :fixture="f"
        :prediction="pred(f)"
      />
      <p v-if="!upcoming.length" class="text-muted text-sm" style="padding: var(--space-md)">Todos os jogos encerrados.</p>
    </div>

    <div class="mt-xl">
      <div class="section-title">Acesse as Seções</div>
      <div class="matches-list">
        <NuxtLink to="/grupos" class="card card--interactive card--gold" style="text-decoration:none;color:inherit;display:block">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-display font-bold">Grupos &amp; Classificação</div>
              <div class="text-sm text-muted">12 grupos, 48 seleções</div>
            </div>
          </div>
        </NuxtLink>
        <NuxtLink to="/jogos" class="card card--interactive" style="text-decoration:none;color:inherit;display:block">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-display font-bold">Match Center</div>
              <div class="text-sm text-muted">Calendário completo dos 104 jogos</div>
            </div>
          </div>
        </NuxtLink>
        <NuxtLink to="/fanzone" class="card card--interactive" style="text-decoration:none;color:inherit;display:block">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-display font-bold">FanZone</div>
              <div class="text-sm text-muted">Bolão, trivia e ranking</div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div class="calendar-import mt-xl">
      <div class="calendar-import__content">
        <div class="calendar-import__title">Leve o Mundial no seu calendário</div>
        <p class="calendar-import__description">Importe todas as 104 partidas direto para Google / Apple / Outlook.</p>
      </div>
      <button class="btn btn--gold btn--sm calendar-import__btn" type="button" @click="onImportCalendar">
        Importar Calendário
      </button>
    </div>
  </div>
</template>
