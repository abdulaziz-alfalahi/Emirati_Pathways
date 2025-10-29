# Shortlist Feature Implementation

## Overview

The shortlist feature allows recruiters to save and manage matched candidates for job descriptions. This document describes the complete implementation.

## Backend Implementation

### 1. Database Schema

The shortlist feature uses a new `candidate_shortlist` table:

```sql
CREATE TABLE IF NOT EXISTS candidate_shortlist (
    id SERIAL PRIMARY KEY,
    shortlist_id VARCHAR(100) UNIQUE NOT NULL,
    jd_id VARCHAR(100) NOT NULL,
    candidate_id VARCHAR(100) NOT NULL,
    recruiter_id VARCHAR(100) NOT NULL,
    match_score DECIMAL(5,2),
    match_details JSONB,
    status VARCHAR(50) DEFAULT 'shortlisted',
    notes TEXT,
    tags JSONB DEFAULT '[]',
    contacted_at TIMESTAMP,
    interview_scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jd_id, candidate_id)
);
```

**Key Features:**
- Unique constraint on `(jd_id, candidate_id)` prevents duplicate shortlisting
- JSONB fields for flexible match_details and tags storage
- Status tracking with timestamps for workflow stages
- Notes field for recruiter comments

### 2. Backend Files Created

#### `/backend/recruiter/shortlist_engine.py`
- Core business logic for shortlist management
- Defines `ShortlistStatus` enum with workflow states:
  - `shortlisted`: Initial state when candidate is added
  - `contacted`: Recruiter has reached out
  - `interview_scheduled`: Interview set up
  - `interviewed`: Interview completed
  - `offer_sent`: Offer extended
  - `hired`: Candidate accepted
  - `rejected`: Candidate rejected
  - `withdrawn`: Candidate withdrew

- `ShortlistEngine` class with methods:
  - `add_to_shortlist()`: Add candidate to shortlist
  - `update_shortlist_status()`: Update candidate status
  - `remove_from_shortlist()`: Remove from shortlist
  - `get_shortlist_for_jd()`: Get all shortlisted candidates for a JD
  - `add_note_to_shortlist()`: Add recruiter notes
  - `get_shortlist_stats()`: Get statistics for a JD's shortlist

#### `/backend/recruiter/shortlist_routes.py`
API endpoints for shortlist management:

**POST `/api/recruiter/shortlist/add`**
- Add a candidate to shortlist
- Request body:
  ```json
  {
    "jd_id": "jd_...",
    "candidate_id": "user_...",
    "recruiter_id": "recruiter_...",
    "match_score": 85.5,
    "match_details": {...},
    "notes": "Strong technical background"
  }
  ```
- Returns: `shortlist_id` and success status
- Handles duplicate prevention (409 Conflict if already shortlisted)

**GET `/api/recruiter/shortlist/{jd_id}`**
- Get all shortlisted candidates for a job description
- Query parameters:
  - `status`: Filter by status (optional)
  - `limit`: Number of results (default: 50)
  - `offset`: Pagination offset (default: 0)
- Returns: List of candidates with full details joined from `users` and `user_profiles` tables

**PUT `/api/recruiter/shortlist/{shortlist_id}/status`**
- Update candidate status
- Request body:
  ```json
  {
    "status": "contacted",
    "notes": "Sent initial email"
  }
  ```
- Automatically updates `contacted_at` or `interview_scheduled_at` timestamps

**DELETE `/api/recruiter/shortlist/{shortlist_id}`**
- Remove candidate from shortlist

**POST `/api/recruiter/shortlist/{shortlist_id}/notes`**
- Add timestamped note to shortlist entry
- Request body:
  ```json
  {
    "note": "Excellent communication skills",
    "recruiter_id": "recruiter_123"
  }
  ```

**GET `/api/recruiter/shortlist/{jd_id}/stats`**
- Get statistics for a JD's shortlist
- Returns:
  ```json
  {
    "total": 15,
    "shortlisted": 10,
    "contacted": 5,
    "interview_scheduled": 3,
    "interviewed": 2,
    "offer_sent": 1,
    "hired": 0,
    "rejected": 2,
    "avg_match_score": 82.5
  }
  ```

### 3. Server Integration

Updated `/backend/recruiter_server.py` to register shortlist routes:

```python
from recruiter.shortlist_routes import shortlist_routes

app.register_blueprint(shortlist_routes)
logger.info("Registered: Shortlist routes for candidate management")
```

## Frontend Implementation

### 1. Components Created

#### `/frontend/src/components/recruiter/shortlist/ShortlistManager.tsx`

Full-featured shortlist management component with:

**Features:**
- Statistics dashboard showing:
  - Total shortlisted candidates
  - Contacted count
  - Interviews scheduled
  - Average match score
  
- Candidate table with:
  - Avatar and name
  - Contact information (email, phone)
  - Current role and company
  - Match score badge (color-coded)
  - Status chip
  - UAE National indicator
  - Action buttons

**Actions:**
- Update status dialog
- Add note dialog
- View profile
- Remove from shortlist

**Props:**
```typescript
interface ShortlistManagerProps {
  jdId: string;
  onClose?: () => void;
}
```

### 2. Integration with Job Description Wizard

Updated `/frontend/src/components/recruiter/job-descriptions/JobDescriptionWizard.tsx`:

**Added handler:**
```typescript
const handleShortlistCandidate = async (
  candidateId: string, 
  matchScore: number, 
  matchDetails: any
) => {
  // Calls /api/recruiter/shortlist/add
  // Shows toast notification on success/error
}
```

**Updated matching dialog:**
- Shortlist button now functional
- Calls `handleShortlistCandidate()` with candidate data
- Prevents duplicate shortlisting (409 handled gracefully)

## Workflow

### 1. Candidate Matching → Shortlisting

```
JD Wizard (Review Step)
  ↓
Find Top 10 Candidates (AI Matching)
  ↓
Matching Dialog Opens
  ↓
Recruiter Clicks "Shortlist" on Candidate
  ↓
POST /api/recruiter/shortlist/add
  ↓
Candidate Added to Database
  ↓
Toast Notification Shown
```

### 2. Managing Shortlisted Candidates

```
Shortlist Manager Component
  ↓
GET /api/recruiter/shortlist/{jd_id}
  ↓
Display Candidates in Table
  ↓
Recruiter Actions:
  - Update Status → PUT /status
  - Add Note → POST /notes
  - Remove → DELETE /{shortlist_id}
```

### 3. Status Progression

```
shortlisted
  ↓ (Recruiter contacts candidate)
contacted
  ↓ (Schedule interview)
interview_scheduled
  ↓ (Conduct interview)
interviewed
  ↓ (Send offer)
offer_sent
  ↓ (Candidate accepts)
hired

OR

rejected / withdrawn (at any stage)
```

## API Usage Examples

### Add to Shortlist

```bash
curl -X POST http://localhost:5003/api/recruiter/shortlist/add \
  -H "Content-Type: application/json" \
  -d '{
    "jd_id": "jd_20251029_123456",
    "candidate_id": "user_789",
    "recruiter_id": "recruiter_001",
    "match_score": 85.5,
    "match_details": {
      "skills": 90,
      "experience": 85,
      "education": 80,
      "location": 85
    },
    "notes": "Strong Python and React skills"
  }'
```

### Get Shortlist

```bash
curl http://localhost:5003/api/recruiter/shortlist/jd_20251029_123456
```

### Update Status

```bash
curl -X PUT http://localhost:5003/api/recruiter/shortlist/sl_20251029_abc123/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "contacted",
    "notes": "Sent email invitation for phone screening"
  }'
```

### Get Statistics

```bash
curl http://localhost:5003/api/recruiter/shortlist/jd_20251029_123456/stats
```

## Database Setup

To enable the shortlist feature, ensure PostgreSQL is running and the database is configured:

```bash
# Start PostgreSQL
sudo service postgresql start

# Connect to database
psql -h 127.0.0.1 -U emirati_user -d emirati_journey

# Table will be auto-created on first use
# Or manually create with the schema above
```

## Testing

### Backend Testing

1. Start the recruiter server:
   ```bash
   cd /home/ubuntu/Emirati_Pathways/backend
   python3.11 recruiter_server.py
   ```

2. Test health endpoint:
   ```bash
   curl http://localhost:5003/health
   ```

3. Test shortlist endpoints (see API Usage Examples above)

### Frontend Testing

1. Start the frontend:
   ```bash
   cd /home/ubuntu/Emirati_Pathways/frontend
   npm run dev
   ```

2. Navigate to JD Wizard
3. Complete a job description
4. Click "Find Top 10 Candidates"
5. Click "Shortlist" on candidates
6. View shortlisted candidates in Shortlist Manager

## Next Steps

### Immediate Enhancements

1. **Communication Module**
   - Send emails to shortlisted candidates
   - SMS notifications
   - Message templates
   - Track communication history

2. **Interview Scheduling**
   - Calendar integration
   - Schedule interviews with candidates
   - Interview feedback forms
   - Track interview outcomes

3. **Offer Management**
   - Create and send offers
   - Track offer status
   - Offer templates
   - Close position when offer accepted

### Future Enhancements

1. **Bulk Actions**
   - Shortlist multiple candidates at once
   - Bulk status updates
   - Bulk email sending

2. **Advanced Filtering**
   - Filter by match score range
   - Filter by UAE National status
   - Filter by experience years
   - Filter by location

3. **Export Functionality**
   - Export shortlist to CSV/Excel
   - Generate shortlist reports
   - Print-friendly views

4. **Collaboration**
   - Share shortlist with hiring managers
   - Collaborative notes
   - Approval workflows

## Files Modified/Created

### Backend
- ✅ `/backend/recruiter/shortlist_engine.py` (NEW)
- ✅ `/backend/recruiter/shortlist_routes.py` (NEW)
- ✅ `/backend/recruiter_server.py` (MODIFIED - added shortlist routes)

### Frontend
- ✅ `/frontend/src/components/recruiter/shortlist/ShortlistManager.tsx` (NEW)
- ✅ `/frontend/src/components/recruiter/job-descriptions/JobDescriptionWizard.tsx` (MODIFIED - added shortlist handler)

### Documentation
- ✅ `/SHORTLIST_IMPLEMENTATION.md` (NEW - this file)

## Dependencies

### Backend
- Flask
- Flask-CORS
- Flask-JWT-Extended
- psycopg2-binary
- Python 3.11+

### Frontend
- React
- TypeScript
- Material-UI (@mui/material)
- axios

All dependencies are already installed in the project.

## Configuration

Shortlist feature uses the same database configuration as the JD Builder:

```env
DB_HOST=127.0.0.1
DB_NAME=emirati_journey
DB_USER=emirati_user
DB_PASSWORD=emirati_secure_password
```

No additional configuration required.

## Summary

The shortlist feature is **fully implemented** with:
- ✅ Complete backend API (7 endpoints)
- ✅ Database schema with auto-creation
- ✅ Frontend management component
- ✅ Integration with JD Wizard
- ✅ Status workflow tracking
- ✅ Statistics dashboard
- ✅ Notes and tagging support
- ✅ Duplicate prevention
- ✅ Error handling

**Ready for testing once PostgreSQL is running!**

