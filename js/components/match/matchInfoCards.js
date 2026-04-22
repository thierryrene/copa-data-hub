// Cards informativos da página de partida:
// arbitragem, clima, desfalques, forma recente e breakdown de gols.

import { escapeHTML } from '../../util/html.js';
import { icon } from '../../icons.js';

// ── Arbitragem ──
export function renderRefereeCard(referee) {
  if (!referee) return '';
  return `
    <div class="card referee-card" aria-label="Arbitragem da partida">
      <div class="referee-card__icon">${icon('whistle', 18) || icon('shield', 18)}</div>
      <div>
        <div class="referee-card__lbl">Árbitro principal</div>
        <div class="referee-card__name">${escapeHTML(referee)}</div>
      </div>
    </div>
  `;
}

// ── Clima no estádio ──
// Códigos WMO simplificados em ícone emoji + label pt-BR.
const WMO_MAP = {
  0:  { ico: '☀️',  lbl: 'Ensolarado' },
  1:  { ico: '🌤️',  lbl: 'Pouca nuvem' },
  2:  { ico: '⛅',   lbl: 'Parcialmente nublado' },
  3:  { ico: '☁️',  lbl: 'Nublado' },
  45: { ico: '🌫️',  lbl: 'Neblina' },
  48: { ico: '🌫️',  lbl: 'Neblina densa' },
  51: { ico: '🌦️',  lbl: 'Garoa fraca' },
  61: { ico: '🌧️',  lbl: 'Chuva fraca' },
  63: { ico: '🌧️',  lbl: 'Chuva moderada' },
  65: { ico: '🌧️',  lbl: 'Chuva forte' },
  71: { ico: '🌨️',  lbl: 'Neve fraca' },
  80: { ico: '🌧️',  lbl: 'Pancadas de chuva' },
  95: { ico: '⛈️',  lbl: 'Trovoada' },
  99: { ico: '⛈️',  lbl: 'Trovoada com granizo' }
};

function describeWeather(code) {
  return WMO_MAP[code] || { ico: '🌡️', lbl: 'Tempo variável' };
}

export function renderWeatherCard(weather, stadium) {
  if (!weather || weather.temperature == null) return '';
  const w = describeWeather(weather.weatherCode);
  const temp = Math.round(weather.temperature);
  const wind = Math.round(weather.windKmh ?? 0);
  const rain = Math.round(weather.precipProbability ?? 0);
  const where = stadium ? `${escapeHTML(stadium.city)}` : 'no estádio';

  return `
    <div class="card weather-card" aria-label="Condição climática do jogo">
      <div class="weather-card__main">
        <span class="weather-card__icon" aria-hidden="true">${w.ico}</span>
        <div class="weather-card__temp">${temp}°C</div>
      </div>
      <div class="weather-card__meta">
        <div class="weather-card__lbl">${escapeHTML(w.lbl)} · ${where}</div>
        <div class="weather-card__details">
          <span title="Velocidade do vento">💨 ${wind} km/h</span>
          <span title="Chance de chuva">💧 ${rain}%</span>
        </div>
      </div>
    </div>
  `;
}

// ── Desfalques (lesionados/suspensos) ──
function reasonIcon(reason = '') {
  const r = reason.toLowerCase();
  if (r.includes('suspend')) return '🟥';
  if (r.includes('illness') || r.includes('virus')) return '🤒';
  if (r.includes('doubt') || r.includes('quest')) return '❓';
  return '🩹';
}

function reasonLabelPt(reason = '') {
  const map = {
    'Suspended': 'Suspenso',
    'Knock': 'Pancada',
    'Muscle Injury': 'Lesão muscular',
    'Illness': 'Doente',
    'Hamstring': 'Posterior de coxa',
    'Knee Injury': 'Lesão no joelho',
    'Ankle Injury': 'Lesão no tornozelo',
    'Concussion': 'Concussão',
    'Broken leg': 'Perna fraturada',
    'Coronavirus': 'Covid',
    'Calf Injury': 'Lesão na panturrilha'
  };
  return map[reason] || reason || 'Indisponível';
}

export function renderInjuriesList(injuries, home, away) {
  if (!injuries?.length) {
    return `
      <div class="injuries-list injuries-list--empty">
        <p class="text-sm text-muted">Nenhum desfalque informado para este jogo.</p>
      </div>
    `;
  }
  const split = { home: [], away: [] };
  injuries.forEach(i => {
    if (i.teamId === home.id) split.home.push(i);
    else if (i.teamId === away.id) split.away.push(i);
  });

  const colHTML = (list, team) => `
    <div class="injuries-col">
      <div class="injuries-col__head">
        ${team.flag ? `<span>${team.flag}</span>` : ''}
        <span>${escapeHTML(team.name || '')}</span>
        <span class="injuries-col__count">${list.length}</span>
      </div>
      ${list.length === 0
        ? '<p class="text-xs text-muted">Sem desfalques.</p>'
        : `<ul class="injuries-list">
            ${list.map(i => `
              <li class="injury-item" data-player-card="${escapeHTML(i.playerName || '')}">
                <span class="injury-item__icon" aria-hidden="true">${reasonIcon(i.reason)}</span>
                <span class="injury-item__name">${escapeHTML(i.playerName || '')}</span>
                <span class="injury-item__reason">${escapeHTML(reasonLabelPt(i.reason))}</span>
              </li>
            `).join('')}
          </ul>`
      }
    </div>
  `;

  return `
    <div class="injuries-grid" aria-label="Desfalques">
      ${colHTML(split.home, home)}
      ${colHTML(split.away, away)}
    </div>
  `;
}

// ── Forma recente (últimos 5 W/D/L) ──
function formCells(form) {
  if (!form?.length) {
    return '<span class="text-xs text-muted">Sem dados</span>';
  }
  return form.slice(-5).map(g => {
    const cls = g.result === 'W' ? 'team-form__cell--w'
      : g.result === 'L' ? 'team-form__cell--l'
      : 'team-form__cell--d';
    const tip = `${g.result} · ${g.gf}-${g.ga} vs ${g.opponent || '?'}`;
    return `<span class="team-form__cell ${cls}" title="${escapeHTML(tip)}">${g.result}</span>`;
  }).join('');
}

function aggregate(form) {
  if (!form?.length) return null;
  const last = form.slice(-5);
  const gf = last.reduce((s, g) => s + (g.gf || 0), 0);
  const ga = last.reduce((s, g) => s + (g.ga || 0), 0);
  const w = last.filter(g => g.result === 'W').length;
  return { gf, ga, w, total: last.length };
}

export function renderTeamForm(formHome, formAway, home, away) {
  const aggH = aggregate(formHome);
  const aggA = aggregate(formAway);
  const hasAny = aggH || aggA;
  if (!hasAny) return '';

  const row = (form, agg, team, side) => `
    <div class="team-form__row team-form__row--${side}">
      <div class="team-form__head">
        <span class="team-form__flag">${team.flag || ''}</span>
        <span class="team-form__name">${escapeHTML(team.code)}</span>
      </div>
      <div class="team-form__cells" aria-label="Últimos 5 jogos de ${escapeHTML(team.name)}">
        ${formCells(form)}
      </div>
      <div class="team-form__agg">
        ${agg ? `${agg.w}V · ${agg.gf}/${agg.ga} gols` : '—'}
      </div>
    </div>
  `;

  return `
    <div class="team-form" aria-label="Forma recente de cada time">
      ${row(formHome, aggH, home, 'home')}
      ${row(formAway, aggA, away, 'away')}
    </div>
  `;
}

// ── Breakdown de gols (jogada / pênalti / contra) ──
function classifyGoal(detail = '') {
  const d = detail.toLowerCase();
  if (d.includes('penalty')) return 'pen';
  if (d.includes('own')) return 'og';
  return 'open';
}

export function renderGoalBreakdown(events) {
  const goals = (events || []).filter(e => e.type === 'Goal');
  if (!goals.length) return '';
  const counts = { open: 0, pen: 0, og: 0 };
  goals.forEach(g => { counts[classifyGoal(g.detail)]++; });

  const pills = [
    { lbl: 'Jogada', val: counts.open, cls: 'goal-breakdown__pill--open', ico: '⚽' },
    { lbl: 'Pênalti', val: counts.pen, cls: 'goal-breakdown__pill--pen', ico: '🎯' },
    { lbl: 'Contra', val: counts.og, cls: 'goal-breakdown__pill--og', ico: '🔄' }
  ].filter(p => p.val > 0);

  if (!pills.length) return '';

  return `
    <div class="goal-breakdown" aria-label="Distribuição dos gols">
      ${pills.map(p => `
        <span class="goal-breakdown__pill ${p.cls}">
          <span aria-hidden="true">${p.ico}</span>
          <strong>${p.val}</strong>
          ${escapeHTML(p.lbl)}
        </span>
      `).join('')}
    </div>
  `;
}
