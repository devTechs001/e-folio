import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/dashboard.css'
import App from './App.jsx'
import { setupSecurity } from './utils/security.js'

// Initialize security measures before app loads
setupSecurity();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
