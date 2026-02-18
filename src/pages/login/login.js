import './login.css';
import { supabase } from '../../lib/supabaseClient.js';

export async function renderLogin() {
  return {
    html: `
      <div class="page-container auth-page">
        <div class="auth-card">
          <h1>Welcome back</h1>
          <p class="auth-subtitle">Login to continue to your TaskBoard workspace.</p>
          <form id="login-form" class="auth-form">
            <label class="field">
              <span>Email</span>
              <input id="login-email" type="email" name="email" placeholder="you@example.com" required />
            </label>
            <label class="field">
              <span>Password</span>
              <input id="login-password" type="password" name="password" placeholder="Your password" minlength="6" required />
            </label>
            <button id="login-submit" class="auth-button" type="submit">Login</button>
          </form>
          <p id="login-status" class="auth-status" role="status"></p>
          <p class="auth-switch">New here? <a href="/register" data-link="/register">Create an account</a></p>
        </div>
      </div>
    `,
    onMount: () => {
      const form = document.getElementById('login-form');
      const status = document.getElementById('login-status');
      const submitButton = document.getElementById('login-submit');

      if (!form || !status || !submitButton) {
        return;
      }

      const setStatus = (message, type = '') => {
        status.textContent = message;
        status.className = `auth-status ${type}`.trim();
      };

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setStatus('');

        const email = document.getElementById('login-email')?.value?.trim();
        const password = document.getElementById('login-password')?.value;

        if (!email || !password) {
          setStatus('Please enter your email and password.', 'error');
          return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Signing in...';

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          setStatus(error.message, 'error');
          submitButton.disabled = false;
          submitButton.textContent = 'Login';
          return;
        }

        if (data?.session) {
          setStatus('Login successful. Redirecting...', 'success');
          if (window.appRouter) {
            window.appRouter.go('/dashboard');
          }
          return;
        }

        setStatus('Login successful. Redirecting...', 'success');
        if (window.appRouter) {
          window.appRouter.go('/dashboard');
        }
      });
    }
  };
}
