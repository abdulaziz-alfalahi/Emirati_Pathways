
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { Award, Users, DollarSign, GraduationCap, Calendar, Clock, ExternalLink, CheckCircle, ArrowRight, ArrowLeft, Star, Globe, BookOpen } from 'lucide-react';

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
};

const ScholarshipsPage: React.FC = () => {

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  // Scholarship data (translated)
  const scholarships = [
    {
      id: '1',
      title: t('EHRDC Excellence Award', 'جائزة التميز من مؤسسة الإمارات للتنمية'),
      description: t(
        'Full scholarship for UAE nationals demonstrating outstanding academic achievement and community leadership.',
        'منحة دراسية كاملة للمواطنين الإماراتيين الذين يُظهرون تميزاً أكاديمياً بارزاً وقيادة مجتمعية.'
      ),
      amount: t('AED 150,000', '150,000 د.إ'),
      amountType: t('per year', 'سنوياً'),
      eligibility: t('UAE nationals, GPA 3.7+', 'مواطنون إماراتيون، معدل 3.7+'),
      deadline: t('March 31, 2026', '31 مارس 2026'),
      category: 'Merit-Based',
      categoryLabel: t('Merit-Based', 'قائمة على الجدارة'),
      level: t('Undergraduate & Graduate', 'بكالوريوس وماجستير'),
      spots: 25,
      applicants: 180,
      featured: true,
      benefits: [
        t('Full tuition coverage', 'تغطية الرسوم الدراسية كاملة'),
        t('Living stipend', 'بدل معيشة'),
        t('Research funding', 'تمويل البحث'),
        t('Mentorship program', 'برنامج إرشادي'),
      ],
    },
    {
      id: '2',
      title: t('STEM Innovation Scholarship', 'منحة الابتكار في العلوم والتكنولوجيا'),
      description: t(
        'Supporting the next generation of Emirati innovators in science, technology, engineering, and mathematics fields.',
        'دعم الجيل القادم من المبتكرين الإماراتيين في مجالات العلوم والتكنولوجيا والهندسة والرياضيات.'
      ),
      amount: t('AED 120,000', '120,000 د.إ'),
      amountType: t('per year', 'سنوياً'),
      eligibility: t('STEM majors, GPA 3.5+', 'تخصصات STEM، معدل 3.5+'),
      deadline: t('April 15, 2026', '15 أبريل 2026'),
      category: 'Field-Specific',
      categoryLabel: t('Field-Specific', 'حسب التخصص'),
      level: t('Undergraduate', 'بكالوريوس'),
      spots: 40,
      applicants: 210,
      featured: true,
      benefits: [
        t('Tuition support', 'دعم الرسوم الدراسية'),
        t('Lab equipment allowance', 'بدل معدات المختبر'),
        t('Industry internship', 'تدريب عملي في الصناعة'),
        t('Conference sponsorship', 'رعاية المؤتمرات'),
      ],
    },
    {
      id: '3',
      title: t('Community Leadership Grant', 'منحة القيادة المجتمعية'),
      description: t(
        'Recognizing UAE nationals who have made significant contributions to community development and social impact.',
        'تقدير المواطنين الإماراتيين الذين قدموا مساهمات كبيرة في تنمية المجتمع والأثر الاجتماعي.'
      ),
      amount: t('AED 80,000', '80,000 د.إ'),
      amountType: t('per year', 'سنوياً'),
      eligibility: t('Community service record', 'سجل خدمة مجتمعية'),
      deadline: t('May 1, 2026', '1 مايو 2026'),
      category: 'Leadership',
      categoryLabel: t('Leadership', 'قيادة'),
      level: t('All Levels', 'جميع المستويات'),
      spots: 30,
      applicants: 95,
      featured: false,
      benefits: [
        t('Partial tuition', 'رسوم دراسية جزئية'),
        t('Community project funding', 'تمويل مشاريع مجتمعية'),
        t('Leadership workshops', 'ورش عمل قيادية'),
      ],
    },
    {
      id: '4',
      title: t('Women in Technology Award', 'جائزة المرأة في التكنولوجيا'),
      description: t(
        'Empowering Emirati women pursuing careers in technology, cybersecurity, AI, and data science.',
        'تمكين المرأة الإماراتية الساعية لمسيرة مهنية في التكنولوجيا والأمن السيبراني والذكاء الاصطناعي وعلوم البيانات.'
      ),
      amount: t('AED 100,000', '100,000 د.إ'),
      amountType: t('per year', 'سنوياً'),
      eligibility: t('Female UAE nationals, Tech fields', 'مواطنات إماراتيات، تخصصات تقنية'),
      deadline: t('April 30, 2026', '30 أبريل 2026'),
      category: 'Diversity',
      categoryLabel: t('Diversity', 'تنوع'),
      level: t('Undergraduate & Graduate', 'بكالوريوس وماجستير'),
      spots: 20,
      applicants: 120,
      featured: true,
      benefits: [
        t('Full tuition', 'رسوم دراسية كاملة'),
        t('Networking events', 'فعاليات التواصل'),
        t('Industry mentorship', 'إرشاد مهني'),
        t('Career placement support', 'دعم التوظيف'),
      ],
    },
    {
      id: '5',
      title: t('Graduate Research Fellowship', 'زمالة البحث للدراسات العليا'),
      description: t(
        'Supporting advanced research by Emirati graduate students in priority national development areas.',
        'دعم البحث المتقدم لطلاب الدراسات العليا الإماراتيين في مجالات التنمية الوطنية ذات الأولوية.'
      ),
      amount: t('AED 200,000', '200,000 د.إ'),
      amountType: t('total', 'إجمالي'),
      eligibility: t("Master's or PhD candidates", 'مرشحون للماجستير أو الدكتوراه'),
      deadline: t('June 15, 2026', '15 يونيو 2026'),
      category: 'Research',
      categoryLabel: t('Research', 'بحث'),
      level: t('Graduate', 'دراسات عليا'),
      spots: 15,
      applicants: 65,
      featured: false,
      benefits: [
        t('Research stipend', 'بدل بحثي'),
        t('Travel grants', 'منح سفر'),
        t('Publication support', 'دعم النشر'),
        t('Lab access', 'الوصول للمختبرات'),
      ],
    },
    {
      id: '6',
      title: t('Creative Arts & Culture Scholarship', 'منحة الفنون الإبداعية والثقافة'),
      description: t(
        'Fostering Emirati talent in visual arts, performing arts, heritage preservation, and creative industries.',
        'رعاية المواهب الإماراتية في الفنون البصرية والأداء وحفظ التراث والصناعات الإبداعية.'
      ),
      amount: t('AED 75,000', '75,000 د.إ'),
      amountType: t('per year', 'سنوياً'),
      eligibility: t('Arts & Humanities majors', 'تخصصات الفنون والعلوم الإنسانية'),
      deadline: t('May 15, 2026', '15 مايو 2026'),
      category: 'Arts',
      categoryLabel: t('Arts', 'فنون'),
      level: t('Undergraduate', 'بكالوريوس'),
      spots: 20,
      applicants: 70,
      featured: false,
      benefits: [
        t('Studio access', 'الوصول للاستوديو'),
        t('Exhibition funding', 'تمويل المعارض'),
        t('Cultural exchange trips', 'رحلات تبادل ثقافي'),
      ],
    },
  ];

  const categories = [
    { key: 'All', label: t('All', 'الكل') },
    { key: 'Merit-Based', label: t('Merit-Based', 'قائمة على الجدارة') },
    { key: 'Field-Specific', label: t('Field-Specific', 'حسب التخصص') },
    { key: 'Leadership', label: t('Leadership', 'قيادة') },
    { key: 'Diversity', label: t('Diversity', 'تنوع') },
    { key: 'Research', label: t('Research', 'بحث') },
    { key: 'Arts', label: t('Arts', 'فنون') },
  ];

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = scholarships.filter(s => {
    const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
    const matchSearch = !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const stats = [
    { value: '45+', label: t('Available Scholarships', 'المنح المتاحة'), icon: Award },
    { value: '500+', label: t('Recipients Annually', 'مستفيدون سنوياً'), icon: Users },
    { value: t('AED 12M+', '12 م+ د.إ'), label: t('Total Awards', 'إجمالي الجوائز'), icon: DollarSign },
    { value: '30+', label: t('Partner Universities', 'الجامعات الشريكة'), icon: GraduationCap },
  ];

  const getCategoryColor = (cat: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      'Merit-Based': { bg: brand.amber, color: brand.amberText },
      'Field-Specific': { bg: brand.blue, color: brand.blueText },
      'Leadership': { bg: brand.green, color: brand.greenText },
      'Diversity': { bg: '#F3E8FF', color: '#6B21A8' },
      'Research': { bg: brand.primarySurface, color: brand.primary },
      'Arts': { bg: '#FFF1F2', color: '#BE123C' },
    };
    return map[cat] || { bg: '#F3F4F6', color: brand.textSecondary };
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const tabs = [
    {
      id: 'available', label: t('Available Scholarships', 'المنح المتاحة'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <div>
          {/* Search and filter bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
              <input
                type="text"
                placeholder={t('Search scholarships…', 'ابحث عن المنح الدراسية...')}
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
              {categories.map(cat => (
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
              `Showing ${filtered.length} scholarship${filtered.length !== 1 ? 's' : ''}`,
              `عرض ${filtered.length} ${filtered.length === 1 ? 'منحة' : 'منح دراسية'}`
            )}
          </p>

          {/* Scholarship cards */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Award style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('No scholarships found', 'لم يتم العثور على منح')}</h3>
              <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Try adjusting your search or filter criteria.', 'حاول تعديل معايير البحث أو التصفية.')}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {filtered.map(s => {
                const catColor = getCategoryColor(s.category);
                return (
                  <div
                    key={s.id}
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
                    {/* Card header accent */}
                    <div style={{ height: 4, background: s.featured ? brand.primary : brand.border }} />

                    <div style={{ padding: 22 }}>
                      {/* Badges row */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: catColor.bg, color: catColor.color,
                        }}>
                          {s.categoryLabel}
                        </span>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: '#F3F4F6', color: brand.textSecondary,
                        }}>
                          {s.level}
                        </span>
                        {s.featured && (
                          <span style={{
                            padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                            background: brand.amber, color: brand.amberText,
                          }}>
                            ★ {t('Featured', 'مميّزة')}
                          </span>
                        )}
                      </div>

                      {/* Title & description */}
                      <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>
                        {s.title}
                      </h3>
                      <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 18 }}>
                        {s.description}
                      </p>

                      {/* Award amount highlight */}
                      <div style={{
                        display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16,
                        padding: '12px 16px', borderRadius: 12, background: brand.primarySurface,
                      }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: brand.primary }}>{s.amount}</span>
                        <span style={{ fontSize: 13, color: brand.primaryDark, fontWeight: 500 }}>{s.amountType}</span>
                      </div>

                      {/* Benefits */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {s.benefits.map((b, i) => (
                            <span key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 12, color: brand.textSecondary,
                              padding: '3px 8px', borderRadius: 8, background: '#F9FAFB',
                            }}>
                              <CheckCircle style={{ width: 12, height: 12, color: brand.primary }} />
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Meta row */}
                      <div style={{
                        display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap',
                        padding: '10px 0', borderTop: `1px solid ${brand.border}`,
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: brand.textSecondary }}>
                          <GraduationCap style={{ width: 14, height: 14 }} /> {s.eligibility}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: brand.textSecondary }}>
                          <Clock style={{ width: 14, height: 14 }} /> {t('Deadline:', 'الموعد النهائي:')} <strong style={{ color: '#DC2626' }}>{s.deadline}</strong>
                        </span>
                      </div>

                      {/* Competition bar */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: brand.textSecondary, marginBottom: 4 }}>
                          <span>{s.spots} {t('spots available', 'مقعد متاح')}</span>
                          <span>{s.applicants} {t('applicants', 'متقدم')}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6' }}>
                          <div style={{
                            height: '100%', borderRadius: 2,
                            background: (s.applicants / s.spots) > 5 ? '#DC2626' : brand.primary,
                            width: `${Math.min(100, (s.applicants / (s.spots * 8)) * 100)}%`,
                            transition: 'width 300ms',
                          }} />
                        </div>
                      </div>

                      {/* Footer */}
                      <div style={{ display: 'flex', justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '10px 22px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                          background: brand.primary, color: '#fff',
                          cursor: 'pointer', transition: 'background 150ms',
                          border: 'none',
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
      )
    },
    {
      id: 'my-applications', label: t('My Applications', 'طلباتي'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <BookOpen style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('No applications yet', 'لا توجد طلبات بعد')}</h3>
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Apply for scholarships to track your applications here.', 'قدّم على المنح الدراسية لتتبع طلباتك هنا.')}</p>
        </div>
      )
    },
    {
      id: 'resources', label: t('Resources & Tips', 'الموارد والنصائح'),
      icon: <Globe className="h-4 w-4" />,
      content: (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Globe style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Application Resources', 'موارد التقديم')}</h3>
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Guides, tips, and resources for preparing strong scholarship applications.', 'أدلة ونصائح وموارد لإعداد طلبات منح دراسية قوية.')}</p>
        </div>
      )
    }
  ];

  return (
    <EducationPathwayLayout
      title={t('Scholarships', 'المنح الدراسية')}
      description={t(
        'Explore scholarship opportunities designed to support UAE nationals in pursuing academic excellence and professional development.',
        'استكشف فرص المنح الدراسية المصممة لدعم المواطنين الإماراتيين في تحقيق التميز الأكاديمي والتطوير المهني.'
      )}
      icon={<Award className="h-12 w-12" style={{ color: '#0D9488' }} />}
      stats={stats}
      tabs={tabs}
      defaultTab="available"
      actionButtonText={t('Browse Scholarships', 'تصفح المنح الدراسية')}
      actionButtonHref="#available"
      academicYear="2025-2026"
    />
  );
};

export default ScholarshipsPage;
