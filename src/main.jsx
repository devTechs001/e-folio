import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/dashboard.css'
import App from './App.jsx'
import { initializeSecurity, addWatermark } from './utils/security.js'

// Initialize security measures before app loads
initializeSecurity();
addWatermark();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
