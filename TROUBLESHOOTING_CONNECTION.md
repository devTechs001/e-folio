# 🔧 Troubleshooting "Unable to connect to the server"

## Quick Diagnosis Steps

### Step 1: Test Backend Directly

Open this URL in your browser:
```
https://e-folio-backend-server.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "E-Folio Pro Server Running",
  "timestamp": "...",
  "version": "2.0.0"
}
```

**If this works:** Backend is running ✅  
**If this fails:** Backend is down ❌ (check Render logs)

---

### Step 2: Use the Connection Tester

Open the diagnostic tool I created:
```bash
# Open in browser:
file:///c:/Users/Melanie/react-projects/e-folio/test-connection.html

# Or use Live Server in VS Code
```

This will test:
- Backend health
- API endpoints
- CORS configuration

---

### Step 3: Check Where You're Testing

**Are you testing:**
- ✅ **Production**: https://e-folio-pro.netlify.app  
- ❌ **Local Dev**: http://localhost:5173

**The issue might be different for each!**

---

## Common Issues & Fixes

### 🔴 Issue 1: CORS Error (Most Common)

**Symptoms:**
- Browser console shows: `CORS policy blocked...`
- Error: `Failed to fetch` or `Network error`

**Root Cause:**
The backend's `CLIENT_URL` environment variable doesn't match your frontend URL exactly.

**Fix:**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select: **e-folio-backend-server**
3. Click: **Environment** tab
4. Check `CLIENT_URL` value:
   - ❌ Wrong: `https://e-folio-pro.netlify.app/` (with trailing slash)
   - ✅ Correct: `https://e-folio-pro.netlify.app` (no trailing slash)
   - ❌ Wrong: Different domain entirely

5. If incorrect, update it and click **Save**
6. Backend will auto-redeploy (wait 2-3 minutes)

---

### 🟡 Issue 2: Frontend Not Rebuilt

**Symptoms:**
- Backend health check works
- But frontend still shows connection error
- No CORS errors in console

**Root Cause:**
Netlify hasn't rebuilt with new environment variables from `netlify.toml`.

**Fix Option A: Trigger Netlify Rebuild**
1. Go to: https://app.netlify.com/sites/e-folio-pro/deploys
2. Click: **Trigger deploy** → **Clear cache and deploy site**
3. Wait for build to complete (2-3 minutes)

**Fix Option B: Force Git Push**
```bash
git add .
git commit -m "chore: Trigger rebuild"
git push origin main
```

---

### 🟢 Issue 3: Testing Locally Without .env

**Symptoms:**
- Works on production (https://e-folio-pro.netlify.app)
- Fails on local dev (http://localhost:5173)

**Root Cause:**
Local `.env` file doesn't exist or has wrong values.

**Fix:**
```bash
# Create .env in project root
echo "VITE_API_URL=https://e-folio-backend-server.onrender.com/api" > .env
echo "VITE_SOCKET_URL=https://e-folio-backend-server.onrender.com" >> .env

# Restart dev server
npm run dev
```

---

### 🟣 Issue 4: MongoDB Connection Failed

**Symptoms:**
- Backend shows: `Running in memory mode`
- API calls timeout or return 500 errors

**Root Cause:**
Backend can't connect to MongoDB Atlas.

**Fix:**
1. Add IP whitelist to MongoDB Atlas (see main guide)
2. Verify `MONGODB_URI` in Render environment variables
3. Check Render logs for MongoDB connection errors

---

### 🔵 Issue 5: Wrong API URL

**Symptoms:**
- 404 errors for API calls
- Network tab shows wrong URL

**Root Cause:**
`VITE_API_URL` is incorrectly configured.

**Current Configuration (Should Be):**
```
VITE_API_URL=https://e-folio-backend-server.onrender.com/api
```

**Common Mistakes:**
- ❌ Missing `/api` at the end
- ❌ Wrong domain name
- ❌ HTTP instead of HTTPS

**Fix:**
Update in `netlify.toml` line 49, then rebuild.

---

## Detailed Debugging Steps

### 1. Check Browser Console (F12)

**Open DevTools → Console tab:**

Look for:
```
✅ Good: No errors
❌ Bad: CORS policy error
❌ Bad: Failed to fetch
❌ Bad: 404 Not Found
```

### 2. Check Network Tab

**Open DevTools → Network tab:**

1. Refresh page
2. Look for failed requests (red)
3. Click on a failed request
4. Check:
   - **Request URL**: Should be `https://e-folio-backend-server.onrender.com/api/...`
   - **Status Code**: 
     - `0` or `(failed)` = Connection blocked
     - `404` = Wrong URL
     - `500` = Backend error
     - `401/403` = Auth issue (but server is reachable!)

### 3. Check Render Logs

1. Go to: https://dashboard.render.com
2. Select: **e-folio-backend-server**
3. Click: **Logs** tab
4. Look for:
   - ✅ `MongoDB Connected`
   - ✅ `E-Folio Server Running`
   - ❌ `MongoDB connection failed`
   - ❌ Any error messages

### 4. Check Netlify Build Logs

1. Go to: https://app.netlify.com/sites/e-folio-pro/deploys
2. Click on the latest deploy
3. Check build logs for:
   - Environment variables being injected
   - Build success
   - Any errors

---

## Testing URLs

### Backend Endpoints

Test these in your browser or Postman:

```bash
# Health Check (should always work)
https://e-folio-backend-server.onrender.com/health

# API Health (if it exists)
https://e-folio-backend-server.onrender.com/api/health

# Auth Endpoint (should return 401 without token - that's OK!)
https://e-folio-backend-server.onrender.com/api/auth/verify
```

### Frontend

```bash
# Production
https://e-folio-pro.netlify.app

# Local Dev
http://localhost:5173
```

---

## Quick Copy-Paste Fixes

### Fix 1: Update Render CLIENT_URL
```
CLIENT_URL=https://e-folio-pro.netlify.app
```
(No trailing slash!)

### Fix 2: Create Local .env
```bash
cat > .env << 'EOF'
VITE_API_URL=https://e-folio-backend-server.onrender.com/api
VITE_SOCKET_URL=https://e-folio-backend-server.onrender.com
EOF
```

### Fix 3: Force Netlify Rebuild
```bash
git commit --allow-empty -m "Trigger rebuild"
git push origin main
```

---

## Still Not Working?

### Run This Command in Browser Console

Paste this in your browser console (F12) while on https://e-folio-pro.netlify.app:

```javascript
// Test backend connection
fetch('https://e-folio-backend-server.onrender.com/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend is reachable:', d))
  .catch(e => console.error('❌ Backend connection failed:', e));

// Test API endpoint
fetch('https://e-folio-backend-server.onrender.com/api/auth/verify')
  .then(r => console.log('✅ API endpoint status:', r.status, r.statusText))
  .catch(e => console.error('❌ API connection failed:', e));

// Check environment variables
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
```

**Share the output with me and I can pinpoint the exact issue!**

---

## Expected Successful Output

When everything is working, you should see:

**Render Logs:**
```
✅ MongoDB Connected: cluster1.1frrfrb.mongodb.net
📁 Database: e-folio
🚀 E-Folio Server Running
📡 Port: 10000
🌐 Client URL: https://e-folio-pro.netlify.app
💾 Database: Connected
🔌 Socket.io: Ready
```

**Browser Console:**
```
(no errors)
```

**Network Tab:**
```
✅ All requests to /api/* return 200 or 401 (not 404 or 0)
```

---

## Contact Checklist

If you need more help, provide:
- [ ] Browser console errors (screenshot)
- [ ] Network tab screenshot (showing failed request)
- [ ] Render logs (last 50 lines)
- [ ] Which URL you're testing (production or local?)
- [ ] Output from the JavaScript test above

This will help me identify the exact issue quickly!
