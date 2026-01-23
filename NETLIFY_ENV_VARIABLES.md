# Netlify Environment Variables Configuration

## 🚀 How to Add Environment Variables on Netlify

1. Go to https://app.netlify.com
2. Select your **e-folio-pro** site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add the variables below

---

## ✅ REQUIRED Variables

### Backend API URLs
```
VITE_API_URL=https://e-folio-backend-server.onrender.com/api
VITE_SOCKET_URL=https://e-folio-backend-server.onrender.com
```

### Base URL (for routing)
```
VITE_BASE_URL=/
```

---

## 🔧 OPTIONAL Variables

### Google Analytics
```
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

### Sentry (Error Tracking)
```
VITE_SENTRY_DSN=your_sentry_dsn
```

### Feature Flags
```
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_COLLABORATION=true
VITE_ENABLE_ANALYTICS=true
```

### API Keys (Frontend)
```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

---

## 📝 Quick Copy-Paste Template

```bash
# REQUIRED
VITE_API_URL=https://e-folio-backend-server.onrender.com/api
VITE_SOCKET_URL=https://e-folio-backend-server.onrender.com
VITE_BASE_URL=/

# OPTIONAL
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_COLLABORATION=true
VITE_ENABLE_ANALYTICS=true
```

---

## 🔄 Alternative: Using netlify.toml

You can also add environment variables in `netlify.toml`:

```toml
[build]
  command = "npm install && npm run build"
  publish = "dist"
  
[build.environment]
  NODE_VERSION = "18"
  VITE_API_URL = "https://e-folio-backend-server.onrender.com/api"
  VITE_SOCKET_URL = "https://e-folio-backend-server.onrender.com"
  VITE_BASE_URL = "/"

[context.production.environment]
  VITE_API_URL = "https://e-folio-backend-server.onrender.com/api"
  VITE_SOCKET_URL = "https://e-folio-backend-server.onrender.com"
  
[context.deploy-preview.environment]
  VITE_API_URL = "https://e-folio-backend-server.onrender.com/api"
  VITE_SOCKET_URL = "https://e-folio-backend-server.onrender.com"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## ⚠️ Important Notes

1. **All frontend env variables MUST start with `VITE_`**
2. Variables are embedded at build time (not runtime)
3. After adding variables, trigger a new deploy
4. Never commit sensitive keys to git
5. Use different values for production vs development

---

## 🔍 How to Verify

After deployment, check browser console:
```javascript
console.log(import.meta.env.VITE_API_URL);
// Should output: https://e-folio-backend-server.onrender.com/api
```

---

## ✅ After Adding Variables

1. Click **Save**
2. Go to **Deploys** tab
3. Click **Trigger deploy** → **Clear cache and deploy site**
4. Wait 2-3 minutes
5. Test your site at https://e-folio-pro.netlify.app

