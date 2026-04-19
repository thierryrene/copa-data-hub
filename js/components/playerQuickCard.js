// Ficha Rápida de Jogadores — bottom sheet contextual.
// Ativado ao clicar em qualquer nome de jogador na escalação ou destaque.

import { escapeHTML } from '../util/html.js';
import { icon } from '../icons.js';
import { slugify } from '../util/slug.js';

let quickCardOpen = false;

function posLabel(pos) {
  const map = { G: 'Goleiro', D: 'Defensor', M: 'Meia', F: 'Atacante', GK: 'Goleiro', DEF: 'Defensor', MID: 'Meia', FWD: 'Atacante' };
  return map[pos] || pos || '—';
}

function buildCardHTML(player, teamFlag, teamName) {
  const name = player.player?.name || player.name || 'Jogador';
  const number = player.player?.number || player.number || '';
  const pos = player.statistics?.[0]?.games?.position || player.position || '';
  const age = player.player?.age || '';
  const goals = player.statistics?.[0]?.goals?.total ?? player.goals ?? null;
  const assists = player.statistics?.[0]?.goals?.assists ?? player.assists ?? null;
  const apps = player.statistics?.[0]?.games?.appearences ?? player.apps ?? null;
  const rating = player.statistics?.[0]?.games?.rating ? parseFloat(player.statistics[0].games.rating).toFixed(1) : null;
  const photo = player.player?.photo || '';
  const slug = slugify(name);
  const club = player.statistics?.[0]?.team?.name || player.club || '';

  const statItems = [
    goals != null ? `<div class="pqc__stat"><span class="pqc__stat-val">${goals}</span><span class="pqc__stat-lbl">gols</span></div>` : '',
    assists != null ? `<div class="pqc__stat"><span class="pqc__stat-val">${assists}</span><span class="pqc__stat-lbl">assist.</span></div>` : '',
    apps != null ? `<div class="pqc__stat"><span class="pqc__stat-val">${apps}</span><span class="pqc__stat-lbl">jogos</span></div>` : '',
    rating ? `<div class="pqc__stat"><span class="pqc__stat-val pqc__stat-val--gold">${rating}</span><span class="pqc__stat-lbl">nota</span></div>` : '',
  ].filter(Boolean);

  return `
    <div class="pqc-backdrop" id="pqc-backdrop"></div>
    <div class="pqc" id="pqc-sheet" role="dialog" aria-modal="true" aria-label="Ficha de ${escapeHTML(name)}">
      <div class="pqc__drag"></div>
      <div class="pqc__header">
        <div class="pqc__avatar">
          ${photo ? `<img src="${escapeHTML(photo)}" alt="${escapeHTML(name)}" loading="lazy" onerror="this.style.display='none'">` : `<span class="pqc__avatar-icon">⚽</span>`}
        </div>
        <div class="pqc__info">
          <div class="pqc__name">${escapeHTML(name)}</div>
          <div class="pqc__meta">
            ${teamFlag} ${escapeHTML(teamName)}
            ${pos ? ` · ${posLabel(pos)}` : ''}
            ${number ? ` · Camisa ${number}` : ''}
          </div>
          ${age ? `<div class="pqc__age">${age} anos${club ? ` · ${escapeHTML(club)}` : ''}</div>` : ''}
        </div>
        <button class="pqc__close" id="pqc-close" type="button" aria-label="Fechar">${icon('x', 18)}</button>
      </div>

      ${statItems.length ? `<div class="pqc__stats">${statItems.join('')}</div>` : ''}

      <a class="pqc__link" href="/jogadores/${slug}" data-route-link>
        ${icon('user', 14)} Ver perfil completo
      </a>
    </div>
  `;
}

export function showPlayerCard(player, teamFlag, teamName) {
  if (quickCardOpen) closePlayerCard();
  quickCardOpen = true;

  const wrapper = document.createElement('div');
  wrapper.id = 'pqc-root';
  wrapper.innerHTML = buildCardHTML(player, teamFlag, teamName);
  document.body.appendChild(wrapper);

  requestAnimationFrame(() => {
    document.getElementById('pqc-sheet')?.classList.add('pqc--open');
  });

  document.getElementById('pqc-close')?.addEventListener('click', closePlayerCard);
  document.getElementById('pqc-backdrop')?.addEventListener('click', closePlayerCard);

  // Navegar via link fecha o card
  document.querySelector('#pqc-root [data-route-link]')?.addEventListener('click', closePlayerCard);
}

export function closePlayerCard() {
  const sheet = document.getElementById('pqc-sheet');
  if (sheet) {
    sheet.classList.remove('pqc--open');
    setTimeout(() => {
      document.getElementById('pqc-root')?.remove();
      quickCardOpen = false;
    }, 300);
  } else {
    document.getElementById('pqc-root')?.remove();
    quickCardOpen = false;
  }
}

export function bindPlayerCards(containerSelector, squads, homeTeam, awayTeam) {
  const container = typeof containerSelector === 'string'
    ? document.querySelector(containerSelector)
    : containerSelector || document;

  container?.addEventListener('click', e => {
    const el = e.target.closest('[data-player-card]');
    if (!el) return;

    const playerName = el.dataset.playerCard;
    const teamCode = el.dataset.teamCode;
    const team = teamCode === homeTeam?.code ? homeTeam : awayTeam;
    const squad = squads[teamCode];
    const player = squad?.players?.find(p => (p.player?.name || p.name) === playerName)
      || { name: playerName };

    showPlayerCard(player, team?.flag || '', team?.name || '');
  });
}
