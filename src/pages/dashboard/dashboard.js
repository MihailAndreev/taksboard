import './dashboard.css';
import { supabase } from '../../lib/supabaseClient.js';

export async function renderDashboard() {
  return {
    html: `
      <div class="page-container dashboard-page">
        <div class="dashboard-header">
          <h1>Dashboard</h1>
          <p id="dashboard-user">Welcome back! Here's your task overview.</p>
        </div>

      <div class="dashboard-grid">
        <div class="dashboard-card">
          <div class="card-icon">📊</div>
          <h3>Task Statistics</h3>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">Total</span>
              <span class="stat-value" id="total-tasks">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Pending</span>
              <span class="stat-value" id="pending-tasks">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Done</span>
              <span class="stat-value" id="done-tasks">0</span>
            </div>
          </div>
        </div>

        <div class="dashboard-card">
          <div class="card-icon">📁</div>
          <h3>My Projects</h3>
          <div class="project-count">
            <span class="stat-value" id="total-projects">0</span>
            <span class="stat-label">Total Projects</span>
          </div>
          <div class="project-list" id="project-list">
            <p class="loading-text">Loading projects...</p>
          </div>
          <button class="btn-manage-projects" data-link="/projects">
            Manage Projects →
          </button>
        </div>

        <div class="dashboard-card full-width">
          <h3>Recent Tasks</h3>
          <div class="tasks-list" id="recent-tasks-list">
            <p class="loading-text">Loading tasks...</p>
          </div>
        </div>
      </div>
    </div>
    `,
    onMount: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        if (window.appRouter) {
          window.appRouter.go('/login');
        }
        return;
      }

      const label = user.user_metadata?.full_name || user.email || 'there';
      const userLine = document.getElementById('dashboard-user');
      if (userLine) {
        userLine.textContent = `Welcome back, ${label}! Here's your task overview.`;
      }

      // Fetch user's projects
      await loadProjects();
      
      // Fetch tasks statistics
      await loadTasksStatistics();
      
      // Fetch recent tasks
      await loadRecentTasks();
    }
  };
}

async function loadProjects() {
  try {
    // Fetch projects where user is owner or member
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, title, description')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalProjectsEl = document.getElementById('total-projects');
    const projectListEl = document.getElementById('project-list');

    if (totalProjectsEl) {
      totalProjectsEl.textContent = projects?.length || 0;
    }

    if (projectListEl) {
      if (!projects || projects.length === 0) {
        projectListEl.innerHTML = '<p class="empty-state">No projects yet. Create your first project!</p>';
      } else {
        projectListEl.innerHTML = projects.map(project => `
          <a href="/projects/${project.id}" class="project-item" data-link>
            <span class="project-title">${escapeHtml(project.title)}</span>
            <span class="project-arrow">→</span>
          </a>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Error loading projects:', error);
    const projectListEl = document.getElementById('project-list');
    if (projectListEl) {
      projectListEl.innerHTML = '<p class="error-text">Error loading projects</p>';
    }
  }
}

async function loadTasksStatistics() {
  try {
    // Fetch all tasks for user's projects
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, done');

    if (error) throw error;

    const total = tasks?.length || 0;
    const done = tasks?.filter(task => task.done).length || 0;
    const pending = total - done;

    const totalEl = document.getElementById('total-tasks');
    const pendingEl = document.getElementById('pending-tasks');
    const doneEl = document.getElementById('done-tasks');

    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (doneEl) doneEl.textContent = done;
  } catch (error) {
    console.error('Error loading task statistics:', error);
  }
}

async function loadRecentTasks() {
  try {
    // Fetch recent tasks with project info
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        done,
        project_id,
        projects (title)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const recentTasksEl = document.getElementById('recent-tasks-list');

    if (recentTasksEl) {
      if (!tasks || tasks.length === 0) {
        recentTasksEl.innerHTML = '<p class="empty-state">No tasks yet.</p>';
      } else {
        recentTasksEl.innerHTML = tasks.map(task => `
          <div class="task-item">
            <input type="checkbox" ${task.done ? 'checked' : ''} disabled />
            <div class="task-details">
              <span class="task-title">${escapeHtml(task.title)}</span>
              <span class="task-project">${escapeHtml(task.projects?.title || 'Unknown Project')}</span>
            </div>
            <span class="task-status ${task.done ? 'completed' : 'pending'}">${task.done ? 'Done' : 'Pending'}</span>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Error loading recent tasks:', error);
    const recentTasksEl = document.getElementById('recent-tasks-list');
    if (recentTasksEl) {
      recentTasksEl.innerHTML = '<p class="error-text">Error loading tasks</p>';
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
