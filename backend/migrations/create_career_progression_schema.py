#!/usr/bin/env python3
"""
Database Migration & Seeding for Company Workspaces and Career Progressions
========================================================================
This script:
1. Adds the missing workspace columns to the `companies` table using the correct
   foreign key types for string-based user IDs (character(15) EID format).
2. Creates the `company_employees` and `company_resource_assignments` tables.
3. Creates the `company_career_progressions` table.
4. Seeds the target companies and populates their bilingual career progression paths.
"""

import os
import sys
import json
import logging
import psycopg2
import psycopg2.extras

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('progression_migration')

# Add backend to sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(script_dir, '..'))
sys.path.insert(0, backend_dir)

# Load env variables from backend/.env
env_path = os.path.join(backend_dir, '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip()

from db import get_db_connection

SEED_COMPANIES = [
    {
        "name": "Microsoft",
        "industry": "Technology",
        "description": "Global leader in software, services, devices and solutions.",
        "website": "https://www.microsoft.com",
        "slug": "microsoft",
        "overview_en": "A global leader in technology, cloud computing, and AI, driving innovation and digital transformation in the UAE.",
        "overview_ar": "شركة عالمية رائدة في مجال التكنولوجيا والحوسبة السحابية والذكاء الاصطناعي، تقود الابتكار والتحول الرقمي في الإمارات.",
        "career_path": [
            { "title_en": "Software Engineer I", "title_ar": "مهندس برمجيات أول", "duration_en": "1-2 Years", "duration_ar": "1-2 سنة", "focus_en": "Learning codebase, minor features, bug fixes, testing.", "focus_ar": "تعلم التعليمات البرمجية، الميزات البسيطة، إصلاح الأخطاء، والاختبار." },
            { "title_en": "Software Engineer II", "title_ar": "مهندس برمجيات ثاني", "duration_en": "2-4 Years", "duration_ar": "2-4 سنوات", "focus_en": "Owning features, design contributions, system reliability.", "focus_ar": "امتلاك الميزات، المساهمة في التصميم، وموثوقية النظام." },
            { "title_en": "Senior Software Engineer", "title_ar": "كبير مهندسي برمجيات", "duration_en": "4-7 Years", "duration_ar": "4-7 سنوات", "focus_en": "Architecture design, mentoring juniors, leading small projects.", "focus_ar": "تصميم البنية البرمجية، إرشاد المبتدئين، وقيادة المشاريع الصغيرة." },
            { "title_en": "Principal Software Engineer", "title_ar": "مهندس برمجيات رئيسي", "duration_en": "7+ Years", "duration_ar": "7+ سنوات", "focus_en": "Technical strategy, cross-team alignment, architectural roadmap.", "focus_ar": "الاستراتيجية التقنية، التنسيق بين الفرق، ومخطط البنية البرمجية." }
        ],
        "promotion_criteria": [
            { "en": "Demonstrate ownership of critical features and robust code delivery.", "ar": "إثبات القدرة على امتلاك الميزات الهامة وتقديم برمجيات قوية." },
            { "en": "Active participation in design reviews and architectural decisions.", "ar": "المشاركة الفعالة في مراجعات التصميم والقرارات المعمارية." },
            { "en": "Mentoring junior engineers and improving overall team code quality.", "ar": "إرشاد المهندسين المبتدئين وتحسين جودة البرمجة الإجمالية للفريق." },
            { "en": "Relevant professional certifications (e.g. Azure Solutions Architect).", "ar": "الشهادات المهنية ذات الصلة (مثل Azure Solutions Architect)." }
        ],
        "emiratisation_support": [
            { "en": "Nafis program compatibility and salary support alignment.", "ar": "التوافق مع برنامج نافس ومواءمة دعم الرواتب." },
            { "en": "Microsoft UAE Graduate Program (Tomoh) for Emirati nationals.", "ar": "برنامج مايكروسوفت للخريجين في الإمارات (طموح) للمواطنين الإماراتيين." },
            { "en": "Direct mentorship from global Microsoft tech leads.", "ar": "إرشاد مباشر من قادة تكنولوجيا مايكروسوفت العالميين." }
        ]
    },
    {
        "name": "Google",
        "industry": "Technology",
        "description": "Global technology giant specializing in internet-related services and products.",
        "website": "https://www.google.com",
        "slug": "google",
        "overview_en": "A global technology giant focusing on search, cloud, AI, and hardware, empowering UAE developers and businesses.",
        "overview_ar": "شركة تكنولوجيا عالمية تركز على البحث، السحابية، الذكاء الاصطناعي، والأجهزة، وتمكين المطورين والشركات في الإمارات.",
        "career_path": [
            { "title_en": "Software Engineer (L3)", "title_ar": "مهندس برمجيات (L3)", "duration_en": "1-2 Years", "duration_ar": "1-2 سنة", "focus_en": "Developing clean code, writing unit tests, and designing simple features.", "focus_ar": "تطوير كود نظيف، كتابة اختبارات الوحدة، وتصميم ميزات بسيطة." },
            { "title_en": "Software Engineer (L4)", "title_ar": "مهندس برمجيات (L4)", "duration_en": "2-4 Years", "duration_ar": "2-4 سنوات", "focus_en": "Leading moderate projects, system design, code reviews.", "focus_ar": "قيادة مشاريع متوسطة، تصميم النظام، ومراجعة الأكواد." },
            { "title_en": "Senior Software Engineer (L5)", "title_ar": "كبير مهندسي برمجيات (L5)", "duration_en": "4-7 Years", "duration_ar": "4-7 سنوات", "focus_en": "Technical leadership, defining project scopes, mentoring L3/L4 engineers.", "focus_ar": "القيادة التقنية، تحديد نطاقات المشاريع، وإرشاد مهندسي L3/L4." },
            { "title_en": "Staff Engineer (L6)", "title_ar": "مهندس طاقم عمل (L6)", "duration_en": "7+ Years", "duration_ar": "7+ سنوات", "focus_en": "Influencing organization-wide technology roadmaps and architectural designs.", "focus_ar": "التأثير على خرائط تكنولوجيا المؤسسة بأكملها والتصميمات المعمارية." }
        ],
        "promotion_criteria": [
            { "en": "Consistently deliver code with high impact, quality, and low bug rate.", "ar": "تقديم كود ذو تأثير وجودة عالية وبمعدل أخطاء منخفض باستمرار." },
            { "en": "Strong technical leadership and ability to navigate ambiguous scopes.", "ar": "قيادة تقنية قوية والقدرة على التعامل مع المهام الغامضة." },
            { "en": "Positive contributions to Google’s engineering culture and peer mentoring.", "ar": "المساهمة الإيجابية في الثقافة الهندسية لجوجل وإرشاد الأقران." },
            { "en": "Proven track record of designing scalable and maintainable distributed systems.", "ar": "سجل حافل في تصميم أنظمة موزعة قابلة للتطوير والصيانة." }
        ],
        "emiratisation_support": [
            { "en": "Active participation in local digital economy talent initiatives.", "ar": "المشاركة الفعالة في مبادرات مواهب الاقتصاد الرقمي المحلي." },
            { "en": "Google UAE Internship Program for qualified Emirati undergraduates.", "ar": "برنامج جوجل للتدريب الداخلي في الإمارات لطلاب الجامعات الإماراتيين المؤهلين." },
            { "en": "Access to Google Developer Groups and premium training resources.", "ar": "الوصول إلى مجموعات مطوري جوجل وموارد التدريب المتميزة." }
        ]
    },
    {
        "name": "Amazon",
        "industry": "Technology",
        "description": "Global e-commerce and cloud computing leader.",
        "website": "https://www.amazon.com",
        "slug": "amazon",
        "overview_en": "A pioneer in e-commerce, cloud computing (AWS), and digital streaming, accelerating digital business in the UAE.",
        "overview_ar": "رائدة في التجارة الإلكترونية، الحوسبة السحابية (AWS)، والبث الرقمي، مما يسرع الأعمال الرقمية في الإمارات.",
        "career_path": [
            { "title_en": "Software Development Engineer I (L4)", "title_ar": "مهندس تطوير برمجيات أول (L4)", "duration_en": "1-2 Years", "duration_ar": "1-2 سنة", "focus_en": "Developing service features, resolving tickets, and operational excellence.", "focus_ar": "تطوير ميزات الخدمة، حل التذاكر البرمجية، والتميز التشغيلي." },
            { "title_en": "Software Development Engineer II (L5)", "title_ar": "مهندس تطوير برمجيات ثاني (L5)", "duration_en": "2-4 Years", "duration_ar": "2-4 سنوات", "focus_en": "Designing components, system scaling, operational leadership.", "focus_ar": "تصميم المكونات، توسيع نطاق النظام، والقيادة التشغيلية." },
            { "title_en": "Senior SDE (L6)", "title_ar": "كبير مهندسي تطوير برمجيات (L6)", "duration_en": "4-7 Years", "duration_ar": "4-7 سنوات", "focus_en": "Leading engineering teams, system architecture, long-term technical plans.", "focus_ar": "قيادة الفرق الهندسية، هندسة النظام، والخطط التقنية طويلة الأجل." },
            { "title_en": "Principal SDE (L7)", "title_ar": "مهندس تطوير رئيسي (L7)", "duration_en": "7+ Years", "duration_ar": "7+ سنوات", "focus_en": "Setting technical vision across multiple organisations and business units.", "focus_ar": "وضع الرؤية التقنية عبر العديد من المؤسسات ووحدات العمل." }
        ],
        "promotion_criteria": [
            { "en": "Exceeding expectations in Amazon Leadership Principles.", "ar": "تجاوز التوقعات في مبادئ القيادة لشركة أمازون." },
            { "en": "Delivering high-availability systems with excellent operational metrics.", "ar": "تقديم أنظمة عالية التوفر بمقاييس تشغيلية ممتازة." },
            { "en": "Leading architecture alignment across team boundaries.", "ar": "قيادة توافق البنية البرمجية عبر حدود الفريق." },
            { "en": "AWS professional certifications (e.g. DevOps Engineer / Solutions Architect).", "ar": "الشهادات المهنية لـ AWS (مثل مهندس DevOps / مهندس حلول)." }
        ],
        "emiratisation_support": [
            { "en": "Dedicated AWS Cloud training pathways for Emirati students.", "ar": "مسارات تدريب سحابية مخصصة من AWS للطلاب الإماراتيين." },
            { "en": "Alignment with Nafis program for salary and pension support.", "ar": "التوافق مع برنامج نافس لدعم الرواتب والمعاشات التقاعدية." },
            { "en": "Emirati graduate accelerator programs in cloud engineering.", "ar": "مسرّعات خريجي الإمارات في هندسة السحابة." }
        ]
    },
    {
        "name": "JPMorgan",
        "industry": "Finance",
        "description": "Global financial services firm and investment bank.",
        "website": "https://www.jpmorgan.com",
        "slug": "jpmorgan",
        "overview_en": "A leading global financial services firm providing investment banking and wealth management in the UAE.",
        "overview_ar": "مؤسسة خدمات مالية عالمية رائدة تقدم الخدمات المصرفية الاستثمارية وإدارة الثروات في الإمارات.",
        "career_path": [
            { "title_en": "Analyst", "title_ar": "محلل مالى", "duration_en": "1-3 Years", "duration_ar": "1-3 سنوات", "focus_en": "Financial modeling, industry research, slide decks, database management.", "focus_ar": "النمذجة المالية، بحوث الصناعة، العروض التقديمية، وإدارة قواعد البيانات." },
            { "title_en": "Associate", "title_ar": "شريك مالى", "duration_en": "3-5 Years", "duration_ar": "3-5 سنوات", "focus_en": "Managing deal workflows, client communication, supervising analysts.", "focus_ar": "إدارة سير عمل الصفقات، التواصل مع العملاء، والإشراف على المحللين." },
            { "title_en": "Vice President (VP)", "title_ar": "نائب الرئيس", "duration_en": "5-8 Years", "duration_ar": "5-8 سنوات", "focus_en": "Client relationships, execution of deals, team leadership, risk management.", "focus_ar": "علاقات العملاء، تنفيذ الصفقات، قيادة الفريق، وإدارة المخاطر." },
            { "title_en": "Executive Director", "title_ar": "مدير تنفيذي", "duration_en": "8+ Years", "duration_ar": "8+ سنوات", "focus_en": "Origination of deals, strategic sector leadership, high-level client advisory.", "focus_ar": "ابتكار الصفقات، القيادة الاستراتيجية للقطاع، وتقديم الاستشارات للعملاء." }
        ],
        "promotion_criteria": [
            { "en": "Consistently high performance on transaction execution and client satisfaction.", "ar": "أداء عالي باستمرار في تنفيذ المعاملات ورضا العملاء." },
            { "en": "Deep understanding of financial compliance and regulatory frameworks.", "ar": "فهم عميق للامتثال المالي والأطر التنظيمية." },
            { "en": "Mentorship of junior bankers and commitment to inclusion.", "ar": "إرشاد المصرفيين المبتدئين والالتزام بالدمج وتكافؤ الفرص." },
            { "en": "CFA (Chartered Financial Analyst) charterholder preferred for senior tracks.", "ar": "يفضل الحصول على شهادة المحلل المالي المعتمد (CFA) للمسارات العليا." }
        ],
        "emiratisation_support": [
            { "en": "JPMorgan UAE National Training Program for finance graduates.", "ar": "برنامج جي بي مورغان لتدريب المواطنين الإماراتيين لخريجي العلوم المالية." },
            { "en": "Active placement in investment banking and global market divisions.", "ar": "توظيف نشط في الخدمات المصرفية الاستثمارية وأقسام الأسواق العالمية." },
            { "en": "Integration with Nafis financial training initiatives.", "ar": "التكامل مع مبادرات التدريب المالي لبرنامج نافس." }
        ]
    },
    {
        "name": "HSBC",
        "industry": "Finance",
        "description": "One of the largest banking and financial services organisations in the world.",
        "website": "https://www.hsbc.ae",
        "slug": "hsbc",
        "overview_en": "One of the largest international banks in the Middle East, facilitating trade and wealth development in the UAE.",
        "overview_ar": "أحد أكبر البنوك الدولية في الشرق الأوسط، يسهل التجارة وتطوير الثروات في دولة الإمارات.",
        "career_path": [
            { "title_en": "Graduate Trainee", "title_ar": "خريج متدرب", "duration_en": "1-2 Years", "duration_ar": "1-2 سنة", "focus_en": "Rotations across retail, commercial, and wealth divisions, learning systems.", "focus_ar": "التناوب بين أقسام التجزئة والخدمات التجارية والثروات، وتعلم الأنظمة." },
            { "title_en": "Relationship Manager", "title_ar": "مدير علاقات العملاء", "duration_en": "2-5 Years", "duration_ar": "2-5 سنوات", "focus_en": "Managing corporate or retail portfolios, product advisory, client satisfaction.", "focus_ar": "إدارة محافظ الشركات أو الأفراد، تقديم المشورة بشأن المنتجات، ورضا العملاء." },
            { "title_en": "Senior Relationship Manager / Team Leader", "title_ar": "كبير مديري العلاقات / قائد فريق", "duration_en": "5-8 Years", "duration_ar": "5-8 سنوات", "focus_en": "Supervising relationship teams, complex transactions, strategic growth.", "focus_ar": "الإشراف على فرق العلاقات، المعاملات المعقدة، والنمو الاستراتيجي." },
            { "title_en": "Director / Country Head", "title_ar": "مدير / رئيس الدولة", "duration_en": "8+ Years", "duration_ar": "8+ سنوات", "focus_en": "Business unit management, regulatory relations, high-value client advisory.", "focus_ar": "إدارة وحدة الأعمال، العلاقات التنظيمية، واستشارات العملاء ذوي الملاءة المالية العالية." }
        ],
        "promotion_criteria": [
            { "en": "Achieving portfolio growth while maintaining strict compliance.", "ar": "تحقيق نمو المحفظة المالية مع الحفاظ على الامتثال الصارم." },
            { "en": "Exhibiting leadership behaviors aligned with HSBC values.", "ar": "إظهار سلوكيات القيادة المتوافقة مع قيم HSBC." },
            { "en": "Successful completion of credit certification and relevant banking credentials.", "ar": "إكمال شهادة الائتمان والمؤهلات المصرفية ذات الصلة بنجاح." },
            { "en": "Active contribution to group digitalization initiatives.", "ar": "المساهمة الفعالة في مبادرات التحول الرقمي للمجموعة." }
        ],
        "emiratisation_support": [
            { "en": "HSBC Emirati Academy for comprehensive career training.", "ar": "أكاديمية HSBC الإماراتية للتدريب المهني الشامل." },
            { "en": "Nafis program sponsorship and pension scheme matching.", "ar": "رعاية برنامج نافس ومطابقة خطة المعاشات التقاعدية." },
            { "en": "Leadership development fast-track for top-performing Emirati nationals.", "ar": "مسار سريع لتطوير القيادة للمواطنين الإماراتيين ذوي الأداء المتميز." }
        ]
    },
    {
        "name": "Shell",
        "industry": "Energy & Sustainability",
        "description": "Global group of energy and petrochemical companies.",
        "website": "https://www.shell.com",
        "slug": "shell",
        "overview_en": "A global group of energy and petrochemical companies, supporting sustainable energy development in the UAE.",
        "overview_ar": "مجموعة عالمية من شركات الطاقة والبتروكيماويات، تدعم تطوير الطاقة المستدامة في دولة الإمارات.",
        "career_path": [
            { "title_en": "Graduate Engineer", "title_ar": "مهندس خريج", "duration_en": "1-3 Years", "duration_ar": "1-3 سنوات", "focus_en": "Technical training, site rotations, safety audits, learning engineering standards.", "focus_ar": "التدريب الفني، التناوب بين المواقع، تدقيق السلامة، وتعلم المعايير الهندسية." },
            { "title_en": "Project Engineer", "title_ar": "مهندس مشروع", "duration_en": "3-6 Years", "duration_ar": "3-6 سنوات", "focus_en": "Executing engineering packages, budget estimation, vendor coordination.", "focus_ar": "تنفيذ الحزم الهندسية، تقدير الميزانية، وتنسيق البائعين." },
            { "title_en": "Senior Engineer / Project Manager", "title_ar": "كبير مهندسين / مدير مشروع", "duration_en": "6-9 Years", "duration_ar": "6-9 سنوات", "focus_en": "Managing multi-disciplinary engineering projects, risk mitigation.", "focus_ar": "إدارة المشاريع الهندسية متعددة التخصصات، والحد من المخاطر." },
            { "title_en": "Engineering Director", "title_ar": "مدير هندسي", "duration_en": "9+ Years", "duration_ar": "9+ سنوات", "focus_en": "Leading asset teams, global technology implementation, safety leadership.", "focus_ar": "قيادة فرق الأصول، تطبيق التكنولوجيا العالمية، وقيادة السلامة." }
        ],
        "promotion_criteria": [
            { "en": "Demonstrated engineering competence according to Shell Professional Standards.", "ar": "إثبات الكفاءة الهندسية وفقاً للمعايير المهنية لشل." },
            { "en": "Zero-accident record and active contribution to safety culture.", "ar": "سجل خالٍ من الحوادث والمساهمة الفعالة في ثقافة السلامة." },
            { "en": "Proven capability in managing capital budgets and delivery timelines.", "ar": "قدرة مثبتة على إدارة الميزانيات الرأسمالية والجداول الزمنية للتسليم." },
            { "en": "Professional Engineering credentials (e.g. Chartered Engineer status).", "ar": "المؤهلات الهندسية المهنية (مثل وضع مهندس معتمد)." }
        ],
        "emiratisation_support": [
            { "en": "Shell UAE graduate trainee schemes with direct global mentors.", "ar": "مخططات تدريب الخريجين من شل الإمارات مع موجهين عالميين مباشرين." },
            { "en": "Collaboration with local universities for research and talent.", "ar": "التعاون مع الجامعات المحلية للبحث وجذب المواهب." },
            { "en": "Alignment with Nafis engineering and technical salary programs.", "ar": "التوافق مع برامج نافس لرواتب التخصصات الهندسية والفنية." }
        ]
    },
    {
        "name": "Pfizer",
        "industry": "Healthcare & Life Sciences",
        "description": "Global pharmaceutical and biopharmaceutical corporation.",
        "website": "https://www.pfizer.com",
        "slug": "pfizer",
        "overview_en": "A leading biopharmaceutical corporation discovering, developing, and manufacturing medicines and vaccines in the UAE.",
        "overview_ar": "شركة رائدة في مجال الأدوية الحيوية، تقوم باكتشاف وتطوير وتصنيع الأدوية واللقاحات في دولة الإمارات.",
        "career_path": [
            { "title_en": "Medical Representative", "title_ar": "مندوب طبي", "duration_en": "1-2 Years", "duration_ar": "1-2 سنة", "focus_en": "Product presentations to healthcare professionals, market feedback.", "focus_ar": "تقديم عروض المنتجات لأخصائيي الرعاية الصحية، وملاحظات السوق." },
            { "title_en": "Key Account Manager", "title_ar": "مدير حسابات رئيسي", "duration_en": "2-4 Years", "duration_ar": "2-4 سنوات", "focus_en": "Managing institutional clients, contract negotiation, sales strategies.", "focus_ar": "إدارة العملاء المؤسسيين، تفاوض العقود، واستراتيجيات المبيعات." },
            { "title_en": "Product Manager / Medical Advisor", "title_ar": "مدير المنتج / مستشار طبي", "duration_en": "4-7 Years", "duration_ar": "4-7 سنوات", "focus_en": "Product lifecycle strategy, clinical trials coordination, marketing.", "focus_ar": "استراتيجية دورة حياة المنتج، تنسيق التجارب السريرية، والتسويق." },
            { "title_en": "Business Unit Director", "title_ar": "مدير وحدة الأعمال", "duration_en": "7+ Years", "duration_ar": "7+ سنوات", "focus_en": "Leading therapeutic areas, budget allocation, strategic market expansion.", "focus_ar": "قيادة المجالات العلاجية، تخصيص الميزانية، والتوسع الاستراتيجي في السوق." }
        ],
        "promotion_criteria": [
            { "en": "Consistently achieving or exceeding pharmaceutical sales and compliance goals.", "ar": "تحقيق أو تجاوز أهداف مبيعات الأدوية والامتثال باستمرار." },
            { "en": "Deep scientific knowledge of Pfizer products and therapeutic sectors.", "ar": "معرفة علمية عميقة بمنتجات فايزر والقطاعات العلاجية." },
            { "en": "Compliance with strict international healthcare marketing regulations.", "ar": "الامتثال للوائح الدولية الصارمة لتسويق الرعاية الصحية." },
            { "en": "Postgraduate credentials (e.g. PharmD, MBA, or PhD in Life Sciences) highly valued.", "ar": "تقدير كبير للمؤهلات العليا (مثل دكتوراه صيدلة، ماجستير إدارة أعمال، أو دكتوراه في علوم الحياة)." }
        ],
        "emiratisation_support": [
            { "en": "Pfizer UAE Medical Academy training programs for local graduates.", "ar": "برنامج تدريب أكاديمية فايزر الطبية في الإمارات للخريجين المحليين." },
            { "en": "Support for Emiratis pursuing research careers in life sciences.", "ar": "دعم الإماراتيين الذين يسعون وراء مهن بحثية في علوم الحياة." },
            { "en": "Salary top-up and training integration via the Nafis framework.", "ar": "تكامل دعم الرواتب والتدريب من خلال إطار نافس." }
        ]
    },
    {
        "name": "Airbus",
        "industry": "Aerospace & Aviation",
        "description": "Global aerospace pioneer designing, manufacturing and delivering aerospace products.",
        "website": "https://www.airbus.com",
        "slug": "airbus",
        "overview_en": "A global pioneer in the aerospace industry, designing, manufacturing and delivering aerospace products in the UAE.",
        "overview_ar": "شركة عالمية رائدة في صناعة الطيران والفضاء، تقوم بتصميم وتصنيع وتقديم منتجات الفضاء في الإمارات.",
        "career_path": [
            { "title_en": "Associate Systems Engineer", "title_ar": "مهندس أنظمة مساعد", "duration_en": "1-3 Years", "duration_ar": "1-3 سنوات", "focus_en": "Assisting in components check, diagnostic tools execution, documentation.", "focus_ar": "المساعدة في فحص المكونات، تشغيل أدوات التشخيص، وتوثيق الأنظمة." },
            { "title_en": "Systems / Flight Test Engineer", "title_ar": "مهندس أنظمة / مهندس اختبار الطيران", "duration_en": "3-6 Years", "duration_ar": "3-6 سنوات", "focus_en": "Designing sub-assemblies, avionics diagnostics, simulation testing.", "focus_ar": "تصميم الأنظمة الفرعية، تشخيص إلكترونيات الطيران، واختبار المحاكاة." },
            { "title_en": "Senior Aerospace Engineer", "title_ar": "كبير مهندسي الطيران والفضاء", "duration_en": "6-9 Years", "duration_ar": "6-9 سنوات", "focus_en": "Leading modification packages, airframe integrity review, team mentorship.", "focus_ar": "قيادة حزم التعديل، مراجعة سلامة هيكل الطائرة، وإرشاد الفريق." },
            { "title_en": "Aeronautics Program Manager", "title_ar": "مدير برنامج الطيران", "duration_en": "9+ Years", "duration_ar": "9+ سنوات", "focus_en": "Managing airline integration contracts, aerospace engineering strategy.", "focus_ar": "إدارة عقود تكامل شركات الطيران، واستراتيجية هندسة الفضاء." }
        ],
        "promotion_criteria": [
            { "en": "Demonstrated engineering precision in aviation and defense contexts.", "ar": "إثبات الدقة الهندسية في سياقات الطيران والدفاع." },
            { "en": "Adherence to strict international civil and military aviation regulations.", "ar": "الالتزام بأنظمة الطيران المدني والعسكري الدولية الصارمة." },
            { "en": "Successful execution of modification programs and cost management.", "ar": "التنفيذ الناجح لبرامج التعديل وإدارة التكاليف." },
            { "en": "Professional licensure and engineering certifications (e.g. EASA standards).", "ar": "الترخيص المهني والشهادات الهندسية (مثل معايير الوكالة الأوروبية لسلامة الطيران EASA)." }
        ],
        "emiratisation_support": [
            { "en": "Airbus UAE Engineering Fellowship for top aerospace students.", "ar": "زمالة إيرباص الإمارات الهندسية لطلاب هندسة الفضاء المتميزين." },
            { "en": "Rotational internships in Toulouse and Hamburg for Emirati graduates.", "ar": "تدريب داخلي بالتناوب في تولوز وهامبورغ للخريجين الإماراتيين." },
            { "en": "Alignment with Nafis technical skills development programs.", "ar": "التوافق مع برامج تطوير المهارات الفنية لبرنامج نافس." }
        ]
    },
    {
        "name": "Marriott",
        "industry": "Tourism & Hospitality",
        "description": "Leading global lodging company.",
        "website": "https://www.marriott.com",
        "slug": "marriott",
        "overview_en": "A leading global lodging company managing a diverse portfolio of hotels and resorts in the UAE.",
        "overview_ar": "شركة إقامة عالمية رائدة تدير محفظة متنوعة من الفنادق والمنتجعات في دولة الإمارات.",
        "career_path": [
            { "title_en": "Management Trainee", "title_ar": "متدرب إداري", "duration_en": "1-2 Years", "duration_ar": "1-2 سنة", "focus_en": "Rotations across front desk, F&B, housekeeping, guest relations.", "focus_ar": "التناوب بين الاستقبال، الأغذية والمشروبات، التدبير المنزلي، وعلاقات الضيوف." },
            { "title_en": "Assistant Department Manager", "title_ar": "مساعد مدير القسم", "duration_en": "2-4 Years", "duration_ar": "2-4 سنوات", "focus_en": "Supervising floor teams, handling guest escalation, schedule planning.", "focus_ar": "الإشراف على فرق العمل، معالجة مشكلات الضيوف، وتخطيط الجداول الزمنية." },
            { "title_en": "Hotel Department Manager", "title_ar": "مدير قسم الفندق", "duration_en": "4-7 Years", "duration_ar": "4-7 سنوات", "focus_en": "Owning department P&L, customer satisfaction scores, quality control.", "focus_ar": "إدارة الأرباح والخسائر للقسم، درجات رضا العملاء، ومراقبة الجودة." },
            { "title_en": "Hotel General Manager / Regional Director", "title_ar": "مدير عام الفندق / مدير إقليمي", "duration_en": "7+ Years", "duration_ar": "7+ سنوات", "focus_en": "Full property management, strategic brand alignment, financial success.", "focus_ar": "إدارة العقار بالكامل، التوافق الاستراتيجي مع العلامة التجارية، والنجاح المالي." }
        ],
        "promotion_criteria": [
            { "en": "Consistently high customer service experience (GSS) scores.", "ar": "درجات رضا عملاء عالية باستمرار (GSS)." },
            { "en": "Demonstrated ability to drive revenue and control labor/operating budgets.", "ar": "القدرة على زيادة الإيرادات والتحكم في الميزانيات التشغيلية والعمالة." },
            { "en": "Active participation in Marriott Leadership Training pathways.", "ar": "المشاركة الفعالة في مسارات تدريب القيادة من ماريوت." },
            { "en": "Bilingual fluency (English & Arabic) highly preferred for UAE leadership.", "ar": "تفضيل ثنائية اللغة (الإنجليزية والعربية) لقيادة العمليات في الإمارات." }
        ],
        "emiratisation_support": [
            { "en": "Marriott UAE National Hospitality Program (Tahseen).", "ar": "برنامج ماريوت للضيافة الوطنية في الإمارات (تحسين)." },
            { "en": "Fast-track to operational leadership for Emirati candidates.", "ar": "مسار سريع للقيادة التشغيلية للمرشحين الإماراتيين." },
            { "en": "Nafis program alignment providing salary support in hospitality.", "ar": "التوافق مع برنامج نافس لتقديم دعم الرواتب في قطاع الضيافة." }
        ]
    }
]

def run_migration():
    logger.info("Connecting to database...")
    try:
        conn = get_db_connection()
        conn.autocommit = False
        cur = conn.cursor()

        # Step 1: Alter companies table
        logger.info("Adding workspace columns to 'companies' table...")
        cur.execute("""
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_enabled BOOLEAN DEFAULT FALSE;
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_slug VARCHAR(100);
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_admin_id VARCHAR(255);
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS provisioned_by VARCHAR(255);
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ;
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_settings JSONB DEFAULT '{}';
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_branding JSONB DEFAULT '{}';
        """)

        cur.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_workspace_slug 
                ON companies(workspace_slug) WHERE workspace_slug IS NOT NULL;
        """)

        # Step 2: Create company_employees table
        logger.info("Creating 'company_employees' table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS company_employees (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(50) DEFAULT 'active',
                job_title VARCHAR(255),
                department VARCHAR(100),
                start_date DATE,
                end_date DATE,
                employment_type VARCHAR(50) DEFAULT 'full_time',
                hired_via VARCHAR(50),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(company_id, user_id)
            );
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_company_employees_company ON company_employees(company_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_company_employees_user ON company_employees(user_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_company_employees_status ON company_employees(status);")

        # Step 3: Create company_resource_assignments table
        logger.info("Creating 'company_resource_assignments' table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS company_resource_assignments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                employee_id UUID NOT NULL REFERENCES company_employees(id) ON DELETE CASCADE,
                assigned_by VARCHAR(255) NOT NULL REFERENCES users(id),
                resource_type VARCHAR(50) NOT NULL,
                resource_id VARCHAR(255),
                resource_name VARCHAR(255) NOT NULL,
                resource_description TEXT,
                status VARCHAR(50) DEFAULT 'assigned',
                priority VARCHAR(20) DEFAULT 'normal',
                due_date DATE,
                started_at TIMESTAMPTZ,
                completed_at TIMESTAMPTZ,
                progress_percentage INTEGER DEFAULT 0,
                notes TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_resource_assignments_company ON company_resource_assignments(company_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_resource_assignments_employee ON company_resource_assignments(employee_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_resource_assignments_type ON company_resource_assignments(resource_type);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_resource_assignments_status ON company_resource_assignments(status);")

        # Step 4: Create company_career_progressions table
        logger.info("Creating 'company_career_progressions' table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS company_career_progressions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id UUID UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
                overview TEXT NOT NULL,
                overview_ar TEXT,
                career_path JSONB NOT NULL,
                promotion_criteria JSONB NOT NULL,
                emiratisation_support JSONB NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # Add trigger safely
        cur.execute("DROP TRIGGER IF EXISTS update_company_career_progressions_updated_at ON company_career_progressions;")
        cur.execute("""
            CREATE TRIGGER update_company_career_progressions_updated_at 
            BEFORE UPDATE ON company_career_progressions 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """)

        conn.commit()
        logger.info("✅ Schema updates applied successfully.")

        # Step 5: Seed target companies and career progressions
        logger.info("Seeding target companies and progressions...")
        for c in SEED_COMPANIES:
            # Check if company exists by name
            cur.execute("SELECT id FROM companies WHERE name ILIKE %s OR company_name ILIKE %s", (c['name'], c['name']))
            row = cur.fetchone()
            if row:
                company_id = row[0]
                logger.info(f"Company '{c['name']}' already exists with ID: {company_id}. Enabling workspace...")
                cur.execute("""
                    UPDATE companies 
                    SET workspace_enabled = TRUE, 
                        workspace_slug = COALESCE(workspace_slug, %s),
                        industry = COALESCE(industry, %s)
                    WHERE id = %s
                """, (c['slug'], c['industry'], company_id))
            else:
                logger.info(f"Inserting new company '{c['name']}'...")
                cur.execute("""
                    INSERT INTO companies (name, company_name, industry, description, website, workspace_enabled, workspace_slug, is_verified)
                    VALUES (%s, %s, %s, %s, %s, TRUE, %s, TRUE)
                    RETURNING id
                """, (c['name'], c['name'], c['industry'], c['description'], c['website'], c['slug']))
                company_id = cur.fetchone()[0]

            # Parse arrays to JSON compatibility
            career_path_json = json.dumps([
                {
                    "title": {"en": x["title_en"], "ar": x["title_ar"]},
                    "duration": {"en": x["duration_en"], "ar": x["duration_ar"]},
                    "focus": {"en": x["focus_en"], "ar": x["focus_ar"]}
                } for x in c["career_path"]
            ])
            promo_json = json.dumps(c["promotion_criteria"])
            emiratisation_json = json.dumps(c["emiratisation_support"])

            # Upsert into company_career_progressions
            cur.execute("""
                INSERT INTO company_career_progressions (company_id, overview, overview_ar, career_path, promotion_criteria, emiratisation_support)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (company_id) DO UPDATE SET
                    overview = EXCLUDED.overview,
                    overview_ar = EXCLUDED.overview_ar,
                    career_path = EXCLUDED.career_path,
                    promotion_criteria = EXCLUDED.promotion_criteria,
                    emiratisation_support = EXCLUDED.emiratisation_support,
                    updated_at = NOW()
            """, (company_id, c['overview_en'], c['overview_ar'], career_path_json, promo_json, emiratisation_json))

        conn.commit()
        logger.info("✅ Seeding complete.")
        cur.close()
        conn.close()
        return True

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        try:
            conn.rollback()
            conn.close()
        except:
            pass
        return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
