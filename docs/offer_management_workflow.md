# Offer Management Workflow Guide

## Overview

The Offer Management module follows a structured workflow with different capabilities at each stage. Understanding when you can **edit** vs **negotiate** is crucial for proper usage.

---

## Offer Lifecycle & Permissions

### 1. **Draft Status**
- ✅ **Can Edit**: Yes - Full editing of all offer fields
- ✅ **Can Approve**: Yes - Move to approved status
- ✅ **Can Delete**: Yes
- ❌ **Can Send**: No (must be approved first)
- ❌ **Can Negotiate**: No (not sent yet)

**Actions Available:**
- Edit offer details (salary, benefits, dates, etc.)
- Request approval
- Delete draft

---

### 2. **Pending Approval Status**
- ✅ **Can Edit**: Yes - Full editing of all offer fields
- ✅ **Can Approve**: Yes - Manager can approve
- ✅ **Can Reject**: Yes - Manager can reject
- ❌ **Can Send**: No (must be approved first)
- ❌ **Can Negotiate**: No (not sent yet)

**Actions Available:**
- Edit offer details
- Approve (moves to Approved status)
- Reject (moves back to Draft or Rejected)

---

### 3. **Approved Status**
- ❌ **Can Edit**: No - Offer is locked after approval
- ✅ **Can Send**: Yes - Send to candidate
- ❌ **Can Negotiate**: No (not sent yet)

**Actions Available:**
- Send offer to candidate (moves to Sent status)

---

### 4. **Sent Status**
- ❌ **Can Edit**: No - Offer is with candidate
- ✅ **Can Record Response**: Yes - Record candidate's response
- ✅ **Can Withdraw**: Yes - Withdraw the offer
- ❌ **Can Negotiate**: Not yet (waiting for candidate response)

**Actions Available:**
- Record candidate response:
  - **Accepted** → Moves to Accepted status
  - **Rejected** → Moves to Rejected status
  - **Negotiating** → Moves to Negotiating status
- Withdraw offer

---

### 5. **Negotiating Status** ⭐ **Current Focus**
- ❌ **Can Edit**: **NO** - Cannot directly edit the offer
- ✅ **Can Negotiate**: **YES** - Add negotiation proposals
- ✅ **Can Withdraw**: Yes - Withdraw the offer

**Actions Available:**
- **Negotiate** button → Opens Negotiation Dialog
  - Add salary proposals
  - Add benefits adjustments
  - Add notes
  - Track negotiation history
- Withdraw offer

**Important:** 
- Negotiation entries **DO NOT change the actual offer**
- They create a **negotiation history** for tracking
- To finalize a negotiated offer, you would need to:
  1. Withdraw the current offer
  2. Create a new offer with the agreed terms
  3. Send the new offer

---

### 6. **Accepted Status**
- ❌ **Can Edit**: No - Offer accepted, final
- ❌ **Can Negotiate**: No - Deal closed
- ✅ **Can View**: Yes - Read-only

---

### 7. **Rejected Status**
- ❌ **Can Edit**: No - Offer rejected
- ❌ **Can Negotiate**: No - Candidate declined
- ✅ **Can View**: Yes - Read-only

---

### 8. **Withdrawn Status**
- ❌ **Can Edit**: No - Offer withdrawn by company
- ❌ **Can Negotiate**: No - Offer cancelled
- ✅ **Can View**: Yes - Read-only

---

## How to Edit an Offer

### For Draft or Pending Approval Offers:

1. **Open Offer Manager**
   - Click "Manage Offers" button in Shortlist Manager

2. **View Offer Details**
   - Click the eye icon (👁️) next to the offer

3. **Enter Edit Mode**
   - Click the **"Edit"** button (pencil icon) at the bottom of the dialog
   - The salary, start date, and response deadline fields become editable

4. **Make Changes**
   - Update the salary amount
   - Change the start date
   - Modify the response deadline

5. **Save Changes**
   - Click **"Save Changes"** button
   - The offer is updated in the database
   - The dialog refreshes to show the new values

---

## How to Negotiate an Offer

### For Negotiating Status Offers:

1. **Open Offer Manager**
   - Click "Manage Offers" button in Shortlist Manager

2. **View Offer Details**
   - Click the eye icon (👁️) next to the offer
   - Verify status is "NEGOTIATING"

3. **Open Negotiation Dialog**
   - Click the **"NEGOTIATE"** button (purple) at the bottom

4. **Add Negotiation Entry**
   - **Proposed Salary**: Enter the new salary amount (e.g., 200,000)
   - **Housing Allowance**: Optional - adjust housing allowance
   - **Transportation Allowance**: Optional - adjust transportation
   - **Notes**: Add context (e.g., "Candidate requested 5% increase")

5. **Submit Entry**
   - Click **"Add Entry"**
   - The entry is saved to negotiation history
   - The timeline updates to show the new proposal

6. **View Negotiation History**
   - The negotiation dialog shows all previous entries
   - Each entry displays:
     - Who made the proposal (Recruiter or Candidate)
     - Proposed salary with % change indicator
     - Proposed benefits changes
     - Notes and context
     - Timestamp

---

## Database Schema

### Negotiation History Structure

The `negotiation_notes` column in the old schema stores negotiation data as text. The new schema (when migrated) will use a JSONB column `negotiation_history` with this structure:

```json
[
  {
    "party": "recruiter",
    "proposed_salary": 200000,
    "proposed_benefits": {
      "housing_allowance": 40000,
      "transportation_allowance": 15000
    },
    "notes": "Candidate requested 5% increase due to market rate",
    "timestamp": "2025-11-02T23:15:00Z"
  },
  {
    "party": "candidate",
    "proposed_salary": 195000,
    "notes": "Counter-offer: willing to meet halfway",
    "timestamp": "2025-11-02T23:30:00Z"
  }
]
```

---

## Current Database Status

⚠️ **Important**: Your database is using the **old schema** from `hr_offer_routes.py`:

**Old Schema Columns:**
- `negotiation_status` (VARCHAR)
- `negotiation_rounds` (INTEGER)
- `negotiation_notes` (TEXT)

**New Schema Columns (not yet in your DB):**
- `negotiation_history` (JSONB)
- `sent_at` (TIMESTAMP)
- `candidate_response_at` (TIMESTAMP)

**Impact:**
- Negotiation entries are being saved to `negotiation_notes` as text
- The negotiation history timeline may not display correctly
- Some features may not work as expected

**Recommendation:**
- Consider migrating to the new schema for full functionality
- Or update the new code to work with the old schema

---

## Testing Checklist

### Test Edit Functionality (Draft Offers):
- [ ] Create a new offer (status: draft)
- [ ] Click "View Details" → Click "Edit"
- [ ] Change salary from 180,000 to 190,000
- [ ] Click "Save Changes"
- [ ] Verify salary updates in the dialog
- [ ] Close and reopen details
- [ ] Verify salary persists

### Test Negotiation Functionality (Negotiating Offers):
- [ ] Create an offer and send it
- [ ] Record response as "Negotiating"
- [ ] Click "View Details" → Click "NEGOTIATE"
- [ ] Add negotiation entry with higher salary
- [ ] Click "Add Entry"
- [ ] Verify entry appears in timeline
- [ ] Add another entry
- [ ] Verify both entries show in history
- [ ] Close and reopen negotiation dialog
- [ ] Verify history persists

---

## Troubleshooting

### "No Edit button in Offer Details"
**Cause**: Offer is not in Draft or Pending Approval status  
**Solution**: Check offer status. Use Negotiate feature for offers in Negotiating status.

### "Negotiation entries not appearing"
**Cause**: Database schema mismatch or frontend not reloading  
**Solution**: Check browser console for errors. Verify negotiation_history column exists.

### "Changes not saving"
**Cause**: Backend not receiving update request  
**Solution**: Check browser Network tab for PUT request. Check backend logs for errors.

---

## API Endpoints Reference

### Edit Offer
```
PUT /api/recruiter/offers/{offer_id}
Body: {
  "salary_amount": 200000,
  "start_date": "2025-12-01",
  "response_deadline": "2025-11-15"
}
```

### Add Negotiation Entry
```
POST /api/recruiter/offers/{offer_id}/negotiate
Body: {
  "party": "recruiter",
  "proposed_salary": 200000,
  "proposed_benefits": {
    "housing_allowance": 40000
  },
  "notes": "Candidate requested increase"
}
```

### Get Offer Details
```
GET /api/recruiter/offers/{offer_id}
Response: {
  "success": true,
  "offer": {
    "offer_id": "offer_xxx",
    "salary_amount": 190000,
    "status": "negotiating",
    "negotiation_history": [...]
  }
}
```

---

## Summary

✅ **Edit Mode** = Direct changes to the offer (Draft/Pending only)  
✅ **Negotiate Mode** = Proposal tracking (Negotiating status only)  
✅ **Different purposes** = Edit changes the offer, Negotiate tracks proposals  
✅ **Status-based** = Available actions depend on current offer status  

The system is designed to maintain offer integrity and track the negotiation process separately from the actual offer terms.

