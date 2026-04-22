<script setup>
const props = defineProps({
  standings: { type: Array, default: () => [] }
});
</script>

<template>
  <p v-if="!standings?.length" class="text-sm text-muted">Classificação não disponível.</p>
  <div v-else class="standings-wrap">
    <table class="standings-table">
      <thead>
        <tr>
          <th></th>
          <th>Equipe</th>
          <th>J</th>
          <th>V</th>
          <th>E</th>
          <th>D</th>
          <th>SG</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in standings" :key="s.rank">
          <td>{{ s.rank }}</td>
          <td>
            <span class="standings-team">
              <img
                v-if="s.team.logo"
                class="standings-team__logo"
                :src="s.team.logo"
                alt=""
                loading="lazy"
                onerror="this.style.display='none'"
              >
              <span class="standings-team__name">{{ s.team.name }}</span>
            </span>
          </td>
          <td>{{ s.played }}</td>
          <td>{{ s.won }}</td>
          <td>{{ s.drawn }}</td>
          <td>{{ s.lost }}</td>
          <td>{{ s.goalDiff > 0 ? '+' : '' }}{{ s.goalDiff }}</td>
          <td><strong>{{ s.points }}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
