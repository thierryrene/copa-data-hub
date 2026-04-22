<script setup>
// Campo SVG 220x320 com 11 titulares posicionados via `grid` (API-Football)
// ou agrupamento fallback por posição (G/D/M/F).
import { computed } from 'vue';

const props = defineProps({
  lineup: { type: Object, default: null },
  side: { type: String, default: 'home' }, // 'home' | 'away'
  teamName: { type: String, default: '' }
});

const FIELD_W = 220;
const FIELD_H = 320;

function groupByRow(players) {
  const rows = new Map();
  const fallback = { G: 1, D: 2, M: 3, F: 4 };

  players.forEach((p) => {
    let row;
    if (p.grid && /^\d+:\d+$/.test(p.grid)) {
      row = parseInt(p.grid.split(':')[0], 10);
    } else {
      row = fallback[p.pos] || 3;
    }
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row).push(p);
  });

  rows.forEach((arr) => {
    arr.sort((a, b) => {
      const colA = a.grid ? parseInt(a.grid.split(':')[1] || '0', 10) : 0;
      const colB = b.grid ? parseInt(b.grid.split(':')[1] || '0', 10) : 0;
      return colA - colB;
    });
  });

  return [...rows.entries()].sort((a, b) => a[0] - b[0]);
}

const slots = computed(() => {
  if (!props.lineup?.startXI?.length) return [];
  const rows = groupByRow(props.lineup.startXI);
  const totalRows = rows.length || 1;
  const result = [];

  rows.forEach(([, players], rowIdx) => {
    const yPct = (rowIdx + 0.5) / totalRows;
    const y = props.side === 'home'
      ? FIELD_H - yPct * FIELD_H + 14
      : yPct * FIELD_H + 6;

    players.forEach((p, colIdx) => {
      const xPct = (colIdx + 0.5) / players.length;
      const x = xPct * FIELD_W;
      const lastName = (p.name || '').split(' ').slice(-1).join('') || (p.name || '');
      result.push({
        x,
        y,
        player: p,
        lastName,
        num: p.number ?? ''
      });
    });
  });

  return result;
});

const hasLineup = computed(() => !!props.lineup?.startXI?.length);
</script>

<template>
  <div v-if="!hasLineup" class="lineup-field-empty">
    <p class="text-sm text-muted">Escalação ainda não publicada.</p>
  </div>

  <div v-else class="lineup-field" :class="`lineup-field--${side}`">
    <div class="lineup-field__head">
      <span class="lineup-field__team">{{ teamName }}</span>
      <span class="lineup-field__formation">
        {{ lineup.formation ? `Formação ${lineup.formation}` : '' }}
      </span>
    </div>
    <svg
      :viewBox="`0 0 ${FIELD_W} ${FIELD_H}`"
      class="lineup-field__svg"
      role="img"
      :aria-label="`Campo com escalação ${teamName}`"
    >
      <!-- Background -->
      <rect :x="0" :y="0" :width="FIELD_W" :height="FIELD_H" class="lineup-field__pitch" />
      <rect :x="4" :y="4" :width="FIELD_W - 8" :height="FIELD_H - 8" class="lineup-field__bounds" />
      <line :x1="4" :y1="FIELD_H / 2" :x2="FIELD_W - 4" :y2="FIELD_H / 2" class="lineup-field__midline" />
      <circle :cx="FIELD_W / 2" :cy="FIELD_H / 2" :r="22" class="lineup-field__center" />
      <rect :x="(FIELD_W - 80) / 2" :y="4" :width="80" :height="28" class="lineup-field__box" />
      <rect :x="(FIELD_W - 80) / 2" :y="FIELD_H - 32" :width="80" :height="28" class="lineup-field__box" />

      <!-- Players -->
      <g
        v-for="(slot, idx) in slots"
        :key="idx"
        class="lineup-field__player"
        :class="`lineup-field__player--${side}`"
        :data-player-card="slot.player.name || ''"
        :transform="`translate(${slot.x},${slot.y})`"
        tabindex="0"
        role="button"
        :aria-label="`${slot.player.name || ''} (${slot.player.pos || ''}) número ${slot.num}`"
      >
        <title>{{ slot.player.name || '' }} · {{ slot.player.pos || '' }} · #{{ slot.num }}</title>
        <circle :r="13" class="lineup-field__circle" />
        <text :y="4" text-anchor="middle" class="lineup-field__num">{{ slot.num }}</text>
        <text :y="26" text-anchor="middle" class="lineup-field__name">{{ slot.lastName }}</text>
      </g>
    </svg>
    <div v-if="lineup.coach" class="lineup-field__coach">Técnico: {{ lineup.coach }}</div>
  </div>
</template>
