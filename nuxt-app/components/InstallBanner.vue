<script setup>
// Stub do banner de instalação PWA. O fluxo completo (capturar beforeinstallprompt,
// disparar prompt, dismiss em settings) será portado quando o composable usePwa()
// for criado. Por ora fica escondido.
// TODO: conectar a usePwa() quando disponível; mostrar banner com base em
// deferredPrompt + settings.installDismissed.

const visible = ref(false);

function install() {}
function close() { visible.value = false; }
</script>

<template>
  <div v-if="visible" class="install-banner">
    <div class="install-banner__icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
    </div>
    <div class="install-banner__text">
      <div class="install-banner__title">Instalar CopaDataHub</div>
      <div class="install-banner__desc">Acesso rápido na tela inicial</div>
    </div>
    <button class="install-banner__btn" type="button" @click="install">Instalar</button>
    <button class="install-banner__close" type="button" aria-label="Fechar" @click="close">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  </div>
</template>
