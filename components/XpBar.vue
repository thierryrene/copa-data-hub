<script setup>
// Barra de progresso de XP/Nível do usuário. Lê diretamente de useUserStore.
import { computed } from 'vue';

const user = useUserStore();

const progress = computed(() => user.getXPProgress());

const zapIcon = computed(() => icon('zap', 16));
</script>

<template>
  <div class="xp-bar-container">
    <div class="xp-bar-header">
      <span class="xp-bar-level">
        <span v-html="zapIcon"></span>
        Nível {{ progress.level }}
      </span>
      <span class="xp-bar-points">{{ progress.xp }} XP</span>
    </div>
    <div class="xp-bar-track">
      <div
        class="xp-bar-fill"
        :style="{ width: progress.percent + '%' }"
      ></div>
    </div>
  </div>
</template>
