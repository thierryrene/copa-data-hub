const DEFAULT_TARGET = '2026-06-11T20:00:00-04:00';

export function renderCountdown(targetDate = DEFAULT_TARGET) {
  const target = new Date(targetDate).getTime();
  const diff = target - Date.now();

  if (diff <= 0) {
    return `
      <div class="countdown-hero">
        <div class="countdown-hero__label">O maior torneio do mundo</div>
        <div class="countdown-hero__event">⚽ Em andamento!</div>
      </div>
    `;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  return `
    <div class="countdown-hero">
      <div class="countdown-hero__label">Faltam para o maior torneio do mundo</div>
      <div class="countdown-hero__event">🏆 11 de Junho de 2026</div>
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
          <span class="countdown-label">Min</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number" id="cd-secs">${secs}</span>
          <span class="countdown-label">Seg</span>
        </div>
      </div>
    </div>
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
