<script setup>
import { computed, ref, reactive } from 'vue';

definePageMeta({ name: 'fanzone' });

useSeoMeta({
  title: 'FanZone — Bolão, Trivia e Ranking do Mundial',
  description: 'Jogue o bolão do Mundial 2026, responda perguntas de trivia e suba no ranking global.'
});
useHead({ link: [{ rel: 'canonical', href: '/fanzone' }] });

const user = useUserStore();
const mock = useMockStore();
const { showToast } = useToast();

const tab = ref('bolao');

const fixtures = computed(() => applyMockToFixtures(FIXTURES, mock.scenario));
const bolaoFixtures = computed(() => fixtures.value.slice(0, 4));

const upcomingAll = computed(() => fixtures.value.filter(f => matchPhase(f) === 'pre'));
const pendingCount = computed(() =>
  upcomingAll.value.filter(f => !user.predictions.find(p => p.fixtureId === f.id)).length
);

// Inputs locais por fixture
const inputs = reactive({});
function getInput(f) {
  if (!inputs[f.id]) {
    const existing = user.predictions.find(p => p.fixtureId === f.id);
    inputs[f.id] = {
      home: existing?.homeScore ?? '',
      away: existing?.awayScore ?? '',
      conf: existing?.confidence || 1
    };
  }
  return inputs[f.id];
}

function savePred(f) {
  const i = getInput(f);
  const h = parseInt(i.home) || 0;
  const a = parseInt(i.away) || 0;
  user.savePrediction(f.id, h, a, i.conf);
  const r = user.addXP(15);
  showToast(`Palpite salvo! +15 XP ${'⭐'.repeat(i.conf)}`, 'xp');
  if (r.leveledUp) setTimeout(() => showToast(`🎉 Nível ${r.newLevel}!`, 'success'), 800);
}

// Trivia
const nextTrivia = computed(() =>
  TRIVIA.find(q => !user.triviaAnswered.includes(q.id)) || null
);
const triviaAnswered = ref(false);
const triviaSelected = ref(null);

function answerTrivia(idx) {
  if (!nextTrivia.value || triviaAnswered.value) return;
  triviaAnswered.value = true;
  triviaSelected.value = idx;
  const correct = idx === nextTrivia.value.answer;
  user.recordTrivia(nextTrivia.value.id, correct);
  if (correct) {
    const r = user.addXP(25);
    showToast('✅ Correto! +25 XP', 'xp');
    if (r.leveledUp) setTimeout(() => showToast(`🎉 Nível ${r.newLevel}!`, 'success'), 800);
  } else {
    showToast('❌ Incorreto!', 'error');
  }
  setTimeout(() => {
    triviaAnswered.value = false;
    triviaSelected.value = null;
  }, 2000);
}

// Palpites agrupados
const palpitesGroups = computed(() => {
  const groups = { exact: [], winner: [], pending: [], miss: [] };
  const fixtureLookup = fixtures.value;
  user.predictions.forEach(pred => {
    const fixture = fixtureLookup.find(f => f.id === pred.fixtureId);
    if (!fixture) return;
    const xp = predictionResultXP(pred, fixture);
    const multiplier = pred.confidence || 1;
    const earned = Math.round(xp * multiplier);
    if (fixture.status !== 'FT') groups.pending.push({ pred, fixture, earned });
    else if (xp === 100) groups.exact.push({ pred, fixture, earned });
    else if (xp === 50) groups.winner.push({ pred, fixture, earned });
    else groups.miss.push({ pred, fixture, earned });
  });
  return groups;
});

function predictionResultXP(prediction, fixture) {
  if (!prediction || fixture.status !== 'FT') return 0;
  if (fixture.homeScore == null || fixture.awayScore == null) return 0;
  const exact = prediction.homeScore === fixture.homeScore && prediction.awayScore === fixture.awayScore;
  if (exact) return 100;
  const realDiff = Math.sign(fixture.homeScore - fixture.awayScore);
  const predDiff = Math.sign(prediction.homeScore - prediction.awayScore);
  if (realDiff === predDiff) return 50;
  return 5;
}
</script>

<template>
  <div>
    <div class="section-title">FanZone</div>

    <div class="fanzone-stats">
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--gold">{{ user.level }}</span>
        <span class="fanzone-stat__label">Nível</span>
      </div>
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--emerald">{{ user.predictions.length }}</span>
        <span class="fanzone-stat__label">Palpites</span>
      </div>
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--blue">{{ user.streak }}</span>
        <span class="fanzone-stat__label">Streak</span>
      </div>
    </div>

    <XpBar />

    <div class="sub-tabs">
      <button class="sub-tab" :class="{ active: tab === 'bolao' }" @click="tab = 'bolao'">⚽ Bolão</button>
      <button class="sub-tab" :class="{ active: tab === 'palpites' }" @click="tab = 'palpites'">📋 Palpites</button>
      <button class="sub-tab" :class="{ active: tab === 'trivia' }" @click="tab = 'trivia'">🧠 Trivia</button>
    </div>

    <div v-show="tab === 'bolao'" class="fanzone-tab-content">
      <div class="section-title">Bolão Relâmpago</div>
      <p class="section-subtitle">Dê seus palpites e ganhe XP!</p>
      <div v-if="pendingCount > 0" class="pending-alert">
        <strong>{{ pendingCount }}</strong> partida{{ pendingCount > 1 ? 's' : '' }} sem palpite
      </div>
      <div class="bolao-grid">
        <div
          v-for="f in bolaoFixtures"
          :key="f.id"
          class="card bolao-card mb-md"
        >
          <div class="match-card__header mb-sm">
            <span class="match-card__group">Grupo {{ f.group }}</span>
            <span class="text-xs text-muted">{{ f.date }} · {{ f.time }}</span>
          </div>
          <div class="bolao-card__match">
            <div class="bolao-card__team-info">
              <span class="bolao-card__flag">{{ getTeam(f.home)?.flag }}</span>
              <span class="bolao-card__code">{{ getTeam(f.home)?.code }}</span>
            </div>
            <div class="bolao-card__scores">
              <input
                type="number"
                min="0"
                max="20"
                class="bolao-card__input"
                v-model="getInput(f).home"
                placeholder="–"
              >
              <span class="bolao-card__sep">VS</span>
              <input
                type="number"
                min="0"
                max="20"
                class="bolao-card__input"
                v-model="getInput(f).away"
                placeholder="–"
              >
            </div>
            <div class="bolao-card__team-info">
              <span class="bolao-card__flag">{{ getTeam(f.away)?.flag }}</span>
              <span class="bolao-card__code">{{ getTeam(f.away)?.code }}</span>
            </div>
          </div>
          <div class="bolao-card__confidence">
            <span class="bolao-card__confidence-label">Confiança</span>
            <div class="conf-stars">
              <button
                v-for="n in 3"
                :key="n"
                class="conf-star"
                :class="{ 'conf-star--active': n <= getInput(f).conf }"
                type="button"
                @click="getInput(f).conf = n"
              >⭐</button>
            </div>
          </div>
          <button class="btn btn--primary btn--sm btn--full mt-sm" @click="savePred(f)">
            Salvar Palpite
          </button>
        </div>
      </div>
    </div>

    <div v-show="tab === 'palpites'" class="fanzone-tab-content">
      <div class="section-title">Meus Palpites</div>
      <p v-if="!user.predictions.length" class="text-muted text-sm">Você ainda não deu nenhum palpite.</p>
      <template v-else>
        <div v-for="(items, key) in palpitesGroups" :key="key" v-show="items.length" class="prediction-group">
          <div class="prediction-group__label">
            {{ key === 'exact' ? '🎯 Placar exato' : key === 'winner' ? '✅ Acertou vencedor' : key === 'pending' ? '⏳ Aguardando' : '💪 Não acertou' }}
            <span class="prediction-group__count">{{ items.length }}</span>
          </div>
          <div class="prediction-list">
            <div v-for="({ pred, fixture, earned }) in items" :key="fixture.id" class="prediction-item">
              <div class="prediction-item__teams">
                <span>{{ getTeam(fixture.home)?.flag }} {{ getTeam(fixture.home)?.code }}</span>
                <span class="prediction-item__sep">×</span>
                <span>{{ getTeam(fixture.away)?.code }} {{ getTeam(fixture.away)?.flag }}</span>
              </div>
              <div class="prediction-item__bet">
                <span class="prediction-item__score">{{ pred.homeScore }}–{{ pred.awayScore }}</span>
                <span>{{ '⭐'.repeat(pred.confidence || 1) }}</span>
              </div>
              <div v-if="fixture.status === 'FT'" class="prediction-item__xp">+{{ earned }} XP</div>
              <div v-else class="prediction-item__date">{{ fixture.date }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-show="tab === 'trivia'" class="fanzone-tab-content">
      <div class="section-title">Trivia do Mundial</div>
      <p class="section-subtitle">{{ user.triviaAnswered.length }}/{{ TRIVIA.length }} respondidas</p>
      <div v-if="nextTrivia" class="card trivia-card">
        <div class="trivia-question">{{ nextTrivia.question }}</div>
        <div class="trivia-options" :class="{ answered: triviaAnswered }">
          <button
            v-for="(opt, i) in nextTrivia.options"
            :key="i"
            class="trivia-option"
            :class="{
              correct: triviaAnswered && i === nextTrivia.answer,
              wrong: triviaAnswered && i === triviaSelected && i !== nextTrivia.answer
            }"
            @click="answerTrivia(i)"
          >
            <span class="trivia-option__letter">{{ String.fromCharCode(65 + i) }}</span>
            {{ opt }}
          </button>
        </div>
      </div>
      <div v-else class="card text-center" style="padding: var(--space-3xl);">
        <div style="font-size: 3rem">🎉</div>
        <div class="font-display font-bold">Todas respondidas!</div>
      </div>
    </div>
  </div>
</template>
