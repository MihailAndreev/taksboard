/**
 * Simple client-side router for SPA
 */
export class Router {
  constructor() {
    this.routes = [];
    this.contentElement = document.getElementById('content');
  }

  addRoute(path, handler) {
    this.routes.push({ path, handler, regex: this.pathToRegex(path) });
  }

  /**
   * Convert route path to regex for pattern matching
   * Supports :param syntax
   */
  pathToRegex(path) {
    const escaped = path.replace(/\//g, '\\/');
    const withParams = escaped.replace(/:([^\\/]+)/g, '(?<$1>[^\\/]+)');
    return new RegExp(`^${withParams}$`);
  }

  /**
   * Match a URL to a route and extract params
   */
  matchRoute(url) {
    for (const route of this.routes) {
      const match = route.regex.exec(url);
      if (match) {
        return { route, params: match.groups || {} };
      }
    }
    return null;
  }

  /**
   * Setup event delegation for dynamic links
   */
  setupLinkHandlers() {
    this.contentElement.removeEventListener('click', this.linkClickHandler);
    this.linkClickHandler = (e) => {
      // Find the closest element with data-link attribute (handles nested elements)
      const linkElement = e.target.closest('[data-link]');
      if (linkElement) {
        e.preventDefault();
        const path = linkElement.getAttribute('href') || linkElement.getAttribute('data-link');
        if (path) {
          this.go(path);
        }
      }
    };
    this.contentElement.addEventListener('click', this.linkClickHandler);
  }

  /**
   * Navigate to a URL
   */
  async navigate(url) {
    const match = this.matchRoute(url);

    if (!match) {
      this.contentElement.innerHTML = '<h1>404 - Page Not Found</h1>';
      return;
    }

    try {
      // Clear content
      this.contentElement.innerHTML = '<p>Loading...</p>';

      // Call route handler
      const content = await match.route.handler(match.params);
      let html = content;
      let onMount;

      if (content && typeof content === 'object' && 'html' in content) {
        html = content.html;
        onMount = content.onMount;
      }

      // Update DOM
      this.contentElement.innerHTML = html || '';

      // Setup link handlers for new content
      this.setupLinkHandlers();

      if (typeof onMount === 'function') {
        onMount();
      }

      // Scroll to top
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Navigation error:', error);
      this.contentElement.innerHTML = '<h1>Error Loading Page</h1>';
    }
  }

  /**
   * Initialize router and handle initial load
   */
  async init() {
    const currentPath = window.location.pathname;
    await this.navigate(currentPath);
  }

  /**
   * Programmatic navigation with history update
   */
  async go(url) {
    window.history.pushState({}, '', url);
    await this.navigate(url);
  }
}
