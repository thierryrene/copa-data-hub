import { icon } from '../icons.js';
import { escapeHTML } from '../util/html.js';
import { setSEO, schemaSportsEvent } from '../util/seo.js';
import { listLeagues, getLeague } from '../data/leagues.js';
import { fetchLeagueFixtures, fetchLeagueStandings, fetchLeagueTopScorers } from '../api/leagues.js';
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

  return `
    <button class="team-page__back" id="campeonatos-back-btn" type="button" aria-label="Voltar">
      ${icon('arrowLeft', 18)} <span>Voltar</span>
    </button>

    <section class="league-hero" data-league-slug="${escapeHTML(league.slug)}" style="${headerStyle}">
      <div class="league-hero__emoji">${league.emoji}</div>
      <div class="league-hero__info">
        <div class="league-hero__kicker">Temporada ${league.season}/${String(league.season + 1).slice(2)}</div>
        <h1 class="league-hero__name">${escapeHTML(league.name)}</h1>
        <div class="league-hero__country">${league.countryFlag} ${escapeHTML(league.country)}</div>
      </div>
    </section>

    <div class="sub-tabs" id="league-tabs">
      <button class="sub-tab active" data-tab="jogos">⚽ Próximos Jogos</button>
      <button class="sub-tab" data-tab="classificacao">🏆 Classificação</button>
      <button class="sub-tab" data-tab="artilheiros">🥇 Artilheiros</button>
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
  const slug = (params?.[0] || '').toLowerCase();

  if (!slug) return renderHub();

  const league = getLeague(slug);
  if (!league) return renderNotFound(slug);

  return renderLeaguePage(league);
}

async function loadLeagueData(league) {
  const fixturesEl = document.getElementById('league-tab-jogos');
  const standingsEl = document.getElementById('league-tab-classificacao');
  const scorersEl = document.getElementById('league-tab-artilheiros');

  const [fixtures, standings, scorers] = await Promise.all([
    fetchLeagueFixtures(league, { next: 10 }).catch(() => []),
    fetchLeagueStandings(league).catch(() => []),
    fetchLeagueTopScorers(league, { limit: 10 }).catch(() => [])
  ]);

  const currentHero = document.querySelector('.league-hero');
  if (!currentHero || currentHero.dataset.leagueSlug !== league.slug) return;

  if (fixturesEl) fixturesEl.innerHTML = renderLeagueFixtureList(fixtures);
  if (standingsEl) standingsEl.innerHTML = renderStandingsTable(standings);
  if (scorersEl) scorersEl.innerHTML = renderTopScorersList(scorers);
}

function bindEvents(_state, { router, params }) {
  const slug = (params?.[0] || '').toLowerCase();

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

  loadLeagueData(league);
}

export default { render, bindEvents };
