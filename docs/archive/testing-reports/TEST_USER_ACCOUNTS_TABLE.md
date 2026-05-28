# Test User Accounts for Emirati Journey Platform

## Comprehensive Test User Database

The following table contains all test user accounts that have been created during the development and testing of the Emirati Journey Platform. These accounts are designed to represent different personas and roles within the system.

| ID | Username | Email | Full Name | Roles | Status | Department | Position | Location | Phone | Last Login | Created Date |
|----|----------|-------|-----------|-------|--------|------------|----------|----------|-------|------------|--------------|
| 1 | sarah.almansouri | sarah.almansouri@emiratijourney.ae | Sarah Al-Mansouri | content_admin, educator | Active | Education | Senior Content Manager | Dubai | +971-50-123-4567 | 2024-01-28 14:30 | 2024-01-15 10:00 |
| 2 | ahmed.alzaabi | ahmed.alzaabi@emiratijourney.ae | Ahmed Al-Zaabi | hr_recruiter, mentor | Active | Human Resources | HR Manager | Abu Dhabi | +971-50-234-5678 | 2024-01-28 09:15 | 2024-01-18 08:30 |
| 3 | fatima.alzahra | fatima.alzahra@emiratijourney.ae | Fatima Al-Zahra | assessor, content_reviewer | Active | Assessment | Senior Assessor | Sharjah | +971-50-345-6789 | 2024-01-27 16:45 | 2024-01-20 11:20 |
| 4 | mohammed.alrashid | mohammed.alrashid@emiratijourney.ae | Mohammed Al-Rashid | job_seeker | Inactive | Engineering | Software Developer | Dubai | +971-50-456-7890 | 2024-01-25 12:00 | 2024-01-22 14:15 |
| 5 | admin | admin@emiratijourney.ae | System Administrator | super_admin | Active | IT | System Administrator | Dubai | - | 2024-01-28 15:00 | 2024-01-01 00:00 |
| 6 | layla.alsuwaidi | layla.alsuwaidi@emiratijourney.ae | Layla Al-Suwaidi | mentor, educator | Active | Career Development | Senior Career Counselor | Abu Dhabi | +971-50-567-8901 | 2024-01-27 11:30 | 2024-01-19 09:45 |
| 7 | omar.alkindi | omar.alkindi@emiratijourney.ae | Omar Al-Kindi | job_seeker | Active | Finance | Financial Analyst | Dubai | +971-50-678-9012 | 2024-01-28 08:20 | 2024-01-23 13:10 |
| 8 | aisha.almazrouei | aisha.almazrouei@emiratijourney.ae | Aisha Al-Mazrouei | hr_recruiter | Active | Talent Acquisition | Recruitment Specialist | Sharjah | +971-50-789-0123 | 2024-01-27 14:15 | 2024-01-21 16:30 |
| 9 | khalid.alnuaimi | khalid.alnuaimi@emiratijourney.ae | Khalid Al-Nuaimi | assessor | Active | Quality Assurance | Assessment Coordinator | Dubai | +971-50-890-1234 | 2024-01-26 10:45 | 2024-01-24 12:20 |
| 10 | mariam.aldhaheri | mariam.aldhaheri@emiratijourney.ae | Mariam Al-Dhaheri | content_editor | Active | Content | Content Editor | Abu Dhabi | +971-50-901-2345 | 2024-01-28 13:00 | 2024-01-25 08:15 |

## Role Definitions

| Role | Description | Permissions |
|------|-------------|-------------|
| super_admin | Full system administrator with all permissions | Complete platform access, user management, system configuration |
| content_admin | Content management administrator | Content creation, editing, publishing, media management |
| user_admin | User management administrator | User account management, role assignment, access control |
| content_editor | Content creation and editing | Content creation, editing (requires approval for publishing) |
| content_reviewer | Content review and approval | Content review, approval, quality assurance |
| job_seeker | Platform end-user seeking employment | Profile management, job search, application submission |
| hr_recruiter | Human resources professional | Job posting, candidate search, interview scheduling |
| mentor | Career mentor and advisor | Mentoring tools, session scheduling, progress tracking |
| educator | Educational content provider | Course creation, student tracking, curriculum planning |
| assessor | Skills and competency assessor | Assessment creation, competency validation, quality assurance |

## Test Credentials

**Note:** All test accounts use the following default password for development purposes:
- **Password:** `TestPassword123!`

**Security Notice:** These are development/testing credentials only. In production, all accounts will have secure, unique passwords and proper authentication mechanisms.

## Usage Guidelines

1. **Development Testing:** Use these accounts to test different persona functionalities
2. **Role Testing:** Each account represents specific roles to test permission systems
3. **Integration Testing:** Use multiple accounts to test cross-persona interactions
4. **UI/UX Testing:** Test user interfaces from different role perspectives

## Account Status Legend

- **Active:** Account is enabled and can log in
- **Inactive:** Account is disabled (for testing account management features)

## Contact Information Format

All phone numbers follow UAE format: +971-50-XXX-XXXX
All email addresses use the domain: @emiratijourney.ae

---

**Last Updated:** September 21, 2025
**Total Test Accounts:** 10
**Active Accounts:** 9
**Inactive Accounts:** 1
