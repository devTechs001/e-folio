# 🚀 Render Deployment Guide - E-Folio Pro

Complete step-by-step guide to deploy your E-Folio application to Render.

---

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ GitHub repository: `devTechs001/e-folio`
- ✅ MongoDB Atlas account (free tier)
- ✅ Render account (free tier)

---

## 🗑️ Step 1: Clean Up Existing Deployment (If Any)

If you already have a Render service that's failing:

1. Go to **Render Dashboard**: https://dashboard.render.com
2. Find your existing service(s)
3. Click on each service → **Settings** → Scroll down → **Delete Service**
4. Confirm deletion

**Why?** Your current deployment is a single service. E-Folio needs TWO services (frontend + backend).

---

## 🍃 Step 2: Set Up MongoDB Atlas

Your backend needs a database. Here's how to set it up (takes 5 minutes):

### Create Free Cluster

1. **Go to**: https://cloud.mongodb.com
2. **Sign Up/Login** (use Google/GitHub for faster signup)
3. Click **"Build a Database"**
4. Select **M0 FREE** tier
5. Choose cloud provider: **AWS**
6. Region: **US East (N. Virginia)** or closest to you
7. Cluster Name: `e-folio-cluster`
8. Click **"Create Cluster"** (takes 1-3 minutes)

### Create Database User

1. **Security** → **Database Access**
2. Click **"Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: `efolio_admin`
5. **Password**: Click **"Autogenerate Secure Password"**
6. **IMPORTANT**: Copy and save this password! You'll need it.
7. **Database User Privileges**: Read and write to any database
8. Click **"Add User"**

### Whitelist Render IP Addresses

1. **Security** → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"**
4. Confirm IP: `0.0.0.0/0` (required for Render)
5. Click **"Confirm"**

### Get Connection String

1. **Deployment** → **Clusters** → Click **"Connect"**
2. Select **"Connect your application"**
3. Driver: **Node.js**
4. Version: **4.1 or later**
5. Copy the connection string:
   ```
   mongodb+srv://efolio_admin:<password>@e-folio-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace** `<password>` with the password you saved earlier
7. **Add database name**: Change to `mongodb+srv://efolio_admin:YOUR_PASSWORD@e-folio-cluster.xxxxx.mongodb.net/e-folio?retryWrites=true&w=majority`

**Save this connection string!** You'll add it to Render in Step 4.

---

## 🎯 Step 3: Deploy via Blueprint

This creates BOTH services automatically with correct configuration.

### Push Latest Code to GitHub

```bash
# Make sure render.yaml is updated
git add .
git commit -m "Update Render configuration for deployment"
git push origin main
```

### Deploy on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. Click **"New +"** (top right)
3. Select **"Blueprint"**

### Connect Repository

4. Click **"Connect GitHub"** (if not already connected)
5. Authorize Render to access your repositories
6. Find and select: **`devTechs001/e-folio`**
7. Branch: **`main`**

### Confirm Blueprint

8. Render will detect `render.yaml` ✅
9. You'll see:
   - **e-folio-backend** (Web Service)
   - **e-folio-frontend** (Static Site)
10. Click **"Apply"**

### Wait for Services to Create

Render will:
- Create both services
- Start building backend
- Start building frontend

**This takes 3-5 minutes**

---

## 🔐 Step 4: Add Environment Variables

The backend needs MongoDB connection string.

### Configure Backend Service

1. In Render Dashboard, click **"e-folio-backend"**
2. Go to **"Environment"** tab (left sidebar)
3. You'll see existing variables. Add this one:

**Click "Add Environment Variable":**

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Paste your MongoDB connection string from Step 2 |

Example:
```
mongodb+srv://efolio_admin:YourPassword123@e-folio-cluster.abc123.mongodb.net/e-folio?retryWrites=true&w=majority
```

4. Click **"Save Changes"**
5. Service will automatically redeploy

---

## 🔄 Step 5: Update Cross-Service URLs

After both services deploy, you need to update URLs so they can communicate.

### Get Your Service URLs

Both services will have URLs like:
- **Backend**: `https://e-folio-backend.onrender.com`
- **Frontend**: `https://e-folio-frontend.onrender.com`

### Update Backend Environment Variables

1. Click **"e-folio-backend"** service
2. **Environment** tab
3. Find `CLIENT_URL` and update it:
   ```
   CLIENT_URL=https://e-folio-frontend.onrender.com
   ```
4. Click **"Save Changes"**

### Update Frontend Environment Variables

1. Click **"e-folio-frontend"** service
2. **Environment** tab
3. Update these variables:
   ```
   VITE_API_URL=https://e-folio-backend.onrender.com
   VITE_SOCKET_URL=https://e-folio-backend.onrender.com
   ```
4. Click **"Save Changes"**

**Both services will redeploy automatically.**

---

## ✅ Step 6: Verify Deployment

### Check Backend Health

1. Go to your backend URL: `https://e-folio-backend.onrender.com/api/health`
2. You should see:
   ```json
   {
     "status": "ok",
     "message": "E-Folio Pro Server Running",
     "version": "2.0.0",
     "database": "connected"
   }
   ```

### Check Frontend

1. Visit your frontend URL: `https://e-folio-frontend.onrender.com`
2. You should see:
   - ✅ Landing page loads
   - ✅ Theme switcher works
   - ✅ Animations working
   - ✅ No console errors

---

## 🔧 Step 7: Seed Database (Optional)

Add initial owner account to your database.

### Update Seed Script

1. In your local project, create `server/.env`:
   ```env
   MONGODB_URI=your-mongodb-connection-string-here
   JWT_SECRET=your-jwt-secret
   PORT=5000
   NODE_ENV=development
   ```

2. Run seed script locally:
   ```bash
   cd server
   npm install  # if you haven't already
   npm run seed
   ```

3. This creates an owner account:
   - **Email**: `devtechs842@gmail.com`
   - **Password**: `pass1234`

### Or Seed via Render Shell

1. Render Dashboard → **e-folio-backend**
2. **Shell** tab (left sidebar)
3. Run:
   ```bash
   node seed.js
   ```

---

## 🎉 Success!

Your E-Folio is now deployed!

- **Frontend**: `https://e-folio-frontend.onrender.com`
- **Backend**: `https://e-folio-backend.onrender.com`
- **Database**: MongoDB Atlas

### Test Features

- ✅ Visit landing page
- ✅ View skills section
- ✅ View projects section
- ✅ Test theme switcher
- ✅ Login to dashboard (`/dashboard`)
- ✅ Check real-time features

---

## 📊 Monitoring & Logs

### View Logs

1. Render Dashboard → Select service
2. **Logs** tab
3. Real-time logs appear here

### Check Metrics

1. **Metrics** tab
2. See CPU, Memory, Bandwidth usage

---

## 🚨 Troubleshooting

### Backend: "Cannot find module 'express'"

**Cause**: Build command not running  
**Fix**: Check `render.yaml` has `buildCommand: cd server && npm install`

### Backend: "Cannot connect to database"

**Cause**: Missing or incorrect MONGODB_URI  
**Fix**: 
1. Check environment variable is set
2. Verify password is correct (no `<>` brackets)
3. Check database name is `e-folio`
4. Verify IP whitelist includes `0.0.0.0/0`

### Frontend: "Failed to fetch"

**Cause**: CORS or wrong API URL  
**Fix**:
1. Check `VITE_API_URL` is correct
2. Verify backend is running
3. Check backend logs for CORS errors

### Service Won't Start

**Cause**: Missing environment variables  
**Fix**: Go to Environment tab, verify all required variables are set

### Build Fails

**Cause**: Dependencies issue  
**Fix**: Check build logs, run `npm install` locally first

---

## 💡 Tips

### Free Tier Limitations

- **Render Free Tier**: Services spin down after 15 minutes of inactivity
- **First request**: May take 30-60 seconds (cold start)
- **Solution**: Upgrade to paid plan ($7/month) for always-on services

### Custom Domain

1. Render Dashboard → Service → **Settings**
2. **Custom Domain** section
3. Add your domain
4. Update DNS records as shown

### Auto-Deploy

- **Already enabled!** Push to `main` branch = auto-deploy
- Disable in: Settings → Build & Deploy → Auto-Deploy

---

## 🔄 Updating Your App

### Deploy New Changes

```bash
# Make your changes
git add .
git commit -m "Your changes description"
git push origin main
```

Render automatically:
1. Detects the push
2. Rebuilds services
3. Deploys new version

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Render Status**: https://status.render.com
- **Community Forum**: https://community.render.com

---

## 🎯 Quick Reference

### Environment Variables Checklist

**Backend (e-folio-backend):**
- ✅ `NODE_ENV` = production (auto-set)
- ✅ `PORT` = 10000 (auto-set)
- ✅ `MONGODB_URI` = Your MongoDB connection string
- ✅ `JWT_SECRET` = Auto-generated
- ✅ `CLIENT_URL` = Frontend URL

**Frontend (e-folio-frontend):**
- ✅ `NODE_VERSION` = 18 (auto-set)
- ✅ `VITE_API_URL` = Backend URL
- ✅ `VITE_SOCKET_URL` = Backend URL

---

## 🚀 Next Steps

1. **Test all features** on deployed site
2. **Set up custom domain** (optional)
3. **Configure monitoring** alerts
4. **Set up backups** for MongoDB
5. **Upgrade to paid tier** if needed (no cold starts)

---

**Your E-Folio Pro is ready to showcase your work to the world! 🎉**
