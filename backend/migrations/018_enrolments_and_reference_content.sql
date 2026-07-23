-- 018_enrolments_and_reference_content.sql
-- Close the last "partial" services from the 2026-07-23 catalog audit:
--   TD-01: training enrolment had no storage — the page's Apply button had
--          nothing to write to (course_enrollments belongs to the separate
--          training_courses/uuid system; training_programs ids are INTEGER).
--   IP-02: startup_programs and ns_* tables were created empty by migration
--          017 — the pages rendered blank catalogues.
--
-- PRECONDITION (verified live 2026-07-23):
--   - training_program_enrollments ABSENT; training_programs.id is integer
--     (5 rows); users.id CHAR(15).
--   - startup_programs exists (migration 017) and is EMPTY.
--   - ns_programs / ns_partners / ns_enrolment_steps exist (017) and are EMPTY.
-- Seeds are guarded by WHERE NOT EXISTS on each target table, so re-running
-- is a no-op and operator-entered content is never overwritten.
--
-- Content policy: the startup catalogue below is the SAME factual UAE-
-- institution list the frontend has always shipped as its fallback
-- (Khalifa Fund, Hub71, Dubai SME, Sheraa, ADIO, in5) — moved server-side.
-- National-service content is limited to publicly documented facts (program
-- names, authority, generic enrolment steps). ns_milestones and
-- ns_sustainability_impact are deliberately LEFT EMPTY: those are statistics
-- and would be fabricated data (audit issue #26).

BEGIN;

-- 1) Training-programme enrolments (integer program ids, CHAR(15) users) ----
CREATE TABLE IF NOT EXISTS training_program_enrollments (
    id          SERIAL PRIMARY KEY,
    program_id  INTEGER NOT NULL REFERENCES training_programs(id),
    user_id     CHAR(15) NOT NULL REFERENCES users(id),
    status      VARCHAR(30) NOT NULL DEFAULT 'enrolled',   -- enrolled|completed|cancelled
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (program_id, user_id)
);

-- 2) Startup programmes — the app's own factual fallback list, server-side --
INSERT INTO startup_programs (name, name_ar, location, location_ar, description, description_ar, website, type, focus, is_active)
SELECT * FROM (VALUES
 ('Khalifa Fund for Enterprise Development','صندوق خليفة لتطوير المشاريع','Abu Dhabi','أبوظبي',
  'Comprehensive support for Emirati entrepreneurs including financing, training, mentoring, and marketing assistance',
  'دعم شامل لرواد الأعمال الإماراتيين يشمل التمويل والتدريب والإرشاد والمساعدة التسويقية',
  'https://khalifafund.ae','Accelerator','["All Sectors"]'::jsonb, TRUE),
 ('Hub71','Hub71','Abu Dhabi','أبوظبي',
  'Abu Dhabi''s global tech ecosystem offering incentive packages, venture capital access, and a community of startups',
  'المنظومة التقنية العالمية في أبوظبي تقدم حزم حوافز ووصولاً لرأس المال الجريء ومجتمعاً للشركات الناشئة',
  'https://hub71.com','Incubator','["Technology"]'::jsonb, TRUE),
 ('Dubai SME (Mohammed bin Rashid Establishment)','مؤسسة محمد بن راشد لتنمية المشاريع','Dubai','دبي',
  'Support for SMEs in Dubai through business incubation, funding programs, market access, and regulatory assistance',
  'دعم المشاريع الصغيرة والمتوسطة في دبي من خلال الحضانة والتمويل والوصول للأسواق والمساعدة التنظيمية',
  '','Government','["All Sectors"]'::jsonb, TRUE),
 ('Sharjah Entrepreneurship Center (Sheraa)','مركز الشارقة لريادة الأعمال (شراع)','Sharjah','الشارقة',
  'Startup accelerator and incubator offering mentorship, co-working spaces, and seed funding for early-stage ventures',
  'مسرّعة ومحتضنة أعمال تقدم الإرشاد ومساحات العمل المشتركة والتمويل الأولي للمشاريع الناشئة',
  '','Accelerator','["Technology","Social Enterprise"]'::jsonb, TRUE),
 ('ADIO Startup Program','برنامج أديو للشركات الناشئة','Abu Dhabi','أبوظبي',
  'Financial and non-financial incentives for innovative startups to establish and scale in Abu Dhabi',
  'حوافز مالية وغير مالية للشركات الناشئة المبتكرة للتأسيس والتوسع في أبوظبي',
  '','Government','["FinTech","HealthTech","AgriTech"]'::jsonb, TRUE),
 ('in5 Innovation Centers','مراكز in5 للابتكار','Dubai','دبي',
  'Enabling platform for entrepreneurs through facilities, mentoring, funding access, and networking in tech, media, and design',
  'منصة تمكينية لرواد الأعمال من خلال المرافق والإرشاد والوصول للتمويل والتواصل في التكنولوجيا والإعلام والتصميم',
  '','Incubator','["Tech","Media","Design"]'::jsonb, TRUE)
) AS seed(name,name_ar,location,location_ar,description,description_ar,website,type,focus,is_active)
WHERE NOT EXISTS (SELECT 1 FROM startup_programs);

-- 3) National service — factual reference content only ----------------------
INSERT INTO ns_programs (title_en, title_ar, org_en, org_ar, duration_en, duration_ar, icon,
                         status_key, status_label_en, status_label_ar, spots, desc_en, desc_ar,
                         tags_en, tags_ar, highlights_en, highlights_ar)
SELECT * FROM (VALUES
 ('UAE National Service','الخدمة الوطنية الإماراتية',
  'National and Reserve Service Authority','هيئة الخدمة الوطنية والاحتياطية',
  'As set by the National Service law','وفق قانون الخدمة الوطنية','shield',
  'open','Enrolment via official channels','التسجيل عبر القنوات الرسمية','',
  'The UAE National Service program for eligible Emirati citizens, building discipline, skills and national identity. Enrolment and eligibility are handled through the official authority.',
  'برنامج الخدمة الوطنية الإماراتية للمواطنين المستوفين للشروط، يبني الانضباط والمهارات والهوية الوطنية. يتم التسجيل وتحديد الأهلية عبر الجهة الرسمية.',
  '["national service","citizenship"]'::jsonb,'["الخدمة الوطنية","المواطنة"]'::jsonb,
  '["Skills and leadership development","Pathways to further education and employment after service"]'::jsonb,
  '["تنمية المهارات والقيادة","مسارات للتعليم والتوظيف بعد الخدمة"]'::jsonb),
 ('Reserve Service','خدمة الاحتياط',
  'National and Reserve Service Authority','هيئة الخدمة الوطنية والاحتياطية',
  'Periodic service as scheduled','خدمة دورية وفق الجدولة','users',
  'open','For national service graduates','لخريجي الخدمة الوطنية','',
  'Continued periodic reserve duty for national service graduates, maintaining readiness alongside civilian careers.',
  'واجب احتياطي دوري لخريجي الخدمة الوطنية للحفاظ على الجاهزية إلى جانب المسيرة المدنية.',
  '["reserve","readiness"]'::jsonb,'["الاحتياط","الجاهزية"]'::jsonb,
  '["Maintains skills after active service","Compatible with civilian employment"]'::jsonb,
  '["الحفاظ على المهارات بعد الخدمة الفعلية","متوافقة مع العمل المدني"]'::jsonb)
) AS seed(title_en,title_ar,org_en,org_ar,duration_en,duration_ar,icon,status_key,status_label_en,status_label_ar,spots,desc_en,desc_ar,tags_en,tags_ar,highlights_en,highlights_ar)
WHERE NOT EXISTS (SELECT 1 FROM ns_programs);

INSERT INTO ns_partners (name_en, name_ar, role_en, role_ar, logo)
SELECT * FROM (VALUES
 ('National and Reserve Service Authority','هيئة الخدمة الوطنية والاحتياطية','Program authority','الجهة المنظمة للبرنامج',''),
 ('Ministry of Defence','وزارة الدفاع','Supervising ministry','الوزارة المشرفة','')
) AS seed(name_en,name_ar,role_en,role_ar,logo)
WHERE NOT EXISTS (SELECT 1 FROM ns_partners);

INSERT INTO ns_enrolment_steps (step, title_en, title_ar, desc_en, desc_ar)
SELECT * FROM (VALUES
 (1,'Register through official channels','التسجيل عبر القنوات الرسمية',
    'Submit your registration through the authority''s official portal or centres.','قدّم تسجيلك عبر البوابة الرسمية للهيئة أو مراكزها.'),
 (2,'Eligibility and medical checks','فحوص الأهلية والفحص الطبي',
    'Complete the eligibility review and required medical fitness assessment.','أكمل مراجعة الأهلية والفحص الطبي المطلوب.'),
 (3,'Receive your enrolment decision','استلام قرار الالتحاق',
    'You are notified of your intake, assignment and start date.','يتم إشعارك بالدفعة والتكليف وتاريخ البدء.'),
 (4,'Complete service and certification','إتمام الخدمة والشهادة',
    'Complete the program and receive your service certificate, opening education and employment pathways.','أتمّ البرنامج واحصل على شهادة الخدمة بما يفتح مسارات التعليم والتوظيف.')
) AS seed(step,title_en,title_ar,desc_en,desc_ar)
WHERE NOT EXISTS (SELECT 1 FROM ns_enrolment_steps);

COMMIT;

-- VERIFICATION:
--   SELECT COUNT(*) FROM training_program_enrollments;  -- 0
--   SELECT COUNT(*) FROM startup_programs;              -- 6
--   SELECT COUNT(*) FROM ns_programs;                   -- 2
--   SELECT COUNT(*) FROM ns_partners;                   -- 2
--   SELECT COUNT(*) FROM ns_enrolment_steps;            -- 4
--   SELECT COUNT(*) FROM ns_milestones;                 -- 0 (intentional)
--   SELECT COUNT(*) FROM ns_sustainability_impact;      -- 0 (intentional)
