import './header.css';
import { supabase } from '../../lib/supabaseClient.js';

function getUserLabel(user) {
  if (!user) {
    return '';
  }

  return user.user_metadata?.full_name || user.email || 'User';
}

export function renderHeader(user = null) {
  const headerEl = document.getElementById('header');
  const userLabel = getUserLabel(user);
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
          ${user
            ? `
              <li class="nav-user">
                <span class="user-label">Signed in as</span>
                <span class="user-pill">${userLabel}</span>
              </li>
              <li><button class="logout-button" id="logout-button" type="button">Logout</button></li>
            `
            : `
              <li><a href="/login" data-link="/login">Login</a></li>
              <li><a href="/register" data-link="/register">Register</a></li>
            `
          }
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

  const logoutButton = headerEl.querySelector('#logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      await supabase.auth.signOut();
      if (window.appRouter) {
        window.appRouter.go('/login');
      }
    });
  }
}
