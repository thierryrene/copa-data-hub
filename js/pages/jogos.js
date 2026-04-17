import { icon } from '../icons.js';
import { FIXTURES, getTeam } from '../data.js';
import { renderMatchCard } from '../components/matchCard.js';
import { renderStatBar } from '../components/statBar.js';
import { renderPredictionBar } from '../components/predictionBar.js';
import { setSEO } from '../util/seo.js';

function render(_state) {
  const demoMatch = {
    home: getTeam('BRA'),
    away: getTeam('FRA'),
    homeScore: 1,
    awayScore: 0,
    clock: '68:12',
    status: 'LIVE_2H'
  };

  return `
    <h1 class="section-title">${icon('target', 20)} Match Center</h1>
    <p class="section-subtitle">Acompanhe partidas ao vivo com estatísticas e previsão de IA</p>

    <div class="card card--gold mb-xl">
      <div class="match-card">
        <div class="match-card__header">
          <span class="match-card__group">Grupo H</span>
          <span class="match-card__status live">AO VIVO · ${demoMatch.clock}</span>
        </div>
        <div class="match-card__teams">
          <a class="match-card__team match-card__team--link" href="/selecoes/${demoMatch.home.slug}" data-route-link data-team-prefetch="${demoMatch.home.code}" aria-label="Ver detalhes de ${demoMatch.home.name}">
            <span class="match-card__flag">${demoMatch.home.flag}</span>
            <span class="match-card__name">${demoMatch.home.code}</span>
          </a>
          <div class="match-card__score">
            <span>${demoMatch.homeScore}</span>
            <span class="match-card__score-sep">:</span>
            <span>${demoMatch.awayScore}</span>
          </div>
          <a class="match-card__team match-card__team--link" href="/selecoes/${demoMatch.away.slug}" data-route-link data-team-prefetch="${demoMatch.away.code}" aria-label="Ver detalhes de ${demoMatch.away.name}">
            <span class="match-card__flag">${demoMatch.away.flag}</span>
            <span class="match-card__name">${demoMatch.away.code}</span>
          </a>
        </div>
      </div>
    </div>

    <div class="card mb-lg" style="display: flex; flex-direction: column; gap: var(--space-lg); padding: var(--space-xl);">
      <div class="section-title" style="margin-bottom: 0;">${icon('barChart', 18)} Estatísticas</div>
      ${renderStatBar('Posse de Bola', 58, 42, true)}
      ${renderStatBar('Chutes ao Gol', 6, 3)}
      ${renderStatBar('Precisão de Passes', 89, 81, true)}
      ${renderStatBar('xG (Gols Esperados)', 1.84, 0.92)}
      ${renderStatBar('Escanteios', 5, 2)}
    </div>

    ${renderPredictionBar(65, 20, 15, 'BRA', 'FRA')}

    <div class="mt-xl">
      <div class="section-title">${icon('calendar', 20)} Calendário</div>
      <div class="matches-list">
        ${FIXTURES.slice(0, 8).map(f => renderMatchCard(f)).join('')}
      </div>
    </div>
  `;
}

function bindEvents() {
  setSEO({
    title: 'Match Center — Estatísticas e Previsões Ao Vivo',
    description: 'Acompanhe partidas do Mundial 2026 ao vivo com estatísticas detalhadas (posse, xG, chutes), previsões de IA e calendário completo.',
    canonical: '/jogos',
    keywords: 'match center, jogos mundial 2026, estatísticas futebol, xG, previsão IA'
  });
}

export default { render, bindEvents };
