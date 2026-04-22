<script setup>
// Campo de escalação simples — versão usada em /selecoes/:slug.
// NÃO confundir com match/LineupField (mais complexo, contextual de partida).
// TODO: registerPlayerSlug do vanilla (api/player.js) — NÃO migrado ainda.
// Se o backend já estiver disponível em ~/api/player, trocar o stub abaixo.
import { computed } from 'vue';

const props = defineProps({
  lineup: { type: Object, default: null },
  teamFlag: { type: String, default: '' }
});

const flag = computed(() => props.teamFlag || '⚽');
const hasLineup = computed(() => !!props.lineup?.gk);

function shortName(fullName) {
  if (!fullName) return '?';
  const parts = String(fullName).split(' ');
  if (parts.length === 1) return parts[0];
  return parts[parts.length - 1];
}

function playerHref(p) {
  if (!p?.id || !p?.name) return '#';
  return `/jogadores/${slugify(p.name)}`;
}

function onImgError(e) {
  e.target.style.display = 'none';
}
</script>

<template>
  <div v-if="!hasLineup" class="lineup-field lineup-field--empty">
    <div class="lineup-field__pitch">
      <div class="lineup-field__message">Escalação indisponível no momento</div>
    </div>
  </div>

  <div v-else class="lineup-field">
    <div class="lineup-field__header">
      <span class="lineup-field__flag">{{ flag }}</span>
      <span class="lineup-field__formation">{{ lineup.formation }}</span>
    </div>
    <div class="lineup-field__pitch">
      <div class="lineup-field__lines">
        <template v-for="(line, idx) in lineup.lines" :key="`ln-${idx}`">
          <div v-if="line.length" class="lineup-field__row">
            <a
              v-for="(p, i) in line"
              :key="`p-${idx}-${i}`"
              class="lineup-field__player"
              :href="playerHref(p)"
              :data-route-link="p.id ? '' : null"
              :title="p.name"
              :aria-label="`Ver detalhes de ${p.name}`"
            >
              <img
                v-if="p.photo"
                class="lineup-field__photo"
                :src="p.photo"
                :alt="p.name"
                loading="lazy"
                @error="onImgError"
              >
              <span class="lineup-field__number">{{ p.number || '' }}</span>
              <span class="lineup-field__name">{{ shortName(p.name) }}</span>
            </a>
          </div>
        </template>
        <div class="lineup-field__row lineup-field__row--gk">
          <a
            class="lineup-field__player lineup-field__player--gk"
            :href="playerHref(lineup.gk)"
            :data-route-link="lineup.gk.id ? '' : null"
            :title="lineup.gk.name"
            :aria-label="`Ver detalhes de ${lineup.gk.name}`"
          >
            <img
              v-if="lineup.gk.photo"
              class="lineup-field__photo"
              :src="lineup.gk.photo"
              :alt="lineup.gk.name"
              loading="lazy"
              @error="onImgError"
            >
            <span class="lineup-field__number">{{ lineup.gk.number || '1' }}</span>
            <span class="lineup-field__name">{{ shortName(lineup.gk.name) }}</span>
          </a>
        </div>
      </div>
      <div class="lineup-field__markings">
        <div class="lineup-field__center-circle"></div>
        <div class="lineup-field__center-line"></div>
        <div class="lineup-field__penalty-area lineup-field__penalty-area--top"></div>
        <div class="lineup-field__penalty-area lineup-field__penalty-area--bottom"></div>
      </div>
    </div>
  </div>
</template>
