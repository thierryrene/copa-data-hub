<script setup>
// Bottom nav global. As classes .nav-item / .active seguem o CSS existente
// (prompt menciona .bottom-nav__item mas o main.css usa .nav-item; mantive
// a nomenclatura do CSS).
import { icon } from '~/utils/icons';

const NAV_ITEMS = [
  { key: 'home',    to: '/',        label: 'Início',  ico: 'home' },
  { key: 'jogos',   to: '/jogos',   label: 'Jogos',   ico: 'target' },
  { key: 'grupos',  to: '/grupos',  label: 'Grupos',  ico: 'shield' },
  { key: 'fanzone', to: '/fanzone', label: 'FanZone', ico: 'gamepad' },
  { key: 'sedes',   to: '/sedes',   label: 'Sedes',   ico: 'mapPin' }
];

const route = useRoute();

function isActive(item) {
  if (item.to === '/') return route.path === '/';
  return route.path === item.to || route.path.startsWith(item.to + '/');
}
</script>

<template>
  <nav class="bottom-nav" aria-label="Navegação principal">
    <NuxtLink
      v-for="item in NAV_ITEMS"
      :key="item.key"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item) }"
      :aria-label="item.label"
    >
      <span v-html="icon(item.ico, 22)"></span>
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
