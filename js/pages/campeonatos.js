import { icon } from '../icons.js';
import { escapeHTML } from '../util/html.js';
import { setSEO, schemaSportsEvent } from '../util/seo.js';
import { listLeagues, getLeague } from '../data/leagues.js';
import { fetchLeagueFixtures, fetchLeagueStandings, fetchLeagueTopScorers, ApiError } from '../api/leagues.js';
import { renderLeagueCard } from '../components/leagueCard.js';
import { renderLeagueFixtureList, renderLeagueFixtureSkeleton } from '../components/leagueFixtureList.js';
import { renderStandingsTable, renderStandingsSkeleton } from '../components/standingsTable.js';
import { renderTopScorersList, renderTopScorersSkeleton } from '../components/topScorersList.js';

function renderHub() {
  const leagues = listLeagues();
  return `
    <h1 class="section-title">${icon('trophy', 20)} Campeonatos Ao Vivo</h1>
    <p class="section-subtitle">Acompanhe as principais competições de futebol do mundo com dados reais atualizados.</p>

    <div class="leagues-hub">
      ${leagues.map(renderLeagueCard).join('')}
    </div>

    <div class="mt-xl">
      <p class="text-sm text-muted">
        ${icon('info', 14)} Dados fornecidos pela API-Football (api-sports.io). Atualizações em tempo real durante partidas.
      </p>
    </div>
  `;
}

function renderNotFound(slug) {
  return `
    <div class="team-page__notfound">
      <div class="section-title">${icon('info', 20)} Campeonato não encontrado</div>
      <p class="section-subtitle">O campeonato <strong>${escapeHTML(slug)}</strong> não está disponível.</p>
      <a class="btn btn--primary" href="/campeonatos" data-route-link>${icon('trophy', 16)} Ver campeonatos</a>
    </div>
  `;
}

function renderLeaguePage(league) {
  const headerStyle = `--league-color: ${league.color}; --league-accent: ${league.accent};`;
  const isFinished = league.status === 'finished';
  const fixturesLabel = isFinished ? '📋 Últimos Jogos' : '⚽ Próximos Jogos';
  const kickerLabel = isFinished
    ? `Temporada ${league.season} · Encerrada`
    : `Temporada ${league.season}/${String(league.season + 1).slice(2)}`;

  return `
    <button class="team-page__back" id="campeonatos-back-btn" type="button" aria-label="Voltar">
      ${icon('arrowLeft', 18)} <span>Voltar</span>
    </button>

    <section class="league-hero" data-league-slug="${escapeHTML(league.slug)}" data-league-status="${league.status}" style="${headerStyle}">
      <div class="league-hero__emoji">${league.emoji}</div>
      <div class="league-hero__info">
        <div class="league-hero__kicker">${kickerLabel}</div>
        <h1 class="league-hero__name">${escapeHTML(league.name)}</h1>
        <div class="league-hero__country">${league.countryFlag} ${escapeHTML(league.country)}</div>
      </div>
    </section>

    <div class="sub-tabs" id="league-tabs">
      <button class="sub-tab active" data-tab="jogos">${fixturesLabel}</button>
      <button class="sub-tab" data-tab="classificacao">🏆 Classificação</button>
      <button class="sub-tab" data-tab="artilheiros">🥇 Artilheiros</button>
      <button class="sub-tab sub-tab--refresh" id="league-refresh-btn" type="button" aria-label="Atualizar dados">🔄</button>
    </div>

    <div class="league-tab-content" id="league-tab-jogos">
      ${renderLeagueFixtureSkeleton()}
    </div>

    <div class="league-tab-content" id="league-tab-classificacao" style="display:none">
      ${renderStandingsSkeleton()}
    </div>

    <div class="league-tab-content" id="league-tab-artilheiros" style="display:none">
      ${renderTopScorersSkeleton()}
    </div>
  `;
}

function render(_state, params) {
  const slug = String(params?.slug || '').toLowerCase();

  if (!slug) return renderHub();

  const league = getLeague(slug);
  if (!league) return renderNotFound(slug);

  return renderLeaguePage(league);
}

function renderApiError(err) {
  const msg = err instanceof ApiError ? err.message : 'Erro inesperado ao carregar dados.';
  const isNoKey = err instanceof ApiError && err.code === 'NO_KEY';
  return `
    <div class="league-error">
      <span class="league-error__icon">⚠️</span>
      <p class="league-error__msg">${escapeHTML(msg)}</p>
      ${isNoKey ? `<a class="btn btn--primary btn--sm" href="/configuracoes" data-route-link>Ir para Configurações</a>` : ''}
    </div>
  `;
}

async function loadLeagueData(league, { bustCache = false } = {}) {
  const fixturesEl = document.getElementById('league-tab-jogos');
  const standingsEl = document.getElementById('league-tab-classificacao');
  const scorersEl = document.getElementById('league-tab-artilheiros');
  const refreshBtn = document.getElementById('league-refresh-btn');

  if (bustCache) {
    const prefix = `cdh_league_`;
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(prefix) && k.includes(`_${league.apiId}_`))
      .forEach(k => sessionStorage.removeItem(k));
  }

  if (refreshBtn) refreshBtn.disabled = true;

  const fixtureOptions = league.status === 'finished'
    ? { mode: 'last', last: 10 }
    : { mode: 'mixed', last: 5, next: 10 };

  const results = await Promise.allSettled([
    fetchLeagueFixtures(league, fixtureOptions),
    fetchLeagueStandings(league),
    fetchLeagueTopScorers(league, { limit: 10 })
  ]);

  const currentHero = document.querySelector('.league-hero');
  if (!currentHero || currentHero.dataset.leagueSlug !== league.slug) return;

  const [fixturesResult, standingsResult, scorersResult] = results;

  if (fixturesEl) {
    fixturesEl.innerHTML = fixturesResult.status === 'fulfilled'
      ? renderLeagueFixtureList(fixturesResult.value)
      : renderApiError(fixturesResult.reason);
  }
  if (standingsEl) {
    standingsEl.innerHTML = standingsResult.status === 'fulfilled'
      ? renderStandingsTable(standingsResult.value)
      : renderApiError(standingsResult.reason);
  }
  if (scorersEl) {
    scorersEl.innerHTML = scorersResult.status === 'fulfilled'
      ? renderTopScorersList(scorersResult.value)
      : renderApiError(scorersResult.reason);
  }

  if (refreshBtn) refreshBtn.disabled = false;
}

function bindEvents(_state, { router, params }) {
  const slug = String(params?.slug || '').toLowerCase();

  if (!slug) {
    setSEO({
      title: 'Campeonatos Ao Vivo — Champions League, Brasileirão e Premier League',
      description: 'Acompanhe os principais campeonatos de futebol do mundo: UEFA Champions League, Brasileirão Série A e Premier League. Jogos, classificação e artilheiros.',
      canonical: '/campeonatos',
      keywords: 'campeonatos futebol, champions league, brasileirão, premier league, jogos ao vivo'
    });
    return;
  }

  const league = getLeague(slug);
  if (!league) {
    setSEO({
      title: 'Campeonato não encontrado',
      description: 'O campeonato solicitado não está disponível.',
      canonical: `/campeonatos/${slug}`
    });
    return;
  }

  setSEO({
    title: league.name,
    description: league.description,
    canonical: `/campeonatos/${league.slug}`,
    keywords: league.keywords,
    type: 'website',
    jsonLd: schemaSportsEvent(league)
  });

  const backBtn = document.getElementById('campeonatos-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else router.navigate('campeonatos');
    });
  }

  const tabs = document.getElementById('league-tabs');
  if (tabs) {
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.sub-tab');
      if (!btn) return;
      const tab = btn.dataset.tab;
      tabs.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.league-tab-content').forEach((el) => {
        el.style.display = el.id === `league-tab-${tab}` ? '' : 'none';
      });
    });
  }

  const refreshBtn = document.getElementById('league-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadLeagueData(league, { bustCache: true }));
  }

  loadLeagueData(league);
}

export default { render, bindEvents };
