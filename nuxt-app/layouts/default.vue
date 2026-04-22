<script setup>
// Layout default — monta o shell global (header, banners, toast, live card e
// bottom-nav). Inicializa mock e tema client-side.
import { computed, onMounted } from 'vue';

const route = useRoute();
const routeName = computed(() => {
  // Usa o path (sem barra inicial) como data-page para o CSS reaproveitar
  // seletores existentes tipo .page[data-page="jogos"].
  const p = route.path.replace(/^\/+/, '').split('/')[0];
  return p || 'home';
});

onMounted(() => {
  // Boot client-side: tema/paleta primeiro (evita flash) e depois mock.
  const settings = useSettingsStore();
  settings.bootThemeAndPalette();

  const mock = useMockStore();
  mock.boot();
});
</script>

<template>
  <div id="app-root">
    <AppHeader />
    <MockBanner />
    <ToastContainer />
    <main id="app">
      <div class="page active" :data-page="routeName">
        <slot />
      </div>
    </main>
    <InstallBanner />
    <LiveMatchCard />
    <AppBottomNav />
  </div>
</template>
