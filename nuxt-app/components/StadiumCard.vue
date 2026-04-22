<script setup>
// Card de estádio: bandeira do país, pins, capacidade, TZ, CTA "Ver em 3D".
// Ex-js/components/stadiumCard.js. O parent escuta @click para abrir o modal 3D.
import { computed } from 'vue';

const props = defineProps({
  stadium: { type: Object, required: true }
});

const emit = defineEmits(['click']);

const COUNTRY_META = {
  'EUA':    { cls: 'usa', flag: '🇺🇸' },
  'México': { cls: 'mex', flag: '🇲🇽' },
  'Canadá': { cls: 'can', flag: '🇨🇦' }
};

const meta = computed(() => COUNTRY_META[props.stadium.country] || { cls: 'usa', flag: '🏟️' });

const capacityText = computed(() =>
  Number(props.stadium.capacity || 0).toLocaleString('pt-BR')
);

const ariaLabel = computed(() =>
  `Abrir vista satélite do ${props.stadium.name}, ${props.stadium.city}`
);

const pinIcon = computed(() => icon('mapPin', 12));

function handleClick() {
  emit('click', props.stadium);
}
</script>

<template>
  <button
    type="button"
    class="stadium-card"
    :class="[
      `stadium-card--${meta.cls}`,
      { 'stadium-card--final': stadium.isFinal }
    ]"
    :data-stadium-id="stadium.id"
    :aria-label="ariaLabel"
    @click="handleClick"
  >
    <span
      v-if="stadium.isFinal"
      class="stadium-card__final-pin"
      aria-hidden="true"
    >🏆 FINAL</span>

    <div class="stadium-card__flag" aria-hidden="true">{{ meta.flag }}</div>

    <div class="stadium-card__body">
      <h3 class="stadium-card__name">{{ stadium.name }}</h3>
      <div class="stadium-card__city">
        <span v-html="pinIcon"></span>
        <span>{{ stadium.city }}</span>
      </div>
      <div class="stadium-card__meta">
        <span class="stadium-card__pill" title="Capacidade">
          👥 {{ capacityText }}
        </span>
        <span class="stadium-card__pill stadium-card__pill--muted" title="Fuso horário">
          🕒 {{ stadium.timezone }}
        </span>
      </div>
    </div>

    <span class="stadium-card__cta" aria-hidden="true">
      Ver em 3D
      <span class="stadium-card__arrow">→</span>
    </span>
  </button>
</template>
