import { icon } from '../icons.js';

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
