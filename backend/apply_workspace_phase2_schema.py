"""
Phase 2 — Workspace Feature Enrichment: Database Schema Migration

Creates 7 new tables + 1 ALTER for Phase 2 workspace features:
  1. workspace_emiratization_targets
  2. workspace_document_templates
  3. workspace_generated_documents
  4. workspace_csv_uploads
  5. workspace_engagement_events
  6. workspace_mentor_reports
  7. workspace_resource_vault
  + ALTER companies ADD workspace_branding

Usage:
    python backend/apply_workspace_phase2_schema.py
"""

import psycopg2
import os
import sys

DB_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://emirati_user:emirati_secure_password@127.0.0.1:5432/emirati_journey'
)

MIGRATIONS = [
    # ── Feature Set 1: Emiratisation & Compliance ──────────────────
    """
    CREATE TABLE IF NOT EXISTS workspace_emiratization_targets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        year INT NOT NULL,
        quarter INT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
        target_percentage NUMERIC(5,2) DEFAULT 80.0,
        actual_percentage NUMERIC(5,2),
        total_headcount INT,
        emirati_headcount INT,
        mohre_deadline DATE,
        salary_support_amount NUMERIC(12,2),
        grant_projections JSONB DEFAULT '{}',
        compliance_status VARCHAR(20) DEFAULT 'on_track',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(company_id, year, quarter)
    );
    """,

    # ── Feature Set 2: Administrative Automation ──────────────────
    """
    CREATE TABLE IF NOT EXISTS workspace_document_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        template_name VARCHAR(200) NOT NULL,
        template_type VARCHAR(50) NOT NULL,
        html_template TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        is_default BOOLEAN DEFAULT FALSE,
        created_by INT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,

    """
    CREATE TABLE IF NOT EXISTS workspace_generated_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        template_id UUID REFERENCES workspace_document_templates(id),
        employee_id INT,
        document_type VARCHAR(50) NOT NULL,
        document_data JSONB NOT NULL,
        pdf_url TEXT,
        generated_by INT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,

    """
    CREATE TABLE IF NOT EXISTS workspace_csv_uploads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        upload_type VARCHAR(50) NOT NULL,
        original_filename VARCHAR(500),
        file_path TEXT,
        column_mapping JSONB NOT NULL DEFAULT '{}',
        row_count INT,
        success_count INT DEFAULT 0,
        error_count INT DEFAULT 0,
        error_log JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'pending',
        uploaded_by INT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
    );
    """,

    # ── Feature Set 3: Retention & Development Analytics ──────────
    """
    CREATE TABLE IF NOT EXISTS workspace_engagement_events (
        id BIGSERIAL PRIMARY KEY,
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        employee_id INT NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        resource_assignment_id UUID,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,

    """
    CREATE INDEX IF NOT EXISTS idx_engagement_company_employee
    ON workspace_engagement_events(company_id, employee_id);
    """,

    """
    CREATE INDEX IF NOT EXISTS idx_engagement_created
    ON workspace_engagement_events(company_id, created_at);
    """,

    """
    CREATE TABLE IF NOT EXISTS workspace_mentor_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        resource_assignment_id UUID REFERENCES company_resource_assignments(id),
        employee_id INT NOT NULL,
        mentor_id INT REFERENCES users(id),
        report_type VARCHAR(30) DEFAULT 'progress',
        summary TEXT NOT NULL,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        strengths JSONB DEFAULT '[]',
        areas_for_improvement JSONB DEFAULT '[]',
        recommendations TEXT,
        is_visible_to_employee BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,

    # ── Feature Set 4: Custom Branding & Resource Libraries ───────
    """
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_branding JSONB DEFAULT '{}';
    """,

    """
    CREATE TABLE IF NOT EXISTS workspace_resource_vault (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        file_name VARCHAR(500) NOT NULL,
        file_type VARCHAR(100),
        file_size_bytes BIGINT,
        file_path TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        tags JSONB DEFAULT '[]',
        uploaded_by INT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,

    # ── Seed default document templates ───────────────────────────
    """
    INSERT INTO workspace_document_templates (id, company_id, template_name, template_type, html_template, is_default)
    VALUES (
        'a0000000-0000-0000-0000-000000000001',
        NULL,
        'Salary Certificate',
        'salary_certificate',
        '<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px;">
          <div style="text-align: center; border-bottom: 2px solid #0D9488; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #0D9488; margin: 0;">{{company_name}}</h1>
            <p style="color: #6B7280; margin: 4px 0 0;">{{company_industry}}</p>
          </div>
          <h2 style="text-align: center; color: #111827;">Salary Certificate</h2>
          <p style="color: #374151; line-height: 1.8;">
            This is to certify that <strong>{{employee_name}}</strong> (Employee ID: {{employee_id}})
            is employed at <strong>{{company_name}}</strong> as <strong>{{job_title}}</strong>
            in the <strong>{{department}}</strong> department since <strong>{{start_date}}</strong>.
          </p>
          <p style="color: #374151; line-height: 1.8;">
            Their current monthly salary is <strong>AED {{monthly_salary}}</strong>
            ({{salary_in_words}}).
          </p>
          <p style="color: #374151; line-height: 1.8;">
            This certificate is issued upon the request of the employee for whatever
            purpose it may serve.
          </p>
          <div style="margin-top: 60px;">
            <p style="color: #374151;"><strong>{{signatory_name}}</strong></p>
            <p style="color: #6B7280;">{{signatory_title}}</p>
            <p style="color: #6B7280;">Date: {{issue_date}}</p>
          </div>
        </div>',
        TRUE
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        NULL,
        'Training Completion Letter',
        'training_letter',
        '<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px;">
          <div style="text-align: center; border-bottom: 2px solid #0D9488; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #0D9488; margin: 0;">{{company_name}}</h1>
            <p style="color: #6B7280; margin: 4px 0 0;">Training & Development</p>
          </div>
          <h2 style="text-align: center; color: #111827;">Training Completion Certificate</h2>
          <p style="color: #374151; line-height: 1.8;">
            This is to certify that <strong>{{employee_name}}</strong>,
            {{job_title}} in the {{department}} department, has successfully completed
            the following training program:
          </p>
          <div style="background: #F0FDFA; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 700; color: #0D9488;">{{training_name}}</p>
            <p style="margin: 4px 0 0; color: #6B7280; font-size: 14px;">
              Duration: {{training_duration}} | Completed: {{completion_date}}
            </p>
          </div>
          <p style="color: #374151; line-height: 1.8;">
            We commend their dedication to professional growth and continuous learning.
          </p>
          <div style="margin-top: 60px;">
            <p style="color: #374151;"><strong>{{signatory_name}}</strong></p>
            <p style="color: #6B7280;">{{signatory_title}}</p>
            <p style="color: #6B7280;">Date: {{issue_date}}</p>
          </div>
        </div>',
        TRUE
    )
    ON CONFLICT (id) DO NOTHING;
    """,
]


def main():
    print("=" * 60)
    print("Phase 2 — Workspace Schema Migration")
    print("=" * 60)

    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = False
        cur = conn.cursor()

        for i, sql in enumerate(MIGRATIONS, 1):
            # Extract table/index name for logging
            name = "migration"
            for keyword in ['CREATE TABLE', 'CREATE INDEX', 'ALTER TABLE', 'INSERT INTO']:
                if keyword in sql.upper():
                    parts = sql.strip().split('\n')[0] if '\n' in sql else sql
                    name = parts.strip()[:80]
                    break

            try:
                cur.execute(sql)
                print(f"  [{i}/{len(MIGRATIONS)}] ✅ {name.strip()[:70]}")
            except Exception as e:
                # Skip if already exists errors
                conn.rollback()
                conn.autocommit = False
                print(f"  [{i}/{len(MIGRATIONS)}] ⚠️  {name.strip()[:70]} — {str(e)[:60]}")

        conn.commit()
        cur.close()
        conn.close()
        print("\n✅ All migrations applied successfully!")
        return 0

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
