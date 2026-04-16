import { icon } from '../icons.js';
import { STADIUMS } from '../data.js';
import { renderStadiumCard } from '../components/stadiumCard.js';

function render(_state) {
  const filterHTML = `
    <div class="filter-tabs" id="stadium-filters">
      <button class="filter-tab active" data-filter="all">Todos (16)</button>
      <button class="filter-tab" data-filter="EUA">🇺🇸 EUA (11)</button>
      <button class="filter-tab" data-filter="México">🇲🇽 México (3)</button>
      <button class="filter-tab" data-filter="Canadá">🇨🇦 Canadá (2)</button>
    </div>
  `;

  return `
    <div class="section-title">${icon('mapPin', 20)} Sedes & Estádios</div>
    <p class="section-subtitle">16 estádios em 3 países · 4 fusos horários</p>

    <div class="fanzone-stats mb-xl">
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--blue">11</span>
        <span class="fanzone-stat__label">🇺🇸 EUA</span>
      </div>
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--emerald">3</span>
        <span class="fanzone-stat__label">🇲🇽 México</span>
      </div>
      <div class="fanzone-stat">
        <span class="fanzone-stat__value fanzone-stat__value--gold">2</span>
        <span class="fanzone-stat__label">🇨🇦 Canadá</span>
      </div>
    </div>

    ${filterHTML}

    <div class="stadium-grid" id="stadiums-container">
      ${STADIUMS.map(s => `<div class="stadium-wrapper" data-country="${s.country}">${renderStadiumCard(s)}</div>`).join('')}
    </div>
  `;
}

function bindEvents() {
  const filters = document.getElementById('stadium-filters');
  if (!filters) return;
  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-tab');
    if (!btn) return;
    const filter = btn.dataset.filter;
    filters.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.stadium-wrapper').forEach((s) => {
      s.style.display = (filter === 'all' || s.dataset.country === filter) ? '' : 'none';
    });
  });
}

export default { render, bindEvents };
