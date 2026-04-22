<script setup>
// Narrativa pós-jogo: resultado + linha por gol.
// Ex-renderRecap de js/components/match/matchSections.js
import { computed } from 'vue';

const props = defineProps({
  fixture: { type: Object, required: true },
  events: { type: Array, default: () => [] },
  home: { type: Object, required: true },
  away: { type: Object, required: true }
});

const lines = computed(() => {
  const f = props.fixture;
  if (!props.events?.length) {
    return [`Partida encerrada em ${f.homeScore ?? 0} a ${f.awayScore ?? 0}.`];
  }
  const goals = props.events.filter((e) => e.type === 'Goal').sort((a, b) => a.minute - b.minute);
  const parts = [];
  if (f.homeScore > f.awayScore) {
    parts.push(`${props.home.name} venceu ${props.away.name} por ${f.homeScore} a ${f.awayScore}.`);
  } else if (f.awayScore > f.homeScore) {
    parts.push(`${props.away.name} venceu ${props.home.name} por ${f.awayScore} a ${f.homeScore}.`);
  } else {
    parts.push(`${props.home.name} e ${props.away.name} empataram em ${f.homeScore} a ${f.awayScore}.`);
  }
  goals.forEach((g) => {
    parts.push(
      `${g.playerName} marcou aos ${g.minute}'${g.assistName ? ` (assistência de ${g.assistName})` : ''}.`
    );
  });
  return parts;
});

const singlePara = computed(() => !props.events?.length);
</script>

<template>
  <p v-if="singlePara" class="match-recap__txt">{{ lines[0] }}</p>
  <div v-else class="match-recap">
    <p v-for="(l, idx) in lines" :key="idx">{{ l }}</p>
  </div>
</template>
