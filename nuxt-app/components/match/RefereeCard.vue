<script setup>
// Card de arbitragem. Oculto quando `referee` está vazio.
import { computed } from 'vue';

const props = defineProps({
  referee: { type: String, default: '' }
});

const iconSvg = computed(() => icon('whistle', 18) || icon('shield', 18));
</script>

<template>
  <div v-if="referee" class="card referee-card" aria-label="Arbitragem da partida">
    <div class="referee-card__icon" v-html="iconSvg"></div>
    <div>
      <div class="referee-card__lbl">Árbitro principal</div>
      <div class="referee-card__name">{{ referee }}</div>
    </div>
  </div>
</template>
