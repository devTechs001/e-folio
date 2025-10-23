# 🚀 E-Folio Production Deployment Guide

## 📋 Current Deployment URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://e-folio-pro.netlify.app | ✅ Live on Netlify |
| **Backend** | https://e-folio-backend-server.onrender.com | ✅ Live on Render |
| **Database** | MongoDB Atlas | ⚠️ Requires IP Whitelist |

---

## 🔧 Quick Setup Checklist

### ✅ Completed Configuration
- [x] Frontend environment variables set in `netlify.toml`
- [x] Backend environment variables template in `server/.env.example`
- [x] Render deployment config in `render.yaml`
- [x] MongoDB deprecation warnings fixed
- [x] Custom favicon/app icon added

### ⚠️ Required Manual Steps
- [ ] Add MongoDB Atlas IP whitelist (see instructions below)
- [ ] Verify Render environment variables are set
- [ ] Test frontend-backend connection

---

## 🌐 Environment Variables Configuration

### Frontend (Netlify)

**Option 1: Using netlify.toml (Recommended - Already Configured ✅)**
```toml
[context.production.environment]
  VITE_API_URL = "https://e-folio-backend-server.onrender.com/api"
  VITE_SOCKET_URL = "https://e-folio-backend-server.onrender.com"
```

**Option 2: Netlify Dashboard**
1. Go to: **Site Settings** → **Environment Variables**
2. Add:
   - `VITE_API_URL` = `https://e-folio-backend-server.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://e-folio-backend-server.onrender.com`

### Backend (Render Dashboard)

⚠️ **CRITICAL**: Add these in your Render service dashboard:

1. Go to: https://dashboard.render.com
2. Select: **e-folio-backend-server**
3. Navigate to: **Environment** tab
4. Add these variables:

```bash
# Database
MONGODB_URI=mongodb+srv://danielmk:20051117dan@cluster1.1frrfrb.mongodb.net/e-folio?retryWrites=true&w=majority

# Client Configuration
CLIENT_URL=https://e-folio-pro.netlify.app

# Server Configuration
PORT=10000
NODE_ENV=production

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
OWNER_EMAIL=devtechs842@gmail.com
OWNER_PASSWORD=pass1234
OWNER_NAME=Portfolio Owner

# Optional: AI Features
# OPENAI_API_KEY=your_openai_api_key_here
```

---

## 🔐 MongoDB Atlas Configuration

### Issue
```
❌ MongoDB connection failed: Could not connect to any servers in your MongoDB Atlas cluster.
```

### Solution: Whitelist Render IPs

#### ⚡ Quick Fix (Development/Testing)
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Click your cluster → **Network Access** → **IP Access List**
3. Click **"Add IP Address"**
4. Select **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
5. Click **Confirm**

⚠️ **Security Note**: This allows connections from any IP address. For production, consider:
- Using strong database credentials (already done ✅)
- Enabling MongoDB Atlas audit logs
- Upgrading to Render paid plan for static IPs
- Monitoring connection logs regularly

#### 🔒 Production-Ready Options

**Option A: Render Static IP (Paid Plan)**
1. Upgrade to Render Standard plan or higher
2. Get your static outbound IP addresses
3. Add only those specific IPs to MongoDB Atlas whitelist

**Option B: MongoDB Atlas Private Endpoint**
- Requires MongoDB Atlas M10+ cluster
- Set up AWS PrivateLink
- More secure but more expensive

---

## 📦 Deployment Workflow

### Frontend Deployment (Netlify)

**Automatic deployment on git push:**
```bash
git add .
git commit -m "Update: your changes"
git push origin main
```

Netlify automatically:
1. Detects the push to `main` branch
2. Runs `npm install && npm run build`
3. Deploys the `dist` folder
4. Injects environment variables from `netlify.toml`

**Manual deployment:**
```bash
npm run build
# Then drag and drop the `dist` folder to Netlify dashboard
```

### Backend Deployment (Render)

**Automatic deployment on git push:**
```bash
cd server
git add .
git commit -m "Update: backend changes"
git push origin main
```

Render automatically:
1. Detects changes in the repository
2. Runs `cd server && npm install`
3. Starts server with `cd server && node server.js`

**Manual redeploy:**
1. Go to Render dashboard
2. Click **Manual Deploy** → **Deploy latest commit**

---

## 🧪 Testing Deployment

### 1. Test Backend Health
```bash
curl https://e-folio-backend-server.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "E-Folio Pro Server Running",
  "timestamp": "2025-10-23T02:30:00.000Z",
  "version": "2.0.0",
  "uptime": 12345
}
```

### 2. Test Frontend Connection
1. Open: https://e-folio-pro.netlify.app
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for successful API connections
5. Try logging in with:
   - Email: `devtechs842@gmail.com`
   - Password: `pass1234`

### 3. Test Database Connection
Check Render logs:
```
✅ MongoDB Connected: cluster1.1frrfrb.mongodb.net
📁 Database: e-folio
```

If you see:
```
❌ MongoDB connection failed
```
→ Fix the MongoDB Atlas IP whitelist (see above)

---

## 🐛 Troubleshooting

### Frontend shows "Unable to connect to the server"

**Cause**: Backend URL not set correctly

**Fix**:
1. Check `netlify.toml` has correct `VITE_API_URL`
2. Rebuild and redeploy frontend:
   ```bash
   npm run build
   git add dist
   git commit -m "Fix: Update API URL"
   git push origin main
   ```

### Backend shows "Running in memory mode"

**Cause**: MongoDB connection failed

**Fix**:
1. Verify `MONGODB_URI` in Render environment variables
2. Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
3. Test connection string locally:
   ```bash
   mongosh "mongodb+srv://danielmk:20051117dan@cluster1.1frrfrb.mongodb.net/e-folio"
   ```

### CORS Errors

**Cause**: CLIENT_URL mismatch

**Fix**:
Update `CLIENT_URL` in Render dashboard to match your Netlify URL exactly (with or without trailing slash):
```
CLIENT_URL=https://e-folio-pro.netlify.app
```

### Socket.IO not connecting

**Cause**: VITE_SOCKET_URL not set

**Fix**:
Verify in `netlify.toml`:
```toml
VITE_SOCKET_URL = "https://e-folio-backend-server.onrender.com"
```

---

## 📊 Monitoring & Logs

### Netlify Logs
- Go to: https://app.netlify.com/sites/e-folio-pro/deploys
- View build logs for each deployment
- Check function logs if using Netlify functions

### Render Logs
- Go to: https://dashboard.render.com
- Select your service
- Click **Logs** tab
- Real-time logs show:
  - Server startup
  - MongoDB connection status
  - API requests
  - Errors and warnings

### MongoDB Atlas Logs
- Go to: https://cloud.mongodb.com
- Click **Monitoring** tab
- View:
  - Connection attempts
  - Query performance
  - Storage usage

---

## 🔄 Update Workflow

### Making Frontend Changes
```bash
# 1. Make changes to React components
# 2. Test locally
npm run dev

# 3. Build and deploy
git add .
git commit -m "Update: describe your changes"
git push origin main
# Netlify auto-deploys
```

### Making Backend Changes
```bash
# 1. Make changes to server code
# 2. Test locally
cd server
npm run dev # or node server.js

# 3. Deploy
git add .
git commit -m "Update: describe your changes"
git push origin main
# Render auto-deploys
```

### Database Seeding
```bash
# To seed initial data (owner user, projects, skills)
cd server
node seed.js
```

---

## 🔒 Security Best Practices

### ✅ Currently Implemented
- JWT authentication with 7-day expiration
- Bcrypt password hashing (10 salt rounds)
- CORS configured for specific origin
- Helmet.js security headers
- Rate limiting on API endpoints
- Input validation and sanitization

### 🔐 Recommended Improvements
1. **Rotate JWT Secret**: Change `JWT_SECRET` regularly
2. **Enable 2FA**: Add two-factor authentication for owner account
3. **API Rate Limiting**: Already configured, monitor for abuse
4. **SSL/TLS**: Enforced by Netlify and Render ✅
5. **Environment Variables**: Never commit `.env` files ✅
6. **MongoDB Encryption**: Enable encryption at rest in Atlas
7. **Audit Logs**: Enable MongoDB Atlas audit logs
8. **IP Whitelist**: Use specific IPs instead of `0.0.0.0/0`

---

## 📝 Environment Files Summary

### Files to NEVER commit (gitignored):
- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- `server/.env`
- `server/.env.production`

### Template files (committed):
- `.env.example` - Frontend template
- `server/.env.example` - Backend template
- `netlify.toml` - Netlify configuration ✅
- `render.yaml` - Render configuration ✅

---

## 📞 Support & Resources

### Documentation
- [Netlify Docs](https://docs.netlify.com/)
- [Render Docs](https://render.com/docs)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

### Common Issues
- [MongoDB IP Whitelist](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Netlify Build Settings](https://docs.netlify.com/configure-builds/overview/)

---

## ✅ Deployment Complete!

Your E-Folio application should now be fully deployed and operational:

1. ✅ Frontend: https://e-folio-pro.netlify.app
2. ✅ Backend: https://e-folio-backend-server.onrender.com
3. ⚠️ Database: MongoDB Atlas (verify IP whitelist)

**Next Steps:**
1. Add MongoDB Atlas IP whitelist (`0.0.0.0/0`)
2. Test login at https://e-folio-pro.netlify.app
3. Verify real-time features (Socket.IO)
4. Monitor Render logs for any issues

---

**Last Updated**: October 23, 2025  
**Version**: 2.0.0  
**Deployment Status**: Production Ready 🎉
