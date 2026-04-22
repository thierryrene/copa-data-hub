<script setup>
// Expected Goals Timeline — curva cumulativa de xG por equipe.
// Ex-js/components/xgTimeline.js
import { computed } from 'vue';

const props = defineProps({
  events: { type: Array, default: () => [] },
  home: { type: Object, default: null },
  away: { type: Object, default: null }
});

const W = 300;
const H = 80;
const padL = 20;
const padB = 14;

function estimateXg(isGoal) {
  return isGoal ? 0.78 : 0.14;
}

function buildXgCurve(events, teamName, maxMinutes = 90) {
  const curve = [{ x: 0, y: 0 }];
  let cum = 0;
  (events || [])
    .filter((ev) => ev.teamName === teamName && ev.type === 'Goal' && ev.minute)
    .sort((a, b) => a.minute - b.minute)
    .forEach((ev) => {
      cum += estimateXg(true);
      curve.push({ x: Math.min(maxMinutes, ev.minute), y: +cum.toFixed(2) });
    });
  if (curve[curve.length - 1].x < maxMinutes) {
    curve.push({ x: maxMinutes, y: cum });
  }
  return curve;
}

function curvePath(points, scaleX, scaleY, baseY) {
  if (!points.length) return '';
  const mapped = points.map((p) => ({ x: p.x * scaleX, y: baseY - p.y * scaleY }));
  let d = `M ${mapped[0].x} ${mapped[0].y}`;
  for (let i = 1; i < mapped.length; i++) {
    d += ` L ${mapped[i].x} ${mapped[i].y}`;
  }
  return d;
}

function areaPath(points, scaleX, scaleY, baseY) {
  const line = curvePath(points, scaleX, scaleY, baseY);
  if (!line) return '';
  const lastX = points[points.length - 1].x * scaleX;
  return `${line} L ${lastX} ${baseY} L 0 ${baseY} Z`;
}

const chart = computed(() => {
  const graphW = W - padL;
  const graphH = H - padB;
  const homeCurve = buildXgCurve(props.events, props.home?.name);
  const awayCurve = buildXgCurve(props.events, props.away?.name);

  const maxXg =
    Math.max(...homeCurve.map((p) => p.y), ...awayCurve.map((p) => p.y), 0.5) * 1.15;

  const scaleX = graphW / 90;
  const scaleY = graphH / maxXg;
  const baseY = graphH;

  const yTicks = [0.5, 1.0, 1.5, 2.0, 2.5]
    .filter((v) => v <= maxXg * 1.05)
    .map((v) => ({ v, y: baseY - v * scaleY, label: v.toFixed(1) }));

  const xTicks = [0, 15, 30, 45, 60, 75, 90].map((t) => ({
    x: t * scaleX,
    label: `${t}'`
  }));

  const goalDots = [...homeCurve, ...awayCurve]
    .filter((p) => p.x > 0 && p !== homeCurve[0] && p !== awayCurve[0])
    .slice(0, 20)
    .map((p) => ({
      cx: p.x * scaleX,
      cy: baseY - p.y * scaleY,
      isHome: homeCurve.includes(p)
    }));

  return {
    graphW,
    graphH,
    baseY,
    homeAreaD: areaPath(homeCurve, scaleX, scaleY, baseY),
    awayAreaD: areaPath(awayCurve, scaleX, scaleY, baseY),
    homeLineD: curvePath(homeCurve, scaleX, scaleY, baseY),
    awayLineD: curvePath(awayCurve, scaleX, scaleY, baseY),
    yTicks,
    xTicks,
    goalDots,
    homeXg: homeCurve[homeCurve.length - 1]?.y ?? 0,
    awayXg: awayCurve[awayCurve.length - 1]?.y ?? 0
  };
});
</script>

<template>
  <div class="xg-timeline">
    <div class="xg-timeline__header">
      <div class="xg-timeline__kpi xg-timeline__kpi--home">
        <span>{{ home?.flag || '' }} {{ home?.code || '' }}</span>
        <b>{{ chart.homeXg.toFixed(2) }} xG</b>
      </div>
      <span class="xg-timeline__title">Expected Goals</span>
      <div class="xg-timeline__kpi xg-timeline__kpi--away">
        <b>{{ chart.awayXg.toFixed(2) }} xG</b>
        <span>{{ away?.code || '' }} {{ away?.flag || '' }}</span>
      </div>
    </div>

    <svg :viewBox="`0 0 ${300} ${80}`" class="xg-timeline__svg" preserveAspectRatio="none">
      <g :transform="`translate(${padL},0)`">
        <template v-for="(t, idx) in chart.yTicks" :key="`yt-${idx}`">
          <line
            :x1="0"
            :y1="t.y.toFixed(1)"
            :x2="chart.graphW"
            :y2="t.y.toFixed(1)"
            stroke="rgba(148,163,184,0.08)"
            stroke-width="0.8"
          />
          <text
            x="-3"
            :y="(t.y + 3).toFixed(1)"
            text-anchor="end"
            fill="rgba(148,163,184,0.45)"
            font-size="5.5"
            font-family="Inter,sans-serif"
          >{{ t.label }}</text>
        </template>

        <line :x1="0" :y1="chart.baseY" :x2="chart.graphW" :y2="chart.baseY"
              stroke="rgba(148,163,184,0.15)" stroke-width="0.8" />

        <path :d="chart.homeAreaD" fill="rgba(59,130,246,0.18)" stroke="none" />
        <path :d="chart.awayAreaD" fill="rgba(245,158,11,0.15)" stroke="none" />
        <path :d="chart.homeLineD" fill="none" stroke="var(--color-blue)" stroke-width="1.8" stroke-linejoin="round" />
        <path :d="chart.awayLineD" fill="none" stroke="var(--color-gold)" stroke-width="1.8" stroke-linejoin="round" />

        <circle
          v-for="(d, idx) in chart.goalDots"
          :key="`gd-${idx}`"
          :cx="d.cx.toFixed(1)"
          :cy="d.cy.toFixed(1)"
          r="2.5"
          :fill="d.isHome ? 'var(--color-blue)' : 'var(--color-gold)'"
          stroke="var(--color-bg-primary)"
          stroke-width="1"
        />

        <text
          v-for="(t, idx) in chart.xTicks"
          :key="`xt-${idx}`"
          :x="t.x.toFixed(1)"
          :y="(chart.graphH + padB - 2).toFixed(1)"
          text-anchor="middle"
          fill="rgba(148,163,184,0.4)"
          font-size="5.5"
          font-family="Inter,sans-serif"
        >{{ t.label }}</text>
      </g>
    </svg>

    <div class="xg-timeline__legend">
      <span>
        <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="var(--color-blue)" stroke-width="2" /></svg>
        {{ home?.name || 'Casa' }}
      </span>
      <span>
        <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="var(--color-gold)" stroke-width="2" /></svg>
        {{ away?.name || 'Visitante' }}
      </span>
    </div>
  </div>
</template>
