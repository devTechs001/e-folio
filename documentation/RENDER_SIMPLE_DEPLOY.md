# 🚀 Deploy Backend to Render (No Blueprint, No Credit Card)

Simple Web Service deployment - points directly to the `server` directory.

---

## 📋 Step-by-Step Instructions

### Step 1: Create Web Service on Render

1. Go to **https://dashboard.render.com**
2. Click **"New +"** (top right)
3. Select **"Web Service"** (NOT Blueprint)

### Step 2: Connect GitHub Repository

4. Click **"Connect GitHub"** (if not connected)
5. Find and select: **`devTechs001/e-folio`**
6. Click **"Connect"**

### Step 3: Configure Service Settings

**Fill in these fields:**

| Field | Value |
|-------|-------|
| **Name** | `e-folio-backend` |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | `server` ⚠️ **IMPORTANT!** |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

⚠️ **CRITICAL**: Set **Root Directory** to `server` - this tells Render to deploy only the server folder!

### Step 4: Add Environment Variables

**Click "Advanced" → Add Environment Variables:**

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | Leave blank for now (we'll add after MongoDB setup) |
| `JWT_SECRET` | Leave blank (Render will generate) |
| `CLIENT_URL` | Your Netlify URL (e.g., `https://e-folio-pro.netlify.app`) |

**Note:** You can add MONGODB_URI after creating the service.

### Step 5: Create Service

7. Click **"Create Web Service"**
8. Render will start building (takes 2-3 minutes)

**First deploy will FAIL** - that's OK! We need to add MongoDB.

---

## 🍃 Step 6: Set Up MongoDB Atlas

### Create Free Database

1. Go to **https://cloud.mongodb.com**
2. **Sign Up/Login** (free account)
3. Click **"Build a Database"**
4. Select **"M0 FREE"** tier
5. Cloud Provider: **AWS**
6. Region: **US East (N. Virginia)** or closest
7. Cluster Name: `e-folio-cluster`
8. Click **"Create Cluster"** (wait 1-3 minutes)

### Create Database User

1. **Security** → **Database Access**
2. Click **"Add New Database User"**
3. Username: `efolio_admin`
4. Password: Click **"Autogenerate Secure Password"**
5. **COPY AND SAVE THIS PASSWORD!** ⚠️
6. Database User Privileges: **Read and write to any database**
7. Click **"Add User"**

### Whitelist Render

1. **Security** → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"**
4. IP: `0.0.0.0/0` (required for Render)
5. Click **"Confirm"**

### Get Connection String

1. **Deployment** → **Clusters** → Click **"Connect"**
2. Select **"Connect your application"**
3. Driver: **Node.js**, Version: **4.1 or later**
4. Copy connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>/<database>
   ```

5. **Replace `<password>`** with your actual password (NO angle brackets!)
6. **Add database name** at the end:
   ```
   mongodb+srv://<username>:<password>@<cluster>/<database>
   ```

**Save this complete connection string!**

---

## 🔐 Step 7: Add MongoDB to Render

1. Back to **Render Dashboard**
2. Click your **`e-folio-backend`** service
3. **Environment** tab (left sidebar)
4. Click **"Add Environment Variable"**

**Add:**
- **Key**: `MONGODB_URI`
- **Value**: Paste your complete MongoDB connection string

5. Click **"Save Changes"**

**Render will automatically redeploy!** ✅

---

## ✅ Step 8: Verify Deployment

### Check Deployment Logs

1. Render Dashboard → **Logs** tab
2. Look for:
   ```
   ==> Running 'npm start'
   ✅ E-Folio Server Running
   📡 Port: 10000
   💾 Database: Connected
   🔌 Socket.io: Ready
   ```

### Test Health Endpoint

Your backend URL will be: `https://e-folio-backend.onrender.com`

Visit: **https://e-folio-backend.onrender.com/api/health**

**Expected response:**
```json
{
  "status": "ok",
  "message": "E-Folio Pro Server Running",
  "version": "2.0.0",
  "database": "connected"
}
```

---

## 🌐 Step 9: Update Netlify Frontend

Your frontend needs to know where the backend is:

1. Go to **Netlify Dashboard**
2. Click your site
3. **Site settings** → **Environment variables**
4. Update these:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://e-folio-backend.onrender.com` |
| `VITE_SOCKET_URL` | `https://e-folio-backend.onrender.com` |

5. **Deploys** → **Trigger deploy** → **Deploy site**

Wait for Netlify to rebuild (1-2 minutes).

---

## 🎉 Test Your App

1. Visit your **Netlify URL**
2. Frontend should load ✅
3. Skills/Projects should load from API ✅
4. No console errors ✅

---

## 🔧 Troubleshooting

### Backend Build Fails

**Error:** `Cannot find module 'express'`

**Cause:** Root Directory not set to `server`

**Fix:**
1. Render Dashboard → Settings
2. Find **Root Directory**
3. Set to: `server`
4. Save Changes → Redeploy

---

### Cannot Connect to Database

**Error:** `MongoServerError: bad auth`

**Cause:** Wrong password in connection string

**Fix:**
1. Check password has no `<>` brackets
2. Special characters may need URL encoding
3. Try regenerating password in MongoDB Atlas

---

### CORS Errors in Frontend

**Error:** `Access-Control-Allow-Origin`

**Cause:** CLIENT_URL not set correctly

**Fix:**
1. Render → Environment
2. Update `CLIENT_URL` to exact Netlify URL
3. Include `https://` and NO trailing slash

---

### Service Keeps Crashing

**Check logs for:**
- Missing environment variables
- Database connection issues
- Port conflicts

**Fix:** Review all environment variables are set correctly.

---

## 📊 Environment Variables Summary

### Render Backend Service

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=auto-generated-by-render
CLIENT_URL=https://your-netlify-site.netlify.app
```

### Netlify Frontend Site

```env
VITE_API_URL=https://e-folio-backend.onrender.com
VITE_SOCKET_URL=https://e-folio-backend.onrender.com
```

---

## 🔄 Updating Your Backend

Whenever you push changes to GitHub:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

**Render auto-deploys!** No manual steps needed.

---

## 💡 Important Notes

### Free Tier Limitations

- Service **spins down** after 15 minutes of inactivity
- First request after spin down: **30-60 seconds** cold start
- Upgrade to $7/month for always-on service

### Root Directory is Critical

- Must be set to `server` 
- This tells Render: "Deploy only this folder"
- Without it, Render tries to deploy the whole repo (fails)

### Connection String Format

```
mongodb+srv://<username>:<password>@<cluster>/<database>
```

- **USERNAME**: Database user (e.g., `efolio_admin`)
- **PASSWORD**: Actual password (NO `<>` brackets!)
- **CLUSTER**: Your cluster URL from Atlas
- **DATABASE**: `e-folio` (your database name)

---

## ✅ Configuration Checklist

- [ ] Render Web Service created
- [ ] Root Directory set to `server`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelist: `0.0.0.0/0`
- [ ] Connection string copied
- [ ] MONGODB_URI added to Render
- [ ] CLIENT_URL set to Netlify URL
- [ ] Netlify env vars updated
- [ ] Backend health check passes
- [ ] Frontend connects successfully

---

## 🎯 Quick Reference

**Render Dashboard:** https://dashboard.render.com  
**MongoDB Atlas:** https://cloud.mongodb.com  
**Netlify Dashboard:** https://app.netlify.com  

**Backend Health:** `https://e-folio-backend.onrender.com/api/health`  
**Backend Logs:** Render Dashboard → Logs tab  
**Deployment Status:** Render Dashboard → Events tab  

---

## 🆘 Still Stuck?

1. Check **Render Logs** for specific errors
2. Verify **all environment variables** are set
3. Test **MongoDB connection string** locally first
4. Check **Netlify build logs** for API errors
5. Test **backend health endpoint** directly

---

**You don't need Blueprint or a credit card - just a simple Web Service! 🎉**
