# E-Folio Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MongoDB running on `localhost:27017`
- npm (not pnpm)

### Installation

#### 1. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

#### 2. Seed Database (First Time Only)
```bash
cd server
npm run seed
```

This creates the owner user:
- **Email:** devtechs842@gmail.com
- **Password:** pass1234

#### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Server runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
App runs on: http://localhost:5174

## 🎯 Quick Test

### Test Collaboration Form
1. Visit: http://localhost:5174/collaborate
2. Fill out the form:
   - Name: Test User
   - Email: test@example.com
   - Role: Developer
   - Skills: Select React, Node.js
   - Message: "I'd like to collaborate!"
3. Click "Submit Collaboration Request"
4. You should see a success message

### Test Dashboard
1. Visit: http://localhost:5174/login
2. Login with:
   - Email: devtechs842@gmail.com
   - Password: pass1234
3. Navigate to "Collaboration Requests" in sidebar
4. You should see the test request you just submitted
5. Try clicking "Approve" or "Reject"

### Test Real-Time Chat
1. Open dashboard in TWO browser windows
2. Go to "Chat System" in both
3. Send a message in one window
4. It should appear instantly in the other window

## 🔍 Troubleshooting

### MongoDB Not Running
```bash
# Start MongoDB (Windows)
net start MongoDB

# Check if MongoDB is running
mongosh
```

### Port Already in Use
```bash
# Kill process on port 5000 (Backend)
npx kill-port 5000

# Kill process on port 5174 (Frontend)
npx kill-port 5174
```

### Backend Connection Error
- Check that MongoDB is running
- Verify `.env` file in `server/` folder exists
- Confirm `MONGODB_URI=mongodb://localhost:27017/e-folio`

### Socket.IO Not Connecting
- Check browser console for connection errors
- Verify backend server is running on port 5000
- Check CORS settings allow `http://localhost:5174`

## 📊 Verify Everything Works

✅ **Backend Health Check:**
```
http://localhost:5000/health
```
Should return:
```json
{
  "status": "ok",
  "message": "E-Folio Pro Server Running",
  "version": "2.0.0"
}
```

✅ **Frontend Loading:**
- Visit http://localhost:5174
- Should see landing page with header and navigation

✅ **Database Connection:**
```bash
mongosh
use e-folio
db.users.find()
```
Should show the owner user

✅ **Socket.IO Connection:**
- Login to dashboard
- Open browser console
- Look for: `✅ Socket connected: [socket-id]`

## 🎨 Available Routes

### Public Routes
- `/` - Landing page
- `/login` - Login page
- `/collaborate` - Collaboration request form

### Protected Routes (Requires Login)
- `/dashboard` - Dashboard home
- `/dashboard/projects` - Project manager
- `/dashboard/skills` - Skills editor
- `/dashboard/chat` - Real-time chat
- `/dashboard/collaboration-requests` - Manage requests (Owner only)
- `/dashboard/analytics` - Analytics dashboard
- `/dashboard/settings` - Settings

## 🔐 User Roles

### Owner
- Full access to all features
- Can approve/reject collaboration requests
- Can manage all content

### Collaborator
- Edit permissions
- Access to chat and projects
- Limited settings access

### Viewer
- Read-only access
- Can view content but not edit

## 📝 Important Files

- `src/contexts/SocketContext.jsx` - Socket.IO configuration
- `src/contexts/AuthContext.jsx` - Authentication logic
- `src/services/api.service.js` - API calls
- `src/services/socket.service.js` - Socket.IO service
- `server/server.js` - Backend entry point
- `server/controllers/collaboration.controller.js` - Collaboration logic
- `server/.env` - Backend configuration

## 🎉 Success!

If you can:
1. ✅ Login to dashboard
2. ✅ Submit collaboration requests
3. ✅ See real-time notifications
4. ✅ Send chat messages
5. ✅ See Socket.IO connected in console

**Congratulations! Everything is working!** 🎊

## Need Help?

Check `FIXES_APPLIED.md` for detailed technical documentation.
