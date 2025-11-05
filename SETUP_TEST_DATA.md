# Setup Test Data - Quick Guide

## Problem

When you click "Manage Shortlist" from the Recruiter Dashboard, you see an empty list with no candidates.

## Root Cause

The database doesn't have test data for the shortlist. The application is working correctly, but there's no data to display.

## Solution

Run the test data creation script to populate the database with sample candidates, jobs, and shortlist entries.

---

## Quick Fix (3 Steps)

### Step 1: Start PostgreSQL

```powershell
# On Windows (PowerShell or Command Prompt)
pg_ctl start -D "C:\Program Files\PostgreSQL\14\data"

# Or using services
net start postgresql-x64-14
```

**Verify it's running**:
```powershell
psql -U postgres -d emirati_journey -c "SELECT 1;"
```

You should see:
```
 ?column? 
----------
        1
(1 row)
```

### Step 2: Run Test Data Script

```bash
# Navigate to project directory
cd C:\path\to\Emirati_Pathways

# Run the script
python create_test_data.py
```

**Expected output**:
```
============================================================
  TEST DATA CREATION SCRIPT
  Emirati Pathways - Recruiter Management System
============================================================
✅ Database connection successful!

📋 Creating job descriptions...
  ✓ Created job: Senior Software Engineer (jd_001)
  ✓ Created job: Data Analyst (jd_002)
  ✓ Created job: Product Manager (jd_003)
✅ Created 3 job descriptions

👥 Creating candidates...
  ✓ Created candidate: Ahmed Al Mansouri (cand_001)
  ✓ Created candidate: Fatima Al Zahra (cand_002)
  ✓ Created candidate: Mohammed Al Hashimi (cand_003)
  ✓ Created candidate: Aisha Al Suwaidi (cand_004)
  ✓ Created candidate: Khalid Al Mazrouei (cand_005)
  ✓ Created candidate: Mariam Al Ketbi (cand_006)
✅ Created 6 candidates

📝 Creating shortlist entries...
  ✓ Created shortlist entry: sl_001 (JD: jd_001, Candidate: cand_001)
  ✓ Created shortlist entry: sl_002 (JD: jd_001, Candidate: cand_002)
  ✓ Created shortlist entry: sl_003 (JD: jd_001, Candidate: cand_005)
  ✓ Created shortlist entry: sl_004 (JD: jd_002, Candidate: cand_003)
  ✓ Created shortlist entry: sl_005 (JD: jd_002, Candidate: cand_006)
  ✓ Created shortlist entry: sl_006 (JD: jd_003, Candidate: cand_004)
✅ Created 6 shortlist entries

📅 Creating interview schedules...
  ✓ Created interview: int_001 (Status: completed)
  ✓ Created interview: int_002 (Status: scheduled)
  ✓ Created interview: int_003 (Status: completed)
✅ Created 3 interview schedules

🔍 Verifying created data...
  ✓ Active job descriptions: 3
  ✓ Total candidates: 6
  ✓ Shortlist entries for jd_001: 3
  ✓ Total interviews: 3
  ✓ Interviews with feedback: 2

✅ Data verification complete!

============================================================
  ✅ SUCCESS! Test data created successfully
============================================================

📊 Summary:
  • 3 job descriptions created
  • 6 candidates created
  • 6 shortlist entries created
  • 3 interview schedules created

🎯 Next steps:
  1. Refresh your browser
  2. Navigate to: http://localhost:8080/recruiter-dashboard
  3. Click 'Manage Shortlist' button
  4. You should now see candidates!

🧪 Test Option C features:
  • Select candidates → 'Create Offer' button appears
  • Click 📝 icon → Add interview feedback
```

### Step 3: Test in Browser

1. **Refresh browser**: Press `Ctrl+Shift+R` (hard refresh)
2. **Navigate to dashboard**: `http://localhost:8080/recruiter-dashboard`
3. **Click "Manage Shortlist"** button
4. **Verify candidates appear**: You should see 3 candidates for jd_001

---

## What Data Gets Created

### Job Descriptions (3)

| JD ID   | Title                      | Company                    | Location   | Status |
|---------|----------------------------|----------------------------|------------|--------|
| jd_001  | Senior Software Engineer   | Emirates Digital Solutions | Dubai      | Active |
| jd_002  | Data Analyst               | Abu Dhabi Analytics        | Abu Dhabi  | Active |
| jd_003  | Product Manager            | Dubai Innovation Hub       | Dubai      | Active |

### Candidates (6)

| ID       | Name                  | Position               | Experience | Location   |
|----------|-----------------------|------------------------|------------|------------|
| cand_001 | Ahmed Al Mansouri     | Software Engineer      | 6 years    | Dubai      |
| cand_002 | Fatima Al Zahra       | Senior Developer       | 5 years    | Dubai      |
| cand_003 | Mohammed Al Hashimi   | Data Analyst           | 4 years    | Abu Dhabi  |
| cand_004 | Aisha Al Suwaidi      | Product Lead           | 8 years    | Dubai      |
| cand_005 | Khalid Al Mazrouei    | Full Stack Developer   | 7 years    | Dubai      |
| cand_006 | Mariam Al Ketbi       | Junior Data Scientist  | 3 years    | Abu Dhabi  |

### Shortlist Entries for jd_001 (3)

| Shortlist ID | Candidate          | Status       | Match Score | Notes                                    |
|--------------|--------------------|--------------|-------------|------------------------------------------|
| sl_001       | Ahmed Al Mansouri  | Shortlisted  | 92.5%       | Excellent technical skills               |
| sl_002       | Fatima Al Zahra    | Contacted    | 88.0%       | Great Spring Boot experience             |
| sl_003       | Khalid Al Mazrouei | Interviewed  | 85.5%       | Interview completed, awaiting feedback   |

### Interview Schedules (3)

| Interview ID | JD     | Status    | Rating | Recommendation | Feedback Available |
|--------------|--------|-----------|--------|----------------|--------------------|
| int_001      | jd_001 | Completed | 4/5    | Hire           | ✅ Yes             |
| int_002      | jd_002 | Scheduled | -      | -              | ❌ No (future)     |
| int_003      | jd_003 | Completed | 5/5    | Hire           | ✅ Yes             |

---

## Testing Option C Features

### Feature 1: Create Offer Button

**Steps**:
1. Go to shortlist page (click "Manage Shortlist")
2. Select one or more candidates using checkboxes
3. "Create Offer (X)" button appears at top
4. Click button
5. Fill in offer details
6. Submit

**Expected Result**:
- ✅ Offer created successfully
- ✅ Status updates to "Offer Sent"
- ✅ Success notification appears

### Feature 2: Add Interview Feedback

**Steps**:
1. Go to shortlist page
2. Find a candidate with "Interviewed" status (e.g., Khalid Al Mazrouei)
3. Click 📝 icon in Actions column
4. Fill in:
   - Rating: 1-5 stars
   - Recommendation: Hire/Reject/Next Round/Hold
   - Feedback notes
5. Submit

**Expected Result**:
- ✅ Feedback saved successfully
- ✅ Interview column updates with rating and recommendation
- ✅ Success notification appears

---

## Troubleshooting

### Issue: "Database connection failed"

**Cause**: PostgreSQL is not running

**Solution**:
```powershell
# Start PostgreSQL
pg_ctl start -D "C:\Program Files\PostgreSQL\14\data"

# Or
net start postgresql-x64-14

# Verify
psql -U postgres -c "SELECT 1;"
```

### Issue: "Table does not exist"

**Cause**: Database schema not created

**Solution**:
```bash
# Run database migrations
cd backend
python manage.py migrate

# Or create tables manually
psql -U postgres -d emirati_journey -f schema.sql
```

### Issue: "Permission denied"

**Cause**: Wrong database credentials

**Solution**:
Edit `create_test_data.py` and update `DB_CONFIG`:
```python
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'emirati_journey',  # Your database name
    'user': 'postgres',              # Your username
    'password': 'your_password'      # Your password
}
```

### Issue: Script runs but no data appears

**Possible Causes**:
1. Wrong database name
2. Frontend not refreshed
3. Backend not restarted

**Solutions**:
```bash
# 1. Verify database name
psql -U postgres -l | grep emirati

# 2. Hard refresh browser
Ctrl+Shift+R

# 3. Restart backend
cd backend
python app.py
```

### Issue: "Duplicate key error"

**Cause**: Data already exists

**Solution**:
This is normal! The script uses `ON CONFLICT DO UPDATE`, so it will update existing records instead of creating duplicates. You can safely ignore this message.

---

## Manual Data Verification

### Check if data exists

```sql
-- Connect to database
psql -U postgres -d emirati_journey

-- Check job descriptions
SELECT jd_id, title, status FROM job_descriptions;

-- Check candidates
SELECT candidate_id, name, location FROM candidates;

-- Check shortlist for jd_001
SELECT s.shortlist_id, c.name, s.status, s.match_score
FROM shortlist s
JOIN candidates c ON s.candidate_id = c.candidate_id
WHERE s.jd_id = 'jd_001';

-- Check interviews
SELECT interview_id, jd_id, status, rating, recommendation
FROM interview_schedules;
```

### Clear all test data (if needed)

```sql
-- WARNING: This deletes all data!
DELETE FROM interview_schedules;
DELETE FROM shortlist;
DELETE FROM candidates;
DELETE FROM job_descriptions;
```

---

## Advanced: Customize Test Data

### Add more candidates

Edit `create_test_data.py` and add to the `candidates` list:

```python
{
    'candidate_id': 'cand_007',
    'name': 'Your Name',
    'email': 'your.email@example.ae',
    'phone': '+971501234567',
    'location': 'Dubai',
    'experience_years': 5,
    'current_position': 'Your Position',
    'education': 'Your Education',
    'skills': 'Your Skills',
    'nationality': 'UAE',
    'created_at': datetime.now() - timedelta(days=10)
}
```

### Add to shortlist

```python
{
    'shortlist_id': 'sl_007',
    'jd_id': 'jd_001',
    'candidate_id': 'cand_007',
    'recruiter_id': 'recruiter_001',
    'status': 'shortlisted',
    'match_score': 90.0,
    'notes': 'Your notes here',
    'created_at': datetime.now() - timedelta(days=8)
}
```

Then run the script again: `python create_test_data.py`

---

## Database Schema Reference

### Shortlist Table

```sql
CREATE TABLE shortlist (
    shortlist_id VARCHAR(50) PRIMARY KEY,
    jd_id VARCHAR(50) REFERENCES job_descriptions(jd_id),
    candidate_id VARCHAR(50) REFERENCES candidates(candidate_id),
    recruiter_id VARCHAR(50),
    status VARCHAR(50),  -- shortlisted, contacted, interviewed, offer_sent, hired, rejected
    match_score DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Interview Schedules Table

```sql
CREATE TABLE interview_schedules (
    interview_id VARCHAR(50) PRIMARY KEY,
    jd_id VARCHAR(50) REFERENCES job_descriptions(jd_id),
    shortlist_id VARCHAR(50) REFERENCES shortlist(shortlist_id),
    recruiter_id VARCHAR(50),
    scheduled_at TIMESTAMP,
    duration INTEGER,  -- minutes
    location VARCHAR(200),
    meeting_link VARCHAR(500),
    status VARCHAR(50),  -- scheduled, completed, cancelled
    rating INTEGER,  -- 1-5
    recommendation VARCHAR(50),  -- hire, reject, next_round, hold
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Next Steps After Data Setup

### 1. Test Navigation
- ✅ Dashboard → Manage Shortlist button works
- ✅ Shortlist page loads with candidates

### 2. Test Option C Features
- ✅ Create Offer button appears when selecting candidates
- ✅ Add Feedback dialog works for interviewed candidates

### 3. Explore Other Features
- View candidate details
- Schedule new interviews
- Update shortlist status
- Export reports

### 4. Add Real Data
Once testing is complete, you can:
- Import real candidates from CSV
- Connect to external recruitment systems
- Use the API to add candidates programmatically

---

## Summary

**Problem**: Empty shortlist  
**Solution**: Run `create_test_data.py`  
**Time**: 2 minutes  
**Result**: 6 candidates, 3 in shortlist for jd_001  

**Commands**:
```bash
# 1. Start PostgreSQL
pg_ctl start -D "C:\Program Files\PostgreSQL\14\data"

# 2. Run script
python create_test_data.py

# 3. Refresh browser and test
```

**Expected outcome**: Shortlist page shows 3 candidates with all Option C features working!

---

**Document Version**: 1.0  
**Last Updated**: November 4, 2024  
**Status**: Ready to use  
**Related**: QUICKSTART_TESTING.md, FINAL_DELIVERY_SUMMARY.md

