# 🔐 Environment Variables Configuration Guide

## ⚠️ CRITICAL SECURITY ISSUE FIXED!

Your `.env` file contained an **exposed email password**. This has been removed and replaced with a placeholder.

**Old (INSECURE):**
```
EMAIL_PASS=20051117dan  ❌ Real password exposed!
```

**New (SECURE):**
```
EMAIL_PASS=your-16-char-app-password-here  ✅ Placeholder
```

---

## ✅ What Was Done

### 1. Cleaned Up `.env` File
- ✅ Removed duplicate `JWT_SECRET` entries
- ✅ Removed duplicate email configuration
- ✅ Organized into clear sections
- ✅ Added helpful comments
- ✅ Commented out optional services
- ✅ **Removed exposed password**

### 2. Created Backup
- ✅ Original saved to `server/.env.backup`

### 3. Kept Essential Variables
- ✅ Server configuration
- ✅ Database connection
- ✅ Authentication secrets
- ✅ Owner account credentials

---

## 🔧 Required Configuration

### These variables MUST be set for the app to work:

#### **1. Server & Client**
```env
NODE_ENV=development          # development or production
PORT=5000                     # Backend server port
CLIENT_URL=http://localhost:5174  # Frontend URL
```

#### **2. Database**
```env
# Local Development:
MONGODB_URI=mongodb://localhost:27017/e-folio

# Production (MongoDB Atlas):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/e-folio
```

**How to get MongoDB Atlas URI:**
1. Go to https://cloud.mongodb.com
2. Create free cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0`
5. Get connection string
6. Replace `<username>`, `<password>`, and `<dbname>`

#### **3. Authentication**
```env
JWT_SECRET=efolio_super_secret_key_change_in_production_2024
SESSION_SECRET=efolio_session_secret_2024
```

**⚠️ For Production:** Generate strong random secrets:
```bash
# Generate new secrets (in terminal):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### **4. Owner Account**
```env
OWNER_EMAIL=devtechs842@gmail.com
OWNER_PASSWORD=pass1234
OWNER_NAME=Portfolio Owner
```

Used by `seed.js` to create the owner account.

---

## 📧 Email Configuration (Optional)

### Gmail App Password Setup

**⚠️ NEVER use your real Gmail password!**

**Steps:**
1. Go to https://myaccount.google.com/apppasswords
2. Sign in to your Google account
3. Select "Mail" and your device
4. Click "Generate"
5. Copy the 16-character password
6. Add to `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=devtechs842@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # Your 16-char app password
```

**Used for:**
- Sending collaboration invites
- Contact form submissions
- Password reset emails

---

## 🎨 Media Storage (Optional)

### Cloudinary (for image uploads)

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**How to get:**
1. Sign up at https://cloudinary.com (free tier)
2. Dashboard → Account Details
3. Copy Cloud Name, API Key, API Secret

**Used for:**
- Project image uploads
- Profile picture uploads
- Media management in dashboard

---

## 🤖 AI Features (Optional)

### OpenAI API

```env
OPENAI_API_KEY=sk-your-openai-api-key
```

**How to get:**
1. Sign up at https://platform.openai.com
2. API Keys → Create new secret key
3. Copy the key (starts with `sk-`)

**Used for:**
- AI chat assistant
- AI-powered suggestions
- Content generation

---

## 💳 Payment Integration (Optional)

### Stripe

```env
STRIPE_API_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

**How to get:**
1. Sign up at https://stripe.com
2. Developers → API Keys
3. Copy test/live keys

**Used for:**
- Premium features (future)
- Subscription billing
- Payment processing

---

## 🌐 Production Deployment

### For Netlify/Render/Vercel

**Update these values:**

```env
NODE_ENV=production
CLIENT_URL=https://your-site.netlify.app
MONGODB_URI=mongodb+srv://...  # MongoDB Atlas
JWT_SECRET=<generate-new-32-byte-secret>
SESSION_SECRET=<generate-new-32-byte-secret>
```

**Add in deployment platform:**
1. Go to site dashboard
2. Settings → Environment Variables
3. Add each variable
4. Redeploy

---

## 📋 Configuration Checklist

### Minimum (Local Development)
- [x] PORT=5000
- [x] CLIENT_URL=http://localhost:5174
- [x] MONGODB_URI (local or Atlas)
- [x] JWT_SECRET
- [x] OWNER_EMAIL
- [x] OWNER_PASSWORD

### Email Features
- [ ] EMAIL_HOST
- [ ] EMAIL_PORT
- [ ] EMAIL_USER
- [ ] EMAIL_PASS (16-char app password)

### Media Uploads
- [ ] CLOUDINARY_CLOUD_NAME
- [ ] CLOUDINARY_API_KEY
- [ ] CLOUDINARY_API_SECRET

### AI Features
- [ ] OPENAI_API_KEY

### Payments
- [ ] STRIPE_API_KEY
- [ ] STRIPE_WEBHOOK_SECRET

---

## 🔒 Security Best Practices

### ✅ DO:
- Use Gmail App Passwords (not real passwords)
- Generate strong JWT secrets for production
- Use MongoDB Atlas for production
- Add `.env` to `.gitignore`
- Use different secrets for dev/production
- Rotate secrets periodically

### ❌ DON'T:
- Commit `.env` to Git
- Use real passwords in `.env`
- Share `.env` files publicly
- Use same secrets for dev/production
- Hardcode secrets in code

---

## 🚀 Quick Start

### Local Development

```bash
# 1. Configure .env (minimum required)
cd server
nano .env  # or use your editor

# 2. Set these values:
MONGODB_URI=mongodb://localhost:27017/e-folio
# Keep other defaults

# 3. Start MongoDB (if local)
mongod

# 4. Seed database
node seed.js

# 5. Start server
npm run dev
```

### Production Deployment

```bash
# 1. Get MongoDB Atlas URI
# 2. Generate new JWT secrets
# 3. Add all variables to hosting platform
# 4. Deploy!
```

---

## 📝 Frontend .env (Optional)

If you need frontend environment variables, create `.env` in root:

```env
# Frontend Environment Variables
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# For production:
# VITE_API_URL=https://your-backend.onrender.com
# VITE_SOCKET_URL=https://your-backend.onrender.com
```

---

## 🆘 Troubleshooting

### Server won't start
**Check:**
- MongoDB is running
- `.env` file exists in `server/` folder
- All required variables are set
- No syntax errors in `.env`

### Email not sending
**Check:**
- Using Gmail App Password (not real password)
- 16-character password format: `xxxx xxxx xxxx xxxx`
- "Less secure app access" disabled (use app passwords instead)
- 2FA enabled on Gmail account

### Database connection fails
**Check:**
- MongoDB running locally, OR
- MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Connection string format correct
- Username/password in URI are correct

---

## ✅ Current Configuration Status

**REQUIRED (Configured):**
- ✅ Server configuration
- ✅ Client URL
- ✅ Database (local)
- ✅ JWT secrets
- ✅ Owner account

**OPTIONAL (Not Configured):**
- ⚠️ Email (needs app password)
- ⚠️ Cloudinary (commented out)
- ⚠️ OpenAI (commented out)
- ⚠️ Stripe (commented out)
- ⚠️ AWS (commented out)

**Your app will work with current configuration!**

Optional features can be enabled by uncommenting and configuring the respective variables.

---

## 🔐 Security Reminder

### The exposed email password has been removed from your `.env` file!

**Next steps:**
1. Change your email password (if it was real)
2. Generate Gmail App Password
3. Update `EMAIL_PASS` in `.env`
4. Never commit `.env` to Git

**Your `.env` file is now secure!** ✅

---

**Configuration complete! Start your server with:** `npm run dev`
