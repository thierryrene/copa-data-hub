import { icon } from '../icons.js';
import { getTodayFixtures } from '../data.js';
import { renderCountdown } from '../components/countdown.js';
import { renderXPBar } from '../components/xpBar.js';
import { renderMatchCard } from '../components/matchCard.js';

function render(state) {
  const fixtures = getTodayFixtures();
  const matchCards = fixtures.map(f => renderMatchCard(f)).join('');

  return `
    ${renderCountdown()}
    ${renderXPBar(state)}

    <a href="/champions" style="text-decoration: none; color: inherit; display: block; margin-bottom: var(--space-xl);">
      <div class="card card--interactive" style="background: linear-gradient(135deg, rgba(30,58,138,0.2), rgba(10,14,26,0.95)); border: 1px solid rgba(147,197,253,0.2);">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-md">
            <span style="font-size: 1.5rem;">⭐</span>
            <div>
              <div class="font-display font-bold" style="color: var(--color-ucl-star, #ffd700);">UCL DataHub Ao Vivo</div>
              <div class="text-sm text-muted">Acesso aos jogos reais (Ao Vivo) da Champions</div>
            </div>
          </div>
          ${icon('chevronRight', 20, 'text-muted')}
        </div>
      </div>
    </a>

    <div class="section-title">
      ${icon('calendar', 20)} Próximos Jogos
    </div>
    <div class="matches-list">${matchCards}</div>

    <div class="mt-xl">
      <div class="section-title">${icon('barChart', 20)} Torneio em Números</div>
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
      </div>
    </div>

    <div class="mt-xl">
      <div class="section-title">${icon('trophy', 20)} Acesse as Seções</div>
      <div class="matches-list">
        <div class="card card--interactive card--gold" data-nav="groups">
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

        <div class="card card--interactive" data-nav="matches">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-md">
              ${icon('target', 24, 'text-blue')}
              <div>
                <div class="font-display font-bold">Match Center</div>
                <div class="text-sm text-muted">Estatísticas e previsões ao vivo</div>
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
  `;
}

function bindEvents(_state, { router }) {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => router.navigate(el.dataset.nav));
  });
}

export default { render, bindEvents };
