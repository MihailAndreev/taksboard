import { Router } from './router.js';
import { renderHeader } from './components/header/header.js';
import { renderFooter } from './components/footer/footer.js';
import { supabase } from './lib/supabaseClient.js';
import { toast } from './lib/toast.js';
import './lib/toast.css';

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
router.addRoute('/projects/:id/tasks', (params) => import('./pages/projects-id-tasks/projects-id-tasks.js').then(m => m.renderProjectTasks(params)));
router.addRoute('/projects/:id', (params) => Promise.resolve(`
  <div class="page-container">
    <h1>Project Details</h1>
    <p>Project ID: ${params.id}</p>
    <p>This page will show project details and tasks.</p>
    <a href="/projects" data-link>← Back to Projects</a>
  </div>
`));

// Expose router and toast globally for navigation and notifications
window.appRouter = router;
window.toast = toast;

// Render static components
renderFooter();

const initializeApp = async () => {
  const { data } = await supabase.auth.getSession();
  renderHeader(data?.session?.user ?? null);

  // Set supabase instance in router for auth checks
  router.setSupabase(supabase);

  supabase.auth.onAuthStateChange((_event, session) => {
    renderHeader(session?.user ?? null);
    
    // Redirect to dashboard if user just logged in and on home page
    if (session?.user && window.location.pathname === '/') {
      router.go('/dashboard');
    }
    // Redirect to home if user logged out and on protected page
    if (!session?.user && window.location.pathname === '/dashboard') {
      router.go('/');
    }
  });

  // Initialize router
  router.init();
};

initializeApp();

// Listen for browser back/forward buttons
window.addEventListener('popstate', () => {
  router.navigate(window.location.pathname);
});
