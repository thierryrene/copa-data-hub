// Busca global — overlay fullscreen com resultados em tempo real.
// Busca seleções, estádios e partidas. Sem dependências externas além dos módulos internos.

import { TEAMS, STADIUMS, FIXTURES, getTeam } from '../data.js';
import { escapeHTML } from '../util/html.js';
import { icon } from '../icons.js';

function normalize(str) {
  return String(str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function searchTeams(query) {
  const q = normalize(query);
  return Object.values(TEAMS).filter(t =>
    normalize(t.name).includes(q) ||
    normalize(t.code).includes(q) ||
    normalize(t.confederation).includes(q)
  ).slice(0, 5);
}

function searchStadiums(query) {
  const q = normalize(query);
  return STADIUMS.filter(s =>
    normalize(s.name).includes(q) ||
    normalize(s.city).includes(q) ||
    normalize(s.country).includes(q)
  ).slice(0, 4);
}

function searchFixtures(query) {
  const q = normalize(query);
  return FIXTURES.filter(f => {
    const h = getTeam(f.home);
    const a = getTeam(f.away);
    return (
      normalize(h?.name).includes(q) ||
      normalize(a?.name).includes(q) ||
      normalize(h?.code).includes(q) ||
      normalize(a?.code).includes(q) ||
      normalize(f.date).includes(q)
    );
  }).slice(0, 4);
}

function renderTeamResult(team) {
  return `
    <a class="search-result search-result--team" href="/selecoes/${team.slug}" data-route-link>
      <span class="search-result__icon">${team.flag}</span>
      <div>
        <div class="search-result__name">${escapeHTML(team.name)}</div>
        <div class="search-result__meta">${escapeHTML(team.code)} · ${escapeHTML(team.confederation)} · Ranking ${team.ranking}</div>
      </div>
      ${icon('chevronRight', 14, 'search-result__arrow')}
    </a>
  `;
}

function renderStadiumResult(stadium) {
  return `
    <a class="search-result search-result--stadium" href="/sedes" data-route-link>
      ${icon('mapPin', 16, 'search-result__icon-svg')}
      <div>
        <div class="search-result__name">${escapeHTML(stadium.name)}</div>
        <div class="search-result__meta">${escapeHTML(stadium.city)}, ${escapeHTML(stadium.country)} · ${stadium.capacity.toLocaleString('pt-BR')} lug.</div>
      </div>
      ${icon('chevronRight', 14, 'search-result__arrow')}
    </a>
  `;
}

function renderFixtureResult(fixture) {
  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  if (!home || !away) return '';
  const score = fixture.homeScore != null
    ? `${fixture.homeScore}–${fixture.awayScore}`
    : fixture.time;
  const dateStr = new Date(`${fixture.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `
    <a class="search-result search-result--fixture" href="/partida/${home.slug}-vs-${away.slug}-${fixture.date}" data-route-link>
      <span class="search-result__flags">${home.flag} ${away.flag}</span>
      <div>
        <div class="search-result__name">${escapeHTML(home.code)} × ${escapeHTML(away.code)}</div>
        <div class="search-result__meta">Grupo ${fixture.group} · ${dateStr} · ${score}</div>
      </div>
      ${icon('chevronRight', 14, 'search-result__arrow')}
    </a>
  `;
}

function renderResults(query) {
  if (!query || query.length < 2) {
    return `<div class="search-empty">${icon('search', 24)} <span>Digite para buscar seleções, estádios ou partidas</span></div>`;
  }

  const teams = searchTeams(query);
  const stadiums = searchStadiums(query);
  const fixtures = searchFixtures(query);

  if (!teams.length && !stadiums.length && !fixtures.length) {
    return `<div class="search-empty">${icon('info', 20)} <span>Nenhum resultado para "<strong>${escapeHTML(query)}</strong>"</span></div>`;
  }

  let html = '';

  if (teams.length) {
    html += `<div class="search-group"><div class="search-group__label">${icon('shield', 14)} Seleções</div>${teams.map(renderTeamResult).join('')}</div>`;
  }
  if (fixtures.length) {
    html += `<div class="search-group"><div class="search-group__label">${icon('calendar', 14)} Partidas</div>${fixtures.map(renderFixtureResult).join('')}</div>`;
  }
  if (stadiums.length) {
    html += `<div class="search-group"><div class="search-group__label">${icon('mapPin', 14)} Estádios</div>${stadiums.map(renderStadiumResult).join('')}</div>`;
  }

  return html;
}

export function renderSearchOverlay() {
  return `
    <div class="search-overlay" id="search-overlay" role="dialog" aria-label="Busca global" aria-modal="true">
      <div class="search-overlay__backdrop" id="search-backdrop"></div>
      <div class="search-overlay__panel">
        <div class="search-overlay__bar">
          ${icon('search', 18, 'search-overlay__icon')}
          <input
            type="search"
            id="search-input"
            class="search-overlay__input"
            placeholder="Buscar seleção, estádio ou partida…"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            aria-label="Campo de busca"
          >
          <button class="search-overlay__close" id="search-close" aria-label="Fechar busca">
            ${icon('x', 18)}
          </button>
        </div>
        <div class="search-overlay__results" id="search-results">
          <div class="search-empty">${icon('search', 24)} <span>Digite para buscar seleções, estádios ou partidas</span></div>
        </div>
      </div>
    </div>
  `;
}

export function mountSearchOverlay(router) {
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const closeBtn = document.getElementById('search-close');
  const backdrop = document.getElementById('search-backdrop');

  if (!overlay || !input || !results) return;

  let debounceTimer = null;

  function open() {
    overlay.classList.add('search-overlay--open');
    setTimeout(() => input.focus(), 80);
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('search-overlay--open');
    input.value = '';
    results.innerHTML = `<div class="search-empty">${icon('search', 24)} <span>Digite para buscar seleções, estádios ou partidas</span></div>`;
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);

  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      results.innerHTML = renderResults(input.value.trim());
    }, 160);
  });

  // Navegar pelos links de resultado dispara o router e fecha
  results.addEventListener('click', (e) => {
    const link = e.target.closest('[data-route-link]');
    if (link) { setTimeout(close, 80); }
  });

  // Expõe a função open para o botão no header
  window._searchOpen = open;
}
