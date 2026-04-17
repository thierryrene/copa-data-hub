import { icon } from '../icons.js';
import { GROUPS, getTeam } from '../data.js';
import { renderGroupTable } from '../components/groupTable.js';
import { setSEO } from '../util/seo.js';

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
    <h1 class="section-title">${icon('shield', 20)} Fase de Grupos</h1>
    <p class="section-subtitle">12 grupos · Os 2 primeiros classificam-se diretamente + 8 melhores terceiros</p>

    ${filterHTML}

    <div class="groups-grid" id="groups-container">${tablesHTML}</div>

    <p class="text-sm text-muted mt-md">
      ${icon('info', 14)} Toque em uma seleção para ver dossiê completo, jogos do time e curiosidades.
    </p>
  `;
}

function bindEvents(_state, { router }) {
  setSEO({
    title: 'Grupos e Classificação do Mundial 2026',
    description: 'Todos os 12 grupos do Mundial 2026 com as 48 seleções. Classificação, adversários e links para dossiê completo de cada seleção.',
    canonical: '/grupos',
    keywords: 'grupos mundial 2026, fase de grupos, classificação, 48 seleções'
  });

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
      const team = getTeam(code);
      if (team?.slug) router.navigate('selecoes', { params: { slug: team.slug } });
    });
  });
}

export default { render, bindEvents };
