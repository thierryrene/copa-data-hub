<script setup>
import { computed } from 'vue';

const props = defineProps({
  player: { type: Object, default: null }
});

const ZONE_MAPS = {
  Goalkeeper: [
    [0.05, 0.95, 0.05],
    [0.05, 0.25, 0.05],
    [0.02, 0.05, 0.02]
  ],
  Defender: [
    [0.25, 0.80, 0.25],
    [0.15, 0.45, 0.15],
    [0.05, 0.10, 0.05]
  ],
  Midfielder: [
    [0.10, 0.30, 0.10],
    [0.35, 0.90, 0.35],
    [0.15, 0.50, 0.15]
  ],
  Attacker: [
    [0.04, 0.08, 0.04],
    [0.15, 0.40, 0.15],
    [0.55, 0.95, 0.55]
  ]
};

function posKey(position) {
  if (!position) return 'Midfielder';
  const p = position.toLowerCase();
  if (p.includes('keeper') || p.includes('goalkeeper')) return 'Goalkeeper';
  if (p.includes('defender')) return 'Defender';
  if (p.includes('midfielder')) return 'Midfielder';
  return 'Attacker';
}

function intensityColor(v) {
  const alpha = (v * 0.85).toFixed(2);
  const r = Math.round(245 * v + 30 * (1 - v));
  const g = Math.round(158 * v + 41 * (1 - v));
  const b = Math.round(11 * v + 59 * (1 - v));
  return `rgba(${r},${g},${b},${alpha})`;
}

const zoneW = 34, zoneH = 50, gap = 2;
const pitchW = 3 * zoneW + 2 * gap + 16;
const pitchH = 3 * zoneH + 2 * gap + 20;

const rects = computed(() => {
  const zones = ZONE_MAPS[posKey(props.player?.position)];
  const out = [];
  zones.forEach((row, ri) => {
    row.forEach((intensity, ci) => {
      out.push({
        x: 8 + ci * (zoneW + gap),
        y: 10 + (2 - ri) * (zoneH + gap),
        w: zoneW,
        h: zoneH,
        fill: intensityColor(intensity)
      });
    });
  });
  return out;
});
</script>

<template>
  <div class="player-heatmap">
    <div class="player-heatmap__title">Mapa de Atuação</div>
    <svg
      :viewBox="`0 0 ${pitchW} ${pitchH}`"
      class="player-heatmap__svg"
      role="img"
      aria-label="Heatmap de posicionamento no campo"
    >
      <rect :width="pitchW" :height="pitchH" fill="rgba(10,14,26,0.6)" rx="8" />
      <rect
        :x="8"
        :y="10"
        :width="pitchW - 16"
        :height="pitchH - 20"
        rx="4"
        fill="none"
        stroke="rgba(148,163,184,0.18)"
        stroke-width="1.2"
      />
      <line
        :x1="8"
        :y1="pitchH / 2"
        :x2="pitchW - 8"
        :y2="pitchH / 2"
        stroke="rgba(148,163,184,0.15)"
        stroke-width="1"
      />
      <circle
        :cx="pitchW / 2"
        :cy="pitchH / 2"
        r="14"
        fill="none"
        stroke="rgba(148,163,184,0.15)"
        stroke-width="1"
      />
      <rect x="38" y="2" width="44" height="12" rx="3" fill="none" stroke="rgba(148,163,184,0.25)" stroke-width="1" />
      <rect :x="38" :y="pitchH - 14" width="44" height="12" rx="3" fill="none" stroke="rgba(148,163,184,0.25)" stroke-width="1" />
      <rect
        v-for="(r, i) in rects"
        :key="i"
        :x="r.x"
        :y="r.y"
        :width="r.w"
        :height="r.h"
        rx="4"
        :fill="r.fill"
      />
      <text :x="pitchW / 2" y="7" text-anchor="middle" fill="rgba(148,163,184,0.4)" font-size="5.5" font-family="Inter,sans-serif">ATAQUE</text>
      <text :x="pitchW / 2" :y="pitchH - 2" text-anchor="middle" fill="rgba(148,163,184,0.4)" font-size="5.5" font-family="Inter,sans-serif">DEFESA</text>
    </svg>
    <div class="player-heatmap__scale">
      <span>Baixa presença</span>
      <div class="player-heatmap__scale-bar"></div>
      <span>Alta presença</span>
    </div>
  </div>
</template>
