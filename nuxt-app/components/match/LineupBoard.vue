<script setup>
// Board com 2 campos (home/away) + bancos laterais.
// Ex-renderLineupsBoard de js/components/match/lineupField.js
import { computed } from 'vue';
import LineupField from './LineupField.vue';

const props = defineProps({
  lineups: { type: Array, default: () => [] },
  home: { type: Object, required: true },
  away: { type: Object, required: true }
});

const hasLineups = computed(() => !!props.lineups?.length);

const homeLineup = computed(() => {
  if (!hasLineups.value) return null;
  return props.lineups.find((l) => l.teamId === props.home.id) || props.lineups[0];
});

const awayLineup = computed(() => {
  if (!hasLineups.value) return null;
  return props.lineups.find((l) => l.teamId === props.away.id) || props.lineups[1];
});
</script>

<template>
  <div v-if="!hasLineups" class="lineup-board-empty">
    <p class="text-sm text-muted">
      Escalações ainda não foram divulgadas. Volte mais perto do kickoff.
    </p>
  </div>

  <div v-else class="lineup-board">
    <div class="lineup-board__col">
      <LineupField :lineup="homeLineup" side="home" :team-name="home.name" />
      <div v-if="homeLineup?.substitutes?.length" class="lineup-bench lineup-bench--home">
        <div class="lineup-bench__lbl">Banco</div>
        <ul class="lineup-bench__list">
          <li
            v-for="(p, i) in homeLineup.substitutes"
            :key="`hb-${i}`"
            :data-player-card="p.name || ''"
          >
            <span class="lineup-bench__num">{{ p.number ?? '' }}</span>
            <span class="lineup-bench__name">{{ p.name || '' }}</span>
            <span class="lineup-bench__pos">{{ p.pos || '' }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="lineup-board__col">
      <LineupField :lineup="awayLineup" side="away" :team-name="away.name" />
      <div v-if="awayLineup?.substitutes?.length" class="lineup-bench lineup-bench--away">
        <div class="lineup-bench__lbl">Banco</div>
        <ul class="lineup-bench__list">
          <li
            v-for="(p, i) in awayLineup.substitutes"
            :key="`ab-${i}`"
            :data-player-card="p.name || ''"
          >
            <span class="lineup-bench__num">{{ p.number ?? '' }}</span>
            <span class="lineup-bench__name">{{ p.name || '' }}</span>
            <span class="lineup-bench__pos">{{ p.pos || '' }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
