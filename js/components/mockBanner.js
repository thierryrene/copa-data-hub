// Banner global do MODO DEMO. Aparece quando há cenário de mock ativo
// e permite trocar/desativar diretamente — recarregando a rota atual.

import { getMockScenario, setMockScenario, SCENARIOS, SCENARIO_LABEL } from '../util/mockMode.js';

export function renderMockBanner() {
  const s = getMockScenario();
  if (!s) return '';
  const opts = SCENARIOS.map(sc =>
    `<option value="${sc}" ${sc === s ? 'selected' : ''}>${SCENARIO_LABEL[sc]}</option>`
  ).join('');
  return `
    <div class="mock-banner" id="global-mock-banner" role="status">
      <span class="mock-banner__pill">MODO DEMO</span>
      <span class="mock-banner__lbl">Cenário:</span>
      <select id="global-mock-select" class="mock-banner__select" aria-label="Cenário do modo demo">
        ${opts}
      </select>
      <button class="mock-banner__off" id="global-mock-off" type="button">Desativar</button>
    </div>
  `;
}

export function bindMockBanner() {
  const select = document.getElementById('global-mock-select');
  if (select) {
    select.addEventListener('change', () => {
      setMockScenario(select.value);
      window.location.reload();
    });
  }
  const off = document.getElementById('global-mock-off');
  if (off) {
    off.addEventListener('click', () => {
      setMockScenario(null);
      window.location.reload();
    });
  }
}
