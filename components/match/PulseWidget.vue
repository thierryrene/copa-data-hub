<script setup>
// 4 botões emoji com contadores persistidos em localStorage por fixtureId.
// Ex-renderPulse + bindPulse de js/components/match/matchSections.js
import { ref, onMounted, watch, computed } from 'vue';

const props = defineProps({
  fixtureId: { type: [String, Number], required: true }
});

const PULSE_EMOJIS = ['⚽', '🔥', '😱', '🙏'];

const counts = ref({});
const bumpEmoji = ref('');

const storageKey = computed(() => `cdh_pulse_${props.fixtureId}`);

function load() {
  if (!import.meta.client) return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey.value) || '{}');
  } catch {
    return {};
  }
}

function save(data) {
  if (!import.meta.client) return;
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(data));
  } catch {
    // silent fallback
  }
}

onMounted(() => {
  counts.value = load();
});

watch(
  () => props.fixtureId,
  () => {
    counts.value = load();
  }
);

function bump(emoji) {
  const next = { ...counts.value };
  next[emoji] = (next[emoji] || 0) + 1;
  counts.value = next;
  save(next);
  bumpEmoji.value = emoji;
  setTimeout(() => {
    if (bumpEmoji.value === emoji) bumpEmoji.value = '';
  }, 300);
}
</script>

<template>
  <div class="pulse" :data-fixture="String(fixtureId)">
    <button
      v-for="e in PULSE_EMOJIS"
      :key="e"
      class="pulse__btn"
      :class="{ 'pulse__btn--bump': bumpEmoji === e }"
      :data-emoji="e"
      type="button"
      @click="bump(e)"
    >
      <span class="pulse__emoji">{{ e }}</span>
      <span class="pulse__count" :data-emoji-count="e">{{ counts[e] || 0 }}</span>
    </button>
  </div>
</template>
