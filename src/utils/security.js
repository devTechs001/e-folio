// Security utilities for E-Folio Pro
// Implements various protection measures against source code access and debugging

// Anti-debugging measures
export function setupAntiDebug() {
  if (process.env.NODE_ENV === 'production') {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    });

    // Disable right-click
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // Clear console periodically
    setInterval(() => {
      console.clear();
    }, 1000);

    // Detect developer tools (heuristic approach)
    let devtools = {
      open: false,
      orientation: null
    };

    const threshold = 160;

    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          // Optionally redirect or show warning
          // window.location.href = 'https://yourdomain.com/invalid';
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Override console methods to prevent debugging
    if (window.console) {
      console.log = () => {};
      console.info = () => {};
      console.warn = () => {};
      console.error = () => {};
      console.debug = () => {};
    }
  }
}

// Domain locking
export function checkDomainAccess() {
  const allowedDomains = [
    'localhost',
    '127.0.0.1',
    'devtechs001.github.io',
    'e-folio.netlify.app',  // If deployed to Netlify
    // Add your production domains here
  ];

  const currentDomain = window.location.hostname;

  if (!allowedDomains.includes(currentDomain)) {
    // Redirect to a safe page or show error
    console.warn('Access from unauthorized domain');
    // In production, uncomment the next line:
    // window.location.href = 'https://devtechs001.github.io/e-folio/';
  }
}

// Code integrity check
export function setupCodeIntegrityCheck() {
  // Create a checksum of critical functions
  const criticalFunctions = {
    // Add checksums for critical functions here
    checkDomainAccess: 'function_exists',
    setupAntiDebug: 'function_exists'
  };

  // Verify integrity periodically
  setInterval(() => {
    if (!criticalFunctions.checkDomainAccess) {
      console.error('Code integrity violation detected');
      // Handle integrity violation
    }
  }, 30000); // Check every 30 seconds
}

// Track access patterns
export function logAccess() {
  if (process.env.NODE_ENV === 'production') {
    // Send access logs to backend (if available)
    // This is just a placeholder function
    fetch('/api/log-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        referer: document.referrer
      })
    }).catch(err => {
      // Ignore errors to prevent detection
    });
  }
}

// Initialize security measures
export function initializeSecurity() {
  setupAntiDebug();
  checkDomainAccess();
  setupCodeIntegrityCheck();
  logAccess();
}

// Watermarking function (adds invisible watermark to UI)
export function addWatermark() {
  if (process.env.NODE_ENV === 'production') {
    // Create an invisible watermark element
    const watermark = document.createElement('div');
    watermark.id = 'efolio-watermark';
    watermark.style.position = 'fixed';
    watermark.style.top = '0';
    watermark.style.left = '0';
    watermark.style.width = '100%';
    watermark.style.height = '100%';
    watermark.style.pointerEvents = 'none';
    watermark.style.zIndex = '9999';
    watermark.style.backgroundImage = 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,.05) 50px, rgba(255,255,255,.05) 52px)';
    watermark.style.opacity = '0.05';
    watermark.innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:50px;opacity:0.05;pointer-events:none;">E-Folio Pro</div>';
    
    // Add to body but make it invisible
    document.body.appendChild(watermark);
  }
}