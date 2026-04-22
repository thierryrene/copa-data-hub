<script setup>
import { computed } from 'vue';

const props = defineProps({
  groupId: { type: String, required: true },
  teamCodes: { type: Array, required: true }
});

const mockStore = useMockStore();

const standings = computed(() => {
  const fixtures = applyMockToFixtures(FIXTURES, mockStore.scenario);
  return computeStandings(props.groupId, props.teamCodes, fixtures);
});

function rowClass(i) {
  if (i < 2) return 'qualified';
  if (i === 2) return 'third';
  return '';
}

function formLast3(form) {
  return form.slice(-3);
}

const scenarios = computed(() => {
  const st = standings.value;
  const played = st.some(s => s.played > 0);
  if (!played) return [];

  const maxGamesPerTeam = 3;
  return st.map((s, i) => {
    const gamesLeft = maxGamesPerTeam - s.played;
    if (gamesLeft === 0 && i >= 2) return null;
    if (gamesLeft === 0 && i < 2) return { html: `${s.team.flag} <b>${s.team.code}</b> já está classificado.` };

    const maxPossible = s.pts + gamesLeft * 3;
    const needed = st[1].pts - s.pts + 1;

    if (i < 2) {
      return { html: `${s.team.flag} <b>${s.team.code}</b> já está classificado — ainda joga ${gamesLeft}x.` };
    }
    if (i === 2) {
      if (maxPossible < st[1].pts) {
        return { html: `${s.team.flag} <b>${s.team.code}</b> disputará vaga como melhor 3º.` };
      }
      return { html: `${s.team.flag} <b>${s.team.code}</b> precisa de ${Math.max(0, needed)} pts para passar de 2º.` };
    }
    return { html: `${s.team.flag} <b>${s.team.code}</b> precisa vencer todos os jogos restantes para ter chance.` };
  }).filter(Boolean);
});

const shieldIcon = icon('shield', 18, 'text-gold');
const zapIcon = icon('zap', 12);
</script>

<template>
  <div class="card group-card">
    <div class="group-card__title">
      <span v-html="shieldIcon"></span> Grupo {{ groupId }}
    </div>
    <table class="group-table">
      <thead>
        <tr>
          <th>Seleção</th>
          <th title="Jogos">J</th>
          <th title="Vitórias">V</th>
          <th title="Empates">E</th>
          <th title="Derrotas">D</th>
          <th title="Saldo de Gols">SG</th>
          <th title="Pontos">Pts</th>
          <th title="Forma recente">Forma</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(s, i) in standings" :key="s.code" :class="rowClass(i)">
          <td>
            <button
              class="team-cell team-cell--button"
              type="button"
              :data-team-detail="s.code"
              :aria-label="`Ver detalhes de ${s.team?.name || s.code}`"
            >
              <span class="team-cell__pos">{{ i + 1 }}</span>
              <span class="team-cell__flag">{{ s.team?.flag || '' }}</span>
              {{ s.code }}
            </button>
          </td>
          <td>{{ s.played }}</td>
          <td>{{ s.won }}</td>
          <td>{{ s.drawn }}</td>
          <td>{{ s.lost }}</td>
          <td>{{ s.gd > 0 ? '+' : '' }}{{ s.gd }}</td>
          <td><strong>{{ s.pts }}</strong></td>
          <td class="group-table__form">
            <span v-if="!formLast3(s.form).length" class="form-strip__empty">—</span>
            <div v-else class="form-strip">
              <span
                v-for="(r, idx) in formLast3(s.form)"
                :key="idx"
                class="form-strip__pill"
                :class="`form-strip__pill--${r.toLowerCase()}`"
              >{{ r }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="group-card__legend">
      <span class="group-card__legend-dot group-card__legend-dot--q"></span> Classificado direto
      <span class="group-card__legend-dot group-card__legend-dot--t3"></span> Melhor 3º
    </div>
    <div v-if="scenarios.length" class="group-scenarios">
      <div class="group-scenarios__title">
        <span v-html="zapIcon"></span> Cenários
      </div>
      <ul class="group-scenarios__list">
        <li v-for="(n, i) in scenarios" :key="i" v-html="n.html"></li>
      </ul>
    </div>
  </div>
</template>
