
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
  Compass, Target, TrendingUp, Users, Briefcase, Award,
  BarChart3, MapPin, DollarSign, Clock, ChevronRight, ChevronLeft,
  BookOpen, Lightbulb, CheckCircle, Star, Building2,
  Search, Sparkles, Cpu, Banknote, Heart, Plane, ShoppingBag, X
} from 'lucide-react';
import { restClient } from '@/utils/api';
import { skillGraphAPI, type UserSkill } from '@/services/intelligenceAPI';
import AiAssistPanel from '@/components/ai/AiAssistPanel';

// Brand tokens
const brand = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primarySurface: '#F0FDFA',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  amber: '#FEF3C7',
  amberText: '#92400E',
  green: '#DCFCE7',
  greenText: '#166534',
  red: '#FEE2E2',
  redText: '#991B1B',
  blue: '#DBEAFE',
  blueText: '#1E40AF',
  purple: '#F3E8FF',
  purpleText: '#6B21A8',
};

const iconMap: Record<string, React.FC<any>> = { Cpu, Banknote, Lightbulb, Heart, Plane, ShoppingBag, Building2 };

// Format number for display (e.g. 1500 → "1,500")
const fmtNum = (n: number) => n.toLocaleString();

// Format AED salary (e.g. 15000 → "AED 15K")
const fmtSalary = (n: number) => {
  if (n === 0) return '—';
  if (n >= 1000) return `AED ${Math.round(n / 1000)}K`;
  return `AED ${fmtNum(n)}`;
};

const getCompanyProgression = (
  companyName: string,
  sectorId: string,
  t: (en: string, ar: string) => string
): {
  overview: string;
  careerPath: Array<{ title: string; duration: string; focus: string }>;
  promotionCriteria: string[];
  emiratisationSupport: string[];
} => {
  const normalizedName = companyName.split('(')[0].trim().toLowerCase();

  const data: Record<string, {
    overview: string;
    careerPath: Array<{ title: string; duration: string; focus: string }>;
    promotionCriteria: string[];
    emiratisationSupport: string[];
  }> = {
    'microsoft': {
      overview: t(
        'A global leader in technology, cloud computing, and AI, driving innovation and digital transformation in the UAE.',
        'شركة عالمية رائدة في مجال التكنولوجيا والحوسبة السحابية والذكاء الاصطناعي، تقود الابتكار والتحول الرقمي في الإمارات.'
      ),
      careerPath: [
        { title: t('Software Engineer I', 'مهندس برمجيات أول'), duration: t('1-2 Years', '1-2 سنة'), focus: t('Learning codebase, minor features, bug fixes, testing.', 'تعلم التعليمات البرمجية، الميزات البسيطة، إصلاح الأخطاء، والاختبار.') },
        { title: t('Software Engineer II', 'مهندس برمجيات ثاني'), duration: t('2-4 Years', '2-4 سنوات'), focus: t('Owning features, design contributions, system reliability.', 'امتلاك الميزات، المساهمة في التصميم، وموثوقية النظام.') },
        { title: t('Senior Software Engineer', 'كبير مهندسي برمجيات'), duration: t('4-7 Years', '4-7 سنوات'), focus: t('Architecture design, mentoring juniors, leading small projects.', 'تصميم البنية البرمجية، إرشاد المبتدئين، وقيادة المشاريع الصغيرة.') },
        { title: t('Principal Software Engineer', 'مهندس برمجيات رئيسي'), duration: t('7+ Years', '7+ سنوات'), focus: t('Technical strategy, cross-team alignment, architectural roadmap.', 'الاستراتيجية التقنية، التنسيق بين الفرق، ومخطط البنية البرمجية.') }
      ],
      promotionCriteria: [
        t('Demonstrate ownership of critical features and robust code delivery.', 'إثبات القدرة على امتلاك الميزات الهامة وتقديم برمجيات قوية.'),
        t('Active participation in design reviews and architectural decisions.', 'المشاركة الفعالة في مراجعات التصميم والقرارات المعمارية.'),
        t('Mentoring junior engineers and improving overall team code quality.', 'إرشاد المهندسين المبتدئين وتحسين جودة البرمجة الإجمالية للفريق.'),
        t('Relevant professional certifications (e.g. Azure Solutions Architect).', 'الشهادات المهنية ذات الصلة (مثل Azure Solutions Architect).')
      ],
      emiratisationSupport: [
        t('Nafis program compatibility and salary support alignment.', 'التوافق مع برنامج نافس ومواءمة دعم الرواتب.'),
        t('Microsoft UAE Graduate Program (Tomoh) for Emirati nationals.', 'برنامج مايكروسوفت للخريجين في الإمارات (طموح) للمواطنين الإماراتيين.'),
        t('Direct mentorship from global Microsoft tech leads.', 'إرشاد مباشر من قادة تكنولوجيا مايكروسوفت العالميين.')
      ]
    },
    'google': {
      overview: t(
        'A global technology giant focusing on search, cloud, AI, and hardware, empowering UAE developers and businesses.',
        'شركة تكنولوجيا عالمية تركز على البحث، السحابية، الذكاء الاصطناعي، والأجهزة، وتمكين المطورين والشركات في الإمارات.'
      ),
      careerPath: [
        { title: t('Software Engineer (L3)', 'مهندس برمجيات (L3)'), duration: t('1-2 Years', '1-2 سنة'), focus: t('Developing clean code, writing unit tests, and designing simple features.', 'تطوير كود نظيف، كتابة اختبارات الوحدة، وتصميم ميزات بسيطة.') },
        { title: t('Software Engineer (L4)', 'مهندس برمجيات (L4)'), duration: t('2-4 Years', '2-4 سنوات'), focus: t('Leading moderate projects, system design, code reviews.', 'قيادة مشاريع متوسطة، تصميم النظام، ومراجعة الأكواد.') },
        { title: t('Senior Software Engineer (L5)', 'كبير مهندسي برمجيات (L5)'), duration: t('4-7 Years', '4-7 سنوات'), focus: t('Technical leadership, defining project scopes, mentoring L3/L4 engineers.', 'القيادة التقنية، تحديد نطاقات المشاريع، وإرشاد مهندسي L3/L4.') },
        { title: t('Staff Engineer (L6)', 'مهندس طاقم عمل (L6)'), duration: t('7+ Years', '7+ سنوات'), focus: t('Influencing organization-wide technology roadmaps and architectural designs.', 'التأثير على خرائط تكنولوجيا المؤسسة بأكملها والتصميمات المعمارية.') }
      ],
      promotionCriteria: [
        t('Consistently deliver code with high impact, quality, and low bug rate.', 'تقديم كود ذو تأثير وجودة عالية وبمعدل أخطاء منخفض باستمرار.'),
        t('Strong technical leadership and ability to navigate ambiguous scopes.', 'قيادة تقنية قوية والقدرة على التعامل مع المهام الغامضة.'),
        t('Positive contributions to Google’s engineering culture and peer mentoring.', 'المساهمة الإيجابية في الثقافة الهندسية لجوجل وإرشاد الأقران.'),
        t('Proven track record of designing scalable and maintainable distributed systems.', 'سجل حافل في تصميم أنظمة موزعة قابلة للتطوير والصيانة.')
      ],
      emiratisationSupport: [
        t('Active participation in local digital economy talent initiatives.', 'المشاركة الفعالة في مبادرات مواهب الاقتصاد الرقمي المحلي.'),
        t('Google UAE Internship Program for qualified Emirati undergraduates.', 'برنامج جوجل للتدريب الداخلي في الإمارات لطلاب الجامعات الإماراتيين المؤهلين.'),
        t('Access to Google Developer Groups and premium training resources.', 'الوصول إلى مجموعات مطوري جوجل وموارد التدريب المتميزة.')
      ]
    },
    'amazon': {
      overview: t(
        'A pioneer in e-commerce, cloud computing (AWS), and digital streaming, accelerating digital business in the UAE.',
        'رائدة في التجارة الإلكترونية، الحوسبة السحابية (AWS)، والبث الرقمي، مما يسرع الأعمال الرقمية في الإمارات.'
      ),
      careerPath: [
        { title: t('Software Development Engineer I (L4)', 'مهندس تطوير برمجيات أول (L4)'), duration: t('1-2 Years', '1-2 سنة'), focus: t('Developing service features, resolving tickets, and operational excellence.', 'تطوير ميزات الخدمة، حل التذاكر البرمجية، والتميز التشغيلي.') },
        { title: t('Software Development Engineer II (L5)', 'مهندس تطوير برمجيات ثاني (L5)'), duration: t('2-4 Years', '2-4 سنوات'), focus: t('Designing components, system scaling, operational leadership.', 'تصميم المكونات، توسيع نطاق النظام، والقيادة التشغيلية.') },
        { title: t('Senior SDE (L6)', 'كبير مهندسي تطوير برمجيات (L6)'), duration: t('4-7 Years', '4-7 سنوات'), focus: t('Leading engineering teams, system architecture, long-term technical plans.', 'قيادة الفرق الهندسية، هندسة النظام، والخطط التقنية طويلة الأجل.') },
        { title: t('Principal SDE (L7)', 'مهندس تطوير رئيسي (L7)'), duration: t('7+ Years', '7+ سنوات'), focus: t('Setting technical vision across multiple organisations and business units.', 'وضع الرؤية التقنية عبر العديد من المؤسسات ووحدات العمل.') }
      ],
      promotionCriteria: [
        t('Exceeding expectations in Amazon Leadership Principles.', 'تجاوز التوقعات في مبادئ القيادة لشركة أمازون.'),
        t('Delivering high-availability systems with excellent operational metrics.', 'تقديم أنظمة عالية التوفر بمقاييس تشغيلية ممتازة.'),
        t('Leading architecture alignment across team boundaries.', 'قيادة توافق البنية البرمجية عبر حدود الفريق.'),
        t('AWS professional certifications (e.g. DevOps Engineer / Solutions Architect).', 'الشهادات المهنية لـ AWS (مثل مهندس DevOps / مهندس حلول).')
      ],
      emiratisationSupport: [
        t('Dedicated AWS Cloud training pathways for Emirati students.', 'مسارات تدريب سحابية مخصصة من AWS للطلاب الإماراتيين.'),
        t('Alignment with Nafis program for salary and pension support.', 'التوافق مع برنامج نافس لدعم الرواتب والمعاشات التقاعدية.'),
        t('Emirati graduate accelerator programs in cloud engineering.', 'مسرّعات خريجي الإمارات في هندسة السحابة.')
      ]
    },
    'jpmorgan': {
      overview: t(
        'A leading global financial services firm providing investment banking and wealth management in the UAE.',
        'مؤسسة خدمات مالية عالمية رائدة تقدم الخدمات المصرفية الاستثمارية وإدارة الثروات في الإمارات.'
      ),
      careerPath: [
        { title: t('Analyst', 'محلل مالى'), duration: t('1-3 Years', '1-3 سنوات'), focus: t('Financial modeling, industry research, slide decks, database management.', 'النمذجة المالية، بحوث الصناعة، العروض التقديمية، وإدارة قواعد البيانات.') },
        { title: t('Associate', 'شريك مالى'), duration: t('3-5 Years', '3-5 سنوات'), focus: t('Managing deal workflows, client communication, supervising analysts.', 'إدارة سير عمل الصفقات، التواصل مع العملاء، والإشراف على المحللين.') },
        { title: t('Vice President (VP)', 'نائب الرئيس'), duration: t('5-8 Years', '5-8 سنوات'), focus: t('Client relationships, execution of deals, team leadership, risk management.', 'علاقات العملاء، تنفيذ الصفقات، قيادة الفريق، وإدارة المخاطر.') },
        { title: t('Executive Director', 'مدير تنفيذي'), duration: t('8+ Years', '8+ سنوات'), focus: t('Origination of deals, strategic sector leadership, high-level client advisory.', 'ابتكار الصفقات، القيادة الاستراتيجية للقطاع، وتقديم الاستشارات للعملاء.') }
      ],
      promotionCriteria: [
        t('Consistently high performance on transaction execution and client satisfaction.', 'أداء عالي باستمرار في تنفيذ المعاملات ورضا العملاء.'),
        t('Deep understanding of financial compliance and regulatory frameworks.', 'فهم عميق للامتثال المالي والأطر التنظيمية.'),
        t('Mentorship of junior bankers and commitment to inclusion.', 'إرشاد المصرفيين المبتدئين والالتزام بالدمج وتكافؤ الفرص.'),
        t('CFA (Chartered Financial Analyst) charterholder preferred for senior tracks.', 'يفضل الحصول على شهادة المحلل المالي المعتمد (CFA) للمسارات العليا.')
      ],
      emiratisationSupport: [
        t('JPMorgan UAE National Training Program for finance graduates.', 'برنامج جي بي مورغان لتدريب المواطنين الإماراتيين لخريجي العلوم المالية.'),
        t('Active placement in investment banking and global market divisions.', 'توظيف نشط في الخدمات المصرفية الاستثمارية وأقسام الأسواق العالمية.'),
        t('Integration with Nafis financial training initiatives.', 'التكامل مع مبادرات التدريب المالي لبرنامج نافس.')
      ]
    },
    'hsbc': {
      overview: t(
        'One of the largest international banks in the Middle East, facilitating trade and wealth development in the UAE.',
        'أحد أكبر البنوك الدولية في الشرق الأوسط، يسهل التجارة وتطوير الثروات في دولة الإمارات.'
      ),
      careerPath: [
        { title: t('Graduate Trainee', 'خريج متدرب'), duration: t('1-2 Years', '1-2 سنة'), focus: t('Rotations across retail, commercial, and wealth divisions, learning systems.', 'التناوب بين أقسام التجزئة والخدمات التجارية والثروات، وتعلم الأنظمة.') },
        { title: t('Relationship Manager', 'مدير علاقات العملاء'), duration: t('2-5 Years', '2-5 سنوات'), focus: t('Managing corporate or retail portfolios, product advisory, client satisfaction.', 'إدارة محافظ الشركات أو الأفراد، تقديم المشورة بشأن المنتجات، ورضا العملاء.') },
        { title: t('Senior Relationship Manager / Team Leader', 'كبير مديري العلاقات / قائد فريق'), duration: t('5-8 Years', '5-8 سنوات'), focus: t('Supervising relationship teams, complex transactions, strategic growth.', 'الإشراف على فرق العلاقات، المعاملات المعقدة، والنمو الاستراتيجي.') },
        { title: t('Director / Country Head', 'مدير / رئيس الدولة'), duration: t('8+ Years', '8+ سنوات'), focus: t('Business unit management, regulatory relations, high-value client advisory.', 'إدارة وحدة الأعمال، العلاقات التنظيمية، واستشارات العملاء ذوي الملاءة المالية العالية.') }
      ],
      promotionCriteria: [
        t('Achieving portfolio growth while maintaining strict compliance.', 'تحقيق نمو المحفظة المالية مع الحفاظ على الامتثال الصارم.'),
        t('Exhibiting leadership behaviors aligned with HSBC values.', 'إظهار سلوكيات القيادة المتوافقة مع قيم HSBC.'),
        t('Successful completion of credit certification and relevant banking credentials.', 'إكمال شهادة الائتمان والمؤهلات المصرفية ذات الصلة بنجاح.'),
        t('Active contribution to group digitalization initiatives.', 'المساهمة الفعالة في مبادرات التحول الرقمي للمجموعة.')
      ],
      emiratisationSupport: [
        t('HSBC Emirati Academy for comprehensive career training.', 'أكاديمية HSBC الإماراتية للتدريب المهني الشامل.'),
        t('Nafis program sponsorship and pension scheme matching.', 'رعاية برنامج نافس ومطابقة خطة المعاشات التقاعدية.'),
        t('Leadership development fast-track for top-performing Emirati nationals.', 'مسار سريع لتطوير القيادة للمواطنين الإماراتيين ذوي الأداء المتميز.')
      ]
    },
    'shell': {
      overview: t(
        'A global group of energy and petrochemical companies, supporting sustainable energy development in the UAE.',
        'مجموعة عالمية من شركات الطاقة والبتروكيماويات، تدعم تطوير الطاقة المستدامة في دولة الإمارات.'
      ),
      careerPath: [
        { title: t('Graduate Engineer', 'مهندس خريج'), duration: t('1-3 Years', '1-3 سنوات'), focus: t('Technical training, site rotations, safety audits, learning engineering standards.', 'التدريب الفني، التناوب بين المواقع، تدقيق السلامة، وتعلم المعايير الهندسية.') },
        { title: t('Project Engineer', 'مهندس مشروع'), duration: t('3-6 Years', '3-6 سنوات'), focus: t('Executing engineering packages, budget estimation, vendor coordination.', 'تنفيذ الحزم الهندسية، تقدير الميزانية، وتنسيق البائعين.') },
        { title: t('Senior Engineer / Project Manager', 'كبير مهندسين / مدير مشروع'), duration: t('6-9 Years', '6-9 سنوات'), focus: t('Managing multi-disciplinary engineering projects, risk mitigation.', 'إدارة المشاريع الهندسية متعددة التخصصات، والحد من المخاطر.') },
        { title: t('Engineering Director', 'مدير هندسي'), duration: t('9+ Years', '9+ سنوات'), focus: t('Leading asset teams, global technology implementation, safety leadership.', 'قيادة فرق الأصول، تطبيق التكنولوجيا العالمية، وقيادة السلامة.') }
      ],
      promotionCriteria: [
        t('Demonstrated engineering competence according to Shell Professional Standards.', 'إثبات الكفاءة الهندسية وفقاً للمعايير المهنية لشل.'),
        t('Zero-accident record and active contribution to safety culture.', 'سجل خالٍ من الحوادث والمساهمة الفعالة في ثقافة السلامة.'),
        t('Proven capability in managing capital budgets and delivery timelines.', 'قدرة مثبتة على إدارة الميزانيات الرأسمالية والجداول الزمنية للتسليم.'),
        t('Professional Engineering credentials (e.g. Chartered Engineer status).', 'المؤهلات الهندسية المهنية (مثل وضع مهندس معتمد).')
      ],
      emiratisationSupport: [
        t('Shell UAE graduate trainee schemes with direct global mentors.', 'مخططات تدريب الخريجين من شل الإمارات مع موجهين عالميين مباشرين.'),
        t('Collaboration with local universities for research and talent.', 'التعاون مع الجامعات المحلية للبحث وجذب المواهب.'),
        t('Alignment with Nafis engineering and technical salary programs.', 'التوافق مع برامج نافس لرواتب التخصصات الهندسية والفنية.')
      ]
    },
    'pfizer': {
      overview: t(
        'A leading biopharmaceutical corporation discovering, developing, and manufacturing medicines and vaccines in the UAE.',
        'شركة رائدة في مجال الأدوية الحيوية، تقوم باكتشاف وتطوير وتصنيع الأدوية واللقاحات في دولة الإمارات.'
      ),
      careerPath: [
        { title: t('Medical Representative', 'مندوب طبي'), duration: t('1-2 Years', '1-2 سنة'), focus: t('Product presentations to healthcare professionals, market feedback.', 'تقديم عروض المنتجات لأخصائيي الرعاية الصحية، وملاحظات السوق.') },
        { title: t('Key Account Manager', 'مدير حسابات رئيسي'), duration: t('2-4 Years', '2-4 سنوات'), focus: t('Managing institutional clients, contract negotiation, sales strategies.', 'إدارة العملاء المؤسسيين، تفاوض العقود، واستراتيجيات المبيعات.') },
        { title: t('Product Manager / Medical Advisor', 'مدير المنتج / مستشار طبي'), duration: t('4-7 Years', '4-7 سنوات'), focus: t('Product lifecycle strategy, clinical trials coordination, marketing.', 'استراتيجية دورة حياة المنتج، تنسيق التجارب السريرية، والتسويق.') },
        { title: t('Business Unit Director', 'مدير وحدة الأعمال'), duration: t('7+ Years', '7+ سنوات'), focus: t('Leading therapeutic areas, budget allocation, strategic market expansion.', 'قيادة المجالات العلاجية، تخصيص الميزانية، والتوسع الاستراتيجي في السوق.') }
      ],
      promotionCriteria: [
        t('Consistently achieving or exceeding pharmaceutical sales and compliance goals.', 'تحقيق أو تجاوز أهداف مبيعات الأدوية والامتثال باستمرار.'),
        t('Deep scientific knowledge of Pfizer products and therapeutic sectors.', 'معرفة علمية عميقة بمنتجات فايزر والقطاعات العلاجية.'),
        t('Compliance with strict international healthcare marketing regulations.', 'الامتثال للوائح الدولية الصارمة لتسويق الرعاية الصحية.'),
        t('Postgraduate credentials (e.g. PharmD, MBA, or PhD in Life Sciences) highly valued.', 'تقدير كبير للمؤهلات العليا (مثل دكتوراه صيدلة، ماجستير إدارة أعمال، أو دكتوراه في علوم الحياة).')
      ],
      emiratisationSupport: [
        t('Pfizer UAE Medical Academy training programs for local graduates.', 'برنامج تدريب أكاديمية فايزر الطبية في الإمارات للخريجين المحليين.'),
        t('Support for Emiratis pursuing research careers in life sciences.', 'دعم الإماراتيين الذين يسعون وراء مهن بحثية في علوم الحياة.'),
        t('Salary top-up and training integration via the Nafis framework.', 'تكامل دعم الرواتب والتدريب من خلال إطار نافس.')
      ]
    },
    'airbus': {
      overview: t(
        'A global pioneer in the aerospace industry, designing, manufacturing and delivering aerospace products in the UAE.',
        'شركة عالمية رائدة في صناعة الطيران والفضاء، تقوم بتصميم وتصنيع وتقديم منتجات الفضاء في الإمارات.'
      ),
      careerPath: [
        { title: t('Associate Systems Engineer', 'مهندس أنظمة مساعد'), duration: t('1-3 Years', '1-3 سنوات'), focus: t('Assisting in components check, diagnostic tools execution, documentation.', 'المساعدة في فحص المكونات، تشغيل أدوات التشخيص، وتوثيق الأنظمة.') },
        { title: t('Systems / Flight Test Engineer', 'مهندس أنظمة / مهندس اختبار الطيران'), duration: t('3-6 Years', '3-6 سنوات'), focus: t('Designing sub-assemblies, avionics diagnostics, simulation testing.', 'تصميم الأنظمة الفرعية، تشخيص إلكترونيات الطيران، واختبار المحاكاة.') },
        { title: t('Senior Aerospace Engineer', 'كبير مهندسي الطيران والفضاء'), duration: t('6-9 Years', '6-9 سنوات'), focus: t('Leading modification packages, airframe integrity review, team mentorship.', 'قيادة حزم التعديل، مراجعة سلامة هيكل الطائرة، وإرشاد الفريق.') },
        { title: t('Aeronautics Program Manager', 'مدير برنامج الطيران'), duration: t('9+ Years', '9+ سنوات'), focus: t('Managing airline integration contracts, aerospace engineering strategy.', 'إدارة عقود تكامل شركات الطيران، واستراتيجية هندسة الفضاء.') }
      ],
      promotionCriteria: [
        t('Demonstrated engineering precision in aviation and defense contexts.', 'إثبات الدقة الهندسية في سياقات الطيران والدفاع.'),
        t('Adherence to strict international civil and military aviation regulations.', 'الالتزام بأنظمة الطيران المدني والعسكري الدولية الصارمة.'),
        t('Successful execution of modification programs and cost management.', 'التنفيذ الناجح لبرامج التعديل وإدارة التكاليف.'),
        t('Professional licensure and engineering certifications (e.g. EASA standards).', 'الترخيص المهني والشهادات الهندسية (مثل معايير الوكالة الأوروبية لسلامة الطيران EASA).')
      ],
      emiratisationSupport: [
        t('Airbus UAE Engineering Fellowship for top aerospace students.', 'زمالة إيرباص الإمارات الهندسية لطلاب هندسة الفضاء المتميزين.'),
        t('Rotational internships in Toulouse and Hamburg for Emirati graduates.', 'تدريب داخلي بالتناوب في تولوز وهامبورغ للخريجين الإماراتيين.'),
        t('Alignment with Nafis technical skills development programs.', 'التوافق مع برامج تطوير المهارات الفنية لبرنامج نافس.')
      ]
    },
    'marriott': {
      overview: t(
        'A leading global lodging company managing a diverse portfolio of hotels and resorts in the UAE.',
        'شركة إقامة عالمية رائدة تدير محفظة متنوعة من الفنادق والمنتجعات في دولة الإمارات.'
      ),
      careerPath: [
        { title: t('Management Trainee', 'متدرب إداري'), duration: t('1-2 Years', '1-2 سنة'), focus: t('Rotations across front desk, F&B, housekeeping, guest relations.', 'التناوب بين الاستقبال، الأغذية والمشروبات، التدبير المنزلي، وعلاقات الضيوف.') },
        { title: t('Assistant Department Manager', 'مساعد مدير القسم'), duration: t('2-4 Years', '2-4 سنوات'), focus: t('Supervising floor teams, handling guest escalation, schedule planning.', 'الإشراف على فرق العمل، معالجة مشكلات الضيوف، وتخطيط الجداول الزمنية.') },
        { title: t('Hotel Department Manager', 'مدير قسم الفندق'), duration: t('4-7 Years', '4-7 سنوات'), focus: t('Owning department P&L, customer satisfaction scores, quality control.', 'إدارة الأرباح والخسائر للقسم، درجات رضا العملاء، ومراقبة الجودة.') },
        { title: t('Hotel General Manager / Regional Director', 'مدير عام الفندق / مدير إقليمي'), duration: t('7+ Years', '7+ سنوات'), focus: t('Full property management, strategic brand alignment, financial success.', 'إدارة العقار بالكامل، التوافق الاستراتيجي مع العلامة التجارية، والنجاح المالي.') }
      ],
      promotionCriteria: [
        t('Consistently high customer service experience (GSS) scores.', 'درجات رضا عملاء عالية باستمرار (GSS).'),
        t('Demonstrated ability to drive revenue and control labor/operating budgets.', 'القدرة على زيادة الإيرادات والتحكم في الميزانيات التشغيلية والعمالة.'),
        t('Active participation in Marriott Leadership Training pathways.', 'المشاركة الفعالة في مسارات تدريب القيادة من ماريوت.'),
        t('Bilingual fluency (English & Arabic) highly preferred for UAE leadership.', 'تفضيل ثنائية اللغة (الإنجليزية والعربية) لقيادة العمليات في الإمارات.')
      ],
      emiratisationSupport: [
        t('Marriott UAE National Hospitality Program (Tahseen).', 'برنامج ماريوت للضيافة الوطنية في الإمارات (تحسين).'),
        t('Fast-track to operational leadership for Emirati candidates.', 'مسار سريع للقيادة التشغيلية للمرشحين الإماراتيين.'),
        t('Nafis program alignment providing salary support in hospitality.', 'التوافق مع برنامج نافس لتقديم دعم الرواتب في قطاع الضيافة.')
      ]
    }
  };

  if (data[normalizedName]) {
    return data[normalizedName];
  }

  switch (sectorId) {
    case 'technology':
      return {
        overview: t(
          `A prominent technology firm specializing in digital services, software development, and localized innovation.`,
          `شركة تكنولوجيا بارزة متخصصة في الخدمات الرقمية، تطوير البرمجيات، والابتكار المحلي.`
        ),
        careerPath: [
          { title: t('Junior Developer', 'مطور مبتدئ'), duration: t('1-2 Years', '1-2 سنة'), focus: t('Implementing feature requests, writing unit tests, and fixing bugs.', 'تنفيذ طلبات الميزات، كتابة اختبارات الوحدة، وإصلاح الأخطاء.') },
          { title: t('Developer', 'مطور'), duration: t('2-4 Years', '2-4 سنوات'), focus: t('Owning feature modules, database optimization, integration reviews.', 'امتلاك وحدات الميزات، تحسين قواعد البيانات، ومراجعات التكامل.') },
          { title: t('Senior Developer / Architect', 'كبير مطورين / مهندس معماري'), duration: t('4-7 Years', '4-7 سنوات'), focus: t('Designing system architectures, leading code reviews, mentoring.', 'تصميم بنيات النظام، قيادة مراجعات الأكواد، والإرشاد.') },
          { title: t('Engineering Director', 'مدير هندسي'), duration: t('7+ Years', '7+ سنوات'), focus: t('Formulating technical vision, managing engineering budgets and team scales.', 'صياغة الرؤية الفنية، إدارة الميزانيات الهندسية ومقاييس الفريق.') }
        ],
        promotionCriteria: [
          t('Clean code delivery and compliance with modern software architectures.', 'تقديم كود نظيف والالتزام بهندسة البرمجيات الحديثة.'),
          t('Demonstrated initiative in adopting new toolsets or optimizing workflows.', 'مبادرة واضحة في اعتماد أدوات جديدة أو تحسين سير العمل.'),
          t('Contributions to cross-team code libraries and shared utilities.', 'المساهمات في مكتبات الأكواد المشتركة بين الفرق والأدوات المساعدة.')
        ],
        emiratisationSupport: [
          t('Structured graduate training tracks matching technical credentials.', 'مسارات تدريب خريجين منظمة تطابق المؤهلات الفنية.'),
          t('Co-financing and salary support compatibility through the Nafis program.', 'التوافق مع برامج دعم الرواتب والتمويل المشترك عبر برنامج نافس.')
        ]
      };
    case 'finance':
      return {
        overview: t(
          `A leading financial institution offering secure banking, investment options, and capital services.`,
          `مؤسسة مالية رائدة تقدم الخدمات المصرفية الآمنة، خيارات الاستثمار، والخدمات الرأسمالية.`
        ),
        careerPath: [
          { title: t('Financial Analyst', 'محلل مالي'), duration: t('1-2 Years', '1-2 سنة'), focus: t('Data entry, ledger balances review, financial statement reviews.', 'إدخال البيانات، مراجعة موازين الحسابات، ومراجعة البيانات المالية.') },
          { title: t('Senior Analyst / Officer', 'كبير محللين / مسؤول'), duration: t('2-5 Years', '2-5 سنوات'), focus: t('Compiling credit reviews, executing transaction requests, client advisory.', 'إعداد مراجعات الائتمان، تنفيذ طلبات المعاملات، وتقديم الاستشارات للعملاء.') },
          { title: t('VP / Department Lead', 'نائب رئيس / رئيس قسم'), duration: t('5-8 Years', '5-8 سنوات'), focus: t('Managing compliance reviews, portfolio risks, and leading analyst teams.', 'إإدارة مراجعات الامتثال، مخاطر المحفظة، وقيادة فرق المحللين.') },
          { title: t('Director / General Manager', 'مدير / مدير عام'), duration: t('8+ Years', '8+ سنوات'), focus: t('Setting corporate finance policy, high-value client acquisitions, global growth.', 'وضع سياسة تمويل الشركات، الاستحواذ على عملاء ذوي قيمة عالية، والنمو العالمي.') }
        ],
        promotionCriteria: [
          t('Pristine compliance score in audits and regular transaction checks.', 'درجة امتثال مثالية في عمليات التدقيق وفحوصات المعاملات العادية.'),
          t('Successful delivery of financial portfolios and transaction targets.', 'التسليم الناجح للمحافظ المالية وأهداف المعاملات.'),
          t('Professional certifications such as CFA or ACCA.', 'الشهادات المهنية مثل CFA أو ACCA.')
        ],
        emiratisationSupport: [
          t('Direct entry pathways for local banking and economics graduates.', 'مسارات دخول مباشرة لخريجي العلوم المصرفية والاقتصاد المحليين.'),
          t('Integration with Nafis bank leadership programs.', 'التكامل مع برامج قيادة البنوك لبرنامج نافس.')
        ]
      };
    case 'energy':
      return {
        overview: t(
          `An energy firm driving infrastructure development, efficiency solutions, and power grid optimization.`,
          `شركة طاقة تقود تطوير البنية التحتية، حلول الكفاءة، وتحسين شبكة الطاقة.`
        ),
        careerPath: [
          { title: t('Graduate Engineer', 'مهندس خريج'), duration: t('1-2 Years', '1-2 سنة'), focus: t('Assisting on-site operations, drafting CAD diagrams, reporting.', 'المساعدة في العمليات الميدانية، صياغة مخططات CAD، وإعداد التقارير.') },
          { title: t('Operations Specialist', 'أخصائي عمليات'), duration: t('2-5 Years', '2-5 سنوات'), focus: t('Managing physical assets maintenance, diagnostic checks, vendor orders.', 'إدارة صيانة الأصول المادية، فحوصات التشخيص، وطلبات البائعين.') },
          { title: t('Lead Consultant / Senior Engineer', 'استشاري رئيسي / كبير مهندسين'), duration: t('5-8 Years', '5-8 سنوات'), focus: t('Managing multi-site optimization plans, compliance approvals, team safety.', 'إدارة خطط التحسين متعددة المواقع، موافقات الامتثال، وسلامة الفريق.') },
          { title: t('Chief Engineering Officer', 'رئيس المهندسين'), duration: t('8+ Years', '8+ سنوات'), focus: t('Formulating corporate resource strategy, safety audits, infrastructure vision.', 'صياغة استراتيجية الموارد للشركة، تدقيق السلامة، ورؤية البنية التحتية.') }
        ],
        promotionCriteria: [
          t('Adherence to strict HSE (Health, Safety, and Environment) policies.', 'الالتزام بسياسات الصحة والسلامة والبيئة (HSE) الصارمة.'),
          t('Proven delivery of infrastructure enhancements within project budgets.', 'إثبات تقديم تحسينات في البنية التحتية ضمن ميزانيات المشروع.'),
          t('Advanced training certifications in energy management.', 'شهادات تدريبية متقدمة في إدارة الطاقة.')
        ],
        emiratisationSupport: [
          t('Strategic partnership with local technical colleges and institutes.', 'شراكة استراتيجية مع الكليات والمعاهد التقنية المحلية.'),
          t('Compatibility with state engineering salary allowances and Nafis support.', 'التوافق مع البدلات المالية الهندسية للدولة ودعم نافس.')
        ]
      };
    case 'healthcare':
      return {
        overview: t(
          `A medical entity focused on healthcare diagnostics, therapeutic services, and clinical innovation.`,
          `جهة طبية تركز على تشخيصات الرعاية الصحية، الخدمات العلاجية، والابتكار السريري.`
        ),
        careerPath: [
          { title: t('Clinical Assistant', 'مساعد سريري'), duration: t('1-2 Years', '1-2 سنة'), focus: t('Patient diagnostics registration, maintaining laboratory logs, research aid.', 'تسجيل تشخيصات المرضى، الحفاظ على سجلات المختبر، والمساعدة البحثية.') },
          { title: t('healthcare Practitioner / Officer', 'ممارس الرعاية الصحية / مسؤول'), duration: t('2-5 Years', '2-5 سنوات'), focus: t('Conducting treatment programs, administering diagnostic tools, case write-ups.', 'إجراء برامج العلاج، تشغيل أدوات التشخيص، وكتابة تقارير الحالات.') },
          { title: t('Senior Medical Specialist', 'أخصائي طبي أول'), duration: t('5-8 Years', '5-8 سنوات'), focus: t('Directing clinical units, supervising interns, reviewing treatment plans.', 'توجيه الوحدات السريرية، الإشراف على المتدربين، ومراجعة خطط العلاج.') },
          { title: t('Clinical Director / Lab Head', 'مدير سريري / رئيس المختبر'), duration: t('8+ Years', '8+ سنوات'), focus: t('Managing healthcare policies, hospital compliance, scientific research strategy.', 'إدارة سياسات الرعاية الصحية، الامتثال للمستشفيات، واستراتيجية البحث العلمي.') }
        ],
        promotionCriteria: [
          t('Pristine medical licensing checks (e.g. MOHAP or DHA licence).', 'مراجعة تراخيص طبية ممتازة (مثل ترخيص وزارة الصحة أو هيئة الصحة بدبي).'),
          t('High patient satisfaction ratings and successful case resolutions.', 'تقييمات عالية لرضا المرضى وحل ناجح للحالات الطبية.'),
          t('Publication of research or contribution to medical trials.', 'نشر الأبحاث أو المساهمة في التجارب الطبية.')
        ],
        emiratisationSupport: [
          t('Sponsorship pathways for medical residency programs.', 'مسارات الرعاية لبرامج الإقامة الطبية.'),
          t('Nafis healthcare talent support compatibility.', 'التوافق مع دعم مواهب الرعاية الصحية لبرنامج نافس.')
        ]
      };
    case 'aerospace':
      return {
        overview: t(
          `An aviation specialist firm engineering avionics, systems design, and logistics support.`,
          `شركة متخصصة في الطيران تهندس إلكترونيات الطيران، تصميم الأنظمة، والدعم اللوجستي.`
        ),
        careerPath: [
          { title: t('Junior Systems Engineer', 'مهندس أنظمة مبتدئ'), duration: t('1-3 Years', '1-3 سنوات'), focus: t('Reviewing equipment logs, flight safety testing, technical documentation.', 'مراجعة سجلات المعدات، اختبار سلامة الطيران، والتوثيق الفني.') },
          { title: t('Aerospace Specialist', 'أخصائي طيران وفضاء'), duration: t('3-6 Years', '3-6 سنوات'), focus: t('Avionics design modifications, diagnostic software testing, engine tuning.', 'تعديلات تصميم إلكترونيات الطيران، اختبار برمجيات التشخيص، وضبط المحرك.') },
          { title: t('Lead Engineering Officer', 'رئيس المهندسين'), duration: t('6-9 Years', '6-9 سنوات'), focus: t('Supervising fleet checks, compliance verification, modification planning.', 'الإشراف على فحص الأسطول، التحقق من الامتثال، وتخطيط التعديل.') },
          { title: t('Program Director', 'مدير البرنامج'), duration: t('9+ Years', '9+ سنوات'), focus: t('Managing global operations, fleet acquisitions, aviation safety strategy.', 'إدارة العمليات العالمية، الاستحواذ على الأساطيل، واستراتيجية سلامة الطيران.') }
        ],
        promotionCriteria: [
          t('Adherence to civil and defense aviation security protocols.', 'الالتزام ببروتوكولات أمن الطيران المدني والدفاعي.'),
          t('Flawless safety records in aircraft maintenance checks.', 'سجلات سلامة مثالية في فحوصات صيانة الطائرات.'),
          t('GCAA (General Civil Aviation Authority) approvals and credentials.', 'الحصول على موافقات واعتمادات الهيئة العامة للطيران المدني (GCAA).')
        ],
        emiratisationSupport: [
          t('Aviation academy links for cadet and systems engineering pathways.', 'روابط أكاديمية الطيران لمسارات تدريب الطيارين وهندسة الأنظمة.'),
          t('Advanced training grants for national pilots and engineers.', 'منح تدريبية متقدمة للطيارين والمهندسين المواطنين.')
        ]
      };
    case 'tourism':
      return {
        overview: t(
          `A premium hospitality company creating experiences, managing resorts, and developing travel destinations.`,
          `شركة ضيافة متميزة تصنع التجارب، تدير المنتجعات، وتطور الوجهات السياحية.`
        ),
        careerPath: [
          { title: t('Guest Relations Associate', 'مسؤول علاقات الضيوف'), duration: t('1-2 Years', '1-2 سنة'), focus: t('Handling guest check-ins, lobby service operations, resolving issues.', 'التعامل مع تسجيل وصول الضيوف، عمليات خدمة البهو، وحل المشكلات.') },
          { title: t('Operations Team Lead', 'قائد فريق العمليات'), duration: t('2-4 Years', '2-4 سنوات'), focus: t('Supervising floor teams, kitchen safety compliance, booking systems.', 'الإشراف على فرق العمل، الامتثال لسلامة المطبخ، وأنظمة الحجز.') },
          { title: t('Department Manager', 'مدير قسم'), duration: t('4-7 Years', '4-7 سنوات'), focus: t('Managing resort sections budgets, guest satisfaction ratings, vendor deals.', 'إدارة ميزانيات أقسام المنتجع، تقييمات رضا الضيوف، وصفقات الموردين.') },
          { title: t('Resort GM / Operations Director', 'مدير عام المنتجع / مدير العمليات'), duration: t('7+ Years', '7+ سنوات'), focus: t('Full property revenue ownership, brand strategy, localized tourism development.', 'إدارة إيرادات العقار بالكامل، استراتيجية العلامة التجارية، وتطوير السياحة المحلية.') }
        ],
        promotionCriteria: [
          t('Excellent guest satisfaction ratings (Net Promoter Scores).', 'تقييمات ممتازة لرضا الضيوف (صافي درجات الترويج).'),
          t('Demonstrated ability to train and upskill hospitality personnel.', 'القدرة على تدريب وتطوير موظفي الضيافة.'),
          t('Revenue growth contributions through local event integrations.', 'المساهمة في نمو الإيرادات من خلال دمج الفعاليات المحلية.')
        ],
        emiratisationSupport: [
          t('Hospitality management fast-track pathways for national talent.', 'مسارات سريعة لإدارة الضيافة للمواهب الوطنية.'),
          t('Integration with Nafis career development plans and tourism grants.', 'التكامل مع خطط التطوير المهني لبرنامج نافس والمنح السياحية.')
        ]
      };
    default:
      return {
        overview: t(
          `An established enterprise focusing on corporate growth, local employment, and market services.`,
          `مؤسسة قائمة تركز على نمو الشركات، التوظيف المحلي، وخدمات السوق.`
        ),
        careerPath: [
          { title: t('Associate', 'مساعد'), duration: t('1-2 Years', '1-2 سنة'), focus: t('Basic operations support, reporting, client communication.', 'دعم العمليات الأساسية، التقارير، والتواصل مع العملاء.') },
          { title: t('Specialist', 'أخصائي'), duration: t('2-4 Years', '2-4 سنوات'), focus: t('Owning workstreams, process improvements, diagnostic tool checks.', 'إدارة مسارات العمل، تحسين العمليات، وفحوصات أدوات التشخيص.') },
          { title: t('Senior Specialist', 'أخصائي أول'), duration: t('4-7 Years', '4-7 سنوات'), focus: t('Project management, team supervision, strategic planning.', 'إدارة المشاريع، الإشراف على الفريق، والتخطيط الاستراتيجي.') },
          { title: t('Executive Director', 'مدير تنفيذي'), duration: t('7+ Years', '7+ سنوات'), focus: t('Business unit management, client acquisition, setting corporate policies.', 'إدارة وحدة الأعمال، الاستحواذ على العملاء، ووضع سياسات الشركة.') }
        ],
        promotionCriteria: [
          t('Consistent high scores in peer and supervisor performance reviews.', 'درجات عالية باستمرار في مراجعات الأداء من الأقران والمشرفين.'),
          t('Demonstrated capability in managing independent project deliveries.', 'القدرة المثبتة على إدارة تسليم المشاريع المستقلة.'),
          t('Adherence to the company core principles and quality standards.', 'الالتزام بمبادئ الشركة الأساسية ومعايير الجودة.')
        ],
        emiratisationSupport: [
          t('Compatibility with Nafis salary top-up and pension programs.', 'التوافق مع برامج دعم الرواتب والمعاشات التقاعدية لبرنامج نافس.'),
          t('Direct training and career growth mentoring initiatives.', 'مبادرات التدريب المباشر وإرشاد النمو المهني.')
        ]
      };
  }
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const FunctionalCareerPlanningHub: React.FC = () => {

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  // ── API state ──
  const [marketData, setMarketData] = useState<any>(null);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);

  // ── Industry data (from Industry Exploration API) ──
  // Fabricated fallbackIndustries removed (data-honesty audit) — it seeded
  // name-brand employers (Microsoft, Google, Amazon, ...) as if they were UAE
  // market data. Start empty; render only the real /api/education/content/industries.
  const [industries, setIndustries] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    // Fetch industries from API
    (async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_BASE}/api/education/content/industries`);
        if (res.ok) {
          const data = await res.json();
          const apiIndustries = (data.industries || []).map((s: any) => ({
            id: s.sector_id,
            name: isRTL ? (s.name_ar || s.name) : s.name,
            Icon: iconMap[s.icon] || Building2,
            growth: s.growth,
            jobs: s.jobs,
            avgSalary: isRTL ? (s.avg_salary_ar || s.avg_salary) : s.avg_salary,
            topCompanies: (() => { try { return JSON.parse(s.top_companies || '[]'); } catch { return []; } })(),
            description: isRTL ? (s.description_ar || s.description) : s.description,
            skills: (() => { try { return JSON.parse(s.skills || '[]'); } catch { return []; } })(),
            locations: (() => { try { return JSON.parse(s.locations || '[]'); } catch { return []; } })(),
            trending: s.trending || false,
            sector: s.sector_tag || s.sector_id,
          }));
          if (!cancelled && apiIndustries.length > 0) setIndustries(apiIndustries);
        }
      } catch (e) { console.error('Error fetching industries:', e); }
    })();

    // Fetch real market data
    (async () => {
      try {
        const res = await restClient.get('/api/career-services/market-overview');
        if (!cancelled && res.data) setMarketData(res.data);
      } catch { /* graceful fallback */ }
    })();

    // Fetch user skills
    (async () => {
      try {
        const data = await skillGraphAPI.getUserSkills();
        if (!cancelled) setUserSkills(data.skills || []);
      } catch { /* not logged in */ }
    })();

    return () => { cancelled = true; };
  }, [isRTL]);

  /* ──────────────────────── FILTER STATE ──────────────────────── */

  const sectorFilters = [
    { key: 'All', label: t('All', 'الكل') },
    { key: 'Tech', label: t('Tech', 'تقنية') },
    { key: 'Finance', label: t('Finance', 'مالية') },
    { key: 'Energy', label: t('Energy', 'طاقة') },
    { key: 'Health', label: t('Health', 'صحة') },
    { key: 'Aviation', label: t('Aviation', 'طيران') },
    { key: 'Hospitality', label: t('Hospitality', 'ضيافة') },
  ];

  const emirates = [
    { id: 'all', name: t('All Emirates', 'جميع الإمارات') },
    { id: 'dubai', name: t('Dubai', 'دبي') },
    { id: 'abu dhabi', name: t('Abu Dhabi', 'أبوظبي') },
    { id: 'sharjah', name: t('Sharjah', 'الشارقة') },
    { id: 'ras al khaimah', name: t('Ras Al Khaimah', 'رأس الخيمة') },
  ];

  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedEmirate, setSelectedEmirate] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCompany, setActiveCompany] = useState<{ name: string; sectorId: string } | null>(null);
  const [progressionLoading, setProgressionLoading] = useState(false);
  const [progressionData, setProgressionData] = useState<{
    overview: string;
    careerPath: Array<{ title: string; duration: string; focus: string }>;
    promotionCriteria: string[];
    emiratisationSupport: string[];
  } | null>(null);

  useEffect(() => {
    if (!activeCompany) {
      setProgressionData(null);
      return;
    }

    let cancelled = false;
    setProgressionLoading(true);

    (async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_BASE}/api/companies/progression?name=${encodeURIComponent(activeCompany.name)}`);
        if (!res.ok) {
          throw new Error('Failed to fetch progression');
        }
        const json = await res.json();
        if (cancelled) return;

        if (json.success && json.data) {
          const d = json.data;
          const transformed = {
            overview: isRTL ? (d.overview_ar || d.overview) : d.overview,
            careerPath: (d.career_path || []).map((cp: any) => ({
              title: isRTL ? (cp.title.ar || cp.title.en) : cp.title.en,
              duration: isRTL ? (cp.duration.ar || cp.duration.en) : cp.duration.en,
              focus: isRTL ? (cp.focus.ar || cp.focus.en) : cp.focus.en,
            })),
            promotionCriteria: (d.promotion_criteria || []).map((pc: any) => 
              isRTL ? (pc.ar || pc.en) : pc.en
            ),
            emiratisationSupport: (d.emiratisation_support || []).map((es: any) => 
              isRTL ? (es.ar || es.en) : es.en
            ),
          };
          setProgressionData(transformed);
        } else {
          setProgressionData(null);
        }
      } catch (err) {
        console.error('Failed to fetch company progression, falling back to static logic:', err);
        if (!cancelled) setProgressionData(null);
      } finally {
        if (!cancelled) setProgressionLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeCompany, isRTL]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveCompany(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtered = industries.filter(ind => {
    const matchSector = selectedSector === 'All' || ind.sector === selectedSector;
    const matchEmirate =
      selectedEmirate === 'all' ||
      ind.locations.some(l => l.toLowerCase().includes(selectedEmirate));
    const matchSearch =
      !searchQuery ||
      ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSector && matchEmirate && matchSearch;
  });

  /* ──────────────────────── REAL STATS ──────────────────────── */

  const s = marketData?.stats;
  const stats = [
    { value: String(industries.length), label: t('Key Sectors', 'القطاعات الرئيسية'), icon: Building2 },
    { value: s ? fmtNum(s.total_jobs) : '—', label: t('Job Postings', 'الإعلانات الوظيفية'), icon: Briefcase },
    { value: s ? fmtNum(s.total_companies) : '—', label: t('Companies', 'الشركات'), icon: Users },
    { value: s ? fmtSalary(s.avg_salary_max) : '—', label: t('Avg. Top Salary', 'أعلى متوسط راتب'), icon: DollarSign },
  ];

  /* ──────────────────────── MARKET INSIGHTS DATA ──────────────────────── */

  const marketInsights = [
    {
      title: t('D33 & Talent33 Impact', 'أثر D33 وTalent33'),
      desc: t(
        'Government initiatives driving growth in tech-sector jobs across the UAE.',
        'مبادرات حكومية تقود النمو في وظائف قطاع التكنولوجيا في الإمارات.'
      ),
      Icon: Target,
      trend: s ? `${fmtNum(s.total_jobs)} ${t('jobs', 'وظيفة')}` : t('Growing', 'نمو'),
      trendBg: brand.green,
      trendColor: brand.greenText,
    },
    {
      title: t('Emiratisation Focus', 'التركيز على التوطين'),
      desc: t(
        'Priority sectors offering enhanced opportunities for UAE Nationals.',
        'قطاعات ذات أولوية تقدم فرصاً معززة للمواطنين الإماراتيين.'
      ),
      Icon: Award,
      trend: t('Priority', 'أولوية'),
      trendBg: brand.blue,
      trendColor: brand.blueText,
    },
    {
      title: t('Registered Companies', 'الشركات المسجلة'),
      desc: t(
        'Active employers on the platform recruiting UAE talent.',
        'أصحاب عمل نشطون على المنصة يستقطبون الكفاءات الإماراتية.'
      ),
      Icon: Building2,
      trend: s ? fmtNum(s.total_companies) : '—',
      trendBg: brand.purple,
      trendColor: brand.purpleText,
    },
    {
      title: t('Training Programs', 'البرامج التدريبية'),
      desc: t(
        'Courses and certifications available on the platform.',
        'دورات وشهادات متاحة على المنصة.'
      ),
      Icon: BookOpen,
      trend: s ? fmtNum(s.training_programs) : '—',
      trendBg: brand.amber,
      trendColor: brand.amberText,
    },
  ];

  /* ──────────────────────── RECENT JOBS ──────────────────────── */

  const recentJobs = marketData?.recent_jobs || [];

  /* ──────────────────────── RESOURCES ──────────────────────── */

  const resources = [
    { title: t('CV Builder', 'منشئ السيرة الذاتية'), desc: t('Create professional resumes tailored for UAE employers', 'أنشئ سيراً ذاتية احترافية مصممة لأصحاب العمل في الإمارات'), Icon: Briefcase, action: t('Build CV', 'إنشاء سيرة ذاتية'), href: '/cv-builder' },
    { title: t('Interview Prep', 'التحضير للمقابلات'), desc: t('Practice with AI-powered mock interviews', 'تدرّب مع مقابلات تجريبية مدعومة بالذكاء الاصطناعي'), Icon: Users, action: t('Start Practice', 'ابدأ التدريب'), href: '/interview-preparation' },
    { title: t('Salary Calculator', 'حاسبة الرواتب'), desc: t('Research competitive salaries for your role', 'ابحث عن الرواتب التنافسية لمنصبك'), Icon: DollarSign, action: t('Calculate', 'احسب'), href: '/financial-planning' },
    { title: t('Skills Assessment', 'تقييم المهارات'), desc: t('Validate your skills with 500+ assessments across technical, leadership, and cognitive categories', 'تحقق من مهاراتك مع أكثر من 500 تقييم في فئات تقنية وقيادية ومعرفية'), Icon: Target, action: t('Take Assessments', 'ابدأ التقييمات'), href: '/assessments' },
    { title: t('Skill Development', 'تطوير المهارات'), desc: t('Find courses to enhance your capabilities', 'اعثر على دورات لتعزيز قدراتك'), Icon: BookOpen, action: t('Browse Courses', 'تصفح الدورات'), href: '/training' },
    { title: t('Networking Events', 'فعاليات التواصل'), desc: t('Connect with professionals in your field', 'تواصل مع المتخصصين في مجالك'), Icon: Users, action: t('Find Events', 'ابحث عن فعاليات'), href: '/communities' },
  ];

  /* ════════════════════════════════════════════════════════════
     TAB 1: EXPLORE INDUSTRIES
     ════════════════════════════════════════════════════════════ */
  const exploreTab = (
    <div>
      <AiAssistPanel
        feature="career_path"
        title="AI career suggestions"
        titleAr="اقتراحات مهنية بالذكاء الاصطناعي"
        getContext={() => ({
          skills: userSkills.map(s => s.skill_name).filter(Boolean).slice(0, 30),
          interests: selectedSector !== 'All' ? [selectedSector] : [],
        })}
        className="mb-6"
      />
      {/* Search and filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
          <input
            type="text"
            placeholder={t('Search industries or skills…', 'ابحث عن القطاعات أو المهارات...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 38px', borderRadius: 12,
              border: `1px solid ${brand.border}`, fontSize: 14, outline: 'none',
              transition: 'border-color 150ms',
            }}
            onFocus={e => e.currentTarget.style.borderColor = brand.primary}
            onBlur={e => e.currentTarget.style.borderColor = brand.border}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: brand.textSecondary, pointerEvents: 'none', display: 'flex' }}>
            <Search style={{ width: 16, height: 16 }} />
          </span>
        </div>

        {/* Emirate selector */}
        <select
          value={selectedEmirate}
          onChange={e => setSelectedEmirate(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500,
            border: `1px solid ${brand.border}`, background: '#fff', color: brand.textPrimary,
            cursor: 'pointer', outline: 'none',
          }}
        >
          {emirates.map(em => (
            <option key={em.id} value={em.id}>{em.name}</option>
          ))}
        </select>

        {/* Sector filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {sectorFilters.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedSector(cat.key)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                border: selectedSector === cat.key ? 'none' : `1px solid ${brand.border}`,
                background: selectedSector === cat.key ? brand.primary : '#fff',
                color: selectedSector === cat.key ? '#fff' : brand.textSecondary,
                cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20 }}>
        {t(
          `Showing ${filtered.length} industr${filtered.length !== 1 ? 'ies' : 'y'}`,
          `عرض ${filtered.length} ${filtered.length === 1 ? 'قطاع' : 'قطاعات'}`
        )}
      </p>

      {/* Industry cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Search style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('No industries found', 'لم يتم العثور على قطاعات')}</h3>
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Try adjusting your search or filter criteria.', 'حاول تعديل معايير البحث أو التصفية.')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {filtered.map(ind => {
            const isExpanded = expandedId === ind.id;
            return (
              <div
                key={ind.id}
                onClick={() => setExpandedId(isExpanded ? null : ind.id)}
                style={{
                  background: '#fff', borderRadius: 16,
                  border: `1px solid ${isExpanded ? brand.primary : brand.border}`,
                  boxShadow: isExpanded ? '0 4px 12px rgba(13,148,136,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                  overflow: 'hidden', transition: 'border-color 150ms, box-shadow 150ms',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  if (!isExpanded) {
                    e.currentTarget.style.borderColor = brand.primary;
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isExpanded) {
                    e.currentTarget.style.borderColor = brand.border;
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                  }
                }}
              >
                {/* Accent strip */}
                <div style={{ height: 4, background: ind.trending ? brand.primary : brand.border }} />

                <div style={{ padding: 22 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: brand.primarySurface, color: brand.primary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <ind.Icon style={{ width: 22, height: 22 }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{ind.name}</h3>
                          {ind.trending && (
                            <span style={{
                              padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                              background: brand.red, color: brand.redText,
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                            }}>
                              <TrendingUp style={{ width: 10, height: 10 }} /> {t('Trending', 'رائج')}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: brand.textSecondary, margin: '4px 0 0', lineHeight: 1.4 }}>{ind.description}</p>
                      </div>
                    </div>
                    <ChevronIcon style={{
                      width: 18, height: 18, color: brand.textSecondary, flexShrink: 0, marginTop: 4,
                      transition: 'transform 200ms',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }} />
                  </div>

                  {/* Quick stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: isExpanded ? 16 : 0 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 10, background: brand.primarySurface, textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: brand.greenText }}>{ind.growth}</div>
                      <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Growth', 'النمو')}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 10, background: brand.blue, textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: brand.blueText }}>{ind.jobs}</div>
                      <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Positions', 'وظائف')}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 10, background: brand.purple, textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: brand.purpleText }}>{ind.avgSalary.split('–')[0]}</div>
                      <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Avg. Salary', 'متوسط الراتب')}</div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{ borderTop: `1px solid ${brand.border}`, paddingTop: 16 }}
                    >
                      {/* Top Employers */}
                      <div style={{ marginBottom: 14 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Building2 style={{ width: 13, height: 13 }} /> {t('Top Employers', 'أبرز جهات التوظيف')}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {ind.topCompanies.map((c, i) => (
                            <button
                              key={i}
                              className="company-badge-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCompany({ name: c, sectorId: ind.id });
                              }}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* In-demand Skills */}
                      <div style={{ marginBottom: 14 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Award style={{ width: 13, height: 13 }} /> {t('In-Demand Skills', 'المهارات المطلوبة')}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {ind.skills.map((sk, i) => (
                            <span key={i} style={{
                              padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                              background: brand.primarySurface, color: brand.primary,
                            }}>
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Locations */}
                      <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin style={{ width: 13, height: 13 }} /> {t('Key Locations', 'المواقع الرئيسية')}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {ind.locations.map((l, i) => (
                            <span key={i} style={{
                              padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                              background: brand.green, color: brand.greenText,
                            }}>
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* CTA button — links to job matching */}
                      <Link
                        to={`/job-matching?industry=${encodeURIComponent(ind.name)}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          display: 'flex', width: '100%', padding: '11px 0', borderRadius: 12,
                          background: brand.primary, color: '#fff', fontSize: 14, fontWeight: 600,
                          border: 'none', cursor: 'pointer', transition: 'background 150ms',
                          alignItems: 'center', justifyContent: 'center', gap: 6,
                          textDecoration: 'none',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = brand.primaryDark}
                        onMouseLeave={e => e.currentTarget.style.background = brand.primary}
                      >
                        {t('Explore Career Opportunities', 'استكشف الفرص الوظيفية')} <ChevronIcon style={{ width: 16, height: 16 }} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     TAB 2: JOB MARKET (Real data from platform)
     ════════════════════════════════════════════════════════════ */
  const marketTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('UAE Job Market — Platform Data', 'سوق العمل الإماراتي — بيانات المنصة')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Real-time data from job postings and companies registered on the platform.',
          'بيانات آنية من الإعلانات الوظيفية والشركات المسجلة على المنصة.'
        )}
      </p>

      {/* Platform stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: t('Total Job Postings', 'إجمالي الإعلانات الوظيفية'), value: s ? fmtNum(s.total_jobs) : '—', bg: brand.blue, color: brand.blueText },
          { label: t('Active Vacancies', 'الشواغر النشطة'), value: s ? fmtNum(s.active_jobs) : '—', bg: brand.green, color: brand.greenText },
          { label: t('Registered Companies', 'الشركات المسجلة'), value: s ? fmtNum(s.total_companies) : '—', bg: brand.purple, color: brand.purpleText },
          { label: t('Registered Users', 'المستخدمون المسجلون'), value: s ? fmtNum(s.registered_users) : '—', bg: brand.amber, color: brand.amberText },
        ].map((kpi, i) => (
          <div key={i} style={{
            padding: 18, borderRadius: 14, background: '#fff',
            border: `1px solid ${brand.border}`, textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color, marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: brand.textSecondary }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Jobs by department */}
      {(marketData?.jobs_by_department || []).length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Jobs by Department', 'الوظائف حسب القسم')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {(marketData?.jobs_by_department || []).map((dept: any, i: number) => (
              <div
                key={i}
                style={{
                  background: '#fff', borderRadius: 14, border: `1px solid ${brand.border}`,
                  padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'border-color 150ms, box-shadow 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
              >
                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, marginBottom: 10 }}>{dept.department}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: brand.green, color: brand.greenText }}>
                    {fmtNum(dept.count)} {t('posts', 'إعلان')}
                  </span>
                  <span style={{ fontSize: 12, color: brand.textSecondary }}>
                    {fmtNum(dept.vacancies)} {t('vacancies', 'شاغر')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent job postings */}
      {recentJobs.length > 0 && (
        <div style={{ padding: 24, borderRadius: 16, background: brand.primarySurface, border: `1px solid ${brand.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Recent Job Postings', 'أحدث الإعلانات الوظيفية')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentJobs.map((job: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < recentJobs.length - 1 ? `1px solid ${brand.border}` : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: brand.primary, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{job.title}</div>
                  <div style={{ fontSize: 12, color: brand.textSecondary }}>
                    {job.company_name || job.department || '—'} • {job.emirate || 'UAE'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data fallback */}
      {!s && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: brand.textSecondary }}>
          <BarChart3 style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>{t('Loading market data…', 'جارٍ تحميل بيانات السوق…')}</p>
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     TAB 3: MARKET INSIGHTS
     ════════════════════════════════════════════════════════════ */
  const insightsTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Platform Intelligence', 'ذكاء المنصة')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Key metrics and opportunities from the Emirati Gateway platform.',
          'مؤشرات رئيسية وفرص من منصة البوابة الإماراتية.'
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {marketInsights.map((item, i) => (
          <div
            key={i}
            style={{
              background: '#fff', borderRadius: 16,
              border: `1px solid ${brand.border}`,
              padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = brand.primary;
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = brand.border;
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: brand.primarySurface, color: brand.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <item.Icon style={{ width: 22, height: 22 }} />
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                background: item.trendBg, color: item.trendColor,
              }}>
                {item.trend}
              </span>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{item.title}</h3>
            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* AI-powered banner */}
      <div style={{
        marginTop: 32, padding: 24, borderRadius: 16,
        background: brand.primarySurface, border: `1px solid ${brand.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Lightbulb style={{ width: 22, height: 22, color: brand.primary }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('AI-Powered Career Matching', 'مطابقة مهنية بالذكاء الاصطناعي')}</h3>
        </div>
        <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>
          {t(
            'Our advanced AI analyzes your profile to provide personalized career recommendations tailored to the UAE job market.',
            'يحلّل ذكاؤنا الاصطناعي المتقدم ملفك الشخصي لتقديم توصيات مهنية مخصصة مصممة لسوق العمل الإماراتي.'
          )}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: brand.primary, fontWeight: 600 }}>
          <CheckCircle style={{ width: 16, height: 16 }} /> {t('Powered by AI', 'مدعوم بالذكاء الاصطناعي')}
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     TAB 4: EMIRATISATION
     ════════════════════════════════════════════════════════════ */
  const emiratisationTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Emiratisation Opportunities', 'فرص التوطين')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Key sectors actively recruiting UAE Nationals through dedicated Emiratisation programs.',
          'قطاعات رئيسية تستقطب الكوادر الإماراتية عبر برامج توطين مخصصة.'
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {[
          {
            title: t('Technology & Digital', 'التكنولوجيا والرقمنة'),
            quota: t('10% annual increase', 'زيادة سنوية 10%'),
            roles: s ? `${fmtNum(s.total_jobs)} ${t('platform postings', 'إعلان على المنصة')}` : t('Growing', 'متنامٍ'),
            programs: [
              t('Technology sector graduate programs', 'برامج الخريجين في قطاع التكنولوجيا'),
              t('Cloud & AI specialist tracks', 'مسارات تخصص السحابة والذكاء الاصطناعي'),
              t('Digital transformation initiatives', 'مبادرات التحول الرقمي'),
            ],
            catBg: brand.blue,
            catColor: brand.blueText,
          },
          {
            title: t('Banking & Finance', 'المصارف والتمويل'),
            quota: t('4% annual target', 'مستهدف سنوي 4%'),
            roles: t('High demand', 'طلب مرتفع'),
            programs: [
              t('Banking sector graduate schemes', 'برامج تدريب الخريجين في القطاع المصرفي'),
              t('Islamic finance specialist tracks', 'مسارات تخصص التمويل الإسلامي'),
              t('Fintech innovation programs', 'برامج ابتكار التقنية المالية'),
            ],
            catBg: brand.green,
            catColor: brand.greenText,
          },
          {
            title: t('Energy & Industrial', 'الطاقة والصناعة'),
            quota: t('15% Emiratisation', 'توطين 15%'),
            roles: t('Expanding', 'متوسع'),
            programs: [
              t('Energy sector engineering programs', 'برامج الهندسة في قطاع الطاقة'),
              t('Renewable energy specialist tracks', 'مسارات تخصص الطاقة المتجددة'),
              t('National development training schemes', 'برامج التدريب للتطوير الوطني'),
            ],
            catBg: brand.amber,
            catColor: brand.amberText,
          },
          {
            title: t('Consulting & Professional Services', 'الاستشارات والخدمات المهنية'),
            quota: t('Growing demand', 'طلب متزايد'),
            roles: t('Emerging', 'ناشئ'),
            programs: [
              t('Management consulting development programs', 'برامج تطوير الاستشارات الإدارية'),
              t('Professional services talent tracks', 'مسارات المواهب في الخدمات المهنية'),
              t('Emirati leadership accelerators', 'مسرّعات القيادة الإماراتية'),
            ],
            catBg: brand.purple,
            catColor: brand.purpleText,
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: '#fff', borderRadius: 16,
              border: `1px solid ${brand.border}`,
              overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = brand.primary;
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = brand.border;
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            }}
          >
            <div style={{ height: 4, background: brand.primary }} />
            <div style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{item.title}</h3>
                <span style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                  background: item.catBg, color: item.catColor,
                }}>
                  {item.quota}
                </span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: brand.primary, marginBottom: 14 }}>
                {item.roles}
              </p>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                {t('Key Programs', 'البرامج الرئيسية')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {item.programs.map((p, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: brand.textPrimary }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: brand.primary, flexShrink: 0 }} />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     TAB 5: RESOURCES
     ════════════════════════════════════════════════════════════ */
  const resourcesTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Career Development Resources', 'موارد التطوير المهني')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Access tools, guides, and resources to accelerate your career growth in the UAE.',
          'استخدم الأدوات والأدلة والموارد لتسريع نموك المهني في الإمارات.'
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {resources.map((r, i) => (
          <div
            key={i}
            style={{
              background: '#fff', borderRadius: 16, border: `1px solid ${brand.border}`,
              padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, marginBottom: 14,
              background: brand.primarySurface, color: brand.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <r.Icon style={{ width: 24, height: 24 }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{r.title}</h3>
            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 16 }}>{r.desc}</p>
            <Link
              to={r.href}
              style={{
                display: 'block', width: '100%', padding: '10px 0', borderRadius: 12,
                background: brand.primary, color: '#fff', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'background 150ms',
                textAlign: 'center', textDecoration: 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = brand.primaryDark}
              onMouseLeave={e => e.currentTarget.style.background = brand.primary}
            >
              {r.action}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );

  /* ──────────────────────── TABS CONFIG ──────────────────────── */

  const tabs = [
    { id: 'explore', label: t('Explore Industries', 'استكشاف القطاعات'), icon: <Building2 className="h-4 w-4" />, content: exploreTab },
    { id: 'market', label: t('Job Market', 'سوق العمل'), icon: <TrendingUp className="h-4 w-4" />, content: marketTab },
    { id: 'insights', label: t('Market Insights', 'رؤى السوق'), icon: <BarChart3 className="h-4 w-4" />, content: insightsTab },
    { id: 'emiratisation', label: t('Emiratisation', 'التوطين'), icon: <Star className="h-4 w-4" />, content: emiratisationTab },
    { id: 'resources', label: t('Resources', 'الموارد'), icon: <BookOpen className="h-4 w-4" />, content: resourcesTab },
  ];

  return (
    <>
      <EducationPathwayLayout
        title={t('Career Planning Hub', 'مركز التخطيط المهني')}
        description={t(
          "Explore UAE industries, discover career opportunities, assess market trends, and access career development resources — all in one place.",
          'استكشف القطاعات الإماراتية، واكتشف الفرص الوظيفية، وتابع اتجاهات السوق، واستخدم موارد التطوير المهني — كل ذلك في مكان واحد.'
        )}
        icon={<Compass className="h-6 w-6" />}
        stats={stats}
        tabs={tabs}
        defaultTab="explore"
        actionButtonText={t('Start Exploring', 'ابدأ الاستكشاف')}
        onActionClick={() => {
          const tabContent = document.querySelector('[role="tablist"]');
          if (tabContent) {
            tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      />

      {/* Modal */}
      {activeCompany && (() => {
        const progression = progressionData || getCompanyProgression(activeCompany.name, activeCompany.sectorId, t);
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 16,
            }}
            onClick={() => setActiveCompany(null)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                width: '100%',
                maxWidth: 680,
                maxHeight: '90vh',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: `1px solid ${brand.border}`,
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: '24px 28px',
                  borderBottom: `1px solid ${brand.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: brand.primarySurface,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: '#fff',
                      color: brand.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${brand.border}`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    }}
                  >
                    <Building2 style={{ width: 24, height: 24 }} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: brand.textPrimary,
                        margin: 0,
                      }}
                    >
                      {activeCompany.name}
                    </h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: brand.primary,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: '2px 0 0',
                      }}
                    >
                      {t('Career Path & Promotion Opportunities', 'مسار التطوير المهني وفرص الترقية')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCompany(null)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: `1px solid ${brand.border}`,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: brand.textSecondary,
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = brand.redText;
                    e.currentTarget.style.background = brand.red;
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = brand.textSecondary;
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = brand.border;
                  }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              {/* Scrollable Content */}
              {progressionLoading ? (
                <div
                  style={{
                    padding: '64px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: `3px solid ${brand.border}`,
                      borderTopColor: brand.primary,
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                  <p
                    style={{
                      fontSize: 14,
                      color: brand.textSecondary,
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    {t('Loading career pathways...', 'جاري تحميل مسارات التطوير المهني...')}
                  </p>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      padding: '28px',
                      overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                }}
              >
                {/* Overview */}
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      color: brand.textSecondary,
                      lineHeight: 1.6,
                      margin: 0,
                      fontStyle: 'italic',
                    }}
                  >
                    {progression.overview}
                  </p>
                </div>

                {/* Career Timeline */}
                <div>
                  <h4
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: brand.textPrimary,
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <TrendingUp style={{ width: 18, height: 18, color: brand.primary }} />
                    {t('Typical Progression Pathway', 'مسار التطور المهني المعتاد')}
                  </h4>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      paddingLeft: isRTL ? 0 : 20,
                      paddingRight: isRTL ? 20 : 0,
                    }}
                  >
                    {/* Vertical line indicator */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        bottom: 8,
                        left: isRTL ? 'auto' : 6,
                        right: isRTL ? 6 : 'auto',
                        width: 2,
                        background: brand.border,
                      }}
                    />

                    {progression.careerPath.map((step, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'relative',
                          marginBottom: i < progression.careerPath.length - 1 ? 20 : 0,
                          paddingLeft: isRTL ? 0 : 24,
                          paddingRight: isRTL ? 24 : 0,
                        }}
                      >
                        {/* Circle bullet */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 4,
                            left: isRTL ? 'auto' : -2,
                            right: isRTL ? -2 : 'auto',
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: '#fff',
                            border: `3px solid ${brand.primary}`,
                            boxShadow: '0 0 0 4px #fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        />
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            gap: 12,
                            flexWrap: 'wrap',
                          }}
                        >
                          <h5
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: brand.textPrimary,
                              margin: 0,
                            }}
                          >
                            {step.title}
                          </h5>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: brand.greenText,
                              background: brand.green,
                              padding: '2px 8px',
                              borderRadius: 12,
                            }}
                          >
                            {step.duration}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: brand.textSecondary,
                            margin: '4px 0 0',
                            lineHeight: 1.4,
                          }}
                        >
                          {step.focus}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Promotion Opportunities */}
                <div>
                  <h4
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: brand.textPrimary,
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Award style={{ width: 18, height: 18, color: brand.primary }} />
                    {t('Promotion Criteria & Opportunities', 'فرص الترقية ومتطلباتها')}
                  </h4>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      background: '#F9FAFB',
                      padding: 16,
                      borderRadius: 12,
                      border: `1px solid ${brand.border}`,
                    }}
                  >
                    {progression.promotionCriteria.map((criterion, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'start',
                          gap: 10,
                          fontSize: 13,
                          color: brand.textPrimary,
                          lineHeight: 1.4,
                        }}
                      >
                        <CheckCircle
                          style={{
                            width: 16,
                            height: 16,
                            color: brand.primary,
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        />
                        <span>{criterion}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emiratisation Alignment */}
                <div
                  style={{
                    background: brand.primarySurface,
                    border: `1px dashed ${brand.primary}`,
                    borderRadius: 12,
                    padding: 18,
                  }}
                >
                  <h4
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: brand.primaryDark,
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Star style={{ width: 16, height: 16, color: brand.primary }} />
                    {t('Emiratisation & National Talent Support', 'التوطين ودعم الكوادر الوطنية')}
                  </h4>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: isRTL ? 0 : 18,
                      paddingRight: isRTL ? 18 : 0,
                      fontSize: 12,
                      color: brand.textPrimary,
                      lineHeight: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {progression.emiratisationSupport.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '16px 28px',
                  borderTop: `1px solid ${brand.border}`,
                  background: '#F9FAFB',
                  display: 'flex',
                  justifyContent: 'end',
                  gap: 12,
                }}
              >
                <button
                  onClick={() => setActiveCompany(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    border: `1px solid ${brand.border}`,
                    background: '#fff',
                    color: brand.textPrimary,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#F3F4F6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  {t('Close', 'إغلاق')}
                </button>
                <Link
                  to={`/job-matching?company=${encodeURIComponent(activeCompany.name)}`}
                  onClick={() => setActiveCompany(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    background: brand.primary,
                    color: '#fff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = brand.primaryDark;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = brand.primary;
                  }}
                >
                  {t('View Company Openings', 'عرض شواغر الشركة')}
                  <ChevronIcon style={{ width: 14, height: 14 }} />
                </Link>
              </div>
            </>
          )}
        </div>
          </div>
        );
      })()}
    </>
  );
};

export default FunctionalCareerPlanningHub;
