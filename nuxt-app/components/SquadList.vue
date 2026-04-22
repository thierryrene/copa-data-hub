<script setup>
import { POSITION_LABELS } from '~/api/squad';
import { registerPlayerSlug } from '~/api/player';
import { computed } from 'vue';

const props = defineProps({
  squad: { type: Object, default: null }
});

const GROUP_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

const sections = computed(() => {
  if (!props.squad || !props.squad.players?.length) return [];
  return GROUP_ORDER
    .filter(pos => props.squad.grouped[pos]?.length)
    .map(pos => ({
      pos,
      label: POSITION_LABELS[pos] || pos,
      players: props.squad.grouped[pos].map(p => {
        const slug = p.name ? slugify(p.name) : '';
        if (p.id && slug) registerPlayerSlug(slug, p.id);
        return { ...p, slug, hasLink: !!(p.id && slug) };
      })
    }));
});

const dateStr = computed(() => {
  if (!props.squad?.fetchedAt) return '';
  return new Date(props.squad.fetchedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
});
</script>

<template>
  <p v-if="!squad || !squad.players?.length" class="text-sm text-muted">
    Elenco não disponível no momento.
  </p>
  <div v-else class="squad-list">
    <div v-for="section in sections" :key="section.pos" class="squad-list__group">
      <div class="squad-list__group-title">{{ section.label }} ({{ section.players.length }})</div>
      <template v-for="p in section.players" :key="p.id || p.name">
        <a
          v-if="p.hasLink"
          class="squad-list__player"
          :href="`/jogadores/${p.slug}`"
          data-route-link
          :aria-label="`Ver detalhes de ${p.name}`"
        >
          <span class="squad-list__number">{{ p.number || '—' }}</span>
          <img
            v-if="p.photo"
            class="squad-list__photo"
            :src="p.photo"
            :alt="p.name"
            loading="lazy"
            onerror="this.style.display='none'"
          >
          <span v-else class="squad-list__photo-placeholder">⚽</span>
          <div class="squad-list__info">
            <span class="squad-list__name">{{ p.name }}</span>
            <span v-if="p.age" class="squad-list__age">{{ p.age }} anos</span>
          </div>
          <span class="squad-list__pos-badge">{{ p.positionShort }}</span>
        </a>
        <div
          v-else
          class="squad-list__player"
          :aria-label="`Ver detalhes de ${p.name}`"
        >
          <span class="squad-list__number">{{ p.number || '—' }}</span>
          <img
            v-if="p.photo"
            class="squad-list__photo"
            :src="p.photo"
            :alt="p.name"
            loading="lazy"
            onerror="this.style.display='none'"
          >
          <span v-else class="squad-list__photo-placeholder">⚽</span>
          <div class="squad-list__info">
            <span class="squad-list__name">{{ p.name }}</span>
            <span v-if="p.age" class="squad-list__age">{{ p.age }} anos</span>
          </div>
          <span class="squad-list__pos-badge">{{ p.positionShort }}</span>
        </div>
      </template>
    </div>
    <div class="squad-list__footer">
      {{ squad.totalPlayers }} jogadores · Fonte: API-Football<template v-if="dateStr"> · Atualizado em {{ dateStr }}</template>
    </div>
  </div>
</template>
