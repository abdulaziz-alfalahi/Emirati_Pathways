# Windows Testing Guide - Step-by-Step

This guide will help you run the test data script on your Windows development environment and test Option C features.

---

## Prerequisites Check

Before we start, let's verify your environment:

### 1. Check Python Installation

Open **PowerShell** or **Command Prompt** and run:

```powershell
python --version
```

**Expected output**: `Python 3.x.x` (any version 3.7+)

If not installed:
- Download from: https://www.python.org/downloads/
- Or use: `winget install Python.Python.3.11`

### 2. Check PostgreSQL Installation

```powershell
psql --version
```

**Expected output**: `psql (PostgreSQL) 14.x` or similar

If not installed:
- Download from: https://www.postgresql.org/download/windows/
- Or use: `winget install PostgreSQL.PostgreSQL`

### 3. Check psycopg2 (Python PostgreSQL driver)

```powershell
python -c "import psycopg2; print('psycopg2 installed')"
```

**If you see an error**, install it:

```powershell
pip install psycopg2-binary
```

---

## Step 1: Start PostgreSQL

### Option A: Using pg_ctl (Recommended)

```powershell
# Start PostgreSQL
pg_ctl start -D "C:\Program Files\PostgreSQL\14\data"

# If your PostgreSQL is in a different location, adjust the path
# Common locations:
# C:\Program Files\PostgreSQL\15\data
# C:\Program Files\PostgreSQL\16\data
# C:\PostgreSQL\14\data
```

### Option B: Using Windows Services

```powershell
# Start PostgreSQL service
net start postgresql-x64-14

# Or use the Services GUI:
# 1. Press Win+R
# 2. Type: services.msc
# 3. Find "postgresql-x64-14" (or similar)
# 4. Right-click → Start
```

### Verify PostgreSQL is Running

```powershell
# Check status
pg_ctl status -D "C:\Program Files\PostgreSQL\14\data"

# Or test connection
psql -U postgres -c "SELECT 1;"
```

**Expected output**: Should show "server is running" or return "1"

**If you get a password prompt**: Enter your PostgreSQL password (default is often `postgres`)

---

## Step 2: Pull Latest Code

```powershell
# Navigate to your project directory
cd C:\path\to\Emirati_Pathways

# Make sure you're on the correct branch
git checkout cursor/develop-recruiter-backend-services-6877

# Pull latest changes
git pull origin cursor/develop-recruiter-backend-services-6877
```

**Expected output**: Should show "Already up to date" or list of updated files

---

## Step 3: Configure Database Connection

Open `create_test_data.py` in a text editor and verify the database configuration:

```python
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'emirati_journey',  # ← Check this matches your database name
    'user': 'postgres',              # ← Check your username
    'password': 'postgres'           # ← Update with your password
}
```

### Find Your Database Name

```powershell
# List all databases
psql -U postgres -l

# Look for a database related to your project
# Common names: emirati_journey, emirati_pathways, recruiter_db
```

**If the database doesn't exist**, create it:

```powershell
psql -U postgres -c "CREATE DATABASE emirati_journey;"
```

---

## Step 4: Run the Test Data Script

```powershell
# Make sure you're in the project root directory
cd C:\path\to\Emirati_Pathways

# Run the script
python create_test_data.py
```

### What to Expect

**Success output**:
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
  ... (6 total)
✅ Created 6 candidates

📝 Creating shortlist entries...
  ✓ Created shortlist entry: sl_001 (JD: jd_001, Candidate: cand_001)
  ... (6 total)
✅ Created 6 shortlist entries

📅 Creating interview schedules...
  ✓ Created interview: int_001 (Status: completed)
  ... (3 total)
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
```

### Common Errors and Solutions

#### Error: "Database connection failed"

**Cause**: PostgreSQL not running or wrong credentials

**Solution**:
```powershell
# 1. Check if PostgreSQL is running
pg_ctl status -D "C:\Program Files\PostgreSQL\14\data"

# 2. If not running, start it
pg_ctl start -D "C:\Program Files\PostgreSQL\14\data"

# 3. Test connection manually
psql -U postgres -d emirati_journey -c "SELECT 1;"

# 4. If password is wrong, update create_test_data.py
```

#### Error: "relation 'job_descriptions' does not exist"

**Cause**: Database tables not created

**Solution**:
```powershell
# Option 1: Run database migrations (if using Django/Flask)
cd backend
python manage.py migrate

# Option 2: Create tables manually (if you have schema.sql)
psql -U postgres -d emirati_journey -f schema.sql

# Option 3: Check if tables exist
psql -U postgres -d emirati_journey -c "\dt"
```

#### Error: "ModuleNotFoundError: No module named 'psycopg2'"

**Cause**: psycopg2 not installed

**Solution**:
```powershell
pip install psycopg2-binary
```

---

## Step 5: Verify Data in Database

After the script runs successfully, verify the data:

```powershell
# Connect to database
psql -U postgres -d emirati_journey
```

Then run these queries:

```sql
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

-- Exit psql
\q
```

**Expected results**:
- 3 job descriptions
- 6 candidates
- 3 shortlist entries for jd_001
- 3 interview schedules

---

## Step 6: Start Backend Server

```powershell
# Navigate to backend directory
cd C:\path\to\Emirati_Pathways\backend

# Activate virtual environment (if using one)
.\venv\Scripts\activate

# Start the server
python app.py

# Or if using Flask
flask run

# Or if using FastAPI
uvicorn main:app --reload --port 5003
```

**Expected output**: Server should start on port 5003

**Verify backend is running**:

Open a new PowerShell window:
```powershell
curl http://localhost:5003/health
```

Or open in browser: `http://localhost:5003/health`

---

## Step 7: Start Frontend

Open a **new PowerShell window**:

```powershell
# Navigate to frontend directory
cd C:\path\to\Emirati_Pathways\frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm start
```

**Expected output**: 
```
Compiled successfully!

You can now view emirati-pathways in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**Browser should automatically open** to `http://localhost:3000`

---

## Step 8: Test in Browser

### 8.1 Navigate to Recruiter Dashboard

1. Open browser: `http://localhost:3000` or `http://localhost:8080`
2. Login as recruiter (if required)
3. Navigate to: `http://localhost:8080/recruiter-dashboard`

### 8.2 Click "Manage Shortlist" Button

Look for the button in the Quick Actions section:
- Icon: ✓ (CheckCircle)
- Text: "Manage Shortlist"
- Position: Between "Source Candidates" and "Schedule Interviews"

Click it!

### 8.3 Verify Candidates Appear

You should now see **3 candidates**:

| Name                | Status       | Match Score | Actions |
|---------------------|--------------|-------------|---------|
| Ahmed Al Mansouri   | Shortlisted  | 92.5%       | 📝 🗓️ 💬 |
| Fatima Al Zahra     | Contacted    | 88.0%       | 📝 🗓️ 💬 |
| Khalid Al Mazrouei  | Interviewed  | 85.5%       | 📝 🗓️ 💬 |

**If you see this, SUCCESS!** 🎉

---

## Step 9: Test Option C Features

### Test 1: Create Offer Button

1. **Select a candidate**: Click checkbox next to Ahmed Al Mansouri
2. **Button appears**: "Create Offer (1)" button should appear at top
3. **Click button**: Dialog opens
4. **Fill form**:
   - Position: Senior Software Engineer
   - Salary: 20000 AED
   - Start Date: (select a date)
   - Benefits: Health insurance, visa sponsorship
5. **Submit**: Click "Create Offer"
6. **Verify**:
   - ✅ Success notification appears
   - ✅ Status changes to "Offer Sent"
   - ✅ Offer appears in database

### Test 2: Add Interview Feedback

1. **Find Khalid Al Mazrouei**: Status shows "Interviewed"
2. **Click 📝 icon**: In the Actions column
3. **Dialog opens**: Should show existing feedback (rating: 4, recommendation: hire)
4. **Edit feedback**:
   - Change rating to 5 stars
   - Update notes: "Exceptional candidate, highly recommended"
5. **Submit**: Click "Save Feedback"
6. **Verify**:
   - ✅ Success notification appears
   - ✅ Interview column updates
   - ✅ Shows new rating and recommendation

---

## Step 10: Report Results

After testing, please share:

### What to Share

1. **Script output**: Copy the output from `python create_test_data.py`
2. **Database verification**: Results from the SQL queries in Step 5
3. **Browser screenshots**: 
   - Recruiter Dashboard with "Manage Shortlist" button
   - Shortlist page showing candidates
   - Create Offer dialog
   - Add Feedback dialog
4. **Any errors**: If something doesn't work, copy the error message

### How to Share

Reply with:
```
✅ Step 1: PostgreSQL started successfully
✅ Step 2: Code pulled successfully
✅ Step 3: Database configured
✅ Step 4: Script ran successfully - created X candidates
✅ Step 5: Data verified in database
✅ Step 6: Backend running on port 5003
✅ Step 7: Frontend running on port 3000
✅ Step 8: Candidates visible in shortlist
✅ Step 9: Option C features working

OR

❌ Step X: [Error message or issue description]
```

---

## Troubleshooting Checklist

If something doesn't work, check:

- [ ] PostgreSQL is running: `pg_ctl status`
- [ ] Database exists: `psql -U postgres -l | findstr emirati`
- [ ] Tables exist: `psql -U postgres -d emirati_journey -c "\dt"`
- [ ] Backend is running: `curl http://localhost:5003/health`
- [ ] Frontend is running: Browser shows `http://localhost:3000`
- [ ] No console errors: Check browser developer tools (F12)
- [ ] Correct branch: `git branch` shows `cursor/develop-recruiter-backend-services-6877`

---

## Quick Commands Reference

```powershell
# Start PostgreSQL
pg_ctl start -D "C:\Program Files\PostgreSQL\14\data"

# Pull latest code
cd C:\path\to\Emirati_Pathways
git pull origin cursor/develop-recruiter-backend-services-6877

# Run test data script
python create_test_data.py

# Start backend
cd backend
python app.py

# Start frontend (new window)
cd frontend
npm start

# Test in browser
# http://localhost:8080/recruiter-dashboard
```

---

## Next Steps After Testing

Once you confirm everything works:

1. **Code review**: Review the changes with your team
2. **User acceptance testing**: Have recruiters test the features
3. **Merge to main**: Merge the branch if all tests pass
4. **Deploy to staging**: Test in staging environment
5. **Production deployment**: Deploy to production

---

## Need Help?

If you encounter any issues:

1. **Copy the error message** exactly
2. **Share which step** you're on
3. **Share the output** of relevant commands
4. **Share screenshots** if it's a UI issue

I'll help you diagnose and fix the issue!

---

**Ready to start?** Begin with Step 1 and let me know how it goes! 🚀

