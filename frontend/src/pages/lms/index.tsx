
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { Monitor, Users, BookOpen, Trophy, Award, TrendingUp, Clock, Star, ArrowRight, ArrowLeft, CheckCircle, Play, BarChart3, Flame } from 'lucide-react';

// Brand tokens
const brand = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primarySurface: '#F0FDFA',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
};

const LMSPage: React.FC = () => {

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Active courses (enrolled) — translated
  const myCourses = [
    {
      id: '1',
      title: t('Digital Marketing Fundamentals', 'أساسيات التسويق الرقمي'),
      instructor: t('Dr. Sara Al Qassimi', 'د. سارة القاسمي'),
      description: t(
        'Master digital marketing strategies including SEO, social media, content marketing, and analytics for the UAE market.',
        'أتقن استراتيجيات التسويق الرقمي بما في ذلك تحسين محركات البحث ووسائل التواصل الاجتماعي والتسويق بالمحتوى والتحليلات لسوق الإمارات.'
      ),
      duration: t('8 weeks', '8 أسابيع'),
      level: 'Intermediate',
      levelLabel: t('Intermediate', 'متوسط'),
      progress: 75,
      students: 234,
      nextLesson: t('Content Marketing Strategy', 'استراتيجية التسويق بالمحتوى'),
      category: 'Marketing',
      categoryLabel: t('Marketing', 'تسويق'),
    },
    {
      id: '2',
      title: t('Data Science with Python', 'علوم البيانات مع Python'),
      instructor: t('Prof. Ahmed Al Mansouri', 'أ.د. أحمد المنصوري'),
      description: t(
        'Learn data analysis, machine learning, and visualization using Python, pandas, scikit-learn, and real-world UAE datasets.',
        'تعلّم تحليل البيانات والتعلم الآلي والتصور البصري باستخدام Python وpandas وscikit-learn ومجموعات بيانات إماراتية حقيقية.'
      ),
      duration: t('12 weeks', '12 أسبوعاً'),
      level: 'Advanced',
      levelLabel: t('Advanced', 'متقدم'),
      progress: 45,
      students: 189,
      nextLesson: t('Supervised Learning Models', 'نماذج التعلم الموجّه'),
      category: 'Technology',
      categoryLabel: t('Technology', 'تكنولوجيا'),
    },
    {
      id: '3',
      title: t('Project Management Professional (PMP)', 'إدارة المشاريع الاحترافية (PMP)'),
      instructor: t('Eng. Fatima Al Zaabi', 'م. فاطمة الزعابي'),
      description: t(
        'Prepare for PMP certification covering project planning, execution, monitoring, and agile methodologies.',
        'استعد لشهادة PMP التي تغطي تخطيط المشاريع والتنفيذ والمراقبة ومنهجيات أجايل.'
      ),
      duration: t('10 weeks', '10 أسابيع'),
      level: 'Intermediate',
      levelLabel: t('Intermediate', 'متوسط'),
      progress: 90,
      students: 156,
      nextLesson: t('Risk Management Framework', 'إطار عمل إدارة المخاطر'),
      category: 'Business',
      categoryLabel: t('Business', 'أعمال'),
    },
  ];

  // Course catalog — translated
  const catalogCourses = [
    {
      id: '4',
      title: t('Full-Stack Web Development', 'تطوير الويب المتكامل'),
      instructor: t('Eng. Khalid Al Shamsi', 'م. خالد الشامسي'),
      description: t(
        'Build modern web applications using React, Node.js, and cloud deployment — from frontend to backend.',
        'ابنِ تطبيقات ويب حديثة باستخدام React وNode.js والنشر السحابي — من الواجهة الأمامية إلى الخلفية.'
      ),
      duration: t('16 weeks', '16 أسبوعاً'),
      level: 'Intermediate',
      levelLabel: t('Intermediate', 'متوسط'),
      students: 342,
      rating: 4.8,
      category: 'Technology',
      categoryLabel: t('Technology', 'تكنولوجيا'),
      featured: true,
    },
    {
      id: '5',
      title: t('Cybersecurity Essentials', 'أساسيات الأمن السيبراني'),
      instructor: t('Dr. Noura Al Hashimi', 'د. نورة الهاشمي'),
      description: t(
        'Learn network security, ethical hacking, incident response, and compliance frameworks for enterprise environments.',
        'تعلّم أمن الشبكات والاختراق الأخلاقي والاستجابة للحوادث وأطر الامتثال لبيئات المؤسسات.'
      ),
      duration: t('10 weeks', '10 أسابيع'),
      level: 'Advanced',
      levelLabel: t('Advanced', 'متقدم'),
      students: 278,
      rating: 4.9,
      category: 'Technology',
      categoryLabel: t('Technology', 'تكنولوجيا'),
      featured: true,
    },
    {
      id: '6',
      title: t('Artificial Intelligence & Machine Learning', 'الذكاء الاصطناعي والتعلم الآلي'),
      instructor: t('Prof. Omar Al Rawi', 'أ.د. عمر الراوي'),
      description: t(
        'Deep dive into neural networks, NLP, computer vision, and generative AI with hands-on projects.',
        'تعمّق في الشبكات العصبية ومعالجة اللغات الطبيعية والرؤية الحاسوبية والذكاء الاصطناعي التوليدي مع مشاريع عملية.'
      ),
      duration: t('14 weeks', '14 أسبوعاً'),
      level: 'Advanced',
      levelLabel: t('Advanced', 'متقدم'),
      students: 195,
      rating: 4.7,
      category: 'Technology',
      categoryLabel: t('Technology', 'تكنولوجيا'),
      featured: false,
    },
    {
      id: '7',
      title: t('Leadership & Management Skills', 'مهارات القيادة والإدارة'),
      instructor: t('Dr. Aisha Al Mehairi', 'د. عائشة المهيري'),
      description: t(
        'Develop essential leadership skills, emotional intelligence, and strategic thinking for career advancement.',
        'طوّر مهارات القيادة الأساسية والذكاء العاطفي والتفكير الاستراتيجي للتقدم المهني.'
      ),
      duration: t('6 weeks', '6 أسابيع'),
      level: 'Beginner',
      levelLabel: t('Beginner', 'مبتدئ'),
      students: 412,
      rating: 4.6,
      category: 'Business',
      categoryLabel: t('Business', 'أعمال'),
      featured: false,
    },
    {
      id: '8',
      title: t('Arabic Language for Professionals', 'اللغة العربية للمهنيين'),
      instructor: t('Dr. Hassan Al Nuaimi', 'د. حسن النعيمي'),
      description: t(
        'Enhance Arabic communication skills for business correspondence, presentations, and government sector roles.',
        'عزّز مهارات التواصل بالعربية للمراسلات التجارية والعروض التقديمية والأدوار في القطاع الحكومي.'
      ),
      duration: t('8 weeks', '8 أسابيع'),
      level: 'Beginner',
      levelLabel: t('Beginner', 'مبتدئ'),
      students: 156,
      rating: 4.5,
      category: 'Language',
      categoryLabel: t('Language', 'لغات'),
      featured: false,
    },
    {
      id: '9',
      title: t('Financial Analysis & Planning', 'التحليل المالي والتخطيط'),
      instructor: t('CFA. Mariam Al Suwaidi', 'CFA. مريم السويدي'),
      description: t(
        'Master financial modelling, investment analysis, and corporate finance principles relevant to the UAE economy.',
        'أتقن النمذجة المالية وتحليل الاستثمار ومبادئ تمويل الشركات ذات الصلة بالاقتصاد الإماراتي.'
      ),
      duration: t('10 weeks', '10 أسابيع'),
      level: 'Intermediate',
      levelLabel: t('Intermediate', 'متوسط'),
      students: 223,
      rating: 4.7,
      category: 'Finance',
      categoryLabel: t('Finance', 'مالية'),
      featured: true,
    },
  ];

  const achievements = [
    { title: t('First Course Completed', 'أول دورة مكتملة'), icon: '🎓', earned: true },
    { title: t('Fast Learner', 'متعلم سريع'), icon: '⚡', earned: true },
    { title: t('7-Day Streak', 'سلسلة 7 أيام'), icon: '🔥', earned: true },
    { title: t('Dedicated Scholar', 'باحث مُلتزم'), icon: '📚', earned: false },
    { title: t('Subject Expert', 'خبير في التخصص'), icon: '🏆', earned: false },
    { title: t('Community Mentor', 'مرشد مجتمعي'), icon: '🤝', earned: false },
  ];

  const categoryFilters = [
    { key: 'All', label: t('All', 'الكل') },
    { key: 'Technology', label: t('Technology', 'تكنولوجيا') },
    { key: 'Business', label: t('Business', 'أعمال') },
    { key: 'Finance', label: t('Finance', 'مالية') },
    { key: 'Language', label: t('Language', 'لغات') },
  ];

  const [catalogFilter, setCatalogFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCatalog = catalogCourses.filter(c => {
    const matchCat = catalogFilter === 'All' || c.category === catalogFilter;
    const matchSearch = !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getCategoryColor = (cat: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      'Technology': { bg: '#DBEAFE', color: '#1E40AF' },
      'Business': { bg: '#FEF3C7', color: '#92400E' },
      'Marketing': { bg: '#F3E8FF', color: '#6B21A8' },
      'Finance': { bg: '#DCFCE7', color: '#166534' },
      'Language': { bg: '#FFF1F2', color: '#BE123C' },
    };
    return map[cat] || { bg: '#F3F4F6', color: brand.textSecondary };
  };

  const getLevelColor = (level: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      'Beginner': { bg: '#DCFCE7', color: '#166534' },
      'Intermediate': { bg: '#FEF3C7', color: '#92400E' },
      'Advanced': { bg: '#FEE2E2', color: '#991B1B' },
    };
    return map[level] || { bg: '#F3F4F6', color: brand.textSecondary };
  };

  const stats = [
    { value: '120+', label: t('Online Courses', 'الدورات عبر الإنترنت'), icon: Monitor },
    { value: '3,500+', label: t('Active Learners', 'المتعلمون النشطون'), icon: Users },
    { value: '40+', label: t('Subject Areas', 'مجال تخصصي'), icon: BookOpen },
    { value: '85+', label: t('Certifications', 'الشهادات'), icon: Trophy },
  ];

  const tabs = [
    {
      id: 'courses', label: t('My Courses', 'دوراتي'),
      icon: <Monitor className="h-4 w-4" />,
      content: (
        <div>
          <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20 }}>
            {t(
              `${myCourses.length} course${myCourses.length !== 1 ? 's' : ''} in progress`,
              `${myCourses.length} ${myCourses.length === 1 ? 'دورة قيد التقدم' : 'دورات قيد التقدم'}`
            )}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {myCourses.map(c => {
              const catColor = getCategoryColor(c.category);
              const lvlColor = getLevelColor(c.level);
              return (
                <div
                  key={c.id}
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
                  {/* Progress accent bar */}
                  <div style={{ height: 4, background: '#F3F4F6' }}>
                    <div style={{
                      height: '100%', background: c.progress >= 80 ? '#16A34A' : brand.primary,
                      width: `${c.progress}%`, transition: 'width 300ms',
                    }} />
                  </div>

                  <div style={{ padding: 22 }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        background: catColor.bg, color: catColor.color,
                      }}>
                        {c.categoryLabel}
                      </span>
                      <span style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        background: lvlColor.bg, color: lvlColor.color,
                      }}>
                        {c.levelLabel}
                      </span>
                      <span style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        background: '#F3F4F6', color: brand.textSecondary,
                      }}>
                        {c.duration}
                      </span>
                    </div>

                    {/* Title & instructor */}
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary, marginBottom: 4 }}>
                      {c.title}
                    </h3>
                    <p style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 12 }}>
                      {t('Instructor:', 'المحاضر:')} {c.instructor}
                    </p>

                    <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 16 }}>
                      {c.description}
                    </p>

                    {/* Progress bar */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: brand.textSecondary }}>{t('Progress', 'التقدم')}</span>
                        <span style={{ fontWeight: 600, color: c.progress >= 80 ? '#16A34A' : brand.primary }}>{c.progress}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          background: c.progress >= 80 ? '#16A34A' : brand.primary,
                          width: `${c.progress}%`, transition: 'width 300ms',
                        }} />
                      </div>
                    </div>

                    {/* Next lesson */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', borderRadius: 10, background: brand.primarySurface,
                      marginBottom: 16, fontSize: 13,
                    }}>
                      <Play style={{ width: 14, height: 14, color: brand.primary, flexShrink: 0 }} />
                      <span style={{ color: brand.textSecondary }}>{t('Next:', 'التالي:')}</span>
                      <span style={{ color: brand.primary, fontWeight: 500 }}>{c.nextLesson}</span>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: brand.textSecondary }}>
                        {c.students} {t('students enrolled', 'طالب مسجّل')}
                      </span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '10px 22px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                        background: brand.primary, color: '#fff',
                        cursor: 'pointer',
                      }}>
                        {t('Continue', 'متابعة')} <ArrowIcon style={{ width: 16, height: 16 }} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      id: 'catalog', label: t('Course Catalog', 'كتالوج الدورات'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div>
          {/* Search and filter */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
              <input
                type="text"
                placeholder={t('Search courses, instructors…', 'ابحث عن الدورات والمحاضرين...')}
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
                  onClick={() => setCatalogFilter(cat.key)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    border: catalogFilter === cat.key ? 'none' : `1px solid ${brand.border}`,
                    background: catalogFilter === cat.key ? brand.primary : '#fff',
                    color: catalogFilter === cat.key ? '#fff' : brand.textSecondary,
                    cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20 }}>
            {t(
              `Showing ${filteredCatalog.length} course${filteredCatalog.length !== 1 ? 's' : ''}`,
              `عرض ${filteredCatalog.length} ${filteredCatalog.length === 1 ? 'دورة' : 'دورات'}`
            )}
          </p>

          {filteredCatalog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <BookOpen style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('No courses found', 'لم يتم العثور على دورات')}</h3>
              <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Try adjusting your search or filter.', 'حاول تعديل معايير البحث أو التصفية.')}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {filteredCatalog.map(c => {
                const catColor = getCategoryColor(c.category);
                const lvlColor = getLevelColor(c.level);
                return (
                  <div
                    key={c.id}
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
                    <div style={{ height: 4, background: c.featured ? brand.primary : brand.border }} />

                    <div style={{ padding: 22 }}>
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: catColor.bg, color: catColor.color,
                        }}>
                          {c.categoryLabel}
                        </span>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: lvlColor.bg, color: lvlColor.color,
                        }}>
                          {c.levelLabel}
                        </span>
                        {c.featured && (
                          <span style={{
                            padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                            background: '#FEF3C7', color: '#92400E',
                          }}>
                            ★ {t('Featured', 'مميّز')}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary, marginBottom: 4 }}>
                        {c.title}
                      </h3>
                      <p style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 12 }}>
                        {t('Instructor:', 'المحاضر:')} {c.instructor}
                      </p>
                      <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 16 }}>
                        {c.description}
                      </p>

                      {/* Duration & rating row */}
                      <div style={{
                        display: 'flex', gap: 0, marginBottom: 16,
                        borderRadius: 12, background: brand.primarySurface, overflow: 'hidden',
                      }}>
                        <div style={{ flex: 1, padding: '10px 14px' }}>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{t('Duration', 'المدة')}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: brand.primary }}>{c.duration}</div>
                        </div>
                        <div style={{ width: 1, background: brand.border }} />
                        <div style={{ flex: 1, padding: '10px 14px' }}>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{t('Rating', 'التقييم')}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star style={{ width: 14, height: 14, color: '#F59E0B', fill: '#F59E0B' }} />
                            <span style={{ fontSize: 15, fontWeight: 700, color: brand.primary }}>{c.rating}</span>
                          </div>
                        </div>
                        <div style={{ width: 1, background: brand.border }} />
                        <div style={{ flex: 1, padding: '10px 14px' }}>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{t('Students', 'الطلاب')}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: brand.primary }}>{c.students}</div>
                        </div>
                      </div>

                      {/* Enroll button */}
                      <div style={{ display: 'flex', justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '10px 22px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                          background: brand.primary, color: '#fff', cursor: 'pointer',
                        }}>
                          {t('Enroll Now', 'سجّل الآن')} <ArrowIcon style={{ width: 16, height: 16 }} />
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
      id: 'achievements', label: t('Achievements', 'الإنجازات'),
      icon: <Trophy className="h-4 w-4" />,
      content: (
        <div>
          {/* Summary stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16, marginBottom: 28,
          }}>
            {[
              { value: '3', label: t('Courses Completed', 'دورات مكتملة'), color: brand.primary },
              { value: '2', label: t('Certificates Earned', 'شهادات مكتسبة'), color: '#16A34A' },
              { value: '45h', label: t('Total Learning', 'إجمالي التعلم'), color: '#7C3AED' },
              { value: '7', label: t('Day Streak', 'أيام متتالية'), color: '#EA580C' },
            ].map((s, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 14, border: `1px solid ${brand.border}`,
                padding: '18px 16px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: brand.textSecondary }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Badge grid */}
          <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 14 }}>{t('Badges', 'الشارات')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {achievements.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 14,
                background: a.earned ? brand.primarySurface : '#fff',
                border: `1px solid ${a.earned ? brand.primary : brand.border}`,
                opacity: a.earned ? 1 : 0.6,
              }}>
                <span style={{ fontSize: 28 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: a.earned ? brand.primary : brand.textSecondary }}>
                    {a.earned ? t('✓ Earned', '✓ مكتسبة') : t('Not yet earned', 'لم تُكتسب بعد')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'progress', label: t('My Progress', 'تقدّمي'),
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {/* Overall Progress */}
          <div style={{
            background: '#fff', borderRadius: 16,
            border: `1px solid ${brand.border}`, padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BarChart3 style={{ width: 18, height: 18, color: brand.primary }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary }}>{t('Overall Progress', 'التقدم العام')}</h3>
            </div>

            {[
              { label: t('Completion Rate', 'نسبة الإكمال'), value: 68 },
              { label: t('Average Score', 'متوسط الدرجات'), value: 85 },
              { label: t('Assignment Submission', 'تسليم الواجبات'), value: 92 },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: brand.textSecondary }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: brand.primary }}>{item.value}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: brand.primary,
                    width: `${item.value}%`, transition: 'width 300ms',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Time & Goals */}
          <div style={{
            background: '#fff', borderRadius: 16,
            border: `1px solid ${brand.border}`, padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Clock style={{ width: 18, height: 18, color: '#1E40AF' }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary }}>{t('Time & Goals', 'الوقت والأهداف')}</h3>
            </div>

            {[
              { icon: <Clock style={{ width: 16, height: 16, color: brand.primary }} />, label: t('Weekly Goal', 'الهدف الأسبوعي'), value: t('3.5 / 5 hours', '3.5 / 5 ساعات'), pct: 70 },
              { icon: <Clock style={{ width: 16, height: 16, color: '#7C3AED' }} />, label: t('Monthly Goal', 'الهدف الشهري'), value: t('14 / 20 hours', '14 / 20 ساعة'), pct: 70 },
              { icon: <Flame style={{ width: 16, height: 16, color: '#EA580C' }} />, label: t('Current Streak', 'السلسلة الحالية'), value: t('7 days', '7 أيام'), pct: 100 },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12, background: '#F9FAFB',
                marginBottom: 12,
              }}>
                {item.icon}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: brand.textSecondary }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <EducationPathwayLayout
      title={t('Learning Management System', 'نظام إدارة التعلم')}
      description={t(
        'Access online courses, track your progress, earn certifications, and develop your skills with our comprehensive e-learning platform.',
        'الوصول إلى الدورات عبر الإنترنت وتتبع تقدمك والحصول على شهادات وتطوير مهاراتك عبر منصتنا الشاملة للتعلم الإلكتروني.'
      )}
      icon={<Monitor className="h-12 w-12" style={{ color: '#0D9488' }} />}
      stats={stats}
      tabs={tabs}
      defaultTab="courses"
      actionButtonText={t('Browse Courses', 'تصفح الدورات')}
      actionButtonHref="#catalog"
      academicYear="2025-2026"
    />
  );
};

export default LMSPage;
