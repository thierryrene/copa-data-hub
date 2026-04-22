<script setup>
// Card de clima no estádio (códigos WMO → emoji + label pt-BR).
import { computed } from 'vue';

const props = defineProps({
  weather: { type: Object, default: null },
  stadium: { type: Object, default: null }
});

const WMO_MAP = {
  0:  { ico: '☀️',  lbl: 'Ensolarado' },
  1:  { ico: '🌤️',  lbl: 'Pouca nuvem' },
  2:  { ico: '⛅',   lbl: 'Parcialmente nublado' },
  3:  { ico: '☁️',  lbl: 'Nublado' },
  45: { ico: '🌫️',  lbl: 'Neblina' },
  48: { ico: '🌫️',  lbl: 'Neblina densa' },
  51: { ico: '🌦️',  lbl: 'Garoa fraca' },
  61: { ico: '🌧️',  lbl: 'Chuva fraca' },
  63: { ico: '🌧️',  lbl: 'Chuva moderada' },
  65: { ico: '🌧️',  lbl: 'Chuva forte' },
  71: { ico: '🌨️',  lbl: 'Neve fraca' },
  80: { ico: '🌧️',  lbl: 'Pancadas de chuva' },
  95: { ico: '⛈️',  lbl: 'Trovoada' },
  99: { ico: '⛈️',  lbl: 'Trovoada com granizo' }
};

const visible = computed(() => !!(props.weather && props.weather.temperature != null));
const desc = computed(() => WMO_MAP[props.weather?.weatherCode] || { ico: '🌡️', lbl: 'Tempo variável' });
const temp = computed(() => Math.round(props.weather?.temperature ?? 0));
const wind = computed(() => Math.round(props.weather?.windKmh ?? 0));
const rain = computed(() => Math.round(props.weather?.precipProbability ?? 0));
const where = computed(() => (props.stadium ? props.stadium.city : 'no estádio'));
</script>

<template>
  <div v-if="visible" class="card weather-card" aria-label="Condição climática do jogo">
    <div class="weather-card__main">
      <span class="weather-card__icon" aria-hidden="true">{{ desc.ico }}</span>
      <div class="weather-card__temp">{{ temp }}°C</div>
    </div>
    <div class="weather-card__meta">
      <div class="weather-card__lbl">{{ desc.lbl }} · {{ where }}</div>
      <div class="weather-card__details">
        <span title="Velocidade do vento">💨 {{ wind }} km/h</span>
        <span title="Chance de chuva">💧 {{ rain }}%</span>
      </div>
    </div>
  </div>
</template>
