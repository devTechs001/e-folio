# E-Folio Pro - Server Documentation

## 🚀 Server Overview

Real-time Node.js server with Socket.io for E-Folio Pro portfolio platform.

### Features
- ✅ Real-time communication with Socket.io
- ✅ RESTful API endpoints
- ✅ Authentication system
- ✅ Collaboration management
- ✅ Analytics tracking
- ✅ Chat system
- ✅ MongoDB integration (optional)
- ✅ Security with Helmet
- ✅ CORS configuration

---

## 📦 Installation

```bash
cd server
npm install
```

### Dependencies
- **express** - Web framework
- **socket.io** - Real-time communication
- **mongoose** - MongoDB ODM
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **bcrypt** - Password hashing
- **dotenv** - Environment variables

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file (see `.env.example`):

```env
# Server
PORT=5000
NODE_ENV=development

# Client
CLIENT_URL=http://localhost:5173

# Owner Credentials
OWNER_EMAIL=devtechs842@gmail.com
OWNER_PASSWORD=pass1234

# Database (Optional)
MONGODB_URI=mongodb://localhost:27017/e-folio

# JWT
JWT_SECRET=your_secret_key

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🏃 Running the Server

### Development Mode
```bash
npm start
```

### With Nodemon (auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
NODE_ENV=production npm start
```

Server will run on: `http://localhost:5000`

---

## 🔌 API Endpoints

### Health Check
**GET** `/health`

Response:
```json
{
  "status": "ok",
  "message": "E-Folio Pro Server Running",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "version": "2.0.0",
  "uptime": 1234.56
}
```

### Authentication

**POST** `/api/auth/login`

Request:
```json
{
  "email": "devtechs842@gmail.com",
  "password": "pass1234"
}
```

Success Response (200):
```json
{
  "success": true,
  "user": {
    "id": "owner-001",
    "name": "Portfolio Owner",
    "email": "devtechs842@gmail.com",
    "role": "owner"
  },
  "message": "Login successful"
}
```

Error Response (401):
```json
{
  "success": false,
  "message": "Invalid credentials. Access denied."
}
```

### Analytics

**GET** `/api/analytics`

Response:
```json
{
  "totalViews": 8523,
  "uniqueVisitors": 4234,
  "onlineUsers": 5,
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### Collaboration Requests

**GET** `/api/collaboration-requests`

Response:
```json
{
  "requests": [],
  "count": 0
}
```

**POST** `/api/collaboration-requests`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Full Stack Developer",
  "message": "I would like to collaborate...",
  "skills": ["React", "Node.js"],
  "portfolio": "https://johndoe.com",
  "github": "github.com/johndoe",
  "linkedin": "linkedin.com/in/johndoe"
}
```

Success Response (200):
```json
{
  "success": true,
  "message": "Collaboration request submitted successfully",
  "requestId": 1705746600000
}
```

Error Response (400):
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

**POST** `/api/collaboration/generate-invite`

Request:
```json
{
  "requestId": 1705746600000
}
```

Response:
```json
{
  "success": true,
  "inviteCode": "INVITE-1705746600000-ABC123XYZ",
  "inviteLink": "http://localhost:5173/collaborate?invite=INVITE-1705746600000-ABC123XYZ"
}
```

---

## 🔌 Socket.io Events

### Client → Server

#### Authenticate User
```javascript
socket.emit('authenticate', {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'collaborator'
});
```

#### Send Chat Message
```javascript
socket.emit('send_message', {
  roomId: 'general',
  message: 'Hello team!'
});
```

#### Join Chat Room
```javascript
socket.emit('join_room', 'general');
```

#### Leave Chat Room
```javascript
socket.emit('leave_room', 'general');
```

#### Start Typing
```javascript
socket.emit('typing_start', 'general');
```

#### Stop Typing
```javascript
socket.emit('typing_stop', 'general');
```

### Server → Client

#### User Joined
```javascript
socket.on('user_joined', (data) => {
  console.log('User joined:', data.user);
});
```

#### User Left
```javascript
socket.on('user_left', (data) => {
  console.log('User left:', data.userId);
});
```

#### Online Users List
```javascript
socket.on('online_users', (users) => {
  console.log('Online users:', users);
});
```

#### New Chat Message
```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message);
  // message = {
  //   id: 1705746600000,
  //   user: 'John Doe',
  //   message: 'Hello team!',
  //   timestamp: '2024-01-20T10:30:00.000Z',
  //   roomId: 'general'
  // }
});
```

#### User Typing
```javascript
socket.on('user_typing', (data) => {
  console.log(`${data.userName} is typing...`);
});
```

#### User Stop Typing
```javascript
socket.on('user_stop_typing', (data) => {
  console.log(`${data.userId} stopped typing`);
});
```

---

## 💾 Data Storage

### In-Memory Storage (Current)
- **Active Users**: Map of connected Socket.io users
- **Chat Rooms**: Map of chat rooms with messages
- **Collaboration Sessions**: Map of active collaboration sessions

### MongoDB Integration (Optional)

When `MONGODB_URI` is provided:
- User sessions persist across restarts
- Chat history is saved
- Collaboration requests are stored
- Analytics data is tracked

---

## 🔐 Security Features

### Helmet.js
- Sets security HTTP headers
- Prevents common vulnerabilities
- XSS protection
- Clickjacking protection

### CORS
- Configured for specific client origin
- Credentials support enabled
- Methods: GET, POST
- Restricted to CLIENT_URL

### Authentication
- Owner email validation
- Password verification
- JWT token ready (infrastructure in place)
- Session management

### Rate Limiting (Ready to implement)
```javascript
// Add to server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 🧪 Testing

### Test Health Endpoint
```bash
curl http://localhost:5000/health
```

### Test Authentication
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"devtechs842@gmail.com","password":"pass1234"}'
```

### Test Analytics
```bash
curl http://localhost:5000/api/analytics
```

### Test Socket.io Connection
```javascript
// Client-side test
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  socket.emit('authenticate', {
    name: 'Test User',
    email: 'test@example.com'
  });
});

socket.on('online_users', (users) => {
  console.log('👥 Online users:', users);
});
```

---

## 📊 Monitoring

### Console Logs
- `🚀 E-Folio Server running on port 5000`
- `📡 Socket.io ready for connections`
- `✅ MongoDB Connected` (if configured)
- `⚠️ MongoDB URI not provided, running without database`
- `🔌 User connected: <socket-id>`
- `👤 User authenticated: <name>`
- `💬 Message in <room>: <message>`
- `🔌 User disconnected: <socket-id>`

---

## 🔄 Deployment

### Heroku
```bash
# Install Heroku CLI
heroku login

# Create app
heroku create efolio-server

# Set environment variables
heroku config:set PORT=5000
heroku config:set CLIENT_URL=https://your-frontend.com
heroku config:set OWNER_EMAIL=devtechs842@gmail.com
heroku config:set OWNER_PASSWORD=pass1234
heroku config:set MONGODB_URI=your_mongodb_uri

# Deploy
git push heroku main
```

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

### DigitalOcean / VPS
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone and setup
git clone <repo>
cd server
npm install

# Start with PM2
pm2 start server.js --name efolio-server
pm2 save
pm2 startup
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Error
- Check if MongoDB is running
- Verify MONGODB_URI in .env
- Server works without MongoDB (optional)

### CORS Error
- Verify CLIENT_URL matches frontend URL
- Check CORS configuration in server.js
- Ensure credentials: true on both client and server

### Socket.io Not Connecting
- Check firewall settings
- Verify port 5000 is open
- Check CLIENT_URL in .env
- Test with curl or Postman first

---

## 📝 API Response Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **500** - Server Error

---

## 🔗 Related Documentation

- [Socket.io Docs](https://socket.io/docs/v4/)
- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [Helmet.js Docs](https://helmetjs.github.io/)

---

## 📞 Support

For issues or questions:
- Check server logs in terminal
- Verify .env configuration
- Test endpoints with curl/Postman
- Check browser console for Socket.io errors

---

**Version:** 2.0.0  
**Last Updated:** January 2024
