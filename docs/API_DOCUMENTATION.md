# Emirati Pathways API Documentation

**Version:** 2.0.0  
**Base URL:** `http://localhost:5005/api`  
**Last Updated:** December 27, 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Candidate APIs](#candidate-apis)
3. [Recruiter APIs](#recruiter-apis)
4. [HR Manager APIs](#hr-manager-apis)
5. [Growth Operator APIs](#growth-operator-apis)
6. [Administrator APIs](#administrator-apis)
7. [Communication APIs](#communication-apis)
8. [Interview APIs](#interview-apis)
9. [Error Handling](#error-handling)

---

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "candidate"
  }
}
```

### Register

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password",
  "first_name": "Ahmed",
  "last_name": "Al Maktoum",
  "role": "candidate"
}
```

---

## Candidate APIs

### Get Job Matches

Returns job recommendations based on candidate profile.

```http
GET /api/candidate/job-matches
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | integer | Optional. Candidate user ID |
| `cv_id` | integer | Optional. CV ID for skill matching |

**Response:**
```json
{
  "success": true,
  "jobs": [
    {
      "id": 1,
      "title": "Software Engineer",
      "company": "Emirates NBD",
      "location": "Dubai, UAE",
      "type": "full-time",
      "salary": "AED 18,000 - 25,000",
      "matchScore": 92,
      "description": "Join our digital transformation team...",
      "requirements": ["Python", "JavaScript", "React"],
      "benefits": ["Health Insurance", "Annual Leave"],
      "postedDate": "2025-01-15T10:00:00Z"
    }
  ],
  "count": 5
}
```

### Get Saved Jobs

```http
GET /api/candidate/saved-jobs
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Software Engineer",
      "company": "Tech Corp",
      "location": "Dubai",
      "saved_at": "2025-01-20"
    }
  ]
}
```

### Get Applications

```http
GET /api/candidate/applications
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "job_title": "Software Engineer",
      "company": "Tech Corp",
      "status": "interview_scheduled",
      "applied_at": "2025-01-15"
    }
  ]
}
```

### CV Management

#### Save CV

```http
POST /api/cv/save
```

**Request Body:**
```json
{
  "personalInfo": {
    "fullName": "Ahmed Al Maktoum",
    "email": "ahmed@example.com",
    "phone": "+971501234567"
  },
  "experience": [...],
  "education": [...],
  "skills": [...]
}
```

#### Export CV to PDF

```http
GET /api/cv/{cv_id}/export/pdf
```

---

## Recruiter APIs

### Job Descriptions

#### Get JD Templates

```http
GET /api/jd/templates
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Software Engineer",
      "category": "Technology",
      "description": "Standard template for software engineering roles",
      "sections": ["Overview", "Responsibilities", "Requirements", "Benefits"]
    }
  ]
}
```

#### Create Job Description

```http
POST /api/recruiter/jd
```

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "company": "Tech Innovations LLC",
  "description": "Looking for an experienced software engineer...",
  "requirements": ["Python", "JavaScript", "AWS"],
  "location": "Dubai",
  "salary_range": "AED 25,000 - 35,000"
}
```

#### Get JD List

```http
GET /api/recruiter/jd
```

#### AI Match Candidates

```http
POST /api/recruiter/jd/{jd_id}/match
```

**Request Body:**
```json
{
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "candidate_id": 1,
        "name": "Ahmed Al Maktoum",
        "match_score": 92,
        "skills_match": ["Python", "JavaScript"],
        "experience_years": 5
      }
    ]
  }
}
```

### Shortlist Management

#### Get Shortlist

```http
GET /api/recruiter/shortlist
```

#### Add to Shortlist

```http
POST /api/recruiter/shortlist/add
```

**Request Body:**
```json
{
  "candidate_id": 1,
  "jd_id": 1,
  "notes": "Strong technical skills"
}
```

### Dashboard

#### Get Dashboard Overview

```http
GET /api/recruiter/dashboard/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "active_jobs": 5,
    "total_applications": 150,
    "interviews_scheduled": 12,
    "offers_pending": 3,
    "recent_activity": [...]
  }
}
```

#### Get Active Vacancies

```http
GET /api/recruiter/dashboard/vacancies
```

#### Get Offers

```http
GET /api/recruiter/dashboard/offers
```

#### Create Offer

```http
POST /api/recruiter/offers/create
```

**Request Body:**
```json
{
  "candidate_id": 1,
  "job_id": 1,
  "salary": 30000,
  "start_date": "2025-02-01",
  "benefits": ["Health Insurance", "Annual Leave"]
}
```

---

## HR Manager APIs

### Dashboard

#### Get HR Dashboard

```http
GET /api/hr/dashboard
```

#### Get Shortlisted Candidates

```http
GET /api/hr/dashboard/shortlisted
```

#### Get Team Members

```http
GET /api/hr/dashboard/team
```

#### Search Candidates

```http
GET /api/hr/dashboard/candidates/search
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search term |
| `skills` | string | Comma-separated skills |
| `experience_min` | integer | Minimum years of experience |

### Approval Workflows

#### Get Approval Workflows

```http
GET /api/hr/approval-workflows
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "offer_approval",
      "status": "pending",
      "candidate_name": "Ahmed Al Maktoum",
      "position": "Software Engineer",
      "requested_by": "Recruiter Name",
      "created_at": "2025-01-20T10:00:00Z"
    }
  ]
}
```

#### Delegate Approval

```http
POST /api/hr/approval-workflows/delegate
```

**Request Body:**
```json
{
  "workflow_id": 1,
  "delegate_to": 2,
  "reason": "Out of office for training"
}
```

---

## Growth Operator APIs

### Domain Metrics

#### Get All Domain Metrics

```http
GET /api/growth-operator/metrics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "candidate": {
      "total": 1250,
      "active": 890,
      "new_this_month": 45,
      "growth_rate": 12.5
    },
    "company": {
      "total": 320,
      "active": 280,
      "new_this_month": 15,
      "growth_rate": 8.3
    },
    "education": {...},
    "assessment": {...},
    "mentorship": {...},
    "community": {...}
  }
}
```

### Domain-Specific Operations

#### Candidate Operations

```http
GET /api/growth-operator/candidate/list
```

#### Company Operations

```http
GET /api/growth-operator/company/list
```

#### Education Operations

```http
GET /api/growth-operator/education/programs
```

#### Assessment Operations

```http
GET /api/growth-operator/assessment/list
```

#### Mentorship Operations

```http
GET /api/growth-operator/mentorship/matches
```

#### Community Operations

```http
GET /api/growth-operator/community/stats
```

---

## Administrator APIs

### Dashboard

#### Get Dashboard Stats

```http
GET /api/admin/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 5000,
      "active": 4200,
      "new_today": 25
    },
    "content": {
      "jobs": 450,
      "cvs": 3200,
      "applications": 8500
    },
    "system_health": {
      "status": "healthy",
      "uptime": "99.9%"
    }
  }
}
```

#### Get System Alerts

```http
GET /api/admin/alerts
```

#### Get Recent Activity

```http
GET /api/admin/activity/recent
```

### User Management

#### List Users

```http
GET /api/admin/users
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `per_page` | integer | Items per page (default: 20) |
| `role` | string | Filter by role |
| `status` | string | Filter by status (active/suspended) |

#### Get User Details

```http
GET /api/admin/users/{user_id}
```

#### Create User

```http
POST /api/admin/users
```

#### Update User

```http
PUT /api/admin/users/{user_id}
```

#### Activate User

```http
POST /api/admin/users/{user_id}/activate
```

#### Suspend User

```http
POST /api/admin/users/{user_id}/suspend
```

#### Get User Statistics

```http
GET /api/admin/users/statistics
```

### Role Management

#### List Roles

```http
GET /api/admin/roles
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "candidate",
      "name": "Candidate",
      "description": "Job seekers using the platform",
      "permissions": ["view_jobs", "apply_jobs", "manage_cv"]
    },
    {
      "id": "recruiter",
      "name": "Recruiter",
      "description": "Company recruiters posting jobs",
      "permissions": ["create_jobs", "view_candidates", "manage_shortlist"]
    }
  ]
}
```

### Growth Operator Management

#### Get Domains

```http
GET /api/admin/growth-operators/domains
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "candidate",
      "key": "candidate",
      "label": "Candidate Operations",
      "description": "Manage candidate acquisition and engagement",
      "operatorCount": 3
    }
  ]
}
```

#### List Growth Operators

```http
GET /api/admin/growth-operators
```

#### Assign Domains to Operator

```http
POST /api/admin/growth-operators/{operator_id}/domains
```

**Request Body:**
```json
{
  "domains": ["candidate", "company"],
  "primary_domain": "candidate"
}
```

#### Remove Domain Assignment

```http
DELETE /api/admin/growth-operators/{operator_id}/domains/{domain}
```

#### Get Domain Statistics

```http
GET /api/admin/growth-operators/statistics
```

---

## Communication APIs

### Conversations

#### Get Conversations

```http
GET /api/communication/conversations
```

**Headers Required:** `Authorization: Bearer <token>`

#### Create Conversation

```http
POST /api/communication/conversations
```

**Request Body:**
```json
{
  "participant_ids": [1, 2],
  "subject": "Interview Discussion"
}
```

### Messages

#### Get Messages

```http
GET /api/communication/conversations/{conversation_id}/messages
```

#### Send Message

```http
POST /api/communication/messages
```

**Request Body:**
```json
{
  "conversation_id": 1,
  "content": "Hello, I wanted to discuss..."
}
```

#### Mark as Read

```http
PUT /api/communication/messages/{message_id}/read
```

### Notifications

#### Get Notification Preferences

```http
GET /api/communication/notifications/preferences
```

#### Update Notification Preferences

```http
POST /api/communication/notifications/preferences
```

---

## Interview APIs

### Sessions

#### Get All Sessions

```http
GET /api/interviews/sessions
```

#### Get My Sessions

```http
GET /api/interviews/sessions/my
```

**Headers Required:** `Authorization: Bearer <token>`

#### Create Session

```http
POST /api/interviews/sessions
```

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "candidate_id": 1,
  "job_id": 1,
  "scheduled_at": "2025-02-01T10:00:00Z",
  "duration_minutes": 60,
  "interview_type": "video",
  "interviewers": [2, 3]
}
```

#### Get Session Details

```http
GET /api/interviews/sessions/{session_id}
```

#### Update Session Status

```http
PUT /api/interviews/sessions/{session_id}/status
```

**Request Body:**
```json
{
  "status": "completed"
}
```

#### Cancel Session

```http
POST /api/interviews/sessions/{session_id}/cancel
```

**Request Body:**
```json
{
  "reason": "Candidate requested reschedule"
}
```

#### Submit Feedback

```http
POST /api/interviews/sessions/{session_id}/feedback
```

**Request Body:**
```json
{
  "rating": 4,
  "technical_score": 85,
  "communication_score": 90,
  "notes": "Strong candidate with good technical skills"
}
```

### Upcoming Interviews

```http
GET /api/interviews/upcoming
```

---

## Error Handling

All API endpoints return consistent error responses:

### Error Response Format

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication token required |
| `INVALID_TOKEN` | Token is invalid or expired |
| `PERMISSION_DENIED` | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `VALIDATION_ERROR` | Request data validation failed |
| `DATABASE_ERROR` | Database operation failed |

---

## Rate Limiting

API requests are rate limited to:
- **100 requests per minute** for authenticated users
- **20 requests per minute** for unauthenticated requests

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Changelog

### Version 2.0.0 (December 2025)
- Added Growth Operator domain management APIs
- Added comprehensive user management APIs
- Added interview scheduling APIs
- Added communication/messaging APIs
- Improved error handling with fallback data
- Added JD templates API

### Version 1.0.0 (Initial Release)
- Basic authentication APIs
- CV management APIs
- Job search and application APIs
- Recruiter job posting APIs
