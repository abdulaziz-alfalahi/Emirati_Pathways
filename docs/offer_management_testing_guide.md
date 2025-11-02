# Offer Management Module - Testing Guide

## Overview

This guide provides step-by-step instructions for testing the complete Offer Management module, including backend API endpoints and frontend user interface.

## Prerequisites

- Backend server running on port 5003
- Frontend dev server running on port 8080
- PostgreSQL database `emirati_journey` accessible
- At least one job description (JD) with shortlisted candidates

## Backend Testing (Already Completed ✅)

The backend API has been successfully tested using `test_offer_api.py`. All 10 endpoints are working correctly:

1. ✅ Create Offer - `POST /api/recruiter/offers/create`
2. ✅ Get All Offers - `GET /api/recruiter/offers/list/{jd_id}`
3. ✅ Get Offer Details - `GET /api/recruiter/offers/{offer_id}`
4. ✅ Update Offer - `PUT /api/recruiter/offers/{offer_id}`
5. ✅ Send Offer - `POST /api/recruiter/offers/{offer_id}/send`
6. ✅ Record Response - `POST /api/recruiter/offers/{offer_id}/response`
7. ✅ Start Negotiation - `POST /api/recruiter/offers/{offer_id}/negotiate`
8. ✅ Approve Offer - `POST /api/recruiter/offers/{offer_id}/approve`
9. ✅ Reject Offer - `POST /api/recruiter/offers/{offer_id}/reject`
10. ✅ Get Statistics - `GET /api/recruiter/offers/statistics/{jd_id}`

## Frontend Testing Steps

### Step 1: Pull Latest Changes

```powershell
git pull origin cursor/develop-recruiter-backend-services-6877
```

### Step 2: Restart Frontend Dev Server

```powershell
cd frontend
pnpm run dev
```

The frontend should compile successfully and be accessible at `http://localhost:8080`.

### Step 3: Navigate to Shortlist Manager

1. Open browser to `http://localhost:8080`
2. Navigate to a Job Description with shortlisted candidates
3. Click on "Shortlist Manager" or similar navigation option

### Step 4: Access Offer Management

In the Shortlist Manager interface, you should see a new button:

**"Manage Offers"** (green button with gift card icon)

Click this button to open the Offer Management interface.

### Step 5: Test Offer Management Dashboard

The Offer Manager should display:

**Statistics Cards:**
- Total Offers
- Sent
- Accepted
- Acceptance Rate
- Negotiating
- Pending Approval
- Rejected
- Draft

**Offers Table:**
- Candidate name and email
- Position title
- Salary and period
- Contract type
- Start date
- Status chip
- Created date
- Actions (View Details button)

### Step 6: Test Create Offer Workflow

Click **"Create New Offer"** button to open the multi-step wizard:

#### Step 1: Select Candidate
- Select a candidate from the dropdown (shows shortlisted candidates)
- Enter position title
- Verify candidate details are displayed
- Click **Next**

#### Step 2: Compensation Details
- Enter salary amount (e.g., 180000)
- Select currency (default: AED)
- Select period (annual/monthly)
- Click **Next**

#### Step 3: Contract Terms
- Select contract type (full-time, part-time, contract, temporary)
- Select start date (use date picker)
- Enter probation period in months (default: 3)
- Enter work location (e.g., "Dubai, UAE")
- Enter work schedule (e.g., "Monday-Friday, 9:00 AM - 6:00 PM")
- Click **Next**

#### Step 4: Benefits & Perks
- Enter annual leave days (default: 30)
- Enter flight tickets per year (default: 2)
- Enter housing allowance (optional)
- Enter transportation allowance (optional)
- Select health insurance (Yes/No)
- Add additional benefits (free text, press Enter to add)
- Click **Create Offer**

**Expected Result:** Success message, dialog closes, offer appears in table with status "draft"

### Step 7: Test Offer Details and Approval Workflow

Click **View Details** (eye icon) on an offer to open the Offer Details Dialog:

**Verify Display:**
- Candidate information section
- Status chip
- Position & Compensation details
- Contract details (type, start date, probation period, location, schedule)
- Benefits & Perks list
- Timeline (if applicable)

**Test Approval Workflow:**

1. **For Draft Offers:**
   - Click **Approve** button
   - Verify success message
   - Verify status changes to "approved"

2. **For Approved Offers:**
   - Click **Send Offer** button
   - Verify success message
   - Verify status changes to "sent"
   - Verify "Sent At" timestamp appears in timeline

3. **For Sent Offers:**
   - Click **Mark Accepted** to simulate candidate acceptance
   - OR click **Mark Rejected** to simulate rejection
   - OR click **Start Negotiation** to begin negotiation process
   - Verify status updates accordingly

### Step 8: Test Edit Functionality

For draft or pending approval offers:

1. Click **Edit** button in Offer Details Dialog
2. Modify salary amount
3. Change start date
4. Click **Save Changes**
5. Verify updates are reflected
6. Close and reopen to confirm persistence

### Step 9: Test Negotiation Workflow

For offers with status "negotiating":

1. Click **Negotiate** button in Offer Details Dialog
2. Negotiation Dialog should open showing:
   - Current offer summary
   - Negotiation history timeline (if any)
   - Form to add new negotiation entry

**Add Negotiation Entry:**
- Enter proposed salary (e.g., 190000)
- Verify salary change calculation is displayed
- Enter housing allowance adjustment (optional)
- Enter transportation allowance adjustment (optional)
- Add notes explaining the proposal
- Click **Add Entry**

**Expected Result:**
- Success message
- New entry appears in timeline with timestamp
- Salary change indicator (percentage increase/decrease)
- Entry tagged as "Recruiter"

### Step 10: Test Withdraw Functionality

For sent or negotiating offers:

1. Click **Withdraw** button
2. Confirm withdrawal in popup dialog
3. Verify status changes to "withdrawn"

### Step 11: Test Statistics Updates

After creating, approving, sending, and updating offers:

1. Return to Offer Manager main view
2. Verify statistics cards update in real-time:
   - Total offers count increases
   - Status-specific counts update
   - Acceptance rate calculates correctly

### Step 12: Test Multiple Offers

Create multiple offers with different statuses to verify:

- Table displays all offers correctly
- Filtering/sorting works (if implemented)
- Statistics aggregate correctly
- Each offer maintains independent state

## Common Issues and Troubleshooting

### Issue: "Manage Offers" button not appearing
**Solution:** Pull latest changes and restart frontend dev server

### Issue: "Failed to load offers" error
**Solution:** Verify backend server is running on port 5003

### Issue: Empty candidate dropdown in Create Offer
**Solution:** Ensure the job description has shortlisted candidates

### Issue: Offer creation fails
**Solution:** 
- Check browser console for errors
- Verify all required fields are filled
- Ensure backend API is accessible

### Issue: Statistics not updating
**Solution:**
- Close and reopen Offer Manager dialog
- Check network tab for failed API calls

## Expected Data Flow

```
1. User clicks "Manage Offers" in Shortlist Manager
   ↓
2. OfferManager loads offers and statistics from API
   ↓
3. User clicks "Create New Offer"
   ↓
4. CreateOfferDialog opens with multi-step wizard
   ↓
5. User completes all steps and submits
   ↓
6. API creates offer with status "draft"
   ↓
7. Offer appears in table, statistics update
   ↓
8. User clicks "View Details" on offer
   ↓
9. OfferDetailsDialog shows complete offer information
   ↓
10. User approves offer (status → "approved")
    ↓
11. User sends offer (status → "sent")
    ↓
12. User records candidate response or starts negotiation
    ↓
13. If negotiating, NegotiationDialog tracks proposals
    ↓
14. Final status: "accepted", "rejected", or "withdrawn"
```

## Database Verification

To verify offers are being stored correctly:

```sql
-- Connect to database
psql -U postgres -d emirati_journey

-- View all offers
SELECT offer_id, position_title, salary_amount, status, created_at 
FROM job_offers 
ORDER BY created_at DESC;

-- View offer with benefits
SELECT offer_id, position_title, benefits, negotiation_history 
FROM job_offers 
WHERE offer_id = 'offer_xxxxx';

-- View statistics
SELECT 
  status, 
  COUNT(*) as count 
FROM job_offers 
GROUP BY status;
```

## Success Criteria

The Offer Management module is fully functional if:

- ✅ All 4 frontend components render without errors
- ✅ "Manage Offers" button appears in Shortlist Manager
- ✅ Offer Manager displays statistics and table correctly
- ✅ Create Offer wizard completes all 4 steps successfully
- ✅ Offers are created with status "draft"
- ✅ Offer Details dialog shows complete information
- ✅ Approval workflow (draft → approved → sent) works
- ✅ Candidate response recording works (accepted/rejected/negotiating)
- ✅ Negotiation dialog tracks proposals with timeline
- ✅ Edit functionality updates offers correctly
- ✅ Withdraw functionality changes status
- ✅ Statistics update in real-time
- ✅ All data persists in PostgreSQL database

## Next Steps After Testing

Once testing is complete and all features are verified:

1. **Documentation:** Update user documentation with Offer Management workflows
2. **Integration:** Add Offer Management to main navigation menu
3. **Enhancements:** Consider adding:
   - PDF offer letter generation
   - Email integration for sending offers
   - Offer templates
   - Bulk offer creation
   - Advanced filtering and search
   - Export to Excel/CSV
4. **Analytics:** Build dashboard for offer analytics and trends
5. **Notifications:** Add automated reminders for pending approvals and response deadlines

## Support

If you encounter any issues during testing:

1. Check browser console for JavaScript errors
2. Check Network tab for failed API calls
3. Verify backend server logs for errors
4. Ensure database connection is active
5. Confirm all dependencies are installed (`pnpm install`)

---

**Module Status:** Ready for Testing ✅
**Last Updated:** 2025-01-XX
**Version:** 1.0.0

