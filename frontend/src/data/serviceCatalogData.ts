// EHRDC Service Catalog — data layer
// Provides types, data access, role mapping, and stats for the Service Catalog page.

export interface ServiceItem {
  code: string;
  name: string;
  group: string;
  groupCode: string;
  description: string;
  goal: string;
  target: string;
  conditions: string;
  documents: string;
  steps: string[];
  channels: string;
  duration: string;
  fees: string;
  outputs: string;
  limitations: string;
  partners: string;
  kpis: string;
  platformStatus: 'active' | 'partial' | 'gap' | 'correction';
  platformModule: string;
  platformPath: string;
  gapNotes: string;
  isNew: boolean;
  isCorrection: boolean;
  // New fields from Manus guide
  platformRoles: string[];
  aiModel: string;
  relatedForms: string;
}

export interface ServiceGroup {
  code: string;
  name: string;
  color: string;
  description: string;
  services: ServiceItem[];
}

import catalogData from './serviceCatalog.json';

export const serviceGroups: ServiceGroup[] = catalogData as ServiceGroup[];

export const allServices: ServiceItem[] = serviceGroups.flatMap((g) => g.services);

export const getServicesByGroup = (groupCode: string): ServiceItem[] =>
  serviceGroups.find((g) => g.code === groupCode)?.services ?? [];

export const getServiceByCode = (code: string): ServiceItem | undefined =>
  allServices.find((s) => s.code === code);

export const getGroupByCode = (code: string): ServiceGroup | undefined =>
  serviceGroups.find((g) => g.code === code);

export const newServices: ServiceItem[] = allServices.filter((s) => s.isNew);

export const correctionServices: ServiceItem[] = allServices.filter((s) => s.isCorrection);

export const serviceStats = {
  totalGroups: serviceGroups.length,
  totalServices: allServices.length,
  activeServices: allServices.filter((s) => s.platformStatus === 'active').length,
  partialServices: allServices.filter((s) => s.platformStatus === 'partial').length,
  gapServices: allServices.filter((s) => s.platformStatus === 'gap').length,
  newServices: newServices.length,
  correctionServices: correctionServices.length,
} as const;

// ─── Role Mapping ────────────────────────────────────────────────

/** Bilingual role labels and descriptions */
export const roleLabels: Record<string, { en: string; ar: string; descEN: string; descAR: string; icon: string }> = {
  candidate: {
    en: 'Job Seeker / Candidate',
    ar: 'باحث عن عمل / مرشح',
    descEN: 'Individuals seeking employment, career development, or upskilling opportunities.',
    descAR: 'الأفراد الباحثون عن فرص عمل أو تطوير مهني أو تنمية المهارات.',
    icon: '👤',
  },
  advisor: {
    en: 'Career Advisor',
    ar: 'مستشار مهني',
    descEN: 'Certified career advisors providing guidance and academic counseling.',
    descAR: 'المستشارون المهنيون المعتمدون الذين يقدمون الإرشاد والتوجيه الأكاديمي.',
    icon: '🧭',
  },
  coach: {
    en: 'Career Coach',
    ar: 'مدرب مهني',
    descEN: 'Professional coaches helping candidates develop career strategies.',
    descAR: 'المدربون المهنيون الذين يساعدون المرشحين في وضع استراتيجيات مهنية.',
    icon: '🎯',
  },
  recruiter: {
    en: 'Recruiter / HR',
    ar: 'مسؤول توظيف / موارد بشرية',
    descEN: 'HR professionals managing job postings, candidate screening, and interviews.',
    descAR: 'مختصو الموارد البشرية المسؤولون عن نشر الوظائف وفرز المرشحين وإجراء المقابلات.',
    icon: '💼',
  },
  employer_admin: {
    en: 'Employer Admin',
    ar: 'مسؤول صاحب العمل',
    descEN: 'Company administrators managing workspace, compliance, and workforce data.',
    descAR: 'مديرو الشركات المسؤولون عن إدارة مساحة العمل والامتثال وبيانات القوى العاملة.',
    icon: '🏢',
  },
  training_provider: {
    en: 'Training Provider',
    ar: 'مقدم تدريب',
    descEN: 'Training centers and educational institutions offering certified programs.',
    descAR: 'مراكز التدريب والمؤسسات التعليمية التي تقدم برامج معتمدة.',
    icon: '🎓',
  },
  assessor: {
    en: 'Assessor',
    ar: 'مقيّم',
    descEN: 'Certified assessors conducting skills and competency evaluations.',
    descAR: 'المقيّمون المعتمدون الذين يجرون تقييمات المهارات والكفاءات.',
    icon: '📋',
  },
  mentor: {
    en: 'Mentor',
    ar: 'موجّه',
    descEN: 'Experienced professionals providing mentorship and guidance.',
    descAR: 'المتخصصون ذوو الخبرة الذين يقدمون الإرشاد والتوجيه.',
    icon: '🤝',
  },
  parent: {
    en: 'Guardian / Parent',
    ar: 'ولي الأمر',
    descEN: 'Parents and guardians monitoring student progress and educational pathways.',
    descAR: 'أولياء الأمور الذين يتابعون تقدم الطلاب والمسارات التعليمية.',
    icon: '👨‍👧',
  },
  admin: {
    en: 'System Administrator',
    ar: 'مسؤول النظام',
    descEN: 'Platform administrators managing users, roles, and system configuration.',
    descAR: 'مديرو المنصة المسؤولون عن إدارة المستخدمين والأدوار وإعدادات النظام.',
    icon: '⚙️',
  },
  platform_operator: {
    en: 'Platform Operator',
    ar: 'مشغّل المنصة',
    descEN: 'Operators managing day-to-day platform operations, monitoring, and support.',
    descAR: 'المشغّلون المسؤولون عن العمليات اليومية للمنصة والمراقبة والدعم.',
    icon: '🖥️',
  },
  call_center_agent: {
    en: 'Call Center Agent',
    ar: 'وكيل مركز الاتصال',
    descEN: 'Support agents handling inquiries, complaints, and technical support.',
    descAR: 'وكلاء الدعم الذين يعالجون الاستفسارات والشكاوى والدعم الفني.',
    icon: '📞',
  },
  compliance_auditor: {
    en: 'Compliance Auditor',
    ar: 'مدقق الامتثال',
    descEN: 'Auditors reviewing partner coordination and regulatory compliance.',
    descAR: 'المدققون الذين يراجعون التنسيق مع الشركاء والامتثال التنظيمي.',
    icon: '🛡️',
  },
  talent_operator: {
    en: 'Talent Operator (Nafis)',
    ar: 'مشغّل المواهب (نافس)',
    descEN: 'Operators managing Emiratisation tracking and Nafis talent programs.',
    descAR: 'المشغّلون المسؤولون عن متابعة التوطين وبرامج نافس للمواهب.',
    icon: '🇦🇪',
  },
};

/** Deduplicated list of all roles across all services */
export const allRoles: string[] = Array.from(
  new Set(allServices.flatMap((s) => s.platformRoles || []))
).sort();

/** Map of role → services that role can access */
export const roleServiceMap: Record<string, ServiceItem[]> = {};
for (const role of allRoles) {
  roleServiceMap[role] = allServices.filter((s) =>
    (s.platformRoles || []).includes(role)
  );
}

/** Count of AI models in use */
export const aiModelCount = allServices.filter((s) => s.aiModel && s.aiModel.length > 0).length;
