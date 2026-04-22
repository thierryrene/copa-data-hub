<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  homeVal: { type: [Number, String], default: 0 },
  awayVal: { type: [Number, String], default: 0 },
  isPercent: { type: Boolean, default: false }
});

const total = computed(() => (Number(props.homeVal) + Number(props.awayVal)) || 1);
const homePct = computed(() => Math.round((Number(props.homeVal) / total.value) * 100));
const awayPct = computed(() => 100 - homePct.value);
const suffix = computed(() => (props.isPercent ? '%' : ''));
</script>

<template>
  <div class="stat-bar">
    <div class="stat-bar__header">
      <span class="stat-bar__values">
        <span class="stat-bar__value--home">{{ homeVal }}{{ suffix }}</span>
      </span>
      <span class="stat-bar__label">{{ label }}</span>
      <span class="stat-bar__values">
        <span class="stat-bar__value--away">{{ awayVal }}{{ suffix }}</span>
      </span>
    </div>
    <div class="stat-bar__track">
      <div class="stat-bar__fill-home" :style="{ width: homePct + '%' }"></div>
      <div class="stat-bar__fill-away" :style="{ width: awayPct + '%' }"></div>
    </div>
  </div>
</template>
