import './register.css';
import { supabase } from '../../lib/supabaseClient.js';

export async function renderRegister() {
  return {
    html: `
      <div class="page-container auth-page">
        <div class="auth-card">
          <h1>Create your account</h1>
          <p class="auth-subtitle">Join TaskBoard and start organizing your work.</p>
          <form id="register-form" class="auth-form">
            <label class="field">
              <span>Full name</span>
              <input id="register-name" type="text" name="full_name" placeholder="Jane Doe" required />
            </label>
            <label class="field">
              <span>Email</span>
              <input id="register-email" type="email" name="email" placeholder="you@example.com" required />
            </label>
            <label class="field">
              <span>Password</span>
              <input id="register-password" type="password" name="password" placeholder="Create a password" minlength="6" required />
            </label>
            <button id="register-submit" class="auth-button" type="submit">Register</button>
          </form>
          <p id="register-status" class="auth-status" role="status"></p>
          <p class="auth-switch">Already have an account? <a href="/login" data-link="/login">Login</a></p>
        </div>
      </div>
    `,
    onMount: () => {
      const form = document.getElementById('register-form');
      const status = document.getElementById('register-status');
      const submitButton = document.getElementById('register-submit');

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

        const fullName = document.getElementById('register-name')?.value?.trim();
        const email = document.getElementById('register-email')?.value?.trim();
        const password = document.getElementById('register-password')?.value;

        if (!fullName || !email || !password) {
          setStatus('Please complete all fields to register.', 'error');
          if (window.toast) window.toast.error('Please complete all fields to register.');
          return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Creating account...';

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (error) {
          setStatus(error.message, 'error');
          if (window.toast) window.toast.error(error.message);
          submitButton.disabled = false;
          submitButton.textContent = 'Register';
          return;
        }

        if (data?.session) {
          setStatus('Account created. Redirecting to your dashboard...', 'success');
          if (window.toast) window.toast.success('Account created successfully!');
          if (window.appRouter) {
            window.appRouter.go('/dashboard');
          }
          return;
        }

        setStatus('Account created. Please check your email to confirm your account.', 'success');
        if (window.toast) window.toast.success('Account created! Please check your email to confirm.');
        submitButton.disabled = false;
        submitButton.textContent = 'Register';
      });
    }
  };
}
