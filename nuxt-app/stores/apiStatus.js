// Pinia store: erro global da API-Football. Substitui o padrão de listeners
// manuais do js/util/apiStatus.js pela reatividade do Pinia — componentes
// observam `lastError` via `watch(() => api.lastError, ...)` ou lêem direto.
// Não persiste: estado é só em memória.

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const ERROR_KIND = {
  NO_KEY: 'no_key',          // chave ausente
  UNAUTHORIZED: 'unauth',    // 401/403 — chave inválida
  RATE_LIMIT: 'rate_limit',  // 429 — quota diária estourada
  NETWORK: 'network',        // fetch falhou
  HTTP: 'http',              // outros HTTP errors
  OK: 'ok'                   // sem erro recente
};

export const useApiStatusStore = defineStore('apiStatus', () => {
  const lastError = ref(null);

  const describeApiError = computed(() => {
    const err = lastError.value;
    if (!err) return null;
    switch (err.kind) {
      case ERROR_KIND.NO_KEY:
        return 'Chave da API-Football não configurada. Adicione em Configurações para liberar escalações, retrospecto, desfalques e estatísticas.';
      case ERROR_KIND.UNAUTHORIZED:
        return 'Chave da API-Football inválida ou expirada. Atualize em Configurações.';
      case ERROR_KIND.RATE_LIMIT:
        return 'Limite diário da API-Football atingido (100 requisições/dia no plano gratuito). Tente novamente mais tarde ou troque a chave em Configurações.';
      case ERROR_KIND.NETWORK:
        return 'Sem conexão com a API-Football. Verifique sua internet.';
      case ERROR_KIND.HTTP:
        return `Falha na API-Football${err.detail ? ` (${err.detail})` : ''}.`;
      default:
        return null;
    }
  });

  function setError(kind, detail = '') {
    lastError.value = { kind, detail, ts: Date.now() };
  }

  function clearError() {
    lastError.value = null;
  }

  function classifyHttpStatus(status) {
    if (status === 401 || status === 403) return ERROR_KIND.UNAUTHORIZED;
    if (status === 429) return ERROR_KIND.RATE_LIMIT;
    return ERROR_KIND.HTTP;
  }

  return {
    lastError,
    describeApiError,
    setError,
    clearError,
    classifyHttpStatus,
    ERROR_KIND
  };
});

export { };
