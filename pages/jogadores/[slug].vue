<script setup>
import { ref, computed, watch } from 'vue';
import { resolvePlayerIdBySlug, fetchPlayerDetails, registerPlayerSlug } from '~/api/player';
import { fetchWikipediaPlayerSummary, extractCuriosities } from '~/api/wikipedia';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();

const slug = computed(() => String(route.params.slug || '').toLowerCase());

const player = ref(null);
const loading = ref(true);
const wikiData = ref(null);
const wikiError = ref(false);
const curiosities = ref([]);

useSeoMeta({
  title: () => player.value ? player.value.name : `Jogador — ${slug.value.replace(/-/g, ' ')}`,
  description: () => player.value
    ? `${player.value.name}: perfil, estatísticas e dossiê enciclopédico.`
    : 'Perfil e estatísticas de jogador.'
});
watchEffect(() => {
  useHead({ link: [{ rel: 'canonical', href: `/jogadores/${slug.value}` }] });
});

async function load() {
  loading.value = true;
  player.value = null;
  wikiData.value = null;
  wikiError.value = false;
  curiosities.value = [];

  try {
    const playerId = await resolvePlayerIdBySlug(slug.value);
    if (playerId) {
      player.value = await fetchPlayerDetails(playerId);
      if (player.value) registerPlayerSlug(slugify(player.value.name), player.value.id);
    }
  } catch (e) {
    console.error('[jogadores] fetch:', e);
  } finally {
    loading.value = false;
  }

  const name = player.value?.name;
  if (!name) return;
  try {
    const wiki = await fetchWikipediaPlayerSummary(name);
    wikiData.value = wiki;
    if (wiki?.extract) curiosities.value = extractCuriosities(wiki.extract, 4);
  } catch {
    wikiError.value = true;
  }
}

watch(slug, () => load(), { immediate: true });

function goBack() {
  if (window.history.length > 1) window.history.back();
  else router.push('/');
}

async function share() {
  if (!player.value) return;
  const s = slugify(player.value.name);
  const data = {
    title: `${player.value.name} no CopaDataHub 2026`,
    text: `Veja o perfil de ${player.value.name}!`,
    url: `${window.location.origin}/jogadores/${s}`
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
</script>

<template>
  <div>
    <button class="team-page__back" type="button" @click="goBack">← Voltar</button>

    <PlayerHero :player="player" />

    <div v-if="player" class="player-page__actions">
      <button class="btn btn--ghost player-page__action" @click="share">Compartilhar</button>
    </div>

    <PlayerStats :player="player" />

    <div class="team-page__section">
      <div class="section-title">Dossiê enciclopédico</div>
      <div class="team-page__wiki">
        <template v-if="wikiError">
          <p class="text-sm text-muted">Não foi possível carregar o dossiê agora.</p>
        </template>
        <template v-else-if="wikiData">
          <p v-if="wikiData.description" class="team-page__wiki-lead">
            <strong>{{ wikiData.description }}</strong>
          </p>
          <p class="team-page__wiki-body">
            {{ wikiData.extract || 'Resumo não disponível.' }}
          </p>
        </template>
        <template v-else-if="!loading && !player">
          <p class="text-sm text-muted">Jogador não encontrado.</p>
        </template>
        <template v-else>
          <div class="team-page__skeleton team-page__skeleton--lg"></div>
          <div class="team-page__skeleton"></div>
        </template>
      </div>
    </div>

    <div v-if="curiosities.length" class="team-page__section">
      <div class="section-title">Curiosidades</div>
      <ul class="team-page__curiosities">
        <li v-for="(c, i) in curiosities" :key="i">{{ c }}</li>
      </ul>
    </div>

    <div v-if="wikiData?.url" class="team-page__source">
      <a :href="wikiData.url" target="_blank" rel="noopener noreferrer">Abrir na Wikipedia</a>
    </div>
  </div>
</template>
