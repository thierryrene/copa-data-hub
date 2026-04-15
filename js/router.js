// CopaDataHub 2026 — SPA Router (Hash-based)

/**
 * Simple hash-based router for the SPA
 */
export class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.onNavigate = null;

    window.addEventListener('hashchange', () => this._handleRoute());
  }

  /**
   * Register a route
   */
  addRoute(name, handler) {
    this.routes[name] = handler;
  }

  /**
   * Navigate to a route
   */
  navigate(name) {
    window.location.hash = `#${name}`;
  }

  /**
   * Start the router — handle initial route
   */
  start(defaultRoute = 'home') {
    if (!window.location.hash) {
      window.location.hash = `#${defaultRoute}`;
    } else {
      this._handleRoute();
    }
  }

  /**
   * Handle route change
   */
  _handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const route = hash.split('/')[0];

    if (this.routes[route]) {
      this.currentRoute = route;
      this.routes[route]();
      if (this.onNavigate) {
        this.onNavigate(route);
      }
    }
  }

  /**
   * Get current route name
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
}
