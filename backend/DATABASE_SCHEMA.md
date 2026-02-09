# Database Schema Documentation

**Total Tables:** 130

## Table of Contents
- [admin_audit_log](#admin_audit_log)
- [admin_notifications](#admin_notifications)
- [admin_roles](#admin_roles)
- [admin_settings](#admin_settings)
- [admin_system_metrics](#admin_system_metrics)
- [admin_user_roles](#admin_user_roles)
- [admin_user_sessions](#admin_user_sessions)
- [analytics_events](#analytics_events)
- [application_analytics](#application_analytics)
- [application_documents](#application_documents)
- [application_feedback](#application_feedback)
- [application_interviews](#application_interviews)
- [application_notifications](#application_notifications)
- [application_status_history](#application_status_history)
- [approval_requests](#approval_requests)
- [attendance](#attendance)
- [candidate_assessments](#candidate_assessments)
- [candidate_certifications](#candidate_certifications)
- [candidate_education_entries](#candidate_education_entries)
- [candidate_experience_entries](#candidate_experience_entries)
- [candidate_profiles](#candidate_profiles)
- [candidate_shortlist](#candidate_shortlist)
- [candidate_skills](#candidate_skills)
- [career_development_plans](#career_development_plans)
- [classes](#classes)
- [cms_categories](#cms_categories)
- [cms_content](#cms_content)
- [cms_content_media](#cms_content_media)
- [cms_content_versions](#cms_content_versions)
- [cms_content_workflows](#cms_content_workflows)
- [cms_media](#cms_media)
- [cms_workflows](#cms_workflows)
- [communication_logs](#communication_logs)
- [companies](#companies)
- [company_settings](#company_settings)
- [company_team_members](#company_team_members)
- [conversation_participants](#conversation_participants)
- [conversations](#conversations)
- [course_assessments](#course_assessments)
- [course_certificates](#course_certificates)
- [course_enrollments](#course_enrollments)
- [course_modules](#course_modules)
- [courses](#courses)
- [curriculum_standards](#curriculum_standards)
- [cv_analytics](#cv_analytics)
- [cv_profiles](#cv_profiles)
- [cv_templates](#cv_templates)
- [cv_usage_logs](#cv_usage_logs)
- [cv_versions](#cv_versions)
- [educational_institutions](#educational_institutions)
- [educational_programs](#educational_programs)
- [educator_analytics](#educator_analytics)
- [educator_profiles](#educator_profiles)
- [educator_qualifications](#educator_qualifications)
- [enhanced_analytics_events](#enhanced_analytics_events)
- [enrollments](#enrollments)
- [external_job_distribution](#external_job_distribution)
- [feedback](#feedback)
- [growth_operator_activity_log](#growth_operator_activity_log)
- [growth_operator_assignments](#growth_operator_assignments)
- [hr_profiles](#hr_profiles)
- [institution_partnerships](#institution_partnerships)
- [interview_participants](#interview_participants)
- [interview_recordings](#interview_recordings)
- [interview_reports](#interview_reports)
- [interview_schedules](#interview_schedules)
- [interview_sessions](#interview_sessions)
- [jd_analytics](#jd_analytics)
- [job_applications](#job_applications)
- [job_benefits](#job_benefits)
- [job_descriptions](#job_descriptions)
- [job_documents](#job_documents)
- [job_matches](#job_matches)
- [job_offers](#job_offers)
- [job_postings](#job_postings)
- [job_requirements](#job_requirements)
- [job_shortlists](#job_shortlists)
- [job_templates](#job_templates)
- [job_verification_tokens](#job_verification_tokens)
- [learning_resources](#learning_resources)
- [mentor_profiles](#mentor_profiles)
- [mentor_specializations](#mentor_specializations)
- [mentorship_analytics](#mentorship_analytics)
- [mentorship_feedback](#mentorship_feedback)
- [mentorship_goals](#mentorship_goals)
- [mentorship_matching](#mentorship_matching)
- [mentorship_outcomes](#mentorship_outcomes)
- [mentorship_programs](#mentorship_programs)
- [mentorship_resources](#mentorship_resources)
- [mentorship_schedules](#mentorship_schedules)
- [mentorship_sessions](#mentorship_sessions)
- [messages](#messages)
- [notifications](#notifications)
- [offer_approval_requests](#offer_approval_requests)
- [offers](#offers)
- [otp_interactions](#otp_interactions)
- [parent_communications](#parent_communications)
- [predictive_models](#predictive_models)
- [program_categories](#program_categories)
- [program_enrollments](#program_enrollments)
- [program_notifications](#program_notifications)
- [program_reviews](#program_reviews)
- [program_success_metrics](#program_success_metrics)
- [program_tags](#program_tags)
- [program_workflow_history](#program_workflow_history)
- [real_time_metrics](#real_time_metrics)
- [recruiter_activity_log](#recruiter_activity_log)
- [recruiter_vacancies](#recruiter_vacancies)
- [role_requests](#role_requests)
- [saved_jobs](#saved_jobs)
- [scholarships](#scholarships)
- [school_programs](#school_programs)
- [schools](#schools)
- [shortlisted_candidates](#shortlisted_candidates)
- [skills](#skills)
- [student_achievements](#student_achievements)
- [student_behavior](#student_behavior)
- [student_guardians](#student_guardians)
- [student_progress](#student_progress)
- [students](#students)
- [system_settings](#system_settings)
- [team_members](#team_members)
- [uae_analytics_metrics](#uae_analytics_metrics)
- [user_activity_log](#user_activity_log)
- [user_cvs](#user_cvs)
- [user_journey_analytics](#user_journey_analytics)
- [user_roles](#user_roles)
- [user_sessions](#user_sessions)
- [users](#users)
- [video_interview_sessions](#video_interview_sessions)

---
## admin_audit_log

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('admin_audit_log_id_seq'::regclass) |
| **user_id** | `integer` | YES | - |
| **action** | `character varying` | NO | - |
| **resource_type** | `character varying` | NO | - |
| **resource_id** | `character varying` | YES | - |
| **old_values** | `jsonb` | YES | - |
| **new_values** | `jsonb` | YES | - |
| **details** | `jsonb` | YES | - |
| **ip_address** | `inet` | YES | - |
| **user_agent** | `text` | YES | - |
| **session_id** | `character varying` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `user_id` → `users.id`

---
## admin_notifications

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('admin_notifications_id_seq'::regclass) |
| **notification_type** | `character varying` | NO | - |
| **title** | `character varying` | NO | - |
| **message** | `text` | NO | - |
| **severity** | `character varying` | YES | 'info'::character varying |
| **is_read** | `boolean` | YES | false |
| **is_dismissed** | `boolean` | YES | false |
| **target_user_id** | `integer` | YES | - |
| **action_url** | `character varying` | YES | - |
| **expires_at** | `timestamp without time zone` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `target_user_id` → `users.id`

---
## admin_roles

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('admin_roles_id_seq'::regclass) |
| **name** | `character varying` | NO | - |
| **display_name** | `character varying` | NO | - |
| **description** | `text` | YES | - |
| **permissions** | `jsonb` | NO | - |
| **is_system_role** | `boolean` | YES | false |
| **created_by** | `integer` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `created_by` → `users.id`

---
## admin_settings

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('admin_settings_id_seq'::regclass) |
| **setting_key** | `character varying` | NO | - |
| **setting_value** | `jsonb` | NO | - |
| **setting_type** | `character varying` | NO | - |
| **category** | `character varying` | NO | - |
| **description** | `text` | YES | - |
| **is_public** | `boolean` | YES | false |
| **validation_rules** | `jsonb` | YES | - |
| **updated_by** | `integer` | YES | - |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `updated_by` → `users.id`

---
## admin_system_metrics

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('admin_system_metrics_id_seq'::regclass) |
| **metric_name** | `character varying` | NO | - |
| **metric_value** | `numeric` | NO | - |
| **metric_unit** | `character varying` | YES | - |
| **metric_category** | `character varying` | NO | - |
| **tags** | `jsonb` | YES | - |
| **recorded_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## admin_user_roles

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('admin_user_roles_id_seq'::regclass) |
| **user_id** | `integer` | YES | - |
| **role_id** | `integer` | YES | - |
| **assigned_by** | `integer` | YES | - |
| **assigned_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **expires_at** | `timestamp without time zone` | YES | - |

**Foreign Keys:**

- `user_id` → `users.id`
- `role_id` → `admin_roles.id`
- `assigned_by` → `users.id`

---
## admin_user_sessions

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('admin_user_sessions_id_seq'::regclass) |
| **user_id** | `integer` | YES | - |
| **session_token** | `character varying` | NO | - |
| **ip_address** | `inet` | YES | - |
| **user_agent** | `text` | YES | - |
| **is_active** | `boolean` | YES | true |
| **last_activity** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **expires_at** | `timestamp without time zone` | NO | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `user_id` → `users.id`

---
## analytics_events

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('analytics_events_id_seq'::regclass) |
| **user_id** | `integer` | YES | - |
| **event_type** | `character varying` | NO | - |
| **category** | `character varying` | YES | - |
| **action** | `character varying` | YES | - |
| **data** | `jsonb` | YES | '{}'::jsonb |
| **session_id** | `character varying` | YES | - |
| **ip_address** | `inet` | YES | - |
| **user_agent** | `text` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `user_id` → `users.id`

---
## application_analytics

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **application_id** | `uuid` | NO | - |
| **metric_name** | `character varying` | NO | - |
| **metric_value** | `numeric` | YES | - |
| **metric_text** | `character varying` | YES | - |
| **recorded_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

---
## application_documents

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **application_id** | `uuid` | NO | - |
| **document_type** | `character varying` | NO | - |
| **file_name** | `character varying` | NO | - |
| **original_filename** | `character varying` | NO | - |
| **file_path** | `character varying` | NO | - |
| **file_size** | `bigint` | YES | - |
| **mime_type** | `character varying` | YES | - |
| **is_required** | `boolean` | YES | false |
| **uploaded_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **uploaded_by** | `integer` | NO | - |

**Foreign Keys:**

- `uploaded_by` → `users.id`

---
## application_feedback

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **application_id** | `uuid` | NO | - |
| **feedback_type** | `character varying` | NO | - |
| **feedback_text** | `text` | NO | - |
| **rating** | `integer` | YES | - |
| **strengths** | `text` | YES | - |
| **areas_for_improvement** | `text` | YES | - |
| **recommendations** | `text` | YES | - |
| **provided_by** | `integer` | NO | - |
| **provided_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **is_shared_with_candidate** | `boolean` | YES | false |

**Foreign Keys:**

- `provided_by` → `users.id`

---
## application_interviews

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **application_id** | `uuid` | NO | - |
| **interview_type** | `character varying` | NO | - |
| **scheduled_date** | `timestamp with time zone` | NO | - |
| **duration_minutes** | `integer` | YES | 60 |
| **location** | `character varying` | YES | - |
| **meeting_link** | `character varying` | YES | - |
| **interviewer_name** | `character varying` | YES | - |
| **interviewer_email** | `character varying` | YES | - |
| **interviewer_phone** | `character varying` | YES | - |
| **preparation_notes** | `text` | YES | - |
| **interview_status** | `character varying` | YES | 'scheduled'::character varying |
| **feedback** | `text` | YES | - |
| **score** | `integer` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

---
## application_notifications

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **application_id** | `uuid` | NO | - |
| **user_id** | `integer` | NO | - |
| **notification_type** | `character varying` | NO | - |
| **title** | `character varying` | NO | - |
| **message** | `text` | NO | - |
| **is_read** | `boolean` | YES | false |
| **sent_via_email** | `boolean` | YES | false |
| **sent_via_sms** | `boolean` | YES | false |
| **sent_via_push** | `boolean` | YES | false |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **read_at** | `timestamp with time zone` | YES | - |

**Foreign Keys:**

- `user_id` → `users.id`

---
## application_status_history

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **application_id** | `uuid` | NO | - |
| **previous_status** | `character varying` | YES | - |
| **new_status** | `character varying` | NO | - |
| **status_reason** | `character varying` | YES | - |
| **notes** | `text` | YES | - |
| **changed_by** | `integer` | YES | - |
| **changed_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **notification_sent** | `boolean` | YES | false |

**Foreign Keys:**

- `changed_by` → `users.id`

---
## approval_requests

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **company_id** | `uuid` | NO | - |
| **resource_type** | `character varying` | NO | - |
| **resource_id** | `uuid` | NO | - |
| **requested_by** | `integer` | NO | - |
| **approver_id** | `integer` | NO | - |
| **status** | `character varying` | NO | 'pending'::character varying |
| **comment** | `text` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **decided_at** | `timestamp with time zone` | YES | - |

**Foreign Keys:**

- `company_id` → `companies.id`
- `requested_by` → `users.id`
- `approver_id` → `users.id`

---
## attendance

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **student_id** | `uuid` | NO | - |
| **class_id** | `uuid` | NO | - |
| **attendance_date** | `date` | NO | - |
| **status** | `character varying` | NO | - |
| **arrival_time** | `time without time zone` | YES | - |
| **marked_by** | `integer` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `student_id` → `students.id`
- `class_id` → `classes.id`
- `marked_by` → `users.id`

---
## candidate_assessments

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('candidate_assessments_id_seq'::regclass) |
| **profile_id** | `integer` | NO | - |
| **assessment_type** | `character varying` | YES | - |
| **title** | `character varying` | YES | - |
| **score** | `double precision` | YES | - |
| **max_score** | `double precision` | YES | - |
| **status** | `character varying` | YES | - |
| **completed_at** | `timestamp without time zone` | YES | - |
| **d33_sector** | `character varying` | YES | - |

**Foreign Keys:**

- `profile_id` → `candidate_profiles.id`

---
## candidate_certifications

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('candidate_certifications_id_seq'::regclass) |
| **profile_id** | `integer` | NO | - |
| **name** | `character varying` | NO | - |
| **issuing_organization** | `character varying` | NO | - |
| **issue_date** | `timestamp without time zone` | YES | - |
| **expiry_date** | `timestamp without time zone` | YES | - |
| **credential_id** | `character varying` | YES | - |
| **credential_url** | `character varying` | YES | - |

**Foreign Keys:**

- `profile_id` → `candidate_profiles.id`

---
## candidate_education_entries

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('candidate_education_entries_id_seq'::regclass) |
| **profile_id** | `integer` | NO | - |
| **institution** | `character varying` | NO | - |
| **degree** | `character varying` | NO | - |
| **field_of_study** | `character varying` | YES | - |
| **start_date** | `timestamp without time zone` | YES | - |
| **end_date** | `timestamp without time zone` | YES | - |
| **grade** | `character varying` | YES | - |
| **is_verified** | `boolean` | YES | false |
| **verification_source** | `character varying` | YES | 'self_reported'::character varying |
| **verification_id** | `character varying` | YES | - |

**Foreign Keys:**

- `profile_id` → `candidate_profiles.id`

---
## candidate_experience_entries

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('candidate_experience_entries_id_seq'::regclass) |
| **profile_id** | `integer` | NO | - |
| **job_title** | `character varying` | NO | - |
| **company** | `character varying` | NO | - |
| **location** | `character varying` | YES | - |
| **start_date** | `timestamp without time zone` | YES | - |
| **end_date** | `timestamp without time zone` | YES | - |
| **is_current** | `boolean` | YES | false |
| **description** | `text` | YES | - |
| **skills_used** | `jsonb` | YES | - |

**Foreign Keys:**

- `profile_id` → `candidate_profiles.id`

---
## candidate_profiles

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('candidate_profiles_id_seq'::regclass) |
| **user_id** | `character varying` | NO | - |
| **headline** | `character varying` | YES | - |
| **bio** | `text` | YES | - |
| **phone** | `character varying` | YES | - |
| **location** | `character varying` | YES | - |
| **nationality** | `character varying` | YES | 'UAE'::character varying |
| **dob** | `timestamp without time zone` | YES | - |
| **avatar_url** | `character varying` | YES | - |
| **video_intro_url** | `character varying` | YES | - |
| **target_roles** | `jsonb` | YES | - |
| **willing_to_relocate** | `boolean` | YES | false |
| **expected_salary_range** | `character varying` | YES | - |
| **notice_period** | `character varying` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **full_name** | `character varying` | YES | - |
| **ats_score** | `integer` | YES | 0 |
| **profile_photo_url** | `text` | YES | - |
| **latitude** | `double precision` | YES | - |
| **longitude** | `double precision` | YES | - |

---
## candidate_shortlist

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('candidate_shortlist_id_seq'::regclass) |
| **shortlist_id** | `character varying` | NO | - |
| **jd_id** | `character varying` | NO | - |
| **candidate_id** | `character varying` | NO | - |
| **recruiter_id** | `character varying` | NO | - |
| **match_score** | `numeric` | YES | - |
| **match_details** | `jsonb` | YES | - |
| **status** | `character varying` | YES | 'shortlisted'::character varying |
| **notes** | `text` | YES | - |
| **tags** | `jsonb` | YES | '[]'::jsonb |
| **contacted_at** | `timestamp without time zone` | YES | - |
| **interview_scheduled_at** | `timestamp without time zone` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## candidate_skills

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('candidate_skills_id_seq'::regclass) |
| **profile_id** | `integer` | NO | - |
| **name** | `character varying` | NO | - |
| **category** | `character varying` | YES | - |
| **level** | `character varying` | YES | - |
| **is_verified** | `boolean` | YES | false |
| **assessment_score** | `integer` | YES | - |

**Foreign Keys:**

- `profile_id` → `candidate_profiles.id`

---
## career_development_plans

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **mentee_user_id** | `integer` | NO | - |
| **mentor_id** | `uuid` | NO | - |
| **plan_title** | `character varying` | NO | - |
| **current_position** | `character varying` | YES | - |
| **target_position** | `character varying` | YES | - |
| **target_industry** | `character varying` | YES | - |
| **timeline_months** | `integer` | YES | - |
| **skills_to_develop** | `jsonb` | YES | '[]'::jsonb |
| **experience_to_gain** | `jsonb` | YES | '[]'::jsonb |
| **education_requirements** | `jsonb` | YES | '[]'::jsonb |
| **networking_goals** | `jsonb` | YES | '[]'::jsonb |
| **action_steps** | `jsonb` | YES | '[]'::jsonb |
| **progress_milestones** | `jsonb` | YES | '[]'::jsonb |
| **current_progress** | `numeric` | YES | 0.00 |
| **plan_status** | `character varying` | YES | 'active'::character varying |
| **review_frequency** | `character varying` | YES | 'monthly'::character varying |
| **last_review_date** | `date` | YES | - |
| **next_review_date** | `date` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `mentee_user_id` → `users.id`
- `mentor_id` → `mentor_profiles.id`

---
## classes

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **class_name** | `character varying` | NO | - |
| **grade_level** | `character varying` | YES | - |
| **section** | `character varying` | YES | - |
| **subject** | `character varying` | YES | - |
| **academic_year** | `character varying` | NO | - |
| **educator_id** | `integer` | NO | - |
| **institution_id** | `uuid` | YES | - |
| **classroom** | `character varying` | YES | - |
| **max_capacity** | `integer` | YES | 30 |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `educator_id` → `users.id`
- `institution_id` → `educational_institutions.id`

---
## cms_categories

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('cms_categories_id_seq'::regclass) |
| **name** | `character varying` | NO | - |
| **slug** | `character varying` | NO | - |
| **description** | `text` | YES | - |
| **parent_id** | `integer` | YES | - |
| **sort_order** | `integer` | YES | 0 |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `parent_id` → `cms_categories.id`

---
## cms_content

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('cms_content_id_seq'::regclass) |
| **uuid** | `uuid` | NO | uuid_generate_v4() |
| **title** | `character varying` | NO | - |
| **slug** | `character varying` | NO | - |
| **content_type** | `character varying` | NO | - |
| **status** | `character varying` | YES | 'draft'::character varying |
| **language** | `character varying` | YES | 'en'::character varying |
| **content_data** | `jsonb` | NO | - |
| **meta_data** | `jsonb` | YES | - |
| **featured_image_id** | `integer` | YES | - |
| **excerpt** | `text` | YES | - |
| **tags** | `ARRAY` | YES | - |
| **category** | `character varying` | YES | - |
| **publish_date** | `timestamp without time zone` | YES | - |
| **expire_date** | `timestamp without time zone` | YES | - |
| **view_count** | `integer` | YES | 0 |
| **created_by** | `integer` | YES | - |
| **updated_by** | `integer` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `created_by` → `users.id`
- `updated_by` → `users.id`

---
## cms_content_media

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('cms_content_media_id_seq'::regclass) |
| **content_id** | `integer` | YES | - |
| **media_id** | `integer` | YES | - |
| **relationship_type** | `character varying` | NO | - |
| **sort_order** | `integer` | YES | 0 |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `content_id` → `cms_content.id`
- `media_id` → `cms_media.id`

---
## cms_content_versions

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('cms_content_versions_id_seq'::regclass) |
| **content_id** | `integer` | YES | - |
| **version_number** | `integer` | NO | - |
| **title** | `character varying` | NO | - |
| **content_data** | `jsonb` | NO | - |
| **meta_data** | `jsonb` | YES | - |
| **change_summary** | `text` | YES | - |
| **created_by** | `integer` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `content_id` → `cms_content.id`
- `created_by` → `users.id`

---
## cms_content_workflows

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('cms_content_workflows_id_seq'::regclass) |
| **content_id** | `integer` | YES | - |
| **workflow_id** | `integer` | YES | - |
| **current_step** | `integer` | NO | 1 |
| **status** | `character varying` | YES | 'pending'::character varying |
| **assigned_to** | `integer` | YES | - |
| **comments** | `text` | YES | - |
| **started_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **completed_at** | `timestamp without time zone` | YES | - |

**Foreign Keys:**

- `content_id` → `cms_content.id`
- `workflow_id` → `cms_workflows.id`
- `assigned_to` → `users.id`

---
## cms_media

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('cms_media_id_seq'::regclass) |
| **uuid** | `uuid` | NO | uuid_generate_v4() |
| **filename** | `character varying` | NO | - |
| **original_name** | `character varying` | NO | - |
| **mime_type** | `character varying` | NO | - |
| **file_size** | `bigint` | NO | - |
| **storage_path** | `character varying` | NO | - |
| **cdn_url** | `character varying` | YES | - |
| **alt_text** | `character varying` | YES | - |
| **caption** | `text` | YES | - |
| **description** | `text` | YES | - |
| **tags** | `ARRAY` | YES | - |
| **dimensions** | `jsonb` | YES | - |
| **is_public** | `boolean` | YES | true |
| **uploaded_by** | `integer` | YES | - |
| **uploaded_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `uploaded_by` → `users.id`

---
## cms_workflows

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('cms_workflows_id_seq'::regclass) |
| **name** | `character varying` | NO | - |
| **description** | `text` | YES | - |
| **workflow_steps** | `jsonb` | NO | - |
| **is_active** | `boolean` | YES | true |
| **created_by** | `integer` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `created_by` → `users.id`

---
## communication_logs

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('communication_logs_id_seq'::regclass) |
| **log_id** | `character varying` | NO | - |
| **shortlist_id** | `character varying` | YES | - |
| **candidate_id** | `character varying` | NO | - |
| **recruiter_id** | `character varying` | NO | - |
| **message_type** | `character varying` | NO | - |
| **subject** | `text` | YES | - |
| **body** | `text` | NO | - |
| **status** | `character varying` | YES | 'pending'::character varying |
| **sent_at** | `timestamp without time zone` | YES | - |
| **delivered_at** | `timestamp without time zone` | YES | - |
| **error_message** | `text` | YES | - |
| **metadata** | `jsonb` | YES | '{}'::jsonb |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## companies

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **name** | `character varying` | NO | - |
| **company_name** | `character varying` | YES | - |
| **contact_email** | `character varying` | YES | - |
| **is_verified** | `boolean` | YES | false |
| **description** | `text` | YES | - |
| **industry** | `character varying` | YES | - |
| **trade_license_no** | `character varying` | YES | - |
| **phone** | `character varying` | YES | - |
| **emirate** | `character varying` | YES | - |
| **city** | `character varying` | YES | - |
| **business_type** | `character varying` | YES | - |
| **website** | `character varying` | YES | - |

---
## company_settings

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **company_id** | `uuid` | NO | - |
| **setting_category** | `character varying` | NO | - |
| **setting_key** | `character varying` | NO | - |
| **setting_value** | `jsonb` | YES | - |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `company_id` → `companies.id`

---
## company_team_members

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **company_id** | `uuid` | NO | - |
| **user_id** | `integer` | NO | - |
| **role** | `character varying` | NO | - |
| **permissions** | `jsonb` | YES | - |
| **invited_by** | `integer` | YES | - |
| **invitation_status** | `character varying` | YES | 'pending'::character varying |
| **joined_at** | `timestamp with time zone` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `company_id` → `companies.id`
- `user_id` → `users.id`
- `invited_by` → `users.id`

---
## conversation_participants

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **conversation_id** | `uuid` | NO | - |
| **user_id** | `character varying` | NO | - |
| **joined_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **last_read_at** | `timestamp with time zone` | YES | - |
| **is_archived** | `boolean` | YES | false |

**Foreign Keys:**

- `conversation_id` → `conversations.id`

---
## conversations

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | gen_random_uuid() |
| **application_id** | `character varying` | YES | - |
| **job_id** | `character varying` | YES | - |
| **title** | `character varying` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **last_message_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **is_active** | `boolean` | YES | true |

---
## course_assessments

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **course_id** | `uuid` | NO | - |
| **module_id** | `uuid` | YES | - |
| **assessment_name** | `character varying` | NO | - |
| **assessment_type** | `character varying` | NO | - |
| **description** | `text` | YES | - |
| **instructions** | `text` | YES | - |
| **total_marks** | `integer` | NO | - |
| **passing_marks** | `integer` | NO | - |
| **duration_minutes** | `integer` | YES | - |
| **attempt_limit** | `integer` | YES | 1 |
| **due_date** | `timestamp without time zone` | YES | - |
| **is_published** | `boolean` | YES | false |
| **weight_percentage** | `numeric` | YES | - |
| **rubric** | `jsonb` | YES | '{}'::jsonb |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `course_id` → `courses.id`
- `module_id` → `course_modules.id`

---
## course_certificates

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **enrollment_id** | `uuid` | NO | - |
| **certificate_number** | `character varying` | NO | - |
| **certificate_type** | `character varying` | YES | 'completion'::character varying |
| **issue_date** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **expiry_date** | `timestamp without time zone` | YES | - |
| **verification_code** | `character varying` | YES | - |
| **certificate_url** | `character varying` | YES | - |
| **digital_signature** | `text` | YES | - |
| **is_verified** | `boolean` | YES | true |
| **verification_status** | `character varying` | YES | 'valid'::character varying |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `enrollment_id` → `course_enrollments.id`

---
## course_enrollments

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **course_id** | `uuid` | NO | - |
| **student_user_id** | `integer` | NO | - |
| **enrollment_date** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **enrollment_status** | `character varying` | YES | 'active'::character varying |
| **payment_status** | `character varying` | YES | 'pending'::character varying |
| **payment_amount** | `numeric` | YES | - |
| **payment_date** | `timestamp without time zone` | YES | - |
| **completion_date** | `timestamp without time zone` | YES | - |
| **final_grade** | `character varying` | YES | - |
| **grade_points** | `numeric` | YES | - |
| **attendance_percentage** | `numeric` | YES | - |
| **feedback_rating** | `integer` | YES | - |
| **feedback_comments** | `text` | YES | - |
| **certificate_issued** | `boolean` | YES | false |
| **certificate_date** | `timestamp without time zone` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `course_id` → `courses.id`
- `student_user_id` → `users.id`

---
## course_modules

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **course_id** | `uuid` | NO | - |
| **module_number** | `integer` | NO | - |
| **module_name** | `character varying` | NO | - |
| **module_description** | `text` | YES | - |
| **learning_objectives** | `jsonb` | YES | '[]'::jsonb |
| **content_outline** | `text` | YES | - |
| **duration_hours** | `integer` | YES | - |
| **resources** | `jsonb` | YES | '[]'::jsonb |
| **assignments** | `jsonb` | YES | '[]'::jsonb |
| **is_mandatory** | `boolean` | YES | true |
| **order_sequence** | `integer` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `course_id` → `courses.id`

---
## courses

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **institution_id** | `uuid` | NO | - |
| **educator_id** | `uuid` | YES | - |
| **course_code** | `character varying` | NO | - |
| **course_name** | `character varying` | NO | - |
| **course_description** | `text` | YES | - |
| **course_level** | `character varying` | YES | - |
| **course_type** | `character varying` | YES | - |
| **subject_area** | `character varying` | YES | - |
| **duration_weeks** | `integer` | YES | - |
| **credit_hours** | `integer` | YES | - |
| **prerequisites** | `jsonb` | YES | '[]'::jsonb |
| **learning_outcomes** | `jsonb` | YES | '[]'::jsonb |
| **course_materials** | `jsonb` | YES | '[]'::jsonb |
| **assessment_methods** | `jsonb` | YES | '[]'::jsonb |
| **grading_criteria** | `jsonb` | YES | '{}'::jsonb |
| **max_students** | `integer` | YES | 30 |
| **current_enrollment** | `integer` | YES | 0 |
| **course_fee** | `numeric` | YES | - |
| **currency** | `character varying` | YES | 'AED'::character varying |
| **start_date** | `date` | YES | - |
| **end_date** | `date` | YES | - |
| **schedule** | `jsonb` | YES | '{}'::jsonb |
| **delivery_mode** | `character varying` | YES | 'in-person'::character varying |
| **language** | `character varying` | YES | 'English'::character varying |
| **is_active** | `boolean` | YES | true |
| **is_published** | `boolean` | YES | false |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `institution_id` → `educational_institutions.id`
- `educator_id` → `educator_profiles.id`

---
## curriculum_standards

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **standard_code** | `character varying` | NO | - |
| **standard_name** | `character varying` | NO | - |
| **subject_area** | `character varying` | NO | - |
| **grade_level** | `character varying` | YES | - |
| **description** | `text` | YES | - |
| **learning_objectives** | `jsonb` | YES | '[]'::jsonb |
| **assessment_criteria** | `jsonb` | YES | '[]'::jsonb |
| **moe_reference** | `character varying` | YES | - |
| **effective_date** | `date` | YES | - |
| **revision_date** | `date` | YES | - |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## cv_analytics

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **cv_id** | `uuid` | NO | - |
| **views_count** | `integer` | YES | 0 |
| **downloads_count** | `integer` | YES | 0 |
| **shares_count** | `integer` | YES | 0 |
| **avg_time_spent** | `integer` | YES | 0 |
| **bounce_rate** | `numeric` | YES | 0.0 |
| **applications_sent** | `integer` | YES | 0 |
| **interviews_received** | `integer` | YES | 0 |
| **job_offers_received** | `integer` | YES | 0 |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `cv_id` → `user_cvs.id`

---
## cv_profiles

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('cv_profiles_id_seq'::regclass) |
| **user_id** | `integer` | YES | - |
| **cv_data** | `jsonb` | NO | - |
| **parsed_data** | `jsonb` | YES | '{}'::jsonb |
| **skills** | `jsonb` | YES | '[]'::jsonb |
| **experience_years** | `integer` | YES | 0 |
| **education_level** | `character varying` | YES | - |
| **languages** | `jsonb` | YES | '[]'::jsonb |
| **location** | `character varying` | YES | - |
| **emirate** | `character varying` | YES | - |
| **is_active** | `boolean` | YES | true |
| **quality_score** | `double precision` | YES | 0.0 |
| **completeness_score** | `double precision` | YES | 0.0 |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `user_id` → `users.id`

---
## cv_templates

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **name** | `character varying` | NO | - |
| **display_name** | `character varying` | NO | - |
| **description** | `text` | YES | - |
| **category** | `character varying` | YES | - |
| **template_data** | `jsonb` | YES | - |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## cv_usage_logs

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `text` | NO | - |
| **cv_id** | `uuid` | YES | - |
| **user_id** | `character varying` | YES | - |
| **event_type** | `character varying` | YES | - |
| **event_data** | `jsonb` | YES | - |
| **timestamp** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## cv_versions

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **cv_id** | `uuid` | NO | - |
| **version_number** | `integer` | NO | - |
| **cv_data** | `jsonb` | NO | - |
| **change_summary** | `text` | YES | - |
| **created_by** | `uuid` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `cv_id` → `user_cvs.id`

---
## educational_institutions

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **name** | `character varying` | NO | - |
| **institution_type** | `character varying` | NO | - |
| **accreditation_level** | `character varying` | YES | - |
| **license_number** | `character varying` | YES | - |
| **establishment_year** | `integer` | YES | - |
| **description** | `text` | YES | - |
| **website** | `character varying` | YES | - |
| **email** | `character varying` | YES | - |
| **phone** | `character varying` | YES | - |
| **address** | `text` | YES | - |
| **city** | `character varying` | YES | - |
| **emirate** | `character varying` | YES | - |
| **country** | `character varying` | YES | 'UAE'::character varying |
| **postal_code** | `character varying` | YES | - |
| **logo** | `character varying` | YES | - |
| **accreditation_documents** | `jsonb` | YES | '[]'::jsonb |
| **facilities** | `jsonb` | YES | '[]'::jsonb |
| **programs_offered** | `jsonb` | YES | '[]'::jsonb |
| **student_capacity** | `integer` | YES | 0 |
| **current_enrollment** | `integer` | YES | 0 |
| **faculty_count** | `integer` | YES | 0 |
| **is_active** | `boolean` | YES | true |
| **is_verified** | `boolean` | YES | false |
| **verification_status** | `character varying` | YES | 'pending'::character varying |
| **social_media_links** | `jsonb` | YES | '{}'::jsonb |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## educational_programs

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('educational_programs_id_seq'::regclass) |
| **title** | `character varying` | NO | - |
| **organizer_name** | `character varying` | NO | - |
| **description** | `text` | YES | - |
| **program_type** | `character varying` | YES | - |
| **start_date** | `date` | YES | - |
| **end_date** | `date` | YES | - |
| **location** | `character varying` | YES | - |
| **age_group** | `character varying` | YES | - |
| **application_deadline** | `date` | YES | - |
| **cost** | `character varying` | YES | 'Free'::character varying |
| **application_link** | `character varying` | YES | - |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## educator_analytics

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **educator_id** | `uuid` | NO | - |
| **metric_name** | `character varying` | NO | - |
| **metric_value** | `numeric` | YES | - |
| **metric_date** | `date` | YES | CURRENT_DATE |
| **course_id** | `uuid` | YES | - |
| **additional_data** | `jsonb` | YES | '{}'::jsonb |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `educator_id` → `educator_profiles.id`
- `course_id` → `courses.id`

---
## educator_profiles

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **user_id** | `integer` | NO | - |
| **institution_id** | `uuid` | YES | - |
| **position_title** | `character varying` | NO | - |
| **department** | `character varying` | YES | - |
| **years_of_experience** | `integer` | YES | 0 |
| **education_level** | `character varying` | YES | - |
| **teaching_subjects** | `jsonb` | YES | '[]'::jsonb |
| **certifications** | `jsonb` | YES | '[]'::jsonb |
| **specializations** | `jsonb` | YES | '[]'::jsonb |
| **languages_taught** | `jsonb` | YES | '[]'::jsonb |
| **teaching_methodology** | `text` | YES | - |
| **professional_summary** | `text` | YES | - |
| **research_interests** | `text` | YES | - |
| **publications** | `jsonb` | YES | '[]'::jsonb |
| **awards_recognition** | `jsonb` | YES | '[]'::jsonb |
| **professional_memberships** | `jsonb` | YES | '[]'::jsonb |
| **contact_preferences** | `jsonb` | YES | '{}'::jsonb |
| **availability_schedule** | `jsonb` | YES | '{}'::jsonb |
| **is_active** | `boolean` | YES | true |
| **is_verified** | `boolean` | YES | false |
| **verification_documents** | `jsonb` | YES | '[]'::jsonb |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `user_id` → `users.id`
- `institution_id` → `educational_institutions.id`

---
## educator_qualifications

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **educator_id** | `uuid` | NO | - |
| **qualification_type** | `character varying` | NO | - |
| **qualification_name** | `character varying` | NO | - |
| **issuing_institution** | `character varying` | YES | - |
| **issue_date** | `date` | YES | - |
| **expiry_date** | `date` | YES | - |
| **verification_status** | `character varying` | YES | 'pending'::character varying |
| **document_url** | `character varying` | YES | - |
| **grade_gpa** | `character varying` | YES | - |
| **is_verified** | `boolean` | YES | false |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `educator_id` → `educator_profiles.id`

---
## enhanced_analytics_events

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `bigint` | NO | nextval('enhanced_analytics_events_id_seq'::regclass) |
| **event_id** | `uuid` | NO | - |
| **event_type** | `character varying` | NO | - |
| **category** | `character varying` | NO | - |
| **timestamp** | `timestamp with time zone` | NO | - |
| **user_id** | `uuid` | YES | - |
| **session_id** | `uuid` | YES | - |
| **user_role** | `character varying` | YES | - |
| **user_emirate** | `character varying` | YES | - |
| **user_sector** | `character varying` | YES | - |
| **device_type** | `character varying` | YES | - |
| **browser** | `character varying` | YES | - |
| **response_time** | `numeric` | YES | - |
| **cpu_usage** | `numeric` | YES | - |
| **memory_usage** | `numeric` | YES | - |
| **conversion_value** | `numeric` | YES | - |
| **engagement_score** | `numeric` | YES | - |
| **satisfaction_score** | `numeric` | YES | - |
| **uae_metrics** | `jsonb` | YES | - |
| **cultural_context** | `jsonb` | YES | - |
| **data** | `jsonb` | YES | - |
| **metadata** | `jsonb` | YES | - |
| **tags** | `ARRAY` | YES | - |
| **created_at** | `timestamp with time zone` | YES | now() |

---
## enrollments

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **student_id** | `uuid` | NO | - |
| **class_id** | `uuid` | NO | - |
| **enrollment_date** | `date` | YES | CURRENT_DATE |
| **status** | `character varying` | YES | 'active'::character varying |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `student_id` → `students.id`
- `class_id` → `classes.id`

---
## external_job_distribution

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **job_posting_id** | `uuid` | NO | - |
| **target** | `character varying` | NO | - |
| **payload** | `jsonb` | YES | - |
| **status** | `character varying` | NO | 'queued'::character varying |
| **external_id** | `character varying` | YES | - |
| **response** | `jsonb` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

---
## feedback

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `text` | NO | - |
| **user_id** | `text` | YES | - |
| **role** | `text` | YES | - |
| **type** | `text` | YES | - |
| **status** | `text` | YES | 'open'::text |
| **message** | `text` | YES | - |
| **metadata** | `jsonb` | YES | - |
| **console_logs** | `jsonb` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **resolution_notes** | `text` | YES | - |

---
## growth_operator_activity_log

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('growth_operator_activity_log_id_seq'::regclass) |
| **user_id** | `integer` | NO | - |
| **domain** | `character varying` | YES | - |
| **action** | `character varying` | YES | - |
| **details** | `jsonb` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## growth_operator_assignments

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('growth_operator_assignments_id_seq'::regclass) |
| **user_id** | `integer` | NO | - |
| **domain** | `character varying` | NO | - |
| **assigned_by** | `integer` | YES | - |
| **is_primary** | `boolean` | YES | false |
| **is_active** | `boolean` | YES | true |
| **notes** | `text` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## hr_profiles

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **user_id** | `integer` | NO | - |
| **company_id** | `uuid` | NO | - |
| **position_title** | `character varying` | YES | - |
| **department** | `character varying` | YES | - |

**Foreign Keys:**

- `user_id` → `users.id`
- `company_id` → `companies.id`

---
## institution_partnerships

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **institution_id** | `uuid` | NO | - |
| **partner_type** | `character varying` | NO | - |
| **partner_name** | `character varying` | NO | - |
| **partnership_type** | `character varying` | YES | - |
| **description** | `text` | YES | - |
| **start_date** | `date` | YES | - |
| **end_date** | `date` | YES | - |
| **contact_person** | `character varying` | YES | - |
| **contact_email** | `character varying` | YES | - |
| **benefits** | `jsonb` | YES | '[]'::jsonb |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `institution_id` → `educational_institutions.id`

---
## interview_participants

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('interview_participants_id_seq'::regclass) |
| **session_id** | `uuid` | YES | - |
| **user_id** | `integer` | NO | - |
| **role** | `character varying` | YES | - |
| **status** | `character varying` | YES | 'invited'::character varying |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `session_id` → `interview_sessions.id`

---
## interview_recordings

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | - |
| **session_id** | `uuid` | YES | - |
| **user_id** | `integer` | YES | - |
| **file_path** | `text` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `session_id` → `interview_sessions.id`

---
## interview_reports

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **session_id** | `character varying` | NO | - |
| **report_data** | `jsonb` | NO | - |
| **generated_at** | `timestamp with time zone` | NO | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `session_id` → `video_interview_sessions.id`

---
## interview_schedules

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('interview_schedules_id_seq'::regclass) |
| **interview_id** | `character varying` | NO | - |
| **shortlist_id** | `character varying` | NO | - |
| **candidate_id** | `character varying` | NO | - |
| **recruiter_id** | `character varying` | NO | - |
| **jd_id** | `character varying` | YES | - |
| **interview_type** | `character varying` | NO | - |
| **interview_round** | `integer` | YES | 1 |
| **interview_title** | `character varying` | YES | - |
| **scheduled_date** | `date` | NO | - |
| **scheduled_time** | `time without time zone` | NO | - |
| **duration_minutes** | `integer` | YES | 60 |
| **timezone** | `character varying` | YES | 'Asia/Dubai'::character varying |
| **location** | `character varying` | YES | - |
| **meeting_link** | `character varying` | YES | - |
| **meeting_platform** | `character varying` | YES | - |
| **status** | `character varying` | YES | 'scheduled'::character varying |
| **confirmation_status** | `character varying` | YES | 'pending'::character varying |
| **interviewers** | `jsonb` | YES | '[]'::jsonb |
| **reminder_sent** | `boolean` | YES | false |
| **reminder_sent_at** | `timestamp without time zone` | YES | - |
| **feedback** | `text` | YES | - |
| **rating** | `integer` | YES | - |
| **recommendation** | `character varying` | YES | - |
| **notes** | `text` | YES | - |
| **internal_notes** | `text` | YES | - |
| **metadata** | `jsonb` | YES | '{}'::jsonb |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **cancelled_at** | `timestamp without time zone` | YES | - |
| **cancellation_reason** | `text` | YES | - |

---
## interview_sessions

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | - |
| **application_id** | `text` | YES | - |
| **recruiter_id** | `integer` | YES | - |
| **candidate_id** | `text` | YES | - |
| **scheduled_at** | `timestamp with time zone` | YES | - |
| **status** | `text` | YES | 'scheduled'::text |
| **ai_analysis** | `jsonb` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **guest_token** | `text` | YES | - |
| **title** | `text` | YES | - |
| **cancellation_reason** | `text` | YES | - |
| **attendees** | `jsonb` | YES | - |

---
## jd_analytics

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('jd_analytics_id_seq'::regclass) |
| **job_description_id** | `integer` | YES | - |
| **analysis_type** | `character varying` | NO | - |
| **analysis_data** | `jsonb` | NO | - |
| **quality_metrics** | `jsonb` | YES | '{}'::jsonb |
| **compliance_metrics** | `jsonb` | YES | '{}'::jsonb |
| **uae_metrics** | `jsonb` | YES | '{}'::jsonb |
| **performance_metrics** | `jsonb` | YES | '{}'::jsonb |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `job_description_id` → `job_descriptions.id`

---
## job_applications

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `text` | NO | - |
| **job_id** | `text` | NO | - |
| **candidate_id** | `text` | NO | - |
| **cover_letter** | `text` | YES | - |
| **additional_documents** | `jsonb` | YES | - |
| **expected_salary** | `text` | YES | - |
| **availability_date** | `text` | YES | - |
| **status** | `text` | YES | 'submitted'::text |
| **submitted_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **last_updated** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **notes** | `text` | YES | - |
| **interview_date** | `timestamp with time zone` | YES | - |
| **interview_type** | `text` | YES | - |

---
## job_benefits

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | - |
| **job_posting_id** | `uuid` | NO | - |
| **benefit_category** | `character varying` | YES | - |
| **benefit_name** | `character varying` | YES | - |
| **benefit_description** | `text` | YES | - |
| **benefit_value** | `character varying` | YES | - |
| **is_highlighted** | `boolean` | YES | false |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

---
## job_descriptions

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('job_descriptions_id_seq'::regclass) |
| **user_id** | `integer` | YES | - |
| **title** | `character varying` | NO | - |
| **company** | `character varying` | YES | - |
| **location** | `character varying` | YES | - |
| **emirate** | `character varying` | YES | - |
| **jd_data** | `jsonb` | NO | - |
| **parsed_data** | `jsonb` | YES | '{}'::jsonb |
| **required_skills** | `jsonb` | YES | '[]'::jsonb |
| **experience_level** | `integer` | YES | 0 |
| **employment_type** | `character varying` | YES | 'Full-time'::character varying |
| **salary_range** | `character varying` | YES | - |
| **is_active** | `boolean` | YES | true |
| **quality_score** | `double precision` | YES | 0.0 |
| **compliance_score** | `double precision` | YES | 0.0 |
| **emiratization_friendly** | `boolean` | YES | false |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `user_id` → `users.id`

---
## job_documents

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **job_posting_id** | `uuid` | NO | - |
| **uploaded_by** | `integer` | NO | - |
| **document_type** | `character varying` | YES | - |
| **original_filename** | `text` | NO | - |
| **stored_filename** | `text` | NO | - |
| **content_type** | `character varying` | YES | - |
| **size_bytes** | `bigint` | YES | - |
| **storage_path** | `text` | NO | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `uploaded_by` → `users.id`

---
## job_matches

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('job_matches_id_seq'::regclass) |
| **cv_profile_id** | `integer` | YES | - |
| **job_description_id** | `integer` | YES | - |
| **overall_score** | `double precision` | NO | - |
| **skills_score** | `double precision` | YES | 0.0 |
| **experience_score** | `double precision` | YES | 0.0 |
| **education_score** | `double precision` | YES | 0.0 |
| **location_score** | `double precision` | YES | 0.0 |
| **language_score** | `double precision` | YES | 0.0 |
| **cultural_score** | `double precision` | YES | 0.0 |
| **confidence** | `double precision` | YES | 0.0 |
| **match_data** | `jsonb` | YES | '{}'::jsonb |
| **recommendations** | `jsonb` | YES | '[]'::jsonb |
| **is_favorite** | `boolean` | YES | false |
| **status** | `character varying` | YES | 'new'::character varying |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `cv_profile_id` → `cv_profiles.id`
- `job_description_id` → `job_descriptions.id`

---
## job_offers

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **offer_id** | `character varying` | NO | - |
| **jd_id** | `character varying` | NO | - |
| **shortlist_id** | `character varying` | NO | - |
| **candidate_id** | `character varying` | NO | - |
| **recruiter_id** | `character varying` | NO | - |
| **position_title** | `character varying` | NO | - |
| **department** | `character varying` | YES | - |
| **employment_type** | `character varying` | NO | - |
| **start_date** | `date` | YES | - |
| **salary_amount** | `numeric` | NO | - |
| **salary_currency** | `character varying` | YES | 'AED'::character varying |
| **salary_period** | `character varying` | YES | 'annual'::character varying |
| **bonus_amount** | `numeric` | YES | - |
| **equity_percentage** | `numeric` | YES | - |
| **benefits** | `jsonb` | YES | - |
| **status** | `character varying` | YES | 'draft'::character varying |
| **offer_date** | `timestamp without time zone` | YES | - |
| **expiry_date** | `date` | YES | - |
| **response_deadline** | `date` | YES | - |
| **candidate_response** | `character varying` | YES | - |
| **response_date** | `timestamp without time zone` | YES | - |
| **response_notes** | `text` | YES | - |
| **negotiation_status** | `character varying` | YES | 'none'::character varying |
| **negotiation_rounds** | `integer` | YES | 0 |
| **negotiation_notes** | `text` | YES | - |
| **contract_duration_months** | `integer` | YES | - |
| **probation_period_months** | `integer` | YES | - |
| **notice_period_days** | `integer` | YES | - |
| **work_location** | `character varying` | YES | - |
| **remote_work_policy** | `character varying` | YES | - |
| **offer_letter_url** | `text` | YES | - |
| **contract_url** | `text` | YES | - |
| **additional_documents** | `jsonb` | YES | - |
| **approval_status** | `character varying` | YES | 'pending'::character varying |
| **approved_by** | `character varying` | YES | - |
| **approval_date** | `timestamp without time zone` | YES | - |
| **approval_notes** | `text` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **created_by** | `character varying` | YES | - |
| **notes** | `text` | YES | - |
| **rejected_by** | `character varying` | YES | - |
| **rejection_date** | `timestamp without time zone` | YES | - |
| **rejection_reason** | `text` | YES | - |

---
## job_postings

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('job_postings_id_seq'::regclass) |
| **jd_id** | `character varying` | NO | - |
| **recruiter_id** | `character varying` | NO | - |
| **company_id** | `character varying` | NO | - |
| **title** | `character varying` | NO | - |
| **title_arabic** | `character varying` | YES | - |
| **department** | `character varying` | YES | - |
| **job_type** | `character varying` | YES | - |
| **job_level** | `character varying` | YES | - |
| **emirate** | `character varying` | YES | - |
| **city** | `character varying` | YES | - |
| **remote_option** | `boolean` | YES | false |
| **description** | `text` | YES | - |
| **description_arabic** | `text` | YES | - |
| **requirements** | `jsonb` | YES | - |
| **responsibilities** | `jsonb` | YES | - |
| **benefits** | `jsonb` | YES | - |
| **compensation** | `jsonb` | YES | - |
| **application_process** | `jsonb` | YES | - |
| **metadata** | `jsonb` | YES | - |
| **status** | `character varying` | YES | 'draft'::character varying |
| **views_count** | `integer` | YES | 0 |
| **applications_count** | `integer` | YES | 0 |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **published_at** | `timestamp without time zone` | YES | - |
| **closed_at** | `timestamp without time zone` | YES | - |
| **nafis_job_id** | `character varying` | YES | - |
| **education_level** | `character varying` | YES | - |
| **gender_preference** | `character varying` | YES | - |
| **number_of_vacancies** | `integer` | YES | 1 |
| **created_by** | `integer` | YES | - |
| **contact_email** | `character varying` | YES | - |
| **posted_date** | `timestamp without time zone` | YES | - |
| **employment_type** | `character varying` | YES | - |
| **experience_level** | `character varying` | YES | - |
| **salary_range_min** | `integer` | YES | - |
| **salary_range_max** | `integer` | YES | - |
| **currency** | `character varying` | YES | 'AED'::character varying |
| **location** | `character varying` | YES | - |
| **priority_level** | `character varying` | YES | 'normal'::character varying |
| **application_deadline** | `date` | YES | - |
| **expires_at** | `date` | YES | - |
| **uae_compliance_checked** | `boolean` | YES | false |
| **emiratization_target** | `integer` | YES | 0 |
| **visa_sponsorship_available** | `boolean` | YES | false |
| **tags** | `jsonb` | YES | '[]'::jsonb |
| **seo_keywords** | `jsonb` | YES | '[]'::jsonb |
| **latitude** | `double precision` | YES | - |
| **longitude** | `double precision` | YES | - |

**Foreign Keys:**

- `created_by` → `users.id`

---
## job_requirements

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | - |
| **job_posting_id** | `uuid` | NO | - |
| **requirement_type** | `character varying` | YES | - |
| **requirement_name** | `character varying` | YES | - |
| **requirement_level** | `character varying` | YES | - |
| **proficiency_level** | `character varying` | YES | - |
| **years_required** | `integer` | YES | - |
| **description** | `text` | YES | - |
| **weight** | `numeric` | YES | 1.0 |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

---
## job_shortlists

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **job_posting_id** | `integer` | NO | - |
| **candidate_id** | `integer` | NO | - |
| **added_by** | `integer` | YES | - |
| **notes** | `text` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `job_posting_id` → `job_postings.id`
- `candidate_id` → `users.id`
- `added_by` → `users.id`

---
## job_templates

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **company_id** | `uuid` | NO | - |
| **created_by** | `integer` | NO | - |
| **template_name** | `character varying` | NO | - |
| **template_category** | `character varying` | YES | - |
| **title_template** | `character varying` | YES | - |
| **description_template** | `text` | YES | - |
| **requirements_template** | `jsonb` | YES | - |
| **responsibilities_template** | `jsonb` | YES | - |
| **benefits_template** | `jsonb` | YES | - |
| **is_public** | `boolean` | YES | false |
| **usage_count** | `integer` | YES | 0 |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `company_id` → `companies.id`
- `created_by` → `users.id`

---
## job_verification_tokens

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **job_id** | `integer` | NO | - |
| **token** | `character varying` | NO | - |
| **email** | `character varying` | NO | - |
| **company_name_snapshot** | `character varying` | YES | - |
| **is_used** | `boolean` | YES | false |
| **expires_at** | `timestamp with time zone` | NO | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `job_id` → `job_postings.id`

---
## learning_resources

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **course_id** | `uuid` | YES | - |
| **module_id** | `uuid` | YES | - |
| **resource_name** | `character varying` | NO | - |
| **resource_type** | `character varying` | NO | - |
| **resource_url** | `character varying` | YES | - |
| **file_size_mb** | `numeric` | YES | - |
| **description** | `text` | YES | - |
| **access_level** | `character varying` | YES | 'enrolled'::character varying |
| **download_allowed** | `boolean` | YES | true |
| **view_count** | `integer` | YES | 0 |
| **rating** | `numeric` | YES | - |
| **tags** | `jsonb` | YES | '[]'::jsonb |
| **created_by** | `uuid` | YES | - |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `course_id` → `courses.id`
- `module_id` → `course_modules.id`
- `created_by` → `educator_profiles.id`

---
## mentor_profiles

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **user_id** | `integer` | NO | - |
| **professional_title** | `character varying` | NO | - |
| **current_company** | `character varying` | YES | - |
| **industry** | `character varying` | YES | - |
| **years_of_experience** | `integer` | YES | 0 |
| **expertise_areas** | `jsonb` | YES | '[]'::jsonb |
| **mentoring_specializations** | `jsonb` | YES | '[]'::jsonb |
| **languages_spoken** | `jsonb` | YES | '[]'::jsonb |
| **professional_summary** | `text` | YES | - |
| **mentoring_philosophy** | `text` | YES | - |
| **achievements** | `jsonb` | YES | '[]'::jsonb |
| **certifications** | `jsonb` | YES | '[]'::jsonb |
| **education_background** | `jsonb` | YES | '[]'::jsonb |
| **professional_memberships** | `jsonb` | YES | '[]'::jsonb |
| **linkedin_profile** | `character varying` | YES | - |
| **portfolio_url** | `character varying` | YES | - |
| **hourly_rate** | `numeric` | YES | - |
| **currency** | `character varying` | YES | 'AED'::character varying |
| **availability_hours** | `jsonb` | YES | '{}'::jsonb |
| **time_zone** | `character varying` | YES | 'Asia/Dubai'::character varying |
| **preferred_communication** | `jsonb` | YES | '[]'::jsonb |
| **max_mentees** | `integer` | YES | 5 |
| **current_mentees** | `integer` | YES | 0 |
| **mentoring_approach** | `character varying` | YES | - |
| **session_duration_preference** | `integer` | YES | 60 |
| **is_available** | `boolean` | YES | true |
| **is_verified** | `boolean` | YES | false |
| **verification_documents** | `jsonb` | YES | '[]'::jsonb |
| **rating** | `numeric` | YES | 0.00 |
| **total_reviews** | `integer` | YES | 0 |
| **total_sessions** | `integer` | YES | 0 |
| **success_rate** | `numeric` | YES | 0.00 |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `user_id` → `users.id`

---
## mentor_specializations

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **mentor_id** | `uuid` | NO | - |
| **specialization_name** | `character varying` | NO | - |
| **specialization_category** | `character varying` | YES | - |
| **proficiency_level** | `character varying` | YES | - |
| **years_of_experience** | `integer` | YES | - |
| **description** | `text` | YES | - |
| **certifications** | `jsonb` | YES | '[]'::jsonb |
| **success_stories** | `text` | YES | - |
| **is_primary** | `boolean` | YES | false |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `mentor_id` → `mentor_profiles.id`

---
## mentorship_analytics

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **mentor_id** | `uuid` | YES | - |
| **mentee_user_id** | `integer` | YES | - |
| **program_id** | `uuid` | YES | - |
| **metric_name** | `character varying` | NO | - |
| **metric_value** | `numeric` | YES | - |
| **metric_date** | `date` | YES | CURRENT_DATE |
| **additional_data** | `jsonb` | YES | '{}'::jsonb |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `mentor_id` → `mentor_profiles.id`
- `mentee_user_id` → `users.id`
- `program_id` → `mentorship_programs.id`

---
## mentorship_feedback

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **session_id** | `uuid` | NO | - |
| **feedback_type** | `character varying` | NO | - |
| **rating** | `integer` | YES | - |
| **feedback_text** | `text` | YES | - |
| **areas_of_improvement** | `text` | YES | - |
| **strengths_highlighted** | `text` | YES | - |
| **recommendations** | `text` | YES | - |
| **would_recommend** | `boolean` | YES | - |
| **is_anonymous** | `boolean` | YES | false |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `session_id` → `mentorship_sessions.id`

---
## mentorship_goals

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **mentee_user_id** | `integer` | NO | - |
| **mentor_id** | `uuid` | NO | - |
| **program_id** | `uuid` | YES | - |
| **goal_title** | `character varying` | NO | - |
| **goal_description** | `text` | YES | - |
| **goal_category** | `character varying` | YES | - |
| **priority_level** | `character varying` | YES | 'medium'::character varying |
| **target_date** | `date` | YES | - |
| **current_status** | `character varying` | YES | 'not_started'::character varying |
| **progress_percentage** | `numeric` | YES | 0.00 |
| **milestones** | `jsonb` | YES | '[]'::jsonb |
| **success_criteria** | `text` | YES | - |
| **resources_needed** | `jsonb` | YES | '[]'::jsonb |
| **challenges_faced** | `text` | YES | - |
| **mentor_notes** | `text` | YES | - |
| **is_achieved** | `boolean` | YES | false |
| **achievement_date** | `timestamp without time zone` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `mentee_user_id` → `users.id`
- `mentor_id` → `mentor_profiles.id`
- `program_id` → `mentorship_programs.id`

---
## mentorship_matching

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **mentee_user_id** | `integer` | NO | - |
| **mentor_id** | `uuid` | NO | - |
| **match_score** | `numeric` | YES | - |
| **match_criteria** | `jsonb` | YES | '{}'::jsonb |
| **match_status** | `character varying` | YES | 'pending'::character varying |
| **match_date** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **start_date** | `timestamp without time zone` | YES | - |
| **end_date** | `timestamp without time zone` | YES | - |
| **mentorship_type** | `character varying` | YES | - |
| **goals_alignment** | `jsonb` | YES | '[]'::jsonb |
| **communication_preferences** | `jsonb` | YES | '{}'::jsonb |
| **success_metrics** | `jsonb` | YES | '[]'::jsonb |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `mentee_user_id` → `users.id`
- `mentor_id` → `mentor_profiles.id`

---
## mentorship_outcomes

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **mentorship_matching_id** | `uuid` | NO | - |
| **outcome_type** | `character varying` | NO | - |
| **outcome_description** | `text` | YES | - |
| **achievement_date** | `date` | YES | - |
| **quantifiable_result** | `character varying` | YES | - |
| **impact_level** | `character varying` | YES | - |
| **success_metrics** | `jsonb` | YES | '{}'::jsonb |
| **mentor_contribution** | `text` | YES | - |
| **mentee_effort_level** | `character varying` | YES | - |
| **external_factors** | `text` | YES | - |
| **lessons_learned** | `text` | YES | - |
| **is_verified** | `boolean` | YES | false |
| **verification_source** | `character varying` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `mentorship_matching_id` → `mentorship_matching.id`

---
## mentorship_programs

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **program_name** | `character varying` | NO | - |
| **program_description** | `text` | YES | - |
| **program_type** | `character varying` | NO | - |
| **target_audience** | `character varying` | YES | - |
| **duration_weeks** | `integer` | YES | - |
| **session_frequency** | `character varying` | YES | - |
| **max_participants** | `integer` | YES | 10 |
| **current_participants** | `integer` | YES | 0 |
| **program_fee** | `numeric` | YES | - |
| **currency** | `character varying` | YES | 'AED'::character varying |
| **start_date** | `date` | YES | - |
| **end_date** | `date` | YES | - |
| **application_deadline** | `date` | YES | - |
| **eligibility_criteria** | `jsonb` | YES | '[]'::jsonb |
| **learning_outcomes** | `jsonb` | YES | '[]'::jsonb |
| **program_structure** | `jsonb` | YES | '[]'::jsonb |
| **resources_provided** | `jsonb` | YES | '[]'::jsonb |
| **mentor_id** | `uuid` | NO | - |
| **is_active** | `boolean` | YES | true |
| **is_published** | `boolean` | YES | false |
| **application_status** | `character varying` | YES | 'open'::character varying |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `mentor_id` → `mentor_profiles.id`

---
## mentorship_resources

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **resource_title** | `character varying` | NO | - |
| **resource_description** | `text` | YES | - |
| **resource_type** | `character varying` | NO | - |
| **resource_url** | `character varying` | YES | - |
| **resource_category** | `character varying` | YES | - |
| **target_audience** | `character varying` | YES | - |
| **difficulty_level** | `character varying` | YES | - |
| **estimated_time_minutes** | `integer` | YES | - |
| **tags** | `jsonb` | YES | '[]'::jsonb |
| **created_by** | `uuid` | YES | - |
| **view_count** | `integer` | YES | 0 |
| **rating** | `numeric` | YES | - |
| **is_featured** | `boolean` | YES | false |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `created_by` → `mentor_profiles.id`

---
## mentorship_schedules

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **mentor_id** | `uuid` | NO | - |
| **day_of_week** | `integer` | NO | - |
| **start_time** | `time without time zone` | NO | - |
| **end_time** | `time without time zone` | NO | - |
| **is_available** | `boolean` | YES | true |
| **max_sessions_per_slot** | `integer` | YES | 1 |
| **session_duration_minutes** | `integer` | YES | 60 |
| **buffer_time_minutes** | `integer` | YES | 15 |
| **time_zone** | `character varying` | YES | 'Asia/Dubai'::character varying |
| **effective_date** | `date` | YES | CURRENT_DATE |
| **expiry_date** | `date` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `mentor_id` → `mentor_profiles.id`

---
## mentorship_sessions

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **mentor_id** | `uuid` | NO | - |
| **mentee_user_id** | `integer` | NO | - |
| **program_id** | `uuid` | YES | - |
| **session_title** | `character varying` | YES | - |
| **session_description** | `text` | YES | - |
| **session_type** | `character varying` | YES | 'one-on-one'::character varying |
| **scheduled_date** | `timestamp without time zone` | NO | - |
| **duration_minutes** | `integer` | YES | 60 |
| **session_status** | `character varying` | YES | 'scheduled'::character varying |
| **meeting_link** | `character varying` | YES | - |
| **meeting_platform** | `character varying` | YES | - |
| **agenda** | `jsonb` | YES | '[]'::jsonb |
| **notes** | `text` | YES | - |
| **action_items** | `jsonb` | YES | '[]'::jsonb |
| **resources_shared** | `jsonb` | YES | '[]'::jsonb |
| **mentor_feedback** | `text` | YES | - |
| **mentee_feedback** | `text` | YES | - |
| **session_rating** | `integer` | YES | - |
| **follow_up_required** | `boolean` | YES | false |
| **follow_up_date** | `date` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `mentor_id` → `mentor_profiles.id`
- `mentee_user_id` → `users.id`
- `program_id` → `mentorship_programs.id`

---
## messages

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | gen_random_uuid() |
| **conversation_id** | `uuid` | YES | - |
| **sender_id** | `character varying` | NO | - |
| **recipient_id** | `character varying` | YES | - |
| **content** | `text` | NO | - |
| **message_type** | `character varying` | YES | 'text'::character varying |
| **metadata** | `jsonb` | YES | '{}'::jsonb |
| **status** | `character varying` | YES | 'sent'::character varying |
| **is_read** | `boolean` | YES | false |
| **read_at** | `timestamp with time zone` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `conversation_id` → `conversations.id`

---
## notifications

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | gen_random_uuid() |
| **user_id** | `character varying` | NO | - |
| **type** | `character varying` | NO | - |
| **title** | `character varying` | NO | - |
| **content** | `text` | NO | - |
| **metadata** | `jsonb` | YES | '{}'::jsonb |
| **is_read** | `boolean` | YES | false |
| **read_at** | `timestamp with time zone` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

---
## offer_approval_requests

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **offer_id** | `uuid` | NO | - |
| **jd_id** | `uuid` | YES | - |
| **candidate_id** | `integer` | NO | - |
| **recruiter_id** | `integer` | NO | - |
| **position_title** | `character varying` | YES | - |
| **salary_amount** | `numeric` | YES | - |
| **salary_currency** | `character varying` | YES | 'AED'::character varying |
| **status** | `character varying` | YES | 'pending'::character varying |
| **approver_id** | `integer` | YES | - |
| **approved_by** | `integer` | YES | - |
| **approved_at** | `timestamp without time zone` | YES | - |
| **rejection_reason** | `text` | YES | - |
| **comments** | `text` | YES | - |
| **requested_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## offers

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **job_posting_id** | `uuid` | NO | - |
| **application_id** | `uuid` | YES | - |
| **candidate_id** | `integer` | NO | - |
| **recruiter_id** | `integer` | NO | - |
| **offer_data** | `jsonb` | NO | - |
| **status** | `character varying` | NO | 'draft'::character varying |
| **signature_token** | `character varying` | YES | - |
| **signed_at** | `timestamp with time zone` | YES | - |
| **accepted_at** | `timestamp with time zone` | YES | - |
| **declined_at** | `timestamp with time zone` | YES | - |
| **expires_at** | `timestamp with time zone` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `candidate_id` → `users.id`
- `recruiter_id` → `users.id`

---
## otp_interactions

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **phone** | `character varying` | NO | - |
| **otp_code** | `character varying` | NO | - |
| **expires_at** | `timestamp without time zone` | NO | - |
| **attempts** | `integer` | YES | 0 |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## parent_communications

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **student_id** | `uuid` | NO | - |
| **educator_id** | `integer` | NO | - |
| **content** | `text` | NO | - |
| **communication_date** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `student_id` → `students.id`
- `educator_id` → `users.id`

---
## predictive_models

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `bigint` | NO | nextval('predictive_models_id_seq'::regclass) |
| **model_name** | `character varying` | NO | - |
| **model_type** | `character varying` | NO | - |
| **model_version** | `character varying` | NO | - |
| **training_data_size** | `integer` | YES | - |
| **accuracy_score** | `numeric` | YES | - |
| **model_parameters** | `jsonb` | YES | - |
| **feature_importance** | `jsonb` | YES | - |
| **last_trained** | `timestamp with time zone` | YES | - |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp with time zone` | YES | now() |

---
## program_categories

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **name_en** | `character varying` | NO | - |
| **name_ar** | `character varying` | NO | - |
| **description_en** | `text` | YES | - |
| **description_ar** | `text` | YES | - |
| **icon_name** | `character varying` | YES | - |
| **color_code** | `character varying` | YES | - |
| **sort_order** | `integer` | YES | 0 |
| **is_active** | `boolean` | NO | true |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

---
## program_enrollments

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **program_id** | `uuid` | NO | - |
| **student_id** | `integer` | NO | - |
| **parent_id** | `integer` | YES | - |
| **enrollment_status** | `character varying` | NO | 'pending'::character varying |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `program_id` → `school_programs.id`
- `student_id` → `users.id`
- `parent_id` → `users.id`

---
## program_notifications

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **program_id** | `uuid` | NO | - |
| **recipient_id** | `integer` | NO | - |
| **title** | `character varying` | NO | - |
| **message** | `text` | NO | - |
| **is_read** | `boolean` | NO | false |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `program_id` → `school_programs.id`
- `recipient_id` → `users.id`

---
## program_reviews

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **program_id** | `uuid` | NO | - |
| **reviewer_id** | `integer` | NO | - |
| **review_type** | `character varying` | NO | - |
| **status** | `character varying` | NO | 'pending'::character varying |
| **feedback** | `text` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `program_id` → `school_programs.id`
- `reviewer_id` → `users.id`

---
## program_success_metrics

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **program_id** | `uuid` | NO | - |
| **graduation_rate** | `numeric` | YES | - |
| **satisfaction_score** | `numeric` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `program_id` → `school_programs.id`

---
## program_tags

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **program_id** | `uuid` | NO | - |
| **tag_name** | `character varying` | NO | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **tag_type** | `text` | YES | - |

**Foreign Keys:**

- `program_id` → `school_programs.id`

---
## program_workflow_history

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **program_id** | `uuid` | NO | - |
| **stage_from** | `character varying` | NO | - |
| **stage_to** | `character varying` | NO | - |
| **actor_id** | `integer` | NO | - |
| **actor_role** | `character varying` | NO | - |
| **comments** | `text` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `program_id` → `school_programs.id`
- `actor_id` → `users.id`

---
## real_time_metrics

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `bigint` | NO | nextval('real_time_metrics_id_seq'::regclass) |
| **metric_name** | `character varying` | NO | - |
| **metric_category** | `character varying` | NO | - |
| **metric_value** | `numeric` | NO | - |
| **aggregation_type** | `character varying` | NO | - |
| **time_window** | `character varying` | NO | - |
| **timestamp** | `timestamp with time zone` | NO | - |
| **dimensions** | `jsonb` | YES | - |
| **created_at** | `timestamp with time zone` | YES | now() |

---
## recruiter_activity_log

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('recruiter_activity_log_id_seq'::regclass) |
| **recruiter_id** | `integer` | YES | - |
| **action** | `character varying` | YES | - |
| **resource_type** | `character varying` | YES | - |
| **resource_id** | `character varying` | YES | - |
| **details** | `jsonb` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## recruiter_vacancies

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | - |
| **title** | `text` | NO | - |
| **employer** | `text` | YES | - |
| **location** | `text` | YES | - |
| **description** | `text` | YES | - |
| **requirements** | `jsonb` | YES | - |
| **tags** | `jsonb` | YES | - |
| **posted_by** | `uuid` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **latitude** | `double precision` | YES | - |
| **longitude** | `double precision` | YES | - |

---
## role_requests

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | - |
| **user_id** | `integer` | YES | - |
| **requested_role** | `character varying` | NO | - |
| **status** | `character varying` | YES | 'pending'::character varying |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **documents** | `jsonb` | YES | - |
| **admin_notes** | `text` | YES | - |
| **reviewer_id** | `integer` | YES | - |

**Foreign Keys:**

- `user_id` → `users.id`
- `reviewer_id` → `users.id`

---
## saved_jobs

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('saved_jobs_id_seq'::regclass) |
| **user_id** | `integer` | NO | - |
| **job_id** | `integer` | NO | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## scholarships

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('scholarships_id_seq'::regclass) |
| **title** | `character varying` | NO | - |
| **provider_name** | `character varying` | NO | - |
| **description** | `text` | YES | - |
| **amount** | `character varying` | YES | - |
| **coverage_type** | `character varying` | YES | - |
| **deadline** | `date` | YES | - |
| **min_gpa** | `numeric` | YES | - |
| **academic_level** | `character varying` | YES | - |
| **eligible_majors** | `jsonb` | YES | '[]'::jsonb |
| **application_link** | `character varying` | YES | - |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **institution_id** | `uuid` | YES | - |

**Foreign Keys:**

- `institution_id` → `educational_institutions.id`

---
## school_programs

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **school_id** | `uuid` | NO | - |
| **title_en** | `character varying` | NO | - |
| **title_ar** | `character varying` | NO | - |
| **description_en** | `text` | NO | - |
| **description_ar** | `text` | NO | - |
| **category** | `character varying` | NO | - |
| **target_age_min** | `integer` | NO | - |
| **target_age_max** | `integer` | NO | - |
| **capacity_total** | `integer` | NO | - |
| **fees_amount** | `numeric` | NO | - |
| **status** | `character varying` | NO | 'draft'::character varying |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **capacity_available** | `integer` | YES | - |
| **fees_currency** | `text` | YES | - |
| **updated_at** | `timestamp without time zone` | YES | now() |

**Foreign Keys:**

- `school_id` → `schools.id`

---
## schools

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **name_en** | `character varying` | NO | - |
| **name_ar** | `character varying` | NO | - |
| **code** | `character varying` | NO | - |
| **location** | `character varying` | NO | - |
| **district** | `character varying` | NO | - |
| **coordinates** | `point` | YES | - |
| **contact_email** | `character varying` | YES | - |
| **contact_phone** | `character varying` | YES | - |
| **website_url** | `character varying` | YES | - |
| **khda_rating** | `character varying` | YES | - |
| **curriculum_type** | `ARRAY` | YES | - |
| **student_capacity** | `integer` | YES | - |
| **current_enrollment** | `integer` | YES | - |
| **established_year** | `integer` | YES | - |
| **principal_name** | `character varying` | YES | - |
| **is_active** | `boolean` | NO | true |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |

---
## shortlisted_candidates

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('shortlisted_candidates_id_seq'::regclass) |
| **job_id** | `integer` | NO | - |
| **candidate_id** | `integer` | NO | - |
| **hr_user_id** | `integer` | NO | - |
| **notes** | `text` | YES | - |
| **status** | `character varying` | YES | 'shortlisted'::character varying |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## skills

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **name** | `character varying` | NO | - |
| **category** | `character varying` | YES | - |
| **description** | `text` | YES | - |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## student_achievements

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **student_id** | `uuid` | NO | - |
| **title** | `character varying` | NO | - |
| **achievement_date** | `date` | NO | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `student_id` → `students.id`

---
## student_behavior

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **student_id** | `uuid` | NO | - |
| **class_id** | `uuid` | YES | - |
| **incident_date** | `date` | NO | - |
| **incident_type** | `character varying` | YES | - |
| **description** | `text` | YES | - |
| **reported_by** | `integer` | NO | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `class_id` → `classes.id`
- `reported_by` → `users.id`
- `student_id` → `students.id`

---
## student_guardians

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **student_id** | `uuid` | NO | - |
| **guardian_type** | `character varying` | YES | - |
| **first_name** | `character varying` | NO | - |
| **last_name** | `character varying` | NO | - |
| **arabic_name** | `character varying` | YES | - |
| **email** | `character varying` | YES | - |
| **phone** | `character varying` | YES | - |
| **is_primary_contact** | `boolean` | YES | false |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `student_id` → `students.id`

---
## student_progress

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **enrollment_id** | `uuid` | NO | - |
| **module_id** | `uuid` | YES | - |
| **progress_percentage** | `numeric` | YES | 0.00 |
| **time_spent_minutes** | `integer` | YES | 0 |
| **last_accessed** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **completion_status** | `character varying` | YES | 'not_started'::character varying |
| **notes** | `text` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `enrollment_id` → `course_enrollments.id`
- `module_id` → `course_modules.id`

---
## students

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **user_id** | `integer` | YES | - |
| **student_id** | `character varying` | NO | - |
| **first_name** | `character varying` | NO | - |
| **last_name** | `character varying` | NO | - |
| **arabic_name** | `character varying` | YES | - |
| **date_of_birth** | `date` | NO | - |
| **gender** | `character varying` | YES | - |
| **nationality** | `character varying` | YES | 'UAE'::character varying |
| **emirate** | `character varying` | YES | - |
| **email** | `character varying` | YES | - |
| **phone** | `character varying` | YES | - |
| **emergency_contact_name** | `character varying` | YES | - |
| **emergency_contact_phone** | `character varying` | YES | - |
| **emergency_contact_relationship** | `character varying` | YES | - |
| **medical_conditions** | `text` | YES | - |
| **special_needs** | `text` | YES | - |
| **enrollment_date** | `date` | YES | CURRENT_DATE |
| **graduation_date** | `date` | YES | - |
| **status** | `character varying` | YES | 'active'::character varying |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `user_id` → `users.id`

---
## system_settings

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **setting_key** | `character varying` | NO | - |
| **setting_value** | `text` | YES | - |
| **setting_type** | `character varying` | YES | 'string'::character varying |
| **description** | `text` | YES | - |
| **is_public** | `boolean` | YES | false |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## team_members

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('team_members_id_seq'::regclass) |
| **company_id** | `integer` | YES | - |
| **user_id** | `integer` | NO | - |
| **role** | `character varying` | YES | - |
| **department** | `character varying` | YES | - |
| **is_active** | `boolean` | YES | true |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## uae_analytics_metrics

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `bigint` | NO | nextval('uae_analytics_metrics_id_seq'::regclass) |
| **metric_category** | `character varying` | NO | - |
| **emirate** | `character varying` | YES | - |
| **sector** | `character varying` | YES | - |
| **metric_name** | `character varying` | NO | - |
| **metric_value** | `numeric` | NO | - |
| **benchmark_value** | `numeric` | YES | - |
| **performance_indicator** | `character varying` | YES | - |
| **timestamp** | `timestamp with time zone` | NO | - |
| **metadata** | `jsonb` | YES | - |
| **created_at** | `timestamp with time zone` | YES | now() |

---
## user_activity_log

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('user_activity_log_id_seq'::regclass) |
| **user_id** | `integer` | NO | - |
| **action** | `character varying` | YES | - |
| **performed_by** | `integer` | YES | - |
| **details** | `jsonb` | YES | - |
| **ip_address** | `character varying` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## user_cvs

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `uuid` | NO | uuid_generate_v4() |
| **user_id** | `character varying` | NO | - |
| **title** | `character varying` | NO | - |
| **template_id** | `uuid` | YES | - |
| **language** | `character varying` | YES | 'en'::character varying |
| **personal_info** | `jsonb` | NO | '{}'::jsonb |
| **professional_summary** | `text` | YES | - |
| **technical_skills** | `jsonb` | YES | - |
| **soft_skills** | `jsonb` | YES | - |
| **languages_spoken** | `jsonb` | YES | '[]'::jsonb |
| **work_experience** | `jsonb` | YES | '[]'::jsonb |
| **education** | `jsonb` | YES | '[]'::jsonb |
| **certifications** | `jsonb` | YES | '[]'::jsonb |
| **projects** | `jsonb` | YES | '[]'::jsonb |
| **cv_score** | `integer` | YES | 0 |
| **ats_score** | `integer` | YES | 0 |
| **last_analyzed_at** | `timestamp without time zone` | YES | - |
| **status** | `character varying` | YES | 'draft'::character varying |
| **is_public** | `boolean` | YES | false |
| **sharing_token** | `character varying` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **last_accessed_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **template_name** | `text` | YES | - |
| **is_visible** | `boolean` | YES | false |
| **latitude** | `double precision` | YES | - |
| **longitude** | `double precision` | YES | - |
| **filename** | `text` | YES | - |
| **file_size** | `bigint` | YES | - |
| **file_type** | `text` | YES | - |
| **mime_type** | `text` | YES | - |
| **parsed_data** | `jsonb` | YES | - |
| **analysis_results** | `jsonb` | YES | - |
| **access_count** | `integer` | YES | 0 |
| **upload_timestamp** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `template_id` → `cv_templates.id`

---
## user_journey_analytics

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `bigint` | NO | nextval('user_journey_analytics_id_seq'::regclass) |
| **user_id** | `uuid` | NO | - |
| **journey_stage** | `character varying` | NO | - |
| **entry_timestamp** | `timestamp with time zone` | NO | - |
| **exit_timestamp** | `timestamp with time zone` | YES | - |
| **duration_seconds** | `integer` | YES | - |
| **actions_count** | `integer` | YES | 0 |
| **conversion_achieved** | `boolean` | YES | false |
| **drop_off_point** | `character varying` | YES | - |
| **journey_data** | `jsonb` | YES | - |
| **created_at** | `timestamp with time zone` | YES | now() |

---
## user_roles

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('user_roles_id_seq'::regclass) |
| **user_id** | `integer` | NO | - |
| **role** | `character varying` | NO | - |
| **assigned_by** | `integer` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

---
## user_sessions

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('user_sessions_id_seq'::regclass) |
| **user_id** | `integer` | YES | - |
| **session_token** | `character varying` | NO | - |
| **refresh_token** | `character varying` | YES | - |
| **expires_at** | `timestamp without time zone` | NO | - |
| **is_active** | `boolean` | YES | true |
| **ip_address** | `inet` | YES | - |
| **user_agent** | `text` | YES | - |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |

**Foreign Keys:**

- `user_id` → `users.id`

---
## users

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `integer` | NO | nextval('users_id_seq'::regclass) |
| **email** | `character varying` | NO | - |
| **password_hash** | `character varying` | NO | - |
| **full_name** | `character varying` | YES | - |
| **user_type** | `character varying` | NO | 'candidate'::character varying |
| **phone** | `character varying` | YES | - |
| **location** | `character varying` | YES | - |
| **emirate** | `character varying` | YES | - |
| **company** | `character varying` | YES | - |
| **job_title** | `character varying` | YES | - |
| **is_active** | `boolean` | YES | true |
| **is_verified** | `boolean` | YES | false |
| **created_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **updated_at** | `timestamp without time zone` | YES | CURRENT_TIMESTAMP |
| **last_login** | `timestamp without time zone` | YES | - |
| **profile_data** | `jsonb` | YES | '{}'::jsonb |
| **preferences** | `jsonb` | YES | '{}'::jsonb |
| **first_name** | `character varying` | YES | - |
| **last_name** | `character varying` | YES | - |
| **role** | `character varying` | YES | 'candidate'::character varying |
| **nationality** | `character varying` | YES | 'UAE'::character varying |
| **education_level** | `character varying` | YES | - |
| **preferred_salary_min** | `integer` | YES | - |
| **preferred_salary_max** | `integer` | YES | - |
| **preferred_location** | `character varying` | YES | - |
| **is_uae_national** | `boolean` | YES | false |
| **skills** | `ARRAY` | YES | - |
| **experience_years** | `integer` | YES | - |
| **username** | `character varying` | YES | - |
| **latitude** | `double precision` | YES | - |
| **longitude** | `double precision` | YES | - |
| **secondary_roles** | `ARRAY` | YES | '{}'::text[] |

---
## video_interview_sessions

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| **id** | `character varying` | NO | - |
| **application_id** | `uuid` | NO | - |
| **interviewer_id** | `integer` | NO | - |
| **candidate_id** | `integer` | NO | - |
| **interview_type** | `character varying` | NO | - |
| **scheduled_time** | `timestamp with time zone` | NO | - |
| **duration_minutes** | `integer` | YES | 60 |
| **status** | `character varying` | NO | 'scheduled'::character varying |
| **room_id** | `character varying` | NO | - |
| **recording_id** | `character varying` | YES | - |
| **ai_analysis_id** | `character varying` | YES | - |
| **created_at** | `timestamp with time zone` | YES | CURRENT_TIMESTAMP |
| **started_at** | `timestamp with time zone` | YES | - |
| **ended_at** | `timestamp with time zone` | YES | - |

**Foreign Keys:**

- `interviewer_id` → `users.id`
- `candidate_id` → `users.id`

---
