# Database Migrations

## How It Works

> [!WARNING]
> **`DATABASE_SCHEMA.md` is NOT the source of truth, despite what this file used
> to say.** The live `information_schema` is the only authority (see CLAUDE.md).
> The document was generated from a *localhost development* database — `migrate.py`'s
> own docstring says so — and it has drifted badly. Measured 2026-08-16:
>
> | | |
> |---|---|
> | tables documented / live | **130 / 295** |
> | type mismatches | **162** |
> | …on `id` / `*_id` columns | **83** |
> | columns `migrate.py` would add to live | 14 |
>
> Check it yourself before trusting it:
> ```bash
> python backend/scripts/schema_drift.py --joins-only
> ```

`backend/migrate.py` reads `DATABASE_SCHEMA.md`, compares it against the target
database, and issues `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ADD COLUMN IF NOT
EXISTS`. There is **no Alembic** or numbered-migration framework — it is declarative
and idempotent.

**What that means in practice, and it is not symmetrical:**

- **Against a POPULATED database it is safe.** It only ever adds; it never alters a
  column type. The worst it does today is add the 14 columns above.
- **Against a FRESH database it produces the WRONG schema.** You get the pre-EID
  shape, in which `application_status_history.application_id` is `uuid` while
  `job_applications.id` is `text` — **the two cannot be joined**, so application
  history becomes unreachable from applications. `users.id` comes out `integer`
  rather than the `character(15)` Emirates ID.

**So do not provision a clean production from this document.** CI gets away with it
only because `migrations/ci_provision.sql` converges the EID/PK/FK shape afterwards.
See issue #418. To bring the document back to truth:

```bash
python backend/scripts/schema_drift.py --regenerate   # then review the diff and run CI
```

```bash
# Dry-run (preview changes)
python backend/migrate.py --dry-run

# Apply to public schema
python backend/migrate.py

# Apply to QA schema
python backend/migrate.py --schema qa

# Apply to both public and QA
python backend/migrate.py --all-schemas
```

---

## SQL Migration Files (chronological)

These are incremental SQL scripts that were used **before** `migrate.py` existed or for
changes that go beyond simple column additions (e.g. type refactors, FK rebuilds).
They are kept for auditability.

| # | File | Date | Description |
|---|------|------|-------------|
| 1 | `20241001_job_application.sql` | 2024-10-01 | Create job application tables |
| 2 | `20241002_users_add_names.sql` | 2024-10-02 | Add first_name/last_name to users |
| 3 | `20241003_users_add_nationality.sql` | 2024-10-03 | Add nationality column to users |
| 4 | `20241004_users_full_name_nullable.sql` | 2024-10-04 | Make full_name nullable |
| 5 | `20241005_users_user_type_default.sql` | 2024-10-05 | Set default for user_type |
| 6 | `20241006_hr_minimal.sql` | 2024-10-06 | Create minimal HR tables |
| 7 | `20241007_job_postings_base.sql` | 2024-10-07 | Create base job_postings table |
| 8 | `20251012_video_interview.sql` | 2025-10-12 | Add video interview tables |
| 9 | `20251019_recruiter_extensions.sql` | 2025-10-19 | Extend recruiter tables (vacancies, activity) |
| 10 | `20260102_create_candidate_profiles.sql` | 2026-01-02 | Create candidate_profiles table |
| 11 | `nafis_talent_schema.sql` | — | NAFIS import batch & job seeker tables |
| 12 | `add_uaepass_columns.sql` | 2026-05-14 | UAE Pass OIDC columns on users |
| 13 | `add_lead_source_column.sql` | — | Add lead_source to companies |
| 14 | `001_company_workspace_schema.sql` | 2026-03-21 | Multi-tenant company workspace tables |
| 15 | `001_eid_refactor.sql` | 2026-05-20 | EID-first PK refactor (UUID → CHAR(15)) |

---

## Python Schema Migration Scripts

These scripts use `psycopg2` to CREATE tables or ALTER columns programmatically.
They are **not** run by `migrate.py` — run them manually if setting up ancillary
tables not yet captured in `DATABASE_SCHEMA.md`.

| File | Purpose |
|------|---------|
| `create_career_services_tables.py` | Creates internships, gigs, career_plans, salary_benchmarks, portfolio_projects |
| `create_education_tables.py` | Creates universities, programs, scholarships, LMS, training_programs |
| `create_intelligence_tables.py` | Creates skill_taxonomy, user_skills, user_recommendations, career_stages |
| `add_application_workflow_columns.py` | Adds educator approval workflow columns + startup_programs table |
| `add_reject_columns_to_job_offers.py` | Adds rejection columns to job_offers |

---

## Cleanup / Data-Fix Scripts

One-time scripts that standardise data types or clean up invalid rows.
**Do not re-run** on a database that has already been cleaned.

| File | Purpose |
|------|---------|
| `cleanup_and_standardize.py` | Converts VARCHAR user IDs to INTEGER, adds FK constraints |
| `cleanup_cvs.py` | Converts user_cvs.user_id to INTEGER, adds FK constraint |
| `validate_eid_migration.py` | Post-migration validator for `001_eid_refactor.sql` |

---

## Seed Scripts

Run these manually when setting up a **new environment** to populate reference data.

| File | Purpose |
|------|---------|
| `seed_career_services.py` | Seeds internships, gigs, salary benchmarks |
| `seed_education.py` | Seeds universities, programs, scholarships, LMS courses |
| `seed_roles.py` | Seeds role skill requirements and skill taxonomy |

---

## Archive (`archive/`)

The `archive/` directory contains historical backups and platform-specific helpers.
These files are **not used in production** and are kept for reference only.

| File | Description |
|------|-------------|
| `candidate_profiles_backup.json` | Point-in-time backup of candidate_profiles data |
| `users_backup_pre_eid.json` | Users table backup taken before the EID refactor |
| `dghr_prod_pre_eid_20260520_0131.dump` | pg_dump of production DB before EID migration |
| `run_migration.bat` | Legacy Windows batch file for running a single migration |

---

## Troubleshooting

### Database Connection Error

Make sure your `.env` file has the correct database credentials:

```
DB_HOST=localhost
DB_NAME=emirati_journey
DB_USER=emirati_user
DB_PASSWORD=your_password
DB_PORT=5432
```

### "relation does not exist"

Start the backend server first (which calls `migrate.py` on startup) to ensure all
core tables exist, then run the supplementary migration script.
