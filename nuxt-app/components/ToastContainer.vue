<script setup>
// Renderiza a fila de toasts global. Cada toast auto-remove após 3s
// (lógica em useToast). Ícone depende do kind.
import { icon } from '~/utils/icons';

const { toasts } = useToast();

function iconName(kind) {
  if (kind === 'success') return 'check';
  if (kind === 'error') return 'x';
  return 'zap'; // xp ou default
}
</script>

<template>
  <div class="toast-container" id="toast-container">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="toast"
      :class="`toast--${t.kind}`"
    >
      <span class="toast__icon" :class="`toast__icon--${t.kind}`" v-html="icon(iconName(t.kind), 20)"></span>
      <span class="toast__message">{{ t.message }}</span>
    </div>
  </div>
</template>
