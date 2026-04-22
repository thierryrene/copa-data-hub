// Card flutuante na parte inferior (acima do bottom-nav) com a partida ao
// vivo no momento. Aparece quando há fixture com phase 'live' e some quando
// o usuário já está na rota /partida/:slug daquela partida ou dispensou o
// card. Atualiza placar/minuto a cada 30s.

import { FIXTURES, getTeam } from '../data.js';
import { matchPhase, matchSlug } from '../util/match.js';
import { applyMockToFixtures } from '../util/mockMode.js';
import { fetchMatchData } from '../api/match.js';
import { escapeHTML } from '../util/html.js';

const HOST_ID = 'live-match-card-host';
const DISMISS_KEY_PREFIX = 'cdh_live_dismissed_';
const DISMISS_TTL_MS = 60 * 60 * 1000;
const REFRESH_MS = 30 * 1000;

let routerRef = null;
let refreshTimer = null;
let currentRouteName = null;
let currentSlug = null;

function findLiveFixture() {
  const list = applyMockToFixtures(FIXTURES).filter(f => matchPhase(f) === 'live');
  if (!list.length) return null;
  // Não mostra a partida que o usuário já está vendo
  for (const fx of list) {
    if (currentRouteName === 'partida' && currentSlug === matchSlug(fx)) continue;
    if (isDismissed(fx.id)) continue;
    return fx;
  }
  return null;
}

function isDismissed(fixtureId) {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY_PREFIX + fixtureId);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Date.now() - ts > DISMISS_TTL_MS) {
      sessionStorage.removeItem(DISMISS_KEY_PREFIX + fixtureId);
      return false;
    }
    return true;
  } catch { return false; }
}

function dismiss(fixtureId) {
  try { sessionStorage.setItem(DISMISS_KEY_PREFIX + fixtureId, String(Date.now())); }
  catch {}
}

// ── Pega dados extras (minuto + último evento) de forma silenciosa ──
async function loadExtras(fixtureId) {
  try {
    const data = await fetchMatchData(fixtureId, 'live');
    if (!data) return null;
    const events = (data.events || []).filter(e => e.type === 'Goal' || e.type === 'Card');
    const last = events[events.length - 1] || null;
    return { elapsed: data.elapsed, lastEvent: last };
  } catch { return null; }
}

function lastEventText(ev, home, away) {
  if (!ev) return '';
  const teamCode = ev.teamId; // não temos code direto; fallback p/ nome do time
  const isGoal = ev.type === 'Goal';
  const isRed = ev.type === 'Card' && /red/i.test(ev.detail || '');
  const isYellow = ev.type === 'Card' && /yellow/i.test(ev.detail || '');
  const ico = isGoal ? '⚽' : isRed ? '🟥' : isYellow ? '🟨' : '•';
  const player = ev.playerName ? escapeHTML(ev.playerName) : '';
  return `${ico} ${ev.minute}'<span class="live-card__last-name"> ${player}</span>`;
}

function buildHTML(fx, extras) {
  const home = getTeam(fx.home);
  const away = getTeam(fx.away);
  if (!home || !away) return '';
  const slug = matchSlug(fx);
  const minute = extras?.elapsed != null ? `${extras.elapsed}'` :
    (fx.status === 'HT' ? 'INT' : 'AO VIVO');
  const last = lastEventText(extras?.lastEvent, home, away);

  return `
    <div class="live-match-card" role="region" aria-label="Partida ao vivo: ${escapeHTML(home.name)} contra ${escapeHTML(away.name)}">
      <a class="live-match-card__main" href="/partida/${slug}" data-route-link aria-label="Abrir detalhes da partida">
        <div class="live-match-card__pulse">
          <span class="live-match-card__dot"></span>
          <span class="live-match-card__min">${escapeHTML(minute)}</span>
        </div>
        <div class="live-match-card__teams">
          <div class="live-match-card__team">
            <span class="live-match-card__flag">${home.flag}</span>
            <span class="live-match-card__code">${escapeHTML(home.code)}</span>
          </div>
          <div class="live-match-card__score">
            <span>${fx.homeScore ?? 0}</span>
            <span class="live-match-card__sep">×</span>
            <span>${fx.awayScore ?? 0}</span>
          </div>
          <div class="live-match-card__team live-match-card__team--away">
            <span class="live-match-card__code">${escapeHTML(away.code)}</span>
            <span class="live-match-card__flag">${away.flag}</span>
          </div>
        </div>
        ${last ? `<div class="live-match-card__last">${last}</div>` : ''}
      </a>
      <button class="live-match-card__close" type="button" id="live-match-close" aria-label="Dispensar" data-fixture="${escapeHTML(String(fx.id))}">×</button>
    </div>
  `;
}

async function renderInto(host, fx) {
  // Render imediato com dados básicos, depois enriquece.
  host.innerHTML = buildHTML(fx, null);
  attachHandlers(host, fx);
  const extras = await loadExtras(fx.id);
  if (extras && host.dataset.fixtureId === String(fx.id)) {
    host.innerHTML = buildHTML(fx, extras);
    attachHandlers(host, fx);
  }
}

function attachHandlers(host, fx) {
  const closeBtn = host.querySelector('#live-match-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismiss(fx.id);
      host.innerHTML = '';
      host.dataset.fixtureId = '';
    });
  }
  const link = host.querySelector('.live-match-card__main');
  if (link) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (routerRef) routerRef.navigate('partida', { params: { slug: matchSlug(fx) } });
    });
  }
}

export function refreshLiveMatchCard() {
  const host = document.getElementById(HOST_ID);
  if (!host) return;
  const fx = findLiveFixture();
  if (!fx) {
    host.innerHTML = '';
    host.dataset.fixtureId = '';
    return;
  }
  if (host.dataset.fixtureId === String(fx.id)) return; // mesmo já está renderizado
  host.dataset.fixtureId = String(fx.id);
  renderInto(host, fx);
}

export function mountLiveMatchCard(router) {
  routerRef = router;
  refreshLiveMatchCard();
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(refreshLiveMatchCard, REFRESH_MS);
}

// Notifica mudança de rota — recalcula visibilidade (esconder em /partida).
export function onRouteChange(routeName, params) {
  currentRouteName = routeName;
  currentSlug = params?.slug || null;
  refreshLiveMatchCard();
}
