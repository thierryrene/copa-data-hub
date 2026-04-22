<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { loadTeamDossier, getTeamDossierCached } from '~/api/teamLoader';
import { loadEnrichedTeams, getTeamEnriched } from '~/api/enriched';
import { fetchSquad, buildLineup } from '~/api/squad';

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const mock = useMockStore();
const { showToast } = useToast();

const rawSlug = computed(() => String(route.params.slug || '').toLowerCase());
const team = computed(() => getTeamBySlug(rawSlug.value));
const group = computed(() => team.value ? getGroupForTeam(team.value.code) : null);
const teamFixtures = computed(() =>
  team.value ? applyMockToFixtures(getTeamFixtures(team.value.code), mock.scenario) : []
);

const predictionsByFixture = computed(() =>
  new Map((user.predictions || []).map(p => [p.fixtureId, p]))
);

const isFavorite = computed(() =>
  team.value && user.favoriteTeam === team.value.code
);

const enriched = ref(null);
const dossier = ref(null);
const dossierError = ref(false);
const squad = ref(null);
const lineup = ref(null);

watch(team, (t) => {
  if (!t) return;
  useSeoMeta({
    title: `${t.name} no Mundial 2026`,
    description: `Dossiê completo da seleção ${t.name}: escalação provável, elenco, jogos, curiosidades.`
  });
  useHead({ link: [{ rel: 'canonical', href: `/selecoes/${t.slug}` }] });
}, { immediate: true });

async function loadAll(t) {
  enriched.value = null;
  dossier.value = getTeamDossierCached(t.code);
  dossierError.value = false;
  squad.value = null;
  lineup.value = null;

  loadEnrichedTeams().then(() => {
    enriched.value = getTeamEnriched(t.code);
  });

  if (!dossier.value) {
    loadTeamDossier(t)
      .then(p => { dossier.value = p; })
      .catch(() => { dossierError.value = true; });
  }

  try {
    const sq = await fetchSquad(t.code);
    if (sq) {
      squad.value = sq;
      lineup.value = buildLineup(sq);
    }
  } catch {}
}

watch(team, (t) => { if (t) loadAll(t); }, { immediate: true });

function goBack() {
  if (window.history.length > 1) window.history.back();
  else router.push('/grupos');
}

function setFavorite() {
  if (!team.value) return;
  const r = user.setFavoriteTeam(team.value.code);
  if (!r.changed) {
    showToast('Esta já é a sua seleção favorita.', 'info');
    return;
  }
  if (r.xpAwarded > 0) showToast(`${team.value.flag} Favorita definida! +${r.xpAwarded} XP`, 'xp');
  else showToast(`${team.value.flag} Nova favorita: ${team.value.name}`, 'success');
  if (r.leveledUp) setTimeout(() => showToast(`🎉 Nível ${r.newLevel}!`, 'success'), 800);
}

async function share() {
  if (!team.value) return;
  const data = {
    title: `${team.value.name} no CopaDataHub 2026`,
    text: `Veja o dossiê de ${team.value.flag} ${team.value.name}!`,
    url: `${window.location.origin}/selecoes/${team.value.slug}`
  };
  try {
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(data.url);
      showToast('🔗 Link copiado', 'success');
    }
  } catch (e) {
    if (e?.name !== 'AbortError') showToast('Falha ao compartilhar', 'error');
  }
}

const groupRivals = computed(() =>
  group.value ? group.value.teams.filter(c => c !== team.value.code) : []
);

// TODO: renderHonors / renderWorldCupTimeline / comparativo — simplificados aqui
</script>

<template>
  <div>
    <div v-if="!team" class="team-page__notfound">
      <div class="section-title">Seleção não encontrada</div>
      <NuxtLink class="btn btn--primary" to="/grupos">Voltar aos grupos</NuxtLink>
    </div>
    <template v-else>
      <button class="team-page__back" type="button" @click="goBack">← Voltar</button>

      <section class="team-page__hero">
        <div class="team-page__hero-flag">{{ team.flag }}</div>
        <div class="team-page__hero-info">
          <div class="team-page__hero-kicker">Seleção Nacional · {{ team.confederation }}</div>
          <h1 class="team-page__hero-name">{{ team.name }}</h1>
          <div class="team-page__hero-tags">
            <span class="team-page__tag">{{ team.code }}</span>
            <span v-if="group" class="team-page__tag team-page__tag--muted">Grupo {{ group.id }}</span>
            <span v-if="enriched?.nickname" class="team-page__tag team-page__tag--muted">{{ enriched.nickname }}</span>
            <span v-if="isFavorite" class="team-page__tag team-page__tag--gold">Sua seleção</span>
          </div>
          <div v-if="enriched?.coach" class="team-page__hero-coach">Técnico: <strong>{{ enriched.coach }}</strong></div>
        </div>
        <div class="team-page__hero-stats">
          <div class="team-page__hero-stat">
            <span class="team-page__hero-stat-value">#{{ team.ranking }}</span>
            <span class="team-page__hero-stat-label">Ranking FIFA</span>
          </div>
          <div class="team-page__hero-stat">
            <span class="team-page__hero-stat-value">{{ enriched?.worldCups?.length ?? '—' }}</span>
            <span class="team-page__hero-stat-label">Títulos Mundiais</span>
          </div>
          <div class="team-page__hero-stat">
            <span class="team-page__hero-stat-value">{{ teamFixtures.length }}</span>
            <span class="team-page__hero-stat-label">Jogos no Torneio</span>
          </div>
        </div>
      </section>

      <div class="team-page__actions">
        <button
          class="btn team-page__action"
          :class="isFavorite ? 'btn--gold' : 'btn--primary'"
          @click="setFavorite"
        >
          {{ isFavorite ? 'Sua seleção' : 'Definir como favorita' }}
        </button>
        <button class="btn btn--ghost team-page__action" @click="share">Compartilhar</button>
      </div>

      <div class="team-page__section">
        <div class="section-title">Jogos da seleção</div>
        <div class="team-page__fixtures">
          <TeamFixtureRow
            v-for="f in teamFixtures"
            :key="f.id"
            :fixture="f"
            :team-code="team.code"
            :user-prediction="predictionsByFixture.get(f.id)"
          />
          <p v-if="!teamFixtures.length" class="text-sm text-muted">Nenhum jogo cadastrado.</p>
        </div>
      </div>

      <div v-if="group" class="team-page__section">
        <div class="section-title">Adversários no Grupo {{ group.id }}</div>
        <div class="team-page__chips">
          <TeamChip v-for="code in groupRivals" :key="code" :code="code" />
        </div>
      </div>

      <div class="team-page__section">
        <div class="section-title">Escalação Provável</div>
        <LineupFieldSimple :lineup="lineup" :team-flag="team.flag" />
      </div>

      <div class="team-page__section">
        <div class="section-title">Elenco Completo</div>
        <SquadList :squad="squad" />
      </div>

      <div v-if="enriched" class="team-page__section">
        <div class="section-title">🏅 Honras</div>
        <div class="honors-grid">
          <div v-if="enriched.worldCups?.length" class="honor-block">
            <div class="honor-block__header">
              <span class="honor-block__trophy">🏆</span>
              <span class="honor-block__label">Copa do Mundo ({{ enriched.worldCups.length }}×)</span>
            </div>
            <div class="honor-block__years">
              <span v-for="y in enriched.worldCups" :key="y">{{ y }}</span>
            </div>
          </div>
          <div
            v-for="ct in (enriched.continentalTitles || [])"
            :key="ct.competition"
            class="honor-block"
          >
            <div class="honor-block__header">
              <span class="honor-block__trophy">🥇</span>
              <span class="honor-block__label">{{ ct.competition }} ({{ ct.years.length }}×)</span>
            </div>
            <div class="honor-block__years">
              <span v-for="y in ct.years.slice(-4)" :key="y">{{ y }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="enriched?.curiosities?.length" class="team-page__section">
        <div class="section-title">Curiosidades</div>
        <div class="curiosity-cards">
          <div v-for="(c, i) in enriched.curiosities" :key="i" class="curiosity-card">
            <div class="curiosity-card__header">
              <span class="curiosity-card__icon">{{ c.icon }}</span>
              <span class="curiosity-card__category">{{ c.category }}</span>
            </div>
            <p class="curiosity-card__text">{{ c.text }}</p>
          </div>
        </div>
      </div>

      <div class="team-page__section">
        <div class="section-title">Dossiê enciclopédico</div>
        <div v-if="dossierError" class="team-page__wiki">
          <p class="text-sm text-muted">Não foi possível carregar o dossiê agora.</p>
        </div>
        <div v-else-if="dossier?.wiki" class="team-page__wiki">
          <p v-if="dossier.wiki.description" class="team-page__wiki-lead">
            <strong>{{ dossier.wiki.description }}</strong>
          </p>
          <p class="team-page__wiki-body">{{ dossier.wiki.extract }}</p>
          <a v-if="dossier.wiki.url" :href="dossier.wiki.url" target="_blank" rel="noopener noreferrer">Abrir na Wikipedia</a>
        </div>
        <div v-else class="team-page__wiki">
          <div class="team-page__skeleton team-page__skeleton--lg"></div>
          <div class="team-page__skeleton"></div>
        </div>
      </div>
    </template>
  </div>
</template>
