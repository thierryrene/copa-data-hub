import { icon } from '../icons.js';
import { getTodayFixtures, getTeam, getTeamFixtures, getGroupForTeam, FIXTURES } from '../data.js';
import { renderCountdown } from '../components/countdown.js';
import { renderXPBar } from '../components/xpBar.js';
import { renderMatchCard } from '../components/matchCard.js';
import { showToast } from '../components/toast.js';
import { setSEO, schemaWebApp } from '../util/seo.js';
import { matchPhase, matchSlug } from '../util/match.js';
import { escapeHTML } from '../util/html.js';
import { downloadCalendar } from '../util/calendar.js';

// ── Banner de Jogo Ao Vivo ──
function renderLiveBanner() {
  const live = FIXTURES.filter(f => matchPhase(f) === 'live');
  if (!live.length) return '';

  const f = live[0];
  const h = getTeam(f.home), a = getTeam(f.away);
  if (!h || !a) return '';
  const slug = matchSlug(f);

  const otherCount = live.length > 1 ? `<span class="live-banner__extra">+${live.length - 1} ao vivo</span>` : '';

  return `
    <a class="live-banner" href="/partida/${slug}" data-route-link>
      <span class="live-banner__pulse"></span>
      <span class="live-banner__label">AO VIVO</span>
      <span class="live-banner__match">${h.flag} ${h.code} <b>${f.homeScore ?? 0}–${f.awayScore ?? 0}</b> ${a.code} ${a.flag}</span>
      <span class="live-banner__minute">${f.minute ? f.minute + "'" : ''}</span>
      ${otherCount}
      ${icon('chevronRight', 16, 'live-banner__arrow')}
    </a>
  `;
}

// ── Widget "Hoje no Mundial" ──
function renderTodayWidget() {
  const today = getTodayFixtures();
  if (!today.length) return '';

  const liveCount = today.filter(f => matchPhase(f) === 'live').length;
  const finishedCount = today.filter(f => matchPhase(f) === 'finished').length;
  const upcomingCount = today.filter(f => matchPhase(f) === 'pre').length;

  let subtitle = `${today.length} jogo${today.length > 1 ? 's' : ''}`;
  if (liveCount > 0) subtitle += ` · <span style="color:var(--color-rose)">${liveCount} ao vivo</span>`;
  if (finishedCount > 0) subtitle += ` · ${finishedCount} encerrado${finishedCount > 1 ? 's' : ''}`;
  if (upcomingCount > 0 && !liveCount) subtitle += ` · Primeiro às ${today.filter(f => matchPhase(f) === 'pre')[0]?.time}`;

  return `
    <div class="today-widget">
      <div class="today-widget__header">
        <span class="today-widget__badge">HOJE</span>
        <span class="today-widget__count">${subtitle}</span>
      </div>
      <div class="today-widget__matches">
        ${today.map(f => {
          const h = getTeam(f.home), a = getTeam(f.away);
          if (!h || !a) return '';
          const phase = matchPhase(f);
          const slug = matchSlug(f);

          let centerContent, statusTag;
          if (phase === 'finished') {
            centerContent = `<b>${f.homeScore ?? 0}–${f.awayScore ?? 0}</b>`;
            statusTag = `<span class="today-widget__status today-widget__status--fin">FIM</span>`;
          } else if (phase === 'live') {
            centerContent = `<b class="today-widget__score--live">${f.homeScore ?? 0}–${f.awayScore ?? 0}</b>`;
            statusTag = `<span class="today-widget__status today-widget__status--live">${f.minute ? f.minute + "'" : '●'}</span>`;
          } else {
            centerContent = `<span class="today-widget__time">${f.time}</span>`;
            statusTag = '';
          }

          return `
            <a class="today-widget__match" href="/partida/${slug}" data-route-link>
              <span class="today-widget__team">${h.flag} ${h.code}</span>
              <span class="today-widget__center">${centerContent}</span>
              <span class="today-widget__team today-widget__team--right">${a.code} ${a.flag}</span>
              ${statusTag}
            </a>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ── Estatísticas do Torneio ──
function renderTournamentNumbers() {
  const played = FIXTURES.filter(f => matchPhase(f) === 'finished');
  const totalGoals = played.reduce((s, f) => s + (f.homeScore ?? 0) + (f.awayScore ?? 0), 0);
  const avgGoals = played.length ? (totalGoals / played.length).toFixed(1) : '—';

  // Artilheiros por seleção (aproximado por fixture)
  const goalsByTeam = {};
  played.forEach(f => {
    goalsByTeam[f.home] = (goalsByTeam[f.home] || 0) + (f.homeScore ?? 0);
    goalsByTeam[f.away] = (goalsByTeam[f.away] || 0) + (f.awayScore ?? 0);
  });
  const topEntry = Object.entries(goalsByTeam).sort((a, b) => b[1] - a[1])[0];
  const topTeam = topEntry ? getTeam(topEntry[0]) : null;
  const topGoals = topEntry ? topEntry[1] : 0;

  return `
    <div class="tournament-numbers">
      <div class="tournament-numbers__title">${icon('barChart', 16)} Copa em Números</div>
      <div class="tournament-numbers__grid">
        <div class="tournament-numbers__stat">
          <span class="tournament-numbers__val" style="color:var(--color-gold)">${played.length}</span>
          <span class="tournament-numbers__lbl">jogos</span>
        </div>
        <div class="tournament-numbers__stat">
          <span class="tournament-numbers__val" style="color:var(--color-emerald)">${totalGoals}</span>
          <span class="tournament-numbers__lbl">gols</span>
        </div>
        <div class="tournament-numbers__stat">
          <span class="tournament-numbers__val" style="color:var(--color-blue)">${avgGoals}</span>
          <span class="tournament-numbers__lbl">gols/jogo</span>
        </div>
        <div class="tournament-numbers__stat">
          <span class="tournament-numbers__val" style="color:var(--color-rose)">
            ${topTeam ? `${topTeam.flag} ${topGoals}` : '48'}
          </span>
          <span class="tournament-numbers__lbl">${topTeam ? 'artilheiro' : 'seleções'}</span>
        </div>
      </div>
    </div>
  `;
}

// ── Feed "Meu Copa" ──
function renderMeuCopa(state) {
  const favCode = state.user.favoriteTeam;
  if (!favCode) return '';

  const team = getTeam(favCode);
  if (!team) return '';

  const teamFixtures = getTeamFixtures(favCode);
  const groupInfo = getGroupForTeam(favCode);

  // Próximo jogo
  const nextFixture = teamFixtures.find(f => matchPhase(f) === 'pre');
  // Último resultado
  const lastFinished = [...teamFixtures].reverse().find(f => matchPhase(f) === 'finished');

  // Posição no grupo (calcular pontos)
  let groupPos = '—', groupPts = 0;
  if (groupInfo) {
    const standings = groupInfo.teams.map(code => {
      const fixtures = FIXTURES.filter(f => f.group === groupInfo.id && (f.home === code || f.away === code));
      let pts = 0;
      fixtures.forEach(f => {
        if (f.homeScore == null) return;
        const isHome = f.home === code;
        const gs = isHome ? f.homeScore : f.awayScore;
        const gc = isHome ? f.awayScore : f.homeScore;
        if (gs > gc) pts += 3; else if (gs === gc) pts += 1;
      });
      return { code, pts };
    }).sort((a, b) => b.pts - a.pts);
    const posIdx = standings.findIndex(s => s.code === favCode);
    groupPos = posIdx >= 0 ? `${posIdx + 1}º` : '—';
    groupPts = standings.find(s => s.code === favCode)?.pts ?? 0;
  }

  const nextMatch = nextFixture ? (() => {
    const opp = getTeam(nextFixture.home === favCode ? nextFixture.away : nextFixture.home);
    const side = nextFixture.home === favCode ? 'Casa' : 'Fora';
    const date = new Date(`${nextFixture.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    return `
      <a class="meu-copa__match" href="/partida/${getTeam(nextFixture.home).slug}-vs-${getTeam(nextFixture.away).slug}-${nextFixture.date}" data-route-link>
        ${icon('calendar', 14)} Próximo: ${opp?.flag} ${escapeHTML(opp?.code || '')} · ${date} (${side})
      </a>
    `;
  })() : `<span class="text-xs text-muted">Sem próximos jogos</span>`;

  const lastResult = lastFinished ? (() => {
    const opp = getTeam(lastFinished.home === favCode ? lastFinished.away : lastFinished.home);
    const isHome = lastFinished.home === favCode;
    const gs = isHome ? lastFinished.homeScore : lastFinished.awayScore;
    const gc = isHome ? lastFinished.awayScore : lastFinished.homeScore;
    const result = gs > gc ? 'V' : gs < gc ? 'D' : 'E';
    const cls = result === 'V' ? 'win' : result === 'D' ? 'loss' : 'draw';
    return `
      <span class="meu-copa__result">
        ${icon('check', 14)} Último: ${opp?.flag} ${escapeHTML(opp?.code || '')} ${gs}–${gc}
        <span class="form-strip__pill form-strip__pill--${cls}">${result}</span>
      </span>
    `;
  })() : `<span class="text-xs text-muted">Nenhum jogo disputado</span>`;

  return `
    <div class="meu-copa card card--gold">
      <div class="meu-copa__header">
        <span class="meu-copa__flag">${team.flag}</span>
        <div>
          <div class="meu-copa__name">${escapeHTML(team.name)}</div>
          <div class="meu-copa__sub">Meu Copa</div>
        </div>
        <div class="meu-copa__pos">
          <span class="meu-copa__pos-num">${groupPos}</span>
          <span class="meu-copa__pos-lbl">Grupo ${groupInfo?.id || '?'} · ${groupPts} pts</span>
        </div>
      </div>
      <div class="meu-copa__info">
        ${nextMatch}
        ${lastResult}
      </div>
    </div>
  `;
}

function render(state) {
  const upcoming = FIXTURES
    .filter(f => matchPhase(f) === 'pre')
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .slice(0, 4);
  const matchCards = upcoming.map(f => {
    const pred = state.user.predictions.find(p => p.fixtureId === f.id) || null;
    return renderMatchCard(f, pred);
  }).join('');

  const pendingInView = upcoming.filter(f => !state.user.predictions.find(p => p.fixtureId === f.id)).length;

  const isTournamentStarted = Date.now() >= new Date('2026-06-11T20:00:00-04:00').getTime();

  return `
    ${renderLiveBanner()}
    ${isTournamentStarted ? renderTodayWidget() : renderCountdown()}
    ${isTournamentStarted ? renderTournamentNumbers() : ''}
    ${renderXPBar(state)}
    ${renderMeuCopa(state)}

    <a href="/campeonatos" data-route-link style="text-decoration: none; color: inherit; display: block; margin-bottom: var(--space-xl);">
      <div class="card card--interactive" style="background: linear-gradient(135deg, rgba(30,58,138,0.2), rgba(10,14,26,0.95)); border: 1px solid rgba(147,197,253,0.2);">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-md">
            <span style="font-size: 1.5rem;">⭐</span>
            <div>
              <div class="font-display font-bold" style="color: var(--color-ucl-star, #ffd700);">Campeonatos Ao Vivo</div>
              <div class="text-sm text-muted">Champions League, Brasileirão, Premier League</div>
            </div>
          </div>
          ${icon('chevronRight', 20, 'text-muted')}
        </div>
      </div>
    </a>

    ${!isTournamentStarted ? `
      <div class="mt-xl">
        <div class="section-title">${icon('barChart', 20)} O Torneio</div>
        <div class="fanzone-stats">
          <div class="fanzone-stat">
            <span class="fanzone-stat__value fanzone-stat__value--gold">48</span>
            <span class="fanzone-stat__label">Seleções</span>
          </div>
          <div class="fanzone-stat">
            <span class="fanzone-stat__value fanzone-stat__value--emerald">104</span>
            <span class="fanzone-stat__label">Jogos</span>
          </div>
          <div class="fanzone-stat">
            <span class="fanzone-stat__value fanzone-stat__value--blue">16</span>
            <span class="fanzone-stat__label">Estádios</span>
          </div>
          <div class="fanzone-stat">
            <span class="fanzone-stat__value fanzone-stat__value--rose">3</span>
            <span class="fanzone-stat__label">Países</span>
          </div>
        </div>
      </div>
    ` : ''}

    <h1 class="section-title">
      ${icon('calendar', 20)} Próximos Jogos
      ${pendingInView > 0 ? `<span class="pending-badge">${pendingInView} sem palpite</span>` : ''}
    </h1>
    <div class="matches-list matches-list--grid">${matchCards || '<p class="text-muted text-sm" style="padding: var(--space-md)">Todos os jogos encerrados.</p>'}</div>

    <div class="mt-xl">
      <div class="section-title">${icon('trophy', 20)} Acesse as Seções</div>
      <div class="matches-list">
        <div class="card card--interactive card--gold" data-nav="grupos">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-md">
              ${icon('shield', 24, 'text-gold')}
              <div>
                <div class="font-display font-bold">Grupos & Classificação</div>
                <div class="text-sm text-muted">12 grupos, 48 seleções</div>
              </div>
            </div>
            ${icon('chevronRight', 20, 'text-muted')}
          </div>
        </div>

        <div class="card card--interactive" data-nav="jogos">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-md">
              ${icon('target', 24, 'text-blue')}
              <div>
                <div class="font-display font-bold">Match Center</div>
                <div class="text-sm text-muted">Calendário completo dos 104 jogos</div>
              </div>
            </div>
            ${icon('chevronRight', 20, 'text-muted')}
          </div>
        </div>

        <div class="card card--interactive" data-nav="fanzone">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-md">
              ${icon('gamepad', 24, 'text-emerald')}
              <div>
                <div class="font-display font-bold">FanZone</div>
                <div class="text-sm text-muted">Bolão, trivia e ranking</div>
              </div>
            </div>
            ${icon('chevronRight', 20, 'text-muted')}
          </div>
        </div>
      </div>
    </div>

    <div class="calendar-import mt-xl">
      <div class="calendar-import__icon">
        ${icon('calendar', 28)}
      </div>
      <div class="calendar-import__content">
        <div class="calendar-import__title">Leve o Mundial no seu calendário</div>
        <p class="calendar-import__description">Importe todas as 104 partidas direto para o Google Calendar, Apple Calendar ou Outlook. Receba lembretes antes de cada jogo.</p>
      </div>
      <button class="btn btn--gold btn--sm calendar-import__btn" id="calendar-import-btn" type="button">
        ${icon('download', 16)} Importar Calendário
      </button>
    </div>
  `;
}

function bindEvents(_state, { router }) {
  setSEO({
    title: 'Dados, Previsões e Bolão do Mundial',
    description: 'Acompanhe o Mundial 2026 com dados ao vivo, previsões de IA, simulador de chaveamento e bolão gamificado. 48 seleções, 104 jogos, 16 estádios.',
    canonical: '/',
    keywords: 'mundial 2026, copa do mundo, futebol, bolão, previsões, 48 seleções, EUA, Canadá, México',
    jsonLd: schemaWebApp()
  });

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => router.navigate(el.dataset.nav));
  });

  const notifyBtn = document.getElementById('countdown-notify-btn');
  if (notifyBtn) {
    notifyBtn.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        showToast('Notificações não suportadas neste navegador', 'error');
        return;
      }
      if (Notification.permission === 'granted') {
        showToast('✓ Notificações já ativadas', 'success');
        return;
      }
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        showToast('🔔 Você será avisado sobre o Mundial!', 'success');
      } else {
        showToast('Permissão não concedida', 'error');
      }
    });
  }

  const calendarBtn = document.getElementById('calendar-import-btn');
  if (calendarBtn) {
    calendarBtn.addEventListener('click', () => {
      try {
        downloadCalendar();
        showToast('📅 Calendário exportado! Abra o arquivo .ics para importar', 'success');
      } catch (err) {
        console.error('[calendar]', err);
        showToast('Erro ao gerar calendário', 'error');
      }
    });
  }

  const shareBtn = document.getElementById('countdown-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'Copa Data Hub — Mundial 2026',
        text: 'Acompanhe o Mundial 2026 comigo! Dados, previsões e bolão gamificado.',
        url: window.location.origin
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(shareData.url);
          showToast('🔗 Link copiado!', 'success');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          showToast('Não foi possível compartilhar', 'error');
        }
      }
    });
  }
}

export default { render, bindEvents };
