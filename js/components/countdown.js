import { icon } from '../icons.js';

const DEFAULT_TARGET = '2026-06-11T20:00:00-04:00';

function renderIntro() {
  return `
    <div class="countdown-hero__intro">
      <span class="countdown-hero__badge">
        ${icon('trophy', 14)} Contagem Oficial 2026
      </span>
      <h1 class="countdown-hero__title">
        O Mundo se une em<br>
        <span class="countdown-hero__title-accent">Junho de 2026</span>
      </h1>
      <p class="countdown-hero__description">
        Prepare-se para a maior edição da história. 48 seleções, 3 países sede e um único sonho. Acompanhe cada segundo até o apito inicial.
      </p>
      <div class="countdown-hero__actions">
        <button class="btn btn--primary" id="countdown-notify-btn" type="button">
          ${icon('bell', 16)} Ativar Notificação
        </button>
        <button class="btn btn--secondary" id="countdown-share-btn" type="button">
          ${icon('share2', 16)} Compartilhar
        </button>
      </div>
    </div>
  `;
}

function renderInfoBar() {
  return `
    <div class="countdown-info">
      <div class="countdown-info__item">
        <span class="countdown-info__icon countdown-info__icon--blue">${icon('mapPin', 16)}</span>
        <div>
          <span class="countdown-info__label">Locais</span>
          <span class="countdown-info__value">EUA, Canadá e México</span>
        </div>
      </div>
      <div class="countdown-info__divider"></div>
      <div class="countdown-info__item">
        <span class="countdown-info__icon countdown-info__icon--emerald">${icon('calendar', 16)}</span>
        <div>
          <span class="countdown-info__label">Início</span>
          <span class="countdown-info__value">11 Jun 2026</span>
        </div>
      </div>
    </div>
  `;
}

export function renderCountdown(targetDate = DEFAULT_TARGET) {
  const target = new Date(targetDate).getTime();
  const diff = target - Date.now();

  if (diff <= 0) {
    return `
      <section class="countdown-hero countdown-hero--live">
        ${renderIntro()}
        <div class="countdown-hero__meta">
          <div class="countdown-live-banner">
            ⚽ Torneio em andamento!
          </div>
          ${renderInfoBar()}
        </div>
      </section>
    `;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  return `
    <section class="countdown-hero">
      ${renderIntro()}
      <div class="countdown-hero__meta">
        <div class="countdown-grid">
          <div class="countdown-item">
            <span class="countdown-number" id="cd-days">${days}</span>
            <span class="countdown-label">Dias</span>
          </div>
          <div class="countdown-item">
            <span class="countdown-number" id="cd-hours">${hours}</span>
            <span class="countdown-label">Horas</span>
          </div>
          <div class="countdown-item">
            <span class="countdown-number" id="cd-mins">${mins}</span>
            <span class="countdown-label">Minutos</span>
          </div>
          <div class="countdown-item">
            <span class="countdown-number" id="cd-secs">${secs}</span>
            <span class="countdown-label">Segundos</span>
          </div>
        </div>
        ${renderInfoBar()}
      </div>
    </section>
  `;
}

export function updateCountdown(targetDate = DEFAULT_TARGET) {
  const target = new Date(targetDate).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return;

  const values = {
    'cd-days': Math.floor(diff / (1000 * 60 * 60 * 24)),
    'cd-hours': Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    'cd-mins': Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    'cd-secs': Math.floor((diff % (1000 * 60)) / 1000)
  };

  for (const [id, val] of Object.entries(values)) {
    const el = document.getElementById(id);
    if (el && el.textContent !== String(val)) {
      el.textContent = val;
      el.classList.add('animated');
      setTimeout(() => el.classList.remove('animated'), 400);
    }
  }
}
