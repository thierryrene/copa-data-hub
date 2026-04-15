// CopaDataHub 2026 — Reusable UI Components

import { icon } from './icons.js';
import { TEAMS, STADIUMS, getTeam, getStadium } from './data.js';
import { getXPProgress } from './state.js';

/**
 * Render the countdown timer to tournament start
 */
export function renderCountdown(targetDate = '2026-06-11T20:00:00-04:00') {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return `
      <div class="countdown-hero">
        <div class="countdown-hero__label">O maior torneio do mundo</div>
        <div class="countdown-hero__event">⚽ Em andamento!</div>
      </div>
    `;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  return `
    <div class="countdown-hero">
      <div class="countdown-hero__label">Faltam para o maior torneio do mundo</div>
      <div class="countdown-hero__event">🏆 11 de Junho de 2026</div>
      <div class="countdown-grid">
        <div class="countdown-item">
          <span class="countdown-number" id="cd-days">${days}</span>
          <span class="countdown-label">Dias</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number" id="cd-hours">${hours}</span>
          <span class="countdown-label">Horas</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number" id="cd-mins">${mins}</span>
          <span class="countdown-label">Min</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number" id="cd-secs">${secs}</span>
          <span class="countdown-label">Seg</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Update countdown numbers in place (no re-render)
 */
export function updateCountdown(targetDate = '2026-06-11T20:00:00-04:00') {
  const target = new Date(targetDate).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return;

  const values = {
    'cd-days': Math.floor(diff / (1000 * 60 * 60 * 24)),
    'cd-hours': Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    'cd-mins': Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    'cd-secs': Math.floor((diff % (1000 * 60)) / 1000)
  };

  for (const [id, val] of Object.entries(values)) {
    const el = document.getElementById(id);
    if (el && el.textContent !== String(val)) {
      el.textContent = val;
      el.classList.add('animated');
      setTimeout(() => el.classList.remove('animated'), 400);
    }
  }
}

/**
 * Render XP progress bar
 */
export function renderXPBar(state) {
  const { level, xp, percent } = getXPProgress(state);
  return `
    <div class="xp-bar-container">
      <div class="xp-bar-header">
        <span class="xp-bar-level">${icon('zap', 16)} Nível ${level}</span>
        <span class="xp-bar-points">${xp} XP</span>
      </div>
      <div class="xp-bar-track">
        <div class="xp-bar-fill" style="width: ${percent}%"></div>
      </div>
    </div>
  `;
}

/**
 * Render a match card
 */
export function renderMatchCard(fixture) {
  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  const stadium = getStadium(fixture.stadium);
  const isLive = fixture.status.startsWith('LIVE');
  const isFinished = fixture.status === 'FT';

  const dateStr = new Date(`${fixture.date}T${fixture.time}`).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short'
  });

  let centerContent;
  if (isLive || isFinished) {
    centerContent = `
      <div class="match-card__score">
        <span>${fixture.homeScore}</span>
        <span class="match-card__score-sep">:</span>
        <span>${fixture.awayScore}</span>
      </div>
    `;
  } else {
    centerContent = `<div class="match-card__vs">${fixture.time}</div>`;
  }

  let statusHTML;
  if (isLive) {
    statusHTML = `<span class="match-card__status live">AO VIVO</span>`;
  } else if (isFinished) {
    statusHTML = `<span class="match-card__status">ENCERRADO</span>`;
  } else {
    statusHTML = `<span class="match-card__status">${dateStr}</span>`;
  }

  return `
    <div class="card card--interactive match-card" data-fixture="${fixture.id}">
      <div class="match-card__header">
        <span class="match-card__group">Grupo ${fixture.group}</span>
        ${statusHTML}
      </div>
      <div class="match-card__teams">
        <div class="match-card__team">
          <span class="match-card__flag">${home.flag}</span>
          <span class="match-card__name">${home.code}</span>
        </div>
        ${centerContent}
        <div class="match-card__team">
          <span class="match-card__flag">${away.flag}</span>
          <span class="match-card__name">${away.code}</span>
        </div>
      </div>
      <div class="match-card__footer">
        ${icon('mapPin', 14)} ${stadium ? stadium.city : '—'}
      </div>
    </div>
  `;
}

/**
 * Render a stat comparison bar
 */
export function renderStatBar(label, homeVal, awayVal, isPercent = false) {
  const total = homeVal + awayVal || 1;
  const homePct = Math.round((homeVal / total) * 100);
  const awayPct = 100 - homePct;
  const suffix = isPercent ? '%' : '';

  return `
    <div class="stat-bar">
      <div class="stat-bar__header">
        <span class="stat-bar__values">
          <span class="stat-bar__value--home">${homeVal}${suffix}</span>
        </span>
        <span class="stat-bar__label">${label}</span>
        <span class="stat-bar__values">
          <span class="stat-bar__value--away">${awayVal}${suffix}</span>
        </span>
      </div>
      <div class="stat-bar__track">
        <div class="stat-bar__fill-home" style="width: ${homePct}%"></div>
        <div class="stat-bar__fill-away" style="width: ${awayPct}%"></div>
      </div>
    </div>
  `;
}

/**
 * Render the prediction bar (AI probability)
 */
export function renderPredictionBar(homePct, drawPct, awayPct, homeCode, awayCode) {
  return `
    <div class="prediction-bar">
      <div class="prediction-bar__title">
        ${icon('zap', 16, 'text-gold')} Previsão IA
      </div>
      <div class="prediction-bar__track">
        <div class="prediction-bar__segment prediction-bar__segment--home" style="width: ${homePct}%">
          ${homePct}%
        </div>
        <div class="prediction-bar__segment prediction-bar__segment--draw" style="width: ${drawPct}%">
          ${drawPct}%
        </div>
        <div class="prediction-bar__segment prediction-bar__segment--away" style="width: ${awayPct}%">
          ${awayPct}%
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a group standings table
 */
export function renderGroupTable(groupId, teamCodes) {
  // Generate mock standings
  const standings = teamCodes.map((code, i) => {
    const team = getTeam(code);
    return {
      code,
      team,
      pos: i + 1,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0
    };
  });

  const rows = standings.map((s, i) => {
    let rowClass = '';
    if (i < 2) rowClass = 'qualified';
    else if (i === 2) rowClass = 'third';

    return `
      <tr class="${rowClass}">
        <td>
          <div class="team-cell">
            <span class="team-cell__pos">${s.pos}</span>
            <span class="team-cell__flag">${s.team.flag}</span>
            ${s.team.code}
          </div>
        </td>
        <td>${s.played}</td>
        <td>${s.won}</td>
        <td>${s.drawn}</td>
        <td>${s.lost}</td>
        <td>${s.gd > 0 ? '+' : ''}${s.gd}</td>
        <td><strong>${s.pts}</strong></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card group-card">
      <div class="group-card__title">
        ${icon('shield', 18, 'text-gold')} Grupo ${groupId}
      </div>
      <table class="group-table">
        <thead>
          <tr>
            <th>Seleção</th>
            <th>J</th>
            <th>V</th>
            <th>E</th>
            <th>D</th>
            <th>SG</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Show a toast notification
 */
export function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const iconName = type === 'success' ? 'check' : type === 'error' ? 'x' : 'zap';
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon toast__icon--${type}">${icon(iconName, 20)}</span>
    <span class="toast__message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Render a stadium card
 */
export function renderStadiumCard(stadium) {
  const countryClass = stadium.country === 'EUA' ? 'usa' : stadium.country === 'México' ? 'mex' : 'can';
  const countryFlag = stadium.country === 'EUA' ? '🇺🇸' : stadium.country === 'México' ? '🇲🇽' : '🇨🇦';

  return `
    <div class="card stadium-card">
      <div class="stadium-card__icon stadium-card__icon--${countryClass}">${countryFlag}</div>
      <div class="stadium-card__info">
        <div class="stadium-card__name">${stadium.name}</div>
        <div class="stadium-card__detail">
          ${icon('mapPin', 12)} ${stadium.city} · ${stadium.capacity.toLocaleString('pt-BR')} lugares
        </div>
      </div>
      ${stadium.isFinal ? '<span class="stadium-card__badge">🏆 Final</span>' : ''}
    </div>
  `;
}
