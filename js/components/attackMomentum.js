// Attack Momentum Chart SVG — gráfico de pressão temporal da partida.
// Mostra qual equipe estava dominando em cada segmento de 5 minutos.
// Retorna HTML string sem dependências.

import { escapeHTML } from '../util/html.js';

/**
 * Gera array de momentum [-1..1] por segmento de 5 min.
 * Positivo = time da casa dominando; negativo = visitante.
 */
function buildMomentum(events, homeName, segments = 18) {
  const raw = new Array(segments).fill(0);

  // Acrescenta spikes nos eventos
  (events || []).forEach(ev => {
    if (!ev?.minute) return;
    const seg = Math.min(segments - 1, Math.floor(ev.minute / 5));
    const isHome = ev.teamName === homeName;

    if (ev.type === 'Goal') {
      const spike = isHome ? 0.7 : -0.7;
      for (let i = 0; i < 5 && seg + i < segments; i++) {
        raw[seg + i] += spike * Math.exp(-i * 0.7);
      }
    } else if (ev.type === 'Card' && ev.detail === 'Red Card') {
      // Cartão vermelho favorece o adversário
      const delta = isHome ? -0.3 : 0.3;
      for (let i = 0; i < 4 && seg + i < segments; i++) {
        raw[seg + i] += delta * Math.exp(-i * 0.5);
      }
    }
  });

  // Ondulação natural + normalização
  return raw.map((v, i) => {
    const wave = Math.sin(i * 0.6 + 1.2) * 0.18;
    return Math.max(-1, Math.min(1, v + wave));
  });
}

/**
 * Interpola o caminho SVG suavizado para o momentum.
 */
function buildPath(momentum, cx, cy, segW, maxH) {
  const pts = momentum.map((v, i) => ({
    x: i * segW + segW / 2,
    y: cy - v * maxH,
  }));

  if (!pts.length) return '';

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1].x + segW * 0.35;
    const cp2x = pts[i].x - segW * 0.35;
    d += ` C ${cp1x} ${pts[i - 1].y} ${cp2x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

export function renderMomentumChart(events, home, away) {
  const segments = 18; // 0-90 minutos em blocos de 5
  const W = 300, H = 90, cy = H / 2, segW = W / segments, maxH = cy * 0.82;
  const momentum = buildMomentum(events, home?.name, segments);
  const linePath = buildPath(momentum, 0, cy, segW, maxH);

  // Área home (positiva) e away (negativa) em polígonos separados
  const homeArea = momentum.map((v, i) => {
    const x = i * segW + segW / 2;
    const y = cy - Math.max(0, v) * maxH;
    return { x, y };
  });
  const awayArea = momentum.map((v, i) => {
    const x = i * segW + segW / 2;
    const y = cy - Math.min(0, v) * maxH;
    return { x, y };
  });

  function areaPath(pts, below) {
    if (!pts.length) return '';
    let d = `M 0 ${cy}`;
    pts.forEach(p => { d += ` L ${p.x} ${p.y}`; });
    d += ` L ${W} ${cy} Z`;
    return d;
  }

  // Marcadores de gol
  const goalDots = (events || [])
    .filter(ev => ev.type === 'Goal' && ev.minute)
    .map(ev => {
      const isHome = ev.teamName === home?.name;
      const seg = Math.min(segments - 1, Math.floor(ev.minute / 5));
      const x = seg * segW + segW / 2;
      const v = momentum[seg];
      const y = cy - v * maxH;
      return `
        <circle cx="${x}" cy="${y}" r="4" fill="${isHome ? 'var(--color-blue)' : 'var(--color-gold)'}" stroke="var(--color-bg-primary)" stroke-width="1.5"/>
      `;
    }).join('');

  // Labels de tempo
  const timeLabels = [0, 15, 30, 45, 60, 75, 90].map(t => {
    const x = (t / 90) * W;
    return `<text x="${x}" y="${H - 2}" text-anchor="middle" fill="rgba(148,163,184,0.4)" font-size="6" font-family="Inter,sans-serif">${t}'</text>`;
  }).join('');

  return `
    <div class="momentum-chart">
      <div class="momentum-chart__header">
        <span class="momentum-chart__team momentum-chart__team--home">${escapeHTML(home?.flag || '')} ${escapeHTML(home?.code || '')}</span>
        <span class="momentum-chart__title">Pressão da Partida</span>
        <span class="momentum-chart__team momentum-chart__team--away">${escapeHTML(away?.code || '')} ${escapeHTML(away?.flag || '')}</span>
      </div>
      <svg viewBox="0 0 ${W} ${H}" class="momentum-chart__svg" preserveAspectRatio="none">
        <!-- grid -->
        <line x1="0" y1="${cy}" x2="${W}" y2="${cy}" stroke="rgba(148,163,184,0.15)" stroke-width="1" stroke-dasharray="3,3"/>
        <!-- home area -->
        <path d="${areaPath(homeArea)}" fill="rgba(59,130,246,0.25)" stroke="none"/>
        <!-- away area -->
        <path d="${areaPath(awayArea)}" fill="rgba(245,158,11,0.22)" stroke="none"/>
        <!-- line -->
        <path d="${linePath}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-linejoin="round"/>
        ${goalDots}
        ${timeLabels}
      </svg>
      <div class="momentum-chart__legend">
        <span class="momentum-chart__legend-dot momentum-chart__legend-dot--home"></span>
        <span>${escapeHTML(home?.name || 'Casa')} domina acima</span>
        <span class="momentum-chart__legend-dot momentum-chart__legend-dot--away"></span>
        <span>${escapeHTML(away?.name || 'Visitante')} domina abaixo</span>
      </div>
    </div>
  `;
}
