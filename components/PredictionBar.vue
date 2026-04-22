<script setup>
// Barra home/empate/visitante (%) — "Previsão IA".
// Props são percentuais inteiros + códigos das seleções.
import { computed } from 'vue';

const props = defineProps({
  home: { type: Number, required: true },
  draw: { type: Number, required: true },
  away: { type: Number, required: true },
  homeCode: { type: String, required: true },
  awayCode: { type: String, required: true }
});

const homeTeam = computed(() => getTeam(props.homeCode));
const awayTeam = computed(() => getTeam(props.awayCode));

const zapIcon = computed(() => icon('zap', 16, 'text-gold'));
</script>

<template>
  <div class="prediction-bar">
    <div class="prediction-bar__title">
      <span v-html="zapIcon"></span>
      Previsão IA
    </div>
    <div class="prediction-bar__teams">
      <a
        v-if="homeTeam"
        class="prediction-bar__team"
        :href="`/selecoes/${homeTeam.slug}`"
        data-route-link
        :data-team-prefetch="homeTeam.code"
        :aria-label="`Ver detalhes de ${homeTeam.name}`"
      >
        <span>{{ homeTeam.flag }}</span> {{ homeTeam.code }}
      </a>
      <span v-else class="prediction-bar__team">{{ homeCode }}</span>

      <span class="prediction-bar__draw-label">Empate</span>

      <a
        v-if="awayTeam"
        class="prediction-bar__team"
        :href="`/selecoes/${awayTeam.slug}`"
        data-route-link
        :data-team-prefetch="awayTeam.code"
        :aria-label="`Ver detalhes de ${awayTeam.name}`"
      >
        <span>{{ awayTeam.flag }}</span> {{ awayTeam.code }}
      </a>
      <span v-else class="prediction-bar__team">{{ awayCode }}</span>
    </div>
    <div class="prediction-bar__track">
      <div
        class="prediction-bar__segment prediction-bar__segment--home"
        :style="{ width: home + '%' }"
      >{{ home }}%</div>
      <div
        class="prediction-bar__segment prediction-bar__segment--draw"
        :style="{ width: draw + '%' }"
      >{{ draw }}%</div>
      <div
        class="prediction-bar__segment prediction-bar__segment--away"
        :style="{ width: away + '%' }"
      >{{ away }}%</div>
    </div>
  </div>
</template>
