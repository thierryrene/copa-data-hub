<script setup>
// Briefing pré-jogo: rodada/grupo, o que está em jogo, posições atuais.
// Ex-renderMatchBriefing de js/components/match/matchSections.js
// Helpers pesados (computeGroupStandings etc.) vivem em ~/utils/briefing.
import { computed } from 'vue';
import { computeGroupStandings, matchdayLabel, stakesText } from '~/utils/briefing';

const props = defineProps({
  fixture: { type: Object, required: true },
  home: { type: Object, required: true },
  away: { type: Object, required: true }
});

const standings = computed(() => computeGroupStandings(props.fixture.group));

const hSt = computed(
  () => standings.value.find((s) => s.code === props.fixture.home) || { pts: 0, played: 0 }
);
const aSt = computed(
  () => standings.value.find((s) => s.code === props.fixture.away) || { pts: 0, played: 0 }
);
const hPos = computed(() => standings.value.findIndex((s) => s.code === props.fixture.home) + 1);
const aPos = computed(() => standings.value.findIndex((s) => s.code === props.fixture.away) + 1);

const rdLabel = computed(() => matchdayLabel(props.fixture));
const stakes = computed(() =>
  stakesText(standings.value, props.fixture.home, props.fixture.away, props.fixture.group)
);

const calendarIcon = computed(() => icon('calendar', 12));
const zapIcon = computed(() => icon('zap', 14));
</script>

<template>
  <div class="match-briefing">
    <div class="match-briefing__header">
      <span class="match-briefing__tag">
        <span v-html="calendarIcon"></span>
        Grupo {{ fixture.group }} · {{ rdLabel }}
      </span>
    </div>

    <div class="match-briefing__stakes">
      <div class="match-briefing__stakes-title">
        <span v-html="zapIcon"></span> O que está em jogo
      </div>
      <p class="match-briefing__stakes-text">{{ stakes }}</p>
    </div>

    <div class="match-briefing__standings">
      <div class="match-briefing__team-row">
        <span class="match-briefing__pos">{{ hPos }}º</span>
        <span class="match-briefing__flag">{{ home.flag }}</span>
        <span class="match-briefing__name">{{ home.code }}</span>
        <span class="match-briefing__pts">{{ hSt.pts }} pts</span>
        <span class="match-briefing__played">{{ hSt.played }}J</span>
      </div>
      <div class="match-briefing__team-row">
        <span class="match-briefing__pos">{{ aPos }}º</span>
        <span class="match-briefing__flag">{{ away.flag }}</span>
        <span class="match-briefing__name">{{ away.code }}</span>
        <span class="match-briefing__pts">{{ aSt.pts }} pts</span>
        <span class="match-briefing__played">{{ aSt.played }}J</span>
      </div>
    </div>
  </div>
</template>
