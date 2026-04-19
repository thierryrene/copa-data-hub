import { icon } from '../icons.js';
import { GROUPS, getTeam } from '../data.js';
import { renderGroupTable } from '../components/groupTable.js';
import { setSEO } from '../util/seo.js';
import { escapeHTML } from '../util/html.js';

// ── Bracket visual do mata-mata ──
function renderBracket() {
  // Mundial 2026: 32 times no mata-mata (Top 2 de cada grupo + 8 melhores 3ºs)
  // Como os jogos ainda não ocorreram, exibimos placeholders com os grupos
  const slots = [
    // R32 - Oitavas de Final (pares hipotéticos por chaveamento geográfico)
    { home: '1ºA', away: '2ºB' }, { home: '1ºC', away: '2ºD' },
    { home: '1ºE', away: '2ºF' }, { home: '1ºG', away: '2ºH' },
    { home: '1ºI', away: '2ºJ' }, { home: '1ºK', away: '2ºL' },
    { home: '2ºA', away: '1ºB' }, { home: '2ºC', away: '1ºD' },
    { home: '2ºE', away: '1ºF' }, { home: '2ºG', away: '1ºH' },
    { home: '2ºI', away: '1ºJ' }, { home: '2ºK', away: '1ºL' },
    { home: '3ºA/B/C/D', away: '3ºE/F/G/H' }, { home: '3ºI/J/K/L', away: 'TBD' },
    { home: 'TBD', away: 'TBD' }, { home: 'TBD', away: 'TBD' },
  ];

  const round16 = slots.slice(0, 8);
  const round16b = slots.slice(8, 16);

  function bracketMatch(slot, idx) {
    return `
      <div class="bracket-match">
        <div class="bracket-slot">${escapeHTML(slot.home)}</div>
        <div class="bracket-slot">${escapeHTML(slot.away)}</div>
      </div>
    `;
  }

  const qfSlots = Array.from({ length: 4 }, (_, i) => ({ home: `Vencedor ${i*2+1}`, away: `Vencedor ${i*2+2}` }));
  const sfSlots = [{ home: 'Vencedor QF1', away: 'Vencedor QF2' }, { home: 'Vencedor QF3', away: 'Vencedor QF4' }];

  return `
    <div class="bracket-section">
      <div class="section-title">${icon('bracket', 20)} Chaveamento do Mata-Mata</div>
      <p class="section-subtitle">Projeção do chaveamento após a fase de grupos. Slots atualizados automaticamente conforme os resultados.</p>

      <div class="bracket-scroll">
        <div class="bracket-container">

          <div class="bracket-round">
            <div class="bracket-round__label">Oitavas de Final</div>
            <div class="bracket-round__matches">
              ${round16.map(bracketMatch).join('')}
            </div>
          </div>

          <div class="bracket-arrow">›</div>

          <div class="bracket-round">
            <div class="bracket-round__label">Quartas de Final</div>
            <div class="bracket-round__matches">
              ${qfSlots.map(bracketMatch).join('')}
            </div>
          </div>

          <div class="bracket-arrow">›</div>

          <div class="bracket-round">
            <div class="bracket-round__label">Semifinal</div>
            <div class="bracket-round__matches">
              ${sfSlots.map(bracketMatch).join('')}
            </div>
          </div>

          <div class="bracket-arrow">›</div>

          <div class="bracket-round bracket-round--final">
            <div class="bracket-round__label">Final</div>
            <div class="bracket-match bracket-match--final">
              <div class="bracket-slot">Vencedor SF1</div>
              <div class="bracket-final-vs">vs</div>
              <div class="bracket-slot">Vencedor SF2</div>
            </div>
            <div class="bracket-venue">🏟️ MetLife Stadium, NJ · 19/07/2026</div>
          </div>

        </div>
      </div>

      <div class="bracket-note">
        <span>${icon('info', 13)} Os slots serão preenchidos com os classificados reais após cada rodada da fase de grupos.</span>
      </div>
    </div>
  `;
}

function render(_state) {
  const groupEntries = Object.entries(GROUPS);

  const filterHTML = `
    <div class="filter-tabs" id="group-filters">
      <button class="filter-tab active" data-filter="all">Todos</button>
      ${groupEntries.map(([id]) => `
        <button class="filter-tab" data-filter="${id}">Grupo ${id}</button>
      `).join('')}
      <button class="filter-tab" data-filter="bracket">🏆 Mata-Mata</button>
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

    <div id="bracket-container" style="display:none">
      ${renderBracket()}
    </div>

    <p class="text-sm text-muted mt-md" id="groups-tip">
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
  const groupsContainer = document.getElementById('groups-container');
  const bracketContainer = document.getElementById('bracket-container');
  const tip = document.getElementById('groups-tip');

  if (filters) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-tab');
      if (!btn) return;
      const filter = btn.dataset.filter;
      filters.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');

      if (filter === 'bracket') {
        groupsContainer.style.display = 'none';
        bracketContainer.style.display = '';
        if (tip) tip.style.display = 'none';
      } else {
        groupsContainer.style.display = '';
        bracketContainer.style.display = 'none';
        if (tip) tip.style.display = '';
        document.querySelectorAll('.group-wrapper').forEach((g) => {
          g.style.display = (filter === 'all' || g.dataset.group === filter) ? '' : 'none';
        });
      }
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
