<script setup>
import { computed, ref } from 'vue';

definePageMeta({ name: 'grupos' });

useSeoMeta({
  title: 'Grupos e Classificação do Mundial 2026',
  description: 'Todos os 12 grupos do Mundial 2026 com as 48 seleções.'
});
useHead({ link: [{ rel: 'canonical', href: '/grupos' }] });

const filter = ref('all');

const groupEntries = computed(() => Object.entries(GROUPS));

const bracketSlots = [
  { home: '1ºA', away: '2ºB' }, { home: '1ºC', away: '2ºD' },
  { home: '1ºE', away: '2ºF' }, { home: '1ºG', away: '2ºH' },
  { home: '1ºI', away: '2ºJ' }, { home: '1ºK', away: '2ºL' },
  { home: '2ºA', away: '1ºB' }, { home: '2ºC', away: '1ºD' },
  { home: '2ºE', away: '1ºF' }, { home: '2ºG', away: '1ºH' },
  { home: '2ºI', away: '1ºJ' }, { home: '2ºK', away: '1ºL' },
  { home: '3ºA/B/C/D', away: '3ºE/F/G/H' }, { home: '3ºI/J/K/L', away: 'TBD' },
  { home: 'TBD', away: 'TBD' }, { home: 'TBD', away: 'TBD' }
];
const qfSlots = Array.from({ length: 4 }, (_, i) => ({ home: `Vencedor ${i*2+1}`, away: `Vencedor ${i*2+2}` }));
const sfSlots = [{ home: 'Vencedor QF1', away: 'Vencedor QF2' }, { home: 'Vencedor QF3', away: 'Vencedor QF4' }];
</script>

<template>
  <div>
    <h1 class="section-title">Fase de Grupos</h1>
    <p class="section-subtitle">12 grupos · Os 2 primeiros classificam-se diretamente + 8 melhores terceiros</p>

    <div class="filter-tabs">
      <button class="filter-tab" :class="{ active: filter === 'all' }" @click="filter = 'all'">Todos</button>
      <button
        v-for="[id] in groupEntries"
        :key="id"
        class="filter-tab"
        :class="{ active: filter === id }"
        @click="filter = id"
      >Grupo {{ id }}</button>
      <button class="filter-tab" :class="{ active: filter === 'bracket' }" @click="filter = 'bracket'">🏆 Mata-Mata</button>
    </div>

    <div v-show="filter !== 'bracket'" class="groups-grid">
      <div
        v-for="[id, g] in groupEntries"
        :key="id"
        v-show="filter === 'all' || filter === id"
        class="group-wrapper"
      >
        <GroupTable :group-id="id" :team-codes="g.teams" />
      </div>
    </div>

    <div v-show="filter === 'bracket'" class="bracket-section">
      <div class="section-title">Chaveamento do Mata-Mata</div>
      <p class="section-subtitle">Projeção do chaveamento após a fase de grupos.</p>
      <div class="bracket-scroll">
        <div class="bracket-container">
          <div class="bracket-round">
            <div class="bracket-round__label">Oitavas de Final</div>
            <div class="bracket-round__matches">
              <div v-for="(s, i) in bracketSlots" :key="i" class="bracket-match">
                <div class="bracket-slot">{{ s.home }}</div>
                <div class="bracket-slot">{{ s.away }}</div>
              </div>
            </div>
          </div>
          <div class="bracket-arrow">›</div>
          <div class="bracket-round">
            <div class="bracket-round__label">Quartas de Final</div>
            <div class="bracket-round__matches">
              <div v-for="(s, i) in qfSlots" :key="i" class="bracket-match">
                <div class="bracket-slot">{{ s.home }}</div>
                <div class="bracket-slot">{{ s.away }}</div>
              </div>
            </div>
          </div>
          <div class="bracket-arrow">›</div>
          <div class="bracket-round">
            <div class="bracket-round__label">Semifinal</div>
            <div class="bracket-round__matches">
              <div v-for="(s, i) in sfSlots" :key="i" class="bracket-match">
                <div class="bracket-slot">{{ s.home }}</div>
                <div class="bracket-slot">{{ s.away }}</div>
              </div>
            </div>
          </div>
          <div class="bracket-arrow">›</div>
          <div class="bracket-round bracket-round--final">
            <div class="bracket-round__label">Final</div>
            <div class="bracket-match bracket-match--final">
              <div class="bracket-slot">Vencedor SF1</div>
              <div class="bracket-final-vs">vs</div>
              <div class="bracket-slot">Vencedor SF2</div>
            </div>
            <div class="bracket-venue">🏟️ MetLife Stadium, NJ · 19/07/2026</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
