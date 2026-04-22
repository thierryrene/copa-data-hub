import { icon } from '../icons.js';
import { getTeam, getTeamBySlug, getTeamFixtures, getGroupForTeam } from '../data.js';
import { applyMockToFixtures } from '../util/mockMode.js';
import { renderTeamChip } from '../components/teamChip.js';
import { renderTeamFixtureRow } from '../components/teamFixtureRow.js';
import { renderLineupField, renderLineupSkeleton } from '../components/lineupField.js';
import { renderSquadList, renderSquadSkeleton } from '../components/squadList.js';
import { showToast } from '../components/toast.js';
import { escapeHTML, isTrustedWikiUrl } from '../util/html.js';
import { setFavoriteTeam } from '../state.js';
import { loadTeamDossier, getTeamDossierCached } from '../api/teamLoader.js';
import { loadEnrichedTeams, getTeamEnriched } from '../api/enriched.js';
import { fetchSquad, buildLineup } from '../api/squad.js';
import { setSEO, schemaSportsTeam } from '../util/seo.js';

function getNextMatch(teamCode, fixtures) {
  const now = Date.now();
  const upcoming = fixtures.filter(f => {
    if (f.status === 'FT') return false;
    return new Date(`${f.date}T${f.time}`).getTime() >= now || f.status === 'SCHEDULED';
  });
  return upcoming[0] || fixtures[fixtures.length - 1] || null;
}

function renderLineupSection(team, teamFixtures) {
  const nextMatch = getNextMatch(team.code, teamFixtures);
  const opponent = nextMatch
    ? getTeam(nextMatch.home === team.code ? nextMatch.away : nextMatch.home)
    : null;

  const matchLabel = opponent
    ? `Próxima partida: vs ${opponent.flag} ${escapeHTML(opponent.name)}`
    : 'Provável escalação';

  const dateLabel = nextMatch
    ? new Date(`${nextMatch.date}T${nextMatch.time}`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : '';

  return `
    <div class="team-page__section" id="team-lineup-section">
      <div class="section-title">${icon('users', 18)} Escalação Provável</div>
      <p class="section-subtitle">${matchLabel}${dateLabel ? ` · ${dateLabel}` : ''}</p>
      <div id="team-lineup-field">
        ${renderLineupSkeleton()}
      </div>
    </div>

    <div class="team-page__section" id="team-squad-section">
      <div class="section-title">${icon('shield', 18)} Elenco Completo</div>
      <div id="team-squad-list">
        ${renderSquadSkeleton()}
      </div>
    </div>
  `;
}

function renderNotFound(rawSlug) {
  return `
    <div class="team-page__notfound">
      <div class="section-title">${icon('info', 20)} Seleção não encontrada</div>
      <p class="section-subtitle">A seleção <strong>${escapeHTML(String(rawSlug || ''))}</strong> não corresponde a uma das 48 seleções.</p>
      <a class="btn btn--primary" href="/grupos" data-route-link>${icon('shield', 16)} Voltar aos grupos</a>
    </div>
  `;
}

// ── Honras: Copas do Mundo + títulos continentais ──
function renderHonors(enriched) {
  if (!enriched) return '<p class="text-sm text-muted">Carregando honras…</p>';

  const wc = enriched.worldCups || [];
  const continental = enriched.continentalTitles || [];

  const wcBlock = wc.length
    ? `
      <div class="honor-block">
        <div class="honor-block__header">
          <span class="honor-block__trophy">🏆</span>
          <span class="honor-block__label">Copa do Mundo (${wc.length}×)</span>
        </div>
        <div class="honor-block__years">${wc.map(y => `<span>${y}</span>`).join('')}</div>
      </div>`
    : `
      <div class="honor-block honor-block--none">
        <div class="honor-block__header">
          <span class="honor-block__trophy">⚽</span>
          <span class="honor-block__label">Nunca venceu a Copa do Mundo</span>
        </div>
      </div>`;

  const contBlocks = continental.map(ct => {
    const count = ct.years.length;
    const shown = ct.years.slice(-4);
    const extra = ct.years.length > 4 ? ct.years.length - 4 : 0;
    return `
      <div class="honor-block">
        <div class="honor-block__header">
          <span class="honor-block__trophy">🥇</span>
          <span class="honor-block__label">${escapeHTML(ct.competition)} (${count}×)</span>
        </div>
        <div class="honor-block__years">
          ${shown.map(y => `<span>${y}</span>`).join('')}
          ${extra ? `<span class="honor-block__years-more">+${extra}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  return `<div class="honors-grid">${wcBlock}${contBlocks}</div>`;
}

// ── Copa a Copa: histórico visual de Copas do Mundo ──
const ALL_WORLD_CUPS = [1930,1934,1938,1950,1954,1958,1962,1966,1970,1974,1978,1982,1986,1990,1994,1998,2002,2006,2010,2014,2018,2022];

function renderWorldCupTimeline(enriched, teamCode) {
  if (!enriched) return '';
  const wins = new Set(enriched.worldCups || []);
  const best = enriched.bestResult || null;

  if (!wins.size && !best) return '';

  // Participações baseadas em confederação e tamanho do torneio
  // (lógica aproximada: UEFA/CONMEBOL = participaram desde 1934; times africanos/asiáticos desde anos 70/80)
  const hasLongHistory = ['ARG','BRA','GER','ITA','FRA','ENG','ESP','POR','URU','BEL','NED','CRO'].includes(teamCode);
  const hasMidHistory = ['SEN','NGA','CMR','GHA','EGY','CIV','JPN','KOR','AUS','IRN','COL','MEX'].includes(teamCode);
  const startYear = hasLongHistory ? 1930 : hasMidHistory ? 1982 : 2006;

  const relevantCups = ALL_WORLD_CUPS.filter(y => y >= startYear);
  const wonCount = wins.size;

  return `
    <div class="wc-timeline">
      <div class="wc-timeline__header">
        ${wonCount ? `<span class="wc-timeline__badges">${'🏆'.repeat(Math.min(wonCount, 5))} ${wonCount > 5 ? `+${wonCount - 5}` : ''}</span>` : ''}
        <span class="wc-timeline__best">${escapeHTML(best || 'Sem títulos mundiais')}</span>
      </div>
      <div class="wc-timeline__grid">
        ${relevantCups.map(y => {
          const isWin = wins.has(y);
          return `
            <div class="wc-timeline__item ${isWin ? 'wc-timeline__item--win' : ''}">
              <span class="wc-timeline__year">${y}</span>
              ${isWin ? `<span class="wc-timeline__trophy">🏆</span>` : `<span class="wc-timeline__dot"></span>`}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ── Records: topScorer + mostCaps ──
function renderRecords(enriched) {
  if (!enriched) return '';
  const { topScorer, mostCaps } = enriched;
  if (!topScorer && !mostCaps) return '';
  return `
    <div class="team-records">
      ${topScorer ? `
        <div class="team-record">
          <span class="team-record__icon">⚽</span>
          <div class="team-record__body">
            <span class="team-record__label">Maior artilheiro</span>
            <span class="team-record__value">${escapeHTML(topScorer.name)}</span>
            <span class="team-record__sub">${topScorer.goals} gols</span>
          </div>
        </div>` : ''}
      ${mostCaps ? `
        <div class="team-record">
          <span class="team-record__icon">🎽</span>
          <div class="team-record__body">
            <span class="team-record__label">Mais jogos</span>
            <span class="team-record__value">${escapeHTML(mostCaps.name)}</span>
            <span class="team-record__sub">${mostCaps.caps} partidas</span>
          </div>
        </div>` : ''}
    </div>
  `;
}

// ── Curiosidades como cards categorizados ──
function renderCuriosityCards(curiosities) {
  if (!curiosities?.length) {
    return '<p class="text-sm text-muted">Sem curiosidades disponíveis.</p>';
  }
  return `
    <div class="curiosity-cards">
      ${curiosities.map(c => `
        <div class="curiosity-card">
          <div class="curiosity-card__header">
            <span class="curiosity-card__icon">${c.icon}</span>
            <span class="curiosity-card__category">${escapeHTML(c.category)}</span>
          </div>
          <p class="curiosity-card__text">${escapeHTML(c.text)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function render(state, params) {
  const rawSlug = String(params?.slug || '').toLowerCase();
  const team = getTeamBySlug(rawSlug);
  if (!team) return renderNotFound(rawSlug);

  const group = getGroupForTeam(team.code);
  const teamFixtures = applyMockToFixtures(getTeamFixtures(team.code));
  const isFavorite = state.user.favoriteTeam === team.code;
  const favoriteTeam = state.user.favoriteTeam ? getTeam(state.user.favoriteTeam) : null;
  const canCompare = favoriteTeam && favoriteTeam.code !== team.code;

  const predictionsByFixture = new Map(
    (state.user.predictions || []).map(p => [p.fixtureId, p])
  );

  const groupRivals = group
    ? group.teams.filter(code => code !== team.code).map(code => renderTeamChip(code)).join('')
    : '';

  const fixturesHTML = teamFixtures.length
    ? teamFixtures.map(f => renderTeamFixtureRow(f, team.code, predictionsByFixture.get(f.id))).join('')
    : '<p class="text-sm text-muted">Nenhum jogo cadastrado ainda para esta seleção no MVP.</p>';

  // ── Comparativo split-bar ──
  function splitBar(leftVal, rightVal, leftLabel, rightLabel, lowerIsBetter = false) {
    const l = Number(leftVal) || 0;
    const r = Number(rightVal) || 0;
    const total = l + r || 1;
    const lPct = Math.round((l / total) * 100);
    const rPct = 100 - lPct;
    const leftWins = lowerIsBetter ? l < r : l > r;
    const rightWins = lowerIsBetter ? r < l : r > l;
    return `
      <div class="split-stat">
        <span class="split-stat__val ${leftWins ? 'split-stat__val--win' : ''}">${leftLabel}</span>
        <div class="split-stat__bar">
          <div class="split-stat__seg split-stat__seg--left" style="width:${lPct}%"></div>
          <div class="split-stat__seg split-stat__seg--right" style="width:${rPct}%"></div>
        </div>
        <span class="split-stat__val split-stat__val--right ${rightWins ? 'split-stat__val--win' : ''}">${rightLabel}</span>
      </div>
    `;
  }

  const compareHTML = canCompare ? `
    <div class="team-page__compare" id="team-compare">
      <div class="team-page__compare-header">
        ${icon('gitCompare', 18, 'text-blue')}
        <span class="team-page__compare-title">Comparativo</span>
      </div>
      <div class="compare-teams-header">
        <div class="compare-team-flag">${favoriteTeam.flag}<br><span>${escapeHTML(favoriteTeam.code)}</span></div>
        <div class="compare-vs-badge">VS</div>
        <div class="compare-team-flag">${team.flag}<br><span>${escapeHTML(team.code)}</span></div>
      </div>
      <div class="split-stats">
        <div class="split-stat__lbl">Ranking FIFA <span class="split-stat__hint">(menor = melhor)</span></div>
        ${splitBar(48 - favoriteTeam.ranking, 48 - team.ranking, `#${favoriteTeam.ranking}`, `#${team.ranking}`, false)}
        <div class="split-stat__lbl">Copas do Mundo <span class="split-stat__hint" id="compare-wc-hint"></span></div>
        <div id="compare-wc-row"><div class="split-stat__text"><span>—</span><span>—</span></div></div>
        <div class="split-stat__lbl">Confederação</div>
        <div class="split-stat__text">
          <span>${escapeHTML(favoriteTeam.confederation)}</span>
          <span>${escapeHTML(team.confederation)}</span>
        </div>
        <div class="split-stat__lbl">Grupo</div>
        <div class="split-stat__text">
          <span>Grupo ${getGroupForTeam(favoriteTeam.code)?.id || '—'}</span>
          <span>Grupo ${group?.id || '—'}</span>
        </div>
      </div>
    </div>
  ` : '';

  const favoriteLabel = isFavorite ? 'Sua seleção' : 'Definir como favorita';
  const favoriteIcon = isFavorite ? 'heartFilled' : 'heart';

  return `
    <button class="team-page__back" id="team-back-btn" type="button" aria-label="Voltar">
      ${icon('arrowLeft', 18)} <span>Voltar</span>
    </button>

    <section class="team-page__hero" data-team-code="${escapeHTML(team.code)}">
      <div class="team-page__hero-flag" aria-hidden="true">${team.flag}</div>
      <div class="team-page__hero-info">
        <div class="team-page__hero-kicker">Seleção Nacional · ${escapeHTML(team.confederation)}</div>
        <h1 class="team-page__hero-name">${escapeHTML(team.name)}</h1>
        <div class="team-page__hero-tags">
          <span class="team-page__tag">${escapeHTML(team.code)}</span>
          ${group ? `<span class="team-page__tag team-page__tag--muted">Grupo ${group.id}</span>` : ''}
          <span class="team-page__tag team-page__tag--muted" id="hero-nickname">—</span>
          ${isFavorite ? `<span class="team-page__tag team-page__tag--gold">${icon('heartFilled', 12)} Sua seleção</span>` : ''}
        </div>
        <div class="team-page__hero-coach" id="hero-coach"></div>
      </div>
      <div class="team-page__hero-stats">
        <div class="team-page__hero-stat">
          <span class="team-page__hero-stat-value">#${team.ranking}</span>
          <span class="team-page__hero-stat-label">Ranking FIFA</span>
        </div>
        <div class="team-page__hero-stat">
          <span class="team-page__hero-stat-value" id="hero-wc-count">—</span>
          <span class="team-page__hero-stat-label">Títulos Mundiais</span>
        </div>
        <div class="team-page__hero-stat">
          <span class="team-page__hero-stat-value">${teamFixtures.length}</span>
          <span class="team-page__hero-stat-label">Jogos no Torneio</span>
        </div>
      </div>
    </section>

    <div class="team-page__actions">
      <button class="btn ${isFavorite ? 'btn--gold' : 'btn--primary'} team-page__action" id="team-favorite-btn" data-team="${escapeHTML(team.code)}" aria-pressed="${isFavorite}">
        ${icon(favoriteIcon, 16)} <span>${favoriteLabel}</span>
      </button>
      <button class="btn btn--ghost team-page__action" id="team-share-btn" data-team="${escapeHTML(team.code)}">
        ${icon('share2', 16)} <span>Compartilhar</span>
      </button>
    </div>

    ${compareHTML}

    <div class="team-page__section">
      <div class="section-title">${icon('calendar', 18)} Jogos da seleção</div>
      <p class="section-subtitle">Toque em um adversário para ver o dossiê dele.</p>
      <div class="team-page__fixtures">${fixturesHTML}</div>
    </div>

    ${group ? `
      <div class="team-page__section">
        <div class="section-title">${icon('shield', 18)} Adversários no Grupo ${group.id}</div>
        <div class="team-page__chips">${groupRivals}</div>
      </div>
    ` : ''}

    <div class="team-page__section">
      <div class="section-title">🏆 Copa a Copa</div>
      <div id="team-wc-timeline">
        <div class="team-page__skeleton"></div>
      </div>
    </div>

    <div class="team-page__section">
      <div class="section-title">🏅 Honras e Títulos</div>
      <div id="team-honors">
        <div class="team-page__skeleton team-page__skeleton--lg"></div>
      </div>
      <div id="team-records"></div>
    </div>

    ${renderLineupSection(team, teamFixtures)}

    <div class="team-page__section" id="team-curiosities-section">
      <div class="section-title">${icon('sparkles', 18)} Curiosidades</div>
      <div id="team-curiosities">
        <div class="team-page__skeleton"></div>
        <div class="team-page__skeleton"></div>
      </div>
    </div>

    <div class="team-page__section" id="team-wiki-section">
      <div class="section-title">${icon('globe', 18)} Dossiê enciclopédico</div>
      <div class="team-page__wiki" id="team-wiki-content">
        <div class="team-page__skeleton team-page__skeleton--lg"></div>
        <div class="team-page__skeleton"></div>
        <div class="team-page__skeleton"></div>
      </div>
    </div>

    <div class="team-page__source" id="team-wiki-link"></div>
  `;
}

// ── Hidrata dados enriquecidos (teams.json) ──
function hydrateEnriched(team, enriched) {
  const hero = document.querySelector('.team-page__hero');
  if (!hero || hero.dataset.teamCode !== team.code) return;

  // Hero: apelido, técnico, títulos mundiais
  const nicknameEl = document.getElementById('hero-nickname');
  if (nicknameEl && enriched.nickname) nicknameEl.textContent = enriched.nickname;

  const coachEl = document.getElementById('hero-coach');
  if (coachEl && enriched.coach) {
    coachEl.innerHTML = `${icon('users', 13)} Técnico: <strong>${escapeHTML(enriched.coach)}</strong>`;
  }

  const wcCountEl = document.getElementById('hero-wc-count');
  if (wcCountEl) {
    wcCountEl.textContent = enriched.worldCups?.length || '0';
  }

  // Copa a Copa
  const wcTimelineEl = document.getElementById('team-wc-timeline');
  if (wcTimelineEl) wcTimelineEl.innerHTML = renderWorldCupTimeline(enriched, team.code);

  // Honras
  const honorsEl = document.getElementById('team-honors');
  if (honorsEl) honorsEl.innerHTML = renderHonors(enriched);

  // Recordes
  const recordsEl = document.getElementById('team-records');
  if (recordsEl) recordsEl.innerHTML = renderRecords(enriched);

  // Curiosidades
  const curiositiesEl = document.getElementById('team-curiosities');
  if (curiositiesEl) curiositiesEl.innerHTML = renderCuriosityCards(enriched.curiosities);

  // Comparativo: linha de Copas do Mundo
  const compareWcRow = document.getElementById('compare-wc-row');
  if (compareWcRow) {
    const favoriteCode = document.querySelector('.compare-teams-header .compare-team-flag span')?.textContent;
    const favTeam = favoriteCode ? null : null; // resolvido abaixo via DOM
    const favEnriched = getTeamEnriched(
      document.querySelector('[id="team-compare"] .compare-team-flag span')?.textContent || ''
    );

    const favWc = favEnriched?.worldCups?.length || 0;
    const teamWc = enriched.worldCups?.length || 0;
    const total = favWc + teamWc || 1;
    const lPct = Math.round((favWc / total) * 100);
    const rPct = 100 - lPct;
    const leftWins = favWc > teamWc;
    const rightWins = teamWc > favWc;
    compareWcRow.innerHTML = `
      <div class="split-stat">
        <span class="split-stat__val ${leftWins ? 'split-stat__val--win' : ''}">${favWc}×</span>
        <div class="split-stat__bar">
          <div class="split-stat__seg split-stat__seg--left" style="width:${lPct}%"></div>
          <div class="split-stat__seg split-stat__seg--right" style="width:${rPct}%"></div>
        </div>
        <span class="split-stat__val split-stat__val--right ${rightWins ? 'split-stat__val--win' : ''}">${teamWc}×</span>
      </div>`;
  }
}

// ── Hidrata dossiê Wikipedia (só a seção de texto longo) ──
function hydrateDossier(team, payload) {
  const hero = document.querySelector('.team-page__hero');
  if (!hero || hero.dataset.teamCode !== team.code) return;

  const wikiEl = document.getElementById('team-wiki-content');
  const linkEl = document.getElementById('team-wiki-link');

  const wiki = payload?.wiki;

  if (wikiEl) {
    const description = wiki?.description ? escapeHTML(wiki.description) : '';
    const extract = wiki?.extract
      ? escapeHTML(wiki.extract)
      : 'Não foi possível recuperar o resumo enciclopédico desta seleção.';
    wikiEl.innerHTML = `
      ${description ? `<p class="team-page__wiki-lead"><strong>${description}</strong></p>` : ''}
      <p class="team-page__wiki-body">${extract}</p>
    `;
  }

  if (linkEl) {
    const safeWikiUrl = isTrustedWikiUrl(wiki?.url) ? wiki.url : '';
    linkEl.innerHTML = safeWikiUrl
      ? `<a href="${escapeHTML(safeWikiUrl)}" target="_blank" rel="noopener noreferrer">${icon('globe', 14)} Abrir na Wikipedia</a>`
      : '';
  }
}

function showDossierError() {
  const wikiEl = document.getElementById('team-wiki-content');
  if (wikiEl) wikiEl.innerHTML = '<p class="text-sm text-muted">Não foi possível carregar o dossiê agora.</p>';
}

function bindEvents(state, { router, params }) {
  const hero = document.querySelector('.team-page__hero');
  if (!hero) {
    setSEO({
      title: 'Seleção não encontrada',
      description: 'A seleção procurada não foi encontrada no torneio.',
      canonical: window.location.pathname
    });
    return;
  }
  const teamCode = hero.dataset.teamCode;
  const team = getTeam(teamCode);
  if (!team) return;

  setSEO({
    title: `${team.name} no Mundial 2026`,
    description: `Dossiê completo da seleção ${team.name} no Mundial 2026: escalação provável, elenco, jogos, curiosidades e estatísticas. Confederação ${team.confederation}, ranking FIFA #${team.ranking}.`,
    canonical: `/selecoes/${team.slug}`,
    keywords: `${team.name}, seleção ${team.name}, mundial 2026, ${team.confederation}, ${team.code}, escalação, elenco`,
    jsonLd: schemaSportsTeam(team)
  });

  const backBtn = document.getElementById('team-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else router.navigate('grupos');
    });
  }

  const favoriteBtn = document.getElementById('team-favorite-btn');
  if (favoriteBtn) {
    favoriteBtn.addEventListener('click', () => {
      const code = favoriteBtn.dataset.team;
      const result = setFavoriteTeam(state, code);
      if (!result.changed) { showToast('Esta já é a sua seleção favorita.', 'info'); return; }
      const current = getTeam(code);
      const flag = current ? current.flag : '⚽';
      if (result.xpAwarded > 0) showToast(`${flag} Seleção favorita definida! +${result.xpAwarded} XP`, 'xp');
      else showToast(`${flag} Nova seleção favorita: ${current?.name || code}`, 'success');
      if (result.leveledUp) setTimeout(() => showToast(`🎉 Nível ${result.newLevel} alcançado!`, 'success'), 800);
      router.navigate('selecoes', { params: { slug: current.slug }, replace: true });
    });
  }

  const shareBtn = document.getElementById('team-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const code = shareBtn.dataset.team;
      const current = getTeam(code);
      if (!current) return;
      const shareData = {
        title: `${current.name} no CopaDataHub 2026`,
        text: `Veja o dossiê de ${current.flag} ${current.name} no CopaDataHub 2026!`,
        url: `${window.location.origin}/selecoes/${current.slug}`
      };
      try {
        if (navigator.share) await navigator.share(shareData);
        else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareData.url);
          showToast('🔗 Link copiado para a área de transferência', 'success');
        } else showToast('Compartilhamento não suportado neste navegador.', 'error');
      } catch (error) {
        if (error?.name !== 'AbortError') showToast('Não foi possível compartilhar agora.', 'error');
      }
    });
  }

  // ── Dados enriquecidos (teams.json) — carrega primeiro ──
  loadEnrichedTeams().then(() => {
    const enriched = getTeamEnriched(team.code);
    if (enriched) hydrateEnriched(team, enriched);
    else {
      const honorsEl = document.getElementById('team-honors');
      if (honorsEl) honorsEl.innerHTML = '<p class="text-sm text-muted">Informações detalhadas indisponíveis.</p>';
      const curiositiesEl = document.getElementById('team-curiosities');
      if (curiositiesEl) curiositiesEl.innerHTML = '<p class="text-sm text-muted">Curiosidades indisponíveis.</p>';
    }
  });

  // ── Dossiê Wikipedia (texto longo) ──
  const cached = getTeamDossierCached(team.code);
  if (cached) {
    hydrateDossier(team, cached);
  } else {
    loadTeamDossier(team)
      .then(payload => hydrateDossier(team, payload))
      .catch(err => {
        console.error('Erro ao carregar dossiê:', err);
        showDossierError();
      });
  }

  loadSquadSection(team);
}

async function loadSquadSection(team) {
  const fieldEl = document.getElementById('team-lineup-field');
  const listEl = document.getElementById('team-squad-list');
  if (!fieldEl && !listEl) return;

  try {
    const squad = await fetchSquad(team.code);
    const hero = document.querySelector('.team-page__hero');
    if (!hero || hero.dataset.teamCode !== team.code) return;

    if (squad) {
      const lineup = buildLineup(squad);
      if (fieldEl) fieldEl.innerHTML = renderLineupField(lineup, team.flag);
      if (listEl) listEl.innerHTML = renderSquadList(squad);
    } else {
      if (fieldEl) fieldEl.innerHTML = renderLineupField(null);
      if (listEl) listEl.innerHTML = '<p class="text-sm text-muted">Elenco indisponível. Verifique sua conexão ou tente mais tarde.</p>';
    }
  } catch (error) {
    console.error('Erro ao carregar elenco:', error);
    if (fieldEl) fieldEl.innerHTML = renderLineupField(null);
    if (listEl) listEl.innerHTML = '<p class="text-sm text-muted">Não foi possível carregar o elenco agora.</p>';
  }
}

export default { render, bindEvents };
