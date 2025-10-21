# E-Folio - Enhanced Portfolio Platform

A modern, feature-rich portfolio platform built with React and Vite, designed for developers who want more than just a static portfolio.

##  Features

###  Landing Page
- **Modern Design**: Cyber-themed UI with smooth animations
- **Collaboration Invitation**: Visitors can request collaboration access
- **Responsive Layout**: Works perfectly on all devices
- **Dynamic Content**: All sections are dynamically loaded

###  Authentication System
- **Multi-Role Access**: Owner, Collaborator, and Visitor roles
- **Protected Routes**: Dashboard access based on user permissions
- **Demo Credentials**: Easy testing with predefined accounts

###  Comprehensive Dashboard
- **Role-Based Navigation**: Different menu items based on user role
- **Collapsible Sidebar**: Clean, space-efficient design
- **Real-time Updates**: Live data and analytics

###  Project Management
- **CRUD Operations**: Add, edit, delete, and organize projects
- **Status Tracking**: In Development, Completed, On Hold, Planning
- **Category Filtering**: Web, Mobile, AI/ML, Desktop, Other
- **Technology Tags**: Visual representation of tech stack
- **Live Links**: Direct links to GitHub repos and live demos

###  Skills Editor
- **Technical Skills**: Progress bars with categories and icons
- **Professional Skills**: Radial progress indicators
- **Dynamic Editing**: Real-time updates with drag-and-drop
- **Skill Categories**: Frontend, Backend, Tools, Database
- **Custom Icons**: FontAwesome integration

###  Theme Management (Owner Only)
- **Predefined Themes**: 6 beautiful color schemes
- **Custom Theme Builder**: Create your own color palette
- **Live Preview**: See changes in real-time
- **Import/Export**: Save and share theme configurations
- **CSS Variables**: Seamless theme switching

###  Analytics Dashboard (Owner Only)
- **Visitor Tracking**: Total views, unique visitors, page views
- **Interactive Charts**: Visual data representation
- **Traffic Sources**: Referral tracking and analysis
- **Time Range Filters**: 7, 30, and 90-day views
- **Performance Metrics**: Engagement and conversion tracking

###  Collaboration Management (Owner Only)
- **Team Invitations**: Send collaboration invites via email
- **Permission Control**: Granular access management
- **Access Codes**: Secure collaboration links
- **Member Management**: Add, remove, and manage collaborators
- **Activity Tracking**: Monitor collaborator actions

### ⚙️ Settings & Preferences
- **Profile Management**: Update personal information
- **Privacy Controls**: Manage what information is public
- **Notification Settings**: Customize alert preferences
- **Account Management**: Data export and account controls

##  Access Levels

###  Owner
- Full access to all features
- Dashboard management
- Theme customization
- Analytics and reporting
- Collaborator management
- All CRUD operations

###  Collaborator
- Project management
- Skills editing
- Limited settings access
- Collaboration features
- Content creation

### Visitor
- View portfolio content
- Request collaboration
- Contact form access
- Public information only

##  Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
# Clone the repository
git clone <your-repo-url>
cd e-folio

# Install dependencies
npm install

# Start development server
npm run dev


### Demo Credentials
**Owner Access:**
- Email: `owner@efolio.com`
- Password: `owner123`

**Collaborator Access:**
- Use collaboration link: `/collaborate`
- Access Code: `COLLAB2024`

##  Tech Stack

- **Frontend**: React 19, Vite
- **Routing**: React Router DOM
- **Animations**: AOS (Animate On Scroll)
- **Icons**: FontAwesome
- **Styling**: CSS3 with CSS Variables
- **State Management**: React Context API

##  Project Structure


src/
├── components/
│   ├── dashboard/          # Dashboard components
│   │   ├── DashboardHome.jsx
│   │   ├── ProjectManager.jsx
│   │   ├── SkillsEditor.jsx
│   │   ├── ThemeManager.jsx
│   │   ├── Analytics.jsx
│   │   ├── Collaborators.jsx
│   │   └── Settings.jsx
│   └── ProtectedRoute.jsx  # Route protection
├── contexts/
│   └── AuthContext.jsx     # Authentication context
├── pages/
│   ├── LandingPage.jsx     # Main portfolio page
│   ├── Dashboard.jsx       # Dashboard layout
│   ├── LoginPage.jsx       # Authentication page
│   ├── About.jsx           # About section
│   ├── Skills.jsx          # Skills showcase
│   ├── Projects.jsx        # Projects display
│   ├── Contact.jsx         # Contact form
│   └── ...                 # Other sections
└── App.jsx                 # Main app component


##  Customization

### Adding New Themes
1. Open `ThemeManager.jsx`
2. Add new theme to `predefinedThemes` array
3. Define color palette in `preview` object

### Adding New Dashboard Features
1. Create component in `components/dashboard/`
2. Add route to `Dashboard.jsx`
3. Update navigation menu
4. Set appropriate role permissions

### Extending User Roles
1. Update `AuthContext.jsx`
2. Modify role checking functions
3. Update component access controls

##  Configuration

### Environment Variables
Create a `.env` file in the root directory:

VITE_APP_NAME=E-Folio
VITE_API_URL=your-api-url
VITE_ANALYTICS_ID=your-analytics-id


### Deployment

# Build for production
npm run build

# Preview production build
npm run preview


##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

##  License

This project is licensed under the MIT License - see the LICENSE file for details.

##  Acknowledgments

- FontAwesome for icons
- Unsplash for placeholder images
- AOS library for animations
- React community for excellent documentation

##  Support

For support, email devtechs842@gmail.com or create an issue on GitHub.

---

**Built with ❤️ by [Your Name]**

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
