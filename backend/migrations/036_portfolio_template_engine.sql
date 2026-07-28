-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 036 — Portfolio Template Engine (D33 economic levers)
--
-- Issue / feature: Career Entry → Portfolio page (P3). The Portfolio "Templates"
--   tab shipped as 6 hard-coded mock cards with dead buttons and fabricated
--   "Popular" badges (data-honesty audit, 2026-07). The owner asked for a REAL
--   template engine whose templates map to the Dubai Economic Agenda "D33"
--   priority economic levers, so a candidate's portfolio can be framed toward the
--   sectors the national economy is actively growing.
--
-- WHY a DB table (not code constants): templates are content the Professional
--   Development / Career Services operators will curate over time (add sectors,
--   revise highlighted skills as the D33 sector strategies evolve). Mirrors the
--   existing catalogue pattern (cv_templates, job_templates, training_programs).
--
-- PRECONDITION verified against live DB (dghr_prod @ 10.228.145.66:5454) on
--   2026-07-28:
--     • No 'portfolio_templates' table exists (checked information_schema.tables;
--       only pg_ts_template, cv_templates, job_templates, assessment_templates,
--       workspace_document_templates).
--     • users has 'availability_status' + 'available_for_recruitment' but NO
--       'portfolio_template_key' column.
--     • portfolio_projects exists (user_id varchar, category, skills_demonstrated
--       jsonb, is_public bool) — templates are presentation-only and do NOT alter
--       stored projects.
--   If run elsewhere and these objects already exist, every statement is guarded
--   (IF NOT EXISTS / ON CONFLICT) so re-running only refreshes seed content.
--
-- Idempotent + transactional. Safe to run repeatedly (re-run refreshes the 8
--   seed rows via ON CONFLICT (key) DO UPDATE).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Catalogue table ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS portfolio_templates (
    id                      SERIAL PRIMARY KEY,
    key                     VARCHAR(64)  NOT NULL UNIQUE,
    name                    VARCHAR(160) NOT NULL,
    name_ar                 VARCHAR(160),
    d33_lever               VARCHAR(160) NOT NULL,
    d33_lever_ar            VARCHAR(160),
    description             TEXT,
    description_ar          TEXT,
    accent_color            VARCHAR(9)   DEFAULT '#0D9488',
    icon                    VARCHAR(40)  DEFAULT 'Briefcase',
    recommended_categories  JSONB        DEFAULT '[]'::jsonb,  -- [{en,ar}]
    highlighted_skills      JSONB        DEFAULT '[]'::jsonb,  -- ["Python", ...]
    sections                JSONB        DEFAULT '[]'::jsonb,  -- [{key,en,ar}]
    guidance                JSONB        DEFAULT '[]'::jsonb,  -- [{en,ar}]
    sort_order              INTEGER      DEFAULT 100,
    is_active               BOOLEAN      DEFAULT true,
    created_at              TIMESTAMP    DEFAULT NOW(),
    updated_at              TIMESTAMP    DEFAULT NOW()
);

-- 2. Per-user selection ------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_template_key VARCHAR(64);

-- 3. Seed the 8 D33-lever templates -----------------------------------------
INSERT INTO portfolio_templates
    (key, name, name_ar, d33_lever, d33_lever_ar, description, description_ar,
     accent_color, icon, recommended_categories, highlighted_skills, sections, guidance, sort_order)
VALUES
(
    'digital_economy_ai',
    'Digital Economy & AI', 'الاقتصاد الرقمي والذكاء الاصطناعي',
    'Digital Economy & AI', 'الاقتصاد الرقمي والذكاء الاصطناعي',
    'Frame your work toward the digital economy — lead with a shipped AI, software or data product and quantify its impact.',
    'وجّه أعمالك نحو الاقتصاد الرقمي — ابدأ بمنتج ذكاء اصطناعي أو برمجي أو بيانات تم إطلاقه وقِس أثره.',
    '#6366F1', 'Cpu',
    '[{"en":"AI & Machine Learning","ar":"الذكاء الاصطناعي وتعلم الآلة"},{"en":"Software Engineering","ar":"هندسة البرمجيات"},{"en":"Data & Analytics","ar":"البيانات والتحليلات"},{"en":"Cloud & DevOps","ar":"الحوسبة السحابية"}]'::jsonb,
    '["Python","Machine Learning","Cloud Computing","Data Engineering","TypeScript","APIs"]'::jsonb,
    '[{"key":"featured","en":"Featured Build","ar":"المشروع المميز"},{"key":"technical","en":"Technical Projects","ar":"المشاريع التقنية"},{"key":"opensource","en":"Open Source","ar":"مصادر مفتوحة"},{"key":"certs","en":"Certifications","ar":"الشهادات"}]'::jsonb,
    '[{"en":"Lead with one shipped product and quantify its impact (users, latency, accuracy).","ar":"ابدأ بمنتج واحد تم إطلاقه وقِس أثره (المستخدمون، زمن الاستجابة، الدقة)."},{"en":"Make your role in the stack explicit — model, data, or platform.","ar":"وضّح دورك في المنظومة — النموذج أو البيانات أو المنصة."}]'::jsonb,
    10
),
(
    'advanced_manufacturing',
    'Advanced Manufacturing', 'التصنيع المتقدم',
    'Advanced Manufacturing (Operation 300bn)', 'التصنيع المتقدم (مشروع 300 مليار)',
    'Align with Operation 300bn — showcase process, automation and quality work with hard efficiency gains.',
    'انسجم مع مشروع 300 مليار — اعرض أعمال العمليات والأتمتة والجودة مع مكاسب كفاءة ملموسة.',
    '#0EA5E9', 'Factory',
    '[{"en":"Industrial Automation","ar":"الأتمتة الصناعية"},{"en":"Process Engineering","ar":"هندسة العمليات"},{"en":"Quality & Lean","ar":"الجودة والتصنيع الرشيق"},{"en":"Supply Chain","ar":"سلسلة الإمداد"}]'::jsonb,
    '["Lean Six Sigma","Automation","CAD","Quality Control","IoT","Process Optimization"]'::jsonb,
    '[{"key":"featured","en":"Flagship Project","ar":"المشروع الرئيسي"},{"key":"process","en":"Process Improvements","ar":"تحسينات العمليات"},{"key":"quality","en":"Quality & Safety","ar":"الجودة والسلامة"},{"key":"certs","en":"Certifications","ar":"الشهادات"}]'::jsonb,
    '[{"en":"Quantify throughput, defect-rate or cost gains — numbers matter most here.","ar":"قِس الإنتاجية أو معدل العيوب أو خفض التكلفة — الأرقام هي الأهم هنا."},{"en":"Reference the standards you worked to (ISO, Six Sigma belt).","ar":"أشِر إلى المعايير التي عملت وفقها (آيزو، حزام سيكس سيغما)."}]'::jsonb,
    20
),
(
    'sustainability_green',
    'Sustainability & Green Economy', 'الاستدامة والاقتصاد الأخضر',
    'Sustainability & Net Zero 2050', 'الاستدامة والحياد المناخي 2050',
    'Support Net Zero 2050 — present renewable-energy, ESG and circular-economy work with measurable environmental outcomes.',
    'ادعم الحياد المناخي 2050 — اعرض أعمال الطاقة المتجددة والحوكمة البيئية والاقتصاد الدائري بنتائج بيئية قابلة للقياس.',
    '#16A34A', 'Leaf',
    '[{"en":"Renewable Energy","ar":"الطاقة المتجددة"},{"en":"ESG & Reporting","ar":"الحوكمة البيئية والتقارير"},{"en":"Circular Economy","ar":"الاقتصاد الدائري"},{"en":"Environmental Engineering","ar":"الهندسة البيئية"}]'::jsonb,
    '["ESG Reporting","Renewable Energy","Carbon Accounting","Sustainability Strategy","Environmental Compliance"]'::jsonb,
    '[{"key":"featured","en":"Impact Project","ar":"مشروع الأثر"},{"key":"initiatives","en":"Green Initiatives","ar":"المبادرات الخضراء"},{"key":"reporting","en":"ESG & Reporting","ar":"الحوكمة والتقارير"},{"key":"certs","en":"Certifications","ar":"الشهادات"}]'::jsonb,
    '[{"en":"Lead with the environmental outcome (tCO2e avoided, energy saved, waste diverted).","ar":"ابدأ بالنتيجة البيئية (طن مكافئ CO2 تم تجنبه، طاقة موفّرة، نفايات محوّلة)."},{"en":"Tie the project to a national target (Net Zero 2050, Green Agenda).","ar":"اربط المشروع بهدف وطني (الحياد المناخي 2050، الأجندة الخضراء)."}]'::jsonb,
    30
),
(
    'financial_services',
    'Financial Services & FinTech', 'الخدمات المالية والتقنية المالية',
    'Financial Services & FinTech', 'الخدمات المالية والتقنية المالية',
    'Position for the financial hub — highlight analysis, risk, compliance and fintech builds with clear commercial results.',
    'تموضع للمركز المالي — أبرز التحليل والمخاطر والامتثال ومنتجات التقنية المالية بنتائج تجارية واضحة.',
    '#4338CA', 'Landmark',
    '[{"en":"FinTech","ar":"التقنية المالية"},{"en":"Financial Analysis","ar":"التحليل المالي"},{"en":"Risk & Compliance","ar":"المخاطر والامتثال"},{"en":"Blockchain","ar":"سلسلة الكتل"}]'::jsonb,
    '["Financial Modeling","Risk Management","Compliance","SQL","Fintech","Data Analysis"]'::jsonb,
    '[{"key":"featured","en":"Signature Analysis","ar":"التحليل المميز"},{"key":"projects","en":"Projects & Models","ar":"المشاريع والنماذج"},{"key":"risk","en":"Risk & Compliance","ar":"المخاطر والامتثال"},{"key":"certs","en":"Certifications","ar":"الشهادات"}]'::jsonb,
    '[{"en":"State the commercial result (return, cost saved, risk reduced) up front.","ar":"اذكر النتيجة التجارية (العائد، التكلفة الموفّرة، المخاطر المخفّضة) في البداية."},{"en":"Name the frameworks/regulations you applied (IFRS, Basel, DFSA).","ar":"اذكر الأطر/اللوائح التي طبّقتها (IFRS، بازل، DFSA)."}]'::jsonb,
    40
),
(
    'trade_logistics',
    'Trade & Logistics', 'التجارة والخدمات اللوجستية',
    'Trade & Logistics', 'التجارة والخدمات اللوجستية',
    'Back the trade agenda — present supply-chain, logistics and procurement work that moved goods faster and cheaper.',
    'ادعم أجندة التجارة — اعرض أعمال سلسلة الإمداد واللوجستيات والمشتريات التي حرّكت البضائع أسرع وبتكلفة أقل.',
    '#EA580C', 'Ship',
    '[{"en":"Supply Chain","ar":"سلسلة الإمداد"},{"en":"Logistics Operations","ar":"العمليات اللوجستية"},{"en":"Trade & Customs","ar":"التجارة والجمارك"},{"en":"Procurement","ar":"المشتريات"}]'::jsonb,
    '["Supply Chain Management","Logistics","Procurement","ERP","Trade Compliance","Operations"]'::jsonb,
    '[{"key":"featured","en":"Flagship Operation","ar":"العملية الرئيسية"},{"key":"projects","en":"Projects","ar":"المشاريع"},{"key":"optimization","en":"Cost & Time Wins","ar":"مكاسب التكلفة والوقت"},{"key":"certs","en":"Certifications","ar":"الشهادات"}]'::jsonb,
    '[{"en":"Quantify lead-time, cost-per-unit or on-time-delivery improvements.","ar":"قِس تحسينات زمن التسليم أو التكلفة لكل وحدة أو الالتزام بالمواعيد."},{"en":"Show the scale you operated at (SKUs, routes, shipment volume).","ar":"أظهر النطاق الذي عملت به (عدد الأصناف، المسارات، حجم الشحنات)."}]'::jsonb,
    50
),
(
    'tourism_creative',
    'Tourism & Creative Economy', 'السياحة والاقتصاد الإبداعي',
    'Tourism & Creative Economy', 'السياحة والاقتصاد الإبداعي',
    'Fuel the creative economy — a visual-first portfolio for hospitality, media, design and experience work.',
    'غذِّ الاقتصاد الإبداعي — معرض بصري أولاً لأعمال الضيافة والإعلام والتصميم والتجارب.',
    '#DB2777', 'Palette',
    '[{"en":"Hospitality","ar":"الضيافة"},{"en":"Digital Media","ar":"الإعلام الرقمي"},{"en":"Design","ar":"التصميم"},{"en":"Events & Experiences","ar":"الفعاليات والتجارب"}]'::jsonb,
    '["Hospitality Management","Content Creation","UX/UI Design","Event Management","Branding","Storytelling"]'::jsonb,
    '[{"key":"featured","en":"Showcase Piece","ar":"العمل المميز"},{"key":"gallery","en":"Portfolio Gallery","ar":"معرض الأعمال"},{"key":"experiences","en":"Experiences Delivered","ar":"التجارب المنفّذة"},{"key":"press","en":"Press & Recognition","ar":"التغطية والتقدير"}]'::jsonb,
    '[{"en":"Lead with visuals — let the work speak before the words do.","ar":"ابدأ بالصور — دع العمل يتحدث قبل الكلمات."},{"en":"Add reach or attendance numbers where you have them.","ar":"أضف أرقام الوصول أو الحضور حيثما توفّرت."}]'::jsonb,
    60
),
(
    'entrepreneurship',
    'Entrepreneurship & FDI', 'ريادة الأعمال والاستثمار الأجنبي',
    'Entrepreneurship & FDI', 'ريادة الأعمال والاستثمار الأجنبي',
    'Show founder DNA — product, growth and venture work aligned with the startup and foreign-investment agenda.',
    'أظهر حسّ التأسيس — أعمال المنتج والنمو والمشاريع الناشئة المتوافقة مع أجندة الشركات الناشئة والاستثمار الأجنبي.',
    '#CA8A04', 'Rocket',
    '[{"en":"Startups & Ventures","ar":"الشركات الناشئة"},{"en":"Product Management","ar":"إدارة المنتجات"},{"en":"Growth & Marketing","ar":"النمو والتسويق"},{"en":"Business Development","ar":"تطوير الأعمال"}]'::jsonb,
    '["Product Management","Growth Marketing","Fundraising","Business Development","Lean Startup","Go-to-Market"]'::jsonb,
    '[{"key":"featured","en":"Venture / Product","ar":"المشروع / المنتج"},{"key":"traction","en":"Traction & Metrics","ar":"الجاذبية والمقاييس"},{"key":"projects","en":"Projects","ar":"المشاريع"},{"key":"recognition","en":"Recognition","ar":"التقدير"}]'::jsonb,
    '[{"en":"Lead with traction — users, revenue, funding, or growth rate.","ar":"ابدأ بالجاذبية — المستخدمون أو الإيرادات أو التمويل أو معدل النمو."},{"en":"Show what you built end-to-end and the outcome it drove.","ar":"أظهر ما بنيته من البداية للنهاية والنتيجة التي حققها."}]'::jsonb,
    70
),
(
    'health_life_sciences',
    'Health & Life Sciences', 'الصحة وعلوم الحياة',
    'Health & Life Sciences', 'الصحة وعلوم الحياة',
    'Advance the health sector — clinical, research and health-tech work with rigorous, evidence-led outcomes.',
    'طوّر قطاع الصحة — أعمال سريرية وبحثية وتقنية صحية بنتائج دقيقة قائمة على الأدلة.',
    '#0891B2', 'Activity',
    '[{"en":"Healthcare","ar":"الرعاية الصحية"},{"en":"Biotech & Research","ar":"التقنية الحيوية والبحث"},{"en":"Health Tech","ar":"التقنية الصحية"},{"en":"Clinical","ar":"السريري"}]'::jsonb,
    '["Clinical Research","Healthcare","Biotechnology","Health Informatics","Data Analysis","Regulatory Affairs"]'::jsonb,
    '[{"key":"featured","en":"Key Study / Project","ar":"الدراسة / المشروع الرئيسي"},{"key":"research","en":"Research & Publications","ar":"البحث والمنشورات"},{"key":"projects","en":"Projects","ar":"المشاريع"},{"key":"certs","en":"Certifications & Licences","ar":"الشهادات والتراخيص"}]'::jsonb,
    '[{"en":"Lead with the evidence — sample size, outcome measure, and result.","ar":"ابدأ بالدليل — حجم العينة ومقياس النتيجة والنتيجة."},{"en":"Note ethics/regulatory approvals where relevant.","ar":"أشِر إلى الموافقات الأخلاقية/التنظيمية عند الاقتضاء."}]'::jsonb,
    80
)
ON CONFLICT (key) DO UPDATE SET
    name                   = EXCLUDED.name,
    name_ar                = EXCLUDED.name_ar,
    d33_lever              = EXCLUDED.d33_lever,
    d33_lever_ar           = EXCLUDED.d33_lever_ar,
    description            = EXCLUDED.description,
    description_ar         = EXCLUDED.description_ar,
    accent_color           = EXCLUDED.accent_color,
    icon                   = EXCLUDED.icon,
    recommended_categories = EXCLUDED.recommended_categories,
    highlighted_skills     = EXCLUDED.highlighted_skills,
    sections               = EXCLUDED.sections,
    guidance               = EXCLUDED.guidance,
    sort_order             = EXCLUDED.sort_order,
    is_active              = true,
    updated_at             = NOW();

COMMIT;

-- ── Verification (expected results) ────────────────────────────────────────
-- SELECT count(*) FROM portfolio_templates WHERE is_active;            -- expect 8
-- SELECT key, d33_lever FROM portfolio_templates ORDER BY sort_order;  -- 8 levers
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='users' AND column_name='portfolio_template_key'; -- 1 row
