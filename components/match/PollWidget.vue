<script setup>
// Enquete efêmera com persistência por fixtureId em localStorage.
// Ex-renderPoll + bindPolls de js/components/match/matchSections.js
import { ref, onMounted, computed, watch } from 'vue';

const props = defineProps({
  fixtureId: { type: [String, Number], required: true },
  question: { type: String, required: true },
  options: { type: Array, default: () => [] }
});

const emit = defineEmits(['vote']);

const state = ref({ votes: {}, myVote: null });

const storageKey = computed(() => `cdh_poll_${props.fixtureId}`);

function load() {
  if (!import.meta.client) return { votes: {}, myVote: null };
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey.value) || '{}');
    return { votes: raw.votes || {}, myVote: raw.myVote || null };
  } catch {
    return { votes: {}, myVote: null };
  }
}

function save(data) {
  if (!import.meta.client) return;
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(data));
  } catch {
    // silent
  }
}

onMounted(() => {
  state.value = load();
});

watch(
  () => props.fixtureId,
  () => {
    state.value = load();
  }
);

const total = computed(() =>
  Object.values(state.value.votes || {}).reduce((a, b) => a + b, 0)
);

function vote(opt) {
  if (state.value.myVote) return;
  const next = {
    votes: { ...state.value.votes },
    myVote: opt
  };
  next.votes[opt] = (next.votes[opt] || 0) + 1;
  state.value = next;
  save(next);
  emit('vote', opt);
}

function pctFor(opt) {
  const v = state.value.votes?.[opt] || 0;
  return total.value ? Math.round((v / total.value) * 100) : 0;
}
</script>

<template>
  <div class="poll" :data-fixture="String(fixtureId)" :data-question="question">
    <div class="poll__q">{{ question }}</div>
    <button
      v-for="opt in options"
      :key="opt"
      class="poll__opt"
      :class="{
        'poll__opt--voted': !!state.myVote,
        'poll__opt--mine': state.myVote === opt
      }"
      :data-opt="opt"
      type="button"
      :disabled="!!state.myVote"
      @click="vote(opt)"
    >
      <span class="poll__bar" :style="{ width: `${pctFor(opt)}%` }"></span>
      <span class="poll__lbl">{{ opt }}</span>
      <span v-if="state.myVote" class="poll__pct">{{ pctFor(opt) }}%</span>
    </button>
    <div v-if="state.myVote" class="poll__total">
      {{ total }} voto{{ total === 1 ? '' : 's' }}
    </div>
  </div>
</template>
