import './index.css';

export async function renderIndex() {
  return `
    <div class="page-container index-page">
      <div class="hero-section">
        <p class="eyebrow">Plan. Track. Deliver.</p>
        <h1>TaskBoard keeps teams focused and projects moving.</h1>
        <p class="hero-subtitle">A lightweight workspace for tasks, stages, and project members that stays simple and fast.</p>
        <p class="hero-note">please  register / login</p>
        <div class="cta-buttons">
          <button class="btn btn-primary" data-link="/register">Register</button>
          <button class="btn btn-secondary" data-link="/login">Login</button>
        </div>
      </div>
      
      <div class="features-section">
        <h2>Built for real work</h2>
        <div class="features-grid">
          <div class="feature-card">
            <h3>Task flows</h3>
            <p>Create tasks, move them through stages, and keep priorities visible.</p>
          </div>
          <div class="feature-card">
            <h3>Project clarity</h3>
            <p>Organize work by project so every task has a clear home.</p>
          </div>
          <div class="feature-card">
            <h3>Progress at a glance</h3>
            <p>Track what is in progress, blocked, or done without digging.</p>
          </div>
          <div class="feature-card">
            <h3>Team ready</h3>
            <p>Add members to projects and keep collaboration tidy.</p>
          </div>
        </div>
      </div>

      <div class="steps-section">
        <div class="steps-card">
          <h2>Start in minutes</h2>
          <ol>
            <li>Create an account and sign in.</li>
            <li>Set up a project and invite teammates.</li>
            <li>Add tasks and move them through stages.</li>
          </ol>
        </div>
        <div class="steps-card highlight">
          <h2>Ready to try it?</h2>
          <p>Register now or login to continue where you left off.</p>
          <div class="cta-buttons">
            <button class="btn btn-primary" data-link="/register">Get Started</button>
            <button class="btn btn-secondary" data-link="/login">I have an account</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
