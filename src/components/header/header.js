import './header.css';

export function renderHeader() {
  const headerEl = document.getElementById('header');
  headerEl.innerHTML = `
    <div class="header-container">
      <div class="logo">
        <h1>TaskBoard</h1>
      </div>
      <nav class="navbar">
        <ul>
          <li><a href="/" data-link="/">Home</a></li>
          <li><a href="/dashboard" data-link="/dashboard">Dashboard</a></li>
          <li><a href="/projects" data-link="/projects">Projects</a></li>
          <li><a href="/login" data-link="/login">Login</a></li>
        </ul>
      </nav>
    </div>
  `;

  // Add click handlers to nav links
  headerEl.querySelectorAll('[data-link]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const path = e.target.getAttribute('data-link');
      if (window.appRouter) {
        window.appRouter.go(path);
      }
    });
  });
}
