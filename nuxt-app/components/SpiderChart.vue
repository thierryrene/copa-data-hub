<script setup>
import { computed } from 'vue';

const props = defineProps({
  player: { type: Object, default: null }
});

const LABELS = ['Finalização', 'Criatividade', 'Passe', 'Defesa', 'Físico'];

const POS_DEFAULTS = {
  Goalkeeper: [5, 30, 62, 88, 78],
  Defender:   [18, 32, 67, 84, 79],
  Midfielder: [42, 68, 80, 57, 72],
  Attacker:   [83, 70, 64, 26, 75]
};

function posKey(position) {
  if (!position) return 'Midfielder';
  const p = position.toLowerCase();
  if (p.includes('keeper') || p.includes('goalkeeper')) return 'Goalkeeper';
  if (p.includes('defender')) return 'Defender';
  if (p.includes('midfielder')) return 'Midfielder';
  return 'Attacker';
}

function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return {
    x: +(cx + r * Math.cos(rad)).toFixed(2),
    y: +(cy + r * Math.sin(rad)).toFixed(2)
  };
}

const cx = 110, cy = 108, maxR = 76, n = 5, step = 360 / n;

const values = computed(() => {
  const s = props.player?.stats;
  const defs = POS_DEFAULTS[posKey(props.player?.position)];
  if (!s) return [...defs];

  const apps = Math.max(s.appearances || 1, 1);
  const fin = s.goals != null
    ? Math.min(100, Math.round(s.goals / apps * 55 + defs[0] * 0.3 + 5))
    : defs[0];
  const cri = s.assists != null
    ? Math.min(100, Math.round(s.assists / apps * 65 + defs[1] * 0.4))
    : defs[1];
  const pas = s.passAccuracy != null
    ? Math.round(s.passAccuracy)
    : defs[2];
  const def = s.tackles != null
    ? Math.min(100, Math.round(s.tackles / apps * 9 + defs[3] * 0.45))
    : defs[3];
  const fis = props.player?.rating != null
    ? Math.min(100, Math.round((props.player.rating - 5) / 5 * 75 + 45))
    : defs[4];
  return [fin, cri, pas, def, fis];
});

const gridPolygons = computed(() =>
  [20, 40, 60, 80, 100].map(level => {
    const r = (level / 100) * maxR;
    return LABELS.map((_, i) => {
      const p = polar(cx, cy, r, i * step);
      return `${p.x},${p.y}`;
    }).join(' ');
  })
);

const axisLines = computed(() =>
  LABELS.map((_, i) => polar(cx, cy, maxR, i * step))
);

const dataPoints = computed(() =>
  values.value.map((val, i) => {
    const r = (Math.max(4, Math.min(100, val)) / 100) * maxR;
    const p = polar(cx, cy, r, i * step);
    return `${p.x},${p.y}`;
  }).join(' ')
);

const labelMeta = computed(() =>
  LABELS.map((label, i) => {
    const lp = polar(cx, cy, maxR + 20, i * step);
    const anchor = lp.x < cx - 5 ? 'end' : lp.x > cx + 5 ? 'start' : 'middle';
    const dp = polar(cx, cy, (Math.max(4, Math.min(100, values.value[i])) / 100) * maxR, i * step);
    return { label, lp, anchor, dp };
  })
);
</script>

<template>
  <div class="spider-chart">
    <div class="spider-chart__title">Perfil de Atributos</div>
    <svg viewBox="0 0 220 218" class="spider-chart__svg" role="img" aria-label="Radar de atributos do jogador">
      <polygon
        v-for="(pts, i) in gridPolygons"
        :key="`g${i}`"
        :points="pts"
        fill="none"
        stroke="rgba(148,163,184,0.09)"
        stroke-width="0.8"
      />
      <line
        v-for="(p, i) in axisLines"
        :key="`a${i}`"
        :x1="cx"
        :y1="cy"
        :x2="p.x"
        :y2="p.y"
        stroke="rgba(148,163,184,0.13)"
        stroke-width="1"
      />
      <polygon :points="dataPoints" class="spider-chart__area" />
      <template v-for="(m, i) in labelMeta" :key="`l${i}`">
        <text :x="m.lp.x" :y="m.lp.y" dy="4" :text-anchor="m.anchor" class="spider-chart__axis-label">
          {{ m.label }}
        </text>
        <circle :cx="m.dp.x" :cy="m.dp.y" r="3.5" class="spider-chart__dot" />
      </template>
    </svg>
    <div class="spider-chart__legend">
      <div v-for="(lbl, i) in LABELS" :key="lbl" class="spider-chart__legend-item">
        <b>{{ values[i] }}</b><span>{{ lbl }}</span>
      </div>
    </div>
  </div>
</template>
