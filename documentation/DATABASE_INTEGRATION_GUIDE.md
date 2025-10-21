# Complete Database Integration Guide 🗄️

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server
pnpm install
```

**Installed packages:**
- ✅ bcryptjs (password hashing)
- ✅ jsonwebtoken (authentication)
- ✅ mongoose (MongoDB ODM)
- ✅ express (server framework)
- ✅ socket.io (real-time features)
- ✅ cors, helmet, dotenv

---

## 📋 Setup Instructions

### Step 1: Configure Environment Variables
Edit `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL
CLIENT_URL=http://localhost:5173
APP_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/efolio
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/efolio

# Authentication
JWT_SECRET=your_super_secret_key_change_this_in_production
OWNER_EMAIL=admin@example.com
OWNER_PASSWORD=your_secure_password
OWNER_NAME=Portfolio Owner

# Optional
SESSION_SECRET=another_secret_key
```

### Step 2: Install MongoDB

**Option A: Local MongoDB**
```bash
# Windows (using Chocolatey)
choco install mongodb

# Or download from:
https://www.mongodb.com/try/download/community
```

**Option B: MongoDB Atlas (Cloud)**
1. Visit https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update MONGODB_URI in .env

### Step 3: Start the Server
```bash
cd server
pnpm run dev
```

Expected output:
```
🚀 ===================================
✅ E-Folio Server Running
📡 Port: 5000
🌐 Client URL: http://localhost:5173
💾 Database: Connected
🔌 Socket.io: Ready
=====================================
```

---

## 🔄 Making Features Functional

### Skills Management

**Update SkillsEditor to use API:**

```javascript
import ApiService from '../../services/api.service';

const SkillsEditor = () => {
    const [skills, setSkills] = useState([]);

    // Load skills from database
    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        try {
            const response = await ApiService.getSkills();
            setSkills(response.skills);
        } catch (error) {
            console.error('Error loading skills:', error);
        }
    };

    const handleAddSkill = async () => {
        try {
            const response = await ApiService.addSkill(newSkill);
            setSkills([...skills, response.skill]);
            success('Skill added!');
        } catch (error) {
            error('Failed to add skill');
        }
    };

    const handleUpdateSkill = async (id, updates) => {
        try {
            await ApiService.updateSkill(id, updates);
            loadSkills(); // Refresh
            success('Skill updated!');
        } catch (error) {
            error('Failed to update skill');
        }
    };

    const handleDeleteSkill = async (id) => {
        try {
            await ApiService.deleteSkill(id);
            setSkills(skills.filter(s => s.id !== id));
            success('Skill deleted!');
        } catch (error) {
            error('Failed to delete skill');
        }
    };
};
```

### Projects Management

**Update ProjectManager to use API:**

```javascript
import ApiService from '../../services/api.service';

const ProjectManager = () => {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        const response = await ApiService.getProjects();
        setProjects(response.projects);
    };

    const handleCreateProject = async (projectData) => {
        const response = await ApiService.createProject(projectData);
        setProjects([...projects, response.project]);
    };

    const handleUpdateProject = async (id, updates) => {
        await ApiService.updateProject(id, updates);
        loadProjects();
    };

    const handleDeleteProject = async (id) => {
        await ApiService.deleteProject(id);
        setProjects(projects.filter(p => p.id !== id));
    };
};
```

### Real-time Chat

**Update ChatSystem to use Socket.io:**

```javascript
import SocketService from '../../services/socket.service';
import { useAuth } from '../../contexts/AuthContext';

const ChatSystem = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);

    useEffect(() => {
        // Connect to socket
        SocketService.connect({
            name: user.name,
            email: user.email,
            role: user.role
        });

        // Join default room
        SocketService.joinRoom('general');

        // Listen for messages
        SocketService.on('new_message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        // Listen for active users
        SocketService.on('active_users', (users) => {
            setActiveUsers(users);
        });

        // Listen for room history
        SocketService.on('room_history', (history) => {
            setMessages(history);
        });

        return () => {
            SocketService.disconnect();
        };
    }, []);

    const sendMessage = (text) => {
        SocketService.sendMessage('general', text);
    };
};
```

### Analytics Tracking

**Update Analytics to fetch real data:**

```javascript
import ApiService from '../../services/api.service';

const Analytics = () => {
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        const response = await ApiService.getAnalytics();
        setAnalytics(response.analytics);
    };

    // Track visitor (call this on landing page)
    const trackVisitor = async () => {
        await ApiService.trackVisitor({
            page: window.location.pathname,
            country: 'US', // Use IP geolocation API
            device: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            browser: navigator.userAgent,
            ip: 'auto' // Server can detect this
        });
    };
};
```

### Authentication

**Update LoginPage to use API:**

```javascript
import ApiService from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            const response = await ApiService.login(email, password);
            
            // Save token
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            // Update auth context
            login(response.user);
            
            // Redirect to dashboard
            navigate('/dashboard');
        } catch (error) {
            setError('Invalid credentials');
        }
    };
};
```

---

## 🔐 Authentication Flow

### 1. User Login
```javascript
// Frontend
const response = await ApiService.login(email, password);
localStorage.setItem('token', response.token);

// Backend validates and returns JWT
```

### 2. Protected Requests
```javascript
// API service automatically includes token in headers
getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}
```

### 3. Token Verification
```javascript
// Verify token on app load
useEffect(() => {
    const verifyAuth = async () => {
        try {
            const response = await ApiService.verifyToken();
            setUser(response.user);
        } catch (error) {
            logout();
        }
    };
    verifyAuth();
}, []);
```

---

## 📊 Database Models

### Skills Collection
```javascript
{
    _id: ObjectId,
    name: "React",
    level: 90,
    category: "Frontend",
    type: "technical",
    color: "#61dafb",
    icon: "fa-brands fa-react",
    userId: ObjectId,
    createdAt: Date,
    updatedAt: Date
}
```

### Projects Collection
```javascript
{
    _id: ObjectId,
    title: "E-Portfolio",
    description: "Modern portfolio website",
    technologies: ["React", "Node.js"],
    status: "completed",
    category: "Web",
    links: {
        github: "...",
        live: "..."
    },
    userId: ObjectId,
    collaborators: [ObjectId],
    createdAt: Date,
    updatedAt: Date
}
```

### Users Collection
```javascript
{
    _id: ObjectId,
    name: "John Doe",
    email: "john@example.com",
    password: "hashed_password",
    role: "owner",
    status: "active",
    avatar: "url",
    joinedAt: Date,
    lastLogin: Date
}
```

### Invites Collection
```javascript
{
    _id: ObjectId,
    token: "unique_token",
    email: "collaborator@example.com",
    name: "Collaborator Name",
    role: "collaborator",
    status: "pending",
    invitedBy: ObjectId,
    expiresAt: Date,
    createdAt: Date
}
```

---

## 🧪 Testing API Endpoints

### Using Thunder Client / Postman

**1. Login**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": "admin@example.com",
    "password": "your_password"
}
```

**2. Get Skills**
```http
GET http://localhost:5000/api/skills
Authorization: Bearer YOUR_JWT_TOKEN
```

**3. Add Skill**
```http
POST http://localhost:5000/api/skills
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
    "name": "React",
    "level": 90,
    "category": "Frontend",
    "type": "technical",
    "color": "#61dafb"
}
```

**4. Get Projects**
```http
GET http://localhost:5000/api/projects
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔄 Complete Integration Checklist

### Backend ✅
- [x] Server dependencies installed
- [x] Environment variables configured
- [x] MongoDB connection working
- [x] API routes created
- [x] Socket.io handlers ready
- [x] Models defined

### Frontend Integration 🔄
- [x] ApiService created
- [x] SocketService created
- [ ] Update SkillsEditor to use API
- [ ] Update ProjectManager to use API
- [ ] Update ChatSystem to use Socket.io
- [ ] Update Analytics to fetch real data
- [ ] Update LoginPage to use API
- [ ] Add token verification on app load

### Features to Make Functional
1. **Skills Management**
   - Fetch from database
   - Add/Update/Delete operations
   - Real-time sync

2. **Projects Management**
   - CRUD operations with database
   - Image upload
   - Collaborator management

3. **Chat System**
   - Real-time messaging
   - Multiple rooms
   - Online status

4. **Analytics**
   - Track visitors
   - Store in database
   - Display real metrics

5. **Collaboration**
   - Send requests to database
   - Email notifications
   - Invite link generation

---

## 📝 Environment Setup for Production

```env
# Production settings
NODE_ENV=production
PORT=5000

# Use strong secrets
JWT_SECRET=generate_a_very_strong_random_key_here
SESSION_SECRET=another_strong_random_key

# MongoDB Atlas connection
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/efolio?retryWrites=true&w=majority

# Production URLs
CLIENT_URL=https://your-domain.com
APP_URL=https://your-domain.com
```

---

## 🚨 Common Issues & Solutions

### Issue: Cannot connect to MongoDB
**Solution:**
1. Check if MongoDB is running: `net start MongoDB`
2. Or use MongoDB Atlas (cloud)
3. Verify MONGODB_URI in .env

### Issue: bcryptjs not found
**Solution:**
```bash
cd server
pnpm install bcryptjs jsonwebtoken
```

### Issue: CORS errors
**Solution:**
Update server cors config:
```javascript
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
```

### Issue: Socket.io not connecting
**Solution:**
1. Check server is running on correct port
2. Verify SOCKET_URL in frontend
3. Check firewall settings

---

## 🎯 Next Steps

1. **Start MongoDB** (local or Atlas)
2. **Update .env** with your credentials
3. **Run server**: `cd server && pnpm run dev`
4. **Test endpoints** using Thunder Client
5. **Update components** to use ApiService
6. **Test real-time features** with SocketService
7. **Deploy to production** when ready

---

## 📚 Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [JWT Best Practices](https://jwt.io/introduction)

---

**Status:** ✅ Server configured and ready for database integration
**Next:** Update frontend components to use API/Socket services

