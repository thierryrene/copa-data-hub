// HTML escaping e validação de URLs externas — regra dura de segurança
// definida em AGENTS.md §3.2.

const HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

export function isTrustedWikiUrl(rawUrl = '') {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    return (
      parsed.hostname === 'wikipedia.org' ||
      parsed.hostname.endsWith('.wikipedia.org') ||
      parsed.hostname === 'wikimedia.org' ||
      parsed.hostname.endsWith('.wikimedia.org')
    );
  } catch (_error) {
    return false;
  }
}

export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
