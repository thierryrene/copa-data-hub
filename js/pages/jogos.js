import { icon } from '../icons.js';
import { FIXTURES, GROUPS } from '../data.js';
import { matchPhase } from '../util/match.js';
import { renderMatchCard } from '../components/matchCard.js';
import { setSEO } from '../util/seo.js';

function categorize(fixtures) {
  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);
  return {
    today: fixtures.filter(f => f.date === todayStr),
    live: fixtures.filter(f => matchPhase(f) === 'live'),
    upcoming: fixtures.filter(f => matchPhase(f) === 'pre').sort((a, b) =>
      new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)),
    finished: fixtures.filter(f => matchPhase(f) === 'finished').reverse()
  };
}

function render() {
  const c = categorize(FIXTURES);
  const groupOpts = Object.keys(GROUPS).map(g => `<option value="${g}">Grupo ${g}</option>`).join('');

  return `
    <h1 class="section-title">${icon('target', 20)} Match Center</h1>
    <p class="section-subtitle">Calendário completo de partidas do Mundial 2026 com cobertura ao vivo, escalações e estatísticas.</p>

    <div class="filter-tabs" id="match-filters">
      <button class="filter-tab active" data-filter="all">Todos (${FIXTURES.length})</button>
      ${c.live.length ? `<button class="filter-tab" data-filter="live">🔴 Ao Vivo (${c.live.length})</button>` : ''}
      <button class="filter-tab" data-filter="upcoming">Próximos (${c.upcoming.length})</button>
      <button class="filter-tab" data-filter="finished">Encerrados (${c.finished.length})</button>
    </div>

    <div class="filter-tabs" id="match-group-filter" style="margin-bottom: var(--space-md);">
      <button class="filter-tab active" data-group="all">Todos os grupos</button>
      ${Object.keys(GROUPS).map(g => `<button class="filter-tab" data-group="${g}">Grupo ${g}</button>`).join('')}
    </div>

    <div class="matches-list" id="matches-container">
      ${FIXTURES.map(f => `
        <div class="match-wrapper" data-phase="${matchPhase(f)}" data-group="${f.group}">
          ${renderMatchCard(f)}
        </div>
      `).join('')}
    </div>
  `;
}

function applyFilters() {
  const phaseFilter = document.querySelector('#match-filters .active')?.dataset.filter || 'all';
  const groupFilter = document.querySelector('#match-group-filter .active')?.dataset.group || 'all';

  document.querySelectorAll('.match-wrapper').forEach((el) => {
    const phaseOk = phaseFilter === 'all'
      || (phaseFilter === 'live' && el.dataset.phase === 'live')
      || (phaseFilter === 'upcoming' && el.dataset.phase === 'pre')
      || (phaseFilter === 'finished' && el.dataset.phase === 'finished');
    const groupOk = groupFilter === 'all' || el.dataset.group === groupFilter;
    el.style.display = (phaseOk && groupOk) ? '' : 'none';
  });
}

function bindEvents() {
  setSEO({
    title: 'Match Center — Jogos do Mundial 2026',
    description: 'Calendário completo do Mundial 2026 com 104 jogos. Filtre por fase, grupo ou status (ao vivo, próximos, encerrados). Cobertura completa de cada partida.',
    canonical: '/jogos',
    keywords: 'jogos mundial 2026, calendário copa do mundo, ao vivo, partidas'
  });

  document.querySelectorAll('#match-filters .filter-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#match-filters .filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    });
  });

  document.querySelectorAll('#match-group-filter .filter-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#match-group-filter .filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    });
  });
}

export default { render, bindEvents };
