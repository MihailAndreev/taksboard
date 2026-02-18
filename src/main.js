import { Router } from './router.js';
import { renderHeader } from './components/header/header.js';
import { renderFooter } from './components/footer/footer.js';
import { supabase } from './lib/supabaseClient.js';

// Initialize router
const router = new Router();

// Define routes
router.addRoute('/', () => import('./pages/index/index.js').then(m => m.renderIndex()));
router.addRoute('/dashboard', () => import('./pages/dashboard/dashboard.js').then(m => m.renderDashboard()));

// Route definitions for auth pages
router.addRoute('/login', () => import('./pages/login/login.js').then(m => m.renderLogin()));
router.addRoute('/register', () => import('./pages/register/register.js').then(m => m.renderRegister()));

// Project routes
router.addRoute('/projects', () => import('./pages/projects/projects.js').then(m => m.renderProjects()));
router.addRoute('/projects/add', () => import('./pages/projects/projects-add.js').then(m => m.renderProjectsAdd()));
router.addRoute('/projects/edit/:id', (params) => import('./pages/projects/projects-edit.js').then(m => m.renderProjectsEdit(params)));
router.addRoute('/projects/:id', (params) => Promise.resolve(`
  <div class="page-container">
    <h1>Project Details</h1>
    <p>Project ID: ${params.id}</p>
    <p>This page will show project details and tasks.</p>
    <a href="/dashboard" data-link>← Back to Dashboard</a>
  </div>
`));
router.addRoute('/projects/:id/tasks', (params) => Promise.resolve(`<h1>Tasks for Project ${params.id}</h1>`));

// Expose router globally for navigation
window.appRouter = router;

// Render static components
renderFooter();

const initializeApp = async () => {
  const { data } = await supabase.auth.getSession();
  renderHeader(data?.session?.user ?? null);

  supabase.auth.onAuthStateChange((_event, session) => {
    renderHeader(session?.user ?? null);
  });

  // Initialize router
  router.init();
};

initializeApp();

// Listen for browser back/forward buttons
window.addEventListener('popstate', () => {
  router.navigate(window.location.pathname);
});
