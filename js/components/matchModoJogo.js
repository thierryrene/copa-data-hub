// Modo Jogo — overlay de segunda tela para acompanhar partidas ao vivo.
// Exibe placar, timeline de eventos e stats numa interface limpa e imersiva.

import { escapeHTML } from '../util/html.js';
import { icon } from '../icons.js';

let modoJogoOpen = false;

const SABIA_QUE_FACTS = [
  "Você sabia? A Copa de 2026 é a primeira com 48 seleções e 3 países-sede.",
  "Você sabia? O Brasil é a única seleção a disputar todas as Copas do Mundo da história.",
  "Você sabia? A Argentina é a atual campeã mundial — título conquistado no Catar em 2022.",
  "Você sabia? A Copa de 2026 terá 104 jogos, o maior número da história do torneio.",
  "Você sabia? A final será disputada no MetLife Stadium, em Nova Jersey — o maior da Copa.",
  "Você sabia? França e Alemanha são as seleções com mais Copas entre si: 4 e 4.",
];

function randomFact() {
  return SABIA_QUE_FACTS[Math.floor(Math.random() * SABIA_QUE_FACTS.length)];
}

function buildOverlayHTML(fixture, home, away) {
  const score = fixture.homeScore != null
    ? `${fixture.homeScore} – ${fixture.awayScore}`
    : '– – –';
  const minuteLabel = fixture.minute ? `${fixture.minute}'` : 'AO VIVO';

  // Lê a timeline já renderizada no DOM
  const timelineEl = document.getElementById('match-timeline');
  const timelineHTML = timelineEl?.innerHTML || '<p class="text-sm text-muted">Aguardando eventos…</p>';

  // Lê stats ao vivo já renderizadas
  const statsEl = document.getElementById('match-live-stats');
  const statsHTML = statsEl?.innerHTML || '<p class="text-sm text-muted">Aguardando estatísticas…</p>';

  return `
    <div class="modo-jogo" id="modo-jogo-overlay" role="dialog" aria-modal="true" aria-label="Modo Jogo Ao Vivo">
      <div class="modo-jogo__header">
        <button class="modo-jogo__close" id="modo-jogo-close" type="button" aria-label="Fechar Modo Jogo">
          ${icon('x', 20)}
        </button>
        <span class="modo-jogo__live-badge">
          <span class="modo-jogo__pulse"></span>AO VIVO
        </span>
        <span class="modo-jogo__minute">${escapeHTML(minuteLabel)}</span>
      </div>

      <div class="modo-jogo__score-block">
        <span class="modo-jogo__team">${home.flag}<br><span>${escapeHTML(home.code)}</span></span>
        <span class="modo-jogo__score">${escapeHTML(score)}</span>
        <span class="modo-jogo__team">${away.flag}<br><span>${escapeHTML(away.code)}</span></span>
      </div>

      <div class="modo-jogo__sections">

        <div class="modo-jogo__section">
          <div class="modo-jogo__section-title">${icon('calendar', 14)} Eventos</div>
          <div class="modo-jogo__timeline">${timelineHTML}</div>
        </div>

        <div class="modo-jogo__section">
          <div class="modo-jogo__section-title">${icon('barChart', 14)} Estatísticas</div>
          <div class="modo-jogo__stats">${statsHTML}</div>
        </div>

        <div class="modo-jogo__fact">
          <span class="modo-jogo__fact-icon">💡</span>
          <span>${escapeHTML(randomFact())}</span>
        </div>

      </div>
    </div>
  `;
}

export function openModoJogo(fixture, home, away) {
  if (modoJogoOpen) return;
  modoJogoOpen = true;

  const wrapper = document.createElement('div');
  wrapper.id = 'modo-jogo-root';
  wrapper.innerHTML = buildOverlayHTML(fixture, home, away);
  document.body.appendChild(wrapper);
  document.body.style.overflow = 'hidden';

  const closeBtn = document.getElementById('modo-jogo-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModoJogo);

  wrapper.querySelector('.modo-jogo')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModoJogo();
  });
}

export function closeModoJogo() {
  const root = document.getElementById('modo-jogo-root');
  if (root) root.remove();
  document.body.style.overflow = '';
  modoJogoOpen = false;
}

export function refreshModoJogo(fixture, home, away) {
  if (!modoJogoOpen) return;
  closeModoJogo();
  openModoJogo(fixture, home, away);
}
