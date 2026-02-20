import './projects-add.css';
import { supabase } from '../../lib/supabaseClient.js';

export async function renderProjectsAdd() {
  return {
    html: `
      <div class="page-container projects-add-page">
        <div class="form-header">
          <h1>Create New Project</h1>
          <button class="btn-secondary btn-back" data-link="/projects">
            ← Back to Projects
          </button>
        </div>

        <div class="form-container">
          <form id="add-project-form" class="project-form">
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
                Create Project
              </button>
            </div>
          </form>
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

      // Setup form handlers
      setupForm();
    }
  };
}

function setupForm() {
  const form = document.getElementById('add-project-form');
  const titleInput = document.getElementById('project-title');
  const keyInput = document.getElementById('project-key');
  const submitBtn = document.getElementById('submit-btn');
  const formError = document.getElementById('form-error');

  // Auto-generate project key from title
  titleInput.addEventListener('input', (e) => {
    const title = e.target.value;
    // Convert to uppercase, replace spaces with hyphens, remove special chars
    const generatedKey = title
      .toUpperCase()
      .replace(/\s+/g, '-')
      .replace(/[^A-Z0-9-]/g, '')
      .substring(0, 50);
    
    // Only auto-fill if user hasn't manually edited the key
    if (!keyInput.dataset.userEdited) {
      keyInput.value = generatedKey;
    }
  });

  // Track if user manually edits the key
  keyInput.addEventListener('input', () => {
    keyInput.dataset.userEdited = 'true';
    // Enforce uppercase
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
      submitBtn.textContent = 'Creating...';
      formError.textContent = '';

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create project
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert([
          {
            title,
            project,
            description: description || null,
            owner_user_id: user.id
          }
        ])
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

      console.log('Project created:', newProject);

      // Show success toast
      if (window.toast) window.toast.success('Project created successfully!');

      // Redirect to projects list
      if (window.appRouter) {
        window.appRouter.go('/projects');
      }

    } catch (error) {
      console.error('Error creating project:', error);
      const errorMsg = error.message || 'Failed to create project. Please try again.';
      showError(errorMsg);
      if (window.toast) window.toast.error(errorMsg);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Project';
    }
  });

  function showError(message) {
    formError.textContent = message;
    formError.style.display = 'block';
  }
}
