<script setup>
// Attack Momentum Chart — SVG de pressão temporal da partida.
// Ex-js/components/attackMomentum.js
import { computed } from 'vue';

const props = defineProps({
  events: { type: Array, default: () => [] },
  home: { type: Object, default: null },
  away: { type: Object, default: null }
});

const SEGMENTS = 18;
const W = 300;
const H = 90;

function buildMomentum(events, homeName, segments = SEGMENTS) {
  const raw = new Array(segments).fill(0);
  (events || []).forEach((ev) => {
    if (!ev?.minute) return;
    const seg = Math.min(segments - 1, Math.floor(ev.minute / 5));
    const isHome = ev.teamName === homeName;
    if (ev.type === 'Goal') {
      const spike = isHome ? 0.7 : -0.7;
      for (let i = 0; i < 5 && seg + i < segments; i++) {
        raw[seg + i] += spike * Math.exp(-i * 0.7);
      }
    } else if (ev.type === 'Card' && ev.detail === 'Red Card') {
      const delta = isHome ? -0.3 : 0.3;
      for (let i = 0; i < 4 && seg + i < segments; i++) {
        raw[seg + i] += delta * Math.exp(-i * 0.5);
      }
    }
  });
  return raw.map((v, i) => {
    const wave = Math.sin(i * 0.6 + 1.2) * 0.18;
    return Math.max(-1, Math.min(1, v + wave));
  });
}

function buildLinePath(momentum, segW, cy, maxH) {
  const pts = momentum.map((v, i) => ({ x: i * segW + segW / 2, y: cy - v * maxH }));
  if (!pts.length) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1].x + segW * 0.35;
    const cp2x = pts[i].x - segW * 0.35;
    d += ` C ${cp1x} ${pts[i - 1].y} ${cp2x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

function buildAreaPath(points, cy, W_) {
  if (!points.length) return '';
  let d = `M 0 ${cy}`;
  points.forEach((p) => {
    d += ` L ${p.x} ${p.y}`;
  });
  d += ` L ${W_} ${cy} Z`;
  return d;
}

const chart = computed(() => {
  const cy = H / 2;
  const segW = W / SEGMENTS;
  const maxH = cy * 0.82;
  const momentum = buildMomentum(props.events, props.home?.name, SEGMENTS);
  const linePath = buildLinePath(momentum, segW, cy, maxH);

  const homeArea = momentum.map((v, i) => ({
    x: i * segW + segW / 2,
    y: cy - Math.max(0, v) * maxH
  }));
  const awayArea = momentum.map((v, i) => ({
    x: i * segW + segW / 2,
    y: cy - Math.min(0, v) * maxH
  }));

  const goalDots = (props.events || [])
    .filter((ev) => ev.type === 'Goal' && ev.minute)
    .map((ev) => {
      const isHome = ev.teamName === props.home?.name;
      const seg = Math.min(SEGMENTS - 1, Math.floor(ev.minute / 5));
      const x = seg * segW + segW / 2;
      const v = momentum[seg];
      const y = cy - v * maxH;
      return { x, y, isHome };
    });

  const timeTicks = [0, 15, 30, 45, 60, 75, 90].map((t) => ({ x: (t / 90) * W, label: `${t}'` }));

  return {
    cy,
    linePath,
    homeAreaPath: buildAreaPath(homeArea, cy, W),
    awayAreaPath: buildAreaPath(awayArea, cy, W),
    goalDots,
    timeTicks
  };
});
</script>

<template>
  <div class="momentum-chart">
    <div class="momentum-chart__header">
      <span class="momentum-chart__team momentum-chart__team--home">
        {{ home?.flag || '' }} {{ home?.code || '' }}
      </span>
      <span class="momentum-chart__title">Pressão da Partida</span>
      <span class="momentum-chart__team momentum-chart__team--away">
        {{ away?.code || '' }} {{ away?.flag || '' }}
      </span>
    </div>
    <svg :viewBox="`0 0 ${300} ${90}`" class="momentum-chart__svg" preserveAspectRatio="none">
      <line :x1="0" :y1="chart.cy" :x2="300" :y2="chart.cy"
            stroke="rgba(148,163,184,0.15)" stroke-width="1" stroke-dasharray="3,3" />
      <path :d="chart.homeAreaPath" fill="rgba(59,130,246,0.25)" stroke="none" />
      <path :d="chart.awayAreaPath" fill="rgba(245,158,11,0.22)" stroke="none" />
      <path :d="chart.linePath" fill="none" stroke="rgba(255,255,255,0.35)"
            stroke-width="1.5" stroke-linejoin="round" />
      <circle
        v-for="(d, idx) in chart.goalDots"
        :key="`gd-${idx}`"
        :cx="d.x"
        :cy="d.y"
        r="4"
        :fill="d.isHome ? 'var(--color-blue)' : 'var(--color-gold)'"
        stroke="var(--color-bg-primary)"
        stroke-width="1.5"
      />
      <text
        v-for="(t, idx) in chart.timeTicks"
        :key="`tt-${idx}`"
        :x="t.x"
        :y="88"
        text-anchor="middle"
        fill="rgba(148,163,184,0.4)"
        font-size="6"
        font-family="Inter,sans-serif"
      >{{ t.label }}</text>
    </svg>
    <div class="momentum-chart__legend">
      <span class="momentum-chart__legend-dot momentum-chart__legend-dot--home"></span>
      <span>{{ home?.name || 'Casa' }} domina acima</span>
      <span class="momentum-chart__legend-dot momentum-chart__legend-dot--away"></span>
      <span>{{ away?.name || 'Visitante' }} domina abaixo</span>
    </div>
  </div>
</template>
