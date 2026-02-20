import './projects-edit.css';
import { supabase } from '../../lib/supabaseClient.js';

export async function renderProjectsEdit(params) {
  return {
    html: `
      <div class="page-container projects-edit-page">
        <div class="form-header">
          <h1>Edit Project</h1>
          <button class="btn-secondary btn-back" data-link="/projects">
            ← Back to Projects
          </button>
        </div>

        <div class="form-container">
          <div id="loading-state">
            <p class="loading-text">Loading project...</p>
          </div>

          <form id="edit-project-form" class="project-form" style="display: none;">
            <div class="form-group">
              <label for="project-title">Project Name *</label>
              <input
                type="text"
                id="project-title"
                name="title"
                placeholder="e.g., Website Redesign"
                required
                maxlength="100"
              />
              <span class="form-hint">Enter a descriptive name for your project</span>
            </div>

            <div class="form-group">
              <label for="project-key">Project Key *</label>
              <input
                type="text"
                id="project-key"
                name="project"
                placeholder="e.g., WEB-REDESIGN"
                required
                pattern="[A-Z0-9-]+"
                maxlength="50"
              />
              <span class="form-hint">Uppercase letters, numbers, and hyphens only (e.g., WEB-REDESIGN)</span>
            </div>

            <div class="form-group">
              <label for="project-description">Description</label>
              <textarea
                id="project-description"
                name="description"
                rows="4"
                placeholder="Describe your project goals and objectives..."
                maxlength="500"
              ></textarea>
              <span class="form-hint">Optional: Add more context about the project</span>
            </div>

            <div id="form-error" class="form-error"></div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" data-link="/projects">
                Cancel
              </button>
              <button type="submit" class="btn-primary" id="submit-btn">
                Save Changes
              </button>
            </div>
          </form>

          <div id="error-state" style="display: none;">
            <div class="error-message">
              <h3>Error Loading Project</h3>
              <p id="error-message-text"></p>
              <button class="btn-secondary" data-link="/projects">
                ← Back to Projects
              </button>
            </div>
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

      // Load project data
      const projectId = params.id;
      await loadProject(projectId);
    }
  };
}

async function loadProject(projectId) {
  const loadingState = document.getElementById('loading-state');
  const form = document.getElementById('edit-project-form');
  const errorState = document.getElementById('error-state');
  const errorMessageText = document.getElementById('error-message-text');

  try {
    // Fetch project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;

    if (!project) {
      throw new Error('Project not found');
    }

    // Populate form
    document.getElementById('project-title').value = project.title || '';
    document.getElementById('project-key').value = project.project || '';
    document.getElementById('project-description').value = project.description || '';

    // Show form, hide loading
    loadingState.style.display = 'none';
    form.style.display = 'block';

    // Setup form handlers
    setupForm(projectId, project);

  } catch (error) {
    console.error('Error loading project:', error);
    if (window.toast) window.toast.error('Error loading project: ' + error.message);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    errorMessageText.textContent = error.message || 'Failed to load project';
  }
}

function setupForm(projectId, originalProject) {
  const form = document.getElementById('edit-project-form');
  const keyInput = document.getElementById('project-key');
  const submitBtn = document.getElementById('submit-btn');
  const formError = document.getElementById('form-error');

  // Enforce uppercase on key input
  keyInput.addEventListener('input', () => {
    keyInput.value = keyInput.value.toUpperCase();
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const title = formData.get('title').trim();
    const project = formData.get('project').trim();
    const description = formData.get('description').trim();

    // Validate
    if (!title || !project) {
      showError('Please fill in all required fields');
      if (window.toast) window.toast.error('Please fill in all required fields');
      return;
    }

    // Validate project key format
    if (!/^[A-Z0-9-]+$/.test(project)) {
      showError('Project Key must contain only uppercase letters, numbers, and hyphens');
      if (window.toast) window.toast.error('Project Key must contain only uppercase letters, numbers, and hyphens');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
      formError.textContent = '';

      // Update project
      const { data: updatedProject, error } = await supabase
        .from('projects')
        .update({
          title,
          project,
          description: description || null
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          showError('A project with this key already exists. Please choose a different key.');
          if (window.toast) window.toast.error('A project with this key already exists. Please choose a different key.');
          return;
        }
        throw error;
      }

      console.log('Project updated:', updatedProject);

      // Show success toast
      if (window.toast) window.toast.success('Project updated successfully!');

      // Redirect to projects list
      if (window.appRouter) {
        window.appRouter.go('/projects');
      }

    } catch (error) {
      console.error('Error updating project:', error);
      const errorMsg = error.message || 'Failed to update project. Please try again.';
      showError(errorMsg);
      if (window.toast) window.toast.error(errorMsg);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Changes';
    }
  });

  function showError(message) {
    formError.textContent = message;
    formError.style.display = 'block';
  }
}
