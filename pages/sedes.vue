<script setup>
import { computed, ref } from 'vue';

definePageMeta({ name: 'sedes' });

useSeoMeta({
  title: 'Sedes e Estádios do Mundial 2026',
  description: 'Os 16 estádios que sediam o Mundial 2026 em EUA, Canadá e México.'
});
useHead({ link: [{ rel: 'canonical', href: '/sedes' }] });

const filter = ref('all');
const selectedStadium = ref(null);

const filtered = computed(() =>
  STADIUMS.filter(s => filter.value === 'all' || s.country === filter.value)
);

function open(stadium) { selectedStadium.value = stadium; }
function close() { selectedStadium.value = null; }
</script>

<template>
  <div>
    <h1 class="section-title">Sedes &amp; Estádios</h1>
    <p class="section-subtitle">16 estádios em 3 países · 4 fusos horários</p>

    <div class="fanzone-stats mb-xl">
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--blue">11</span>
        <span class="fanzone-stat__label">🇺🇸 EUA</span>
      </div>
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--emerald">3</span>
        <span class="fanzone-stat__label">🇲🇽 México</span>
      </div>
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--gold">2</span>
        <span class="fanzone-stat__label">🇨🇦 Canadá</span>
      </div>
    </div>

    <div class="filter-tabs">
      <button class="filter-tab" :class="{ active: filter === 'all' }" @click="filter = 'all'">Todos (16)</button>
      <button class="filter-tab" :class="{ active: filter === 'EUA' }" @click="filter = 'EUA'">🇺🇸 EUA (11)</button>
      <button class="filter-tab" :class="{ active: filter === 'México' }" @click="filter = 'México'">🇲🇽 México (3)</button>
      <button class="filter-tab" :class="{ active: filter === 'Canadá' }" @click="filter = 'Canadá'">🇨🇦 Canadá (2)</button>
    </div>

    <div class="stadium-grid">
      <StadiumCard
        v-for="s in filtered"
        :key="s.id"
        :stadium="s"
        @click="open(s)"
      />
    </div>

    <Stadium3dModal :stadium="selectedStadium" @close="close" />
  </div>
</template>
