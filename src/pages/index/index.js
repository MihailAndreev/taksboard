import './index.css';

export async function renderIndex() {
  return `
    <div class="page-container index-page">
      <div class="hero-section">
        <h1>Welcome to TaskBoard</h1>
        <p>Manage your tasks and projects efficiently</p>
        <div class="cta-buttons">
          <button class="btn btn-primary" data-link="/dashboard">Go to Dashboard</button>
          <button class="btn btn-secondary" data-link="/projects">View Projects</button>
        </div>
      </div>
      
      <div class="features-section">
        <h2>Features</h2>
        <div class="features-grid">
          <div class="feature-card">
            <h3>📋 Task Management</h3>
            <p>Create, organize, and track your tasks with ease.</p>
          </div>
          <div class="feature-card">
            <h3>📁 Project Organization</h3>
            <p>Keep your projects organized with custom categories.</p>
          </div>
          <div class="feature-card">
            <h3>🎯 Progress Tracking</h3>
            <p>Monitor your progress with visual indicators.</p>
          </div>
          <div class="feature-card">
            <h3>⚙️ Customization</h3>
            <p>Customize your workspace to fit your workflow.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}
