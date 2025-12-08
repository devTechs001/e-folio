// Anti-debugging and security measures
export function setupSecurity() {
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
      if (window.console && window.console.clear) {
        console.clear();
      }
    }, 1000);
    
    // Detect devtools
    let devtools = { open: false };
    const threshold = 160;

    const checkDevTools = () => {
      if (devtools.open) {
        // DevTools were open, redirect or take action
        // For now we'll just log, but in production you might want to take stronger action
        console.log('DevTools detected');
        devtools.open = false;
      }
    };

    Object.defineProperty(devtools, 'open', {
      set: (value) => {
        devtools._open = value;
        if (value && window.location.hostname !== 'localhost') {
          // DevTools detected in production
          console.log('Development tools detected in production');
        }
      },
      get: () => {
        return devtools._open;
      },
    });

    setInterval(() => {
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      if (heightThreshold || widthThreshold) {
        devtools.open = true;
      } else {
        devtools.open = false;
      }
      checkDevTools();
    }, 500);
    
    // Domain locking
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      'devtechs001.github.io',
      'e-folio-pro.netlify.app',
      'e-folio-pro.vercel.app',
      process.env.VITE_ALLOWED_DOMAIN
    ].filter(Boolean);
    
    const currentDomain = window.location.hostname;
    if (!allowedDomains.includes(currentDomain) && !currentDomain.endsWith('.onrender.com')) {
      // Redirect to a warning page or show an error
      console.log('Unauthorized domain access attempt');
    }
  }
}

// Function to validate license key (example)
export async function validateLicense(key) {
  try {
    const response = await fetch('/api/validate-license', {
      method: 'POST',
      body: JSON.stringify({ key }),
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error('License validation error:', error);
    return false;
  }
}

// Add watermark to the page content
export function addWatermark() {
  if (process.env.NODE_ENV === 'production') {
    // Create a subtle watermark
    const watermark = document.createElement('div');
    watermark.innerHTML = 'E-Folio Pro ⓒ';
    watermark.style.position = 'fixed';
    watermark.style.bottom = '10px';
    watermark.style.right = '10px';
    watermark.style.opacity = '0.3';
    watermark.style.fontSize = '12px';
    watermark.style.zIndex = '9999';
    watermark.style.pointerEvents = 'none';
    watermark.style.color = '#666';
    
    document.body.appendChild(watermark);
  }
}