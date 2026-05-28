# API Gaps Analysis Summary

## Overview
- **Total Frontend API Calls**: ~150+ unique endpoints
- **Missing Backend Endpoints**: 152 endpoints need implementation

## Critical Missing Endpoints by Priority

### Priority 1: Dashboard Core Features (Admin, HR, Recruiter)

#### Admin Dashboard
| Method | Endpoint | Used In |
|--------|----------|---------|
| GET | `/api/admin/dashboard/stats` | AdminDashboard.tsx |
| GET | `/api/admin/alerts` | AdminDashboard.tsx |
| GET | `/api/admin/activity/recent` | AdminDashboard.tsx |
| GET | `/api/admin/dashboard` | AdminDashboard.tsx |

#### Admin User Management
| Method | Endpoint | Used In |
|--------|----------|---------|
| GET | `/api/admin/users` | UserManager.tsx |
| POST | `/api/admin/users` | UserManager.tsx |
| PUT | `/api/admin/users/{id}` | UserManager.tsx |
| DELETE | `/api/admin/users/{id}` | UserManager.tsx |
| POST | `/api/admin/users/{id}/activate` | UserManager.tsx |
| POST | `/api/admin/users/{id}/suspend` | UserManager.tsx |
| PUT | `/api/admin/users/{id}/roles` | UserManager.tsx |
| GET | `/api/admin/users/export` | UserManager.tsx |

#### Admin Roles Management
| Method | Endpoint | Used In |
|--------|----------|---------|
| GET | `/api/admin/roles` | AdminRoles.tsx, UserManager.tsx |
| POST | `/api/admin/roles` | AdminRoles.tsx |
| PUT | `/api/admin/roles/{id}` | AdminRoles.tsx |
| DELETE | `/api/admin/roles/{id}` | AdminRoles.tsx |

### Priority 2: HR Dashboard Features

| Method | Endpoint | Used In |
|--------|----------|---------|
| GET | `/api/hr/jobs` | HRDashboard.tsx, Distribution.tsx |
| GET | `/api/hr/dashboard/metrics` | HRDashboard.tsx |
| GET | `/api/hr/jobs/shortlisted-candidates` | HRDashboard.tsx |
| DELETE | `/api/hr/jobs/{id}/shortlist/{id}` | HRDashboard.tsx |
| GET | `/api/company/team/members` | HRDashboard.tsx, TeamManagementTab.tsx |
| GET | `/api/hr/candidates/search` | SourceCandidatesDialog.tsx |

### Priority 3: Recruiter Dashboard Features

| Method | Endpoint | Used In |
|--------|----------|---------|
| GET | `/api/recruiter/dashboard` | RecruiterDashboard.tsx |
| GET | `/api/recruiter/jd/list` | JobDescriptionsList.tsx, ActiveVacancies.tsx |
| GET | `/api/recruiter/jd/{id}` | JobDescriptionWizard.tsx |
| POST | `/api/recruiter/jd/create` | JobDescriptionWizard.tsx |
| PUT | `/api/recruiter/jd/{id}/basic-info` | JobDescriptionWizard.tsx |
| POST | `/api/recruiter/jd/{id}/generate-description` | JobDescriptionWizard.tsx |
| POST | `/api/recruiter/jd/{id}/match-candidates` | CandidateMatching.tsx |
| GET | `/api/recruiter/shortlist/{id}` | ShortlistManager.tsx |
| POST | `/api/recruiter/shortlist/add` | JobDescriptionWizard.tsx |
| POST | `/api/recruiter/offers/create` | CreateOfferDialog.tsx |

### Priority 4: Communication & Messaging

| Method | Endpoint | Used In |
|--------|----------|---------|
| GET | `/api/communication/conversations` | Messages.tsx |
| GET | `/api/communication/conversations/{id}/messages` | Messages.tsx |
| POST | `/api/communication/messages` | Messages.tsx, HRDashboard.tsx |
| POST | `/api/communication/conversations` | CandidateMatching.tsx |

### Priority 5: Interview Management

| Method | Endpoint | Used In |
|--------|----------|---------|
| GET | `/api/interviews/sessions/my` | Interviews.tsx |
| GET | `/api/interviews/sessions/admin/all` | AdminInterviews.tsx |
| POST | `/api/interviews/sessions` | HRDashboard.tsx |
| POST | `/api/interviews/sessions/{id}/analyze` | Interviews.tsx |
| POST | `/api/interviews/sessions/{id}/cancel` | Interviews.tsx |
| GET | `/api/video-interview/sessions` | Interviews.tsx |

### Priority 6: Growth Operator Dashboard

| Method | Endpoint | Used In |
|--------|----------|---------|
| GET | `/api/growth-operator/metrics` | GrowthOperatorDashboard.tsx |

### Priority 7: Candidate Features

| Method | Endpoint | Used In |
|--------|----------|---------|
| GET | `/api/candidate/job-matches` | JobMatches.tsx |
| GET | `/api/jobs/applications` | ApplicationTracker.tsx |
| POST | `/api/jobs/apply` | JobMatches.tsx |
| GET | `/api/jobs` | MobileJobSearch.tsx |
| GET | `/api/jobs/saved` | MobileJobSearch.tsx |
| POST | `/api/jobs/{id}/save` | MobileJobSearch.tsx |
| POST | `/api/jobs/{id}/apply` | MobileJobSearch.tsx |

## Implementation Plan

### Phase 1: Admin APIs (Highest Priority)
1. Create `/api/admin/dashboard/stats` - Dashboard statistics
2. Create `/api/admin/users` CRUD endpoints
3. Create `/api/admin/roles` CRUD endpoints
4. Create `/api/admin/alerts` and `/api/admin/activity/recent`

### Phase 2: HR APIs
1. Create `/api/hr/jobs` with shortlist management
2. Create `/api/hr/dashboard/metrics`
3. Create `/api/hr/candidates/search`

### Phase 3: Recruiter APIs
1. Enhance `/api/recruiter/jd/*` endpoints
2. Create `/api/recruiter/shortlist/*` endpoints
3. Create `/api/recruiter/offers/*` endpoints

### Phase 4: Communication APIs
1. Create `/api/communication/conversations` CRUD
2. Create `/api/communication/messages` endpoints

### Phase 5: Interview APIs
1. Create `/api/interviews/sessions/*` endpoints
2. Create `/api/video-interview/*` endpoints
