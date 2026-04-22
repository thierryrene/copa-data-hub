<script setup>
// Timeline animada de eventos da partida (gols, cartões, substituições, VAR).
// Ex-renderTimeline de js/components/match/matchSections.js
import { computed } from 'vue';

const props = defineProps({
  events: { type: Array, default: () => [] },
  home: { type: Object, required: true },
  away: { type: Object, required: true }
});

const EVENT_EMOJI = { Goal: '⚽', Card: '🟨', subst: '🔄', Var: '📺' };

const hasEvents = computed(() => !!props.events?.length);

const sorted = computed(() => {
  if (!hasEvents.value) return [];
  return [...props.events]
    .sort((a, b) => a.minute - b.minute)
    .map((ev) => {
      const side =
        ev.teamName === props.home.name
          ? 'home'
          : ev.teamName === props.away.name
          ? 'away'
          : '';
      const emoji =
        ev.detail === 'Yellow Card'
          ? '🟨'
          : ev.detail === 'Red Card'
          ? '🟥'
          : EVENT_EMOJI[ev.type] || '•';
      return { ev, side, emoji };
    });
});
</script>

<template>
  <p v-if="!hasEvents" class="text-sm text-muted">Sem eventos registrados.</p>

  <ul v-else class="timeline">
    <li
      v-for="(it, idx) in sorted"
      :key="idx"
      class="timeline__item"
      :class="it.side ? `timeline__item--${it.side}` : ''"
    >
      <span class="timeline__min">
        {{ it.ev.minute }}'<template v-if="it.ev.extra">+{{ it.ev.extra }}</template>
      </span>
      <span class="timeline__emoji">{{ it.emoji }}</span>
      <span class="timeline__txt">
        <b>{{ it.ev.playerName || '?' }}</b><template v-if="it.ev.assistName"> (assist: {{ it.ev.assistName }})</template><template v-if="it.ev.detail && it.ev.type !== 'Card'"> — {{ it.ev.detail }}</template>
      </span>
    </li>
  </ul>
</template>
