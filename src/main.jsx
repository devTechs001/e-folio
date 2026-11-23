import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/dashboard.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import App from './App.jsx'
import { setupSecurity, stripDevParams } from './utils/security.js'

// Initialize security measures before app loads
setupSecurity();

// Phase 39: production builds drop developer query flags (?debug, ?dev,
// ?internal, ?test, ?trace) before any route or API call can read them.
stripDevParams();

/**
 * Phase 40 — retire the static boot splash once React has actually painted.
 *
 * The element lives in index.html so the very first frame is branded. It is
 * faded out and then removed, so it can never trap focus or block a click. If
 * the element is absent (tests, other entry points) this is a no-op.
 */
function dismissBootSplash() {
  const boot = document.getElementById('efolio-boot')
  if (!boot) return
  boot.classList.add('is-hidden')
  window.setTimeout(() => boot.remove(), 260)
}

const rootElement = document.getElementById('root')
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Two frames: one for React's commit, one so the paint lands before we fade out.
requestAnimationFrame(() => requestAnimationFrame(dismissBootSplash))
