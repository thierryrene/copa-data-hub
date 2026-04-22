<script setup>
// Forma recente (últimos 5 W/D/L) para home/away lado a lado.
import { computed } from 'vue';

const props = defineProps({
  formHome: { type: Array, default: () => [] },
  formAway: { type: Array, default: () => [] },
  home: { type: Object, required: true },
  away: { type: Object, required: true }
});

function aggregate(form) {
  if (!form?.length) return null;
  const last = form.slice(-5);
  const gf = last.reduce((s, g) => s + (g.gf || 0), 0);
  const ga = last.reduce((s, g) => s + (g.ga || 0), 0);
  const w = last.filter((g) => g.result === 'W').length;
  return { gf, ga, w, total: last.length };
}

function cellClass(result) {
  if (result === 'W') return 'team-form__cell--w';
  if (result === 'L') return 'team-form__cell--l';
  return 'team-form__cell--d';
}

function cellTooltip(g) {
  return `${g.result} · ${g.gf}-${g.ga} vs ${g.opponent || '?'}`;
}

const aggH = computed(() => aggregate(props.formHome));
const aggA = computed(() => aggregate(props.formAway));
const hasAny = computed(() => !!(aggH.value || aggA.value));

const lastHome = computed(() => (props.formHome || []).slice(-5));
const lastAway = computed(() => (props.formAway || []).slice(-5));
</script>

<template>
  <div v-if="hasAny" class="team-form" aria-label="Forma recente de cada time">
    <div class="team-form__row team-form__row--home">
      <div class="team-form__head">
        <span class="team-form__flag">{{ home.flag || '' }}</span>
        <span class="team-form__name">{{ home.code }}</span>
      </div>
      <div class="team-form__cells" :aria-label="`Últimos 5 jogos de ${home.name}`">
        <template v-if="!lastHome.length">
          <span class="text-xs text-muted">Sem dados</span>
        </template>
        <span
          v-for="(g, idx) in lastHome"
          :key="`h-${idx}`"
          class="team-form__cell"
          :class="cellClass(g.result)"
          :title="cellTooltip(g)"
        >
          {{ g.result }}
        </span>
      </div>
      <div class="team-form__agg">
        <template v-if="aggH">{{ aggH.w }}V · {{ aggH.gf }}/{{ aggH.ga }} gols</template>
        <template v-else>—</template>
      </div>
    </div>

    <div class="team-form__row team-form__row--away">
      <div class="team-form__head">
        <span class="team-form__flag">{{ away.flag || '' }}</span>
        <span class="team-form__name">{{ away.code }}</span>
      </div>
      <div class="team-form__cells" :aria-label="`Últimos 5 jogos de ${away.name}`">
        <template v-if="!lastAway.length">
          <span class="text-xs text-muted">Sem dados</span>
        </template>
        <span
          v-for="(g, idx) in lastAway"
          :key="`a-${idx}`"
          class="team-form__cell"
          :class="cellClass(g.result)"
          :title="cellTooltip(g)"
        >
          {{ g.result }}
        </span>
      </div>
      <div class="team-form__agg">
        <template v-if="aggA">{{ aggA.w }}V · {{ aggA.gf }}/{{ aggA.ga }} gols</template>
        <template v-else>—</template>
      </div>
    </div>
  </div>
</template>
