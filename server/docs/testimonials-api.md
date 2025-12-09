# Testimonials API Documentation

## Overview
The Testimonials API provides endpoints for managing client testimonials and reviews. It supports both public and authenticated operations for submitting, viewing, and managing testimonials.

## Base URL
`/api/testimonials`

## Authentication
Most endpoints require authentication using a Bearer token in the Authorization header. Admin privileges are required for management operations.

## Endpoints

### Public Routes

#### Get All Public Testimonials
- **GET** `/api/public/testimonials`
- **Description**: Retrieve all visible testimonials
- **Query Parameters**:
  - `page` (default: 1): Page number for pagination
  - `limit` (default: 10): Number of items per page
  - `sort` (default: '-date'): Sort order (e.g., 'date', '-date', 'rating', 'name')
  - `rating`: Filter by specific rating (1-5)
  - `featured`: Filter by featured status (true/false)
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Response**: 
  ```json
  {
    "success": true,
    "count": 10,
    "total": 100,
    "page": 1,
    "pages": 10,
    "testimonials": [...]
  }
  ```

#### Get Featured Testimonials
- **GET** `/api/public/testimonials/featured`
- **Description**: Retrieve featured testimonials
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Response**:
  ```json
  {
    "success": true,
    "count": 5,
    "testimonials": [...]
  }
  ```

#### Get Public Statistics
- **GET** `/api/public/testimonials/stats`
- **Description**: Get public testimonial statistics
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Response**:
  ```json
  {
    "success": true,
    "stats": {
      "total": 150,
      "averageRating": 4.8,
      "featured": 25,
      "ratingDistribution": [
        { "_id": 5, "count": 120 },
        { "_id": 4, "count": 25 },
        { "_id": 3, "count": 5 }
      ]
    }
  }
  ```

#### Submit Testimonial
- **POST** `/api/public/testimonials/submit`
- **Description**: Submit a new testimonial (requires validation)
- **Rate Limiting**: 5 submissions per hour per IP
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "position": "Developer",
    "company": "Acme Inc",
    "rating": 5,
    "content": "Great experience working with this team!",
    "email": "john@example.com",
    "project": "E-commerce Platform",
    "tags": ["React", "Node.js"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Thank you! Your testimonial has been submitted and is pending approval.",
    "testimonial": {
      "_id": "...",
      "name": "John Doe"
    }
  }
  ```

#### Mark Testimonial as Helpful
- **POST** `/api/public/testimonials/:id/helpful`
- **Description**: Increment helpful count for a testimonial
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Response**:
  ```json
  {
    "success": true,
    "helpfulCount": 5
  }
  ```

### Admin Routes

#### Get All Testimonials
- **GET** `/api/testimonials`
- **Description**: Get all testimonials (admin only)
- **Authentication**: Requires admin role
- **Query Parameters**:
  - `page`, `limit`, `sort` (as above)
  - `search`: Search by name, content, company, or position
  - `visible`, `featured`, `verified`: Filter by boolean status
  - `rating`: Filter by specific rating
- **Response**: Same as public testimonials but includes all items

#### Get Testimonial Statistics
- **GET** `/api/testimonials/stats`
- **Description**: Get detailed testimonial statistics (admin only)
- **Authentication**: Requires admin role
- **Response**:
  ```json
  {
    "success": true,
    "stats": {
      "total": 150,
      "visible": 145,
      "featured": 25,
      "verified": 100,
      "averageRating": 4.75,
      "ratingDistribution": [...],
      "recentCount": 15,
      "topRatedTestimonials": [...],
      "recentSubmissions": [...]
    }
  }
  ```

#### Get Single Testimonial
- **GET** `/api/testimonials/:id`
- **Description**: Get a specific testimonial by ID (admin only)
- **Authentication**: Requires admin role
- **Response**:
  ```json
  {
    "success": true,
    "testimonial": { ... }
  }
  ```

#### Create Testimonial
- **POST** `/api/testimonials`
- **Description**: Create a new testimonial (admin only)
- **Authentication**: Requires admin role
- **Request Body**: Same as submit testimonial
- **Response**:
  ```json
  {
    "success": true,
    "message": "Testimonial created successfully",
    "testimonial": { ... }
  }
  ```

#### Update Testimonial
- **PUT** `/api/testimonials/:id`
- **Description**: Update an existing testimonial (admin only)
- **Authentication**: Requires admin role
- **Request Body**: Same as create
- **Response**:
  ```json
  {
    "success": true,
    "message": "Testimonial updated successfully",
    "testimonial": { ... }
  }
  ```

#### Delete Testimonial
- **DELETE** `/api/testimonials/:id`
- **Description**: Delete a testimonial (admin only)
- **Authentication**: Requires admin role
- **Response**:
  ```json
  {
    "success": true,
    "message": "Testimonial deleted successfully"
  }
  ```

#### Toggle Visibility
- **PATCH** `/api/testimonials/:id/toggle-visibility`
- **Description**: Toggle testimonial visibility (admin only)
- **Authentication**: Requires admin role
- **Response**:
  ```json
  {
    "success": true,
    "message": "Testimonial shown/hidden successfully",
    "testimonial": { ... }
  }
  ```

#### Toggle Featured Status
- **PATCH** `/api/testimonials/:id/toggle-featured`
- **Description**: Toggle featured status (admin only)
- **Authentication**: Requires admin role
- **Response**:
  ```json
  {
    "success": true,
    "message": "Testimonial featured/unfeatured successfully",
    "testimonial": { ... }
  }
  ```

#### Toggle Verified Status
- **PATCH** `/api/testimonials/:id/toggle-verified`
- **Description**: Toggle verified status (admin only)
- **Authentication**: Requires admin role
- **Response**:
  ```json
  {
    "success": true,
    "message": "Testimonial verified/unverified successfully",
    "testimonial": { ... }
  }
  ```

#### Update Display Order
- **PATCH** `/api/testimonials/:id/reorder`
- **Description**: Update testimonial display order (admin only)
- **Authentication**: Requires admin role
- **Request Body**:
  ```json
  {
    "displayOrder": 5
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Display order updated successfully",
    "testimonial": { ... }
  }
  ```

#### Bulk Delete Testimonials
- **POST** `/api/testimonials/bulk-delete`
- **Description**: Delete multiple testimonials at once (admin only)
- **Authentication**: Requires admin role
- **Request Body**:
  ```json
  {
    "ids": ["...", "...", "..."]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "X testimonial(s) deleted successfully",
    "deletedCount": X
  }
  ```

#### Bulk Update Testimonials
- **POST** `/api/testimonials/bulk-update`
- **Description**: Update multiple testimonials at once (admin only)
- **Authentication**: Requires admin role
- **Request Body**:
  ```json
  {
    "ids": ["...", "...", "..."],
    "updates": {
      "visible": true,
      "featured": false
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "X testimonial(s) updated successfully",
    "modifiedCount": X
  }
  ```

#### Export Testimonials as JSON
- **GET** `/api/testimonials/export/json`
- **Description**: Export all testimonials as JSON (admin only)
- **Authentication**: Requires admin role
- **Response**: JSON file with all testimonials

#### Export Testimonials as CSV
- **GET** `/api/testimonials/export/csv`
- **Description**: Export all testimonials as CSV (admin only)
- **Authentication**: Requires admin role
- **Response**: CSV file with selected testimonial fields

## Error Responses
All endpoints return a consistent error format:
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Validation Rules
When creating or updating testimonials, the following validation rules apply:
- Name: Required, max 100 characters
- Position: Required, max 100 characters
- Company: Optional, max 100 characters
- Email: Optional, must be valid email format
- Avatar: Optional, must be valid URL
- Website: Optional, must be valid URL
- LinkedIn: Optional, must be valid URL
- Rating: Required, integer between 1-5
- Content: Required, 10-1000 characters
- Project: Optional, max 200 characters
- Tags: Optional, must be array of strings

## Rate Limiting
- Public queries: 100 requests per 15 minutes per IP
- Testimonial submissions: 5 submissions per hour per IP
- API endpoints: Standard rate limiting as configured for the application