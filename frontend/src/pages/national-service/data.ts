/* ──────────────────────────────────────────────────────────
   National Service & Sustainability — Data
   Extracted from NationalServicePage.tsx to keep the
   component file focused on rendering logic.
   Now accepts a translation helper for Arabic/English.
   ────────────────────────────────────────────────────────── */

type T = (en: string, ar: string) => string;

export const getServicePrograms = (t: T) => [
    {
        title: t('Alternative National Service — Sustainability Track', 'الخدمة الوطنية البديلة — مسار الاستدامة'),
        org: t('NSRA + Emirati Pathways', 'هيئة الخدمة الوطنية + المسارات الإماراتية'),
        duration: t('12 months', '12 شهراً'),
        icon: '🌱',
        statusKey: 'Enrolling' as const,
        statusLabel: t('Enrolling', 'التسجيل مفتوح'),
        spots: 120,
        desc: t('Serve your nation through sustainability — work placements in renewable energy, environmental conservation, and green infrastructure projects across all Emirates.', 'اخدم وطنك من خلال الاستدامة — توظيف عملي في الطاقة المتجددة والحفاظ على البيئة ومشاريع البنية التحتية الخضراء في جميع الإمارات.'),
        tags: [t('Sustainability', 'الاستدامة'), t('Green Energy', 'الطاقة الخضراء'), t('Conservation', 'الحفاظ على البيئة')],
        highlights: [t('Government entity placements', 'توظيف في الجهات الحكومية'), t('Sustainability certification', 'شهادة الاستدامة'), t('Career pathway into green sector', 'مسار مهني في القطاع الأخضر')],
    },
    {
        title: t('Al Nokhba Programme', 'برنامج النخبة'),
        org: t('NSRA + University of Dubai', 'هيئة الخدمة الوطنية + جامعة دبي'),
        duration: t('24 months', '24 شهراً'),
        icon: '🎓',
        statusKey: 'Open' as const,
        statusLabel: t('Open', 'مفتوح'),
        spots: 80,
        desc: t('Elite academic programme combining national service with advanced STEM education — 5th cohort now enrolling. Graduates earn dual credentials.', 'برنامج أكاديمي نخبوي يجمع بين الخدمة الوطنية والتعليم المتقدم في العلوم والتكنولوجيا — الدفعة الخامسة مفتوحة للتسجيل. يحصل الخريجون على شهادتين.'),
        tags: [t('STEM', 'العلوم والتكنولوجيا'), t('Research', 'البحث العلمي'), t('University', 'الجامعة')],
        highlights: [t('Advanced degree pathway', 'مسار الدرجة المتقدمة'), t('Research opportunities', 'فرص بحثية'), t('Industry partnerships', 'شراكات قطاعية')],
    },
    {
        title: t('Data Science & Engineering Track', 'مسار علم البيانات والهندسة'),
        org: t('NSRA + Dubai Statistics Centre', 'هيئة الخدمة الوطنية + مركز دبي للإحصاء'),
        duration: t('9 months', '9 أشهر'),
        icon: '📊',
        statusKey: 'Open' as const,
        statusLabel: t('Open', 'مفتوح'),
        spots: 60,
        desc: t('Develop national talent in data science and data engineering through hands-on training with real government datasets.', 'تطوير المواهب الوطنية في علم البيانات وهندسة البيانات من خلال التدريب العملي على مجموعات بيانات حكومية حقيقية.'),
        tags: [t('Data Science', 'علم البيانات'), t('Analytics', 'التحليلات'), t('Government Data', 'البيانات الحكومية')],
        highlights: [t('Python & R training', 'تدريب على Python و R'), t('Real-world datasets', 'مجموعات بيانات واقعية'), t('Placement opportunity', 'فرصة توظيف')],
    },
    {
        title: t('Emergency & Crisis Management Service', 'خدمة إدارة الطوارئ والأزمات'),
        org: t('NSRA + Dubai Emergency Management', 'هيئة الخدمة الوطنية + إدارة الطوارئ في دبي'),
        duration: t('12 months', '12 شهراً'),
        icon: '🛡️',
        statusKey: 'Open' as const,
        statusLabel: t('Open', 'مفتوح'),
        spots: 100,
        desc: t('Alternative national service recruits deployed to emergency management centres — building emergency preparedness and climate resilience skills.', 'نشر مجندي الخدمة الوطنية البديلة في مراكز إدارة الطوارئ — بناء مهارات الاستعداد للطوارئ والمرونة المناخية.'),
        tags: [t('Crisis Management', 'إدارة الأزمات'), t('Climate Resilience', 'المرونة المناخية'), t('Civil Defence', 'الدفاع المدني')],
        highlights: [t('Emergency response certification', 'شهادة الاستجابة للطوارئ'), t('Climate resilience training', 'تدريب المرونة المناخية'), t('Government career track', 'مسار مهني حكومي')],
    },
    {
        title: t('Special Education Teaching Programme', 'برنامج تعليم ذوي الاحتياجات الخاصة'),
        org: t('NSRA + Zayed Higher Organization', 'هيئة الخدمة الوطنية + مؤسسة زايد العليا'),
        duration: t('18 months', '18 شهراً'),
        icon: '📚',
        statusKey: 'Enrolling' as const,
        statusLabel: t('Enrolling', 'التسجيل مفتوح'),
        spots: 40,
        desc: t('Recruit UAE Nationals into special educational needs teaching roles — serve the nation while building a meaningful career in inclusive education.', 'توظيف المواطنين الإماراتيين في أدوار تعليم ذوي الاحتياجات الخاصة — اخدم الوطن أثناء بناء مسيرة مهنية هادفة في التعليم الشامل.'),
        tags: [t('Education', 'التعليم'), t('Special Needs', 'ذوي الاحتياجات'), t('Teaching', 'التدريس')],
        highlights: [t('Teaching qualification', 'مؤهل تدريسي'), t('ZHO mentorship', 'إرشاد مؤسسة زايد العليا'), t('Permanent career pathway', 'مسار مهني دائم')],
    },
    {
        title: t('Renewable Energy Field Operations', 'عمليات الطاقة المتجددة الميدانية'),
        org: t('NSRA + DEWA Clean Energy', 'هيئة الخدمة الوطنية + ديوا للطاقة النظيفة'),
        duration: t('12 months', '12 شهراً'),
        icon: '⚡',
        statusKey: 'Open' as const,
        statusLabel: t('Open', 'مفتوح'),
        spots: 50,
        desc: t('Field-based sustainability service at solar and wind farms — gain practical skills in solar, wind, and hydrogen energy systems.', 'خدمة استدامة ميدانية في مزارع الطاقة الشمسية والرياح — اكتسب مهارات عملية في أنظمة الطاقة الشمسية والرياح والهيدروجين.'),
        tags: [t('Solar', 'الطاقة الشمسية'), t('Wind', 'الرياح'), t('Hydrogen', 'الهيدروجين')],
        highlights: [t('Field placement', 'توظيف ميداني'), t('Technical certifications', 'شهادات تقنية'), t('Clean energy career pathway', 'مسار مهني في الطاقة النظيفة')],
    },
];

export const getSustainabilityOpportunities = (t: T) => [
    { title: t('Marine Conservation Officer', 'مسؤول الحفاظ على البيئة البحرية'), location: t('Dubai Coastline', 'ساحل دبي'), org: t('Dubai Municipality Environment Dept', 'بلدية دبي - إدارة البيئة'), type: t('Full-time', 'دوام كامل'), sector: t('Conservation', 'الحفاظ على البيئة'), desc: t('Protect coral reefs and marine ecosystems along the UAE coastline through monitoring, research, and community education.', 'حماية الشعاب المرجانية والأنظمة البيئية البحرية على طول ساحل الإمارات من خلال المراقبة والبحث والتوعية المجتمعية.') },
    { title: t('Solar Farm Operations Technician', 'فني عمليات المزارع الشمسية'), location: t('Mohammed bin Rashid Solar Park', 'مجمع محمد بن راشد للطاقة الشمسية'), org: t('DEWA Clean Energy', 'ديوا للطاقة النظيفة'), type: t('Full-time', 'دوام كامل'), sector: t('Renewable Energy', 'الطاقة المتجددة'), desc: t("Maintain and operate solar PV systems at one of the world's largest solar parks — hands-on clean energy work.", 'صيانة وتشغيل أنظمة الطاقة الشمسية في أحد أكبر مجمعات الطاقة الشمسية في العالم — عمل عملي في الطاقة النظيفة.') },
    { title: t('Sustainability Data Analyst', 'محلل بيانات الاستدامة'), location: t('Dubai / Remote', 'دبي / عن بُعد'), org: t('Dubai Statistics Centre', 'مركز دبي للإحصاء'), type: t('Full-time', 'دوام كامل'), sector: t('Data & Analytics', 'البيانات والتحليلات'), desc: t('Analyse environmental and sustainability data for government reporting — carbon tracking, resource usage, and impact metrics.', 'تحليل بيانات البيئة والاستدامة للتقارير الحكومية — تتبع الكربون واستخدام الموارد ومقاييس التأثير.') },
    { title: t('Green Building Inspector', 'مفتش المباني الخضراء'), location: t('Dubai', 'دبي'), org: t('Dubai Municipality', 'بلدية دبي'), type: t('Full-time', 'دوام كامل'), sector: t('Built Environment', 'البيئة المبنية'), desc: t("Inspect and certify buildings for Al Sa'fat sustainability standards — ensuring UAE's built environment meets green targets.", 'فحص واعتماد المباني وفقاً لمعايير السعفات للاستدامة — ضمان توافق البيئة المبنية مع الأهداف الخضراء.') },
    { title: t('Climate Resilience Planner', 'مخطط المرونة المناخية'), location: t('All Emirates', 'جميع الإمارات'), org: t('Ministry of Climate Change', 'وزارة التغير المناخي'), type: t('Full-time', 'دوام كامل'), sector: t('Climate Policy', 'سياسة المناخ'), desc: t("Work on UAE's National Climate Change Plan — flood risk, heat resilience, and adaptation strategies for critical infrastructure.", 'العمل على الخطة الوطنية للتغير المناخي — مخاطر الفيضانات والمرونة الحرارية واستراتيجيات التكيف للبنية التحتية الحيوية.') },
    { title: t('Mangrove Restoration Coordinator', 'منسق استعادة أشجار القرم'), location: t('Dubai / Umm Al Quwain', 'دبي / أم القيوين'), org: t('Mangrove Initiative', 'مبادرة أشجار القرم'), type: t('Contract', 'عقد'), sector: t('Ecosystem Restoration', 'استعادة النظام البيئي'), desc: t("Lead planting and monitoring of 100 million mangrove trees — the UAE's flagship nature-based climate solution.", 'قيادة زراعة ومراقبة 100 مليون شجرة قرم — الحل المناخي الطبيعي الرائد في الإمارات.') },
];

export const getNsraPartners = (t: T) => [
    { name: t('University of Dubai', 'جامعة دبي'), role: t('Al Nokhba Programme — STEM education track', 'برنامج النخبة — مسار تعليم العلوم والتكنولوجيا'), logo: '🏛️' },
    { name: t('Dubai Statistics Centre', 'مركز دبي للإحصاء'), role: t('Data science & data engineering training', 'تدريب علم البيانات وهندسة البيانات'), logo: '📈' },
    { name: t('DEWA Clean Energy', 'ديوا للطاقة النظيفة'), role: t('Renewable energy field placements', 'توظيف ميداني في الطاقة المتجددة'), logo: '⚡' },
    { name: t('Zayed Higher Organization', 'مؤسسة زايد العليا'), role: t('Special education teaching recruitment', 'توظيف تعليم ذوي الاحتياجات الخاصة'), logo: '📖' },
    { name: t('Dubai Emergency Management', 'إدارة الطوارئ في دبي'), role: t('Emergency management service placements', 'توظيف في خدمة إدارة الطوارئ'), logo: '🛡️' },
    { name: t('Dubai Municipality Environment Dept', 'بلدية دبي - إدارة البيئة'), role: t('Marine conservation & environmental protection', 'الحفاظ على البيئة البحرية وحماية البيئة'), logo: '🐬' },
];

export const getRecentMilestones = (t: T) => [
    { event: t('Graduation of 18th Cohort of UAE National Service Programme', 'تخريج الدفعة الـ 18 من برنامج الخدمة الوطنية الإماراتي'), detail: t('Attended by H.H. Sheikh Mohammed bin Rashid', 'بحضور صاحب السمو الشيخ محمد بن راشد'), date: '2025' },
    { event: t('5th Cohort of Al Nokhba Programme Graduation', 'تخريج الدفعة الخامسة من برنامج النخبة'), detail: t('Advanced STEM graduates entering government and private sector', 'خريجون متقدمون في العلوم والتكنولوجيا ينضمون للقطاعين الحكومي والخاص'), date: '2025' },
    { event: t('Dubai Statistics Centre–NSRA MOU for Data Science Training', 'مذكرة تفاهم بين مركز دبي للإحصاء وهيئة الخدمة الوطنية لتدريب علم البيانات'), detail: t('Statistical training programme for Alternative National Service recruits', 'برنامج تدريب إحصائي لمجندي الخدمة الوطنية البديلة'), date: '2024' },
    { event: t('4th Batch of Alternative National Service deployed to Government Entities', 'نشر الدفعة الرابعة من الخدمة الوطنية البديلة في الجهات الحكومية'), detail: t('Emergency management centre placements', 'توظيف في مراكز إدارة الطوارئ'), date: '2024' },
    { event: t('ZHO–NSRA Special Education Teaching Programme Launched', 'إطلاق برنامج تعليم ذوي الاحتياجات الخاصة بين مؤسسة زايد العليا وهيئة الخدمة الوطنية'), detail: t('Recruiting Nationals into special educational needs teaching roles', 'توظيف المواطنين في أدوار تعليم ذوي الاحتياجات الخاصة'), date: '2024' },
];

export const getSustainabilityImpact = (t: T) => [
    { value: '50,000+', label: t('Trees Planted', 'شجرة مزروعة'), icon: '🌳' },
    { value: t('2,500 tons', '2,500 طن'), label: t('Waste Collected', 'نفايات مُجمّعة'), icon: '♻️' },
    { value: t('15 MW', '15 ميغاواط'), label: t('Solar Capacity Added', 'سعة شمسية مضافة'), icon: '☀️' },
    { value: t('500 km', '500 كم'), label: t('Coastline Protected', 'ساحل محمي'), icon: '🐬' },
];

export const getEnrolmentSteps = (t: T) => [
    { step: 1, title: t('Register via NSRA', 'التسجيل عبر هيئة الخدمة الوطنية'), desc: t('Complete your national service registration through official NSRA channels', 'أكمل تسجيلك في الخدمة الوطنية عبر القنوات الرسمية لهيئة الخدمة الوطنية') },
    { step: 2, title: t('Choose Your Track', 'اختر مسارك'), desc: t('Select from military, sustainability, academic, or community service tracks', 'اختر من المسارات العسكرية أو الاستدامة أو الأكاديمية أو خدمة المجتمع') },
    { step: 3, title: t('Complete Training', 'أكمل التدريب'), desc: t('Attend orientation and track-specific training programme', 'احضر التوجيه وبرنامج التدريب الخاص بالمسار') },
    { step: 4, title: t('Begin Service', 'ابدأ الخدمة'), desc: t('Start your placement and build skills for your future career', 'ابدأ توظيفك وابنِ المهارات لمستقبلك المهني') },
];
