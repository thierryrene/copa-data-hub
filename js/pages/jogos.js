import { icon } from '../icons.js';
import { FIXTURES, STADIUMS } from '../data.js';
import { matchPhase } from '../util/match.js';
import { renderMatchCard } from '../components/matchCard.js';
import { setSEO } from '../util/seo.js';

// País de cada estádio
const STADIUM_COUNTRY = Object.fromEntries(STADIUMS.map(s => [s.id, s.country]));

// Mapeia cada fixture para sua rodada dentro do grupo (1, 2 ou 3)
// Ordena por data/hora dentro do grupo e divide em pares.
function buildMatchdayMap() {
  const byGroup = {};
  FIXTURES.forEach(f => {
    if (!byGroup[f.group]) byGroup[f.group] = [];
    byGroup[f.group].push(f);
  });
  const map = {};
  Object.values(byGroup).forEach(fixtures => {
    fixtures
      .slice()
      .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
      .forEach((f, i) => { map[f.id] = Math.floor(i / 2) + 1; });
  });
  return map;
}

const MATCHDAY = buildMatchdayMap();

function categorize(fixtures) {
  return {
    live: fixtures.filter(f => matchPhase(f) === 'live'),
    upcoming: fixtures.filter(f => matchPhase(f) === 'pre'),
    finished: fixtures.filter(f => matchPhase(f) === 'finished'),
  };
}

function render() {
  const c = categorize(FIXTURES);

  // Contagens por rodada e por sede para os labels dos filtros
  const rdCount = [1, 2, 3].map(d => FIXTURES.filter(f => MATCHDAY[f.id] === d).length);
  const sedeCount = {
    EUA:    FIXTURES.filter(f => STADIUM_COUNTRY[f.stadium] === 'EUA').length,
    Canadá: FIXTURES.filter(f => STADIUM_COUNTRY[f.stadium] === 'Canadá').length,
    México: FIXTURES.filter(f => STADIUM_COUNTRY[f.stadium] === 'México').length,
  };

  return `
    <h1 class="section-title">${icon('target', 20)} Match Center</h1>
    <p class="section-subtitle">Calendário completo de partidas do Mundial 2026 com cobertura ao vivo, escalações e estatísticas.</p>

    <div class="filter-tabs" id="match-status-filter">
      <button class="filter-tab active" data-status="all">Todos (${FIXTURES.length})</button>
      ${c.live.length ? `<button class="filter-tab" data-status="live">🔴 Ao Vivo (${c.live.length})</button>` : ''}
      <button class="filter-tab" data-status="upcoming">Próximos (${c.upcoming.length})</button>
      <button class="filter-tab" data-status="finished">Encerrados (${c.finished.length})</button>
    </div>

    <div class="match-filters-row">
      <div class="filter-tabs filter-tabs--compact" id="match-matchday-filter">
        <span class="filter-tabs__label">${icon('calendar', 13)} Rodada</span>
        <button class="filter-tab active" data-matchday="all">Todas</button>
        <button class="filter-tab" data-matchday="1">1ª <span class="filter-tab__count">${rdCount[0]}</span></button>
        <button class="filter-tab" data-matchday="2">2ª <span class="filter-tab__count">${rdCount[1]}</span></button>
        <button class="filter-tab" data-matchday="3">3ª <span class="filter-tab__count">${rdCount[2]}</span></button>
      </div>

      <div class="filter-tabs filter-tabs--compact" id="match-sede-filter">
        <span class="filter-tabs__label">${icon('mapPin', 13)} Sede</span>
        <button class="filter-tab active" data-sede="all">Todas</button>
        <button class="filter-tab" data-sede="EUA">🇺🇸 EUA <span class="filter-tab__count">${sedeCount.EUA}</span></button>
        <button class="filter-tab" data-sede="Canadá">🇨🇦 Canadá <span class="filter-tab__count">${sedeCount.Canadá}</span></button>
        <button class="filter-tab" data-sede="México">🇲🇽 México <span class="filter-tab__count">${sedeCount.México}</span></button>
      </div>
    </div>

    <div class="matches-list" id="matches-container">
      ${FIXTURES.map(f => `
        <div class="match-wrapper"
          data-status="${matchPhase(f)}"
          data-matchday="${MATCHDAY[f.id] || 1}"
          data-sede="${STADIUM_COUNTRY[f.stadium] || ''}">
          ${renderMatchCard(f)}
        </div>
      `).join('')}
    </div>
  `;
}

function applyFilters() {
  const statusFilter  = document.querySelector('#match-status-filter .active')?.dataset.status    || 'all';
  const matchdayFilter = document.querySelector('#match-matchday-filter .active')?.dataset.matchday || 'all';
  const sedeFilter    = document.querySelector('#match-sede-filter .active')?.dataset.sede         || 'all';

  document.querySelectorAll('.match-wrapper').forEach(el => {
    const statusOk = statusFilter === 'all'
      || (statusFilter === 'live'     && el.dataset.status === 'live')
      || (statusFilter === 'upcoming' && el.dataset.status === 'pre')
      || (statusFilter === 'finished' && el.dataset.status === 'finished');
    const matchdayOk = matchdayFilter === 'all' || el.dataset.matchday === matchdayFilter;
    const sedeOk     = sedeFilter === 'all'     || el.dataset.sede === sedeFilter;
    el.style.display = (statusOk && matchdayOk && sedeOk) ? '' : 'none';
  });
}

function bindEvents() {
  setSEO({
    title: 'Match Center — Jogos do Mundial 2026',
    description: 'Calendário completo do Mundial 2026 com 104 jogos. Filtre por rodada, sede (EUA, Canadá, México) ou status. Cobertura completa de cada partida.',
    canonical: '/jogos',
    keywords: 'jogos mundial 2026, calendário copa do mundo, ao vivo, partidas'
  });

  ['#match-status-filter', '#match-matchday-filter', '#match-sede-filter'].forEach(sel => {
    const container = document.querySelector(sel);
    if (!container) return;
    container.addEventListener('click', e => {
      const btn = e.target.closest('.filter-tab');
      if (!btn) return;
      container.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    });
  });
}

export default { render, bindEvents };
