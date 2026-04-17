// CopaDataHub 2026 — SPA Router (History API)
//
// Modelo declarativo de rotas com pattern matching ("/selecoes/:slug") e
// suporte a fallback 404 explícito. Sem redirects mágicos — a URL na barra
// sempre corresponde ao que foi renderizado.
//
// Uso:
//   router.addRoute('home', '/', handler);
//   router.addRoute('team', '/selecoes/:slug', handler);
//   router.addRoute('*', null, notFoundHandler);
//   router.start();

const ROUTE_SEPARATOR = '/';

function trimSlashes(s = '') {
  return String(s).replace(/^\/+|\/+$/g, '');
}

function safeDecode(s) {
  try { return decodeURIComponent(s); }
  catch { return s; }
}

/**
 * Compila um pattern como "/selecoes/:slug" em:
 *   { segments: ['selecoes', {param: 'slug'}], minLen, maxLen }
 * Match retorna { params: {slug: 'brasil'} } ou null.
 */
function compilePattern(pattern) {
  const clean = trimSlashes(pattern || '');
  const segments = clean === '' ? [] : clean.split(ROUTE_SEPARATOR).map((seg) => {
    if (seg.startsWith(':')) return { param: seg.slice(1) };
    return seg;
  });
  return { segments };
}

function matchPattern(pattern, pathSegments) {
  if (pattern.segments.length !== pathSegments.length) return null;
  const params = {};
  for (let i = 0; i < pattern.segments.length; i++) {
    const patSeg = pattern.segments[i];
    const urlSeg = pathSegments[i];
    if (typeof patSeg === 'string') {
      if (patSeg !== urlSeg) return null;
    } else {
      params[patSeg.param] = urlSeg;
    }
  }
  return { params };
}

export class Router {
  constructor({ basePath = '' } = {}) {
    this.routes = [];
    this.notFoundHandler = null;
    this.basePath = basePath.replace(/\/+$/, '');
    this.currentRoute = null;
    this.currentParams = {};
    this.onNavigate = null;
    this._started = false;

    window.addEventListener('popstate', () => this._handleRoute());
    document.addEventListener('click', (event) => this._interceptLink(event));
  }

  /**
   * Registra uma rota.
   * @param {string} name - Nome identificador (ex: "home", "team").
   * @param {string|null} pattern - Path pattern ("/selecoes/:slug"). null = rota sem URL (raro).
   * @param {function} handler - Recebe ({ params, name, query }).
   */
  addRoute(name, pattern, handler) {
    if (name === '*' || pattern == null) {
      this.notFoundHandler = handler;
      return;
    }
    this.routes.push({ name, pattern, compiled: compilePattern(pattern), handler });
  }

  /**
   * Navega para uma rota registrada pelo nome.
   */
  navigate(name, { params = {}, replace = false } = {}) {
    const route = this.routes.find(r => r.name === name);
    if (!route) {
      console.warn(`[router] rota desconhecida: ${name}`);
      return;
    }
    const path = this._buildPath(route.pattern, params);
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({ name, params }, '', path);
    this._handleRoute();
  }

  /**
   * Navega diretamente para uma URL (útil para links externos internos).
   */
  navigateToPath(path, { replace = false } = {}) {
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({}, '', path);
    this._handleRoute();
  }

  start() {
    this._started = true;
    this._handleRoute();
  }

  getCurrentRoute() { return this.currentRoute; }
  getCurrentParams() { return { ...this.currentParams }; }

  // ── internals ──

  _handleRoute() {
    const pathSegments = this._currentSegments();
    const match = this._match(pathSegments);

    if (match) {
      this.currentRoute = match.route.name;
      this.currentParams = match.params;
      try {
        match.route.handler({ params: match.params, name: match.route.name });
      } catch (err) {
        console.error(`[router] erro no handler da rota "${match.route.name}":`, err);
        this._runNotFound({ error: err });
        return;
      }
      if (this.onNavigate) this.onNavigate(match.route.name, match.params);
      return;
    }

    this._runNotFound();
  }

  _runNotFound() {
    this.currentRoute = null;
    this.currentParams = {};
    if (this.notFoundHandler) {
      try { this.notFoundHandler({ path: window.location.pathname }); }
      catch (err) { console.error('[router] erro no handler 404:', err); }
    }
    if (this.onNavigate) this.onNavigate(null, {});
  }

  _match(pathSegments) {
    for (const route of this.routes) {
      const m = matchPattern(route.compiled, pathSegments);
      if (m) return { route, params: m.params };
    }
    return null;
  }

  _currentSegments() {
    const pathname = window.location.pathname || '/';
    const stripped = this.basePath && pathname.startsWith(this.basePath)
      ? pathname.slice(this.basePath.length)
      : pathname;
    return stripped.split(ROUTE_SEPARATOR).filter(Boolean).map(safeDecode);
  }

  _buildPath(pattern, params = {}) {
    const clean = trimSlashes(pattern);
    if (clean === '') return `${this.basePath}/`;
    const segments = clean.split(ROUTE_SEPARATOR).map((seg) => {
      if (seg.startsWith(':')) {
        const key = seg.slice(1);
        const value = params[key];
        if (value == null) {
          throw new Error(`[router] parâmetro "${key}" ausente ao construir "${pattern}"`);
        }
        return encodeURIComponent(String(value));
      }
      return seg;
    });
    return `${this.basePath}/${segments.join(ROUTE_SEPARATOR)}`;
  }

  _interceptLink(event) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = event.target.closest('a[data-route-link]');
    if (!anchor) return;
    if (anchor.target && anchor.target !== '_self') return;
    if (anchor.hasAttribute('download')) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    let url;
    try { url = new URL(href, window.location.href); }
    catch { return; }

    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    this.navigateToPath(url.pathname + url.search + url.hash);
  }
}
