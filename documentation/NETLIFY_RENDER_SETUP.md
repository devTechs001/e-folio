# 🚀 E-Folio Deployment: Netlify + Render

Your setup:
- **Frontend**: Netlify ✅ (already deployed)
- **Backend**: Render (needs fixing)

---

## 🎯 Quick Fix (3 Steps)

### Step 1: Push Updated Config

```bash
git add render.yaml
git commit -m "Update Render config for backend only"
git push origin main
```

### Step 2: Deploy Backend to Render

**Option A: Delete & Recreate (Recommended)**

1. Go to https://dashboard.render.com
2. Delete your current failing service
3. Click **"New +"** → **"Blueprint"**
4. Connect to GitHub: `devTechs001/e-folio`
5. Branch: `main`
6. Render detects `render.yaml` ✅
7. Shows **ONE service**: `e-folio-backend`
8. Click **"Apply"**

**Option B: Update Existing Service**

1. Render Dashboard → Select your service
2. **Settings** → **Build & Deploy**
3. Update **Build Command**: `cd server && npm install`
4. Update **Start Command**: `cd server && node server.js`
5. Click **"Save Changes"**
6. **Manual Deploy** → **"Deploy latest commit"**

### Step 3: Configure Environment Variables

**A. MongoDB Setup (5 min)**

1. Go to https://cloud.mongodb.com
2. Create free cluster (M0)
3. Create database user + password
4. Network Access → Add `0.0.0.0/0`
5. Get connection string:
   ```
   mongodb+srv://username:PASSWORD@cluster.mongodb.net/e-folio?retryWrites=true&w=majority
   ```

**B. Add to Render**

1. Render Dashboard → `e-folio-backend`
2. **Environment** tab
3. Add these variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB connection string |
| `CLIENT_URL` | Your Netlify URL (e.g., `https://e-folio-pro.netlify.app`) |

4. Click **"Save Changes"**

**C. Update Netlify**

1. Netlify Dashboard → Your site
2. **Site settings** → **Environment variables**
3. Update these:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your Render URL (e.g., `https://e-folio-backend.onrender.com`) |
| `VITE_SOCKET_URL` | Your Render URL (e.g., `https://e-folio-backend.onrender.com`) |

4. **Trigger deploy** (to rebuild with new env vars)

---

## ✅ Verification

### Backend Health Check

Visit: `https://e-folio-backend.onrender.com/api/health`

**Expected Response:**
```json
{
  "status": "ok",
  "message": "E-Folio Pro Server Running",
  "version": "2.0.0",
  "database": "connected"
}
```

### Frontend Check

1. Visit your Netlify URL
2. Open browser console (F12)
3. Look for successful API calls
4. No CORS errors ✅

---

## 🔍 Troubleshooting

### Error: Cannot find module 'express'

**Cause**: Build command not installing server dependencies  
**Fix**: Make sure build command is `cd server && npm install`

### Error: Cannot connect to database

**Cause**: Missing or wrong MONGODB_URI  
**Fix**: 
- Check environment variable is set in Render
- Verify password has no `<>` brackets
- Confirm IP whitelist includes `0.0.0.0/0`

### CORS errors in frontend

**Cause**: CLIENT_URL not set or wrong  
**Fix**: Add your Netlify URL to backend's CLIENT_URL env var

### Backend deploys but frontend can't connect

**Cause**: Frontend has wrong API URL  
**Fix**: Update VITE_API_URL in Netlify to your Render backend URL

---

## 📋 Environment Variables Summary

### Render (Backend)
```env
NODE_ENV=production          # Auto-set
PORT=10000                   # Auto-set
MONGODB_URI=mongodb+srv://...  # ADD MANUALLY
JWT_SECRET=...               # Auto-generated
CLIENT_URL=https://your-app.netlify.app  # ADD MANUALLY
```

### Netlify (Frontend)
```env
VITE_API_URL=https://e-folio-backend.onrender.com  # UPDATE MANUALLY
VITE_SOCKET_URL=https://e-folio-backend.onrender.com  # UPDATE MANUALLY
```

---

## 🎉 Expected Deployment Logs

**Render Build:**
```
==> Running build command 'cd server && npm install'
added 27 packages, and audited 28 packages in 2s
✓ Build successful
```

**Render Start:**
```
==> Running 'cd server && node server.js'
✅ E-Folio Server Running
📡 Port: 10000
💾 Database: Connected
🔌 Socket.io: Ready
```

---

## 🚀 Deploy Commands Reference

### Push to Render
```bash
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys
```

### Redeploy Netlify
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Netlify auto-deploys
```

### Manual Deploy
- **Render**: Dashboard → Manual Deploy → Deploy latest commit
- **Netlify**: Dashboard → Deploys → Trigger deploy

---

## 💡 Tips

### Free Tier Cold Starts
- Render free tier spins down after 15 min inactivity
- First request takes 30-60 seconds
- Upgrade to $7/month for always-on

### Check Backend Status
Bookmark: `https://e-folio-backend.onrender.com/api/health`

### View Logs
- **Render**: Dashboard → Logs tab (real-time)
- **Netlify**: Dashboard → Deploys → View build logs

---

## 🆘 Still Having Issues?

1. **Check Render build logs** for errors
2. **Verify all environment variables** are set
3. **Test health endpoint** separately
4. **Check Netlify console** for API errors
5. **Verify MongoDB** connection string

---

**Your setup is clean and simple:**
- ✅ Static frontend on Netlify (fast, reliable)
- ✅ API backend on Render (proper server environment)
- ✅ Database on MongoDB Atlas (free, managed)

Perfect for a portfolio site! 🎉
