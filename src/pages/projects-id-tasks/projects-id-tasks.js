import './projects-id-tasks.css';
import { supabase } from '../../lib/supabaseClient.js';

let currentProjectId = null;
let currentStages = [];
let currentTasks = [];
let stageTaskCounts = {};
let boardClickHandler = null;
let modalInitialized = false;
let taskModalState = {
  mode: 'add',
  taskId: null,
  stageId: null
};
let deleteTaskId = null;

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

        <!-- Task Add/Edit Modal -->
        <div id="task-modal" class="modal">
          <div class="modal-content">
            <h2 id="task-modal-title">Create Task</h2>
            <form id="task-form" class="task-form">
              <div class="form-group">
                <label for="task-title">Title *</label>
                <input type="text" id="task-title" name="title" required maxlength="100" />
              </div>
              <div class="form-group">
                <label for="task-description">Description</label>
                <textarea id="task-description" name="description" rows="4"></textarea>
              </div>
              <label class="checkbox-row">
                <input type="checkbox" id="task-done" />
                Mark as done
              </label>
            </form>
            <div class="modal-actions">
              <button id="task-cancel" class="btn-secondary" type="button">Cancel</button>
              <button id="task-save" class="btn-primary" type="button">Save</button>
            </div>
          </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div id="task-delete-modal" class="modal">
          <div class="modal-content">
            <h2>Delete Task</h2>
            <p id="task-delete-message">Are you sure you want to delete this task?</p>
            <div class="modal-actions">
              <button id="task-delete-cancel" class="btn-secondary" type="button">Cancel</button>
              <button id="task-delete-confirm" class="btn-danger" type="button">Delete</button>
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
      currentProjectId = projectId;
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

    currentStages = stages || [];
    currentTasks = tasks || [];

    // Render kanban board
    renderKanbanBoard(currentStages, currentTasks);
    setupBoardInteractions();
    ensureModalHandlers();

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

  stageTaskCounts = {};
  stages.forEach(stage => {
    stageTaskCounts[stage.id] = tasksByStage[stage.id]?.length || 0;
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
            <div class="task-card-actions">
              <button class="task-action-btn task-action-edit" data-task-id="${task.id}" title="Edit">
                ✏️
              </button>
              <button class="task-action-btn task-action-delete" data-task-id="${task.id}" title="Delete">
                🗑️
              </button>
            </div>
          </div>
        `;
      });
    }

    boardHTML += `
          <button class="create-task-btn" data-stage-id="${stage.id}">
            + Create New Task
          </button>
        </div>
      </div>
    `;
  });

  boardEl.innerHTML = boardHTML;
}

function setupBoardInteractions() {
  const boardEl = document.getElementById('kanban-board');
  if (!boardEl) return;

  if (boardClickHandler) {
    boardEl.removeEventListener('click', boardClickHandler);
  }

  boardClickHandler = (e) => {
    const createButton = e.target.closest('.create-task-btn');
    if (createButton) {
      const stageId = createButton.getAttribute('data-stage-id');
      showTaskModal({ mode: 'add', stageId });
      return;
    }

    const editButton = e.target.closest('.task-action-edit');
    if (editButton) {
      e.stopPropagation();
      const taskId = editButton.getAttribute('data-task-id');
      const task = getTaskById(taskId);
      if (task) {
        showTaskModal({ mode: 'edit', stageId: task.stage_id, task });
      }
      return;
    }

    const deleteButton = e.target.closest('.task-action-delete');
    if (deleteButton) {
      e.stopPropagation();
      const taskId = deleteButton.getAttribute('data-task-id');
      const task = getTaskById(taskId);
      if (task) {
        showDeleteModal(task);
      }
      return;
    }

    const card = e.target.closest('.task-card');
    if (card) {
      const taskId = card.getAttribute('data-task-id');
      const task = getTaskById(taskId);
      if (task) {
        showTaskModal({ mode: 'edit', stageId: task.stage_id, task });
      }
    }
  };

  boardEl.addEventListener('click', boardClickHandler);
}

function ensureModalHandlers() {
  if (modalInitialized) return;

  const taskModal = document.getElementById('task-modal');
  const taskCancel = document.getElementById('task-cancel');
  const taskSave = document.getElementById('task-save');
  const deleteModal = document.getElementById('task-delete-modal');
  const deleteCancel = document.getElementById('task-delete-cancel');
  const deleteConfirm = document.getElementById('task-delete-confirm');

  if (!taskModal || !taskCancel || !taskSave || !deleteModal || !deleteCancel || !deleteConfirm) {
    console.error('Modal elements not found in DOM');
    return;
  }

  modalInitialized = true;

  taskCancel.addEventListener('click', (e) => {
    e.preventDefault();
    hideTaskModal();
  });
  
  taskSave.addEventListener('click', (e) => {
    e.preventDefault();
    handleTaskSave();
  });

  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) hideTaskModal();
  });

  deleteCancel.addEventListener('click', (e) => {
    e.preventDefault();
    hideDeleteModal();
  });
  
  deleteConfirm.addEventListener('click', (e) => {
    e.preventDefault();
    handleTaskDelete();
  });

  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) hideDeleteModal();
  });
}

function showTaskModal({ mode, stageId, task }) {
  const modal = document.getElementById('task-modal');
  const modalTitle = document.getElementById('task-modal-title');
  const titleInput = document.getElementById('task-title');
  const descriptionInput = document.getElementById('task-description');
  const doneInput = document.getElementById('task-done');

  taskModalState = {
    mode,
    taskId: task?.id || null,
    stageId: stageId || task?.stage_id || null
  };

  modalTitle.textContent = mode === 'edit' ? 'Edit Task' : 'Create Task';
  titleInput.value = task?.title || '';
  descriptionInput.value = task?.description_html ? stripHtml(task.description_html) : '';
  doneInput.checked = task?.done || false;

  modal.classList.add('show');
  titleInput.focus();
}

function hideTaskModal() {
  const modal = document.getElementById('task-modal');
  modal.classList.remove('show');
}

function showDeleteModal(task) {
  const modal = document.getElementById('task-delete-modal');
  const message = document.getElementById('task-delete-message');
  deleteTaskId = task.id;
  message.textContent = `Are you sure you want to delete "${task.title}"? This action cannot be undone.`;
  modal.classList.add('show');
}

function hideDeleteModal() {
  const modal = document.getElementById('task-delete-modal');
  modal.classList.remove('show');
  deleteTaskId = null;
}

async function handleTaskSave() {
  const titleInput = document.getElementById('task-title');
  const descriptionInput = document.getElementById('task-description');
  const doneInput = document.getElementById('task-done');
  const saveButton = document.getElementById('task-save');

  const title = titleInput.value.trim();
  const descriptionText = descriptionInput.value.trim();
  const done = doneInput.checked;

  if (!title) {
    if (window.toast) window.toast.error('Title is required');
    titleInput.focus();
    return;
  }

  try {
    saveButton.disabled = true;
    saveButton.textContent = taskModalState.mode === 'edit' ? 'Saving...' : 'Creating...';

    const descriptionHtml = descriptionText ? buildDescriptionHtml(descriptionText) : null;

    if (taskModalState.mode === 'edit' && taskModalState.taskId) {
      const { error } = await supabase
        .from('tasks')
        .update({
          title,
          description_html: descriptionHtml,
          done
        })
        .eq('id', taskModalState.taskId);

      if (error) throw error;
    } else {
      const orderPosition = stageTaskCounts[taskModalState.stageId] || 0;
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: currentProjectId,
          stage_id: taskModalState.stageId,
          title,
          description_html: descriptionHtml,
          order_position: orderPosition,
          done
        });

      if (error) throw error;
    }

    hideTaskModal();
    await loadProjectTasks(currentProjectId);

  } catch (error) {
    console.error('Error saving task:', error);
    if (window.toast) window.toast.error('Failed to save task: ' + error.message);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Save';
  }
}

async function handleTaskDelete() {
  if (!deleteTaskId) return;
  const deleteButton = document.getElementById('task-delete-confirm');

  try {
    deleteButton.disabled = true;
    deleteButton.textContent = 'Deleting...';

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', deleteTaskId);

    if (error) throw error;

    hideDeleteModal();
    await loadProjectTasks(currentProjectId);

  } catch (error) {
    console.error('Error deleting task:', error);
    if (window.toast) window.toast.error('Failed to delete task: ' + error.message);
  } finally {
    deleteButton.disabled = false;
    deleteButton.textContent = 'Delete';
  }
}

function buildDescriptionHtml(text) {
  const escaped = escapeHtml(text);
  const withBreaks = escaped.replace(/\n/g, '<br>');
  return `<p>${withBreaks}</p>`;
}

function getTaskById(taskId) {
  return currentTasks.find(task => task.id === taskId);
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
