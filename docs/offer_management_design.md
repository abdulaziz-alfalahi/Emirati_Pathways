# Offer Management Module - Design Document

## Overview
The Offer Management Module enables recruiters to generate, send, track, and manage job offers to candidates throughout the hiring process.

---

## Database Schema

### Table: `job_offers`

```sql
CREATE TABLE job_offers (
    offer_id VARCHAR(50) PRIMARY KEY,
    jd_id VARCHAR(50) NOT NULL,
    shortlist_id VARCHAR(50) NOT NULL,
    candidate_id VARCHAR(50) NOT NULL,
    recruiter_id VARCHAR(50) NOT NULL,
    
    -- Offer Details
    position_title VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    employment_type VARCHAR(50) NOT NULL, -- full_time, part_time, contract, internship
    start_date DATE,
    
    -- Compensation
    salary_amount DECIMAL(12, 2) NOT NULL,
    salary_currency VARCHAR(10) DEFAULT 'AED',
    salary_period VARCHAR(20) DEFAULT 'annual', -- annual, monthly, hourly
    bonus_amount DECIMAL(12, 2),
    equity_percentage DECIMAL(5, 2),
    
    -- Benefits
    benefits JSONB, -- {health_insurance, housing_allowance, transportation, etc}
    
    -- Offer Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, accepted, rejected, withdrawn, expired
    offer_date TIMESTAMP,
    expiry_date DATE,
    response_deadline DATE,
    
    -- Response Details
    candidate_response VARCHAR(50), -- accepted, rejected, negotiating
    response_date TIMESTAMP,
    response_notes TEXT,
    
    -- Negotiation
    negotiation_status VARCHAR(50), -- none, in_progress, completed
    negotiation_rounds INTEGER DEFAULT 0,
    negotiation_notes TEXT,
    
    -- Contract Details
    contract_duration_months INTEGER,
    probation_period_months INTEGER,
    notice_period_days INTEGER,
    work_location VARCHAR(255),
    remote_work_policy VARCHAR(50), -- on_site, hybrid, remote
    
    -- Documents
    offer_letter_url TEXT,
    contract_url TEXT,
    additional_documents JSONB,
    
    -- Approval Workflow
    approval_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    approved_by VARCHAR(50),
    approval_date TIMESTAMP,
    approval_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    notes TEXT
);

CREATE INDEX idx_offers_jd ON job_offers(jd_id);
CREATE INDEX idx_offers_candidate ON job_offers(candidate_id);
CREATE INDEX idx_offers_status ON job_offers(status);
CREATE INDEX idx_offers_recruiter ON job_offers(recruiter_id);
```

### Table: `offer_templates`

```sql
CREATE TABLE offer_templates (
    template_id VARCHAR(50) PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- full_time, contract, internship
    
    -- Template Content
    subject_template TEXT,
    body_template TEXT, -- HTML template with variables
    
    -- Default Values
    default_benefits JSONB,
    default_probation_months INTEGER,
    default_notice_days INTEGER,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);
```

### Table: `offer_history`

```sql
CREATE TABLE offer_history (
    history_id SERIAL PRIMARY KEY,
    offer_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL, -- created, sent, viewed, accepted, rejected, withdrawn, updated
    action_by VARCHAR(50),
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    changes JSONB, -- Track what changed
    notes TEXT
);

CREATE INDEX idx_offer_history_offer ON offer_history(offer_id);
```

---

## Backend API Endpoints

### Offer Management

#### 1. Create Offer
```
POST /api/recruiter/offers/create
Body: {
    jd_id, shortlist_id, candidate_id, recruiter_id,
    position_title, employment_type, start_date,
    salary_amount, salary_currency, salary_period,
    bonus_amount, equity_percentage, benefits,
    contract_duration_months, probation_period_months,
    notice_period_days, work_location, remote_work_policy,
    response_deadline, notes
}
Response: { success, offer_id, message }
```

#### 2. Get Offers by JD
```
GET /api/recruiter/offers/jd/{jd_id}
Response: { success, offers: [...] }
```

#### 3. Get Offer Details
```
GET /api/recruiter/offers/{offer_id}
Response: { success, offer: {...} }
```

#### 4. Update Offer
```
PUT /api/recruiter/offers/{offer_id}
Body: { updated fields }
Response: { success, message }
```

#### 5. Send Offer
```
POST /api/recruiter/offers/{offer_id}/send
Body: { send_method: 'email', message }
Response: { success, message }
```

#### 6. Withdraw Offer
```
POST /api/recruiter/offers/{offer_id}/withdraw
Body: { reason }
Response: { success, message }
```

#### 7. Record Candidate Response
```
POST /api/recruiter/offers/{offer_id}/response
Body: { response: 'accepted'|'rejected'|'negotiating', notes }
Response: { success, message }
```

#### 8. Start Negotiation
```
POST /api/recruiter/offers/{offer_id}/negotiate
Body: { proposed_changes, notes }
Response: { success, message }
```

#### 9. Approve Offer
```
POST /api/recruiter/offers/{offer_id}/approve
Body: { approved_by, notes }
Response: { success, message }
```

#### 10. Get Offer Statistics
```
GET /api/recruiter/offers/stats/{jd_id}
Response: {
    success,
    stats: {
        total_offers, sent, pending, accepted, rejected,
        avg_response_time, acceptance_rate
    }
}
```

#### 11. Generate Offer Letter
```
POST /api/recruiter/offers/{offer_id}/generate-letter
Body: { template_id }
Response: { success, letter_url }
```

### Template Management

#### 12. Get Templates
```
GET /api/recruiter/offers/templates
Response: { success, templates: [...] }
```

#### 13. Create Template
```
POST /api/recruiter/offers/templates/create
Body: { template_name, template_type, subject_template, body_template, default_benefits }
Response: { success, template_id }
```

---

## Frontend Components

### 1. OfferManager (Main Component)
- **Location:** `frontend/src/components/recruiter/offers/OfferManager.tsx`
- **Features:**
  - Statistics dashboard
  - Offers list table
  - Filter by status
  - Search functionality
  - Create offer button

### 2. CreateOfferDialog
- **Location:** `frontend/src/components/recruiter/offers/CreateOfferDialog.tsx`
- **Features:**
  - Multi-step form (Position → Compensation → Benefits → Contract)
  - Candidate selection
  - Salary calculator
  - Benefits checklist
  - Template selection
  - Preview before creation

### 3. OfferDetailsDialog
- **Location:** `frontend/src/components/recruiter/offers/OfferDetailsDialog.tsx`
- **Features:**
  - View full offer details
  - Timeline of actions
  - Send offer button
  - Edit offer button
  - Withdraw offer button
  - Download offer letter

### 4. NegotiationDialog
- **Location:** `frontend/src/components/recruiter/offers/NegotiationDialog.tsx`
- **Features:**
  - Track negotiation rounds
  - Proposed changes comparison
  - Counter-offer form
  - Negotiation history

### 5. OfferTemplateManager
- **Location:** `frontend/src/components/recruiter/offers/OfferTemplateManager.tsx`
- **Features:**
  - List templates
  - Create/edit templates
  - Preview templates
  - Variable insertion

---

## Integration Points

### With Shortlist Manager
- **"Make Offer" button** for each shortlisted candidate
- Automatically populate candidate details
- Update candidate status to "offer_sent"

### With Interview Scheduler
- Link to completed interviews
- Show interview feedback when creating offer

### With Communication Module
- Send offer via email
- Track offer email opens
- Automated reminders before expiry

---

## Offer Status Workflow

```
draft → sent → viewed → accepted/rejected/negotiating
                ↓
            expired (if deadline passed)
            withdrawn (by recruiter)
```

---

## Variable Substitution in Templates

Available variables:
- `{candidate_name}` - Full name
- `{position_title}` - Job title
- `{company_name}` - Company name
- `{salary_amount}` - Formatted salary
- `{start_date}` - Formatted start date
- `{benefits_list}` - HTML list of benefits
- `{response_deadline}` - Deadline date
- `{recruiter_name}` - Recruiter name
- `{recruiter_email}` - Contact email

---

## Business Logic

### Offer Creation
1. Validate candidate is in shortlist
2. Check if candidate already has active offer
3. Generate unique offer_id
4. Set status to 'draft'
5. Calculate expiry date (default: 7 days from send date)

### Sending Offer
1. Validate offer is in 'draft' status
2. Update status to 'sent'
3. Set offer_date to current timestamp
4. Generate offer letter PDF
5. Send email to candidate
6. Log action in offer_history
7. Update candidate status in shortlist

### Candidate Response
1. Validate offer is in 'sent' or 'viewed' status
2. Update status based on response
3. Record response_date
4. If accepted: trigger onboarding workflow
5. If rejected: log reason and close offer
6. If negotiating: create negotiation record

### Offer Expiry
- Automated job to check expiry_date
- If current_date > expiry_date and status = 'sent': set status to 'expired'
- Send notification to recruiter

---

## Security & Permissions

- Only assigned recruiter can edit/withdraw offer
- Approval required for offers above salary threshold
- Audit trail for all offer changes
- Candidate can only view their own offers

---

## Notifications

- **To Candidate:**
  - Offer sent
  - Offer expiring soon (2 days before)
  
- **To Recruiter:**
  - Offer accepted/rejected
  - Offer expiring soon
  - Negotiation initiated
  - Approval required

---

## Reporting & Analytics

- Offer acceptance rate by position/department
- Average time to accept
- Salary benchmarking
- Offer conversion funnel
- Negotiation success rate

---

## Future Enhancements

1. **E-signature Integration** - DocuSign, Adobe Sign
2. **Offer Comparison** - Side-by-side comparison for candidates
3. **Automated Approval Workflow** - Multi-level approvals
4. **Salary Benchmarking** - Market data integration
5. **Onboarding Integration** - Automatic onboarding trigger on acceptance

