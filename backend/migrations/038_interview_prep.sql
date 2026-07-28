-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 038 — Interview Preparation (real question bank + practice sessions)
--
-- Feature: Career Entry → Interview Preparation (P5). The page advertised a
--   "500+ curated question bank" and an "AI-powered mock simulator", but NO
--   question bank existed, the "Practice Now" / "Start Session" buttons were
--   dead, and the industry chips were inert (data-honesty audit). This migration
--   gives the page a REAL, curated question bank and a place to record practice
--   sessions so the Performance tab shows real history. AI feedback on answers
--   reuses the existing /api/ai/assist (Qwen) infra via a new 'interview_feedback'
--   feature — no new LLM plumbing.
--
-- PRECONDITION verified against live DB (dghr_prod) 2026-07-28: neither
--   interview_questions nor interview_practice_sessions exists. users.id is
--   CHAR(15) (Emirates ID) → practice-session user_id is VARCHAR(15).
--
-- Idempotent + transactional. Re-run refreshes the seeded questions via
--   ON CONFLICT (external_key) DO UPDATE.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS interview_questions (
    id            SERIAL PRIMARY KEY,
    external_key  VARCHAR(64) NOT NULL UNIQUE,   -- stable seed key for upsert
    category      VARCHAR(40) NOT NULL,          -- behavioral|technical|situational|cultural_fit|leadership|problem_solving
    question_en   TEXT NOT NULL,
    question_ar   TEXT,
    hint_en       TEXT,
    hint_ar       TEXT,
    industry      VARCHAR(40) DEFAULT 'general', -- general|banking|technology|healthcare|government|energy|real_estate
    difficulty    VARCHAR(16) DEFAULT 'medium',  -- easy|medium|hard
    is_uae        BOOLEAN DEFAULT false,
    is_common     BOOLEAN DEFAULT false,
    sort_order    INTEGER DEFAULT 100,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_interview_questions_cat ON interview_questions (category) WHERE is_active;

CREATE TABLE IF NOT EXISTS interview_practice_sessions (
    id              SERIAL PRIMARY KEY,
    user_id         VARCHAR(15) NOT NULL,
    mode            VARCHAR(40),      -- quick|standard|full|industry|category
    category        VARCHAR(40),      -- when practising one category
    industry        VARCHAR(40),
    total_questions INTEGER DEFAULT 0,
    answered        INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user ON interview_practice_sessions (user_id);

-- ── Seed: curated, real questions ──────────────────────────────────────────
INSERT INTO interview_questions
    (external_key, category, question_en, question_ar, hint_en, hint_ar, industry, difficulty, is_uae, is_common, sort_order)
VALUES
-- Behavioral
('beh_self', 'behavioral', 'Tell me about yourself.', 'حدّثني عن نفسك.', 'A 90-second pitch: where you are now, relevant past experience, and why this role — not your life story.', 'عرض من 90 ثانية: أين أنت الآن، خبرتك السابقة ذات الصلة، ولماذا هذا الدور — لا سيرتك الكاملة.', 'general', 'easy', false, true, 10),
('beh_conflict', 'behavioral', 'Tell me about a time you resolved a conflict within your team.', 'حدّثني عن موقف حللت فيه نزاعاً داخل فريقك.', 'Use STAR — describe the situation, your specific action, and the measurable result.', 'استخدم STAR — صف الموقف وإجراءك المحدد والنتيجة القابلة للقياس.', 'general', 'medium', false, false, 20),
('beh_fail', 'behavioral', 'Describe a goal you failed to reach and what you learned.', 'صف هدفاً لم تحققه وما تعلمته منه.', 'Be honest; focus on the lesson and how you applied it afterwards.', 'كن صادقاً؛ ركّز على الدرس وكيف طبّقته لاحقاً.', 'general', 'medium', false, false, 30),
('beh_initiative', 'behavioral', 'Give an example of when you took initiative without being asked.', 'أعطِ مثالاً على مبادرة قمت بها دون أن يُطلب منك.', 'Show ownership and the concrete impact of your action.', 'أظهر روح المسؤولية والأثر الملموس لمبادرتك.', 'general', 'medium', false, false, 40),
('beh_change', 'behavioral', 'Tell me about a time you had to adapt to a major change at work.', 'حدّثني عن موقف اضطررت فيه للتكيّف مع تغيير كبير في العمل.', 'Highlight flexibility, a positive attitude, and a good outcome.', 'أبرز المرونة والموقف الإيجابي والنتيجة الجيدة.', 'general', 'medium', false, false, 50),
-- Technical
('tech_debug', 'technical', 'Walk me through how you would debug a failing production issue.', 'اشرح لي كيف تعالج مشكلة في نظام إنتاجي متعطّل.', 'Reproduce, isolate, form a hypothesis, fix, verify, then prevent recurrence.', 'أعد الإنتاج، اعزل المشكلة، ضع فرضية، أصلح، تحقّق، ثم امنع تكرارها.', 'technology', 'hard', false, false, 60),
('tech_current', 'technical', 'How do you keep your technical skills current?', 'كيف تحافظ على تحديث مهاراتك التقنية؟', 'Name concrete resources and one recent thing you learned and applied.', 'اذكر مصادر محددة وشيئاً حديثاً تعلمته وطبّقته.', 'technology', 'easy', false, false, 70),
('tech_explain', 'technical', 'Explain a complex technical concept to a non-technical audience.', 'اشرح مفهوماً تقنياً معقداً لجمهور غير تقني.', 'Use a simple analogy and avoid jargon.', 'استخدم تشبيهاً بسيطاً وتجنّب المصطلحات المعقدة.', 'technology', 'medium', false, false, 80),
('tech_perf', 'technical', 'Describe a project where you improved performance or efficiency.', 'صف مشروعاً حسّنت فيه الأداء أو الكفاءة.', 'Quantify the before and after.', 'قِس الوضع قبل وبعد بالأرقام.', 'technology', 'medium', false, false, 90),
('tech_quality', 'technical', 'How do you ensure the quality of your work?', 'كيف تضمن جودة عملك؟', 'Mention reviews, testing, and the standards you follow.', 'اذكر المراجعات والاختبار والمعايير التي تتبعها.', 'general', 'easy', false, false, 100),
-- Situational
('sit_deadline', 'situational', 'A deadline is at risk and resources are limited — what do you do?', 'موعد نهائي مهدد والموارد محدودة — ماذا تفعل؟', 'Prioritise, communicate early, and propose realistic options.', 'رتّب الأولويات، تواصل مبكراً، واقترح خيارات واقعية.', 'general', 'medium', false, false, 110),
('sit_disagree', 'situational', 'You disagree with your manager''s decision. How do you handle it?', 'تختلف مع قرار مديرك. كيف تتصرف؟', 'Raise concerns respectfully with data; commit fully once a decision is made.', 'اطرح تحفظاتك باحترام مدعوماً بالبيانات؛ والتزم تماماً بعد اتخاذ القرار.', 'general', 'medium', false, false, 120),
('sit_newtask', 'situational', 'You are assigned a task outside your expertise. What is your approach?', 'يُسند إليك عمل خارج مجال خبرتك. ما نهجك؟', 'Learn quickly, ask the right questions, and deliver in small increments.', 'تعلّم بسرعة، اطرح الأسئلة الصحيحة، وسلّم على دفعات صغيرة.', 'general', 'medium', false, false, 130),
('sit_priorities', 'situational', 'Two important priorities compete for your time. How do you decide?', 'أولويتان مهمتان تتنافسان على وقتك. كيف تقرر؟', 'Align with business impact and the relevant stakeholders.', 'وازِن حسب الأثر على العمل وأصحاب المصلحة المعنيين.', 'general', 'medium', false, false, 140),
-- Cultural fit (UAE-heavy)
('cul_multi', 'cultural_fit', 'How do you adapt to a multicultural workplace like the UAE''s?', 'كيف تتكيّف مع بيئة عمل متعددة الثقافات كالإمارات؟', 'Show respect for diversity and give concrete cross-cultural experience.', 'أظهر احترام التنوع وقدّم تجربة ملموسة بين الثقافات.', 'general', 'easy', true, false, 150),
('cul_emirat', 'cultural_fit', 'What do you understand about Emiratisation, and how would you contribute?', 'ماذا تعرف عن التوطين، وكيف ستسهم فيه؟', 'Connect your growth and knowledge transfer to national talent goals.', 'اربط تطورك ونقل معرفتك بأهداف الكوادر الوطنية.', 'government', 'medium', true, false, 160),
('cul_d33', 'cultural_fit', 'How would your work support Dubai''s D33 economic agenda?', 'كيف يدعم عملك أجندة دبي الاقتصادية D33؟', 'Tie your skills to a D33 priority sector (digital, trade, tourism, etc.).', 'اربط مهاراتك بقطاع ذي أولوية في D33 (الرقمي، التجارة، السياحة، إلخ).', 'general', 'medium', true, false, 170),
('cul_values', 'cultural_fit', 'How do you demonstrate respect for local values and traditions at work?', 'كيف تُظهر احترامك للقيم والتقاليد المحلية في العمل؟', 'Give practical examples of awareness and considerate behaviour.', 'قدّم أمثلة عملية على الوعي والسلوك المراعي.', 'general', 'easy', true, false, 180),
-- Leadership
('lead_challenge', 'leadership', 'Describe a time you led a team through a difficult challenge.', 'صف موقفاً قدت فيه فريقاً عبر تحدٍّ صعب.', 'Focus on your decisions and how you enabled others to succeed.', 'ركّز على قراراتك وكيف مكّنت الآخرين من النجاح.', 'general', 'hard', false, false, 190),
('lead_motivate', 'leadership', 'How do you motivate a team that is under pressure?', 'كيف تحفّز فريقاً يعمل تحت ضغط؟', 'Show empathy, clear priorities, and recognition.', 'أظهر التعاطف ووضوح الأولويات والتقدير.', 'general', 'medium', false, false, 200),
('lead_decision', 'leadership', 'Tell me about a difficult decision you made as a leader.', 'حدّثني عن قرار صعب اتخذته كقائد.', 'Explain the trade-offs you weighed and the outcome.', 'اشرح المفاضلات التي وازنتها والنتيجة.', 'general', 'hard', false, false, 210),
('lead_develop', 'leadership', 'How do you develop the people you manage?', 'كيف تطوّر الأشخاص الذين تديرهم؟', 'Mention feedback, stretch assignments, and coaching.', 'اذكر التغذية الراجعة والمهام التطويرية والتوجيه.', 'general', 'medium', false, false, 220),
-- Problem solving
('prob_complex', 'problem_solving', 'Describe a complex problem you solved and the approach you took.', 'صف مشكلة معقدة حللتها والنهج الذي اتبعته.', 'Structure it: define, analyse, weigh options, decide, and show the result.', 'رتّبها: عرّف، حلّل، وازن الخيارات، قرّر، وأظهر النتيجة.', 'general', 'medium', false, false, 230),
('prob_nosolution', 'problem_solving', 'How do you approach a problem with no obvious solution?', 'كيف تتعامل مع مشكلة بلا حل واضح؟', 'Break it down, test assumptions, and iterate.', 'قسّمها، اختبر الافتراضات، وكرّر المحاولة.', 'general', 'medium', false, false, 240),
('prob_data', 'problem_solving', 'Give an example of a data-driven decision you made.', 'أعطِ مثالاً على قرار اتخذته بناءً على البيانات.', 'Name the data, the decision, and the measurable impact.', 'اذكر البيانات والقرار والأثر القابل للقياس.', 'banking', 'medium', false, false, 250),
('prob_process', 'problem_solving', 'Tell me about a time you improved a process.', 'حدّثني عن موقف حسّنت فيه إجراءً ما.', 'Quantify the time, cost, or quality gain.', 'قِس المكسب في الوقت أو التكلفة أو الجودة.', 'general', 'easy', false, false, 260),
-- A few common/basics
('com_why', 'behavioral', 'Why do you want this job?', 'لماذا تريد هذه الوظيفة؟', 'Link the role to your goals and what you can contribute — be specific about the company.', 'اربط الدور بأهدافك وبما يمكنك تقديمه — وكن محدداً بشأن الشركة.', 'general', 'easy', false, true, 12),
('com_strength', 'behavioral', 'What are your greatest strengths?', 'ما هي أبرز نقاط قوتك؟', 'Pick strengths relevant to the role and back each with a quick example.', 'اختر نقاط قوة ذات صلة بالدور وادعم كلاً منها بمثال سريع.', 'general', 'easy', false, true, 14),
('com_5yr', 'behavioral', 'Where do you see yourself in five years?', 'أين ترى نفسك بعد خمس سنوات؟', 'Show ambition that aligns with a realistic path at this employer.', 'أظهر طموحاً يتماشى مع مسار واقعي لدى جهة العمل هذه.', 'general', 'easy', false, true, 16)
ON CONFLICT (external_key) DO UPDATE SET
    category    = EXCLUDED.category,
    question_en = EXCLUDED.question_en,
    question_ar = EXCLUDED.question_ar,
    hint_en     = EXCLUDED.hint_en,
    hint_ar     = EXCLUDED.hint_ar,
    industry    = EXCLUDED.industry,
    difficulty  = EXCLUDED.difficulty,
    is_uae      = EXCLUDED.is_uae,
    is_common   = EXCLUDED.is_common,
    sort_order  = EXCLUDED.sort_order,
    is_active   = true;

COMMIT;

-- ── Verification (expected results) ────────────────────────────────────────
-- SELECT count(*) FROM interview_questions WHERE is_active;                    -- expect 30
-- SELECT category, count(*) FROM interview_questions GROUP BY category ORDER BY 1;
-- SELECT to_regclass('public.interview_practice_sessions');                    -- not null
