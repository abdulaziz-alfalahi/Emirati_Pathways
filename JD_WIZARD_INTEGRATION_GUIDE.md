# Job Description Wizard Integration Guide

## How to Access the Recruiter Dashboard

### Option 1: Direct URL Navigation

After logging in, navigate to:
```
http://localhost:3000/recruiter-dashboard
```

### Option 2: Login as Recruiter

1. Go to `http://localhost:3000/auth` or `http://localhost:3000/mock-login`
2. Login with a recruiter account
3. You'll be automatically redirected to `/recruiter-dashboard`

### Option 3: From Home Page

1. Go to `http://localhost:3000`
2. Click "Login" or "Sign In"
3. Select role: **Recruiter**
4. Enter credentials
5. Dashboard will load automatically

## Existing Recruiter Routes

The platform already has these recruiter routes set up:

- `/recruiter-dashboard` - Main dashboard
- `/recruiter/jobs` - Job listings
- `/recruiter/jobs/new` - Create new job (NewJobWizard)
- `/recruiter/jobs/:id` - Job details
- `/recruiter/candidates` - Candidate management
- `/recruiter/offers` - Offer management
- `/recruiter/approvals` - Approval workflows
- `/recruiter/distribution` - External distribution
- `/recruiter/analytics` - Analytics page
- `/recruiter/interviews/schedule` - Interview scheduling
- `/recruiter/jd-templates` - JD templates

## Integrating the Job Description Wizard

You have **two options** for integrating the new JD Wizard:

### Option A: Replace Existing NewJobWizard (Recommended)

The platform already has a route `/recruiter/jobs/new` that uses `NewJobWizard`. You can replace it with our new wizard.

**Step 1:** Update `App.tsx`

Find this section (around line 33):
```tsx
const NewJobWizard = lazy(() => import('@/pages/recruiter/NewJobWizard'));
```

Replace with:
```tsx
const NewJobWizard = lazy(() => import('@/pages/recruiter/NewJobWizard'));
const JobDescriptionWizard = lazy(() => import('@/pages/recruiter/JobDescriptionWizardPage'));
```

**Step 2:** Create the page wrapper

Create `/frontend/src/pages/recruiter/JobDescriptionWizardPage.tsx`:

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import JobDescriptionWizard from '@/components/recruiter/job-descriptions/JobDescriptionWizard';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';

const JobDescriptionWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = (jdId: string) => {
    console.log('JD created:', jdId);
    // Navigate to job details or jobs list
    navigate('/recruiter/jobs');
  };

  const handleCancel = () => {
    navigate('/recruiter/jobs');
  };

  return (
    <div className="min-h-screen bg-background">
      <HybridGovernmentNavFixed />
      <div className="container mx-auto py-8">
        <JobDescriptionWizard
          recruiterId={user?.id || ''}
          companyId={user?.company_id || ''}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default JobDescriptionWizardPage;
```

**Step 3:** Update the route in `App.tsx`

Find the route (around line 145):
```tsx
<Route 
  path="/recruiter/jobs/new" 
  element={
    <ProtectedRoute>
      <NewJobWizard />
    </ProtectedRoute>
  } 
/>
```

Replace with:
```tsx
<Route 
  path="/recruiter/jobs/new" 
  element={
    <ProtectedRoute>
      <JobDescriptionWizard />
    </ProtectedRoute>
  } 
/>
```

### Option B: Add as Separate Route

Keep the existing wizard and add ours as a new route.

**Step 1:** Add the import in `App.tsx`:
```tsx
const JobDescriptionWizard = lazy(() => import('@/pages/recruiter/JobDescriptionWizardPage'));
```

**Step 2:** Add a new route:
```tsx
<Route 
  path="/recruiter/jd-builder" 
  element={
    <ProtectedRoute>
      <JobDescriptionWizard />
    </ProtectedRoute>
  } 
/>
```

**Step 3:** Add navigation button in RecruiterDashboard

In `/frontend/src/pages/RecruiterDashboard.tsx`, add a button to navigate to the wizard:

```tsx
<Link to="/recruiter/jd-builder">
  <Button className="w-full">
    <Plus className="mr-2 h-4 w-4" />
    Create Job Description (New Wizard)
  </Button>
</Link>
```

## Quick Start - Minimal Integration

If you want to test it quickly without modifying existing files:

**Step 1:** Create a test page at `/frontend/src/pages/TestJDWizard.tsx`:

```tsx
import React from 'react';
import JobDescriptionWizard from '@/components/recruiter/job-descriptions/JobDescriptionWizard';

const TestJDWizard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <JobDescriptionWizard
        recruiterId="test_recruiter_123"
        companyId="test_company_456"
        onComplete={(jdId) => console.log('JD created:', jdId)}
        onCancel={() => console.log('Cancelled')}
      />
    </div>
  );
};

export default TestJDWizard;
```

**Step 2:** Add route in `App.tsx`:

```tsx
// Add import
const TestJDWizard = lazy(() => import('@/pages/TestJDWizard'));

// Add route (in the Routes section)
<Route path="/test-jd-wizard" element={<TestJDWizard />} />
```

**Step 3:** Navigate to:
```
http://localhost:3000/test-jd-wizard
```

## Adding to Recruiter Dashboard

To add a button to the main dashboard that opens the wizard:

**Edit:** `/frontend/src/pages/RecruiterDashboard.tsx`

Find the section with action buttons (usually in the header or quick actions area) and add:

```tsx
<Link to="/recruiter/jd-builder">
  <Button size="lg" className="gap-2">
    <Plus className="h-5 w-5" />
    Create Job Description
  </Button>
</Link>
```

Or if you want a card in the dashboard:

```tsx
<Card className="hover:shadow-lg transition-shadow cursor-pointer">
  <Link to="/recruiter/jd-builder">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Briefcase className="h-5 w-5" />
        Job Description Builder
      </CardTitle>
      <CardDescription>
        Create professional job descriptions with AI-powered candidate matching
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button className="w-full">
        Start Building
      </Button>
    </CardContent>
  </Link>
</Card>
```

## Testing the Integration

### 1. Start the Backend
```powershell
cd backend
python recruiter_server.py
```

### 2. Start the Frontend
```powershell
cd frontend
npm run dev
```

### 3. Navigate to Recruiter Dashboard

**URL:** `http://localhost:3000/recruiter-dashboard`

### 4. Click "Create Job Description"

This will open the wizard.

### 5. Test the Wizard Flow

1. **Step 1:** Fill in basic information
   - Job title: "Senior Software Engineer"
   - Department: "Engineering"
   - Location: Dubai
   - Job type: Full-time
   - Job level: Senior

2. **Step 2:** Add job description
   - Write or generate with AI

3. **Step 3:** Add requirements
   - Add 3-5 requirements
   - Mark some as required

4. **Step 4:** Add responsibilities
   - Add 3-5 responsibilities

5. **Step 5:** Add benefits
   - Add 2-3 benefits

6. **Step 6:** Set compensation
   - Min: 15000 AED
   - Max: 25000 AED

7. **Step 7:** Review & Match
   - Check completion score (should be 80%+)
   - Select employment status filter
   - Click "Find Top 10 Candidates"
   - Review matched candidates

### 6. Verify API Calls

Open browser DevTools (F12) → Network tab:
- Should see calls to `/api/recruiter/jd/*`
- Check for successful responses (200 status)

## Troubleshooting

### Issue: "Cannot find module" errors

**Solution:**
```powershell
cd frontend
npm install
# or
pnpm install
```

### Issue: API calls failing (404 or 500)

**Solution:**
1. Check backend is running: `http://localhost:5003/health`
2. Check backend logs in PowerShell
3. Verify `.env` file has correct database credentials

### Issue: Components not rendering

**Solution:**
1. Check browser console for errors
2. Verify all imports are correct
3. Check that UI components are installed:
   ```powershell
   npm install @radix-ui/react-progress @radix-ui/react-avatar
   ```

### Issue: "User not authenticated"

**Solution:**
1. Login first at `/auth` or `/mock-login`
2. Make sure you're logged in as a recruiter
3. Check `AuthContext` is providing user data

## API Configuration

If your backend runs on a different port, update the API base URL:

**Create/Edit:** `/frontend/src/config/api.ts`

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5003',
  RECRUITER_API: '/api/recruiter',
  TIMEOUT: 30000
};
```

Then use it in your API calls:

```typescript
import { API_CONFIG } from '@/config/api';

const response = await fetch(
  `${API_CONFIG.BASE_URL}${API_CONFIG.RECRUITER_API}/jd/create`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }
);
```

## Next Steps

After integration:

1. **Test all wizard steps** - Ensure each step saves data correctly
2. **Test AI matching** - Try different employment status filters
3. **Test with real data** - Create actual job descriptions
4. **Customize styling** - Adjust colors, spacing to match your theme
5. **Add analytics** - Track wizard completion rates
6. **Add notifications** - Toast messages for success/error states

## Support

If you encounter issues:

1. Check browser console for errors
2. Check backend logs in PowerShell
3. Review `RECRUITER_SERVICES_README.md` for detailed API docs
4. Run validation tests: `python backend/test_recruiter_module.py`

## Summary

**Recommended Path:**
1. Create `JobDescriptionWizardPage.tsx` wrapper
2. Add route to `App.tsx` as `/recruiter/jd-builder`
3. Add button in `RecruiterDashboard.tsx`
4. Test the flow end-to-end
5. Customize as needed

**Quick Test Path:**
1. Create `TestJDWizard.tsx`
2. Add route as `/test-jd-wizard`
3. Navigate directly to test URL
4. Verify everything works
5. Then integrate into main dashboard

Choose the path that works best for your workflow!

