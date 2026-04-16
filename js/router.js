// CopaDataHub 2026 — SPA Router (History API)

const ROUTE_SEPARATOR = '/';

export class Router {
  constructor({ basePath = '' } = {}) {
    this.routes = {};
    this.currentRoute = null;
    this.currentParams = [];
    this.onNavigate = null;
    this.basePath = basePath.replace(/\/$/, '');

    window.addEventListener('popstate', () => this._handleRoute());
    document.addEventListener('click', (event) => this._interceptLink(event));
  }

  addRoute(name, handler) {
    this.routes[name] = handler;
  }

  navigate(name, { replace = false, params = [] } = {}) {
    const path = this._buildPath(name, params);
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({ route: name, params }, '', path);
    this._handleRoute();
  }

  start(defaultRoute = 'home') {
    const legacy = this._legacyHashRoute();
    if (legacy) {
      this.navigate(legacy.name, { replace: true, params: legacy.params });
      return;
    }

    const resolved = this._parseLocation();
    if (!resolved.name || !this.routes[resolved.name]) {
      this.navigate(defaultRoute, { replace: true });
      return;
    }
    this._handleRoute();
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getCurrentParams() {
    return this.currentParams.slice();
  }

  _handleRoute() {
    const { name, params } = this._parseLocation();
    const resolved = this.routes[name] ? name : Object.keys(this.routes)[0];
    if (!resolved) return;

    this.currentRoute = resolved;
    this.currentParams = params;
    this.routes[resolved](params);
    if (this.onNavigate) this.onNavigate(resolved, params);
  }

  _parseLocation() {
    const pathname = window.location.pathname || '/';
    const stripped = this.basePath && pathname.startsWith(this.basePath)
      ? pathname.slice(this.basePath.length)
      : pathname;
    const segments = stripped.split(ROUTE_SEPARATOR).filter(Boolean);
    return {
      name: segments[0] || '',
      params: segments.slice(1)
    };
  }

  _legacyHashRoute() {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    const segments = hash.split(ROUTE_SEPARATOR).filter(Boolean);
    if (!segments.length) return null;
    return { name: segments[0], params: segments.slice(1) };
  }

  _buildPath(name, params) {
    const segments = [name, ...params].filter(Boolean).map(encodeURIComponent);
    return `${this.basePath}/${segments.join(ROUTE_SEPARATOR)}`;
  }

  _interceptLink(event) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = event.target.closest('a[data-route-link]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('//')) return;

    event.preventDefault();
    const url = new URL(href, window.location.origin);
    const relative = url.pathname.replace(this.basePath, '') || '/';
    const segments = relative.split(ROUTE_SEPARATOR).filter(Boolean);
    const [name, ...params] = segments.length ? segments : ['home'];
    this.navigate(name, { params });
  }
}
