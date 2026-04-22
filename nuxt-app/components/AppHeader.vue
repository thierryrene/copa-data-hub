<script setup>
// Header global: logo + título/subtítulo, busca (stub), configurações e badge XP.
// XP reativo ao useUserStore.
import { icon } from '~/utils/icons';

const user = useUserStore();

function onSearchClick() {
  // TODO: abrir overlay de busca quando SearchOverlay for migrado.
  // eslint-disable-next-line no-console
  console.log('search');
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__logo">
      <span style="font-size: 1.5rem;">🏆</span>
      <div>
        <div class="app-header__title">CopaDataHub</div>
        <div class="app-header__subtitle">2026 · EUA · CAN · MEX</div>
      </div>
    </div>
    <div class="app-header__actions">
      <button
        class="app-header__icon-btn"
        type="button"
        aria-label="Buscar seleções, estádios ou partidas"
        @click="onSearchClick"
        v-html="icon('search', 18)"
      ></button>
      <NuxtLink
        to="/configuracoes"
        class="app-header__icon-btn"
        aria-label="Abrir configurações"
        v-html="icon('settings', 18)"
      ></NuxtLink>
      <div class="app-header__badge">
        ⚡ <span>{{ user.xp }}</span> XP
      </div>
    </div>
  </header>
</template>
