# 🔐 E-Folio Environment Variables Quick Reference

## 🎯 Frontend (Netlify)

**Configure in:** `netlify.toml` (already configured ✅)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://e-folio-backend-server.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://e-folio-backend-server.onrender.com` |

---

## 🖥️ Backend (Render Dashboard)

**Configure in:** Render Dashboard → Environment Tab

### Required Variables

```bash
# Database
MONGODB_URI=mongodb+srv://danielmk:20051117dan@cluster1.1frrfrb.mongodb.net/e-folio?retryWrites=true&w=majority

# Client
CLIENT_URL=https://e-folio-pro.netlify.app

# Server
PORT=10000
NODE_ENV=production

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
OWNER_EMAIL=devtechs842@gmail.com
OWNER_PASSWORD=pass1234
OWNER_NAME=Portfolio Owner
```

### Optional Variables

```bash
# AI Features (if using OpenAI)
OPENAI_API_KEY=sk-...

# Email (if using SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=efolio_session_secret_2024
SESSION_TIMEOUT=86400000
```

---

## 📝 Local Development

### Frontend `.env` (create manually)

```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Backend `server/.env` (create manually)

```bash
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/e-folio
JWT_SECRET=efolio_dev_secret_2024
OWNER_EMAIL=devtechs842@gmail.com
OWNER_PASSWORD=pass1234
OWNER_NAME=Portfolio Owner
```

---

## ⚠️ Important Notes

1. **Never commit `.env` files** - They are gitignored for security
2. **Use `.env.example` files** as templates
3. **Change secrets in production** - Default values are for development only
4. **MongoDB Atlas IP Whitelist** - Add `0.0.0.0/0` or specific IPs
5. **JWT_SECRET** - Generate a strong random string for production

---

## 🔧 How to Add Variables in Render

1. Go to: https://dashboard.render.com
2. Select service: **e-folio-backend-server**
3. Click: **Environment** tab
4. Click: **Add Environment Variable**
5. Enter: Key and Value
6. Click: **Save Changes**
7. Service will automatically redeploy

---

## 🧪 Testing Variables

### Check Frontend Variables
```javascript
// In browser console at https://e-folio-pro.netlify.app
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Socket URL:', import.meta.env.VITE_SOCKET_URL);
```

### Check Backend Variables
```bash
# In Render logs or locally
echo $MONGODB_URI
echo $CLIENT_URL
echo $JWT_SECRET
```

---

## 🔄 Quick Commands

### Copy environment template (local development)
```bash
# Frontend
cp .env.example .env

# Backend
cp server/.env.example server/.env
```

### Generate strong JWT secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test MongoDB connection
```bash
mongosh "mongodb+srv://danielmk:20051117dan@cluster1.1frrfrb.mongodb.net/e-folio"
```

---

**Last Updated**: October 23, 2025
