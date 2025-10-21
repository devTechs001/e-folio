# E-Folio Pro - Quick Start Guide

## 🚀 Start in 3 Steps

### Step 1: Start Backend
```bash
cd server
npm start
```
✅ Server running on `http://localhost:5000`

### Step 2: Start Frontend
```bash
# Open new terminal in root directory
npm run dev
```
✅ App running on `http://localhost:5173`

### Step 3: Login
- **Owner:** `owner@efolio.com` / `owner123`
- **Collaborator:** Visit `/collaborate` → Use code `COLLAB2024`

---

## 🎯 Owner Dashboard Features

Access all 13 pages as owner:

1. **Overview** (`/dashboard`) - Dashboard home
2. **Projects** (`/dashboard/projects`) - Manage projects
3. **Skills** (`/dashboard/skills`) - Edit skills ⭐ OWNER-ONLY
4. **Themes** (`/dashboard/theme`) - Customize themes ⭐ OWNER-ONLY
5. **Analytics** (`/dashboard/analytics`) - View metrics ⭐ OWNER-ONLY
6. **Visitors** (`/dashboard/visitors`) - Visitor analytics ⭐ OWNER-ONLY
7. **Media** (`/dashboard/media`) - Media library ⭐ OWNER-ONLY
8. **Emails** (`/dashboard/emails`) - Email management ⭐ OWNER-ONLY
9. **Collaborators** (`/dashboard/collaborators`) - Manage team ⭐ OWNER-ONLY
10. **Chat** (`/dashboard/chat`) - Real-time messaging
11. **AI Assistant** (`/dashboard/ai-assistant`) - AI help
12. **Portfolio Editor** (`/dashboard/portfolio-editor`) - Edit structure ⭐ OWNER-ONLY
13. **Settings** (`/dashboard/settings`) - Configuration

---

## 🤝 Collaborator Features

Limited access (5 pages):
- Overview
- Projects
- Chat
- AI Assistant
- Settings (limited)

---

## 🔑 Key Features

### ✅ Implemented
- Real-time chat with Socket.io
- AI Assistant interface
- Media file management
- Visitor analytics tracking
- Email management system
- Portfolio structure editor
- Theme customization
- Skills management
- Project portfolio
- Notification system
- Access control system

### 🎨 Styling
- Tailwind CSS with custom cyber theme
- Primary: `#00efff` (Cyan)
- Secondary: `#00d4ff` (Light Blue)
- Dark: `#081b29` (Background)
- Custom animations and effects

---

## 📂 Important Files

### Configuration
- `vite.config.js` - Vite settings (base path fixed to `/`)
- `tailwind.config.js` - Tailwind custom theme
- `server/.env` - Server environment variables

### Key Components
- `src/App.jsx` - Main app with routing
- `src/pages/Dashboard.jsx` - Dashboard with menu
- `src/contexts/AuthContext.jsx` - Authentication
- `src/components/NotificationSystem.jsx` - Notifications
- `server/server.js` - Backend with Socket.io

---

## 🐛 Common Issues

### Port Already in Use
```bash
# Windows - Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <process_id> /F

# Or change port in vite.config.js
```

### Routing Error
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Check base path in `vite.config.js` is `/`

### Socket Not Connecting
- Ensure server is running on port 5000
- Check `server/.env` has correct CLIENT_URL
- Verify CORS settings

---

## 📖 Documentation

Full documentation available:
- **FEATURES.md** - All features explained
- **ACCESS_CONTROL.md** - Permission system
- **SETUP_GUIDE.md** - Detailed setup
- **IMPLEMENTATION_SUMMARY.md** - What was built

---

## 🎨 Customization Quick Tips

### Change Theme Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: { 500: '#00efff' }, // Your color here
}
```

### Add Dashboard Page
1. Create component in `src/components/dashboard/`
2. Import in `src/pages/Dashboard.jsx`
3. Add to `menuItems` array with roles

### Modify Access Control
In Dashboard menu item:
```javascript
roles: ['owner'] // or ['owner', 'collaborator']
```

---

## 🔄 Development Workflow

1. **Make changes** to code
2. **See live updates** (Vite hot reload)
3. **Test as owner** and collaborator
4. **Check console** for errors
5. **Commit changes** when stable

---

## 🚀 Production Build

```bash
# Build frontend
npm run build

# Test production build
npm run preview

# Deploy dist folder to hosting
```

---

## 📞 Quick Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start backend
cd server && npm start

# Check for updates
npm outdated
```

---

## ⚡ Pro Tips

1. Open **two browser tabs** - one as owner, one as collaborator
2. Use **real-time chat** to test Socket.io
3. **Skills page** is owner-only - perfect for personal branding
4. **Media Manager** supports images, videos, documents
5. **AI Assistant** can help with content generation
6. **Portfolio Editor** lets you restructure without coding
7. **Visitor Analytics** shows detailed user insights
8. **Email Manager** centralizes all communications

---

## 🎯 Next Steps

### Immediate
1. ✅ Start both servers
2. ✅ Login as owner
3. ✅ Explore all 13 dashboard pages
4. ✅ Test real-time chat
5. ✅ Upload media files
6. ✅ Customize theme

### Short Term
- Add your real skills and projects
- Upload profile images
- Customize colors and fonts
- Invite real collaborators
- Test on mobile devices

### Long Term
- Integrate real AI with TensorFlow.js
- Add MongoDB for data persistence
- Implement email sending
- Deploy to production
- Add more analytics

---

## 🎊 You're All Set!

Your E-Folio Pro is ready with:
- ✅ 13 dashboard pages
- ✅ 8 owner-exclusive features
- ✅ Real-time communication
- ✅ AI assistance
- ✅ Professional UI
- ✅ Complete access control

**Start the servers and login to explore!**

---

**Questions?** Check the documentation files or console logs for help.

**Happy building! 🚀**
