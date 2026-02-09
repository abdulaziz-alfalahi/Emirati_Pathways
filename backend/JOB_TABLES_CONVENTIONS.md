# Job Tables Conventions

## Overview

This project uses two job-related tables that serve **different purposes**. Understanding when to use each is critical to avoid data inconsistencies.

## Table Purposes

| Table | Purpose | Primary Users |
|-------|---------|---------------|
| **`job_descriptions`** | Internal JD drafts and builder data | Recruiters, HR Analytics |
| **`job_postings`** | Published jobs visible to candidates | Candidates, Job Matching |

## Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          RECRUITER WORKFLOW                              │
│                                                                          │
│   [Recruiter creates JD]                                                 │
│           │                                                              │
│           ▼                                                              │
│   ┌───────────────────┐                                                 │
│   │ job_descriptions  │  ← Draft/internal JD data                       │
│   │  (is_active=true) │    - Parsed JD content                          │
│   └─────────┬─────────┘    - Quality/compliance scores                  │
│             │                - Skills requirements                       │
│             │ [Publish]                                                  │
│             ▼                                                            │
│   ┌───────────────────┐                                                 │
│   │   job_postings    │  ← Published/active job listing                 │
│   │ (status='published') │  - Candidate-facing details                  │
│   └─────────┬─────────┘    - Application tracking                       │
│             │                - Views/applications counts                 │
│             ▼                                                            │
│   [Candidates see job in Job Matches]                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## When to Use Each Table

### Use `job_descriptions` When:
- Building/editing JD content (JD Builder feature)
- Displaying recruiter's draft JDs
- Calculating JD quality/compliance scores
- Recruiter analytics and reports
- Internal HR operations

### Use `job_postings` When:
- Showing jobs to candidates (Job Matches)
- Processing job applications
- Tracking application counts and views
- External job distribution (NAFIS, job boards)
- Any candidate-facing feature

## Key Relationships

```sql
-- job_postings links to job_descriptions via jd_id
job_postings.jd_id → job_descriptions.id (optional)

-- Applications reference job_postings
job_applications.job_id → job_postings.id
```

## Status Fields

### `job_descriptions.is_active`
- `true` = JD is active/in use
- `false` = JD is archived/deleted

### `job_postings.status`
- `'draft'` = Not yet published
- `'published'` = Visible to candidates
- `'active'` = Currently accepting applications
- `'closed'` = No longer accepting applications

## Code Examples

### ✅ Correct: Candidate job matching
```python
# candidate_job_routes.py
SELECT * FROM job_postings WHERE status = 'published' OR status = 'active'
```

### ✅ Correct: Recruiter viewing their JDs
```python
# recruiter_dashboard_api.py
SELECT * FROM job_descriptions WHERE user_id = :recruiter_id
```

### ❌ Incorrect: Don't mix tables
```python
# DON'T DO THIS - candidates shouldn't query job_descriptions directly
SELECT * FROM job_descriptions WHERE is_active = true  # Wrong for candidates!
```

## Migration Note

When creating a new job, the typical flow is:
1. Create entry in `job_descriptions` (via JD Builder)
2. When ready to publish, create entry in `job_postings` with `jd_id` reference
3. Candidates see jobs from `job_postings` only

---

*Last updated: 2026-02-06*
