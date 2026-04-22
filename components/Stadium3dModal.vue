<script setup>
// Modal fullscreen com iframe Google Maps (satélite) do estádio.
// Controlado pelo parent via prop `stadium` (null = fechado). Emite 'close'.
// Usa <Teleport> para sair do fluxo normal e evita scroll do body.
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue';

const props = defineProps({
  stadium: { type: Object, default: null }
});
const emit = defineEmits(['close']);

const isOpen = computed(() => !!props.stadium);
const animateIn = ref(false);

const flag = computed(() => {
  if (!props.stadium) return '';
  if (props.stadium.country === 'EUA') return '🇺🇸';
  if (props.stadium.country === 'México') return '🇲🇽';
  return '🇨🇦';
});

const embedSrc = computed(() => {
  if (!props.stadium) return '';
  return `https://maps.google.com/maps?q=${props.stadium.lat},${props.stadium.lng}&t=k&z=18&hl=pt-BR&output=embed`;
});

const externalUrl = computed(() => {
  if (!props.stadium) return '#';
  return `https://earth.google.com/web/@${props.stadium.lat},${props.stadium.lng},150a,500d,35y,0h,60t,0r`;
});

const capacityText = computed(() =>
  props.stadium ? Number(props.stadium.capacity || 0).toLocaleString('pt-BR') : ''
);

const pinIcon = computed(() => icon('mapPin', 16));

function close() {
  emit('close');
}

function onKeydown(e) {
  if (e.key === 'Escape' && isOpen.value) close();
}

// Trava o scroll do body enquanto aberto e aplica a classe de animação.
watch(isOpen, async (open) => {
  if (!import.meta.client) return;
  if (open) {
    document.body.style.overflow = 'hidden';
    await nextTick();
    requestAnimationFrame(() => { animateIn.value = true; });
  } else {
    document.body.style.overflow = '';
    animateIn.value = false;
  }
});

onMounted(() => {
  if (import.meta.client) document.addEventListener('keydown', onKeydown);
});
onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('keydown', onKeydown);
    document.body.style.overflow = '';
  }
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="stadium-3d"
      :class="{ 'stadium-3d--open': animateIn }"
    >
      <div class="stadium-3d__backdrop" @click="close"></div>
      <div
        class="stadium-3d__panel"
        role="dialog"
        :aria-label="`Vista do estádio ${stadium.name}`"
      >
        <header class="stadium-3d__head">
          <div>
            <div class="stadium-3d__name">{{ flag }} {{ stadium.name }}</div>
            <div class="stadium-3d__sub">
              {{ stadium.city }}, {{ stadium.country }} · {{ capacityText }} lugares
            </div>
          </div>
          <div class="stadium-3d__actions">
            <a
              class="stadium-3d__btn"
              :href="externalUrl"
              target="_blank"
              rel="noopener"
              title="Abrir no Google Earth (tour 3D)"
            >
              <span v-html="pinIcon"></span>
              Ver em 3D
            </a>
            <button
              class="stadium-3d__close"
              type="button"
              aria-label="Fechar"
              @click="close"
            >×</button>
          </div>
        </header>
        <div class="stadium-3d__viewer">
          <iframe
            :src="embedSrc"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
            :title="`Vista satélite de ${stadium.name}`"
          ></iframe>
        </div>
        <footer class="stadium-3d__foot">
          <span>📡 Vista satélite · arraste para explorar</span>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
