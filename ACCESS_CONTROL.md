# E-Folio Pro - Access Control & Feature Matrix

## 🔐 User Roles

### 1. **Owner** (Full Access)
The portfolio owner has complete control over all aspects of the platform.

**Login Credentials:**
- Email: `owner@efolio.com`
- Password: `owner123`

### 2. **Collaborator** (Limited Access)
Team members with permission to contribute to specific areas.

**Access Method:**
- Route: `/collaborate`
- Access Code: `COLLAB2024`

### 3. **Visitor** (Public Access)
Anyone viewing the public portfolio without authentication.

---

## 📊 Feature Access Matrix

| Feature | Owner | Collaborator | Visitor |
|---------|-------|--------------|---------|
| **Dashboard Overview** | ✅ | ✅ | ❌ |
| **Project Management** | ✅ | ✅ | ❌ |
| **Skills Editor** | ✅ | ❌ | ❌ |
| **Theme Management** | ✅ | ❌ | ❌ |
| **Analytics Dashboard** | ✅ | ❌ | ❌ |
| **Visitor Analytics** | ✅ | ❌ | ❌ |
| **Media Manager** | ✅ | ❌ | ❌ |
| **Email Manager** | ✅ | ❌ | ❌ |
| **Collaborator Management** | ✅ | ❌ | ❌ |
| **Portfolio Editor** | ✅ | ❌ | ❌ |
| **Real-Time Chat** | ✅ | ✅ | ❌ |
| **AI Assistant** | ✅ | ✅ | ❌ |
| **Settings** | ✅ | ✅ (Limited) | ❌ |
| **View Public Portfolio** | ✅ | ✅ | ✅ |
| **Contact Form** | ✅ | ✅ | ✅ |
| **Collaboration Request** | ❌ | ❌ | ✅ |

---

## 🎯 Owner-Exclusive Features

### 1. **Skills Editor** (`/dashboard/skills`)
- **Why Owner-Only:** Skills represent the owner's personal expertise and should only be managed by them
- **Features:**
  - Add/Edit/Delete skills
  - Organize by categories (Technical, Professional)
  - Set proficiency levels
  - Reorder skills with drag-and-drop

### 2. **Theme Management** (`/dashboard/theme`)
- **Why Owner-Only:** Controls the entire look and feel of the portfolio
- **Features:**
  - 8+ pre-built themes
  - Custom color schemes
  - Font customization
  - Layout preferences
  - Animation settings

### 3. **Analytics Dashboard** (`/dashboard/analytics`)
- **Why Owner-Only:** Contains sensitive business metrics
- **Features:**
  - Total views and visitors
  - Project engagement metrics
  - Contact form submissions
  - Traffic sources
  - Time-based trends

### 4. **Visitor Analytics** (`/dashboard/visitors`)
- **Why Owner-Only:** Detailed visitor tracking and behavior analysis
- **Features:**
  - Geographic distribution
  - Device and browser stats
  - Top pages analysis
  - Session duration tracking
  - Real-time visitor feed
  - Bounce rate analysis

### 5. **Media Manager** (`/dashboard/media`)
- **Why Owner-Only:** Controls all portfolio assets and storage
- **Features:**
  - Upload images, videos, documents
  - Organize in folders
  - View/Download/Delete media
  - Storage usage tracking
  - Usage tracking (where media is used)
  - Grid and list views
  - Bulk operations

### 6. **Email Manager** (`/dashboard/emails`)
- **Why Owner-Only:** Personal correspondence and inquiries
- **Features:**
  - Inbox, Sent, Starred, Archived
  - Compose new emails
  - Reply and forward
  - Attachment handling
  - Email search
  - Star important messages
  - Storage management

### 7. **Collaborator Management** (`/dashboard/collaborators`)
- **Why Owner-Only:** Controls who has access to the dashboard
- **Features:**
  - Send invitations
  - Revoke access
  - Manage permissions
  - Track activity
  - View online status
  - Generate access codes

### 8. **Portfolio Editor** (`/dashboard/portfolio-editor`)
- **Why Owner-Only:** Complete control over portfolio structure
- **Features:**
  - Visual, Code, and Preview modes
  - Add/Remove/Reorder sections
  - Responsive preview (Desktop/Tablet/Mobile)
  - Undo/Redo functionality
  - Import/Export portfolio structure
  - Custom section settings

---

## 🤝 Collaborator Features

### 1. **Project Management** (`/dashboard/projects`)
- **Permissions:** Can add, edit, and organize projects
- **Purpose:** Help maintain the project portfolio
- **Limitations:** Cannot delete owner's projects without approval

### 2. **Real-Time Chat** (`/dashboard/chat`)
- **Permissions:** Full chat access in all rooms
- **Purpose:** Team communication and collaboration
- **Features:**
  - Send messages in all rooms
  - See online users
  - Typing indicators
  - Message history

### 3. **AI Assistant** (`/dashboard/ai-assistant`)
- **Permissions:** Full access to AI features
- **Purpose:** Get help with content and coding
- **Features:**
  - Code review
  - Content generation
  - Skill recommendations
  - Portfolio analysis

### 4. **Settings** (`/dashboard/settings`)
- **Permissions:** Limited to personal settings only
- **Purpose:** Manage own profile and preferences
- **Limitations:** Cannot change owner's settings or global configurations

---

## 🚫 Access Control Implementation

### Backend Protection
```javascript
// Server-side authentication
socket.on('authenticate', (userData) => {
    if (userData.role !== 'owner' && sensitiveAction) {
        return socket.emit('error', { message: 'Access denied' });
    }
});
```

### Frontend Protection
```javascript
// Component-level access control
if (!isOwner()) {
    return (
        <div className="access-denied">
            <h2>Access Restricted</h2>
            <p>This feature is only available to the owner.</p>
        </div>
    );
}
```

### Route Protection
```javascript
// Dashboard menu filtering
const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
);
```

---

## 🔒 Security Best Practices

### 1. **Authentication**
- Secure password hashing with Bcrypt
- Session management with JWT tokens
- Automatic logout after inactivity

### 2. **Authorization**
- Role-based access control (RBAC)
- Permission checking on every request
- Frontend and backend validation

### 3. **Data Protection**
- HTTPS encryption
- Secure cookie handling
- XSS protection
- CORS configuration

### 4. **API Security**
- Rate limiting
- Input validation
- Error handling
- Helmet.js security headers

---

## 📝 Permission Levels

### Owner Permissions
```javascript
{
    editProjects: true,
    editSkills: true,
    editThemes: true,
    viewAnalytics: true,
    manageCollaborators: true,
    manageMedia: true,
    viewEmails: true,
    editPortfolio: true
}
```

### Collaborator Permissions
```javascript
{
    editProjects: true,
    editSkills: false,
    editThemes: false,
    viewAnalytics: false,
    manageCollaborators: false,
    manageMedia: false,
    viewEmails: false,
    editPortfolio: false
}
```

---

## 🎨 Dashboard Layout

### Owner Dashboard Sections

**1. Portfolio Management**
- Skills Editor
- Portfolio Editor
- Media Manager

**2. Analytics & Insights**
- Analytics Dashboard
- Visitor Analytics

**3. Communication**
- Email Manager
- Real-Time Chat

**4. Team Management**
- Collaborator Management
- Access Control

**5. Configuration**
- Theme Manager
- Settings

### Collaborator Dashboard Sections

**1. Content Management**
- Projects

**2. Collaboration Tools**
- Chat System
- AI Assistant

**3. Personal**
- Settings (Limited)

---

## 🚀 Quick Start Guide

### For Owners

1. **Login** with owner credentials
2. **Configure Your Portfolio**
   - Edit skills in Skills Editor
   - Choose a theme in Theme Manager
   - Upload media in Media Manager
3. **Manage Content**
   - Add projects
   - Structure your portfolio with Portfolio Editor
4. **Invite Collaborators**
   - Send invitations from Collaborators page
   - Set permissions
5. **Monitor Performance**
   - Check Analytics
   - Review Visitor Analytics
   - Respond to emails

### For Collaborators

1. **Access Collaboration Route** (`/collaborate`)
2. **Enter Access Code** (`COLLAB2024`)
3. **Manage Projects**
   - Add and edit project entries
4. **Communicate**
   - Use chat for team communication
   - Get help from AI Assistant
5. **Update Profile**
   - Configure personal settings

---

## 📞 Support & Questions

For access control issues or questions:
- Review this document
- Check the console for error messages
- Contact the owner for permission changes
- Refer to FEATURES.md for detailed feature documentation

---

**Last Updated:** January 2024  
**Version:** 2.0.0
