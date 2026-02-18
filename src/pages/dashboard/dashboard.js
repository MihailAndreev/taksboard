import './dashboard.css';

export async function renderDashboard() {
  return `
    <div class="page-container dashboard-page">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your task overview.</p>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-card">
          <div class="card-icon">📊</div>
          <h3>Statistics</h3>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">Total Tasks</span>
              <span class="stat-value">24</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Completed</span>
              <span class="stat-value">18</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">In Progress</span>
              <span class="stat-value">4</span>
            </div>
          </div>
        </div>

        <div class="dashboard-card">
          <div class="card-icon">📁</div>
          <h3>Projects</h3>
          <div class="project-list">
            <div class="project-item">
              <span>Web Development</span>
              <span class="badge">5 tasks</span>
            </div>
            <div class="project-item">
              <span>Mobile App</span>
              <span class="badge">3 tasks</span>
            </div>
            <div class="project-item">
              <span>Documentation</span>
              <span class="badge">2 tasks</span>
            </div>
          </div>
        </div>

        <div class="dashboard-card full-width">
          <h3>Recent Tasks</h3>
          <div class="tasks-list">
            <div class="task-item">
              <input type="checkbox" />
              <span>Setup Vite configuration</span>
              <span class="task-status pending">Pending</span>
            </div>
            <div class="task-item">
              <input type="checkbox" checked />
              <span>Create project structure</span>
              <span class="task-status completed">Completed</span>
            </div>
            <div class="task-item">
              <input type="checkbox" />
              <span>Implement routing system</span>
              <span class="task-status in-progress">In Progress</span>
            </div>
            <div class="task-item">
              <input type="checkbox" />
              <span>Build header component</span>
              <span class="task-status completed">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
