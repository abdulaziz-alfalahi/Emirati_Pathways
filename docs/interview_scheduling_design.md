# Interview Scheduling Module - Design Document

## Overview
The Interview Scheduling Module enables recruiters to schedule, manage, and track interviews with shortlisted candidates. It integrates with the existing Shortlist Manager and Communication Module.

## Database Schema

### Table: `interview_schedules`
Stores interview appointments and their details.

```sql
CREATE TABLE interview_schedules (
    id SERIAL PRIMARY KEY,
    interview_id VARCHAR(100) UNIQUE NOT NULL,
    shortlist_id VARCHAR(100) NOT NULL,
    candidate_id VARCHAR(100) NOT NULL,
    recruiter_id VARCHAR(100) NOT NULL,
    jd_id VARCHAR(100),
    
    -- Interview Details
    interview_type VARCHAR(50) NOT NULL,  -- phone, video, in_person, panel
    interview_round INTEGER DEFAULT 1,
    interview_title VARCHAR(255),
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
    
    -- Location/Meeting Details
    location VARCHAR(500),  -- For in-person interviews
    meeting_link VARCHAR(500),  -- For video interviews
    meeting_platform VARCHAR(50),  -- zoom, teams, google_meet
    
    -- Status & Tracking
    status VARCHAR(50) DEFAULT 'scheduled',  -- scheduled, confirmed, completed, cancelled, rescheduled, no_show
    confirmation_status VARCHAR(50) DEFAULT 'pending',  -- pending, confirmed, declined
    
    -- Participants
    interviewers JSONB DEFAULT '[]',  -- Array of interviewer IDs and names
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,
    
    -- Feedback
    feedback TEXT,
    rating INTEGER,  -- 1-5 rating
    recommendation VARCHAR(50),  -- hire, reject, next_round, hold
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    -- Foreign Keys
    FOREIGN KEY (shortlist_id) REFERENCES candidate_shortlist(shortlist_id) ON DELETE CASCADE
);

CREATE INDEX idx_interview_schedules_shortlist ON interview_schedules(shortlist_id);
CREATE INDEX idx_interview_schedules_candidate ON interview_schedules(candidate_id);
CREATE INDEX idx_interview_schedules_recruiter ON interview_schedules(recruiter_id);
CREATE INDEX idx_interview_schedules_date ON interview_schedules(scheduled_date);
CREATE INDEX idx_interview_schedules_status ON interview_schedules(status);
```

### Table: `interview_availability`
Stores recruiter availability slots for candidate self-scheduling.

```sql
CREATE TABLE interview_availability (
    id SERIAL PRIMARY KEY,
    availability_id VARCHAR(100) UNIQUE NOT NULL,
    recruiter_id VARCHAR(100) NOT NULL,
    jd_id VARCHAR(100),
    
    -- Slot Details
    slot_date DATE NOT NULL,
    slot_start_time TIME NOT NULL,
    slot_end_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
    
    -- Capacity
    max_bookings INTEGER DEFAULT 1,
    current_bookings INTEGER DEFAULT 0,
    
    -- Status
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    interview_type VARCHAR(50),
    location VARCHAR(500),
    meeting_link VARCHAR(500),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interview_availability_recruiter ON interview_availability(recruiter_id);
CREATE INDEX idx_interview_availability_date ON interview_availability(slot_date);
CREATE INDEX idx_interview_availability_available ON interview_availability(is_available);
```

## Backend API Endpoints

### Interview Management

#### 1. Create Interview
**POST** `/api/recruiter/interviews/create`

Request:
```json
{
  "shortlist_id": "sl_123",
  "recruiter_id": "recruiter_001",
  "interview_type": "video",
  "interview_round": 1,
  "interview_title": "Technical Interview",
  "scheduled_date": "2025-11-10",
  "scheduled_time": "14:00:00",
  "duration_minutes": 60,
  "meeting_link": "https://zoom.us/j/123456",
  "meeting_platform": "zoom",
  "interviewers": [
    {"id": "int_001", "name": "John Doe", "role": "Technical Lead"}
  ],
  "notes": "Focus on Python and React skills"
}
```

Response:
```json
{
  "success": true,
  "interview_id": "int_abc123",
  "message": "Interview scheduled successfully"
}
```

#### 2. Get Interviews by JD
**GET** `/api/recruiter/interviews/jd/<jd_id>`

Query params: `?status=scheduled&date_from=2025-11-01&date_to=2025-11-30`

Response:
```json
{
  "success": true,
  "interviews": [
    {
      "interview_id": "int_abc123",
      "candidate_name": "Ahmed Ali",
      "interview_type": "video",
      "scheduled_date": "2025-11-10",
      "scheduled_time": "14:00:00",
      "status": "scheduled",
      "confirmation_status": "confirmed"
    }
  ],
  "count": 1
}
```

#### 3. Get Interview Details
**GET** `/api/recruiter/interviews/<interview_id>`

#### 4. Update Interview
**PUT** `/api/recruiter/interviews/<interview_id>`

#### 5. Cancel Interview
**POST** `/api/recruiter/interviews/<interview_id>/cancel`

Request:
```json
{
  "cancellation_reason": "Candidate withdrew application"
}
```

#### 6. Reschedule Interview
**POST** `/api/recruiter/interviews/<interview_id>/reschedule`

Request:
```json
{
  "scheduled_date": "2025-11-12",
  "scheduled_time": "15:00:00",
  "reason": "Recruiter unavailable"
}
```

#### 7. Complete Interview & Add Feedback
**POST** `/api/recruiter/interviews/<interview_id>/complete`

Request:
```json
{
  "feedback": "Strong technical skills, good communication",
  "rating": 4,
  "recommendation": "next_round",
  "internal_notes": "Consider for senior role"
}
```

#### 8. Send Interview Reminder
**POST** `/api/recruiter/interviews/<interview_id>/remind`

### Availability Management

#### 9. Create Availability Slots
**POST** `/api/recruiter/interviews/availability/create`

Request:
```json
{
  "recruiter_id": "recruiter_001",
  "jd_id": "jd_test_001",
  "slots": [
    {
      "slot_date": "2025-11-10",
      "slot_start_time": "09:00:00",
      "slot_end_time": "10:00:00",
      "duration_minutes": 60,
      "interview_type": "video",
      "meeting_link": "https://zoom.us/j/123456"
    }
  ]
}
```

#### 10. Get Available Slots
**GET** `/api/recruiter/interviews/availability?recruiter_id=recruiter_001&date_from=2025-11-01`

### Statistics

#### 11. Get Interview Statistics
**GET** `/api/recruiter/interviews/stats/<jd_id>`

Response:
```json
{
  "success": true,
  "stats": {
    "total_interviews": 15,
    "scheduled": 5,
    "completed": 8,
    "cancelled": 2,
    "no_show": 0,
    "avg_rating": 3.8,
    "recommendations": {
      "hire": 3,
      "next_round": 4,
      "reject": 1
    }
  }
}
```

## Frontend Components

### 1. InterviewScheduler Component
Main component for scheduling interviews.

**Features:**
- Calendar view of scheduled interviews
- Form to create new interview
- Interview type selection (phone, video, in-person, panel)
- Date/time picker
- Meeting link input for video interviews
- Location input for in-person interviews
- Interviewer selection (multi-select)
- Notes field

### 2. InterviewList Component
List view of all interviews with filtering.

**Features:**
- Table view of interviews
- Filter by status, date range, interview type
- Quick actions: View, Edit, Cancel, Reschedule
- Status badges with colors
- Confirmation status indicators

### 3. InterviewDetails Component
Detailed view of a single interview.

**Features:**
- All interview information
- Candidate details (linked to shortlist)
- Timeline of events (scheduled, confirmed, completed)
- Feedback section (for completed interviews)
- Action buttons (Cancel, Reschedule, Send Reminder)

### 4. InterviewFeedback Component
Form for adding feedback after interview completion.

**Features:**
- Rating (1-5 stars)
- Feedback text area
- Recommendation dropdown (hire, reject, next_round, hold)
- Internal notes (not visible to candidate)
- Submit button

### 5. AvailabilityManager Component
Manage recruiter availability slots.

**Features:**
- Calendar view
- Add availability slots
- Bulk slot creation (e.g., every weekday 9-5)
- Edit/delete slots
- View bookings per slot

## Integration Points

### With Shortlist Manager
- Add "Schedule Interview" button in candidate actions
- Show interview status badge on candidate card
- Update candidate status to "interview_scheduled" when interview is created

### With Communication Module
- Send interview invitation email when interview is scheduled
- Send reminder emails/SMS before interview
- Send confirmation request to candidate
- Send thank you email after interview

### Status Workflow
```
Shortlisted → Interview Scheduled → Interview Confirmed → Interview Completed → Next Round/Offer/Reject
```

## Business Logic

### Interview Scheduling Engine (`interview_engine.py`)

**Key Functions:**
1. `create_interview()` - Create new interview with validation
2. `get_interviews()` - Retrieve interviews with filters
3. `update_interview()` - Update interview details
4. `cancel_interview()` - Cancel with reason logging
5. `reschedule_interview()` - Reschedule and notify parties
6. `complete_interview()` - Mark complete and add feedback
7. `send_reminder()` - Send reminder via Communication Module
8. `check_conflicts()` - Check for scheduling conflicts
9. `get_statistics()` - Calculate interview metrics

### Validation Rules
- No double-booking of interviewers
- Interview must be in the future (for new schedules)
- Duration must be between 15-240 minutes
- Required fields: shortlist_id, date, time, type
- Meeting link required for video interviews
- Location required for in-person interviews

### Automatic Actions
- Send confirmation request email when interview is created
- Send reminder 24 hours before interview
- Update candidate status in shortlist when interview is scheduled
- Create communication log for all notifications

## UI/UX Design

### Color Coding
- **Scheduled**: Blue
- **Confirmed**: Green
- **Completed**: Gray
- **Cancelled**: Red
- **Rescheduled**: Orange
- **No-show**: Dark Red

### Calendar View
- Monthly calendar with interview dots
- Click date to see interviews
- Drag-and-drop to reschedule (future enhancement)

### Mobile Responsive
- Stack calendar and list views on mobile
- Touch-friendly buttons and forms

## Testing Strategy

### Backend Tests
1. Create interview with valid data
2. Create interview with missing fields (should fail)
3. Get interviews by JD
4. Update interview details
5. Cancel interview
6. Reschedule interview
7. Complete interview with feedback
8. Check for scheduling conflicts
9. Get statistics

### Frontend Tests
1. Load interview list
2. Create new interview via form
3. View interview details
4. Edit interview
5. Cancel interview with reason
6. Add feedback to completed interview
7. Filter interviews by status and date

### Integration Tests
1. Schedule interview from Shortlist Manager
2. Verify email sent via Communication Module
3. Verify candidate status updated in shortlist
4. Complete workflow: Schedule → Confirm → Complete → Feedback

## Implementation Order

1. ✅ **Phase 1**: Database schema and backend engine
2. ✅ **Phase 2**: Backend API endpoints
3. ✅ **Phase 3**: Test backend with Postman/curl
4. ✅ **Phase 4**: Frontend InterviewScheduler component
5. ✅ **Phase 5**: Integration with Shortlist Manager
6. ✅ **Phase 6**: End-to-end testing
7. ✅ **Phase 7**: Documentation and demo

## Future Enhancements
- Candidate self-scheduling portal
- Calendar sync (Google Calendar, Outlook)
- Video interview integration (Zoom, Teams API)
- Interview scorecard templates
- Multi-round interview workflows
- Interview panel coordination
- Automated interview scheduling based on availability

