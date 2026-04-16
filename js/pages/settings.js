import { icon } from '../icons.js';
import { getTeam } from '../data.js';
import { renderXPBar } from '../components/xpBar.js';
import { showToast } from '../components/toast.js';
import { getXPProgress, saveState } from '../state.js';
import { triggerInstall } from '../pwa.js';
import { escapeHTML } from '../util/html.js';

function render(state) {
  const { level, xp } = getXPProgress(state);
  const favTeam = state.user.favoriteTeam ? getTeam(state.user.favoriteTeam) : null;

  return `
    <div class="section-title">${icon('settings', 20)} Configurações</div>

    <div class="card card--gold mb-xl">
      <div class="flex items-center gap-lg">
        ${favTeam
          ? `<a class="settings-profile__avatar settings-profile__avatar--link" href="/team/${encodeURIComponent(favTeam.code)}" data-route-link data-team-prefetch="${favTeam.code}" aria-label="Ver detalhes de ${favTeam.name}">${favTeam.flag}</a>`
          : `<div class="settings-profile__avatar">⚽</div>`}
        <div>
          <div class="font-display font-bold" style="font-size: var(--text-lg);">${state.user.name || 'Torcedor'}</div>
          <div class="text-sm text-muted">Nível ${level} · ${xp} XP · ${state.user.streak} dias de streak</div>
          ${favTeam
            ? `<a class="settings-profile__team-link" href="/team/${encodeURIComponent(favTeam.code)}" data-route-link data-team-prefetch="${favTeam.code}">${favTeam.flag} ${escapeHTML(favTeam.name)} →</a>`
            : ''}
        </div>
      </div>
      ${renderXPBar(state)}
    </div>

    <div class="settings-group">
      <div class="settings-group__title">Geral</div>

      <div class="settings-item" id="setting-install">
        <div class="settings-item__left">
          ${icon('download', 20, 'text-gold')}
          <div>
            <div class="settings-item__label">Instalar App</div>
            <div class="settings-item__desc">Adicionar à tela inicial do celular</div>
          </div>
        </div>
        ${icon('chevronRight', 18, 'text-muted')}
      </div>

      <div class="settings-item" id="setting-notifications">
        <div class="settings-item__left">
          ${icon('bell', 20, 'text-blue')}
          <div>
            <div class="settings-item__label">Notificações</div>
            <div class="settings-item__desc">Alertas de gols e resultados</div>
          </div>
        </div>
        <div class="toggle ${state.settings.notifications ? 'active' : ''}" id="toggle-notifications"></div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group__title">Sobre</div>

      <div class="settings-item">
        <div class="settings-item__left">
          ${icon('info', 20, 'text-muted')}
          <div>
            <div class="settings-item__label">CopaDataHub 2026</div>
            <div class="settings-item__desc">MVP v1.0 · PWA Instalável</div>
          </div>
        </div>
      </div>

      <div class="settings-item">
        <div class="settings-item__left">
          ${icon('shield', 20, 'text-muted')}
          <div>
            <div class="settings-item__label">Privacidade</div>
            <div class="settings-item__desc">Seus dados ficam no seu dispositivo</div>
          </div>
        </div>
        ${icon('chevronRight', 18, 'text-muted')}
      </div>
    </div>

    <div class="mt-xl text-center">
      <button class="btn btn--ghost btn--sm text-rose" id="btn-reset-data">Resetar todos os dados</button>
    </div>
  `;
}

function bindEvents(state) {
  const settingInstall = document.getElementById('setting-install');
  if (settingInstall) {
    settingInstall.addEventListener('click', () => triggerInstall());
  }

  const toggleNotifications = document.getElementById('toggle-notifications');
  if (toggleNotifications) {
    toggleNotifications.addEventListener('click', () => {
      state.settings.notifications = !state.settings.notifications;
      saveState(state);
      toggleNotifications.classList.toggle('active');
      showToast(
        state.settings.notifications ? '🔔 Notificações ativadas' : '🔕 Notificações desativadas',
        'success'
      );
    });
  }

  const resetBtn = document.getElementById('btn-reset-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Tem certeza? Todos os seus dados (XP, palpites, trivia) serão apagados.')) {
        localStorage.clear();
        window.location.reload();
      }
    });
  }
}

export default { render, bindEvents };
