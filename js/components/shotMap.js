// Shot Map SVG — meio-campo com chutes representados como círculos.
// Tamanho do círculo = qualidade (xG proxy); cor = resultado.
// Retorna HTML string sem dependências.

import { escapeHTML } from '../util/html.js';

// xG aproximado baseado na distância/zona de chute
function estimateXg(x, y, isGoal) {
  // Campo 120×80; x = distância lateral, y = distância do gol
  const dist = Math.sqrt((x - 60) ** 2 + y ** 2);
  if (isGoal) return Math.max(0.15, 0.85 - dist * 0.008);
  return Math.max(0.03, 0.45 - dist * 0.005);
}

// Gera posições de chute plausíveis baseadas em zona do campo
function generateShotPositions(count, isHome) {
  const positions = [];
  const zones = [
    { x: 60, y: 8, weight: 3 },   // centro, perto do gol
    { x: 45, y: 10, weight: 2 },  // esquerda, próximo
    { x: 75, y: 10, weight: 2 },  // direita, próximo
    { x: 60, y: 20, weight: 2 },  // centro, médio
    { x: 40, y: 18, weight: 1 },  // esquerda, médio
    { x: 80, y: 18, weight: 1 },  // direita, médio
    { x: 60, y: 30, weight: 1 },  // longo
  ];
  const totalWeight = zones.reduce((a, z) => a + z.weight, 0);

  // Seed baseado em count para reprodutibilidade
  let seed = count * 37 + (isHome ? 7 : 13);
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };

  for (let i = 0; i < count; i++) {
    let r = rng() * totalWeight;
    let zone = zones[0];
    for (const z of zones) { if (r < z.weight) { zone = z; break; } r -= z.weight; }
    positions.push({
      x: zone.x + (rng() - 0.5) * 16,
      y: Math.max(2, zone.y + (rng() - 0.5) * 10),
      isGoal: false,
    });
  }
  return positions;
}

function goalEventsToShots(events, teamName) {
  return (events || [])
    .filter(ev => ev.type === 'Goal' && ev.teamName === teamName)
    .map(() => ({
      x: 60 + (Math.random() - 0.5) * 20,
      y: 6 + Math.random() * 10,
      isGoal: true,
    }));
}

function shotCircle(shot, side) {
  // Campo display: 120×80 → SVG 120×64 (meia-campo vertical)
  const svgX = Math.max(4, Math.min(116, shot.x));
  const svgY = Math.max(3, Math.min(55, shot.y));
  const xg = estimateXg(shot.x, shot.y, shot.isGoal);
  const r = Math.max(3, Math.min(7, xg * 14));

  if (shot.isGoal) {
    return `<circle cx="${svgX.toFixed(1)}" cy="${svgY.toFixed(1)}" r="${r.toFixed(1)}" fill="var(--color-emerald)" stroke="rgba(10,14,26,0.5)" stroke-width="1" opacity="0.9"/>`;
  }
  return `<circle cx="${svgX.toFixed(1)}" cy="${svgY.toFixed(1)}" r="${r.toFixed(1)}" fill="${side === 'home' ? 'rgba(59,130,246,0.55)' : 'rgba(245,158,11,0.55)'}" stroke="${side === 'home' ? 'rgba(59,130,246,0.8)' : 'rgba(245,158,11,0.8)'}" stroke-width="1"/>`;
}

function fieldHalf() {
  return `
    <!-- pitch outline -->
    <rect x="4" y="4" width="112" height="56" rx="3" fill="rgba(10,20,10,0.4)" stroke="rgba(148,163,184,0.2)" stroke-width="1"/>
    <!-- penalty area -->
    <rect x="34" y="4" width="52" height="18" fill="none" stroke="rgba(148,163,184,0.15)" stroke-width="0.8"/>
    <!-- goal box -->
    <rect x="46" y="4" width="28" height="8" fill="none" stroke="rgba(148,163,184,0.12)" stroke-width="0.8"/>
    <!-- goal line -->
    <rect x="48" y="1" width="24" height="4" rx="1" fill="rgba(148,163,184,0.2)" stroke="rgba(148,163,184,0.3)" stroke-width="0.6"/>
    <!-- center arc -->
    <path d="M 4 60 A 30 30 0 0 1 116 60" fill="none" stroke="rgba(148,163,184,0.12)" stroke-width="0.8"/>
    <!-- penalty spot -->
    <circle cx="60" cy="16" r="1" fill="rgba(148,163,184,0.3)"/>
  `;
}

export function renderShotMap(events, home, away, matchStats) {
  const homeGoals = goalEventsToShots(events, home?.name);
  const awayGoals = goalEventsToShots(events, away?.name);

  const homeCount = matchStats?.[home?.id]?.['Shots on Goal'] ?? Math.max(homeGoals.length + 2, 3);
  const awayCount = matchStats?.[away?.id]?.['Shots on Goal'] ?? Math.max(awayGoals.length + 2, 3);

  const homeMissed = generateShotPositions(Math.max(0, homeCount - homeGoals.length), true);
  const awayMissed = generateShotPositions(Math.max(0, awayCount - awayGoals.length), false);

  const homeShots = [...homeGoals, ...homeMissed].map(s => shotCircle(s, 'home')).join('');
  const awayShots = [...awayGoals, ...awayMissed].map(s => shotCircle(s, 'away')).join('');

  const totalXgHome = [...homeGoals, ...homeMissed].reduce((acc, s) => acc + estimateXg(s.x, s.y, s.isGoal), 0);
  const totalXgAway = [...awayGoals, ...awayMissed].reduce((acc, s) => acc + estimateXg(s.x, s.y, s.isGoal), 0);

  return `
    <div class="shot-map">
      <div class="shot-map__header">
        <div class="shot-map__side">
          <span class="shot-map__flag">${escapeHTML(home?.flag || '')}</span>
          <span class="shot-map__name">${escapeHTML(home?.code || '')}</span>
          <span class="shot-map__xg">${totalXgHome.toFixed(2)} xG</span>
        </div>
        <div class="shot-map__title">Mapa de Chutes</div>
        <div class="shot-map__side shot-map__side--away">
          <span class="shot-map__xg">${totalXgAway.toFixed(2)} xG</span>
          <span class="shot-map__name">${escapeHTML(away?.code || '')}</span>
          <span class="shot-map__flag">${escapeHTML(away?.flag || '')}</span>
        </div>
      </div>
      <div class="shot-map__fields">
        <div class="shot-map__field-wrap">
          <svg viewBox="0 0 120 64" class="shot-map__svg" role="img" aria-label="Mapa de chutes ${home?.name}">
            ${fieldHalf()}
            ${homeShots}
          </svg>
        </div>
        <div class="shot-map__field-wrap">
          <svg viewBox="0 0 120 64" class="shot-map__svg" role="img" aria-label="Mapa de chutes ${away?.name}">
            ${fieldHalf()}
            ${awayShots}
          </svg>
        </div>
      </div>
      <div class="shot-map__legend">
        <span><svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="var(--color-emerald)"/></svg> Gol</span>
        <span><svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="rgba(59,130,246,0.6)" stroke="rgba(59,130,246,0.9)" stroke-width="1"/></svg> No gol</span>
        <span><svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="rgba(148,163,184,0.25)" stroke="rgba(148,163,184,0.4)" stroke-width="1"/></svg> Fora</span>
        <span class="shot-map__legend-note">Tamanho ∝ xG</span>
      </div>
    </div>
  `;
}
