<script setup>
// Nav de abas adaptativa à fase da partida.
// Controla aba ativa internamente mas emite `change(tabId)` para o pai
// sincronizar os painéis correspondentes.
// Ex-renderMatchTabs + bindMatchTabs de js/components/match/matchSections.js
import { ref, computed, watch } from 'vue';

const props = defineProps({
  phase: { type: String, required: true }, // 'pre' | 'live' | 'finished'
  modelValue: { type: String, default: null }
});

const emit = defineEmits(['change', 'update:modelValue']);

const tabs = computed(() => {
  if (props.phase === 'pre') {
    return [
      { id: 'overview', label: `${icon('zap', 14)} Pré-Jogo` },
      { id: 'lineups', label: `${icon('users', 14)} Provável XI` }
    ];
  }
  if (props.phase === 'live') {
    return [
      { id: 'live', label: '🔴 Ao Vivo' },
      { id: 'lineups', label: `${icon('users', 14)} Escalação` },
      { id: 'stats', label: `${icon('barChart', 14)} Stats` },
      { id: 'events', label: `${icon('calendar', 14)} Eventos` }
    ];
  }
  return [
    { id: 'recap', label: `${icon('sparkles', 14)} Resumo` },
    { id: 'lineups', label: `${icon('users', 14)} Escalação` },
    { id: 'stats', label: `${icon('barChart', 14)} Stats` },
    { id: 'vizual', label: `${icon('target', 14)} Visuais` },
    { id: 'events', label: `${icon('calendar', 14)} Eventos` }
  ];
});

const active = ref(props.modelValue || tabs.value[0]?.id || '');

watch(
  () => props.modelValue,
  (v) => {
    if (v && v !== active.value) active.value = v;
  }
);

watch(tabs, (list) => {
  if (!list.find((t) => t.id === active.value)) {
    active.value = list[0]?.id || '';
    emit('change', active.value);
    emit('update:modelValue', active.value);
  }
});

function select(id) {
  if (active.value === id) return;
  active.value = id;
  emit('change', id);
  emit('update:modelValue', id);
}
</script>

<template>
  <div class="match-tabs" id="match-tabs-nav" role="tablist">
    <button
      v-for="t in tabs"
      :key="t.id"
      class="match-tab"
      :class="{ 'match-tab--active': active === t.id }"
      :data-tab="t.id"
      role="tab"
      :aria-selected="active === t.id"
      type="button"
      @click="select(t.id)"
      v-html="t.label"
    ></button>
  </div>
</template>
