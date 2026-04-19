// xG Timeline — gráfico de linha mostrando evolução do expected goals por equipe.
// Baseado nos eventos da partida. Retorna HTML string.

import { escapeHTML } from '../util/html.js';

function estimateXg(isGoal, minute) {
  // Proxy simples: cada gol = 0.8, cada evento de "chance" = 0.15
  return isGoal ? 0.78 : 0.14;
}

/**
 * Constrói array cumulativo de xG por minuto (0-90) para um time.
 */
function buildXgCurve(events, teamName, maxMinutes = 90) {
  const curve = [{ x: 0, y: 0 }];
  let cumXg = 0;

  const relevant = (events || [])
    .filter(ev => ev.teamName === teamName && ev.type === 'Goal' && ev.minute)
    .sort((a, b) => a.minute - b.minute);

  relevant.forEach(ev => {
    const xg = estimateXg(true, ev.minute);
    cumXg += xg;
    curve.push({ x: Math.min(maxMinutes, ev.minute), y: +cumXg.toFixed(2) });
  });

  if (curve[curve.length - 1].x < maxMinutes) {
    curve.push({ x: maxMinutes, y: cumXg });
  }

  return curve;
}

function curvePath(points, scaleX, scaleY, baseY) {
  if (!points.length) return '';
  const mapped = points.map(p => ({ x: p.x * scaleX, y: baseY - p.y * scaleY }));
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

export function renderXgTimeline(events, home, away) {
  const W = 300, H = 80, padL = 20, padB = 14;
  const graphW = W - padL, graphH = H - padB;

  const homeCurve = buildXgCurve(events, home?.name);
  const awayCurve = buildXgCurve(events, away?.name);

  const maxXg = Math.max(
    ...homeCurve.map(p => p.y),
    ...awayCurve.map(p => p.y),
    0.5
  ) * 1.15;

  const scaleX = graphW / 90;
  const scaleY = graphH / maxXg;
  const baseY = graphH;

  // Escala Y: labels
  const yTicks = [0.5, 1.0, 1.5, 2.0, 2.5].filter(v => v <= maxXg * 1.05);
  const yTickEls = yTicks.map(v => {
    const y = baseY - v * scaleY;
    return `
      <line x1="0" y1="${y.toFixed(1)}" x2="${graphW}" y2="${y.toFixed(1)}" stroke="rgba(148,163,184,0.08)" stroke-width="0.8"/>
      <text x="-3" y="${(y + 3).toFixed(1)}" text-anchor="end" fill="rgba(148,163,184,0.45)" font-size="5.5" font-family="Inter,sans-serif">${v.toFixed(1)}</text>
    `;
  }).join('');

  const xTicks = [0, 15, 30, 45, 60, 75, 90].map(t => {
    const x = t * scaleX;
    return `<text x="${x.toFixed(1)}" y="${(graphH + padB - 2).toFixed(1)}" text-anchor="middle" fill="rgba(148,163,184,0.4)" font-size="5.5" font-family="Inter,sans-serif">${t}'</text>`;
  }).join('');

  const homeAreaEl = `<path d="${areaPath(homeCurve, scaleX, scaleY, baseY)}" fill="rgba(59,130,246,0.18)" stroke="none"/>`;
  const awayAreaEl = `<path d="${areaPath(awayCurve, scaleX, scaleY, baseY)}" fill="rgba(245,158,11,0.15)" stroke="none"/>`;
  const homeLineEl = `<path d="${curvePath(homeCurve, scaleX, scaleY, baseY)}" fill="none" stroke="var(--color-blue)" stroke-width="1.8" stroke-linejoin="round"/>`;
  const awayLineEl = `<path d="${curvePath(awayCurve, scaleX, scaleY, baseY)}" fill="none" stroke="var(--color-gold)" stroke-width="1.8" stroke-linejoin="round"/>`;

  // Dots de gol
  const goalDots = [...homeCurve, ...awayCurve]
    .filter(p => p.x > 0 && p !== homeCurve[0] && p !== awayCurve[0])
    .slice(0, 20)
    .map(p => {
      const isHome = homeCurve.includes(p);
      const x = p.x * scaleX;
      const y = baseY - p.y * scaleY;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="${isHome ? 'var(--color-blue)' : 'var(--color-gold)'}" stroke="var(--color-bg-primary)" stroke-width="1"/>`;
    }).join('');

  const homeXg = homeCurve[homeCurve.length - 1]?.y ?? 0;
  const awayXg = awayCurve[awayCurve.length - 1]?.y ?? 0;

  return `
    <div class="xg-timeline">
      <div class="xg-timeline__header">
        <div class="xg-timeline__kpi xg-timeline__kpi--home">
          <span>${escapeHTML(home?.flag || '')} ${escapeHTML(home?.code || '')}</span>
          <b>${homeXg.toFixed(2)} xG</b>
        </div>
        <span class="xg-timeline__title">Expected Goals</span>
        <div class="xg-timeline__kpi xg-timeline__kpi--away">
          <b>${awayXg.toFixed(2)} xG</b>
          <span>${escapeHTML(away?.code || '')} ${escapeHTML(away?.flag || '')}</span>
        </div>
      </div>
      <svg viewBox="0 0 ${W} ${H}" class="xg-timeline__svg" preserveAspectRatio="none">
        <g transform="translate(${padL},0)">
          ${yTickEls}
          <!-- baseline -->
          <line x1="0" y1="${baseY}" x2="${graphW}" y2="${baseY}" stroke="rgba(148,163,184,0.15)" stroke-width="0.8"/>
          ${homeAreaEl}
          ${awayAreaEl}
          ${homeLineEl}
          ${awayLineEl}
          ${goalDots}
          ${xTicks}
        </g>
      </svg>
      <div class="xg-timeline__legend">
        <span><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="var(--color-blue)" stroke-width="2"/></svg> ${escapeHTML(home?.name || 'Casa')}</span>
        <span><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="var(--color-gold)" stroke-width="2"/></svg> ${escapeHTML(away?.name || 'Visitante')}</span>
      </div>
    </div>
  `;
}
