import { icon } from '../icons.js';
import { getTeam } from '../data.js';

export function renderPredictionBar(homePct, drawPct, awayPct, homeCode, awayCode) {
  const home = getTeam(homeCode);
  const away = getTeam(awayCode);
  const homeLabel = home
    ? `<a class="prediction-bar__team" href="/selecoes/${home.slug}" data-route-link data-team-prefetch="${home.code}" aria-label="Ver detalhes de ${home.name}"><span>${home.flag}</span> ${home.code}</a>`
    : `<span class="prediction-bar__team">${homeCode}</span>`;
  const awayLabel = away
    ? `<a class="prediction-bar__team" href="/selecoes/${away.slug}" data-route-link data-team-prefetch="${away.code}" aria-label="Ver detalhes de ${away.name}"><span>${away.flag}</span> ${away.code}</a>`
    : `<span class="prediction-bar__team">${awayCode}</span>`;

  return `
    <div class="prediction-bar">
      <div class="prediction-bar__title">
        ${icon('zap', 16, 'text-gold')} Previsão IA
      </div>
      <div class="prediction-bar__teams">
        ${homeLabel}
        <span class="prediction-bar__draw-label">Empate</span>
        ${awayLabel}
      </div>
      <div class="prediction-bar__track">
        <div class="prediction-bar__segment prediction-bar__segment--home" style="width: ${homePct}%">${homePct}%</div>
        <div class="prediction-bar__segment prediction-bar__segment--draw" style="width: ${drawPct}%">${drawPct}%</div>
        <div class="prediction-bar__segment prediction-bar__segment--away" style="width: ${awayPct}%">${awayPct}%</div>
      </div>
    </div>
  `;
}
