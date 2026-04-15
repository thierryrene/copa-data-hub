// CopaDataHub 2026 — PWA Install Handler

import { icon } from './icons.js';

let deferredPrompt = null;
let installBanner = null;

/**
 * Register service worker
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ Service Worker registered:', reg.scope);
      })
      .catch(err => {
        console.warn('⚠️ SW registration failed:', err);
      });
  }
}

/**
 * Setup the install prompt handler
 */
export function setupInstallPrompt(isDismissed = false) {
  // Capture the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (!isDismissed) {
      showInstallBanner();
    }
  });

  // Track successful install
  window.addEventListener('appinstalled', () => {
    console.log('✅ App installed');
    deferredPrompt = null;
    hideInstallBanner();
  });
}

/**
 * Show the custom install banner
 */
function showInstallBanner() {
  installBanner = document.getElementById('install-banner');
  if (installBanner) {
    installBanner.classList.remove('hidden');
  }
}

/**
 * Hide the install banner
 */
export function hideInstallBanner() {
  const banner = document.getElementById('install-banner');
  if (banner) {
    banner.classList.add('hidden');
  }
}

/**
 * Trigger the native install prompt
 */
export async function triggerInstall() {
  if (!deferredPrompt) {
    // If no deferred prompt, show manual instructions
    alert('Para instalar:\n\n📱 Android: Toque no menu (⋮) do navegador → "Adicionar à tela inicial"\n\n🍎 iPhone: Toque no botão de compartilhar (↑) → "Na Tela de Início"');
    return;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    console.log('✅ Install accepted');
  }

  deferredPrompt = null;
}

/**
 * Render the install banner HTML
 */
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
