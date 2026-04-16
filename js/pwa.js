// CopaDataHub 2026 — PWA Install Handler

import { icon } from './icons.js';

let deferredPrompt = null;

export function setupInstallPrompt(isDismissed = false) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (!isDismissed) {
      showInstallBanner();
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallBanner();
  });
}

function showInstallBanner() {
  const banner = document.getElementById('install-banner');
  if (banner) banner.classList.remove('hidden');
}

export function hideInstallBanner() {
  const banner = document.getElementById('install-banner');
  if (banner) banner.classList.add('hidden');
}

export async function triggerInstall() {
  if (!deferredPrompt) {
    alert('Para instalar:\n\n📱 Android: Toque no menu (⋮) do navegador → "Adicionar à tela inicial"\n\n🍎 iPhone: Toque no botão de compartilhar (↑) → "Na Tela de Início"');
    return;
  }

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
}

export function renderInstallBanner() {
  return `
    <div class="install-banner hidden" id="install-banner">
      <div class="install-banner__icon">
        ${icon('download', 22)}
      </div>
      <div class="install-banner__text">
        <div class="install-banner__title">Instalar CopaDataHub</div>
        <div class="install-banner__desc">Acesso rápido na tela inicial</div>
      </div>
      <button class="install-banner__btn" id="install-btn">
        Instalar
      </button>
      <button class="install-banner__close" id="install-close" aria-label="Fechar">
        ${icon('x', 16)}
      </button>
    </div>
  `;
}
