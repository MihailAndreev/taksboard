import './footer.css';

export function renderFooter() {
  const footerEl = document.getElementById('footer');
  footerEl.innerHTML = `
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>About</h3>
          <p>TaskBoard is a multi-page application for managing tasks and projects efficiently.</p>
        </div>
        <div class="footer-section">
          <h3>Links</h3>
          <ul>
            <li><a href="/" data-link="/">Home</a></li>
            <li><a href="/projects" data-link="/projects">Projects</a></li>
            <li><a href="/dashboard" data-link="/dashboard">Dashboard</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>Contact</h3>
          <p>Email: info@taskboard.com</p>
          <p>Phone: +1 (555) 123-4567</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 TaskBoard. All rights reserved.</p>
      </div>
    </div>
  `;

  // Add click handlers to footer nav links
  footerEl.querySelectorAll('[data-link]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const path = e.target.getAttribute('data-link');
      if (window.appRouter) {
        window.appRouter.go(path);
      }
    });
  });
}
