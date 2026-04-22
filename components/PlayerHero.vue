<script setup>
import { computed } from 'vue';

const props = defineProps({
  player: { type: Object, default: null }
});

const POSITION_MAP = {
  Goalkeeper: 'Goleiro',
  Defender: 'Defensor',
  Midfielder: 'Meio-campista',
  Attacker: 'Atacante'
};

const positionLabel = computed(() => {
  if (!props.player) return '';
  return POSITION_MAP[props.player.position] || props.player.position || '';
});

const birthStr = computed(() => {
  const d = props.player?.birth?.date;
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
});

const birthPlace = computed(() => {
  const b = props.player?.birth || {};
  return [b.place, b.country].filter(Boolean).join(', ');
});

const physical = computed(() => {
  if (!props.player) return '';
  return [props.player.height, props.player.weight].filter(Boolean).join(' · ');
});
</script>

<template>
  <section v-if="player" class="player-hero">
    <div class="player-hero__photo-wrap">
      <img
        v-if="player.photo"
        class="player-hero__photo"
        :src="player.photo"
        :alt="player.name"
        loading="lazy"
      >
      <div v-else class="player-hero__photo-placeholder">⚽</div>
      <span v-if="player.number" class="player-hero__number">#{{ player.number }}</span>
    </div>
    <div class="player-hero__info">
      <div class="player-hero__kicker">{{ positionLabel }}</div>
      <h1 class="player-hero__name">{{ player.name }}</h1>
      <div class="player-hero__tags">
        <span class="player-hero__tag">{{ player.nationality }}</span>
        <span v-if="player.currentTeam?.name" class="player-hero__tag player-hero__tag--club">
          <img
            v-if="player.currentTeam.logo"
            class="player-hero__team-logo"
            :src="player.currentTeam.logo"
            alt=""
            loading="lazy"
            onerror="this.style.display='none'"
          >
          {{ player.currentTeam.name }}
        </span>
        <span v-if="player.captain" class="player-hero__tag player-hero__tag--gold">© Capitão</span>
      </div>
      <div class="player-hero__meta">
        <template v-if="player.age">{{ player.age }} anos</template>
        <template v-if="physical"> · {{ physical }}</template>
        <template v-if="birthStr"> · Nasc. {{ birthStr }}</template>
      </div>
      <div v-if="birthPlace" class="player-hero__meta">{{ birthPlace }}</div>
    </div>
  </section>
</template>
