import { escapeHTML } from '../../util/html.js';
import { matchPhase, timeUntilKickoff } from '../../util/match.js';
import { getStadium } from '../../data.js';

export function renderMatchHero(fixture, home, away) {
  const phase = matchPhase(fixture);
  const stadium = getStadium(fixture.stadium);

  let center = '';
  if (phase === 'pre') {
    const t = timeUntilKickoff(fixture);
    center = t ? `
      <div class="match-hero__countdown" id="match-countdown" data-kickoff="${fixture.date}T${fixture.time}">
        <span><b id="cd-d">${t.days}</b>d</span>
        <span><b id="cd-h">${t.hours}</b>h</span>
        <span><b id="cd-m">${t.mins}</b>m</span>
        <span><b id="cd-s">${t.secs}</b>s</span>
      </div>
      <div class="match-hero__kickoff">${fixture.time} · ${new Date(`${fixture.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</div>
    ` : `<div class="match-hero__live">⚽ AO VIVO</div>`;
  } else if (phase === 'live') {
    center = `
      <div class="match-hero__score">
        <span>${fixture.homeScore ?? 0}</span>
        <span class="match-hero__sep">:</span>
        <span>${fixture.awayScore ?? 0}</span>
      </div>
      <div class="match-hero__live">🔴 AO VIVO</div>
    `;
  } else {
    center = `
      <div class="match-hero__score">
        <span>${fixture.homeScore ?? 0}</span>
        <span class="match-hero__sep">:</span>
        <span>${fixture.awayScore ?? 0}</span>
      </div>
      <div class="match-hero__finished">ENCERRADO</div>
    `;
  }

  return `
    <section class="match-hero match-hero--${phase}">
      <div class="match-hero__teams">
        <a class="match-hero__team" href="/selecoes/${home.slug}" data-route-link>
          <span class="match-hero__flag">${home.flag}</span>
          <span class="match-hero__name">${escapeHTML(home.name)}</span>
        </a>
        <div class="match-hero__center">${center}</div>
        <a class="match-hero__team" href="/selecoes/${away.slug}" data-route-link>
          <span class="match-hero__flag">${away.flag}</span>
          <span class="match-hero__name">${escapeHTML(away.name)}</span>
        </a>
      </div>
      <div class="match-hero__meta">
        Grupo ${fixture.group}${stadium ? ` · ${escapeHTML(stadium.name)}, ${escapeHTML(stadium.city)}` : ''}
      </div>
    </section>
  `;
}

export function tickCountdown(fixture) {
  const root = document.getElementById('match-countdown');
  if (!root) return;
  const t = timeUntilKickoff(fixture);
  if (!t) return;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('cd-d', t.days);
  set('cd-h', t.hours);
  set('cd-m', t.mins);
  set('cd-s', t.secs);
}
