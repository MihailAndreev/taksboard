import { Router } from './router.js';
import { renderHeader } from './components/header/header.js';
import { renderFooter } from './components/footer/footer.js';

// Initialize router
const router = new Router();

// Define routes
router.addRoute('/', () => import('./pages/index/index.js').then(m => m.renderIndex()));
router.addRoute('/dashboard', () => import('./pages/dashboard/dashboard.js').then(m => m.renderDashboard()));

// Route definitions for future pages (not yet created)
router.addRoute('/login', () => Promise.resolve('<h1>Login Page</h1>'));
router.addRoute('/register', () => Promise.resolve('<h1>Register Page</h1>'));
router.addRoute('/projects', () => Promise.resolve('<h1>Projects Page</h1>'));
router.addRoute('/projects/:id/tasks', (params) => Promise.resolve(`<h1>Tasks for Project ${params.id}</h1>`));

// Expose router globally for navigation
window.appRouter = router;

// Render static components
renderHeader();
renderFooter();

// Initialize router
router.init();

// Listen for browser back/forward buttons
window.addEventListener('popstate', () => {
  router.navigate(window.location.pathname);
});
