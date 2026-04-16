import { icon } from '../icons.js';
import { GROUPS } from '../data.js';
import { renderGroupTable } from '../components/groupTable.js';

function render(_state) {
  const groupEntries = Object.entries(GROUPS);

  const filterHTML = `
    <div class="filter-tabs" id="group-filters">
      <button class="filter-tab active" data-filter="all">Todos</button>
      ${groupEntries.map(([id]) => `
        <button class="filter-tab" data-filter="${id}">Grupo ${id}</button>
      `).join('')}
    </div>
  `;

  const tablesHTML = groupEntries.map(([id, group]) => (
    `<div class="group-wrapper" data-group="${id}">${renderGroupTable(id, group.teams)}</div>`
  )).join('');

  return `
    <div class="section-title">${icon('shield', 20)} Fase de Grupos</div>
    <p class="section-subtitle">12 grupos · Os 2 primeiros classificam-se diretamente + 8 melhores terceiros</p>

    ${filterHTML}

    <div class="groups-grid" id="groups-container">${tablesHTML}</div>

    <p class="text-sm text-muted mt-md">
      ${icon('info', 14)} Toque em uma seleção para ver dossiê completo, jogos do time e curiosidades.
    </p>
  `;
}

function bindEvents(_state, { router }) {
  const filters = document.getElementById('group-filters');
  if (filters) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-tab');
      if (!btn) return;
      const filter = btn.dataset.filter;
      filters.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.group-wrapper').forEach((g) => {
        g.style.display = (filter === 'all' || g.dataset.group === filter) ? '' : 'none';
      });
    });
  }

  document.querySelectorAll('[data-team-detail]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const code = trigger.dataset.teamDetail;
      if (code) router.navigate('team', { params: [code] });
    });
  });
}

export default { render, bindEvents };
