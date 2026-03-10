"""Seed lifelong engagement tables — National Service, Thought Leadership, Success Stories, Retiree."""
import psycopg2, os
from dotenv import load_dotenv
load_dotenv()

def conn():
    return psycopg2.connect(
        host=os.getenv('DB_HOST','127.0.0.1'), port=os.getenv('DB_PORT','5432'),
        dbname=os.getenv('DB_NAME','emirati_journey'), user=os.getenv('DB_USER','emirati_user'),
        password=os.getenv('DB_PASSWORD','emirati_secure_password'))

DDL = """
-- National Service
CREATE TABLE IF NOT EXISTS ns_programs (
  id SERIAL PRIMARY KEY, title_en TEXT, title_ar TEXT, org_en TEXT, org_ar TEXT,
  duration_en TEXT, duration_ar TEXT, icon TEXT, status_key TEXT,
  status_label_en TEXT, status_label_ar TEXT, spots INT,
  desc_en TEXT, desc_ar TEXT, tags_en TEXT[], tags_ar TEXT[],
  highlights_en TEXT[], highlights_ar TEXT[]);

CREATE TABLE IF NOT EXISTS ns_sustainability_opportunities (
  id SERIAL PRIMARY KEY, title_en TEXT, title_ar TEXT, location_en TEXT, location_ar TEXT,
  org_en TEXT, org_ar TEXT, type_en TEXT, type_ar TEXT, sector_en TEXT, sector_ar TEXT,
  desc_en TEXT, desc_ar TEXT);

CREATE TABLE IF NOT EXISTS ns_partners (
  id SERIAL PRIMARY KEY, name_en TEXT, name_ar TEXT, role_en TEXT, role_ar TEXT, logo TEXT);

CREATE TABLE IF NOT EXISTS ns_milestones (
  id SERIAL PRIMARY KEY, event_en TEXT, event_ar TEXT, detail_en TEXT, detail_ar TEXT, date TEXT);

CREATE TABLE IF NOT EXISTS ns_sustainability_impact (
  id SERIAL PRIMARY KEY, value_en TEXT, value_ar TEXT, label_en TEXT, label_ar TEXT, icon TEXT);

CREATE TABLE IF NOT EXISTS ns_enrolment_steps (
  id SERIAL PRIMARY KEY, step INT, title_en TEXT, title_ar TEXT, desc_en TEXT, desc_ar TEXT);

-- Thought Leadership
CREATE TABLE IF NOT EXISTS tl_leaders (
  id SERIAL PRIMARY KEY, leader_id TEXT UNIQUE, name_en TEXT, name_ar TEXT,
  title_en TEXT, title_ar TEXT, era TEXT, role_en TEXT, role_ar TEXT, avatar TEXT,
  theme_bg TEXT, theme_accent TEXT, theme_light TEXT, bio_en TEXT, bio_ar TEXT);

CREATE TABLE IF NOT EXISTS tl_books (
  id SERIAL PRIMARY KEY, leader_id INT REFERENCES tl_leaders(id),
  title_en TEXT, title_ar TEXT, author_en TEXT, author_ar TEXT, year TEXT,
  desc_en TEXT, desc_ar TEXT);

CREATE TABLE IF NOT EXISTS tl_speeches (
  id SERIAL PRIMARY KEY, leader_id INT REFERENCES tl_leaders(id),
  title_en TEXT, title_ar TEXT, quote_en TEXT, quote_ar TEXT);

-- Success Stories
CREATE TABLE IF NOT EXISTS success_stories (
  id SERIAL PRIMARY KEY, name_en TEXT, name_ar TEXT, role_en TEXT, role_ar TEXT,
  prev_role_en TEXT, prev_role_ar TEXT, company_en TEXT, company_ar TEXT,
  sector_en TEXT, sector_ar TEXT, location_en TEXT, location_ar TEXT,
  avatar TEXT, theme_bg TEXT, theme_accent TEXT, theme_light TEXT,
  story_en TEXT, story_ar TEXT, quote_en TEXT, quote_ar TEXT);

CREATE TABLE IF NOT EXISTS ss_highlights (
  id SERIAL PRIMARY KEY, story_id INT REFERENCES success_stories(id),
  highlight_en TEXT, highlight_ar TEXT);

CREATE TABLE IF NOT EXISTS ss_sectors (
  id SERIAL PRIMARY KEY, sector_en TEXT, sector_ar TEXT, count INT, icon TEXT,
  color TEXT, color_text TEXT);

-- Retiree
CREATE TABLE IF NOT EXISTS ret_pension_benefits (
  id SERIAL PRIMARY KEY, title_en TEXT, title_ar TEXT, desc_en TEXT, desc_ar TEXT,
  icon TEXT, provider_en TEXT, provider_ar TEXT);

CREATE TABLE IF NOT EXISTS ret_pension_details (
  id SERIAL PRIMARY KEY, benefit_id INT REFERENCES ret_pension_benefits(id),
  detail_en TEXT, detail_ar TEXT);

CREATE TABLE IF NOT EXISTS ret_healthcare (
  id SERIAL PRIMARY KEY, title_en TEXT, title_ar TEXT, provider_en TEXT, provider_ar TEXT,
  desc_en TEXT, desc_ar TEXT, coverage_en TEXT, coverage_ar TEXT, icon TEXT);

CREATE TABLE IF NOT EXISTS ret_engagement (
  id SERIAL PRIMARY KEY, title_en TEXT, title_ar TEXT, org_en TEXT, org_ar TEXT,
  type_en TEXT, type_ar TEXT, desc_en TEXT, desc_ar TEXT,
  commitment_en TEXT, commitment_ar TEXT, spots INT);

CREATE TABLE IF NOT EXISTS ret_lifestyle_perks (
  id SERIAL PRIMARY KEY, icon TEXT, title_en TEXT, title_ar TEXT,
  desc_en TEXT, desc_ar TEXT, category_en TEXT, category_ar TEXT);

CREATE TABLE IF NOT EXISTS ret_service_centres (
  id SERIAL PRIMARY KEY, city_en TEXT, city_ar TEXT, location_en TEXT, location_ar TEXT, phone TEXT);
"""

def seed():
    c = conn(); cur = c.cursor()
    cur.execute(DDL)

    # NS Programs (6)
    cur.execute("DELETE FROM ns_programs")
    progs = [
      ('Alternative National Service — Sustainability Track','الخدمة الوطنية البديلة — مسار الاستدامة','NSRA + Emirati Pathways','هيئة الخدمة الوطنية + المسارات الإماراتية','12 months','12 شهراً','🌱','Enrolling','Enrolling','التسجيل مفتوح',120,'Serve your nation through sustainability — work placements in renewable energy, environmental conservation, and green infrastructure projects across all Emirates.','اخدم وطنك من خلال الاستدامة — توظيف عملي في الطاقة المتجددة والحفاظ على البيئة ومشاريع البنية التحتية الخضراء في جميع الإمارات.','{Sustainability,\"Green Energy\",Conservation}','{الاستدامة,\"الطاقة الخضراء\",\"الحفاظ على البيئة\"}','{\"Government entity placements\",\"Sustainability certification\",\"Career pathway into green sector\"}','{\"توظيف في الجهات الحكومية\",\"شهادة الاستدامة\",\"مسار مهني في القطاع الأخضر\"}'),
      ('Al Nokhba Programme','برنامج النخبة','NSRA + University of Dubai','هيئة الخدمة الوطنية + جامعة دبي','24 months','24 شهراً','🎓','Open','Open','مفتوح',80,'Elite academic programme combining national service with advanced STEM education.','برنامج أكاديمي نخبوي يجمع بين الخدمة الوطنية والتعليم المتقدم في العلوم والتكنولوجيا.','{STEM,Research,University}','{\"العلوم والتكنولوجيا\",\"البحث العلمي\",الجامعة}','{\"Advanced degree pathway\",\"Research opportunities\",\"Industry partnerships\"}','{\"مسار الدرجة المتقدمة\",\"فرص بحثية\",\"شراكات قطاعية\"}'),
      ('Data Science & Engineering Track','مسار علم البيانات والهندسة','NSRA + Dubai Statistics Centre','هيئة الخدمة الوطنية + مركز دبي للإحصاء','9 months','9 أشهر','📊','Open','Open','مفتوح',60,'Develop national talent in data science and data engineering through hands-on training.','تطوير المواهب الوطنية في علم البيانات وهندسة البيانات من خلال التدريب العملي.','{\"Data Science\",Analytics,\"Government Data\"}','{\"علم البيانات\",التحليلات,\"البيانات الحكومية\"}','{\"Python & R training\",\"Real-world datasets\",\"Placement opportunity\"}','{\"تدريب على Python و R\",\"مجموعات بيانات واقعية\",\"فرصة توظيف\"}'),
      ('Emergency & Crisis Management Service','خدمة إدارة الطوارئ والأزمات','NSRA + Dubai Emergency Management','هيئة الخدمة الوطنية + إدارة الطوارئ في دبي','12 months','12 شهراً','🛡️','Open','Open','مفتوح',100,'Alternative national service recruits deployed to emergency management centres.','نشر مجندي الخدمة الوطنية البديلة في مراكز إدارة الطوارئ.','{\"Crisis Management\",\"Climate Resilience\",\"Civil Defence\"}','{\"إدارة الأزمات\",\"المرونة المناخية\",\"الدفاع المدني\"}','{\"Emergency response certification\",\"Climate resilience training\",\"Government career track\"}','{\"شهادة الاستجابة للطوارئ\",\"تدريب المرونة المناخية\",\"مسار مهني حكومي\"}'),
      ('Special Education Teaching Programme','برنامج تعليم ذوي الاحتياجات الخاصة','NSRA + Zayed Higher Organization','هيئة الخدمة الوطنية + مؤسسة زايد العليا','18 months','18 شهراً','📚','Enrolling','Enrolling','التسجيل مفتوح',40,'Recruit UAE Nationals into special educational needs teaching roles.','توظيف المواطنين الإماراتيين في أدوار تعليم ذوي الاحتياجات الخاصة.','{Education,\"Special Needs\",Teaching}','{التعليم,\"ذوي الاحتياجات\",التدريس}','{\"Teaching qualification\",\"ZHO mentorship\",\"Permanent career pathway\"}','{\"مؤهل تدريسي\",\"إرشاد مؤسسة زايد العليا\",\"مسار مهني دائم\"}'),
      ('Renewable Energy Field Operations','عمليات الطاقة المتجددة الميدانية','NSRA + DEWA Clean Energy','هيئة الخدمة الوطنية + ديوا للطاقة النظيفة','12 months','12 شهراً','⚡','Open','Open','مفتوح',50,'Field-based sustainability service at solar and wind farms.','خدمة استدامة ميدانية في مزارع الطاقة الشمسية والرياح.','{Solar,Wind,Hydrogen}','{\"الطاقة الشمسية\",الرياح,الهيدروجين}','{\"Field placement\",\"Technical certifications\",\"Clean energy career pathway\"}','{\"توظيف ميداني\",\"شهادات تقنية\",\"مسار مهني في الطاقة النظيفة\"}'),
    ]
    for p in progs:
        cur.execute("INSERT INTO ns_programs (title_en,title_ar,org_en,org_ar,duration_en,duration_ar,icon,status_key,status_label_en,status_label_ar,spots,desc_en,desc_ar,tags_en,tags_ar,highlights_en,highlights_ar) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", p)

    # NS Sustainability Opportunities (6)
    cur.execute("DELETE FROM ns_sustainability_opportunities")
    opps = [
      ('Marine Conservation Officer','مسؤول الحفاظ على البيئة البحرية','Dubai Coastline','ساحل دبي','Dubai Municipality Environment Dept','بلدية دبي - إدارة البيئة','Full-time','دوام كامل','Conservation','الحفاظ على البيئة','Protect coral reefs and marine ecosystems along the UAE coastline.','حماية الشعاب المرجانية والأنظمة البيئية البحرية على طول ساحل الإمارات.'),
      ('Solar Farm Operations Technician','فني عمليات المزارع الشمسية','Mohammed bin Rashid Solar Park','مجمع محمد بن راشد للطاقة الشمسية','DEWA Clean Energy','ديوا للطاقة النظيفة','Full-time','دوام كامل','Renewable Energy','الطاقة المتجددة','Maintain and operate solar PV systems at one of the worlds largest solar parks.','صيانة وتشغيل أنظمة الطاقة الشمسية في أحد أكبر مجمعات الطاقة الشمسية في العالم.'),
      ('Sustainability Data Analyst','محلل بيانات الاستدامة','Dubai / Remote','دبي / عن بُعد','Dubai Statistics Centre','مركز دبي للإحصاء','Full-time','دوام كامل','Data & Analytics','البيانات والتحليلات','Analyse environmental and sustainability data for government reporting.','تحليل بيانات البيئة والاستدامة للتقارير الحكومية.'),
      ('Green Building Inspector','مفتش المباني الخضراء','Dubai','دبي','Dubai Municipality','بلدية دبي','Full-time','دوام كامل','Built Environment','البيئة المبنية','Inspect and certify buildings for sustainability standards.','فحص واعتماد المباني وفقاً لمعايير الاستدامة.'),
      ('Climate Resilience Planner','مخطط المرونة المناخية','All Emirates','جميع الإمارات','Ministry of Climate Change','وزارة التغير المناخي','Full-time','دوام كامل','Climate Policy','سياسة المناخ','Work on UAEs National Climate Change Plan.','العمل على الخطة الوطنية للتغير المناخي.'),
      ('Mangrove Restoration Coordinator','منسق استعادة أشجار القرم','Dubai / Umm Al Quwain','دبي / أم القيوين','Mangrove Initiative','مبادرة أشجار القرم','Contract','عقد','Ecosystem Restoration','استعادة النظام البيئي','Lead planting and monitoring of 100 million mangrove trees.','قيادة زراعة ومراقبة 100 مليون شجرة قرم.'),
    ]
    for o in opps:
        cur.execute("INSERT INTO ns_sustainability_opportunities (title_en,title_ar,location_en,location_ar,org_en,org_ar,type_en,type_ar,sector_en,sector_ar,desc_en,desc_ar) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", o)

    # NS Partners (6)
    cur.execute("DELETE FROM ns_partners")
    partners = [
      ('University of Dubai','جامعة دبي','Al Nokhba Programme — STEM education track','برنامج النخبة — مسار تعليم العلوم والتكنولوجيا','🏛️'),
      ('Dubai Statistics Centre','مركز دبي للإحصاء','Data science & data engineering training','تدريب علم البيانات وهندسة البيانات','📈'),
      ('DEWA Clean Energy','ديوا للطاقة النظيفة','Renewable energy field placements','توظيف ميداني في الطاقة المتجددة','⚡'),
      ('Zayed Higher Organization','مؤسسة زايد العليا','Special education teaching recruitment','توظيف تعليم ذوي الاحتياجات الخاصة','📖'),
      ('Dubai Emergency Management','إدارة الطوارئ في دبي','Emergency management service placements','توظيف في خدمة إدارة الطوارئ','🛡️'),
      ('Dubai Municipality Environment Dept','بلدية دبي - إدارة البيئة','Marine conservation & environmental protection','الحفاظ على البيئة البحرية وحماية البيئة','🐬'),
    ]
    for p in partners:
        cur.execute("INSERT INTO ns_partners (name_en,name_ar,role_en,role_ar,logo) VALUES (%s,%s,%s,%s,%s)", p)

    # NS Milestones (5)
    cur.execute("DELETE FROM ns_milestones")
    miles = [
      ('Graduation of 18th Cohort of UAE National Service Programme','تخريج الدفعة الـ 18 من برنامج الخدمة الوطنية الإماراتي','Attended by H.H. Sheikh Mohammed bin Rashid','بحضور صاحب السمو الشيخ محمد بن راشد','2025'),
      ('5th Cohort of Al Nokhba Programme Graduation','تخريج الدفعة الخامسة من برنامج النخبة','Advanced STEM graduates entering government and private sector','خريجون متقدمون في العلوم والتكنولوجيا ينضمون للقطاعين الحكومي والخاص','2025'),
      ('Dubai Statistics Centre–NSRA MOU for Data Science Training','مذكرة تفاهم بين مركز دبي للإحصاء وهيئة الخدمة الوطنية لتدريب علم البيانات','Statistical training programme for Alternative National Service recruits','برنامج تدريب إحصائي لمجندي الخدمة الوطنية البديلة','2024'),
      ('4th Batch of Alternative National Service deployed','نشر الدفعة الرابعة من الخدمة الوطنية البديلة في الجهات الحكومية','Emergency management centre placements','توظيف في مراكز إدارة الطوارئ','2024'),
      ('ZHO–NSRA Special Education Teaching Programme Launched','إطلاق برنامج تعليم ذوي الاحتياجات الخاصة','Recruiting Nationals into special educational needs teaching roles','توظيف المواطنين في أدوار تعليم ذوي الاحتياجات الخاصة','2024'),
    ]
    for m in miles:
        cur.execute("INSERT INTO ns_milestones (event_en,event_ar,detail_en,detail_ar,date) VALUES (%s,%s,%s,%s,%s)", m)

    # NS Sustainability Impact (4)
    cur.execute("DELETE FROM ns_sustainability_impact")
    for i in [('50,000+','50,000+','Trees Planted','شجرة مزروعة','🌳'),('2,500 tons','2,500 طن','Waste Collected','نفايات مُجمّعة','♻️'),('15 MW','15 ميغاواط','Solar Capacity Added','سعة شمسية مضافة','☀️'),('500 km','500 كم','Coastline Protected','ساحل محمي','🐬')]:
        cur.execute("INSERT INTO ns_sustainability_impact (value_en,value_ar,label_en,label_ar,icon) VALUES (%s,%s,%s,%s,%s)", i)

    # NS Enrolment Steps (4)
    cur.execute("DELETE FROM ns_enrolment_steps")
    for s in [(1,'Register via NSRA','التسجيل عبر هيئة الخدمة الوطنية','Complete your national service registration through official NSRA channels','أكمل تسجيلك في الخدمة الوطنية عبر القنوات الرسمية'),(2,'Choose Your Track','اختر مسارك','Select from military, sustainability, academic, or community service tracks','اختر من المسارات العسكرية أو الاستدامة أو الأكاديمية'),(3,'Complete Training','أكمل التدريب','Attend orientation and track-specific training programme','احضر التوجيه وبرنامج التدريب الخاص بالمسار'),(4,'Begin Service','ابدأ الخدمة','Start your placement and build skills for your future career','ابدأ توظيفك وابنِ المهارات لمستقبلك المهني')]:
        cur.execute("INSERT INTO ns_enrolment_steps (step,title_en,title_ar,desc_en,desc_ar) VALUES (%s,%s,%s,%s,%s)", s)

    c.commit(); print("✅ National Service seeded")

    # ── Thought Leadership ──
    cur.execute("DELETE FROM tl_speeches"); cur.execute("DELETE FROM tl_books"); cur.execute("DELETE FROM tl_leaders")
    leaders_data = [
      ('zayed','Sheikh Zayed bin Sultan Al Nahyan','الشيخ زايد بن سلطان آل نهيان','Founder of the UAE (1918–2004)','مؤسس الإمارات (1918–2004)','1971–2004','Founding Father & First President','الأب المؤسس والرئيس الأول','🏛️','#FFF7ED','#EA580C','#FFEDD5','The visionary who transformed seven desert emirates into a unified, modern nation.','الرؤيوي الذي حوّل سبع إمارات صحراوية إلى أمة موحدة وحديثة.'),
      ('rashid','Sheikh Rashid bin Saeed Al Maktoum','الشيخ راشد بن سعيد آل مكتوم','Builder of Dubai (1912–1990)','باني دبي (1912–1990)','1958–1990','Ruler of Dubai & UAE Vice President','حاكم دبي ونائب رئيس الدولة','🌆','#EFF6FF','#2563EB','#DBEAFE','The visionary trader who transformed Dubai from a small fishing village into a global trade hub.','التاجر الرؤيوي الذي حوّل دبي من قرية صيد صغيرة إلى مركز تجاري عالمي.'),
      ('mbz','Sheikh Mohamed bin Zayed Al Nahyan','الشيخ محمد بن زايد آل نهيان','President of the UAE','رئيس دولة الإمارات','2022–Present','President of the UAE & Ruler of Abu Dhabi','رئيس الدولة وحاكم أبوظبي','🇦🇪','#F0FDF4','#16A34A','#DCFCE7','Continuing his fathers legacy, steering the UAE toward energy diversification and advanced technology.','استكمالاً لإرث والده، قاد الإمارات نحو تنويع الطاقة والتكنولوجيا المتقدمة.'),
      ('mbr','Sheikh Mohammed bin Rashid Al Maktoum','الشيخ محمد بن راشد آل مكتوم','Vice President & Prime Minister of the UAE','نائب رئيس الدولة ورئيس مجلس الوزراء','2006–Present','Vice President, Prime Minister & Ruler of Dubai','نائب رئيس الدولة ورئيس مجلس الوزراء وحاكم دبي','🏙️','#FAF5FF','#9333EA','#F3E8FF','The driving force behind Dubais global brand, a prolific author, poet, and reformer.','القوة الدافعة وراء العلامة العالمية لدبي، مؤلف غزير الإنتاج وشاعر ومصلح.'),
    ]
    leader_ids = {}
    for ld in leaders_data:
        cur.execute("INSERT INTO tl_leaders (leader_id,name_en,name_ar,title_en,title_ar,era,role_en,role_ar,avatar,theme_bg,theme_accent,theme_light,bio_en,bio_ar) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id", ld)
        leader_ids[ld[0]] = cur.fetchone()[0]

    # Books for each leader (3 each, 5 for mbr)
    books = {
      'zayed': [('Zayed: From Challenges to Union','زايد: من التحديات إلى الاتحاد','Compiled by National Archives','إعداد الأرشيف الوطني','2005','The definitive account of his journey from tribal leader to founding a modern nation-state.','السرد الشامل لرحلته من زعيم قبلي إلى مؤسس دولة حديثة.'),('The Sayings of Sheikh Zayed','أقوال الشيخ زايد','National Archives','الأرشيف الوطني','2004','A collection of his most impactful quotes.','مجموعة من أكثر أقواله تأثيراً.'),('Zayed and the Environment','زايد والبيئة','Zayed International Foundation','مؤسسة زايد الدولية','2006','His pioneering environmental vision.','رؤيته البيئية الرائدة.')],
      'rashid': [('Rashid: The Son of Dubai','راشد: ابن دبي','Graeme Wilson','غريم ويلسون','1999','The authoritative biography tracing his transformation of Dubai.','السيرة الذاتية الموثوقة التي تتتبع تحويله لدبي.'),('Father of Dubai','أبو دبي','National Archives','الأرشيف الوطني','2003','A photographic and narrative account of his infrastructure vision.','سرد فوتوغرافي وروائي لرؤيته في البنية التحتية.'),('Dubai: Life and Times','دبي: الحياة والأزمنة','Noor Ali Rashid','نور علي راشد','2010','Visual chronicle of Dubais transformation.','سجل بصري لتحول دبي.')],
      'mbz': [('Mohamed bin Zayed: A New Day','محمد بن زايد: يوم جديد','National Archives','الأرشيف الوطني','2019','The story of his strategic vision for a post-oil UAE.','قصة رؤيته الاستراتيجية لإمارات ما بعد النفط.'),('The UAE Strategy Framework','الإطار الاستراتيجي للإمارات','UAE Government Publications','منشورات حكومة الإمارات','2023','Comprehensive documentation of national strategies.','توثيق شامل للاستراتيجيات الوطنية.'),('Leadership and Vision','القيادة والرؤية','Emirates Centre for Strategic Studies','مركز الإمارات للدراسات الاستراتيجية','2021','Analysis of his leadership philosophy.','تحليل فلسفته القيادية.')],
      'mbr': [('My Vision','رؤيتي','Sheikh Mohammed bin Rashid','الشيخ محمد بن راشد','2012','His personal account of Dubais journey — bestseller in 20+ languages.','سرده الشخصي لرحلة دبي — كتاب من الأكثر مبيعاً.'),('Flashes of Thought','ومضات فكر','Sheikh Mohammed bin Rashid','الشيخ محمد بن راشد','2013','Collected wisdom on governance and innovation.','حكمة مجمّعة في الحوكمة والابتكار.'),('Reflections on Happiness & Positivity','تأملات في السعادة والإيجابية','Sheikh Mohammed bin Rashid','الشيخ محمد بن راشد','2017','His philosophy on creating a happy society.','فلسفته في إنشاء مجتمع سعيد.')],
    }
    for lid_key, bks in books.items():
        for b in bks:
            cur.execute("INSERT INTO tl_books (leader_id,title_en,title_ar,author_en,author_ar,year,desc_en,desc_ar) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)", (leader_ids[lid_key],)+b)

    speeches = {
      'zayed': [('On Unity','عن الوحدة','"A nation without a past has neither a present nor a future."','"أمة بلا ماضٍ ليس لها حاضر ولا مستقبل."'),('On Wealth','عن الثروة','"Wealth is not money. Wealth lies in men."','"الثروة ليست المال. الثروة تكمن في الرجال."'),('On Education','عن التعليم','"The real asset of any advanced nation is its people."','"الثروة الحقيقية لأي أمة متقدمة هي شعبها."')],
      'rashid': [('On Progress','عن التقدم','"My grandfather rode a camel, my father rode a camel, I drive a Mercedes..."','"جدي ركب الجمل، وأبي ركب الجمل، وأنا أقود مرسيدس..."'),('On Trade','عن التجارة','"What is good for the merchants is good for Dubai."','"ما هو جيد للتجار جيد لدبي."'),('On Infrastructure','عن البنية التحتية','"Build the infrastructure and the people will come."','"ابنِ البنية التحتية وسيأتي الناس."')],
      'mbz': [('On the Future','عن المستقبل','"The UAEs greatest resource is its people."','"أعظم ثروة للإمارات هي شعبها."'),('On Innovation','عن الابتكار','"We must prepare today for the world of tomorrow."','"يجب أن نستعد اليوم لعالم الغد."'),('On Climate','عن المناخ','"Climate action is not a burden — it is an opportunity."','"العمل المناخي ليس عبئاً — إنه فرصة."')],
      'mbr': [('On Leadership','عن القيادة','"In a race, there is no room for stopping."','"في السباق، لا مكان للتوقف."'),('On Government','عن الحكومة','"Government is not a business. It is a service."','"الحكومة ليست عملاً تجارياً. إنها خدمة."'),('On Excellence','عن التميز','"The word impossible is not in the dictionary of leaders."','"كلمة مستحيل ليست في قاموس القادة."')],
    }
    for lid_key, sps in speeches.items():
        for s in sps:
            cur.execute("INSERT INTO tl_speeches (leader_id,title_en,title_ar,quote_en,quote_ar) VALUES (%s,%s,%s,%s,%s)", (leader_ids[lid_key],)+s)

    c.commit(); print("✅ Thought Leadership seeded")

    # ── Success Stories (8) ──
    cur.execute("DELETE FROM ss_highlights"); cur.execute("DELETE FROM success_stories"); cur.execute("DELETE FROM ss_sectors")
    stories = [
      ('H.E. Sarah Al Amiri','معالي سارة الأميري','Minister of State for Public Education & Advanced Technology','وزيرة دولة للتعليم العام والتكنولوجيا المتقدمة','Deputy Project Manager, Emirates Mars Mission','نائبة مدير مشروع الإمارات لاستكشاف المريخ','Mohammed bin Rashid Space Centre → UAE Government','مركز محمد بن راشد للفضاء ← حكومة الإمارات','Space & Technology','الفضاء والتكنولوجيا','Abu Dhabi','أبوظبي','🚀','#EFF6FF','#2563EB','#DBEAFE','Sarah Al Amiri started as an engineer at MBRSC, rising to lead the Hope Probe science team.','بدأت سارة الأميري كمهندسة في مركز محمد بن راشد للفضاء.','\"We wanted to send a message that an Arab country can reach Mars.\"','\"أردنا إرسال رسالة بأن دولة عربية يمكنها الوصول إلى المريخ.\"'),
      ('Mohamed Alabbar','محمد العبار','Founder & Managing Director','المؤسس والعضو المنتدب','Former Director General, Dubai DED','المدير العام السابق لدائرة التنمية الاقتصادية','Emaar Properties','إعمار العقارية','Real Estate & Retail','العقارات والتجزئة','Dubai','دبي','🏗️','#FFF7ED','#EA580C','#FFEDD5','Mohamed Alabbar built Emaar into one of the worlds largest real estate developers.','بنى محمد العبار إعمار لتصبح واحدة من أكبر شركات التطوير العقاري.','\"Think big. Start small. But most of all, start.\"','\"فكّر بشكل كبير. ابدأ صغيراً. لكن الأهم، ابدأ.\"'),
      ('Raja Al Mazrouei','رجاء المزروعي','Executive Vice President','نائبة الرئيس التنفيذي','FinTech Hive Director','مديرة FinTech Hive','DIFC','مركز دبي المالي العالمي','FinTech & Financial Services','التكنولوجيا المالية والخدمات المالية','Dubai','دبي','💳','#F0FDF4','#16A34A','#DCFCE7','Raja Al Mazrouei pioneered the FinTech Hive at DIFC.','رائدة FinTech Hive في مركز دبي المالي العالمي.','\"FinTech is about making finance accessible to everyone.\"','\"التكنولوجيا المالية بجعل التمويل متاحاً للجميع.\"'),
      ('Khalaf Al Habtoor','خلف الحبتور','Founding Chairman','الرئيس المؤسس','Started as a contractor in the 1970s','بدأ كمقاول في السبعينيات','Al Habtoor Group','مجموعة الحبتور','Hospitality, Automotive & Construction','الضيافة والسيارات والبناء','Dubai','دبي','🏨','#FAF5FF','#9333EA','#F3E8FF','Starting with a small contracting business, Khalaf built one of the UAEs largest conglomerates.','بدأ بعمل مقاولات صغير وبنى واحدة من أكبر التكتلات في الإمارات.','\"I started with nothing but a dream.\"','\"بدأت بلا شيء سوى حلم.\"'),
      ('Hussain Sajwani','حسين سجواني','Founder & Chairman','المؤسس والرئيس','Started in catering in the 1980s','بدأ في خدمات التموين في الثمانينيات','DAMAC Properties','داماك العقارية','Real Estate & Luxury Development','العقارات والتطوير الفاخر','Dubai','دبي','🏢','#FEF2F2','#DC2626','#FEE2E2','Hussain Sajwani founded DAMAC Properties in 2002.','أسس حسين سجواني داماك العقارية في 2002.','\"I started from zero.\"','\"بدأت من الصفر.\"'),
      ('Abdulla bin Sulayem','عبدالله بن سليم','Executive Chairman','الرئيس التنفيذي','Former Director General, DMCC','المدير العام السابق لمركز دبي للسلع المتعددة','DMCC','مركز دبي للسلع المتعددة','Commodities & Free Zones','السلع والمناطق الحرة','Dubai','دبي','💎','#FFFBEB','#D97706','#FEF3C7','Abdulla bin Sulayem transformed DMCC into the worlds #1 Free Zone.','حوّل عبدالله بن سليم مركز دبي للسلع المتعددة إلى المنطقة الحرة الأولى عالمياً.','\"Free zones are about creating ecosystems.\"','\"المناطق الحرة عن خلق بيئات تزدهر فيها الأعمال.\"'),
      ('Noura Al Kaabi','نورة الكعبي','Former Minister of Culture & Youth','وزيرة الثقافة والشباب السابقة','CEO, twofour54','الرئيسة التنفيذية لـ twofour54','twofour54 → UAE Government','twofour54 ← حكومة الإمارات','Media & Creative Industries','الإعلام والصناعات الإبداعية','Abu Dhabi','أبوظبي','🎬','#FDF4FF','#A855F7','#F3E8FF','Noura Al Kaabi built twofour54 into the MENAs leading media free zone.','بنت نورة الكعبي twofour54 لتصبح المنطقة الإعلامية الرائدة.','\"Culture is the soul of a nations identity.\"','\"الثقافة روح هوية الأمة.\"'),
      ('Ahmed Bin Byat','أحمد بن بيات','Former Vice Chairman','نائب الرئيس السابق','CEO, Dubai Holding','الرئيس التنفيذي لدبي القابضة','Dubai Holding','دبي القابضة','Investment & Technology','الاستثمار والتكنولوجيا','Dubai','دبي','🌐','#ECFDF5','#059669','#D1FAE5','Ahmed Bin Byat led Dubai Holding through its expansion into technology.','قاد أحمد بن بيات دبي القابضة خلال توسعها في التكنولوجيا.','\"Competition drives innovation.\"','\"المنافسة تدفع الابتكار.\"'),
    ]
    story_ids = []
    for s in stories:
        cur.execute("INSERT INTO success_stories (name_en,name_ar,role_en,role_ar,prev_role_en,prev_role_ar,company_en,company_ar,sector_en,sector_ar,location_en,location_ar,avatar,theme_bg,theme_accent,theme_light,story_en,story_ar,quote_en,quote_ar) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id", s)
        story_ids.append(cur.fetchone()[0])

    # Highlights
    highlights = [
      [('Led science team for Mars Hope Probe','قادت الفريق العلمي لمسبار الأمل'),('Youngest minister appointed at 34','أصغر وزيرة عُيّنت في سن 34'),('Forbes 100 Most Powerful Women','فوربس أقوى 100 امرأة')],
      [("Built Burj Khalifa",'بنى برج خليفة'),("Created The Dubai Mall",'أنشأ دبي مول'),('Launched Noon.com','أطلق Noon.com')],
      [("Built MENAs first FinTech accelerator",'بنت أول مسرّعة تكنولوجيا مالية'),('Supported 200+ startup launches','دعمت إطلاق أكثر من 200 شركة'),('Forbes Most Powerful Arab Women','فوربس أقوى سيدات الأعمال العربيات')],
      [('Built conglomerate from a single firm','بنى تكتلاً من شركة واحدة'),('12 luxury hotels worldwide','12 فندقاً فاخراً'),('Over 25,000 employees','أكثر من 25,000 موظف')],
      [('Built DAMAC into a $4B+ empire','بنى داماك إلى إمبراطورية بقيمة 4 مليارات'),('43,000+ luxury homes','أكثر من 43,000 منزل فاخر'),('Partnered with Versace, Fendi, Trump','شراكة مع فيرساتشي وفندي وترامب')],
      [("Worlds #1 Free Zone 6 years",'المنطقة الحرة الأولى عالمياً'),('22,000+ registered companies','أكثر من 22,000 شركة'),('Businesses from 170 nations','أعمال من 170 دولة')],
      [("MENAs leading media free zone",'المنطقة الإعلامية الرائدة'),('Attracted CNN, Sky News','استقطبت CNN وسكاي نيوز'),('Shaped creative economy','شكّلت الاقتصاد الإبداعي')],
      [('Led $30B+ portfolio','قاد محفظة 30 مليار+'),('Launched du telecommunications','أطلق اتصالات du'),('Pioneered telecom competition','رائد المنافسة في الاتصالات')],
    ]
    for idx, hl_list in enumerate(highlights):
        for h in hl_list:
            cur.execute("INSERT INTO ss_highlights (story_id,highlight_en,highlight_ar) VALUES (%s,%s,%s)", (story_ids[idx], h[0], h[1]))

    # Sectors
    sectors = [
      ('Technology & Space','التكنولوجيا والفضاء',2,'🚀','#DBEAFE','#1E40AF'),
      ('Real Estate & Construction','العقارات والبناء',2,'🏗️','#FEF3C7','#92400E'),
      ('Finance & FinTech','المالية والتكنولوجيا المالية',2,'💳','#DCFCE7','#166534'),
      ('Media & Creative','الإعلام والإبداع',1,'🎬','#F3E8FF','#6B21A8'),
      ('Trade & Free Zones','التجارة والمناطق الحرة',1,'💎','#FEF3C7','#92400E'),
    ]
    for s in sectors:
        cur.execute("INSERT INTO ss_sectors (sector_en,sector_ar,count,icon,color,color_text) VALUES (%s,%s,%s,%s,%s,%s)", s)

    c.commit(); print("✅ Success Stories seeded")

    # ── Retiree ──
    cur.execute("DELETE FROM ret_pension_details"); cur.execute("DELETE FROM ret_pension_benefits")
    cur.execute("DELETE FROM ret_healthcare"); cur.execute("DELETE FROM ret_engagement")
    cur.execute("DELETE FROM ret_lifestyle_perks"); cur.execute("DELETE FROM ret_service_centres")

    pensions = [
      ('GPSSA Pension','معاش الهيئة العامة للمعاشات','General Pension and Social Security Authority — monthly pension based on years of service.','الهيئة العامة للمعاشات والتأمينات الاجتماعية — معاش شهري بناءً على سنوات الخدمة.','🏛️','GPSSA','الهيئة العامة للمعاشات'),
      ('Abu Dhabi Pension Fund (ADPF)','صندوق أبوظبي للتقاعد','Retirement benefits for Abu Dhabi government employees.','مزايا تقاعد لموظفي حكومة أبوظبي.','🏦','ADPF','صندوق أبوظبي للتقاعد'),
      ('Dubai Government Pension','معاش حكومة دبي','DGRFA manages Dubai government employee pensions.','تدير الهيئة العامة للتقاعد في دبي معاشات الموظفين.','🌆','DGRFA','الهيئة العامة لتقاعد دبي'),
      ('Private Sector End-of-Service','نهاية خدمة القطاع الخاص','End-of-service gratuity for private sector employees under UAE Labour Law.','مكافأة نهاية الخدمة لموظفي القطاع الخاص بموجب قانون العمل.','💼','Ministry of Human Resources','وزارة الموارد البشرية'),
    ]
    pension_ids = []
    for p in pensions:
        cur.execute("INSERT INTO ret_pension_benefits (title_en,title_ar,desc_en,desc_ar,icon,provider_en,provider_ar) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id", p)
        pension_ids.append(cur.fetchone()[0])

    pension_details = [
      [('Based on final salary × service years','بناءً على الراتب الأخير × سنوات الخدمة'),('Minimum 20 years of service','حد أدنى 20 سنة خدمة'),('Annual cost-of-living adjustments','تعديلات سنوية لتكاليف المعيشة'),('24/7 digital portal access','وصول على مدار الساعة للبوابة الرقمية')],
      [('Abu Dhabi government employees','موظفو حكومة أبوظبي'),('Pension + gratuity combined','معاش + مكافأة مجمّعة'),('Family pension for dependents','معاش عائلي للمعالين'),('Medical insurance continuation','استمرار التأمين الطبي')],
      [('Dubai government employees','موظفو حكومة دبي'),('Housing benefit continuation','استمرار مزايا الإسكان'),("Childrens education support",'دعم تعليم الأبناء'),('Special merit awards','جوائز الجدارة الخاصة')],
      [('21 days/year (first 5 years)','21 يوماً/سنة (أول 5 سنوات)'),('30 days/year (after 5 years)','30 يوماً/سنة (بعد 5 سنوات)'),('Based on last basic salary','بناءً على آخر راتب أساسي'),('Payable upon contract end','تُدفع عند انتهاء العقد')],
    ]
    for idx, details in enumerate(pension_details):
        for d in details:
            cur.execute("INSERT INTO ret_pension_details (benefit_id,detail_en,detail_ar) VALUES (%s,%s,%s)", (pension_ids[idx], d[0], d[1]))

    healthcare = [
      ('Thiqa Health Insurance','تأمين ثقة الصحي','DAMAN / Abu Dhabi','ضمان / أبوظبي','Premium health insurance for retired UAE nationals in Abu Dhabi.','تأمين صحي متميز للمتقاعدين الإماراتيين في أبوظبي.','Comprehensive','شامل','🏥'),
      ('Saada Card Benefits','مزايا بطاقة سعادة','Ministry of Community Development','وزارة تنمية المجتمع','Saada Card provides retirees with priority access to government healthcare.','توفر بطاقة سعادة للمتقاعدين أولوية الوصول للرعاية الصحية الحكومية.','Government Services','الخدمات الحكومية','💳'),
      ('Home Healthcare Programme','برنامج الرعاية الصحية المنزلية','DoH / SEHA','دائرة الصحة / صحة','In-home nursing, physiotherapy, and specialist visits for senior citizens.','تمريض منزلي وعلاج طبيعي وزيارات متخصصة لكبار السن.','Home-Based Care','رعاية منزلية','🏠'),
      ('Mental Wellness Support','دعم الصحة النفسية','SEHA / Dubai Health','صحة / صحة دبي','Counselling, cognitive health programmes designed for retirees.','إرشاد نفسي وبرامج صحة إدراكية مصممة للمتقاعدين.','Mental Health','الصحة النفسية','🧠'),
    ]
    for h in healthcare:
        cur.execute("INSERT INTO ret_healthcare (title_en,title_ar,provider_en,provider_ar,desc_en,desc_ar,coverage_en,coverage_ar,icon) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)", h)

    engagement = [
      ('Weyak Mentorship Programme','برنامج وياك للإرشاد','Ministry of Community Development','وزارة تنمية المجتمع','Mentoring','إرشاد','Share your professional experience with young Emiratis.','شارك خبرتك المهنية مع الشباب الإماراتي.','4–6 hrs/week','4–6 ساعات/أسبوع',50),
      ('Majlis Advisory Council','مجلس المجالس الاستشاري','Federal National Council','المجلس الوطني الاتحادي','Advisory','استشاري','Retired senior officials on advisory councils.','كبار المسؤولين المتقاعدين في مجالس استشارية.','8 hrs/month','8 ساعات/شهر',20),
      ('Heritage & Cultural Preservation','الحفاظ على التراث والثقافة','Department of Culture & Tourism','دائرة الثقافة والسياحة','Volunteering','تطوع','Help preserve UAE oral history and traditional crafts.','ساهم في الحفاظ على التاريخ الشفهي والحرف التقليدية.','3–5 hrs/week','3–5 ساعات/أسبوع',40),
      ('Board Observer Programme','برنامج مراقب مجلس الإدارة','Abu Dhabi Securities Exchange','سوق أبوظبي للأوراق المالية','Consulting','استشارات','Serve as board observers for listed companies.','العمل كمراقبين في مجالس الإدارة.','Monthly meetings','اجتماعات شهرية',15),
      ('Entrepreneurship Support','دعم ريادة الأعمال','Khalifa Fund','صندوق خليفة','Mentoring','إرشاد','Guide young Emirati entrepreneurs.','وجّه رواد الأعمال الإماراتيين الشباب.','4 hrs/week','4 ساعات/أسبوع',30),
      ('University Guest Lecturing','محاضرات جامعية استضافية','UAE University / Zayed University','جامعة الإمارات / جامعة زايد','Teaching','تدريس','Share industry insights with the next generation.','شارك رؤى صناعية مع الجيل القادم.','Monthly lectures','محاضرات شهرية',25),
    ]
    for e in engagement:
        cur.execute("INSERT INTO ret_engagement (title_en,title_ar,org_en,org_ar,type_en,type_ar,desc_en,desc_ar,commitment_en,commitment_ar,spots) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", e)

    perks = [
      ('✈️','Travel Discounts','خصومات السفر','Up to 30% off Emirates & Etihad flights.','خصم يصل إلى 30% على رحلات طيران الإمارات والاتحاد.','Travel','سفر'),
      ('🏊','Fitness & Recreation','اللياقة والترفيه','Free access to 50+ government fitness centres.','دخول مجاني لأكثر من 50 مركز لياقة حكومياً.','Wellness','صحة'),
      ('📚','Lifelong Learning','التعلم مدى الحياة','Free university course auditing.','حضور مجاني لمحاضرات جامعية.','Education','تعليم'),
      ('🛒','Retail Discounts','خصومات التجزئة','Saada Card discounts at 200+ retail partners.','خصومات بطاقة سعادة في أكثر من 200 شريك.','Shopping','تسوّق'),
      ('🎭','Cultural Access','الوصول الثقافي','Free or discounted entry to cultural events.','دخول مجاني أو مخفّض للفعاليات الثقافية.','Culture','ثقافة'),
      ('🚗','Transport Benefits','مزايا النقل','Free RTA public transport in Dubai.','نقل عام مجاني من هيئة الطرق في دبي.','Transport','نقل'),
    ]
    for p in perks:
        cur.execute("INSERT INTO ret_lifestyle_perks (icon,title_en,title_ar,desc_en,desc_ar,category_en,category_ar) VALUES (%s,%s,%s,%s,%s,%s,%s)", p)

    centres = [
      ('Abu Dhabi','أبوظبي','Al Bateen, GPSSA HQ','البطين، مقر الهيئة العامة للمعاشات','800-2070'),
      ('Dubai','دبي','Al Twar, DGRFA','الطوار، الهيئة العامة لتقاعد دبي','800-DGRFA'),
      ('Sharjah','الشارقة','Al Khan, SSD','الخان، دائرة الخدمات الاجتماعية','06-5068888'),
      ('Al Ain','العين','Zakher, GPSSA Branch','زاخر، فرع الهيئة العامة للمعاشات','800-2070'),
    ]
    for c2 in centres:
        cur.execute("INSERT INTO ret_service_centres (city_en,city_ar,location_en,location_ar,phone) VALUES (%s,%s,%s,%s,%s)", c2)

    c.commit(); print("✅ Retiree Services seeded")
    c.close(); print("\n🎉 All lifelong engagement data seeded successfully!")

if __name__ == '__main__':
    seed()
