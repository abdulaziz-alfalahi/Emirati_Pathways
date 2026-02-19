
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { BookOpen, Users, Calendar, Trophy, MapPin, Clock, Star, ArrowRight, Search } from 'lucide-react';

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
};

// Mock camp data
const mockCamps = [
  {
    id: '1', title: { en: 'Coding Bootcamp for Teens', ar: 'معسكر البرمجة للمراهقين' },
    category: 'Technology', ageGroup: '14-18', location: 'Dubai Internet City',
    duration: '4 weeks', price: 'AED 2,500', rating: 4.8, enrolled: 45, capacity: 60,
    description: { en: 'Learn Python, JavaScript, and app development in this intensive knowledge camp.', ar: 'تعلم بايثون وجافاسكريبت وتطوير التطبيقات في هذا المعسكر المعرفي المكثف.' },
    featured: true
  },
  {
    id: '2', title: { en: 'Robotics & AI Camp', ar: 'معسكر الروبوتات والذكاء الاصطناعي' },
    category: 'Technology', ageGroup: '10-16', location: 'Dubai Silicon Oasis',
    duration: '3 weeks', price: 'AED 2,200', rating: 4.7, enrolled: 38, capacity: 50,
    description: { en: 'Build and program robots using the latest AI technologies.', ar: 'ابنِ وبرمج الروبوتات باستخدام أحدث تقنيات الذكاء الاصطناعي.' },
    featured: false
  },
  {
    id: '3', title: { en: 'Creative Arts Workshop', ar: 'ورشة الفنون الإبداعية' },
    category: 'Arts', ageGroup: '8-14', location: 'Dubai Media City',
    duration: '2 weeks', price: 'AED 1,800', rating: 4.9, enrolled: 28, capacity: 30,
    description: { en: 'Explore painting, sculpture, digital art and creative expression.', ar: 'استكشف الرسم والنحت والفن الرقمي والتعبير الإبداعي.' },
    featured: true
  },
  {
    id: '4', title: { en: 'Young Scientists Academy', ar: 'أكاديمية العلماء الصغار' },
    category: 'Science', ageGroup: '10-16', location: 'DIFC',
    duration: '3 weeks', price: 'AED 2,000', rating: 4.6, enrolled: 32, capacity: 40,
    description: { en: 'Hands-on experiments in physics, chemistry, and biology.', ar: 'تجارب عملية في الفيزياء والكيمياء والأحياء.' },
    featured: false
  },
  {
    id: '5', title: { en: 'Leadership & Public Speaking', ar: 'القيادة والخطابة' },
    category: 'Leadership', ageGroup: '14-18', location: 'Business Bay',
    duration: '2 weeks', price: 'AED 1,500', rating: 4.5, enrolled: 20, capacity: 25,
    description: { en: 'Develop leadership skills, public speaking, and confidence.', ar: 'طوّر مهارات القيادة والخطابة والثقة بالنفس.' },
    featured: false
  },
  {
    id: '6', title: { en: 'Sports Excellence Program', ar: 'برنامج التميز الرياضي' },
    category: 'Sports', ageGroup: '6-9', location: 'Dubai Marina',
    duration: '4 weeks', price: 'AED 1,900', rating: 4.7, enrolled: 52, capacity: 60,
    description: { en: 'Multi-sport training including swimming, football, basketball, and athletics.', ar: 'تدريب رياضات متعددة تشمل السباحة وكرة القدم والسلة وألعاب القوى.' },
    featured: true
  },
];

const categories = [
  { id: 'All', en: 'All', ar: 'الكل' },
  { id: 'Technology', en: 'Technology', ar: 'التكنولوجيا' },
  { id: 'Science', en: 'Science', ar: 'العلوم' },
  { id: 'Arts', en: 'Arts', ar: 'الفنون' },
  { id: 'Leadership', en: 'Leadership', ar: 'القيادة' },
  { id: 'Sports', en: 'Sports', ar: 'الرياضة' },
];

const SummerCampsPage: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as 'en' | 'ar';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Inline bilingual helper — same pattern as SchoolProgramsPage
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;

  const filtered = mockCamps.filter(camp => {
    const matchCat = selectedCategory === 'All' || camp.category === selectedCategory;
    const matchSearch = !searchQuery || camp.title[lang].toLowerCase().includes(searchQuery.toLowerCase())
      || camp.category.toLowerCase().includes(searchQuery.toLowerCase())
      || camp.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const stats = [
    { value: '+50', label: t('Knowledge Programs', 'برامج معرفية'), icon: BookOpen },
    { value: '+1,200', label: t('Students Enrolled', 'الطلاب المسجلين'), icon: Users },
    { value: '+15', label: t('Partner Institutions', 'المؤسسات الشريكة'), icon: Calendar },
    { value: '7', label: t('Emirates Covered', 'الإمارات المشمولة'), icon: Trophy },
  ];

  const tabs = [
    {
      id: 'available', label: t('Available Programs', 'البرامج المتاحة'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div>
          {/* Search and filter bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
              <input
                type="text"
                placeholder={t('Search programs…', 'البحث في البرامج...')}
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

            {/* Category pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    border: selectedCategory === cat.id ? 'none' : `1px solid ${brand.border}`,
                    background: selectedCategory === cat.id ? brand.primary : '#fff',
                    color: selectedCategory === cat.id ? '#fff' : brand.textSecondary,
                    cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap',
                  }}
                >
                  {cat[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Camp cards grid */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <BookOpen style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('No programs found', 'لم يتم العثور على برامج')}
              </h3>
              <p style={{ color: brand.textSecondary, fontSize: 14 }}>
                {t('Try adjusting your search or filter criteria.', 'حاول تعديل معايير البحث أو التصفية.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filtered.map(camp => (
                <div
                  key={camp.id}
                  style={{
                    background: '#fff', borderRadius: 16,
                    border: `1px solid ${brand.border}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    overflow: 'hidden', transition: 'border-color 150ms',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = brand.primary)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = brand.border)}
                >
                  <div style={{ height: 4, background: camp.featured ? brand.primary : brand.border }} />
                  <div style={{ padding: 20 }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        background: brand.primarySurface, color: brand.primary,
                      }}>
                        {camp.category}
                      </span>
                      <span style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        background: '#F3F4F6', color: brand.textSecondary,
                      }}>
                        {t(`Ages ${camp.ageGroup}`, `الأعمار ${camp.ageGroup}`)}
                      </span>
                      {camp.featured && (
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: brand.amber, color: brand.amberText,
                        }}>
                          {t('★ Featured', '★ مميز')}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                      {camp.title[lang]}
                    </h3>
                    <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 16 }}>
                      {camp.description[lang]}
                    </p>

                    {/* Meta row */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: brand.textSecondary }}>
                        <MapPin style={{ width: 14, height: 14 }} /> {camp.location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: brand.textSecondary }}>
                        <Clock style={{ width: 14, height: 14 }} /> {camp.duration}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: brand.textSecondary }}>
                        <Star style={{ width: 14, height: 14 }} /> {camp.rating}
                      </span>
                    </div>

                    {/* Enrollment progress */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: brand.textSecondary, marginBottom: 4 }}>
                        <span>{camp.enrolled} / {camp.capacity} {t('enrolled', 'مسجل')}</span>
                        <span>{Math.round((camp.enrolled / camp.capacity) * 100)}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6' }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          background: brand.primary,
                          width: `${Math.min(100, (camp.enrolled / camp.capacity) * 100)}%`,
                          transition: 'width 300ms',
                        }} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 18, fontWeight: 600, color: brand.primary }}>{camp.price}</span>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 14, fontWeight: 500, color: brand.primary, cursor: 'pointer',
                      }}>
                        {t('Register', 'سجل الآن')} <ArrowRight style={{ width: 16, height: 16 }} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'registrations', label: t('My Registrations', 'تسجيلاتي'),
      icon: <Users className="h-4 w-4" />,
      content: (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Users style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
            {t('No registrations yet', 'لا توجد تسجيلات حتى الآن')}
          </h3>
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>
            {t('Browse available programs and register to see them here.', 'تصفح البرامج المتاحة وسجل لعرضها هنا.')}
          </p>
        </div>
      )
    },
    {
      id: 'resources', label: t('Resources', 'الموارد'),
      icon: <Calendar className="h-4 w-4" />,
      content: (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Calendar style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
            {t('Program Resources', 'موارد البرامج')}
          </h3>
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>
            {t('Resources and materials for registered programs will appear here.', 'ستظهر هنا الموارد والمواد للبرامج المسجل بها.')}
          </p>
        </div>
      )
    }
  ];

  return (
    <EducationPathwayLayout
      title={t('Knowledge Camps', 'معسكرات المعرفة')}
      description={t(
        'Discover enriching knowledge programs designed to develop skills, creativity, and leadership in young Emiratis.',
        'اكتشف برامج معرفية إثرائية مصممة لتنمية المهارات والإبداع والقيادة لدى الشباب الإماراتي.'
      )}
      icon={<BookOpen className="h-12 w-12" style={{ color: '#0D9488' }} />}
      stats={stats}
      tabs={tabs}
      defaultTab="available"
      actionButtonText={t('Browse Programs', 'تصفح البرامج')}
      actionButtonHref="#available"
      academicYear="2025-2026"
    />
  );
};

export default SummerCampsPage;
