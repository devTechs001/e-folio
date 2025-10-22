# 🚀 E-Folio Deployment Guide

Complete guide for deploying your E-Folio to GitHub Pages, Netlify, and Render.

---

## ✅ What's Been Configured

### Landing Page Theme Manager
- ✅ LandingPageThemeProvider added to App.jsx
- ✅ ThemeSwitcher component added to LandingPage
- ✅ 6 themes available with auto-change mode
- ✅ Floating palette button on landing page

### About Section Enhancements
- ✅ Enhanced gradient effects on profile image
- ✅ Triple-color gradient glow (cyan → purple → blue)
- ✅ Rotating conic gradient halo
- ✅ Professional social media icons (5.5rem rounded squares)
- ✅ Backdrop blur and 3D effects
- ✅ Staggered pulse animations

### Deployment Configs Created
- ✅ `netlify.toml` - Netlify configuration
- ✅ `render.yaml` - Render configuration
- ✅ `.github/workflows/deploy-gh-pages.yml` - GitHub Pages workflow

---

## 🎨 Access Landing Page Theme Manager

### How to Use
1. Visit your landing page: `http://localhost:5174`
2. Look for **floating palette icon** (top right, below header)
3. Click to open theme panel
4. Select from 6 themes or enable auto-change

### Available Themes
1. **Cyber Neon** - Blue/Cyan tech theme (default)
2. **Sunset Vibes** - Red/Pink warm theme
3. **Forest Green** - Green nature theme
4. **Purple Dream** - Purple/Violet theme
5. **Ocean Blue** - Deep blue theme
6. **Sunset Orange** - Orange/Yellow theme

### Auto-Change Mode
- Toggle the "Auto-Change (30s)" button
- Themes cycle automatically every 30 seconds
- Preference saved in localStorage

---

## 📦 Deployment Options

### Option 1: GitHub Pages (Free)

#### Prerequisites
- GitHub account
- Repository pushed to GitHub

#### Setup Steps

**1. Update package.json**
```json
{
  "homepage": "https://yourusername.github.io/e-folio"
}
```

**2. Install gh-pages**
```bash
npm install --save-dev gh-pages
```

**3. Add deploy scripts to package.json**
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

**4. Deploy**
```bash
npm run deploy
```

#### GitHub Actions (Automatic)
The workflow file `.github/workflows/deploy-gh-pages.yml` is already created!

**Enable GitHub Pages:**
1. Go to repository → Settings → Pages
2. Source: GitHub Actions
3. Push to main branch → Auto deploys!

#### Configure Secrets
In GitHub repository settings → Secrets → Actions:
```
VITE_API_URL = https://your-backend.render.com
VITE_SOCKET_URL = https://your-backend.render.com
```

---

### Option 2: Netlify (Easiest)

#### Method A: Netlify CLI

**1. Install Netlify CLI**
```bash
npm install -g netlify-cli
```

**2. Login**
```bash
netlify login
```

**3. Initialize**
```bash
netlify init
```

**4. Deploy**
```bash
netlify deploy --prod
```

#### Method B: Git Integration (Recommended)

**1. Push to GitHub**
```bash
git push origin main
```

**2. Connect to Netlify**
- Go to https://app.netlify.com
- Click "Add new site" → "Import an existing project"
- Choose GitHub → Select your repository
- Build settings auto-detected from `netlify.toml`!

**3. Configure Environment Variables**
In Netlify dashboard → Site settings → Environment variables:
```
VITE_API_URL = https://your-backend.render.com
VITE_SOCKET_URL = https://your-backend.render.com
```

**4. Deploy**
- Netlify auto-deploys on every push to main!

#### Custom Domain
- Netlify dashboard → Domain settings → Add custom domain
- Follow DNS configuration instructions

---

### Option 3: Render (Frontend + Backend)

#### Prerequisites
- Render account
- GitHub repository

#### Deploy Backend First

**1. Update render.yaml**
The file is ready! Just update MongoDB URI.

**2. Connect to Render**
- Go to https://dashboard.render.com
- Click "New +" → "Blueprint"
- Connect GitHub repository
- Select `render.yaml`

**3. Configure Environment Variables**
In Render dashboard for backend service:
```
MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/e-folio
JWT_SECRET = your-secret-key-here
CLIENT_URL = https://your-frontend.onrender.com
EMAIL_USER = your-email@gmail.com  (optional)
EMAIL_PASS = your-app-password  (optional)
```

**4. Deploy**
- Render auto-deploys from render.yaml!
- Backend URL: `https://e-folio-backend.onrender.com`

#### Deploy Frontend

Frontend is configured in `render.yaml` to deploy automatically with backend!

**Verify:**
- Frontend URL: `https://e-folio-frontend.onrender.com`
- Check it connects to backend

---

## 🗄️ Database Setup

### MongoDB Atlas (Recommended for Production)

**1. Create Cluster**
- Go to https://cloud.mongodb.com
- Create free cluster (M0)
- Choose region closest to your backend

**2. Create Database User**
- Database Access → Add New User
- Username & password
- Built-in role: Read and write to any database

**3. Whitelist IP**
- Network Access → Add IP Address
- Allow access from anywhere: `0.0.0.0/0` (for Render/Netlify)

**4. Get Connection String**
```
mongodb+srv://username:password@cluster.mongodb.net/e-folio?retryWrites=true&w=majority
```

**5. Add to Environment Variables**
- Render: Backend service → Environment
- Local: `.env` file in server folder

---

## 🔐 Environment Variables

### Frontend (.env in root)
```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

### Backend (server/.env)
```env
# Required
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key-min-32-chars
CLIENT_URL=https://your-frontend-url.com

# Optional (Email system)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
```

---

## ✅ Pre-Deployment Checklist

### Code
- [ ] All console.logs removed or minimized
- [ ] Error handling in place
- [ ] Loading states implemented
- [ ] Fallback data for API failures

### Configuration
- [ ] `netlify.toml` configured
- [ ] `render.yaml` configured
- [ ] GitHub Actions workflow ready
- [ ] Environment variables prepared

### Database
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelist configured
- [ ] Connection string obtained

### Testing
- [ ] Build works locally: `npm run build`
- [ ] Preview build: `npm run preview`
- [ ] All routes accessible
- [ ] API connections work
- [ ] Socket.IO connects

---

## 🚀 Deployment Commands

### GitHub Pages
```bash
# One-time deploy
npm run deploy

# Or push to main (with GitHub Actions)
git push origin main
```

### Netlify
```bash
# CLI deploy
netlify deploy --prod

# Or just push to Git
git push origin main
```

### Render
```bash
# Just push to Git
git push origin main
# Render auto-deploys from render.yaml
```

---

## 🔧 Post-Deployment

### 1. Seed Database
```bash
# Connect to your deployed backend
# Run seed scripts via Render shell or manually insert data
```

### 2. Test Features
- [ ] Landing page loads
- [ ] Theme switcher works
- [ ] Skills load from database
- [ ] Projects load from database
- [ ] Login works
- [ ] Dashboard accessible
- [ ] Collaboration form works
- [ ] Reviews can be submitted

### 3. Configure Custom Domain (Optional)

#### Netlify
- Dashboard → Domain settings → Add custom domain
- Update DNS records as instructed

#### Render
- Service → Settings → Custom Domain
- Add CNAME record pointing to Render

#### GitHub Pages
- Repository Settings → Pages → Custom domain
- Add CNAME file to repository

---

## 🐛 Troubleshooting

### Build Fails
**Error:** `Module not found`
**Fix:** 
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Not Connecting
**Error:** `Failed to fetch`
**Fix:**
1. Check environment variables
2. Verify backend URL is correct
3. Check CORS settings in backend
4. Ensure backend is deployed and running

### Theme Manager Not Showing
**Fix:**
1. Hard refresh: `Ctrl+Shift+R`
2. Check if LandingPageThemeProvider is wrapping routes
3. Check if ThemeSwitcher is imported in LandingPage.jsx

### MongoDB Connection Fails
**Fix:**
1. Check connection string format
2. Verify database user credentials
3. Check IP whitelist (should include 0.0.0.0/0)
4. Ensure network access is configured

---

## 📊 Deployment Comparison

| Feature | GitHub Pages | Netlify | Render |
|---------|--------------|---------|--------|
| **Cost** | Free | Free tier | Free tier |
| **Build time** | ~2-3 min | ~1-2 min | ~3-5 min |
| **SSL** | ✅ Auto | ✅ Auto | ✅ Auto |
| **Custom domain** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Backend support** | ❌ No | ❌ No | ✅ Yes |
| **Auto deploy** | ✅ GitHub Actions | ✅ Git push | ✅ Git push |
| **Rollbacks** | Manual | ✅ One-click | ✅ One-click |
| **Preview URLs** | ❌ No | ✅ Yes | ✅ Yes |

### Recommendation
- **Frontend only:** Netlify (easiest + fastest)
- **Full-stack:** Render (frontend + backend together)
- **Free static:** GitHub Pages (simple, reliable)

---

## ✨ What's New

### Landing Page Theme Manager
- Floating palette button added
- 6 professional themes
- Auto-change mode (30s intervals)
- Smooth transitions
- localStorage persistence

### About Section
- Triple-gradient image glow
- Rotating conic halo effect
- Professional 5.5rem social icons
- Rounded square design
- Backdrop blur effects
- Staggered animations

### Deployment Ready
- Netlify configuration complete
- Render blueprint ready
- GitHub Actions workflow created
- Environment variable guides
- Full deployment documentation

---

## 🎯 Quick Deploy

**Fastest path to production:**

```bash
# 1. Build locally to test
npm run build
npm run preview

# 2. Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 3. Choose platform:

# Option A: Netlify (Recommended for frontend)
netlify init
netlify deploy --prod

# Option B: GitHub Pages
npm run deploy

# Option C: Render (Full-stack)
# Just connect repo at dashboard.render.com
# It auto-deploys from render.yaml!
```

---

**Your E-Folio is now production-ready with theme manager and deployment configs!** 🚀

For questions or issues, check the troubleshooting section above.
