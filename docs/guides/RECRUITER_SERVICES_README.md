# Recruiter Services Implementation

## Overview

This implementation adds comprehensive recruiter services to the Emirati Human Resources Journey platform, following the same UX patterns as the CV-Builder service. The key feature is **AI-powered candidate matching with employment status filtering**, allowing recruiters to find top candidates before publishing job postings.

## Key Features

### 🎯 Job Description Builder Wizard
- **7-step wizard flow** for creating job descriptions
- **Real-time completion scoring** (0-100%)
- **AI-powered description generation**
- **Bilingual support** (English/Arabic with RTL)
- **UAE-specific validations** (Emirates, locations)

### 🤖 AI Candidate Matching
- **Top 10 candidate matching** based on job description
- **Employment status filtering**:
  - All Candidates
  - Job Seekers Only (actively looking)
  - Currently Employed (passive candidates)
  - Open to Opportunities
- **Detailed match scoring** with breakdown
- **Skills matching** analysis
- **Strengths and concerns** identification

### 📊 Completion Scoring
- Section-by-section progress tracking
- Actionable recommendations
- Publishing readiness indicators
- Weight-based scoring system

## Architecture

### Backend Structure

```
backend/
├── recruiter/
│   ├── __init__.py
│   ├── recruiter_engine.py          # Core data structures & business logic
│   ├── jd_builder_engine.py         # JD wizard engine with scoring
│   ├── ai_candidate_matching.py     # AI matching with employment filtering
│   └── jd_routes.py                 # API endpoints
├── recruiter_server.py               # Updated with new routes
└── test_recruiter_module.py         # Validation test suite
```

### Frontend Structure

```
frontend/src/components/recruiter/job-descriptions/
├── JobDescriptionWizard.tsx          # Main wizard component
├── JDScoringWidget.tsx               # Completion scoring widget
├── JDPreviewPanel.tsx                # Live preview panel
└── CandidateMatchingResults.tsx      # Matching results display
```

## API Endpoints

All endpoints are prefixed with `/api/recruiter/jd`

### Job Description Management

- **POST** `/create` - Create new job description
- **GET** `/<jd_id>` - Get job description
- **PUT** `/<jd_id>/basic-info` - Update basic information (Step 1)
- **PUT** `/<jd_id>/description` - Update description (Step 2)
- **POST** `/<jd_id>/requirements` - Add requirement (Step 3)
- **POST** `/<jd_id>/responsibilities` - Add responsibility (Step 4)
- **POST** `/<jd_id>/benefits` - Add benefit (Step 5)
- **PUT** `/<jd_id>/compensation` - Update compensation (Step 6)

### AI Features

- **POST** `/<jd_id>/generate-description` - Generate AI description
- **POST** `/<jd_id>/match-candidates` - **Match top 10 candidates**
  - Request body:
    ```json
    {
      "employment_status_filter": "job_seeker|employed|open_to_opportunities|null",
      "top_n": 10
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "job_id": "jd_123",
      "top_matches": [
        {
          "candidate": { ... },
          "match_score": 85.5,
          "score_breakdown": {
            "skills": 90,
            "experience": 85,
            "education": 80,
            "location": 100
          },
          "matching_skills": ["Python", "React", "AWS"],
          "missing_skills": ["Kubernetes"],
          "strengths": ["Strong skills match", "5 years experience"],
          "concerns": []
        }
      ],
      "match_count": 10,
      "total_candidates_reviewed": 150,
      "filtered_candidates": 45
    }
    ```

### Utility Endpoints

- **GET** `/<jd_id>/completion-score` - Get score & recommendations
- **POST** `/<jd_id>/validate` - Validate before publishing
- **GET** `/health` - Health check

## Wizard Steps

### Step 1: Basic Information
- Job title (English & Arabic)
- Department
- Job type (full-time, part-time, contract, etc.)
- Job level (entry, mid, senior, executive, etc.)
- Location (Emirate & City)
- Remote option

### Step 2: Job Description
- Detailed description
- AI generation option
- Character count tracking
- Arabic translation support

### Step 3: Requirements
- Categorized requirements (education, experience, skills, certification, language)
- Required vs. preferred
- Multiple entries

### Step 4: Responsibilities
- Core responsibilities
- Categorization
- Multiple entries

### Step 5: Benefits
- Categorized benefits (compensation, health, time off, development, perks)
- Multiple entries
- Bilingual descriptions

### Step 6: Compensation
- Salary range (min/max)
- Currency (AED)
- Additional compensation

### Step 7: Review & Match
- Summary view
- Completion score display
- **AI Candidate Matching**
- Employment status filter
- Top 10 results with actions

## Completion Scoring System

### Score Breakdown (Total: 100 points)

1. **Basic Information (25 points)**
   - Job title: 8 points
   - Department: 5 points
   - Job type: 4 points
   - Location (Emirate + City): 8 points

2. **Job Description (20 points)**
   - 200+ characters: 20 points
   - 100-199 characters: 10 points
   - <100 characters: 5 points

3. **Requirements (20 points)**
   - 5+ requirements: 20 points
   - 3-4 requirements: 15 points
   - 1-2 requirements: 10 points

4. **Responsibilities (20 points)**
   - 5+ responsibilities: 20 points
   - 3-4 responsibilities: 15 points
   - 1-2 responsibilities: 10 points

5. **Compensation (10 points)**
   - Both min & max: 10 points
   - One of them: 5 points

6. **Benefits (5 points)**
   - 3+ benefits: 5 points
   - 1-2 benefits: 3 points

### Score Thresholds

- **90-100%**: Excellent - Highly attractive to candidates
- **80-89%**: Great - Ready to publish
- **60-79%**: Good - Consider adding more details
- **Below 60%**: Needs improvement

## AI Candidate Matching

### Matching Algorithm

The AI matching engine uses a multi-factor scoring system:

1. **Skills Matching (40%)**
   - Exact skill matches
   - Related skills
   - Skill proficiency levels

2. **Experience Matching (30%)**
   - Years of experience
   - Relevant industry experience
   - Position levels

3. **Education Matching (15%)**
   - Degree level
   - Field of study
   - Certifications

4. **Location Matching (10%)**
   - Same emirate
   - Willing to relocate
   - Remote work preference

5. **UAE National Preference (5%)**
   - Bonus points for UAE nationals

### Employment Status Filtering

Recruiters can filter candidates by employment status:

- **All Candidates**: No filter applied
- **Job Seekers**: Actively looking for jobs (unemployed, actively_looking)
- **Currently Employed**: Passive candidates (employed, currently_employed)
- **Open to Opportunities**: Open to new roles (open_to_opportunities, passive, open)

This enables **targeted recruitment strategies**:
- Approach passive candidates for senior roles
- Focus on active job seekers for quick fills
- Build talent pipelines with "open to opportunities" candidates

## Installation & Setup

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Environment variables** (`.env`):
   ```env
   DB_HOST=localhost
   DB_NAME=emirati_journey
   DB_USER=emirati_user
   DB_PASSWORD=emirati_secure_password
   JWT_SECRET_KEY=your-secret-key
   GEMINI_API_KEY=your-gemini-api-key  # For AI features
   ```

3. **Run validation tests**:
   ```bash
   python3 test_recruiter_module.py
   ```

4. **Start the server**:
   ```bash
   python3 recruiter_server.py
   ```
   Server runs on port 5003 by default.

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   # or
   pnpm install
   ```

2. **Update API configuration** (if needed):
   ```typescript
   // In your API config file
   const API_BASE_URL = 'http://localhost:5003/api';
   ```

3. **Import and use components**:
   ```tsx
   import JobDescriptionWizard from '@/components/recruiter/job-descriptions/JobDescriptionWizard';
   import JDScoringWidget from '@/components/recruiter/job-descriptions/JDScoringWidget';
   import JDPreviewPanel from '@/components/recruiter/job-descriptions/JDPreviewPanel';
   import CandidateMatchingResults from '@/components/recruiter/job-descriptions/CandidateMatchingResults';

   // Use in your recruiter dashboard
   <JobDescriptionWizard
     recruiterId={currentUser.id}
     companyId={currentUser.company_id}
     onComplete={(jdId) => console.log('JD created:', jdId)}
     onCancel={() => navigate('/dashboard')}
   />
   ```

## Usage Workflow

### For Recruiters

1. **Start JD Creation**
   - Click "Create Job Description"
   - Enter basic information (title, location, type, level)

2. **Build Job Description**
   - Write or generate description with AI
   - Add requirements (education, experience, skills)
   - Add responsibilities
   - Add benefits
   - Set compensation range

3. **Review & Match Candidates**
   - Review completion score (aim for 80%+)
   - Select employment status filter
   - Click "Find Top 10 Candidates"
   - Review matched candidates with scores

4. **Shortlist & Decide**
   - View candidate profiles
   - Shortlist promising candidates
   - Download CVs
   - Decide whether to:
     - Directly contact shortlisted candidates
     - Publish job publicly for more applicants

5. **Publish or Save**
   - Publish job posting
   - Or save as draft for later

## Database Schema Considerations

The implementation expects the following database structure:

### Users Table (Candidates)
```sql
- id (candidate_id)
- first_name
- last_name
- email
- phone
- emirate
- nationality
- is_uae_national
- education_level
- experience_years
- current_position
- current_company
- employment_status  -- 'employed', 'job_seeker', 'open_to_opportunities'
- skills (array or JSON)
- cv_url
- linkedin_url
- is_active
```

### Job Descriptions Table (to be created)
```sql
CREATE TABLE job_descriptions (
    jd_id VARCHAR(255) PRIMARY KEY,
    recruiter_id VARCHAR(255) NOT NULL,
    company_id VARCHAR(255) NOT NULL,
    template VARCHAR(50),
    version INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'draft',
    completion_score INTEGER DEFAULT 0,
    basic_info JSONB,
    description TEXT,
    description_arabic TEXT,
    requirements JSONB,
    responsibilities JSONB,
    benefits JSONB,
    compensation JSONB,
    application_process JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    last_modified TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);
```

## Testing

### Backend Tests

Run the validation test suite:
```bash
cd backend
python3 test_recruiter_module.py
```

Expected output:
```
✓ IMPORTS: PASSED
✓ ENGINE_INIT: PASSED
✓ JD_CREATION: PASSED
✓ API_ROUTES: PASSED
✓ DATA_STRUCTURES: PASSED

Total: 5/5 tests passed
✓ ALL TESTS PASSED - Module is ready for use!
```

### Manual Testing

1. **Test JD Creation**:
   ```bash
   curl -X POST http://localhost:5003/api/recruiter/jd/create \
     -H "Content-Type: application/json" \
     -d '{"recruiter_id": "rec_123", "company_id": "comp_456"}'
   ```

2. **Test Candidate Matching**:
   ```bash
   curl -X POST http://localhost:5003/api/recruiter/jd/jd_123/match-candidates \
     -H "Content-Type: application/json" \
     -d '{"employment_status_filter": "job_seeker", "top_n": 10}'
   ```

## Troubleshooting

### Common Issues

1. **psycopg2 not found**
   - Install: `pip install psycopg2-binary`
   - Or use: `pip install -r requirements.txt`

2. **Database connection failed**
   - Check `.env` file has correct credentials
   - Ensure PostgreSQL is running
   - Verify database exists

3. **AI matching not working**
   - Check GEMINI_API_KEY in `.env`
   - Fallback rule-based scoring will be used if AI unavailable

4. **Frontend components not rendering**
   - Check all UI component dependencies are installed
   - Verify import paths are correct
   - Check console for errors

## Future Enhancements

### Planned Features

1. **Interview Management**
   - Schedule interviews with matched candidates
   - Video interview integration
   - Feedback collection

2. **Offer Management**
   - Generate offer letters
   - Track offer status
   - E-signature integration

3. **Analytics Dashboard**
   - Job posting performance
   - Candidate pipeline metrics
   - Time-to-hire tracking

4. **Template Library**
   - Pre-built JD templates by industry
   - Customizable templates
   - Template sharing

5. **Collaboration Features**
   - Multi-recruiter workflows
   - Approval processes
   - Team comments

## Contributing

When contributing to recruiter services:

1. Follow the existing code structure
2. Maintain consistency with CV-Builder UX patterns
3. Add tests for new features
4. Update this README with new features
5. Ensure bilingual support (English/Arabic)

## Support

For issues or questions:
- Check this README first
- Review the test suite output
- Check backend logs for errors
- Contact the development team

## License

Part of the Emirati Human Resources Journey Platform.

---

**Version**: 1.0.0  
**Last Updated**: October 26, 2025  
**Author**: Manus AI Agent  
**Branch**: cursor/develop-recruiter-backend-services-6877

