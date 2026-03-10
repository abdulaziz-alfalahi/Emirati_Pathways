"""
Seed Community & Mentorship Data
Seeds communities, community_posts, community_events, mentor_profiles, mentorship_programs
"""
import psycopg2
import psycopg2.extras
import json
from datetime import datetime, timedelta

DB_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password'
}

def seed():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # ── 1. communities table ──
    cur.execute("""
        CREATE TABLE IF NOT EXISTS communities (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            name_ar VARCHAR(200),
            description TEXT,
            description_ar TEXT,
            category VARCHAR(100),
            category_ar VARCHAR(100),
            members INTEGER DEFAULT 0,
            posts_count INTEGER DEFAULT 0,
            verified BOOLEAN DEFAULT TRUE,
            avatar VARCHAR(10) DEFAULT '💼',
            tags JSONB DEFAULT '[]',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    cur.execute("SELECT count(*) FROM communities")
    if cur.fetchone()[0] == 0:
        communities = [
            ('UAE Tech Professionals', 'محترفو التكنولوجيا في الإمارات',
             'Connect with 5,000+ tech professionals across the UAE — share insights, job leads, and collaborate on projects.',
             'تواصل مع أكثر من 5,000 محترف تقني في الإمارات — شارك الأفكار وفرص العمل وتعاون في المشاريع.',
             'Technology', 'التكنولوجيا', 5240, 12400, True, '💻',
             json.dumps(['Software', 'Cloud', 'AI'])),
            ('Emirati Women in Leadership', 'المرأة الإماراتية في القيادة',
             'Empowering UAE women in business, government, and STEM — mentoring, networking, and career resources.',
             'تمكين المرأة الإماراتية في الأعمال والحكومة والعلوم — إرشاد وتواصل ومصادر مهنية.',
             'Leadership', 'القيادة', 3180, 8200, True, '👩‍💼',
             json.dumps(['Women', 'Leadership', 'STEM'])),
            ('Dubai Financial Professionals', 'شبكة دبي المالية',
             'Financial professionals in Dubai — banking, investment, fintech, and regulatory updates from DIFC and beyond.',
             'محترفو المالية في دبي — المصارف والاستثمار والتكنولوجيا المالية وتحديثات مركز دبي المالي العالمي.',
             'Finance', 'المالية', 2750, 6800, True, '📈',
             json.dumps(['Finance', 'Banking', 'Fintech'])),
            ('Dubai Innovation Hub', 'مركز دبي للابتكار',
             'Entrepreneurs, innovators, and startup founders building the future of Dubai — events, funding, and collaboration.',
             'رواد الأعمال والمبتكرون ومؤسسو الشركات الناشئة يبنون مستقبل دبي — فعاليات وتمويل وتعاون.',
             'Startups', 'الشركات الناشئة', 4100, 9500, True, '🚀',
             json.dumps(['Startups', 'Innovation', 'Funding'])),
            ('UAE Energy & Sustainability', 'الطاقة والاستدامة في الإمارات',
             'Professionals in oil & gas, renewables, and sustainability — ADNOC, Masdar, and the UAE energy transition.',
             'محترفو النفط والغاز والطاقة المتجددة والاستدامة — أدنوك ومصدر والتحول في قطاع الطاقة الإماراتي.',
             'Energy', 'الطاقة', 1920, 4300, True, '⚡',
             json.dumps(['Energy', 'Sustainability', 'Oil & Gas'])),
            ('UAE Government Careers', 'الوظائف الحكومية في الإمارات',
             'Public sector professionals — career development, government initiatives, Emiratization updates, and policy discussions.',
             'محترفو القطاع العام — التطوير المهني والمبادرات الحكومية وتحديثات التوطين ونقاشات السياسات.',
             'Government', 'الحكومة', 6200, 15800, True, '🏛️',
             json.dumps(['Government', 'Policy', 'Careers'])),
            ('UAE Healthcare Network', 'شبكة الرعاية الصحية الإماراتية',
             'Healthcare professionals — doctors, nurses, administrators sharing best practices and career opportunities across UAE hospitals.',
             'محترفو الرعاية الصحية — أطباء وممرضون ومسؤولون يتبادلون أفضل الممارسات وفرص العمل في مستشفيات الإمارات.',
             'Healthcare', 'الرعاية الصحية', 2100, 5400, True, '🏥',
             json.dumps(['Healthcare', 'Medical', 'Wellness'])),
            ('Abu Dhabi Real Estate Professionals', 'محترفو العقارات في أبوظبي',
             'Real estate developers, brokers, and investors — market insights, project updates, and networking for Abu Dhabi property.',
             'مطورو العقارات والوسطاء والمستثمرون — رؤى السوق وتحديثات المشاريع والتواصل لعقارات أبوظبي.',
             'Real Estate', 'العقارات', 1580, 3200, True, '🏗️',
             json.dumps(['Real Estate', 'Property', 'Investment'])),
        ]
        cur.executemany("""
            INSERT INTO communities (name, name_ar, description, description_ar, category, category_ar,
                                     members, posts_count, verified, avatar, tags)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, communities)
        print(f"  ✅ Seeded {len(communities)} communities")

    # ── 2. community_posts table ──
    cur.execute("""
        CREATE TABLE IF NOT EXISTS community_posts (
            id SERIAL PRIMARY KEY,
            author_name VARCHAR(200) NOT NULL,
            author_name_ar VARCHAR(200),
            author_title VARCHAR(200),
            author_title_ar VARCHAR(200),
            author_company VARCHAR(200),
            author_company_ar VARCHAR(200),
            author_avatar VARCHAR(10) DEFAULT '👤',
            community_name VARCHAR(200),
            community_name_ar VARCHAR(200),
            content TEXT,
            content_ar TEXT,
            likes INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            verified BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    cur.execute("SELECT count(*) FROM community_posts")
    if cur.fetchone()[0] == 0:
        posts = [
            ('Fatima Al Mazrouei', 'فاطمة المزروعي', 'VP Engineering', 'نائب رئيس الهندسة',
             'ADNOC Digital', 'أدنوك الرقمية', '👩‍💼',
             'UAE Tech Professionals', 'محترفو التكنولوجيا في الإمارات',
             "Excited to announce our team is hiring 5 cloud architects! If you have AWS or Azure experience and want to work on Abu Dhabi's digital transformation, DM me. 🚀",
             'يسعدني الإعلان أن فريقنا يوظّف 5 مهندسي سحابة! إن كنت تمتلك خبرة في AWS أو Azure وترغب في العمل على التحول الرقمي في أبوظبي، راسلني. 🚀',
             48, 12, True),
            ('Ahmed Al Dhaheri', 'أحمد الظاهري', 'Director', 'مدير',
             'DIFC Authority', 'سلطة مركز دبي المالي العالمي', '👨‍💼',
             'Dubai Financial Professionals', 'شبكة دبي المالية',
             "Great panel discussion today on UAE fintech regulation. Key takeaway: DIFC's innovation hub is accelerating fintech growth faster than expected.",
             'نقاش ممتاز اليوم حول تنظيم التكنولوجيا المالية في الإمارات. النتيجة الرئيسية: مركز الابتكار في مركز دبي المالي العالمي يسرّع نمو التكنولوجيا المالية أسرع من المتوقع.',
             72, 28, True),
            ('Sara Al Shamsi', 'سارة الشامسي', 'AI Lead', 'رئيسة الذكاء الاصطناعي',
             'Dubai Future Foundation', 'مؤسسة دبي للمستقبل', '👩‍🔬',
             'Dubai Innovation Hub', 'مركز دبي للابتكار',
             'We just published our 2026 AI Readiness Report for the UAE. Key stat: 67% of UAE companies plan to increase AI spending this year.',
             'نشرنا للتو تقرير جاهزية الذكاء الاصطناعي 2026 للإمارات. إحصائية رئيسية: 67% من شركات الإمارات تخطط لزيادة إنفاقها على الذكاء الاصطناعي هذا العام.',
             134, 45, True),
            ('Khalid Al Falasi', 'خالد الفلاسي', 'CTO', 'الرئيس التقني',
             'Emirates Group', 'مجموعة الإمارات', '👨‍✈️',
             'UAE Tech Professionals', 'محترفو التكنولوجيا في الإمارات',
             "Mentoring sessions open for Q2 2026. I'll be focusing on DevOps and cloud migration strategies. First 10 spots go fast — sign up through the mentorship platform.",
             'جلسات الإرشاد مفتوحة للربع الثاني 2026. سأركّز على DevOps واستراتيجيات الانتقال السحابي. أول 10 مقاعد تنفد بسرعة — سجّل عبر منصة الإرشاد.',
             56, 19, True),
            ('Noura Al Kaabi', 'نورة الكعبي', 'Head of Sustainability', 'رئيسة الاستدامة',
             'Masdar', 'مصدر', '👩‍🔬',
             'UAE Energy & Sustainability', 'الطاقة والاستدامة في الإمارات',
             'Proud to share that our latest solar deployment at Mohammed bin Rashid Al Maktoum Solar Park is now operational. 1.2GW clean energy powering 240,000 homes! 🌞',
             'فخورة بمشاركة أن أحدث مشروع طاقة شمسية في مجمع محمد بن راشد آل مكتوم للطاقة الشمسية أصبح الآن تشغيلياً. 1.2 جيجاواط من الطاقة النظيفة تغذي 240,000 منزل! 🌞',
             189, 52, True),
            ('Mohammed Al Hashimi', 'محمد الهاشمي', 'Director of Digital Government', 'مدير الحكومة الرقمية',
             'Telecommunications & Digital Government Regulatory Authority', 'هيئة تنظيم الاتصالات والحكومة الرقمية', '👨‍💼',
             'UAE Government Careers', 'الوظائف الحكومية في الإمارات',
             'New positions open in the UAE Digital Government Strategy 2026. Looking for data analysts, UX designers, and policy advisors. Emiratization-focused roles.',
             'وظائف جديدة مفتوحة في استراتيجية الحكومة الرقمية الإماراتية 2026. نبحث عن محللي بيانات ومصممي تجربة مستخدم ومستشاري سياسات. أدوار مركّزة على التوطين.',
             95, 31, True),
        ]
        cur.executemany("""
            INSERT INTO community_posts (author_name, author_name_ar, author_title, author_title_ar,
                                          author_company, author_company_ar, author_avatar,
                                          community_name, community_name_ar, content, content_ar,
                                          likes, comments, verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, posts)
        print(f"  ✅ Seeded {len(posts)} community posts")

    # ── 3. community_events table ──
    cur.execute("""
        CREATE TABLE IF NOT EXISTS community_events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(300) NOT NULL,
            title_ar VARCHAR(300),
            event_date DATE,
            start_time VARCHAR(50),
            end_time VARCHAR(50),
            location VARCHAR(200),
            location_ar VARCHAR(200),
            event_type VARCHAR(50) DEFAULT 'In-Person',
            attendees INTEGER DEFAULT 0,
            max_attendees INTEGER DEFAULT 500,
            community_name VARCHAR(200),
            community_name_ar VARCHAR(200),
            organizer VARCHAR(200),
            organizer_ar VARCHAR(200),
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    cur.execute("SELECT count(*) FROM community_events")
    if cur.fetchone()[0] == 0:
        events = [
            ('UAE Tech Summit 2026', 'قمة الإمارات التقنية 2026',
             '2026-04-15', '9:00 AM', '5:00 PM',
             'ADNEC, Abu Dhabi', 'أدنيك، أبوظبي', 'In-Person',
             420, 500, 'UAE Tech Professionals', 'محترفو التكنولوجيا في الإمارات',
             'TechConnect UAE', 'TechConnect UAE'),
            ('Women in Leadership Lunch', 'غداء المرأة في القيادة',
             '2026-03-28', '12:00 PM', '2:00 PM',
             'Jumeirah Emirates Towers, Dubai', 'أبراج الإمارات جميرا، دبي', 'In-Person',
             85, 100, 'Emirati Women in Leadership', 'المرأة الإماراتية في القيادة',
             'EWL Committee', 'لجنة المرأة الإماراتية في القيادة'),
            ('Fintech Regulations Webinar', 'ندوة تنظيمات التكنولوجيا المالية',
             '2026-04-05', '2:00 PM', '3:30 PM',
             'Online (Zoom)', 'إلكتروني (Zoom)', 'Online',
             210, 500, 'Dubai Financial Professionals', 'شبكة دبي المالية',
             'DIFC Academy', 'أكاديمية مركز دبي المالي العالمي'),
            ('Startup Pitch Night', 'ليلة عروض الشركات الناشئة',
             '2026-04-10', '6:00 PM', '9:00 PM',
             'Hub71, Abu Dhabi', 'Hub71، أبوظبي', 'Hybrid',
             150, 200, 'Dubai Innovation Hub', 'مركز دبي للابتكار',
             'Hub71', 'Hub71'),
            ('Energy Transition Forum', 'منتدى تحول الطاقة',
             '2026-04-20', '10:00 AM', '4:00 PM',
             'Masdar City, Abu Dhabi', 'مدينة مصدر، أبوظبي', 'In-Person',
             320, 400, 'UAE Energy & Sustainability', 'الطاقة والاستدامة في الإمارات',
             'Masdar Institute', 'معهد مصدر'),
            ('Healthcare Innovation Summit', 'قمة الابتكار في الرعاية الصحية',
             '2026-05-08', '9:00 AM', '3:00 PM',
             'Dubai Health Authority HQ', 'مقر هيئة الصحة بدبي', 'Hybrid',
             180, 250, 'UAE Healthcare Network', 'شبكة الرعاية الصحية الإماراتية',
             'DHA Innovation Lab', 'مختبر الابتكار – هيئة الصحة'),
        ]
        cur.executemany("""
            INSERT INTO community_events (title, title_ar, event_date, start_time, end_time,
                                           location, location_ar, event_type,
                                           attendees, max_attendees, community_name, community_name_ar,
                                           organizer, organizer_ar)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, events)
        print(f"  ✅ Seeded {len(events)} community events")

    # ── 4. mentor_profiles table ──
    # This table already exists but is empty. Let's check the schema and seed it.
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'mentor_profiles' AND table_schema = 'public'
        ORDER BY ordinal_position
    """)
    cols = [r[0] for r in cur.fetchall()]

    # Drop and recreate with our known schema for simplicity
    if not cols or 'expertise_areas' not in cols:
        cur.execute("DROP TABLE IF EXISTS mentor_profiles CASCADE")
        cur.execute("""
            CREATE TABLE mentor_profiles (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(200) NOT NULL,
                full_name_ar VARCHAR(200),
                title VARCHAR(300),
                title_ar VARCHAR(300),
                company VARCHAR(200),
                company_ar VARCHAR(200),
                expertise_areas JSONB DEFAULT '[]',
                expertise_areas_ar JSONB DEFAULT '[]',
                rating NUMERIC(3,1) DEFAULT 0.0,
                total_sessions INTEGER DEFAULT 0,
                location VARCHAR(100) DEFAULT 'Dubai',
                location_ar VARCHAR(100) DEFAULT 'دبي',
                available BOOLEAN DEFAULT TRUE,
                avatar VARCHAR(10) DEFAULT '👤',
                is_uae_national BOOLEAN DEFAULT TRUE,
                years_experience INTEGER DEFAULT 5,
                bio TEXT,
                bio_ar TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("  ✅ Recreated mentor_profiles table")

    cur.execute("SELECT count(*) FROM mentor_profiles")
    if cur.fetchone()[0] == 0:
        mentors = [
            ('Dr. Fatima Al Mazrouei', 'د. فاطمة المزروعي',
             'VP of Engineering, DEWA Digital', 'نائبة رئيس الهندسة، ديوا الرقمية',
             'DEWA Digital', 'ديوا الرقمية',
             json.dumps(['Cloud Architecture', 'Team Leadership', 'Energy Tech']),
             json.dumps(['هندسة السحابة', 'قيادة الفرق', 'تكنولوجيا الطاقة']),
             4.9, 124, 'Dubai', 'دبي', True, '👩‍💼', True, 15,
             'Leading digital transformation at DEWA with 15+ years in energy tech.',
             'قيادة التحول الرقمي في ديوا بخبرة تزيد عن 15 عاماً في تقنية الطاقة.'),
            ('Ahmed Al Dhaheri', 'أحمد الظاهري',
             'Director of Innovation, Dubai Holding', 'مدير الابتكار، دبي القابضة',
             'Dubai Holding', 'دبي القابضة',
             json.dumps(['Investment Strategy', 'Fintech', 'Startup Growth']),
             json.dumps(['استراتيجية الاستثمار', 'التكنولوجيا المالية', 'نمو الشركات الناشئة']),
             4.8, 98, 'Dubai', 'دبي', True, '👨‍💼', True, 12,
             'Innovation leader with expertise in fintech and venture capital.',
             'قائد ابتكار ذو خبرة في التكنولوجيا المالية ورأس المال الجريء.'),
            ('Sara Al Shamsi', 'سارة الشامسي',
             'Head of AI, Dubai Future Foundation', 'رئيسة الذكاء الاصطناعي، مؤسسة دبي للمستقبل',
             'Dubai Future Foundation', 'مؤسسة دبي للمستقبل',
             json.dumps(['Artificial Intelligence', 'Data Science', 'Research']),
             json.dumps(['الذكاء الاصطناعي', 'علم البيانات', 'البحث العلمي']),
             4.9, 156, 'Dubai', 'دبي', False, '👩‍🔬', True, 10,
             'AI researcher driving national AI strategy and talent development.',
             'باحثة ذكاء اصطناعي تقود الاستراتيجية الوطنية للذكاء الاصطناعي وتطوير المواهب.'),
            ('Khalid Al Falasi', 'خالد الفلاسي',
             'CTO, Emirates Airlines Group', 'كبير مسؤولي التكنولوجيا، مجموعة الإمارات',
             'Emirates Airlines', 'طيران الإمارات',
             json.dumps(['Aviation Tech', 'Digital Transformation', 'DevOps']),
             json.dumps(['تكنولوجيا الطيران', 'التحول الرقمي', 'DevOps']),
             4.7, 78, 'Dubai', 'دبي', True, '👨‍✈️', True, 18,
             'Technology leader transforming aviation through cloud-native architecture.',
             'قائد تقني يحوّل قطاع الطيران عبر البنية السحابية.'),
            ('Mariam Al Ketbi', 'مريم الكتبي',
             'CEO, Dubai Smart Solutions', 'الرئيسة التنفيذية، حلول دبي الذكية',
             'Dubai Smart Solutions', 'حلول دبي الذكية',
             json.dumps(['Smart Cities', 'IoT', 'Project Management']),
             json.dumps(['المدن الذكية', 'إنترنت الأشياء', 'إدارة المشاريع']),
             4.8, 112, 'Dubai', 'دبي', True, '👩‍💻', True, 14,
             'Building smart city platforms for Dubai with focus on citizen wellbeing.',
             'بناء منصات المدن الذكية لدبي مع التركيز على رفاهية المواطنين.'),
            ('Omar Al Suwaidi', 'عمر السويدي',
             'Partner, PwC Middle East', 'شريك، PwC الشرق الأوسط',
             'PwC Middle East', 'PwC الشرق الأوسط',
             json.dumps(['Management Consulting', 'Finance', 'Strategy']),
             json.dumps(['الاستشارات الإدارية', 'المالية', 'الاستراتيجية']),
             4.6, 64, 'Abu Dhabi', 'أبوظبي', True, '🧑‍💼', True, 20,
             'Senior partner advising major UAE corporates on growth strategy.',
             'شريك أول يستشير كبرى الشركات الإماراتية بشأن استراتيجيات النمو.'),
            ('Dr. Aisha Al Muhairi', 'د. عائشة المهيري',
             'Chief Medical Officer, Cleveland Clinic Abu Dhabi', 'كبيرة المسؤولين الطبيين، كليفلاند كلينك أبوظبي',
             'Cleveland Clinic Abu Dhabi', 'كليفلاند كلينك أبوظبي',
             json.dumps(['Healthcare Leadership', 'Clinical Research', 'Health Policy']),
             json.dumps(['القيادة الصحية', 'البحث السريري', 'السياسة الصحية']),
             4.9, 89, 'Abu Dhabi', 'أبوظبي', True, '👩‍⚕️', True, 22,
             'Pioneering healthcare innovation at one of the world\'s top hospitals.',
             'ريادة الابتكار الصحي في أحد أفضل المستشفيات في العالم.'),
            ('Sultan Al Neyadi', 'سلطان النيادي',
             'Director of Cybersecurity, Abu Dhabi Digital Authority', 'مدير الأمن السيبراني، هيئة أبوظبي الرقمية',
             'Abu Dhabi Digital Authority', 'هيئة أبوظبي الرقمية',
             json.dumps(['Cybersecurity', 'Risk Management', 'Government IT']),
             json.dumps(['الأمن السيبراني', 'إدارة المخاطر', 'تقنية المعلومات الحكومية']),
             4.7, 71, 'Abu Dhabi', 'أبوظبي', True, '🛡️', True, 16,
             'Protecting critical national infrastructure with advanced cyber defense.',
             'حماية البنية التحتية الوطنية الحيوية بالدفاع السيبراني المتقدم.'),
            ('Layla Al Qassim', 'ليلى القاسم',
             'Head of People & Culture, Careem', 'رئيسة الموارد البشرية والثقافة، كريم',
             'Careem', 'كريم',
             json.dumps(['HR Leadership', 'Talent Development', 'Culture Building']),
             json.dumps(['القيادة في الموارد البشرية', 'تطوير المواهب', 'بناء الثقافة']),
             4.8, 93, 'Dubai', 'دبي', True, '👩‍💼', True, 11,
             'Building high-performance teams and developing UAE talent at scale.',
             'بناء فرق عالية الأداء وتطوير المواهب الإماراتية على نطاق واسع.'),
            ('Rashid Al Maktoum', 'راشد المكتوم',
             'VP of Sustainability, Masdar', 'نائب رئيس الاستدامة، مصدر',
             'Masdar', 'مصدر',
             json.dumps(['Renewable Energy', 'Sustainability', 'ESG Strategy']),
             json.dumps(['الطاقة المتجددة', 'الاستدامة', 'استراتيجية ESG']),
             4.7, 85, 'Abu Dhabi', 'أبوظبي', True, '🌱', True, 13,
             'Driving the UAE clean energy transition through innovative solutions.',
             'دفع تحول الطاقة النظيفة في الإمارات عبر حلول مبتكرة.'),
        ]
        cur.executemany("""
            INSERT INTO mentor_profiles (full_name, full_name_ar, title, title_ar, company, company_ar,
                                          expertise_areas, expertise_areas_ar, rating, total_sessions,
                                          location, location_ar, available, avatar, is_uae_national,
                                          years_experience, bio, bio_ar)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, mentors)
        print(f"  ✅ Seeded {len(mentors)} mentor profiles")

    # ── 5. mentorship_programs table ──
    cur.execute("DROP TABLE IF EXISTS mentorship_programs CASCADE")
    cur.execute("""
        CREATE TABLE mentorship_programs (
            id SERIAL PRIMARY KEY,
            name VARCHAR(300) NOT NULL,
            name_ar VARCHAR(300),
            description TEXT,
            description_ar TEXT,
            duration_months INTEGER DEFAULT 3,
            max_mentees INTEGER DEFAULT 20,
            current_mentees INTEGER DEFAULT 0,
            focus_areas JSONB DEFAULT '[]',
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    programs = [
        ('UAE Tech Leaders Program', 'برنامج قادة التكنولوجيا في الإمارات',
         'A 6-month mentorship pairing emerging Emirati tech talent with senior CTOs and VPs from top UAE companies.',
         'برنامج إرشاد لمدة 6 أشهر يجمع المواهب التقنية الإماراتية الناشئة مع كبار مسؤولي التكنولوجيا.',
         6, 30, 22, json.dumps(['Technology', 'Cloud', 'AI']), 'active'),
        ('Women in STEM Leadership', 'المرأة في قيادة العلوم والتقنية',
         'Empower Emirati women pursuing STEM careers through one-on-one mentoring, skill workshops, and networking.',
         'تمكين المرأة الإماراتية في مسيرات العلوم والتقنية من خلال الإرشاد الفردي وورش المهارات والتواصل.',
         4, 20, 15, json.dumps(['STEM', 'Leadership', 'Career Growth']), 'active'),
        ('Finance & Fintech Accelerator', 'مسرّع المالية والتكنولوجيا المالية',
         'Connect aspiring finance professionals with leaders from DIFC, ADGM, and top UAE banks for career guidance.',
         'ربط المحترفين الطموحين في المالية بقادة من مركز دبي المالي وسوق أبوظبي المالي وبنوك الإمارات الرائدة.',
         3, 25, 18, json.dumps(['Finance', 'Fintech', 'Banking']), 'active'),
        ('Government Digital Transformation', 'التحول الرقمي الحكومي',
         'Preparing public sector professionals for digital-first government services through expert mentorship.',
         'إعداد محترفي القطاع العام للخدمات الحكومية الرقمية من خلال إرشاد الخبراء.',
         3, 20, 12, json.dumps(['Government', 'Digital', 'Policy']), 'active'),
    ]
    cur.executemany("""
        INSERT INTO mentorship_programs (name, name_ar, description, description_ar,
                                          duration_months, max_mentees, current_mentees, focus_areas, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, programs)
    print(f"  ✅ Seeded {len(programs)} mentorship programs")

    conn.commit()
    cur.close()
    conn.close()
    print("\n✅ Community & Mentorship seeding complete!")

if __name__ == '__main__':
    seed()
