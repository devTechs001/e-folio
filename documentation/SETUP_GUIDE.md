# E-Folio Pro - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js v16 or higher
- npm or pnpm package manager
- Git (optional)

---

## 📦 Installation Steps

### 1. Install Frontend Dependencies

```bash
cd e-folio
npm install
```

**Installed Packages:**
- React 19
- Tailwind CSS 4
- Framer Motion
- Lucide React
- Socket.io Client
- React Router DOM
- React Hot Toast
- AOS (Animate On Scroll)

### 2. Install Server Dependencies

```bash
cd server
npm install
```

**Installed Packages:**
- Express
- Socket.io
- MongoDB & Mongoose
- Helmet (Security)
- CORS
- Bcrypt
- dotenv

### 3. Environment Configuration

Create `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# MongoDB (Optional - runs without it)
MONGODB_URI=mongodb://localhost:27017/efolio
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/efolio

# Authentication (for future JWT implementation)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Email Configuration (Optional - for contact form)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🔧 Configuration

### Tailwind CSS

The Tailwind configuration is already set up in `tailwind.config.js` with:
- Custom cyber theme colors
- Custom animations
- Dark mode support
- Extended utilities

### Vite Configuration

Configured in `vite.config.js`:
- Base path set to `/` (fixed routing)
- Asset handling
- Build optimization

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Frontend:**
```bash
# In root directory
npm run dev
```
Frontend will run on: `http://localhost:5173`

**Terminal 2 - Backend:**
```bash
# In server directory
cd server
npm start
# or for auto-reload:
npm run dev
```
Backend will run on: `http://localhost:5000`

### Production Build

```bash
# Build frontend
npm run build

# Preview production build
npm run preview

# Build and start server
cd server
npm start
```

---

## 🔐 Default Credentials

### Owner Account
- **Email:** `owner@efolio.com`
- **Password:** `owner123`
- **Access:** Full dashboard access

### Collaborator Access
- **Route:** `/collaborate`
- **Access Code:** `COLLAB2024`
- **Access:** Limited dashboard features

---

## 📂 Project Structure

```
e-folio/
├── public/                     # Static assets
├── server/                     # Backend server
│   ├── .env                   # Environment variables
│   ├── server.js              # Main server file
│   └── package.json           # Server dependencies
├── src/
│   ├── components/
│   │   ├── dashboard/         # Dashboard components
│   │   │   ├── DashboardHome.jsx
│   │   │   ├── ProjectManager.jsx
│   │   │   ├── SkillsEditor.jsx         # Owner-only
│   │   │   ├── ThemeManager.jsx         # Owner-only
│   │   │   ├── Analytics.jsx            # Owner-only
│   │   │   ├── VisitorsAnalytics.jsx    # Owner-only
│   │   │   ├── MediaManager.jsx         # Owner-only
│   │   │   ├── EmailManager.jsx         # Owner-only
│   │   │   ├── Collaborators.jsx        # Owner-only
│   │   │   ├── PortfolioEditor.jsx      # Owner-only
│   │   │   ├── ChatSystem.jsx
│   │   │   ├── AIAssistant.jsx
│   │   │   └── Settings.jsx
│   │   ├── NotificationSystem.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx    # Authentication context
│   ├── pages/
│   │   ├── LandingPage.jsx    # Public portfolio
│   │   ├── Dashboard.jsx      # Main dashboard
│   │   └── LoginPage.jsx      # Login/Collaborate
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── tailwind.config.js         # Tailwind configuration
├── vite.config.js             # Vite configuration
├── package.json               # Frontend dependencies
├── FEATURES.md                # Feature documentation
├── ACCESS_CONTROL.md          # Access control guide
└── README.md                  # Project overview
```

---

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  primary: {
    500: '#00efff', // Main cyan - change this
  },
  secondary: {
    500: '#00d4ff', // Light blue
  },
  dark: {
    500: '#081b29', // Main background
  }
}
```

### Adding New Dashboard Pages

1. Create component in `src/components/dashboard/`
2. Import in `src/pages/Dashboard.jsx`
3. Add to menuItems array:

```javascript
{
    path: '/dashboard/your-page',
    icon: 'fas fa-icon-name',
    label: 'Your Page',
    component: YourComponent,
    roles: ['owner'] // or ['owner', 'collaborator']
}
```

---

## 🔌 Real-Time Features

### Socket.io Connection

The application connects to the Socket.io server automatically when you access the dashboard.

**Client Connection:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
    console.log('Connected to server');
});
```

**Server Events:**
- `authenticate` - User authentication
- `send_message` - Chat messages
- `new_message` - Receive messages
- `user_joined` - User online notification
- `online_users` - List of online users

---

## 🤖 AI Assistant

The AI Assistant is currently configured with simulated responses. To add real AI:

1. Install TensorFlow.js:
```bash
npm install @tensorflow/tfjs
```

2. Load a model in `AIAssistant.jsx`:
```javascript
import * as tf from '@tensorflow/tfjs';

const model = await tf.loadLayersModel('path/to/model.json');
```

3. Implement actual AI inference based on your model

---

## 📧 Email Integration

To enable real email functionality:

1. Configure SMTP in `server/.env`
2. Install nodemailer:
```bash
cd server
npm install nodemailer
```

3. Create email service in server:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
```

---

## 💾 Database Setup (Optional)

### MongoDB Local Installation

1. **Install MongoDB:**
   - Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Run MongoDB service

2. **Connect:**
```bash
mongosh
use efolio
```

### MongoDB Atlas (Cloud)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster
3. Get connection string
4. Add to `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/efolio
```

### Database Models

The application currently uses in-memory storage. To persist data:

1. Create models in `server/models/`
2. Implement CRUD operations
3. Replace Map() with MongoDB queries

---

## 🐛 Troubleshooting

### Routing Issues

**Problem:** "No routes matched location"

**Solution:**
1. Clear browser cache
2. Check `vite.config.js` - base should be `/`
3. Restart dev server
4. Hard refresh browser (Ctrl+Shift+R)

### Socket Connection Failed

**Problem:** Cannot connect to Socket.io server

**Solutions:**
1. Ensure server is running on port 5000
2. Check CORS configuration in `server/server.js`
3. Verify CLIENT_URL in `.env`
4. Check firewall settings

### Tailwind Styles Not Applying

**Solutions:**
1. Rebuild: `npm run build`
2. Check `index.css` has Tailwind imports
3. Verify content paths in `tailwind.config.js`
4. Restart dev server

### Port Already in Use

**Problem:** Port 5173 or 5000 already in use

**Solutions:**

Windows:
```bash
# Find process using port
netstat -ano | findstr :5173
# Kill process
taskkill /PID <process_id> /F
```

Or change port in `vite.config.js`:
```javascript
server: {
    port: 3000
}
```

---

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)

1. Build the project:
```bash
npm run build
```

2. Deploy `dist` folder to:
   - Netlify: Drag & drop or connect Git
   - Vercel: `vercel deploy`

3. Set environment variables in hosting platform

### Backend Deployment (Heroku/Railway)

1. Create `Procfile`:
```
web: node server/server.js
```

2. Set environment variables
3. Deploy via Git or platform CLI

### Full Stack Deployment

**Recommended:** Deploy separately
- Frontend: Netlify, Vercel, or GitHub Pages
- Backend: Heroku, Railway, or DigitalOcean

Update CLIENT_URL in production `.env`

---

## 📊 Performance Optimization

### Frontend

1. **Code Splitting:**
```javascript
const Component = React.lazy(() => import('./Component'));
```

2. **Image Optimization:**
   - Use WebP format
   - Lazy load images
   - Compress before upload

3. **Bundle Size:**
   - Check with `npm run build`
   - Remove unused dependencies
   - Use production builds

### Backend

1. **Caching:**
   - Implement Redis for sessions
   - Cache frequently accessed data

2. **Database Indexing:**
   - Add indexes to MongoDB collections
   - Optimize queries

3. **Rate Limiting:**
   - Prevent API abuse
   - Use express-rate-limit

---

## 🧪 Testing

### Run Frontend Tests
```bash
npm test
```

### Test Real-Time Features

1. Open two browser windows
2. Login as owner in one, collaborator in other
3. Test chat functionality
4. Verify online status updates

### Test API Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Analytics
curl http://localhost:5000/api/analytics
```

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Socket.io Guide](https://socket.io/docs/v4/)
- [Framer Motion](https://www.framer.com/motion/)
- [Express.js](https://expressjs.com/)

---

## 🔄 Updates & Maintenance

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update all packages
npm update

# Update specific package
npm install package-name@latest
```

### Backup

Regular backups of:
- Database
- Media files
- Configuration files
- Environment variables

---

## 💡 Tips & Best Practices

1. **Security:**
   - Never commit `.env` files
   - Use strong passwords
   - Keep dependencies updated
   - Enable HTTPS in production

2. **Development:**
   - Use consistent code formatting
   - Comment complex logic
   - Follow component structure
   - Test before committing

3. **Performance:**
   - Optimize images
   - Minimize bundle size
   - Use lazy loading
   - Implement caching

4. **User Experience:**
   - Test on different devices
   - Ensure accessibility
   - Optimize loading times
   - Handle errors gracefully

---

## 🆘 Getting Help

- Check error logs in browser console
- Review server logs in terminal
- Check `FEATURES.md` for feature documentation
- Check `ACCESS_CONTROL.md` for permission issues

---

**Setup Complete! 🎉**

Your E-Folio Pro is ready to use. Login as owner to start customizing your portfolio!

**Default Owner Login:**
- Email: `owner@efolio.com`
- Password: `owner123`

Access at: `http://localhost:5173`
