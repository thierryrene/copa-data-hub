// Registro global do último erro da API-Football, consumido pela UI para exibir
// banners de "configure sua chave" / "limite atingido" sem precisar passar erro
// por todas as camadas. Apenas em memória (não persiste).

let lastError = null;
const listeners = new Set();

export const ERROR_KIND = {
  NO_KEY: 'no_key',          // chave ausente
  UNAUTHORIZED: 'unauth',    // 401/403 — chave inválida
  RATE_LIMIT: 'rate_limit',  // 429 — quota diária estourada
  NETWORK: 'network',        // fetch falhou
  HTTP: 'http',              // outros HTTP errors
  OK: 'ok'                   // sem erro recente
};

export function setApiError(kind, detail = '') {
  lastError = { kind, detail, ts: Date.now() };
  listeners.forEach(fn => { try { fn(lastError); } catch (_e) {} });
}

export function clearApiError() {
  lastError = null;
  listeners.forEach(fn => { try { fn(null); } catch (_e) {} });
}

export function getApiError() {
  return lastError;
}

export function onApiStatusChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Mapeia status HTTP para tipo de erro.
export function classifyHttpStatus(status) {
  if (status === 401 || status === 403) return ERROR_KIND.UNAUTHORIZED;
  if (status === 429) return ERROR_KIND.RATE_LIMIT;
  return ERROR_KIND.HTTP;
}

// Mensagens prontas em pt-BR para cada tipo.
export function describeApiError(err) {
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
}
