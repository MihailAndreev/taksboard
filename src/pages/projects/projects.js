import './projects.css';
import { supabase } from '../../lib/supabaseClient.js';

export async function renderProjects() {
  return {
    html: `
      <div class="page-container projects-page">
        <div class="projects-header">
          <h1>My Projects</h1>
          <button class="btn-primary btn-create" data-link="/projects/add">
            <span class="btn-icon">+</span>
            Create Project
          </button>
        </div>

        <div class="projects-content">
          <div id="projects-table-container">
            <p class="loading-text">Loading projects...</p>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div id="delete-modal" class="modal">
        <div class="modal-content">
          <h2>Delete Project</h2>
          <p>Are you sure you want to delete this project? This action cannot be undone.</p>
          <div class="modal-actions">
            <button id="cancel-delete" class="btn-secondary">Cancel</button>
            <button id="confirm-delete" class="btn-danger">Delete</button>
          </div>
        </div>
      </div>
    `,
    onMount: async () => {
      // Check if user is authenticated
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        if (window.appRouter) {
          window.appRouter.go('/login');
        }
        return;
      }

      // Load projects
      await loadProjectsList();
      
      // Setup delete modal handlers
      setupDeleteModal();
    }
  };
}

async function loadProjectsList() {
  const container = document.getElementById('projects-table-container');
  
  try {
    // Fetch projects with stages and tasks counts
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id, 
        title, 
        project, 
        description, 
        created_at,
        project_stages(id),
        tasks(id, done)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button class="btn-primary" data-link="/projects/add">
            <span class="btn-icon">+</span>
            Create Project
          </button>
        </div>
      `;
      return;
    }

    // Build table HTML
    let tableHTML = `
      <table class="projects-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th class="text-center"><span class="nowrap">Stages</span></th>
            <th class="text-center"><span class="nowrap">Open Tasks</span></th>
            <th class="text-center"><span class="nowrap">Tasks Done</span></th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    projects.forEach(project => {
      // Truncate description if longer than 80 characters
      const description = project.description || 'No description';
      const truncatedDescription = description.length > 80 
        ? description.substring(0, 80) + '...' 
        : description;
      
      // Count stages
      const stagesCount = project.project_stages?.length || 0;
      
      // Count open and done tasks
      const tasks = project.tasks || [];
      const openTasks = tasks.filter(task => !task.done).length;
      const doneTasks = tasks.filter(task => task.done).length;
      
      tableHTML += `
        <tr>
          <td class="project-title">
            <a href="/projects/${project.id}/tasks" data-link="/projects/${project.id}/tasks" class="project-link">
              ${escapeHtml(project.title)}
            </a>
          </td>
          <td class="project-description" title="${escapeHtml(description)}">
            ${escapeHtml(truncatedDescription)}
          </td>
          <td class="project-stat text-center">
            <span class="stat-badge stat-badge-gray">${stagesCount}</span>
          </td>
          <td class="project-stat text-center">
            <span class="stat-badge stat-badge-blue">${openTasks}</span>
          </td>
          <td class="project-stat text-center">
            <span class="stat-badge stat-badge-green">${doneTasks}</span>
          </td>
          <td class="project-actions text-center">
            <button class="btn-icon-action btn-view" data-link="/projects/${project.id}/tasks" title="View Tasks">
              <span>📋</span>
            </button>
            <button class="btn-icon-action btn-edit" data-link="/projects/edit/${project.id}" title="Edit">
              <span>✏️</span>
            </button>
            <button class="btn-icon-action btn-delete" data-project-id="${project.id}" data-project-title="${escapeHtml(project.title)}" title="Delete">
              <span>🗑️</span>
            </button>
          </td>
        </tr>
      `;
    });

    tableHTML += `
        </tbody>
      </table>
    `;

    container.innerHTML = tableHTML;

    // Setup delete button handlers
    setupDeleteButtons();

  } catch (error) {
    console.error('Error loading projects:', error);
    if (window.toast) window.toast.error('Error loading projects: ' + error.message);
    container.innerHTML = `
      <div class="error-state">
        <h3>Error loading projects</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function setupDeleteButtons() {
  const deleteButtons = document.querySelectorAll('.btn-delete');
  deleteButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const projectId = button.getAttribute('data-project-id');
      const projectTitle = button.getAttribute('data-project-title');
      
      showDeleteModal(projectId, projectTitle);
    });
  });
}

let deleteModalState = {
  projectId: null,
  projectTitle: null
};

function showDeleteModal(projectId, projectTitle) {
  deleteModalState.projectId = projectId;
  deleteModalState.projectTitle = projectTitle;
  
  const modal = document.getElementById('delete-modal');
  const modalContent = modal.querySelector('.modal-content');
  
  // Update modal text with project name
  const messageP = modalContent.querySelector('p');
  messageP.textContent = `Are you sure you want to delete "${projectTitle}"? This action cannot be undone.`;
  
  modal.classList.add('show');
}

function hideDeleteModal() {
  const modal = document.getElementById('delete-modal');
  modal.classList.remove('show');
  deleteModalState = { projectId: null, projectTitle: null };
}

function setupDeleteModal() {
  const modal = document.getElementById('delete-modal');
  const cancelBtn = document.getElementById('cancel-delete');
  const confirmBtn = document.getElementById('confirm-delete');

  // Cancel button
  cancelBtn.addEventListener('click', () => {
    hideDeleteModal();
  });

  // Confirm delete button
  confirmBtn.addEventListener('click', async () => {
    if (!deleteModalState.projectId) return;

    try {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Deleting...';

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', deleteModalState.projectId);

      if (error) throw error;

      hideDeleteModal();
      
      // Show success toast
      if (window.toast) window.toast.success('Project deleted successfully');
      
      // Reload the projects list
      await loadProjectsList();

    } catch (error) {
      console.error('Error deleting project:', error);
      if (window.toast) window.toast.error('Failed to delete project: ' + error.message);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete';
    }
  });

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideDeleteModal();
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
