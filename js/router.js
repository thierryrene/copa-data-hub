// CopaDataHub 2026 — SPA Router (History API)

const ROUTE_SEPARATOR = '/';

export class Router {
  constructor({ basePath = '' } = {}) {
    this.routes = {};
    this.currentRoute = null;
    this.currentParams = [];
    this.onNavigate = null;
    this.basePath = basePath.replace(/\/$/, '');
    this.defaultRoute = '';
    this.started = false;

    window.addEventListener('popstate', () => this._handleRoute());
    document.addEventListener('click', (event) => this._interceptLink(event));
  }

  addRoute(name, handler) {
    this.routes[name] = handler;
  }

  navigate(name, { replace = false, params = [] } = {}) {
    const targetName = this.routes[name] ? name : this.defaultRoute;
    const path = this._buildPath(targetName, params);
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({ route: targetName, params }, '', path);
    this._handleRoute();
  }

  start(defaultRoute = 'inicio') {
    this.defaultRoute = defaultRoute;
    this.started = true;

    const legacy = this._legacyHashRoute();
    if (legacy) {
      this.navigate(legacy.name, { replace: true, params: legacy.params });
      return;
    }

    const { name } = this._parseLocation();
    if (!name || !this.routes[name]) {
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

    if (!name || !this.routes[name]) {
      if (this.started) {
        this.navigate(this.defaultRoute, { replace: true });
      }
      return;
    }

    this.currentRoute = name;
    this.currentParams = params;
    this.routes[name](params);
    if (this.onNavigate) this.onNavigate(name, params);
  }

  _parseLocation() {
    const pathname = window.location.pathname || '/';
    const stripped = this.basePath && pathname.startsWith(this.basePath)
      ? pathname.slice(this.basePath.length)
      : pathname;
    const segments = stripped.split(ROUTE_SEPARATOR).filter(Boolean).map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch (_error) {
        return seg;
      }
    });
    return {
      name: segments[0] || '',
      params: segments.slice(1)
    };
  }

  _legacyHashRoute() {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    const segments = hash.split(ROUTE_SEPARATOR).filter(Boolean).map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch (_error) {
        return seg;
      }
    });
    if (!segments.length) return null;
    return { name: segments[0], params: segments.slice(1) };
  }

  _buildPath(name, params) {
    const segments = [name, ...params].filter(Boolean).map((seg) => encodeURIComponent(String(seg)));
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
    try {
      url = new URL(href, window.location.href);
    } catch (_error) {
      return;
    }

    if (url.origin !== window.location.origin) return;

    event.preventDefault();

    const relative = this.basePath && url.pathname.startsWith(this.basePath)
      ? url.pathname.slice(this.basePath.length)
      : url.pathname;
    const segments = relative.split(ROUTE_SEPARATOR).filter(Boolean).map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch (_error) {
        return seg;
      }
    });
    const [name = this.defaultRoute, ...params] = segments;
    this.navigate(name, { params });
  }
}
