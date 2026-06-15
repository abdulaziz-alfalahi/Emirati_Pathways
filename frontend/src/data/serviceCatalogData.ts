// EHRDC Service Catalog — data layer
// Provides types, data access, role mapping, and stats for the Service Catalog page.

export interface ServiceItem {
  code: string;
  name: string;
  nameEN: string;
  group: string;
  groupCode: string;
  description: string;
  descriptionEN: string;
  goal: string;
  goalEN: string;
  target: string;
  targetEN: string;
  conditions: string;
  conditionsEN: string;
  documents: string;
  documentsEN: string;
  steps: string[];
  stepsEN: string[];
  channels: string;
  channelsEN: string;
  duration: string;
  durationEN: string;
  fees: string;
  feesEN: string;
  outputs: string;
  outputsEN: string;
  limitations: string;
  limitationsEN: string;
  partners: string;
  partnersEN: string;
  kpis: string;
  kpisEN: string;
  platformStatus: 'active' | 'partial' | 'gap' | 'correction';
  platformModule: string;
  platformPath: string;
  gapNotes: string;
  gapNotesEN: string;
  isNew: boolean;
  isCorrection: boolean;
  // New fields from Manus guide
  platformRoles: string[];
  aiModel: string;
  aiModelEN: string;
  relatedForms: string;
}

export interface ServiceGroup {
  code: string;
  name: string;
  nameEN: string;
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
  board_member: {
    en: 'Board Member',
    ar: 'عضو مجلس الإدارة',
    descEN: 'Executive board members accessing strategic dashboards, analytics, and governance reports.',
    descAR: 'أعضاء مجلس الإدارة الذين يطلعون على لوحات القيادة الاستراتيجية والتقارير والتحليلات.',
    icon: '👔',
  },
  growth_operator: {
    en: 'Growth Operator',
    ar: 'مشغّل النمو',
    descEN: 'Operators managing growth domains including employer relations, education, assessments, mentorship, and community operations.',
    descAR: 'المشغّلون المسؤولون عن مجالات النمو بما في ذلك علاقات أصحاب العمل والتعليم والتقييم والإرشاد والمجتمعات.',
    icon: '📈',
  },
  internship_coordinator: {
    en: 'Internship Coordinator',
    ar: 'منسق التدريب العملي',
    descEN: 'Coordinators managing internship programs, placements, and student-employer matching.',
    descAR: 'المنسقون المسؤولون عن برامج التدريب العملي والتوظيف ومطابقة الطلاب بأصحاب العمل.',
    icon: '🎒',
  },
  super_admin: {
    en: 'Super Administrator',
    ar: 'مسؤول النظام الأعلى',
    descEN: 'Top-level administrator with full system access including role management and security configuration.',
    descAR: 'المسؤول الأعلى بصلاحيات كاملة بما في ذلك إدارة الأدوار وإعدادات الأمان.',
    icon: '🔑',
  },
  career_services_operator: {
    en: 'Career Services Operator',
    ar: 'مشغّل الخدمات المهنية',
    descEN: 'Operators managing career services CRM, job verification, and candidate pipeline.',
    descAR: 'المشغّلون المسؤولون عن إدارة علاقات العملاء المهنية والتحقق من الوظائف ومسار المرشحين.',
    icon: '🗂️',
  },
  employee: {
    en: 'Employee',
    ar: 'موظف',
    descEN: 'Active employees accessing workspace, training, and company resources.',
    descAR: 'الموظفون النشطون الذين يصلون إلى مساحة العمل والتدريب وموارد الشركة.',
    icon: '👷',
  },
  employer_relations: {
    en: 'Employer Relations Officer',
    ar: 'مسؤول علاقات أصحاب العمل',
    descEN: 'Officers managing employer partnerships, workspace access, and growth operator coordination.',
    descAR: 'المسؤولون عن إدارة شراكات أصحاب العمل والوصول لمساحات العمل والتنسيق مع مشغلي النمو.',
    icon: '🤝',
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
