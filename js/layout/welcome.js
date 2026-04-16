import { TEAMS } from '../data.js';
import { saveState } from '../state.js';

export function renderWelcomeOverlay() {
  return `
    <div class="welcome-overlay" id="welcome-overlay" style="display: none;">
      <div class="welcome-logo">🏆</div>
      <h1 class="welcome-title">CopaDataHub 2026</h1>
      <p class="welcome-subtitle">Dados, previsões e bolão do maior torneio de seleções do mundo</p>

      <input type="text" class="welcome-name-input"
             placeholder="Seu nome (ex: João)"
             maxlength="30"
             autocomplete="given-name"
             id="welcome-name">

      <p class="text-sm text-muted" style="margin-top: var(--space-sm);">Escolha sua seleção favorita:</p>
      <div class="team-selector" id="team-selector"></div>

      <button class="btn btn--primary btn--full" id="welcome-start" style="max-width: 300px; margin-top: var(--space-lg);">
        Começar! ⚽
      </button>
    </div>
  `;
}

export function mountWelcome(state, onFinish) {
  const overlay = document.getElementById('welcome-overlay');
  if (!overlay) return;

  overlay.style.display = 'flex';

  const teamSelector = overlay.querySelector('.team-selector');
  if (teamSelector) {
    const teamEntries = Object.entries(TEAMS).sort((a, b) => a[1].name.localeCompare(b[1].name));
    teamSelector.innerHTML = teamEntries.map(([code, team]) => `
      <button class="team-selector-item" data-code="${code}">
        <span class="team-selector-item__flag">${team.flag}</span>
        <span>${team.code}</span>
      </button>
    `).join('');

    teamSelector.addEventListener('click', (e) => {
      const item = e.target.closest('.team-selector-item');
      if (!item) return;
      teamSelector.querySelectorAll('.team-selector-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      state.user.favoriteTeam = item.dataset.code;
    });
  }

  const startBtn = overlay.querySelector('#welcome-start');
  const nameInput = overlay.querySelector('.welcome-name-input');

  const handleStart = () => {
    if (nameInput && nameInput.value.trim()) {
      state.user.name = nameInput.value.trim();
    } else {
      state.user.name = 'Torcedor';
    }
    const safeId = Math.random().toString(36).substring(2, 10);
    state.user.id = 'usr_' + safeId;
    state.user.onboarded = true;

    saveState(state);

    overlay.classList.add('closing');
    setTimeout(() => {
      overlay.style.display = 'none';
      onFinish();
    }, 500);
  };

  if (startBtn) {
    startBtn.addEventListener('click', handleStart);
  }

  if (nameInput) {
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleStart();
    });
  }
}
