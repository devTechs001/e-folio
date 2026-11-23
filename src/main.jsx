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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
