import './projects-id-tasks.css';
import { supabase } from '../../lib/supabaseClient.js';

export async function renderProjectTasks(params) {
  return {
    html: `
      <div class="page-container tasks-page">
        <div id="tasks-loading" class="tasks-loading">
          <p>Loading project tasks...</p>
        </div>
        
        <div id="tasks-content" class="tasks-content" style="display: none;">
          <div class="tasks-header">
            <div class="tasks-header-info">
              <h1 id="project-title">Project Tasks</h1>
              <p id="project-description" class="project-description"></p>
            </div>
            <button class="btn-secondary btn-back" data-link="/projects">
              ← Back to Projects
            </button>
          </div>

          <div class="kanban-board-container">
            <div id="kanban-board" class="kanban-board">
              <!-- Stages and tasks will be dynamically inserted here -->
            </div>
          </div>
        </div>

        <div id="tasks-error" class="tasks-error" style="display: none;">
          <div class="error-message">
            <h2>Error Loading Tasks</h2>
            <p id="error-text"></p>
            <button class="btn-secondary" data-link="/projects">
              ← Back to Projects
            </button>
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

      // Load project and tasks
      const projectId = params.id;
      await loadProjectTasks(projectId);
    }
  };
}

async function loadProjectTasks(projectId) {
  const loadingEl = document.getElementById('tasks-loading');
  const contentEl = document.getElementById('tasks-content');
  const errorEl = document.getElementById('tasks-error');
  const errorText = document.getElementById('error-text');

  try {
    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;
    if (!project) throw new Error('Project not found');

    // Fetch project stages
    const { data: stages, error: stagesError } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (stagesError) throw stagesError;

    // Fetch tasks for the project
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_position', { ascending: true });

    if (tasksError) throw tasksError;

    // Populate project info
    document.getElementById('project-title').textContent = project.title;
    const descriptionEl = document.getElementById('project-description');
    if (project.description) {
      descriptionEl.textContent = project.description;
      descriptionEl.style.display = 'block';
    } else {
      descriptionEl.style.display = 'none';
    }

    // Render kanban board
    renderKanbanBoard(stages || [], tasks || []);

    // Show content
    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

  } catch (error) {
    console.error('Error loading project tasks:', error);
    if (window.toast) {
      window.toast.error('Error loading project tasks: ' + error.message);
    }
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorText.textContent = error.message || 'Failed to load project tasks';
  }
}

function renderKanbanBoard(stages, tasks) {
  const boardEl = document.getElementById('kanban-board');
  
  if (!stages || stages.length === 0) {
    boardEl.innerHTML = `
      <div class="empty-board">
        <p>No stages found for this project</p>
      </div>
    `;
    return;
  }

  // Group tasks by stage
  const tasksByStage = {};
  stages.forEach(stage => {
    tasksByStage[stage.id] = [];
  });

  tasks.forEach(task => {
    if (tasksByStage[task.stage_id]) {
      tasksByStage[task.stage_id].push(task);
    }
  });

  // Build HTML for each stage column
  let boardHTML = '';
  
  stages.forEach(stage => {
    const stageTasks = tasksByStage[stage.id] || [];
    const taskCount = stageTasks.length;

    boardHTML += `
      <div class="kanban-column">
        <div class="kanban-column-header">
          <h3 class="stage-title">${escapeHtml(stage.title)}</h3>
          <span class="task-count">${taskCount}</span>
        </div>
        <div class="kanban-column-content">
    `;

    if (stageTasks.length === 0) {
      boardHTML += `
        <div class="empty-column">
          <p>No tasks</p>
        </div>
      `;
    } else {
      stageTasks.forEach(task => {
        const doneClass = task.done ? 'task-done' : '';
        const doneIndicator = task.done ? '<span class="done-badge">✓ Done</span>' : '';
        
        // Strip HTML tags from description for preview
        const descriptionPreview = task.description_html 
          ? stripHtml(task.description_html).substring(0, 100) 
          : '';

        boardHTML += `
          <div class="task-card ${doneClass}" data-task-id="${task.id}">
            <div class="task-card-header">
              <h4 class="task-title">${escapeHtml(task.title)}</h4>
              ${doneIndicator}
            </div>
            ${descriptionPreview ? `<p class="task-description">${escapeHtml(descriptionPreview)}${descriptionPreview.length >= 100 ? '...' : ''}</p>` : ''}
          </div>
        `;
      });
    }

    boardHTML += `
        </div>
      </div>
    `;
  });

  boardEl.innerHTML = boardHTML;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
