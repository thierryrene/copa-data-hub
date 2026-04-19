// Radar/spider chart SVG para perfil de atributos de jogador.
// Retorna HTML string, sem dependências externas.

const LABELS = ['Finalização', 'Criatividade', 'Passe', 'Defesa', 'Físico'];

const POS_DEFAULTS = {
  Goalkeeper: [5,  30, 62, 88, 78],
  Defender:   [18, 32, 67, 84, 79],
  Midfielder: [42, 68, 80, 57, 72],
  Attacker:   [83, 70, 64, 26, 75],
};

function posKey(position) {
  if (!position) return 'Midfielder';
  const p = position.toLowerCase();
  if (p.includes('keeper') || p.includes('goalkeeper')) return 'Goalkeeper';
  if (p.includes('defender') || p === 'defender') return 'Defender';
  if (p.includes('midfielder') || p === 'midfielder') return 'Midfielder';
  return 'Attacker';
}

function computeValues(player) {
  const s = player?.stats;
  const key = posKey(player?.position);
  const defs = POS_DEFAULTS[key];
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
  const fis = player.rating != null
    ? Math.min(100, Math.round((player.rating - 5) / 5 * 75 + 45))
    : defs[4];

  return [fin, cri, pas, def, fis];
}

function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return {
    x: +(cx + r * Math.cos(rad)).toFixed(2),
    y: +(cy + r * Math.sin(rad)).toFixed(2),
  };
}

export function renderSpiderChart(player) {
  const values = computeValues(player);
  const cx = 110, cy = 108, maxR = 76, n = 5, step = 360 / n;

  const gridPolygons = [20, 40, 60, 80, 100].map(level => {
    const r = (level / 100) * maxR;
    const pts = LABELS.map((_, i) => { const p = polar(cx, cy, r, i * step); return `${p.x},${p.y}`; }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="rgba(148,163,184,0.09)" stroke-width="0.8"/>`;
  }).join('');

  const axisLines = LABELS.map((_, i) => {
    const p = polar(cx, cy, maxR, i * step);
    return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="rgba(148,163,184,0.13)" stroke-width="1"/>`;
  }).join('');

  const dataPoints = values.map((val, i) => {
    const r = (Math.max(4, Math.min(100, val)) / 100) * maxR;
    const p = polar(cx, cy, r, i * step);
    return `${p.x},${p.y}`;
  }).join(' ');

  const elements = LABELS.map((label, i) => {
    const lp = polar(cx, cy, maxR + 20, i * step);
    const anchor = lp.x < cx - 5 ? 'end' : lp.x > cx + 5 ? 'start' : 'middle';
    const dp = polar(cx, cy, (Math.max(4, Math.min(100, values[i])) / 100) * maxR, i * step);
    return `
      <text x="${lp.x}" y="${lp.y}" dy="4" text-anchor="${anchor}" class="spider-chart__axis-label">${label}</text>
      <circle cx="${dp.x}" cy="${dp.y}" r="3.5" class="spider-chart__dot"/>
    `;
  }).join('');

  return `
    <div class="spider-chart">
      <div class="spider-chart__title">Perfil de Atributos</div>
      <svg viewBox="0 0 220 218" class="spider-chart__svg" role="img" aria-label="Radar de atributos do jogador">
        ${gridPolygons}
        ${axisLines}
        <polygon points="${dataPoints}" class="spider-chart__area"/>
        ${elements}
      </svg>
      <div class="spider-chart__legend">
        ${LABELS.map((lbl, i) => `<div class="spider-chart__legend-item"><b>${values[i]}</b><span>${lbl}</span></div>`).join('')}
      </div>
    </div>
  `;
}
