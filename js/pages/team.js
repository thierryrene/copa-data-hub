import { icon } from '../icons.js';
import { getTeam, getTeamFixtures, getGroupForTeam } from '../data.js';
import { renderTeamChip } from '../components/teamChip.js';
import { renderTeamFixtureRow } from '../components/teamFixtureRow.js';
import { showToast } from '../components/toast.js';
import { escapeHTML, isTrustedWikiUrl } from '../util/html.js';
import { setFavoriteTeam } from '../state.js';
import { loadTeamDossier, getTeamDossierCached } from '../api/teamLoader.js';
import { extractCuriosities } from '../api/wikipedia.js';

function renderNotFound(rawCode) {
  return `
    <div class="team-page__notfound">
      <div class="section-title">${icon('info', 20)} Seleção não encontrada</div>
      <p class="section-subtitle">O código <strong>${escapeHTML(String(rawCode || '').toUpperCase())}</strong> não corresponde a uma das 48 seleções.</p>
      <a class="btn btn--primary" href="/groups" data-route-link>${icon('shield', 16)} Voltar aos grupos</a>
    </div>
  `;
}

function render(state, params) {
  const rawCode = (params?.[0] || '').toUpperCase();
  const team = getTeam(rawCode);
  if (!team) return renderNotFound(rawCode);

  const group = getGroupForTeam(team.code);
  const teamFixtures = getTeamFixtures(team.code);
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

  const compareHTML = canCompare ? `
    <div class="team-page__compare" id="team-compare">
      <div class="team-page__compare-header">
        ${icon('gitCompare', 18, 'text-blue')}
        <span class="team-page__compare-title">Comparar com ${favoriteTeam.flag} ${escapeHTML(favoriteTeam.name)}</span>
      </div>
      <div class="team-page__compare-grid">
        <div class="team-page__compare-col">
          <div class="team-page__compare-flag">${favoriteTeam.flag}</div>
          <div class="team-page__compare-name">${escapeHTML(favoriteTeam.name)}</div>
          <div class="team-page__compare-row"><span>Ranking</span><strong>#${favoriteTeam.ranking}</strong></div>
          <div class="team-page__compare-row"><span>Confederação</span><strong>${escapeHTML(favoriteTeam.confederation)}</strong></div>
          <div class="team-page__compare-row"><span>Grupo</span><strong>${getGroupForTeam(favoriteTeam.code)?.id || '—'}</strong></div>
        </div>
        <div class="team-page__compare-vs">VS</div>
        <div class="team-page__compare-col">
          <div class="team-page__compare-flag">${team.flag}</div>
          <div class="team-page__compare-name">${escapeHTML(team.name)}</div>
          <div class="team-page__compare-row"><span>Ranking</span><strong>#${team.ranking}</strong></div>
          <div class="team-page__compare-row"><span>Confederação</span><strong>${escapeHTML(team.confederation)}</strong></div>
          <div class="team-page__compare-row"><span>Grupo</span><strong>${group?.id || '—'}</strong></div>
        </div>
      </div>
      <div class="team-page__compare-hint">
        Ranking FIFA mais baixo é melhor · diferença de ${Math.abs(favoriteTeam.ranking - team.ranking)} posições
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
        <div class="team-page__hero-kicker">Seleção Nacional</div>
        <h1 class="team-page__hero-name">${escapeHTML(team.name)}</h1>
        <div class="team-page__hero-tags">
          <span class="team-page__tag">${escapeHTML(team.code)}</span>
          <span class="team-page__tag team-page__tag--muted">${escapeHTML(team.confederation)}</span>
          ${group ? `<span class="team-page__tag team-page__tag--muted">Grupo ${group.id}</span>` : ''}
          ${isFavorite ? `<span class="team-page__tag team-page__tag--gold">${icon('heartFilled', 12)} Sua seleção</span>` : ''}
        </div>
      </div>
      <div class="team-page__hero-stats">
        <div class="team-page__hero-stat">
          <span class="team-page__hero-stat-value">#${team.ranking}</span>
          <span class="team-page__hero-stat-label">Ranking FIFA</span>
        </div>
        <div class="team-page__hero-stat">
          <span class="team-page__hero-stat-value">${teamFixtures.length}</span>
          <span class="team-page__hero-stat-label">Jogos no MVP</span>
        </div>
        <div class="team-page__hero-stat">
          <span class="team-page__hero-stat-value">${group ? group.id : '—'}</span>
          <span class="team-page__hero-stat-label">Grupo</span>
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

    <div class="team-page__section" id="team-wiki-section">
      <div class="section-title">${icon('globe', 18)} Dossiê enciclopédico</div>
      <div class="team-page__wiki" id="team-wiki-content">
        <div class="team-page__skeleton team-page__skeleton--lg"></div>
        <div class="team-page__skeleton"></div>
        <div class="team-page__skeleton"></div>
      </div>
    </div>

    <div class="team-page__section" id="team-curiosities-section">
      <div class="section-title">${icon('sparkles', 18)} Curiosidades</div>
      <ul class="team-page__curiosities" id="team-curiosities">
        <li class="team-page__skeleton"></li>
        <li class="team-page__skeleton"></li>
        <li class="team-page__skeleton"></li>
      </ul>
    </div>

    <div class="team-page__section" id="team-news-section">
      <div class="section-title">${icon('newspaper', 18)} Notícias em destaque</div>
      <div class="team-page__news" id="team-news">
        <div class="team-page__skeleton"></div>
        <div class="team-page__skeleton"></div>
      </div>
    </div>

    <div class="team-page__source" id="team-wiki-link"></div>
  `;
}

function hydrateDossier(team, payload) {
  const hero = document.querySelector('.team-page__hero');
  if (!hero || hero.dataset.teamCode !== team.code) return;

  const wikiEl = document.getElementById('team-wiki-content');
  const curiositiesEl = document.getElementById('team-curiosities');
  const newsEl = document.getElementById('team-news');
  const linkEl = document.getElementById('team-wiki-link');

  const wiki = payload?.wiki;
  const news = payload?.news;

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

  if (curiositiesEl) {
    const curiosities = extractCuriosities(wiki?.extract || '');
    curiositiesEl.innerHTML = curiosities.length
      ? curiosities.map(item => `<li>${escapeHTML(item)}</li>`).join('')
      : '<li class="text-sm text-muted">Sem curiosidades disponíveis para esta seleção.</li>';
  }

  if (newsEl) {
    const safeNews = (news || []).filter(item => isTrustedWikiUrl(item.url));
    if (safeNews.length) {
      newsEl.innerHTML = safeNews.map(item => `
        <a class="team-page__news-item" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">
          <span class="team-page__news-title">${escapeHTML(item.title)}</span>
          ${item.description ? `<span class="team-page__news-desc">${escapeHTML(item.description)}</span>` : ''}
        </a>
      `).join('');
    } else {
      newsEl.innerHTML = '<p class="text-sm text-muted">Nenhuma notícia recente relacionada nos últimos dias.</p>';
    }
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
  const curiositiesEl = document.getElementById('team-curiosities');
  const newsEl = document.getElementById('team-news');
  if (wikiEl) wikiEl.innerHTML = '<p class="text-sm text-muted">Não foi possível carregar o dossiê agora. Verifique sua conexão e tente novamente.</p>';
  if (curiositiesEl) curiositiesEl.innerHTML = '<li class="text-sm text-muted">Curiosidades indisponíveis no momento.</li>';
  if (newsEl) newsEl.innerHTML = '<p class="text-sm text-muted">Notícias indisponíveis no momento.</p>';
}

function bindEvents(state, { router, params }) {
  const hero = document.querySelector('.team-page__hero');
  if (!hero) return;
  const teamCode = hero.dataset.teamCode;
  const team = getTeam(teamCode);
  if (!team) return;

  const backBtn = document.getElementById('team-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        router.navigate('groups');
      }
    });
  }

  const favoriteBtn = document.getElementById('team-favorite-btn');
  if (favoriteBtn) {
    favoriteBtn.addEventListener('click', () => {
      const code = favoriteBtn.dataset.team;
      const result = setFavoriteTeam(state, code);
      if (!result.changed) {
        showToast('Esta já é a sua seleção favorita.', 'info');
        return;
      }
      const current = getTeam(code);
      const flag = current ? current.flag : '⚽';
      if (result.xpAwarded > 0) {
        showToast(`${flag} Seleção favorita definida! +${result.xpAwarded} XP`, 'xp');
      } else {
        showToast(`${flag} Nova seleção favorita: ${current?.name || code}`, 'success');
      }
      if (result.leveledUp) {
        setTimeout(() => showToast(`🎉 Nível ${result.newLevel} alcançado!`, 'success'), 800);
      }
      router.navigate('team', { params: [code], replace: true });
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
        url: `${window.location.origin}/team/${encodeURIComponent(code)}`
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareData.url);
          showToast('🔗 Link copiado para a área de transferência', 'success');
        } else {
          showToast('Compartilhamento não suportado neste navegador.', 'error');
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          showToast('Não foi possível compartilhar agora.', 'error');
        }
      }
    });
  }

  const cached = getTeamDossierCached(team.code);
  if (cached) {
    hydrateDossier(team, cached);
  } else {
    loadTeamDossier(team)
      .then(payload => hydrateDossier(team, payload))
      .catch((error) => {
        console.error('Erro ao carregar dossiê da seleção:', error);
        showDossierError();
      });
  }
}

export default { render, bindEvents };
