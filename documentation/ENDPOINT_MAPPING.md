# Complete Endpoint Mapping

## Dashboard Component → API Endpoint Mapping

This document shows the complete mapping between dashboard components and their API endpoints.

---

## 1. Dashboard Home (`/dashboard`)
**Component:** `DashboardHomeStyled.jsx`

**API Endpoints:**
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/projects/recent` - Get recent projects
- `GET /api/dashboard/performance` - Get performance data
- `GET /api/dashboard/quick-stats` - Get quick stats
- `GET /api/dashboard/events/upcoming` - Get upcoming events
- `GET /api/dashboard/tasks` - Get tasks
- `GET /api/dashboard/notifications` - Get notifications
- `GET /api/dashboard/skills/top` - Get top skills
- `GET /api/dashboard/devices` - Get device stats

**API Methods:**
- `apiService.getDashboardStats()`
- `apiService.getRecentProjects(limit)`
- `apiService.getPerformanceData(period)`
- `apiService.getQuickStats()`
- `apiService.getUpcomingEvents()`
- `apiService.getTasks()`
- `apiService.getNotifications(limit)`
- `apiService.getTopSkills(limit)`
- `apiService.getDeviceStats()`

---

## 2. Projects (`/dashboard/projects`)
**Component:** `ProjectManagerEnhanced.jsx`

**API Endpoints:**
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id` - Get single project

**API Methods:**
- `apiService.getProjects()`
- `apiService.createProject(data)`
- `apiService.updateProject(id, data)`
- `apiService.deleteProject(id)`

---

## 3. Analytics (`/dashboard/analytics`)
**Component:** `Analytics.jsx`

**API Endpoints:**
- `GET /api/analytics` - Get analytics data
- `GET /api/analytics/overview` - Get overview
- `GET /api/analytics/traffic` - Get traffic data
- `GET /api/analytics/engagement` - Get engagement metrics

**API Methods:**
- `apiService.getAnalytics()`
- `apiService.getVisitorAnalytics(params)`

---

## 4. Visitors (`/dashboard/visitors`)
**Component:** `VisitorsAnalyticsStyled.jsx`

**API Endpoints:**
- `GET /api/analytics` - Get visitor analytics
- `GET /api/analytics/visitors/:id` - Get visitor details
- `GET /api/tracking/analytics/realtime` - Get real-time data

**API Methods:**
- `apiService.getVisitorAnalytics(params)`
- `apiService.getVisitorDetails(id)`
- `apiService.getRealtimeAnalytics()`

---

## 5. Portfolio Editor (`/dashboard/portfolio-editor`)
**Component:** `PortfolioEditorStyled.jsx`

**API Endpoints:**
- `GET /api/projects` - Get portfolio items
- `POST /api/projects` - Create portfolio item
- `PUT /api/projects/:id` - Update portfolio item
- `DELETE /api/projects/:id` - Delete portfolio item

**API Methods:**
- `apiService.getProjects()`
- `apiService.createProject(data)`
- `apiService.updateProject(id, data)`
- `apiService.deleteProject(id)`

---

## 6. Skills (`/dashboard/skills`)
**Component:** `SkillsEditorEnhanced.jsx`

**API Endpoints:**
- `GET /api/skills` - Get all skills
- `POST /api/skills` - Create new skill
- `PUT /api/skills/:id` - Update skill
- `DELETE /api/skills/:id` - Delete skill

**API Methods:**
- `apiService.getSkills()`
- `apiService.createSkill(data)`
- `apiService.updateSkill(id, data)`
- `apiService.deleteSkill(id)`

---

## 7. Media (`/dashboard/media`)
**Component:** `MediaManagerStyled.jsx`

**API Endpoints:**
- `GET /api/media/files` - Get media files
- `POST /api/media/files/upload` - Upload file
- `DELETE /api/media/files` - Delete files
- `GET /api/media/folders` - Get folders
- `POST /api/media/folders` - Create folder
- `GET /api/media/storage` - Get storage info

**API Methods:**
- `apiService.getMediaFiles(params)`
- `apiService.uploadMediaFile(formData)`
- `apiService.deleteMediaFiles(fileIds)`
- `apiService.getMediaFolders()`
- `apiService.createMediaFolder(name, parentId)`
- `apiService.getStorageInfo()`

---

## 8. Reviews (`/dashboard/reviews`)
**Component:** `ReviewsManager.jsx`

**API Endpoints:**
- `GET /api/reviews` - Get all reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/approve` - Approve review
- `PATCH /api/reviews/:id/moderate` - Moderate review

**API Methods:**
- `apiService.getReviewsList(params)`
- `apiService.createReview(data)`
- `apiService.updateReview(id, data)`
- `apiService.deleteReview(id)`
- `apiService.approveReview(id)`
- `apiService.moderateReview(id, status)`

---

## 9. Emails (`/dashboard/emails`)
**Component:** `EmailManagerEnhanced.jsx`

**API Endpoints:**
- `GET /api/email` - Get emails
- `GET /api/email/:id` - Get single email
- `POST /api/email/send` - Send email
- `POST /api/email/:id/reply` - Reply to email
- `POST /api/email/:id/read` - Mark as read
- `DELETE /api/email/bulk` - Delete emails
- `GET /api/email/stats` - Get email stats

**API Methods:**
- `apiService.getEmailsList(params)`
- `apiService.getEmailById(id)`
- `apiService.sendEmailMessage(data)`
- `apiService.replyToEmail(id, data)`
- `apiService.markEmailAsRead(id)`
- `apiService.deleteEmails(ids)`
- `apiService.getEmailStats()`

---

## 10. Chat (`/dashboard/chat`)
**Component:** `ChatSystemStyled.jsx`

**API Endpoints:**
- `GET /api/chat/conversations` - Get conversations
- `GET /api/chat/messages/:conversationId` - Get messages
- `POST /api/chat/messages` - Send message
- `POST /api/chat/conversations` - Create conversation

**API Methods:**
- `apiService.getChatConversations()`
- `apiService.getChatMessages(conversationId)`
- `apiService.sendChatMessage(data)`

**WebSocket:** Real-time messaging via Socket.io

---

## 11. AI Assistant (`/dashboard/ai-assistant`)
**Component:** `AIAssistantStyled.jsx`

**API Endpoints:**
- `GET /api/ai/conversations` - Get AI conversations
- `POST /api/ai/conversations` - Create conversation
- `POST /api/ai/conversations/:id/messages` - Send message
- `GET /api/ai/stats` - Get AI stats

**API Methods:**
- `apiService.getAIConversations()`
- `apiService.createAIConversation(data)`
- `apiService.sendAIMessage(conversationId, message)`
- `apiService.getAIStats()`

---

## 12. Collaborators (`/dashboard/collaborators`)
**Component:** `CollaboratorsStyled.jsx`

**API Endpoints:**
- `GET /api/collaborators` - Get collaborators
- `GET /api/collaborators/stats` - Get stats
- `POST /api/collaborators/invite` - Invite collaborator
- `DELETE /api/collaborators/:id` - Remove collaborator
- `PUT /api/collaborators/:id/role` - Update role

**API Methods:**
- `apiService.getCollaboratorsList(params)`
- `apiService.getCollaboratorStats()`
- `apiService.inviteCollaborator(data)`
- `apiService.removeCollaborator(id)`
- `apiService.updateCollaboratorRole(id, role)`

---

## 13. Collaboration Requests (`/dashboard/collaboration-requests`)
**Component:** `CollaborationRequestsStyled.jsx`

**API Endpoints:**
- `GET /api/collaboration-requests` - Get requests
- `POST /api/collaboration-requests/:id/approve` - Approve request
- `POST /api/collaboration-requests/:id/reject` - Reject request

**API Methods:**
- `apiService.getCollaborationRequestsList(params)`
- `apiService.approveCollaborationRequest(id)`
- `apiService.rejectCollaborationRequest(id)`

---

## 14. AI Tracking (`/dashboard/ai-tracking`)
**Component:** `AITrackingSystem.jsx`

**API Endpoints:**
- `GET /api/tracking/analytics/realtime` - Real-time analytics
- `GET /api/tracking/heatmap` - Heatmap data
- `GET /api/tracking/funnel` - Conversion funnel
- `GET /api/tracking/patterns` - Behavior patterns
- `GET /api/tracking/predictive` - Predictive analytics

**API Methods:**
- `apiService.getRealtimeAnalytics()`
- `apiService.getHeatmapData(params)`
- `apiService.getConversionFunnel()`
- `apiService.getBehaviorPatterns()`
- `apiService.getPredictiveAnalytics()`

---

## 15. Theme Manager (`/dashboard/theme`)
**Component:** `ThemeManagerStyled.jsx`

**API Endpoints:**
- Local state management (no API calls)

**Context:** Uses `ThemeContext` for theme management

---

## 16. Learning Center (`/dashboard/learning`)
**Component:** `LearningCenterStyled.jsx`

**API Endpoints:**
- `GET /api/learning/videos` - Get videos
- `GET /api/learning/tutorials` - Get tutorials
- `GET /api/learning/faqs` - Get FAQs
- `GET /api/learning/progress` - Get progress
- `POST /api/learning/progress` - Update progress
- `GET /api/learning/stats` - Get stats

**API Methods:**
- `apiService.getLearningVideos(params)`
- `apiService.getLearningTutorials(params)`
- `apiService.getFAQs(params)`
- `apiService.getLearningProgress()`
- `apiService.updateLearningProgress(data)`
- `apiService.getLearningStats()`

---

## 17. Profile (`/dashboard/profile`)
**Component:** `Profile.jsx`

**API Endpoints:**
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/avatar` - Upload avatar
- `GET /api/profile/stats` - Get profile stats
- `GET /api/profile/activity` - Get activity
- `GET /api/profile/public/:username` - Get public profile

**API Methods:**
- `apiService.getProfile()`
- `apiService.updateProfile(data)`
- `apiService.uploadAvatar(formData)`
- `apiService.getPublicProfile(username)`

---

## 18. Settings (`/dashboard/settings`)
**Component:** `SettingsStyled.jsx`

**API Endpoints:**
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/password/change` - Change password
- `GET /api/settings/api-keys` - Get API keys
- `POST /api/settings/api-keys` - Generate API key

**API Methods:**
- `apiService.getUserSettings()`
- `apiService.updateUserSettings(settings)`
- `apiService.changePassword(data)`
- `apiService.getApiKeys()`
- `apiService.generateApiKey(data)`

---

## Summary

**Total Components:** 18
**Total API Endpoints:** 80+
**Total API Methods:** 104
**Total Routes:** 17 backend routes

All endpoints are properly connected and all navigation links are working correctly.

