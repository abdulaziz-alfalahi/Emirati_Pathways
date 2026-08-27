/**
 * enumLabels — bilingual labels for enum-like DATA values.
 *
 * These are values the API returns as raw enum tokens ("full-time",
 * "intermediate", "advisory", "completed"). They are NOT UI copy, so they never
 * pass through the usual `t(en, ar)` helper and used to leak English into the
 * Arabic UI.
 *
 * Rules:
 *  - Every lookup FALLS BACK to the raw value. Never render '' or 'undefined'.
 *  - Genuine data (job titles, skill names, company names, "UAE Employer",
 *    "ATS") is NOT translated here — only closed enum domains.
 *  - Digits stay Western; the rest of the app renders them that way.
 */

export type Lang = 'en' | 'ar';

/** Convenience for call sites that only hold an `isRTL` boolean. */
export const langOf = (isRTL: boolean): Lang => (isRTL ? 'ar' : 'en');

type Pair = { en: string; ar: string };
type Domain = Record<string, Pair>;

/** Normalise an API token: trim, lowercase, collapse `_`/`-`/spaces to a space. */
const key = (raw: string): string =>
  raw.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

/**
 * Core lookup. Returns the raw value untouched when the domain has no entry,
 * or when the value is empty/nullish.
 */
const lookup = (domain: Domain, raw: string | null | undefined, lang: Lang): string => {
  if (raw === null || raw === undefined) return '';
  const value = String(raw);
  if (!value.trim()) return value;
  const hit = domain[key(value)];
  return hit ? hit[lang] : value;
};

// ── Employment type ──────────────────────────────────────────────────────────
// Domain from src/types/platform.ts (`employment_type`) and
// src/types/credentialVerification.ts, plus values the job APIs emit.
const EMPLOYMENT_TYPES: Domain = {
  'full time': { en: 'Full-time', ar: 'دوام كامل' },
  'part time': { en: 'Part-time', ar: 'دوام جزئي' },
  contract: { en: 'Contract', ar: 'عقد' },
  contractual: { en: 'Contract', ar: 'عقد' },
  temporary: { en: 'Temporary', ar: 'مؤقت' },
  permanent: { en: 'Permanent', ar: 'دائم' },
  internship: { en: 'Internship', ar: 'تدريب' },
  freelance: { en: 'Freelance', ar: 'عمل حر' },
  volunteer: { en: 'Volunteer', ar: 'تطوعي' },
  remote: { en: 'Remote', ar: 'عن بُعد' },
  hybrid: { en: 'Hybrid', ar: 'هجين' },
  onsite: { en: 'On-site', ar: 'من المقر' },
};

export const employmentTypeLabel = (raw: string | null | undefined, lang: Lang): string =>
  lookup(EMPLOYMENT_TYPES, raw, lang);

// ── Salary placeholders ──────────────────────────────────────────────────────
// Real salary ranges ("15,000 - 25,000 AED") fall through unchanged; only the
// canned placeholders the backend substitutes are mapped.
const SALARY_PLACEHOLDERS: Domain = {
  competitive: { en: 'Competitive', ar: 'تنافسي' },
  'competitive salary': { en: 'Competitive salary', ar: 'راتب تنافسي' },
  'competitive package': { en: 'Competitive package', ar: 'حزمة تنافسية' },
  negotiable: { en: 'Negotiable', ar: 'قابل للتفاوض' },
  'not specified': { en: 'Not specified', ar: 'غير محدد' },
  'not disclosed': { en: 'Not disclosed', ar: 'غير معلن' },
  unpaid: { en: 'Unpaid', ar: 'غير مدفوع' },
};

export const salaryLabel = (raw: string | null | undefined, lang: Lang): string =>
  lookup(SALARY_PLACEHOLDERS, raw, lang);

// ── Job posting source ───────────────────────────────────────────────────────
// RecommendedJob.source: 'live' | 'curated' (src/services/intelligenceAPI.ts).
const JOB_SOURCES: Domain = {
  live: { en: 'Live', ar: 'مباشر' },
  curated: { en: 'Curated', ar: 'مختارة' },
};

export const jobSourceLabel = (raw: string | null | undefined, lang: Lang): string =>
  lookup(JOB_SOURCES, raw, lang);

// ── Skill proficiency ────────────────────────────────────────────────────────
// Domain from backend/skill_graph_engine.py `ProficiencyLevel`.
const SKILL_LEVELS: Domain = {
  none: { en: 'None', ar: 'لا يوجد' },
  novice: { en: 'Novice', ar: 'مبتدئ جداً' },
  beginner: { en: 'Beginner', ar: 'مبتدئ' },
  intermediate: { en: 'Intermediate', ar: 'متوسط' },
  advanced: { en: 'Advanced', ar: 'متقدم' },
  expert: { en: 'Expert', ar: 'خبير' },
};

export const skillLevelLabel = (raw: string | null | undefined, lang: Lang): string =>
  lookup(SKILL_LEVELS, raw, lang);

// ── Recommendation type ──────────────────────────────────────────────────────
// Domain from backend/recommendation_engine.py `RecommendationType`.
const RECOMMENDATION_TYPES: Domain = {
  training: { en: 'Training', ar: 'تدريب' },
  mentor: { en: 'Mentor', ar: 'إرشاد' },
  mentorship: { en: 'Mentorship', ar: 'إرشاد' },
  certification: { en: 'Certification', ar: 'شهادة' },
  advisory: { en: 'Advisory', ar: 'استشارية' },
  job: { en: 'Job', ar: 'وظيفة' },
  community: { en: 'Community', ar: 'مجتمع' },
  internship: { en: 'Internship', ar: 'تدريب' },
  gig: { en: 'Gig', ar: 'عمل مؤقت' },
  project: { en: 'Project', ar: 'مشروع' },
};

export const recommendationTypeLabel = (raw: string | null | undefined, lang: Lang): string =>
  lookup(RECOMMENDATION_TYPES, raw, lang);

// ── Effort / session estimates ───────────────────────────────────────────────
// Domain from backend/recommendation_engine.py + backend/skill_graph_engine.py
// (`effort`). Duration ranges carry a number, so they are handled by pattern
// after the fixed lookups miss.
const EFFORTS: Domain = {
  ongoing: { en: 'Ongoing', ar: 'مستمر' },
  immediate: { en: 'Immediate', ar: 'فوري' },
  low: { en: 'Low effort', ar: 'جهد منخفض' },
  medium: { en: 'Medium effort', ar: 'جهد متوسط' },
  high: { en: 'High effort', ar: 'جهد مرتفع' },
};

const UNIT_AR: Record<string, { one: string; many: string }> = {
  session: { one: 'الجلسة', many: 'الجلسة' },
  day: { one: 'يوم', many: 'أيام' },
  week: { one: 'أسبوع', many: 'أسابيع' },
  month: { one: 'شهر', many: 'أشهر' },
  year: { one: 'سنة', many: 'سنوات' },
  hour: { one: 'ساعة', many: 'ساعات' },
};

/**
 * Effort/session estimate: "1 session", "2-4 weeks", "1-3 months", "Ongoing".
 * Sessions render as `الجلسة 1` (Western digits, as elsewhere in the app).
 * Anything unrecognised comes back verbatim.
 */
export const sessionTypeLabel = (raw: string | null | undefined, lang: Lang): string => {
  if (raw === null || raw === undefined) return '';
  const value = String(raw);
  if (!value.trim()) return value;
  if (lang === 'en') return EFFORTS[key(value)]?.en ?? value;

  const fixed = EFFORTS[key(value)];
  if (fixed) return fixed.ar;

  // "1 session", "2-4 weeks", "1-3 months" → digits + Arabic unit.
  const m = key(value).match(/^(\d+(?:\s*[-–]\s*\d+)?)\s*(session|day|week|month|year|hour)s?$/);
  if (m) {
    const count = m[1].replace(/\s*[-–]\s*/, '-');
    const unit = UNIT_AR[m[2]];
    const isOne = count === '1';
    return m[2] === 'session'
      ? `${unit.one} ${count}`
      : `${count} ${isOne ? unit.one : unit.many}`;
  }
  return value;
};

// ── Interview round / title ──────────────────────────────────────────────────
// `interview_schedules.interview_title` + `interview_round`
// (backend/recruiter/interview_engine.py).
const INTERVIEW_ROUNDS: Domain = {
  'first round': { en: 'First round', ar: 'الجولة الأولى' },
  'second round': { en: 'Second round', ar: 'الجولة الثانية' },
  'third round': { en: 'Third round', ar: 'الجولة الثالثة' },
  'final round': { en: 'Final round', ar: 'الجولة النهائية' },
  'round 1': { en: 'Round 1', ar: 'الجولة 1' },
  'round 2': { en: 'Round 2', ar: 'الجولة 2' },
  'round 3': { en: 'Round 3', ar: 'الجولة 3' },
  screening: { en: 'Screening', ar: 'الفرز المبدئي' },
  'phone screen': { en: 'Phone screen', ar: 'مقابلة هاتفية' },
  'phone interview': { en: 'Phone interview', ar: 'مقابلة هاتفية' },
  'technical interview': { en: 'Technical interview', ar: 'مقابلة تقنية' },
  'hr interview': { en: 'HR interview', ar: 'مقابلة الموارد البشرية' },
  'final interview': { en: 'Final interview', ar: 'المقابلة النهائية' },
  interview: { en: 'Interview', ar: 'مقابلة' },
  'interview scheduled': { en: 'Interview Scheduled', ar: 'مقابلة مجدولة' },
};

export const interviewRoundLabel = (raw: string | null | undefined, lang: Lang): string =>
  lookup(INTERVIEW_ROUNDS, raw, lang);

// ── Status ───────────────────────────────────────────────────────────────────
// Union of interview-session statuses (src/components/candidate/Interviews.tsx),
// application statuses (src/components/candidate/ApplicationTracker.tsx,
// src/types/skillsMarketplace.ts) and offer statuses.
const STATUSES: Domain = {
  scheduled: { en: 'Scheduled', ar: 'مجدولة' },
  confirmed: { en: 'Confirmed', ar: 'مؤكدة' },
  accepted: { en: 'Accepted', ar: 'مقبول' },
  'in progress': { en: 'In progress', ar: 'جارية' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  cancelled: { en: 'Cancelled', ar: 'ملغاة' },
  canceled: { en: 'Cancelled', ar: 'ملغاة' },
  expired: { en: 'Expired', ar: 'منتهية' },
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  submitted: { en: 'Submitted', ar: 'تم الإرسال' },
  'under review': { en: 'Under review', ar: 'تحت المراجعة' },
  reviewed: { en: 'Reviewed', ar: 'تمت المراجعة' },
  shortlisted: { en: 'Shortlisted', ar: 'في القائمة المختصرة' },
  interview: { en: 'Interview', ar: 'مقابلة' },
  offer: { en: 'Offer', ar: 'عرض' },
  offered: { en: 'Offered', ar: 'تم تقديم عرض' },
  hired: { en: 'Hired', ar: 'تم التوظيف' },
  rejected: { en: 'Rejected', ar: 'مرفوض' },
  withdrawn: { en: 'Withdrawn', ar: 'تم السحب' },
  active: { en: 'Active', ar: 'نشط' },
  inactive: { en: 'Inactive', ar: 'غير نشط' },
  draft: { en: 'Draft', ar: 'مسودة' },
  closed: { en: 'Closed', ar: 'مغلق' },
};

export const statusLabel = (raw: string | null | undefined, lang: Lang): string =>
  lookup(STATUSES, raw, lang);

// ── Role ─────────────────────────────────────────────────────────────────────
// Domain from src/types/auth.ts ROLE_DISPLAY_NAMES + the role maps in
// UserMenu.tsx / HybridGovernmentNavFixed.tsx.
const ROLES: Domain = {
  // GENERATED FROM backend/role_labels.py — the one registry for what a role is
  // CALLED. Regenerate rather than editing an entry here; enumLabels.roles.test
  // fails if this drifts from the Python.
  //
  // There were SEVEN of these maps: this one, ROLE_DISPLAY_NAMES in
  // types/auth.ts, ROLE_DISPLAY_NAMES_AR in UserMenu, a pair of identical
  // ROLE_LABELS in StaffInvitationsTab and JoinStaffPage, and two on the
  // backend. Reported 2026-08-27 — "the role is showing in one place but not
  // the other" — and before that as fb_1785840837, which is the same defect
  // with different screenshots.
  admin: { en: 'Administrator', ar: 'مسؤول النظام' },
  administrator: { en: 'Administrator', ar: 'مسؤول النظام' },
  advisor: { en: 'Academic Advisor', ar: 'المرشد الأكاديمي' },
  'assessment operator': { en: 'Assessment Operator', ar: 'مشغّل التقييم' },
  assessor: { en: 'Assessor', ar: 'المُقيِّم' },
  'board chairman': { en: 'Board Chairman', ar: 'رئيس المجلس' },
  'board member': { en: 'EHRDC Board Member', ar: 'عضو مجلس الموارد البشرية' },
  'board operator': { en: 'Board Secretary', ar: 'أمين سر المجلس' },
  'call center agent': { en: 'Call Center Agent', ar: 'موظف مركز الاتصال' },
  candidate: { en: 'Job Seeker', ar: 'باحث عن عمل' },
  'career services operator': { en: 'Career Services Operator', ar: 'مشغّل خدمات المسار المهني' },
  coach: { en: 'Career Coach', ar: 'المدرّب المهني' },
  'community operator': { en: 'Community Operator', ar: 'مشغّل المجتمعات' },
  'compliance auditor': { en: 'Government Official', ar: 'مسؤول حكومي' },
  'education operator': { en: 'Education Operator', ar: 'مشغّل قطاع التعليم' },
  employee: { en: 'Employee', ar: 'موظف' },
  'employer admin': { en: 'HR Manager', ar: 'مدير الموارد البشرية' },
  'employer relations': { en: 'Company Onboarding Operator', ar: 'مشغّل انضمام الشركات' },
  entrepreneur: { en: 'Entrepreneur', ar: 'رائد أعمال' },
  'growth operator': { en: 'Growth Operator', ar: 'مشغّل النمو' },
  hr: { en: 'HR', ar: 'الموارد البشرية' },
  'hr manager': { en: 'HR Manager', ar: 'مدير الموارد البشرية' },
  'internship coordinator': { en: 'Internship Coordinator', ar: 'منسّق التدريب العملي' },
  mentor: { en: 'Mentor', ar: 'الموجّه' },
  'mentorship operator': { en: 'Mentorship Operator', ar: 'مشغّل الإرشاد' },
  operator: { en: 'Operator (legacy)', ar: 'مشغّل (قديم)' },
  parent: { en: 'Parent / Guardian', ar: 'ولي الأمر' },
  'platform administrator': { en: 'Administrator', ar: 'مسؤول النظام' },
  'platform operator': { en: 'Monitoring Center Operator', ar: 'مشغّل مركز المتابعة' },
  'professional dev operator': { en: 'Professional Development Operator', ar: 'مشغّل التطوير المهني' },
  recruiter: { en: 'Recruiter', ar: 'أخصائي توظيف' },
  seeker: { en: 'Job Seeker', ar: 'باحث عن عمل' },
  student: { en: 'Student', ar: 'طالب' },
  'super admin': { en: 'Administrator', ar: 'مسؤول النظام' },
  'super user': { en: 'Administrator', ar: 'مسؤول النظام' },
  'talent operator': { en: 'Candidate Onboarding Operator', ar: 'مشغّل انضمام المرشحين' },
  'training center rep': { en: 'Training Center Representative', ar: 'ممثل مركز تدريب' },
  'training provider': { en: 'Educator', ar: 'مزوّد تدريب' },

  // Not roles, but role-shaped values the same lookup is asked for.
  'government entity': { en: 'Government Entity', ar: 'جهة حكومية' },
  'private sector': { en: 'Private Sector', ar: 'قطاع خاص' },
  'new member': { en: 'New Member', ar: 'عضو جديد' },
};

export const roleLabel = (raw: string | null | undefined, lang: Lang): string =>
  lookup(ROLES, raw, lang);

// ── Recent-activity strings ──────────────────────────────────────────────────
// backend/candidate_job_routes.py builds these server-side in English. Until
// the endpoint returns structured fields, localise the known templates here;
// job titles and company names inside them are left untouched (real data).

const ACTIVITY_TITLES: Domain = {
  'applied to job': { en: 'Applied to Job', ar: 'تم التقديم على وظيفة' },
  'interview scheduled': { en: 'Interview Scheduled', ar: 'مقابلة مجدولة' },
  'profile viewed': { en: 'Profile Viewed', ar: 'تمت مشاهدة الملف' },
  'job match': { en: 'Job Match', ar: 'وظيفة مطابقة' },
};

/**
 * Activity title: an activity label if known, otherwise an interview-round
 * name if known (titles come from `interview_schedules.interview_title`,
 * e.g. "First round"), otherwise the raw value.
 */
export const activityTitleLabel = (raw: string | null | undefined, lang: Lang): string => {
  if (raw === null || raw === undefined) return '';
  const value = String(raw);
  if (!value.trim()) return value;
  const hit = ACTIVITY_TITLES[key(value)];
  if (hit) return hit[lang];
  return interviewRoundLabel(value, lang);
};

/**
 * Activity description. Rewrites the two server templates:
 *   "Submitted application for {job} at {company}"
 *   "Interview for {job} (Status: {status})"
 * The interpolated job/company stay verbatim; only the frame and the status
 * enum are translated. Unrecognised descriptions pass through.
 */
export const activityDescriptionLabel = (raw: string | null | undefined, lang: Lang): string => {
  if (raw === null || raw === undefined) return '';
  const value = String(raw);
  if (lang === 'en' || !value.trim()) return value;

  const applied = value.match(/^Submitted application for (.+?) at (.+)$/);
  if (applied) return `تم إرسال طلب توظيف لوظيفة ${applied[1]} لدى ${applied[2]}`;

  const interview = value.match(/^Interview for (.+?) \(Status: (.+?)\)$/);
  if (interview) {
    return `مقابلة لوظيفة ${interview[1]} (الحالة: ${statusLabel(interview[2], 'ar')})`;
  }

  // Bare "(Status: x)" suffix on any other description.
  return value.replace(
    /\(Status: (.+?)\)/g,
    (_m, s: string) => `(الحالة: ${statusLabel(s, 'ar')})`
  );
};
