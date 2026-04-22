import { icon } from '../icons.js';
import { escapeHTML } from '../util/html.js';

const COUNTRY_META = {
  'EUA':    { cls: 'usa', flag: '🇺🇸' },
  'México': { cls: 'mex', flag: '🇲🇽' },
  'Canadá': { cls: 'can', flag: '🇨🇦' }
};

export function renderStadiumCard(stadium) {
  const meta = COUNTRY_META[stadium.country] || { cls: 'usa', flag: '🏟️' };
  const cap = stadium.capacity.toLocaleString('pt-BR');
  const aria = `Abrir vista satélite do ${stadium.name}, ${stadium.city}`;

  return `
    <button
      class="stadium-card stadium-card--${meta.cls}${stadium.isFinal ? ' stadium-card--final' : ''}"
      data-stadium-id="${stadium.id}"
      type="button"
      aria-label="${escapeHTML(aria)}"
    >
      ${stadium.isFinal ? '<span class="stadium-card__final-pin" aria-hidden="true">🏆 FINAL</span>' : ''}

      <div class="stadium-card__flag" aria-hidden="true">${meta.flag}</div>

      <div class="stadium-card__body">
        <h3 class="stadium-card__name">${escapeHTML(stadium.name)}</h3>
        <div class="stadium-card__city">
          ${icon('mapPin', 12)} <span>${escapeHTML(stadium.city)}</span>
        </div>
        <div class="stadium-card__meta">
          <span class="stadium-card__pill" title="Capacidade">
            👥 ${cap}
          </span>
          <span class="stadium-card__pill stadium-card__pill--muted" title="Fuso horário">
            🕒 ${escapeHTML(stadium.timezone)}
          </span>
        </div>
      </div>

      <span class="stadium-card__cta" aria-hidden="true">
        Ver em 3D
        <span class="stadium-card__arrow">→</span>
      </span>
    </button>
  `;
}
