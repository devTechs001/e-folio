# Render.com Backend Deployment Guide

## Current Status

**Backend URL**: `https://e-folio-backend-server.onrender.com`

## Critical Issues to Fix

### 1. Missing Dependency: date-fns
**Status**: ✅ FIXED - Added to `server/package.json`

The server was crashing due to missing `date-fns` module required by `DashboardService.js`.

**Solution**: Added `"date-fns": "^3.3.1"` to dependencies in `server/package.json`

### 2. Environment Variables Configuration

You need to verify these environment variables are set in your Render dashboard:

#### Required Environment Variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://devtechs842_db_user:20051117dan@cluster0.kparor6.mongodb.net/e-folio?retryWrites=true&w=majority&appName=Cluster0

# Authentication
JWT_SECRET=your_jwt_secret_here

# AI Services (if using AI features)
GOOGLE_API_KEY=your_google_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GROQ_API_KEY=your_groq_api_key

# Email Service (if using email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Client URL (for CORS)
CLIENT_URL=https://e-folio-pro.netlify.app
```

## How to Configure Environment Variables on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your service**: `e-folio-backend-server`
3. **Navigate to**: Environment tab
4. **Add each variable**:
   - Click "Add Environment Variable"
   - Enter Key (e.g., `MONGODB_URI`)
   - Enter Value
   - Click "Save Changes"

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)
Render automatically deploys when you push to GitHub:

```bash
# After fixing package.json
git add server/package.json
git commit -m "fix: Add date-fns dependency to server"
git push origin main
```

Render will:
1. Detect the push
2. Run `npm install` (installs date-fns)
3. Start the server with `npm start`

### Option 2: Manual Deployment
1. Go to Render Dashboard
2. Select your service
3. Click "Manual Deploy" → "Deploy latest commit"

## Verify Deployment

### 1. Check Build Logs
- Go to Render Dashboard → Your Service → Logs
- Look for successful build messages
- Verify no errors during `npm install`

### 2. Test Health Endpoint
```bash
curl https://e-folio-backend-server.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-23T..."
}
```

### 3. Test Socket.IO Connection
Open browser console on your frontend and check for:
```
✅ Socket connected: <socket-id>
🔌 Real-time connection established
```

## Common Issues & Solutions

### Issue: "Service Unavailable" or Timeout
**Cause**: Free tier cold start (30-60 seconds)
**Solution**: Wait and retry. First request after inactivity takes longer.

### Issue: "Cannot find module 'date-fns'"
**Cause**: Missing dependency
**Solution**: ✅ Fixed - Added to package.json

### Issue: MongoDB Connection Failed
**Cause**: Incorrect MONGODB_URI or network issue
**Solution**: 
- Verify MONGODB_URI in Render environment variables
- Check MongoDB Atlas network access (allow all IPs: 0.0.0.0/0)
- Verify database user credentials

### Issue: CORS Errors
**Cause**: CLIENT_URL not set or incorrect
**Solution**: Set `CLIENT_URL=https://e-folio-pro.netlify.app` in Render

## Build Configuration

Your `server/package.json` should have:

```json
{
  "scripts": {
    "start": "node server.js",
    "render-build": "npm install --legacy-peer-deps"
  },
  "engines": {
    "node": "18.x"
  }
}
```

Render Build Command: `npm run render-build` or `npm install`
Render Start Command: `npm start`

## Monitoring

### Check Server Status
```bash
# Health check
curl https://e-folio-backend-server.onrender.com/api/health

# Check if server is responding
curl -I https://e-folio-backend-server.onrender.com
```

### View Real-time Logs
- Render Dashboard → Your Service → Logs
- Watch for connection attempts, errors, or warnings

## Next Steps After Deployment

1. ✅ Verify backend is running
2. ✅ Test API endpoints
3. ✅ Verify Socket.IO connection from frontend
4. ✅ Test real-time features (collaboration, chat, emails)
5. ✅ Monitor error logs for any issues

## Support Resources

- Render Docs: https://render.com/docs
- Environment Variables: https://render.com/docs/configure-environment-variables
- Node.js Deployment: https://render.com/docs/deploy-node-express-app

