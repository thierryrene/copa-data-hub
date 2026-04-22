<script setup>
import { listLeagues } from '~/utils/leagues';

definePageMeta({ name: 'campeonatos' });

useSeoMeta({
  title: 'Campeonatos Ao Vivo — Champions, Brasileirão e Premier League',
  description: 'Acompanhe os principais campeonatos de futebol do mundo: UEFA Champions League, Brasileirão Série A e Premier League.'
});
useHead({ link: [{ rel: 'canonical', href: '/campeonatos' }] });

const leagues = listLeagues();
</script>

<template>
  <div>
    <h1 class="section-title">Campeonatos Ao Vivo</h1>
    <p class="section-subtitle">Acompanhe as principais competições com dados reais atualizados.</p>

    <div class="leagues-hub">
      <LeagueCard v-for="l in leagues" :key="l.slug" :league="l" />
    </div>

    <div class="mt-xl">
      <p class="text-sm text-muted">
        Dados fornecidos pela football-data.org / api-sports.io.
      </p>
    </div>
  </div>
</template>
