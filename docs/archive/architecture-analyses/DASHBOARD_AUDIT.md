# Recruiter Dashboard Audit - Inactive Features & Mock Data

## Overview

This document identifies all inactive buttons and mock data in the recruiter dashboard that need to be implemented with real backend functionality.

## Dashboard Location

**File:** `/frontend/src/pages/RecruiterDashboard.tsx`

**URL:** `localhost:8080/recruiter-dashboard`

## Inactive Features Identified

### 1. Source Candidates Button (Line 205-208)

**Current State:** Button with no onClick handler - inactive

```typescript
<Button variant="outline" className="font-dubai-medium">
  <Users className="h-4 w-4 mr-2" />
  Source Candidates
</Button>
```

**Required Implementation:**
- Create candidate sourcing interface
- Integrate with candidate database/search
- Allow filtering by skills, location, experience
- Integration with external job boards/LinkedIn
- Save sourced candidates to database

### 2. Schedule Interviews Button (Line 215-218)

**Current State:** Button with no onClick handler - inactive

```typescript
<Button variant="outline" className="font-dubai-medium">
  <Calendar className="h-4 w-4 mr-2" />
  Schedule Interviews
</Button>
```

**Required Implementation:**
- Create interview scheduling dialog
- Calendar integration
- Select candidates from shortlist
- Set interview date/time/location
- Send email notifications
- Integration with existing interview_routes.py backend

### 3. Export Reports Button (Line 219-222)

**Current State:** Button with no onClick handler - inactive

```typescript
<Button variant="outline" className="font-dubai-medium">
  <Download className="h-4 w-4 mr-2" />
  Export Reports
</Button>
```

**Required Implementation:**
- Create report generation dialog
- Multiple report types:
  - Recruitment pipeline report
  - Candidate status report
  - Interview feedback report
  - Offer statistics report
  - Performance metrics report
- Export formats: PDF, Excel, CSV
- Date range selection
- Backend endpoint for report generation

## Mock Data Identified

### 1. Dashboard Statistics (Line 103-158)

**Current State:** All statistics are hardcoded mock data

```typescript
const setMockData = () => {
  setDashboardData({
    placements: {
      thisMonth: 12,
      thisQuarter: 34,
      thisYear: 156,
      target: 180
    },
    pipeline: {
      activeSearches: 24,
      candidatesInProcess: 89,
      interviewsScheduled: 18,
      offersExtended: 7
    },
    performance: {
      placementRate: 78,
      averageTimeToFill: 21,
      clientSatisfaction: 4.6,
      candidateQuality: 4.4
    },
    activity: [...]
  });
};
```

**Required Backend Endpoints:**

| Metric | Backend Endpoint | Database Query |
|---|---|---|
| Placements This Year | `/api/recruiter/statistics/placements` | Count from `job_offers` where status='accepted' |
| Active Searches | `/api/recruiter/statistics/active-searches` | Count from `job_descriptions` where status='active' |
| Candidates in Process | `/api/recruiter/statistics/candidates` | Count from `shortlist` where status!='rejected' |
| Interviews Scheduled | `/api/recruiter/statistics/interviews` | Count from `interviews` where status='scheduled' |
| Offers Extended | `/api/recruiter/statistics/offers` | Count from `job_offers` where status='pending' |
| Placement Rate | `/api/recruiter/statistics/placement-rate` | Calculate: (hired/total_candidates) * 100 |
| Avg Time to Fill | `/api/recruiter/statistics/time-to-fill` | Calculate: avg(hire_date - application_date) |

### 2. Recent Activity Feed (Line 123-156)

**Current State:** Hardcoded activity items

**Required Implementation:**
- Backend activity log table
- Track all recruiter actions:
  - Candidate shortlisted
  - Interview scheduled
  - Offer sent
  - Candidate hired
  - JD created
- Real-time activity feed
- Pagination for activity history

## Implementation Priority

### High Priority (Core Functionality)
1. ✅ Replace mock statistics with real backend data
2. ✅ Implement Export Reports functionality
3. ✅ Connect activity feed to real data

### Medium Priority (Enhanced Features)
4. ✅ Implement Schedule Interviews dialog
5. ✅ Implement Source Candidates interface

### Low Priority (Nice to Have)
6. ⬜ Advanced filtering in Source Candidates
7. ⬜ Calendar sync for interviews
8. ⬜ Email templates for notifications

## Backend Files to Create/Modify

1. **`backend/recruiter/statistics_routes.py`** - New file for dashboard statistics
2. **`backend/recruiter/statistics_engine.py`** - Business logic for calculations
3. **`backend/recruiter/reports_routes.py`** - New file for report generation
4. **`backend/recruiter/reports_engine.py`** - Report generation logic
5. **`backend/recruiter/activity_routes.py`** - Activity feed endpoints
6. **`backend/app.py`** - Register new blueprints

## Frontend Components to Create/Modify

1. **`frontend/src/components/recruiter/SourceCandidatesDialog.tsx`** - New component
2. **`frontend/src/components/recruiter/ScheduleInterviewDialog.tsx`** - New component
3. **`frontend/src/components/recruiter/ExportReportsDialog.tsx`** - New component
4. **`frontend/src/pages/RecruiterDashboard.tsx`** - Update to use real data

## Next Steps

1. Create backend statistics endpoints
2. Create backend reports generation system
3. Update frontend to fetch real data
4. Implement Source Candidates dialog
5. Implement Schedule Interviews dialog
6. Implement Export Reports dialog
7. Test all features end-to-end

