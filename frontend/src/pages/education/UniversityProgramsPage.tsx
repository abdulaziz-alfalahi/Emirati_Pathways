
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { GraduationCap, Users, Building, Target, MapPin, Star, Clock, CheckCircle, ArrowRight, ArrowLeft, Award, Globe, BookOpen, Briefcase, ExternalLink } from 'lucide-react';

// Brand tokens
const brand = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primarySurface: '#F0FDFA',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
};

const UniversityProgramsPage: React.FC = () => {

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Program data (translated)
  const programs = [
    {
      id: '1',
      title: t('Computer Science & Engineering', 'علوم الحاسوب والهندسة'),
      degree: t("Bachelor's", 'بكالوريوس'),
      university: t('American University of Sharjah', 'الجامعة الأمريكية في الشارقة'),
      location: t('Sharjah', 'الشارقة'),
      duration: t('4 years', '4 سنوات'),
      language: t('English', 'الإنجليزية'),
      tuition: t('AED 65,000/yr', '65,000 د.إ/سنة'),
      description: t(
        'Comprehensive computer science program covering software engineering, AI, cybersecurity, and data science with hands-on industry projects.',
        'برنامج شامل في علوم الحاسوب يغطي هندسة البرمجيات والذكاء الاصطناعي والأمن السيبراني وعلوم البيانات مع مشاريع عملية في الصناعة.'
      ),
      careerOutcomes: [
        t('Software Engineer', 'مهندس برمجيات'),
        t('Data Scientist', 'عالم بيانات'),
        t('Cybersecurity Analyst', 'محلل أمن سيبراني'),
        t('AI Engineer', 'مهندس ذكاء اصطناعي'),
      ],
      subjects: [
        t('Programming', 'البرمجة'),
        t('Data Structures', 'هياكل البيانات'),
        t('Machine Learning', 'التعلم الآلي'),
        t('Cybersecurity', 'الأمن السيبراني'),
      ],
      rating: 4.8,
      enrolled: 1247,
      capacity: 1400,
      employmentRate: 96,
      isPopular: true,
      isNew: false,
      scholarshipAvailable: true,
      accreditation: ['ABET', t('UAE Ministry of Education', 'وزارة التربية والتعليم')],
      category: 'Technology',
      categoryLabel: t('Technology', 'تكنولوجيا'),
    },
    {
      id: '2',
      title: t('Medicine & Surgery', 'الطب والجراحة'),
      degree: t("Bachelor's (MBBS)", 'بكالوريوس (MBBS)'),
      university: t('UAE University', 'جامعة الإمارات'),
      location: t('Al Ain', 'العين'),
      duration: t('6 years', '6 سنوات'),
      language: t('English', 'الإنجليزية'),
      tuition: t('Free for UAE Nationals', 'مجاني للمواطنين الإماراتيين'),
      description: t(
        'Comprehensive medical education program preparing students for practice with clinical rotations in UAE hospitals and international centres.',
        'برنامج تعليم طبي شامل يُعدّ الطلاب للممارسة مع تدريب سريري في مستشفيات الإمارات والمراكز الدولية.'
      ),
      careerOutcomes: [
        t('General Practitioner', 'طبيب عام'),
        t('Specialist Doctor', 'طبيب اختصاصي'),
        t('Surgeon', 'جرّاح'),
        t('Medical Researcher', 'باحث طبي'),
      ],
      subjects: [
        t('Anatomy', 'التشريح'),
        t('Physiology', 'علم وظائف الأعضاء'),
        t('Pathology', 'علم الأمراض'),
        t('Clinical Medicine', 'الطب السريري'),
      ],
      rating: 4.9,
      enrolled: 856,
      capacity: 900,
      employmentRate: 98,
      isPopular: true,
      isNew: false,
      scholarshipAvailable: true,
      accreditation: ['LCME', t('UAE Ministry of Health', 'وزارة الصحة')],
      category: 'Healthcare',
      categoryLabel: t('Healthcare', 'رعاية صحية'),
    },
    {
      id: '3',
      title: t('Business Administration (MBA)', 'إدارة الأعمال (MBA)'),
      degree: t("Master's", 'ماجستير'),
      university: t('American University of Dubai', 'الجامعة الأمريكية في دبي'),
      location: t('Dubai', 'دبي'),
      duration: t('2 years', 'سنتان'),
      language: t('English', 'الإنجليزية'),
      tuition: t('AED 85,000/yr', '85,000 د.إ/سنة'),
      description: t(
        'Executive MBA for working professionals focusing on strategic management, leadership, and innovation in the Middle East business environment.',
        'ماجستير إدارة أعمال تنفيذي للمهنيين العاملين يركز على الإدارة الاستراتيجية والقيادة والابتكار في بيئة الأعمال بالشرق الأوسط.'
      ),
      careerOutcomes: [
        t('CEO/Executive', 'رئيس تنفيذي'),
        t('Management Consultant', 'مستشار إداري'),
        t('Business Development Manager', 'مدير تطوير أعمال'),
        t('Entrepreneur', 'رائد أعمال'),
      ],
      subjects: [
        t('Strategic Management', 'الإدارة الاستراتيجية'),
        t('Financial Analysis', 'التحليل المالي'),
        t('Marketing Strategy', 'استراتيجية التسويق'),
        t('Leadership', 'القيادة'),
      ],
      rating: 4.7,
      enrolled: 324,
      capacity: 400,
      employmentRate: 94,
      isPopular: true,
      isNew: false,
      scholarshipAvailable: false,
      accreditation: ['AACSB', t('UAE Ministry of Education', 'وزارة التربية والتعليم')],
      category: 'Business',
      categoryLabel: t('Business', 'أعمال'),
    },
    {
      id: '4',
      title: t('Renewable Energy Engineering', 'هندسة الطاقة المتجددة'),
      degree: t("Bachelor's", 'بكالوريوس'),
      university: t('Masdar Institute – Khalifa University', 'معهد مصدر – جامعة خليفة'),
      location: t('Abu Dhabi', 'أبوظبي'),
      duration: t('4 years', '4 سنوات'),
      language: t('English', 'الإنجليزية'),
      tuition: t('AED 45,000/yr', '45,000 د.إ/سنة'),
      description: t(
        'Cutting-edge engineering program on sustainable energy technologies, solar power systems, and environmental engineering aligned with D33 and Talent33.',
        'برنامج هندسي متطور في تقنيات الطاقة المستدامة وأنظمة الطاقة الشمسية والهندسة البيئية متوافق مع D33 وTalent33.'
      ),
      careerOutcomes: [
        t('Renewable Energy Engineer', 'مهندس طاقة متجددة'),
        t('Solar System Designer', 'مصمم أنظمة شمسية'),
        t('Environmental Consultant', 'مستشار بيئي'),
        t('Sustainability Manager', 'مدير استدامة'),
      ],
      subjects: [
        t('Solar Energy', 'الطاقة الشمسية'),
        t('Wind Power', 'طاقة الرياح'),
        t('Energy Storage', 'تخزين الطاقة'),
        t('Sustainable Design', 'التصميم المستدام'),
      ],
      rating: 4.6,
      enrolled: 567,
      capacity: 650,
      employmentRate: 92,
      isPopular: false,
      isNew: true,
      scholarshipAvailable: true,
      accreditation: ['ABET', t('UAE Ministry of Energy', 'وزارة الطاقة')],
      category: 'Engineering',
      categoryLabel: t('Engineering', 'هندسة'),
    },
    {
      id: '5',
      title: t('Arabic Language & Literature', 'اللغة العربية وآدابها'),
      degree: t("Bachelor's", 'بكالوريوس'),
      university: t('United Arab Emirates University', 'جامعة الإمارات العربية المتحدة'),
      location: t('Al Ain', 'العين'),
      duration: t('4 years', '4 سنوات'),
      language: t('Arabic', 'العربية'),
      tuition: t('Free for UAE Nationals', 'مجاني للمواطنين الإماراتيين'),
      description: t(
        'Arabic language and literature program preserving UAE cultural heritage while preparing students for careers in education, media, and cultural affairs.',
        'برنامج اللغة العربية وآدابها للحفاظ على التراث الثقافي الإماراتي وإعداد الطلاب لمسيرة مهنية في التعليم والإعلام والشؤون الثقافية.'
      ),
      careerOutcomes: [
        t('Arabic Teacher', 'مدرّس لغة عربية'),
        t('Translator', 'مترجم'),
        t('Journalist', 'صحفي'),
        t('Cultural Affairs Officer', 'مسؤول شؤون ثقافية'),
      ],
      subjects: [
        t('Classical Arabic', 'العربية الفصحى'),
        t('Modern Arabic Literature', 'الأدب العربي الحديث'),
        t('Poetry', 'الشعر'),
        t('Linguistics', 'اللسانيات'),
      ],
      rating: 4.5,
      enrolled: 423,
      capacity: 500,
      employmentRate: 89,
      isPopular: false,
      isNew: false,
      scholarshipAvailable: true,
      accreditation: [t('UAE Ministry of Education', 'وزارة التربية والتعليم'), t('Arab League Educational Organization', 'المنظمة العربية للتربية والثقافة والعلوم')],
      category: 'Arts & Humanities',
      categoryLabel: t('Arts & Humanities', 'فنون وعلوم إنسانية'),
    },
    {
      id: '6',
      title: t('Aviation Management', 'إدارة الطيران'),
      degree: t("Bachelor's", 'بكالوريوس'),
      university: t('Emirates Aviation University', 'جامعة الإمارات للطيران'),
      location: t('Dubai', 'دبي'),
      duration: t('4 years', '4 سنوات'),
      language: t('English', 'الإنجليزية'),
      tuition: t('AED 75,000/yr', '75,000 د.إ/سنة'),
      description: t(
        'Specialized aviation program covering airline operations, airport management, and safety, with partnerships with Emirates Airlines and Dubai Airports.',
        'برنامج طيران متخصص يشمل عمليات شركات الطيران وإدارة المطارات والسلامة، بشراكة مع طيران الإمارات ومطارات دبي.'
      ),
      careerOutcomes: [
        t('Airport Manager', 'مدير مطار'),
        t('Airline Operations Manager', 'مدير عمليات شركة طيران'),
        t('Aviation Safety Officer', 'مسؤول سلامة الطيران'),
      ],
      subjects: [
        t('Aviation Operations', 'عمليات الطيران'),
        t('Airport Management', 'إدارة المطارات'),
        t('Aviation Safety', 'سلامة الطيران'),
        t('Airline Economics', 'اقتصاديات الطيران'),
      ],
      rating: 4.4,
      enrolled: 289,
      capacity: 350,
      employmentRate: 91,
      isPopular: false,
      isNew: false,
      scholarshipAvailable: false,
      accreditation: ['ICAO', t('UAE General Civil Aviation Authority', 'الهيئة العامة للطيران المدني')],
      category: 'Aviation',
      categoryLabel: t('Aviation', 'طيران'),
    },
  ];

  const universities = [
    {
      id: '1',
      name: t('United Arab Emirates University', 'جامعة الإمارات العربية المتحدة'),
      location: t('Al Ain', 'العين'),
      type: 'Public',
      typeLabel: t('Public', 'حكومية'),
      established: 1976,
      ranking: 1,
      studentsCount: 14000,
      programsCount: 85,
      website: 'www.uaeu.ac.ae',
      description: t(
        "The UAE's flagship university, offering comprehensive programs across all disciplines with a focus on research and innovation.",
        'الجامعة الرائدة في الإمارات، تقدم برامج شاملة في جميع التخصصات مع التركيز على البحث والابتكار.'
      ),
      specialties: [
        t('Medicine', 'الطب'),
        t('Engineering', 'الهندسة'),
        t('Business', 'الأعمال'),
        t('Education', 'التعليم'),
        t('Agriculture', 'الزراعة'),
      ],
    },
    {
      id: '2',
      name: t('American University of Sharjah', 'الجامعة الأمريكية في الشارقة'),
      location: t('Sharjah', 'الشارقة'),
      type: 'Private',
      typeLabel: t('Private', 'خاصة'),
      established: 1997,
      ranking: 2,
      studentsCount: 6000,
      programsCount: 45,
      website: 'www.aus.edu',
      description: t(
        'Leading private university offering American-style education with strong programs in engineering, business, and liberal arts.',
        'جامعة خاصة رائدة تقدم تعليماً على النمط الأمريكي مع برامج قوية في الهندسة والأعمال والآداب.'
      ),
      specialties: [
        t('Engineering', 'الهندسة'),
        t('Computer Science', 'علوم الحاسوب'),
        t('Business', 'الأعمال'),
        t('Architecture', 'الهندسة المعمارية'),
        t('Liberal Arts', 'الآداب'),
      ],
    },
    {
      id: '3',
      name: t('Khalifa University', 'جامعة خليفة'),
      location: t('Abu Dhabi', 'أبوظبي'),
      type: 'Public',
      typeLabel: t('Public', 'حكومية'),
      established: 2007,
      ranking: 3,
      studentsCount: 3000,
      programsCount: 35,
      website: 'www.ku.ac.ae',
      description: t(
        'Research-intensive university focusing on science, engineering, and technology with world-class facilities.',
        'جامعة بحثية مكثفة تركز على العلوم والهندسة والتكنولوجيا بمرافق عالمية المستوى.'
      ),
      specialties: [
        t('Engineering', 'الهندسة'),
        t('Science', 'العلوم'),
        t('Medicine', 'الطب'),
        t('Technology', 'التكنولوجيا'),
        t('Research', 'البحث'),
      ],
    },
    {
      id: '4',
      name: t('American University of Dubai', 'الجامعة الأمريكية في دبي'),
      location: t('Dubai', 'دبي'),
      type: 'Private',
      typeLabel: t('Private', 'خاصة'),
      established: 1995,
      ranking: 4,
      studentsCount: 2500,
      programsCount: 25,
      website: 'www.aud.edu',
      description: t(
        'Business-focused university with strong industry connections and practical learning approach.',
        'جامعة تركز على الأعمال مع روابط صناعية قوية ونهج تعليمي عملي.'
      ),
      specialties: [
        t('Business', 'الأعمال'),
        t('Engineering', 'الهندسة'),
        t('Communication', 'الإعلام'),
        t('Design', 'التصميم'),
        t('Information Technology', 'تقنية المعلومات'),
      ],
    },
  ];

  const categoryFilters = [
    { key: 'All', label: t('All', 'الكل') },
    { key: 'Technology', label: t('Technology', 'تكنولوجيا') },
    { key: 'Healthcare', label: t('Healthcare', 'رعاية صحية') },
    { key: 'Business', label: t('Business', 'أعمال') },
    { key: 'Engineering', label: t('Engineering', 'هندسة') },
    { key: 'Arts & Humanities', label: t('Arts & Humanities', 'فنون وعلوم إنسانية') },
    { key: 'Aviation', label: t('Aviation', 'طيران') },
  ];

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = programs.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const stats = [
    { value: '50+', label: t('Universities & Colleges', 'الجامعات والكليات'), icon: Building },
    { value: '200+', label: t('Degree Programs', 'البرامج الأكاديمية'), icon: GraduationCap },
    { value: '92%', label: t('Employment Rate', 'نسبة التوظيف'), icon: Target },
    { value: '25,000+', label: t('Students Enrolled', 'طالب مسجّل'), icon: Users },
  ];

  const getCategoryColor = (cat: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      'Technology': { bg: '#DBEAFE', color: '#1E40AF' },
      'Healthcare': { bg: '#FEE2E2', color: '#991B1B' },
      'Business': { bg: '#FEF3C7', color: '#92400E' },
      'Engineering': { bg: '#F3E8FF', color: '#6B21A8' },
      'Arts & Humanities': { bg: '#FFF1F2', color: '#BE123C' },
      'Aviation': { bg: brand.primarySurface, color: brand.primary },
    };
    return map[cat] || { bg: '#F3F4F6', color: brand.textSecondary };
  };

  const tabs = [
    {
      id: 'programs', label: t('University Programs', 'البرامج الجامعية'),
      icon: <GraduationCap className="h-4 w-4" />,
      content: (
        <div>
          {/* Search and filter bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
              <input
                type="text"
                placeholder={t('Search programs, universities, subjects…', 'ابحث عن البرامج والجامعات والتخصصات...')}
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
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categoryFilters.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    border: selectedCategory === cat.key ? 'none' : `1px solid ${brand.border}`,
                    background: selectedCategory === cat.key ? brand.primary : '#fff',
                    color: selectedCategory === cat.key ? '#fff' : brand.textSecondary,
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
              `Showing ${filtered.length} program${filtered.length !== 1 ? 's' : ''}`,
              `عرض ${filtered.length} ${filtered.length === 1 ? 'برنامج' : 'برامج'}`
            )}
          </p>

          {/* Program cards */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <GraduationCap style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('No programs found', 'لم يتم العثور على برامج')}</h3>
              <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Try adjusting your search or filter criteria.', 'حاول تعديل معايير البحث أو التصفية.')}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
              {filtered.map(p => {
                const catColor = getCategoryColor(p.category);
                return (
                  <div
                    key={p.id}
                    style={{
                      background: '#fff', borderRadius: 16,
                      border: `1px solid ${brand.border}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      overflow: 'hidden', transition: 'border-color 150ms, box-shadow 150ms',
                      cursor: 'pointer',
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
                    {/* Accent bar */}
                    <div style={{ height: 4, background: p.isPopular ? brand.primary : brand.border }} />

                    <div style={{ padding: 22 }}>
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: catColor.bg, color: catColor.color,
                        }}>
                          {p.categoryLabel}
                        </span>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: '#F3F4F6', color: brand.textSecondary,
                        }}>
                          {p.degree}
                        </span>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: '#F3F4F6', color: brand.textSecondary,
                        }}>
                          {p.language}
                        </span>
                        {p.isPopular && (
                          <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: '#FEE2E2', color: '#991B1B' }}>
                            🔥 {t('Popular', 'رائج')}
                          </span>
                        )}
                        {p.isNew && (
                          <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: '#DCFCE7', color: '#166534' }}>
                            ✨ {t('New', 'جديد')}
                          </span>
                        )}
                        {p.scholarshipAvailable && (
                          <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: '#FEF3C7', color: '#92400E' }}>
                            💰 {t('Scholarship', 'منحة')}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 4 }}>
                        {p.title}
                      </h3>

                      {/* University & location */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Building style={{ width: 14, height: 14, color: brand.textSecondary }} />
                        <span style={{ fontSize: 14, color: brand.textSecondary }}>{p.university}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                        <MapPin style={{ width: 14, height: 14, color: brand.textSecondary }} />
                        <span style={{ fontSize: 14, color: brand.textSecondary }}>{p.location}، {t('UAE', 'الإمارات')}</span>
                      </div>

                      {/* Description */}
                      <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 16 }}>
                        {p.description}
                      </p>

                      {/* Tuition, Duration, Employment row */}
                      <div style={{
                        display: 'flex', gap: 0, marginBottom: 16,
                        borderRadius: 12, background: brand.primarySurface, overflow: 'hidden',
                      }}>
                        <div style={{ flex: 1, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{t('Tuition', 'الرسوم')}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: brand.primary }}>{p.tuition}</div>
                        </div>
                        <div style={{ width: 1, background: brand.border }} />
                        <div style={{ flex: 1, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{t('Duration', 'المدة')}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: brand.primary }}>{p.duration}</div>
                        </div>
                        <div style={{ width: 1, background: brand.border }} />
                        <div style={{ flex: 1, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{t('Jobs', 'وظائف')}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>{p.employmentRate}%</div>
                        </div>
                      </div>

                      {/* Subjects */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{t('Key Subjects', 'المواد الرئيسية')}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.subjects.map((s, i) => (
                            <span key={i} style={{
                              padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                              background: '#F3F4F6', color: brand.textPrimary,
                            }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Career Outcomes */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.careerOutcomes.map((c, i) => (
                            <span key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 12, color: brand.textSecondary,
                              padding: '3px 8px', borderRadius: 8, background: '#F9FAFB',
                            }}>
                              <Briefcase style={{ width: 12, height: 12, color: brand.primary }} />
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Accreditation */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.accreditation.map((a, i) => (
                            <span key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 12, color: '#166534',
                              padding: '3px 8px', borderRadius: 8, background: '#DCFCE7',
                            }}>
                              <CheckCircle style={{ width: 12, height: 12 }} />
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Enrollment bar */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: brand.textSecondary, marginBottom: 4 }}>
                          <span>{p.enrolled.toLocaleString(isRTL ? 'ar-AE' : 'en-US')} {t('enrolled', 'مسجّل')}</span>
                          <span>{(p.capacity - p.enrolled).toLocaleString(isRTL ? 'ar-AE' : 'en-US')} {t('spots left', 'مقعد متاح')}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6' }}>
                          <div style={{
                            height: '100%', borderRadius: 2, background: brand.primary,
                            width: `${(p.enrolled / p.capacity) * 100}%`,
                            transition: 'width 300ms',
                          }} />
                        </div>
                      </div>

                      {/* Rating & Apply */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Star style={{ width: 14, height: 14, color: '#F59E0B', fill: '#F59E0B' }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{p.rating}</span>
                        </div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '10px 22px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                          background: brand.primary, color: '#fff',
                          cursor: 'pointer', transition: 'background 150ms',
                        }}>
                          {t('Apply Now', 'قدّم الآن')} <ArrowIcon style={{ width: 16, height: 16 }} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'universities', label: t('Universities', 'الجامعات'),
      icon: <Building className="h-4 w-4" />,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {universities.map(u => (
            <div
              key={u.id}
              style={{
                background: '#fff', borderRadius: 16,
                border: `1px solid ${brand.border}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                overflow: 'hidden', transition: 'border-color 150ms, box-shadow 150ms',
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
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 4 }}>{u.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin style={{ width: 14, height: 14, color: brand.textSecondary }} />
                      <span style={{ fontSize: 14, color: brand.textSecondary }}>{u.location} · {t('Est.', 'تأسست')} {u.established}</span>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                    background: u.type === 'Public' ? '#DCFCE7' : '#DBEAFE',
                    color: u.type === 'Public' ? '#166534' : '#1E40AF',
                  }}>
                    {u.typeLabel}
                  </span>
                </div>

                <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 18 }}>
                  {u.description}
                </p>

                {/* Stats row */}
                <div style={{
                  display: 'flex', gap: 0, marginBottom: 16,
                  borderRadius: 12, background: brand.primarySurface, overflow: 'hidden',
                }}>
                  <div style={{ flex: 1, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: brand.primary }}>#{u.ranking}</div>
                    <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('UAE Rank', 'الترتيب')}</div>
                  </div>
                  <div style={{ width: 1, background: brand.border }} />
                  <div style={{ flex: 1, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: brand.primary }}>{u.studentsCount.toLocaleString(isRTL ? 'ar-AE' : 'en-US')}</div>
                    <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Students', 'طلاب')}</div>
                  </div>
                  <div style={{ width: 1, background: brand.border }} />
                  <div style={{ flex: 1, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: brand.primary }}>{u.programsCount}</div>
                    <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Programs', 'برامج')}</div>
                  </div>
                </div>

                {/* Specialties */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{t('Specialties', 'التخصصات')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {u.specialties.map((s, i) => (
                      <span key={i} style={{
                        padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                        background: '#F3F4F6', color: brand.textPrimary,
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: `1px solid ${brand.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: brand.textSecondary }}>
                    <Globe style={{ width: 14, height: 14 }} />
                    {u.website}
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: brand.primary, color: '#fff',
                    cursor: 'pointer',
                  }}>
                    {t('View Programs', 'عرض البرامج')} <ArrowIcon style={{ width: 14, height: 14 }} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'scholarships', label: t('Scholarships & Aid', 'المنح والدعم المالي'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Award style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Financial Aid & Scholarships', 'الدعم المالي والمنح الدراسية')}</h3>
          <p style={{ color: brand.textSecondary, fontSize: 14, maxWidth: 500, margin: '0 auto 20px' }}>
            {t(
              'Explore scholarships, tuition waivers, and financial aid available for UAE nationals pursuing university education.',
              'استكشف المنح الدراسية والإعفاءات من الرسوم والدعم المالي المتاح للمواطنين الإماراتيين الملتحقين بالتعليم الجامعي.'
            )}
          </p>
          <a href="/scholarships" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 24px', borderRadius: 20, fontSize: 14, fontWeight: 600,
            background: brand.primary, color: '#fff', textDecoration: 'none',
          }}>
            {t('View Scholarships', 'عرض المنح الدراسية')} <ArrowIcon style={{ width: 16, height: 16 }} />
          </a>
        </div>
      ),
    },
  ];

  return (
    <EducationPathwayLayout
      title={t('University Programs', 'البرامج الجامعية')}
      description={t(
        "Explore accredited degree programs at leading UAE universities — from bachelor's to doctoral studies — designed to launch your career.",
        'استكشف البرامج الأكاديمية المعتمدة في الجامعات الرائدة في الإمارات — من البكالوريوس إلى الدكتوراه — مصممة لإطلاق مسيرتك المهنية.'
      )}
      icon={<GraduationCap className="h-12 w-12" style={{ color: '#0D9488' }} />}
      stats={stats}
      tabs={tabs}
      defaultTab="programs"
      actionButtonText={t('Explore Programs', 'استكشف البرامج')}
      actionButtonHref="#programs"
      academicYear="2025-2026"
    />
  );
};

export default UniversityProgramsPage;
