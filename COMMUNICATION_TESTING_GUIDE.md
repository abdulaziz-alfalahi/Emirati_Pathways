# Communication Module - Testing Guide

## Prerequisites

Before testing, ensure:
- ✅ PostgreSQL is running
- ✅ Backend server is running on port 5003
- ✅ Frontend server is running on port 8080
- ✅ You have at least one candidate in the shortlist (from previous tests)

---

## PowerShell Testing Commands

### Step 1: Pull Latest Changes

**Run in: ROOT directory**

```powershell
cd C:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways

# Pull the latest changes
git pull origin cursor/develop-recruiter-backend-services-6877

# Verify new files exist
ls backend\recruiter\communication_engine.py
ls backend\recruiter\communication_routes.py
ls frontend\src\components\recruiter\communication\MessageComposer.tsx
ls COMMUNICATION_MODULE.md
```

---

### Step 2: Restart Backend Server

**Run in: BACKEND directory**

```powershell
cd backend

# Stop the current server (Ctrl+C in the terminal running it)
# Then restart:
C:\Users\user\anaconda3\python.exe recruiter_server.py
```

**Expected output should include:**
```
INFO:__main__:Registered: Communication routes for messaging candidates
INFO:__main__:Recruiter services running on http://0.0.0.0:5003
```

---

### Step 3: Test Backend API

**Open a NEW PowerShell window** and run these tests:

#### Test 1: Health Check

```powershell
Invoke-RestMethod -Uri "http://localhost:5003/api/recruiter/communication/health" -Method Get
```

**Expected:**
```
status  : healthy
service : Recruiter Communication API
```

---

#### Test 2: Get Message Templates

```powershell
$templates = Invoke-RestMethod -Uri "http://localhost:5003/api/recruiter/communication/templates" -Method Get
$templates.templates | Format-Table name, category, message_type
```

**Expected:**
```
name                 category             message_type
----                 --------             ------------
Initial Contact      initial_contact      email
Interview Invitation interview_invitation email
Interview Reminder   interview_reminder   both
Follow Up            follow_up            email
```

---

#### Test 3: Send Test Email

```powershell
# Send email to the test candidate we created earlier
$body = @{
    shortlist_ids = @("sl_20251030_232607_139190d1")
    message_type = "email"
    subject = "Test Communication Module"
    body = "Hello, this is a test message from the Communication Module."
    recruiter_id = "recruiter_456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5003/api/recruiter/communication/send" -Method Post -ContentType "application/json" -Body $body
```

**Expected response:**
```
success    : True
message    : Messages sent to 1/1 candidates
total      : 1
successful : 1
failed     : 0
results    : {@{shortlist_id=sl_...; candidate_id=candidate_123; ...}}
```

---

#### Test 4: Get Communication History

```powershell
Invoke-RestMethod -Uri "http://localhost:5003/api/recruiter/communication/history/candidate_123" -Method Get
```

**Expected:**
```
success : True
count   : 1
history : {@{log_id=log_...; message_type=email; subject=Test Communication Module; ...}}
```

---

#### Test 5: Get Communication Stats

```powershell
Invoke-RestMethod -Uri "http://localhost:5003/api/recruiter/communication/stats/jd_test_001" -Method Get
```

**Expected:**
```
success : True
stats   : @{total_messages=1; sent=1; delivered=0; failed=0; emails=1; sms_messages=0}
```

---

#### Test 6: Render Template with Variables

```powershell
$body = @{
    template_id = "Initial Contact"
    variables = @{
        candidate_name = "John Doe"
        company_name = "Emirati Pathways"
        job_title = "Senior Software Engineer"
        job_description = "We are looking for an experienced engineer..."
        recruiter_name = "Jane Smith"
    }
} | ConvertTo-Json

$rendered = Invoke-RestMethod -Uri "http://localhost:5003/api/recruiter/communication/templates/render" -Method Post -ContentType "application/json" -Body $body

Write-Host "Subject: $($rendered.subject)"
Write-Host "`nBody:`n$($rendered.body)"
```

**Expected:**
```
Subject: Opportunity at Emirati Pathways - Senior Software Engineer

Body:
Dear John Doe,

We came across your profile and believe you would be a great fit for the Senior Software Engineer position at Emirati Pathways.

We are looking for an experienced engineer...

We would love to discuss this opportunity with you. Are you available for a brief call this week?

Best regards,
Jane Smith
Emirati Pathways
```

---

### Step 4: Verify Database

**Connect to PostgreSQL:**

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U emirati_user -d emirati_journey
```

**Password:** `emirati_secure_password`

**Run these SQL queries:**

```sql
-- Check if communication_logs table exists
\dt communication_logs

-- View all communication logs
SELECT 
    log_id, 
    candidate_id, 
    message_type, 
    subject, 
    status, 
    sent_at,
    created_at
FROM communication_logs
ORDER BY created_at DESC;

-- Count messages by type
SELECT 
    message_type, 
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent
FROM communication_logs
GROUP BY message_type;

-- Exit
\q
```

**Expected:**
- Table `communication_logs` exists
- At least 1 row with your test message
- Status should be 'sent'
- `sent_at` timestamp should be set

---

### Step 5: Test Frontend

#### 5.1 Restart Frontend

**Run in: FRONTEND directory**

```powershell
cd C:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\frontend

# Stop frontend (Ctrl+C)
# Restart:
npm run dev
```

#### 5.2 Test in Browser

1. **Open:** http://localhost:8080
2. **Hard refresh:** Ctrl+Shift+R
3. Navigate to **Recruiter Dashboard** → **Job Descriptions**
4. Open the **Shortlist Manager** (you may need to add a route/button for this)

**Expected UI:**
- "Message Selected (0)" button in header (disabled when no selection)
- Checkboxes next to each candidate
- When candidates selected, button shows count and becomes enabled

#### 5.3 Test Message Composer

1. **Select one or more candidates** (click checkboxes)
2. **Click "Message Selected (N)" button**
3. **Message Composer dialog should open**

**Expected in dialog:**
- Recipients list on the left (showing selected candidates)
- Message type selector (Email/SMS/Both)
- "Use Template" button
- Subject field
- Message body field
- Variable hints at bottom
- "Send to N Candidate(s)" button

#### 5.4 Test Template Selection

1. **Click "Use Template" button**
2. **Template dialog opens** showing 4 templates
3. **Click on "Initial Contact" template**
4. **Dialog closes** and subject/body are populated

**Expected:**
- Subject: "Opportunity at {{company_name}} - {{job_title}}"
- Body: Template text with {{variables}}

#### 5.5 Send Test Message

1. **Fill in subject:** "Test Message from UI"
2. **Fill in body:** "Hello {{candidate_name}}, this is a test."
3. **Click "Send to N Candidate(s)"**

**Expected:**
- Loading spinner appears
- After 1-2 seconds, success alert shows
- "Messages sent to N/N candidates"
- Dialog closes after 2 seconds
- Toast notification (if implemented)

#### 5.6 Verify in Console

**Open browser console (F12):**
- Check for any errors
- Should see successful API calls to `/api/recruiter/communication/send`

---

## Testing Checklist

### ✅ Backend API Tests

- [ ] Health check returns healthy status
- [ ] Get templates returns 4 templates
- [ ] Send email creates log entry
- [ ] Get history returns sent messages
- [ ] Get stats returns correct counts
- [ ] Render template substitutes variables correctly
- [ ] Database table auto-creates
- [ ] Communication logs are saved

### ✅ Frontend Tests

- [ ] Frontend builds without errors
- [ ] MessageComposer component loads
- [ ] Template selector opens and displays templates
- [ ] Template selection populates subject/body
- [ ] Recipients list displays correctly
- [ ] Message type selector works
- [ ] Send button is disabled when body is empty
- [ ] Send button triggers API call
- [ ] Success message displays after sending
- [ ] Dialog closes after success

### ✅ Integration Tests

- [ ] ShortlistManager shows "Message Selected" button
- [ ] Button is disabled when no candidates selected
- [ ] Button shows correct count when candidates selected
- [ ] Clicking button opens MessageComposer
- [ ] Selected candidates are passed to composer
- [ ] After sending, shortlist refreshes (if implemented)

### ✅ Database Tests

- [ ] `communication_logs` table exists
- [ ] Logs are created with correct data
- [ ] Status is set to 'sent' for successful messages
- [ ] `sent_at` timestamp is set
- [ ] Metadata JSONB stores API response
- [ ] Foreign key to `candidate_shortlist` works

---

## Expected Results Summary

| Test | Expected Result |
|------|----------------|
| **Health Check** | Returns "healthy" status |
| **Get Templates** | Returns 4 default templates |
| **Send Email** | Returns success with log_id |
| **Get History** | Returns list of sent messages |
| **Get Stats** | Returns message counts |
| **Render Template** | Substitutes all variables |
| **Database Table** | Auto-creates on first use |
| **Frontend Load** | No console errors |
| **Template Dialog** | Shows 4 templates |
| **Send Message** | Success notification appears |

---

## Troubleshooting

### Issue: "Communication routes not found"

**Solution:**
```powershell
# Restart backend server
cd backend
C:\Users\user\anaconda3\python.exe recruiter_server.py
```

Check logs for:
```
INFO:__main__:Registered: Communication routes for messaging candidates
```

---

### Issue: "Failed to send email"

**Expected:** This is normal if SMTP is not configured. The system will log the message as "mock" but still save to database.

**To enable real email sending:**
1. Configure SMTP in `.env` file:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   FROM_EMAIL=noreply@emiratipathways.ae
   FROM_NAME=Emirati Pathways
   ```
2. Restart backend server

---

### Issue: "MessageComposer not found"

**Solution:**
```powershell
# Verify file exists
ls frontend\src\components\recruiter\communication\MessageComposer.tsx

# If missing, pull again
git pull origin cursor/develop-recruiter-backend-services-6877

# Restart frontend
cd frontend
npm run dev
```

---

### Issue: Database connection error

**Solution:**
```powershell
# Check PostgreSQL is running
Get-Service -Name postgresql-x64-17

# If not running, start it (as Administrator)
net start postgresql-x64-17

# Test connection
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U emirati_user -d emirati_journey
```

---

## Next Steps After Testing

Once all tests pass:

1. ✅ **Confirm with me** that everything works
2. 🎯 **Decide next feature:**
   - Interview Scheduling Module
   - Offer Management Module
   - Published Jobs Dashboard View
   - Create test candidate data

3. 📊 **Optional Enhancements:**
   - Add email template editor
   - Add scheduled messaging
   - Add email tracking
   - Integrate real SMS provider

---

## Quick Test Script

**Run all backend tests at once:**

```powershell
# Save this as test-communication.ps1
Write-Host "Testing Communication Module..." -ForegroundColor Green

# Test 1: Health
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:5003/api/recruiter/communication/health" -Method Get

# Test 2: Templates
Write-Host "`n2. Get Templates..." -ForegroundColor Yellow
$templates = Invoke-RestMethod -Uri "http://localhost:5003/api/recruiter/communication/templates" -Method Get
Write-Host "Found $($templates.count) templates"

# Test 3: Send Message
Write-Host "`n3. Send Test Message..." -ForegroundColor Yellow
$body = @{
    shortlist_ids = @("sl_20251030_232607_139190d1")
    message_type = "email"
    subject = "Automated Test"
    body = "This is an automated test message."
    recruiter_id = "recruiter_456"
} | ConvertTo-Json
$result = Invoke-RestMethod -Uri "http://localhost:5003/api/recruiter/communication/send" -Method Post -ContentType "application/json" -Body $body
Write-Host "Sent to $($result.successful)/$($result.total) candidates"

# Test 4: Get History
Write-Host "`n4. Get History..." -ForegroundColor Yellow
$history = Invoke-RestMethod -Uri "http://localhost:5003/api/recruiter/communication/history/candidate_123" -Method Get
Write-Host "Found $($history.count) messages in history"

# Test 5: Get Stats
Write-Host "`n5. Get Stats..." -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri "http://localhost:5003/api/recruiter/communication/stats/jd_test_001" -Method Get
Write-Host "Total messages: $($stats.stats.total_messages)"

Write-Host "`n✅ All tests completed!" -ForegroundColor Green
```

**Run it:**
```powershell
.\test-communication.ps1
```

---

## Success Criteria

Communication Module is **fully functional** when:

✅ All 5 API endpoints return successful responses  
✅ Database table auto-creates and stores logs  
✅ Templates load and render correctly  
✅ Frontend MessageComposer opens and displays  
✅ Messages can be sent without errors  
✅ Communication history is tracked  
✅ Stats are calculated correctly  

**Once all tests pass, the Communication Module is production-ready!** 🎉

