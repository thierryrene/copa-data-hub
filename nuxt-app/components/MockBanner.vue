<script setup>
// Banner global do MODO DEMO. Só renderiza quando há cenário ativo.
// Trocar o select ou clicar em "Desativar" altera o store e recarrega a rota.
import { SCENARIOS, SCENARIO_LABEL } from '~/stores/mock';

const mock = useMockStore();

function onChange(e) {
  mock.setScenario(e.target.value);
  if (import.meta.client) window.location.reload();
}

function onOff() {
  mock.setScenario(null);
  if (import.meta.client) window.location.reload();
}
</script>

<template>
  <div v-if="mock.isActive" class="mock-banner" role="status">
    <span class="mock-banner__pill">MODO DEMO</span>
    <span class="mock-banner__lbl">Cenário:</span>
    <select
      class="mock-banner__select"
      aria-label="Cenário do modo demo"
      :value="mock.scenario"
      @change="onChange"
    >
      <option v-for="sc in SCENARIOS" :key="sc" :value="sc">
        {{ SCENARIO_LABEL[sc] }}
      </option>
    </select>
    <button class="mock-banner__off" type="button" @click="onOff">Desativar</button>
  </div>
</template>
