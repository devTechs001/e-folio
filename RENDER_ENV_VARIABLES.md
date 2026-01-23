# Render Environment Variables Configuration

## 🚀 How to Add Environment Variables on Render

1. Go to https://dashboard.render.com
2. Select your **e-folio-backend-server** service
3. Click **Environment** tab
4. Click **Add Environment Variable**
5. Copy and paste the variables below

---

## ✅ REQUIRED Variables (Must Set)

### Database
```
MONGODB_URI=mongodb+srv://devtechs842_db_user:20051117dan@cluster0.kparor6.mongodb.net/e-folio?retryWrites=true&w=majority&appName=Cluster0
```

### Authentication
```
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
SESSION_SECRET=your_session_secret_key_min_32_characters
```

### Server
```
PORT=5000
NODE_ENV=production
```

### Frontend URLs
```
FRONTEND_URL=https://e-folio-pro.netlify.app
CLIENT_URL=https://e-folio-pro.netlify.app
ALLOWED_ORIGINS=https://e-folio-pro.netlify.app,http://localhost:5173
```

### Owner Account
```
OWNER_EMAIL=devtechs842@gmail.com
OWNER_NAME=Portfolio Owner
OWNER_PASSWORD=your_secure_password
```

---

## 📧 EMAIL Configuration (Highly Recommended)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=devtechs842@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=noreply@yourportfolio.com
ADMIN_EMAIL=devtechs842@gmail.com
```

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Copy the 16-character password

---

## 🖼️ CLOUDINARY (For Image Uploads)

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**How to get Cloudinary credentials:**
1. Sign up at https://cloudinary.com
2. Go to Dashboard
3. Copy Cloud Name, API Key, API Secret

---

## 🤖 AI SERVICES (Optional but Recommended)

### Google Gemini AI
```
GOOGLE_AI_API_KEY=your_google_gemini_api_key
```
Get from: https://makersuite.google.com/app/apikey

### OpenAI
```
OPENAI_API_KEY=your_openai_api_key
```
Get from: https://platform.openai.com/api-keys

### Anthropic Claude
```
ANTHROPIC_API_KEY=your_anthropic_api_key
```
Get from: https://console.anthropic.com/

### Groq
```
GROQ_API_KEY=your_groq_api_key
```
Get from: https://console.groq.com/

---

## 🔗 GITHUB Integration (Optional)

```
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_USERNAME=devTechs001
```

**How to create GitHub token:**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `read:user`
4. Copy token

---

## 📊 ANALYTICS (Optional)

```
GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
SENTRY_DSN=your_sentry_dsn
```

---

## 🔒 SECURITY & RATE LIMITING

```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
MAX_FILES_PER_UPLOAD=10
```

---

## 🌐 CORS & WebSocket

```
CORS_ORIGIN=*
CORS_CREDENTIALS=true
SOCKET_CORS_ORIGIN=https://e-folio-pro.netlify.app,http://localhost:5173
```

---

## 📝 Quick Copy-Paste Template

Copy this entire block and add variables one by one:

```bash
# REQUIRED
MONGODB_URI=mongodb+srv://devtechs842_db_user:20051117dan@cluster0.kparor6.mongodb.net/e-folio?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
SESSION_SECRET=your_session_secret_key_min_32_characters
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://e-folio-pro.netlify.app
CLIENT_URL=https://e-folio-pro.netlify.app
OWNER_EMAIL=devtechs842@gmail.com
OWNER_NAME=Portfolio Owner
OWNER_PASSWORD=your_secure_password

# EMAIL (Recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=devtechs842@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=noreply@yourportfolio.com
ADMIN_EMAIL=devtechs842@gmail.com

# CLOUDINARY (Recommended)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI SERVICES (Optional)
GOOGLE_AI_API_KEY=your_google_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GROQ_API_KEY=your_groq_api_key
```

---

## ✅ After Adding Variables

1. Click **Save Changes**
2. Render will automatically redeploy
3. Wait 2-5 minutes for deployment
4. Check logs for any errors
5. Test: `curl https://e-folio-backend-server.onrender.com/api/health`

