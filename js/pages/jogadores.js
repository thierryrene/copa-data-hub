import { icon } from '../icons.js';
import { escapeHTML, isTrustedWikiUrl } from '../util/html.js';
import { slugify } from '../util/slug.js';
import { setSEO, schemaPerson } from '../util/seo.js';
import { renderPlayerHero, renderPlayerHeroSkeleton } from '../components/playerHero.js';
import { renderPlayerStats, renderPlayerStatsSkeleton } from '../components/playerStats.js';
import { showToast } from '../components/toast.js';
import { fetchPlayerDetails, resolvePlayerIdBySlug, registerPlayerSlug } from '../api/player.js';
import { fetchWikipediaPlayerSummary, extractCuriosities } from '../api/wikipedia.js';

function render(_state, params) {
  const rawSlug = String(params?.slug || '').toLowerCase();

  if (!rawSlug) {
    return `
      <div class="team-page__notfound">
        <div class="section-title">${icon('info', 20)} Jogador não encontrado</div>
        <p class="section-subtitle">URL inválida.</p>
        <button class="btn btn--primary" id="player-back-btn" type="button">${icon('arrowLeft', 16)} Voltar</button>
      </div>
    `;
  }

  return `
    <button class="team-page__back" id="player-back-btn" type="button" aria-label="Voltar">
      ${icon('arrowLeft', 18)} <span>Voltar</span>
    </button>

    <div id="player-hero-container" data-player-slug="${escapeHTML(rawSlug)}">
      ${renderPlayerHeroSkeleton()}
    </div>

    <div class="player-page__actions" id="player-actions" style="display:none">
      <button class="btn btn--ghost player-page__action" id="player-share-btn">
        ${icon('share2', 16)} <span>Compartilhar</span>
      </button>
    </div>

    <div id="player-stats-container">
      ${renderPlayerStatsSkeleton()}
    </div>

    <div class="team-page__section" id="player-wiki-section">
      <div class="section-title">${icon('globe', 18)} Dossiê enciclopédico</div>
      <div class="team-page__wiki" id="player-wiki-content">
        <div class="team-page__skeleton team-page__skeleton--lg"></div>
        <div class="team-page__skeleton"></div>
        <div class="team-page__skeleton"></div>
      </div>
    </div>

    <div class="team-page__section" id="player-curiosities-section">
      <div class="section-title">${icon('sparkles', 18)} Curiosidades</div>
      <ul class="team-page__curiosities" id="player-curiosities">
        <li class="team-page__skeleton"></li>
        <li class="team-page__skeleton"></li>
      </ul>
    </div>

    <div class="team-page__source" id="player-wiki-link"></div>
  `;
}

function bindEvents(state, { router }) {
  const backBtn = document.getElementById('player-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        router.navigate('home');
      }
    });
  }

  const heroContainer = document.getElementById('player-hero-container');
  if (!heroContainer) return;

  const slug = heroContainer.dataset.playerSlug;
  if (!slug) return;

  // SEO inicial genérico até carregar dados
  setSEO({
    title: `Jogador — ${slug.replace(/-/g, ' ')}`,
    description: 'Perfil, estatísticas e dossiê enciclopédico de jogador de futebol profissional.',
    canonical: `/jogadores/${slug}`
  });

  loadPlayerContent(slug, router);
}

async function loadPlayerContent(slug, router) {
  const heroContainer = document.getElementById('player-hero-container');
  const statsContainer = document.getElementById('player-stats-container');
  const actionsEl = document.getElementById('player-actions');
  const wikiEl = document.getElementById('player-wiki-content');
  const curiositiesEl = document.getElementById('player-curiosities');
  const linkEl = document.getElementById('player-wiki-link');

  let player = null;

  try {
    const playerId = await resolvePlayerIdBySlug(slug);
    if (playerId) {
      player = await fetchPlayerDetails(playerId);
    }
  } catch (error) {
    console.error('Erro ao carregar dados do jogador:', error);
  }

  if (heroContainer?.dataset.playerSlug !== slug) return;

  if (player) {
    // Garante slug registrado para futuras navegações inversas
    registerPlayerSlug(slugify(player.name), player.id);

    if (heroContainer) heroContainer.innerHTML = renderPlayerHero(player);
    if (statsContainer) statsContainer.innerHTML = renderPlayerStats(player);
    if (actionsEl) actionsEl.style.display = '';
    bindShareButton(player);

    // SEO rico quando dados chegam
    const description = [
      player.position && `${player.position === 'Goalkeeper' ? 'Goleiro' : player.position === 'Defender' ? 'Defensor' : player.position === 'Midfielder' ? 'Meio-campista' : 'Atacante'}`,
      player.currentTeam?.name && `jogador do ${player.currentTeam.name}`,
      player.nationality && `(${player.nationality})`,
      player.age && `${player.age} anos`
    ].filter(Boolean).join(' · ');

    setSEO({
      title: player.name,
      description: `${player.name}: ${description}. Estatísticas da temporada, dossiê enciclopédico e curiosidades.`,
      canonical: `/jogadores/${slug}`,
      image: player.photo || undefined,
      keywords: `${player.name}, ${player.currentTeam?.name || ''}, ${player.nationality || ''}, futebolista, estatísticas`,
      type: 'profile',
      jsonLd: schemaPerson(player)
    });
  } else {
    if (heroContainer) heroContainer.innerHTML = '<p class="text-sm text-muted">Não foi possível carregar os dados do jogador.</p>';
    if (statsContainer) statsContainer.innerHTML = '';
  }

  loadPlayerWiki(player?.name, slug, { wikiEl, curiositiesEl, linkEl });
}

async function loadPlayerWiki(playerName, slug, { wikiEl, curiositiesEl, linkEl }) {
  if (!playerName) {
    if (wikiEl) wikiEl.innerHTML = '<p class="text-sm text-muted">Dossiê indisponível — nome do jogador não encontrado.</p>';
    if (curiositiesEl) curiositiesEl.innerHTML = '';
    return;
  }

  try {
    const wiki = await fetchWikipediaPlayerSummary(playerName);

    const heroContainer = document.getElementById('player-hero-container');
    if (heroContainer?.dataset.playerSlug !== slug) return;

    if (wiki) {
      const description = wiki.description ? escapeHTML(wiki.description) : '';
      const extract = wiki.extract
        ? escapeHTML(wiki.extract)
        : 'Resumo enciclopédico não disponível para este jogador.';

      if (wikiEl) {
        wikiEl.innerHTML = `
          ${description ? `<p class="team-page__wiki-lead"><strong>${description}</strong></p>` : ''}
          <p class="team-page__wiki-body">${extract}</p>
        `;
      }

      if (curiositiesEl) {
        const curiosities = extractCuriosities(wiki.extract || '', 4);
        curiositiesEl.innerHTML = curiosities.length
          ? curiosities.map(item => `<li>${escapeHTML(item)}</li>`).join('')
          : '<li class="text-sm text-muted">Sem curiosidades disponíveis para este jogador.</li>';
      }

      if (linkEl) {
        const safeUrl = isTrustedWikiUrl(wiki.url) ? wiki.url : '';
        linkEl.innerHTML = safeUrl
          ? `<a href="${escapeHTML(safeUrl)}" target="_blank" rel="noopener noreferrer">${icon('globe', 14)} Abrir na Wikipedia</a>`
          : '';
      }
    } else {
      if (wikiEl) wikiEl.innerHTML = '<p class="text-sm text-muted">Dossiê não encontrado na Wikipedia para este jogador.</p>';
      if (curiositiesEl) curiositiesEl.innerHTML = '';
    }
  } catch (error) {
    console.error('Erro ao carregar Wikipedia do jogador:', error);
    if (wikiEl) wikiEl.innerHTML = '<p class="text-sm text-muted">Não foi possível carregar o dossiê agora.</p>';
    if (curiositiesEl) curiositiesEl.innerHTML = '';
  }
}

function bindShareButton(player) {
  const shareBtn = document.getElementById('player-share-btn');
  if (!shareBtn || !player) return;
  const slug = slugify(player.name);

  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: `${player.name} no CopaDataHub 2026`,
      text: `Veja o perfil de ${player.name} no CopaDataHub 2026!`,
      url: `${window.location.origin}/jogadores/${slug}`
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

export default { render, bindEvents };
