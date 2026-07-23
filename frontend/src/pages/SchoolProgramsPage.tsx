// School Programs Page — Migrated to EducationPathwayLayout
// Consistent interface with Knowledge Camps and other Education Pathway pages

import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Users,
  Star,
  BookOpen,
  Award,
  ArrowRight,
  Grid,
  List,
  X,
  GraduationCap,
  Building2,
  TrendingUp
} from 'lucide-react';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import { schoolProgramsAPIService } from '../services/schoolProgramsServiceAPI';
import { useTranslation } from 'react-i18next';

// Brand tokens
const brand = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#CCFBF1',
  primarySurface: '#F0FDFA',
  bg: '#FAFBFC',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
};

// Mock data
const mockPrograms = [
  {
    id: 'prog-001',
    title: { en: 'Advanced STEM Innovation Program', ar: 'برنامج الابتكار المتقدم في العلوم والتكنولوجيا' },
    description: {
      en: 'A comprehensive STEM program focusing on robotics, AI, and sustainable technology solutions for future innovators.',
      ar: 'برنامج شامل في العلوم والتكنولوجيا يركز على الروبوتات والذكاء الاصطناعي.'
    },
    school: { name: { en: 'Dubai International Academy', ar: 'أكاديمية دبي الدولية' }, location: 'Al Barsha, Dubai' },
    category: 'STEM',
    ageRange: { min: 14, max: 18 },
    duration: '2 years',
    fees: { currency: 'AED', amount: 25000 },
    rating: 4.8,
    enrolledStudents: 120,
    maxCapacity: 150,
    featured: true
  },
  {
    id: 'prog-002',
    title: { en: 'Creative Arts Excellence Program', ar: 'برنامج التميز في الفنون الإبداعية' },
    description: {
      en: 'Develop artistic talents through comprehensive visual and performing arts education with world-class mentors.',
      ar: 'تطوير المواهب الفنية من خلال التعليم الشامل للفنون البصرية والأدائية.'
    },
    school: { name: { en: 'GEMS Wellington Academy', ar: 'أكاديمية جيمس ويلينغتون' }, location: 'Silicon Oasis, Dubai' },
    category: 'Arts',
    ageRange: { min: 12, max: 17 },
    duration: '3 years',
    fees: { currency: 'AED', amount: 22000 },
    rating: 4.6,
    enrolledStudents: 85,
    maxCapacity: 100,
    featured: true
  },
  {
    id: 'prog-003',
    title: { en: 'Sports Leadership Academy', ar: 'أكاديمية القيادة الرياضية' },
    description: {
      en: 'Combine athletic excellence with leadership development and academic achievement in a structured program.',
      ar: 'دمج التميز الرياضي مع تطوير القيادة والإنجاز الأكاديمي.'
    },
    school: { name: { en: 'American School of Dubai', ar: 'المدرسة الأمريكية في دبي' }, location: 'Jumeirah, Dubai' },
    category: 'Sports',
    ageRange: { min: 13, max: 18 },
    duration: '4 years',
    fees: { currency: 'AED', amount: 28000 },
    rating: 4.7,
    enrolledStudents: 95,
    maxCapacity: 120,
    featured: false
  }
];

const SchoolProgramsPage: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as 'en' | 'ar';
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;

  const [programs, setPrograms] = useState<any[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);

  const categories = [
    { id: 'all', name: { en: 'All Programs', ar: 'جميع البرامج' } },
    { id: 'STEM', name: { en: 'STEM', ar: 'العلوم والتكنولوجيا' } },
    { id: 'Arts', name: { en: 'Arts', ar: 'الفنون' } },
    { id: 'Sports', name: { en: 'Sports', ar: 'الرياضة' } },
    { id: 'Languages', name: { en: 'Languages', ar: 'اللغات' } }
  ];

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setLoading(true);
        const response = await schoolProgramsAPIService.getPrograms({ status: 'published' });
        const transformedPrograms = response.programs.map((program: any) => ({
          id: program.id,
          title: program.title,
          description: program.description,
          school: { name: program.school.name, location: program.school.location },
          category: program.category,
          ageRange: program.targetAge,
          duration: `${program.duration.value} ${program.duration.unit}`,
          fees: program.fees,
          rating: program.successMetrics?.satisfactionScore || 4.5,
          enrolledStudents: program.capacity.total - program.capacity.available,
          maxCapacity: program.capacity.total,
          featured: program.featured || false
        }));
        setPrograms(transformedPrograms);
        setFilteredPrograms(transformedPrograms);
      } catch {
        setPrograms(mockPrograms);
        setFilteredPrograms(mockPrograms);
      } finally {
        setLoading(false);
      }
    };
    loadPrograms();
  }, []);

  useEffect(() => {
    let filtered = programs;
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title.ar.includes(searchQuery) ||
        p.school.name.en.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    setFilteredPrograms(filtered);
  }, [searchQuery, selectedCategory, programs]);

  const openProgramModal = (program: any) => { setSelectedProgram(program); setShowProgramModal(true); };
  const closeProgramModal = () => { setSelectedProgram(null); setShowProgramModal(false); };
  const enrollmentPercent = (enrolled: number, max: number) => Math.round((enrolled / max) * 100);

  // Stats for the layout
  const stats = [
    { value: `${programs.length}`, label: t('Programs', 'برنامج'), icon: GraduationCap },
    { value: '3', label: t('Schools', 'مدارس'), icon: Building2 },
    { value: '300+', label: t('Students', 'طالب'), icon: TrendingUp },
  ];

  // Programs grid content (shared across tabs)
  const programsContent = (
    <div>
      <AiAssistPanel
        feature="study_pathway"
        title="AI study pathway advice"
        titleAr="إرشاد المسار الدراسي بالذكاء الاصطناعي"
        getContext={() => ({
          interests: (selectedCategory !== 'all'
            ? [selectedCategory]
            : [...new Set(filteredPrograms.map((p: any) => p.category).filter(Boolean))]
          ).slice(0, 30),
        })}
        className="mb-6"
      />
      {/* Search and filter bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: brand.textTertiary }} />
          <input
            type="text"
            placeholder={t('Search programs or schools...', 'البحث في البرامج أو المدارس...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 40px',
              border: `1px solid ${brand.border}`, borderRadius: 12,
              fontSize: 14, outline: 'none', background: '#fff',
              transition: 'border-color 150ms'
            }}
            onFocus={e => e.target.style.borderColor = brand.primary}
            onBlur={e => e.target.style.borderColor = brand.border}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              data-has-handler="true"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                border: selectedCategory === cat.id ? 'none' : `1px solid ${brand.border}`,
                background: selectedCategory === cat.id ? brand.primary : '#fff',
                color: selectedCategory === cat.id ? '#fff' : brand.textSecondary,
                cursor: 'pointer', transition: 'all 150ms'
              }}
            >
              {cat.name[lang]}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', border: `1px solid ${brand.border}`, borderRadius: 10, overflow: 'hidden', marginInlineStart: 'auto' }}>
          {(['grid', 'list'] as const).map(mode => (
            <button
              key={mode}
              data-has-handler="true"
              onClick={() => setViewMode(mode)}
              style={{
                padding: '8px 10px', background: viewMode === mode ? brand.primary : '#fff',
                color: viewMode === mode ? '#fff' : brand.textTertiary,
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                transition: 'all 150ms'
              }}
            >
              {mode === 'grid' ? <Grid size={16} /> : <List size={16} />}
            </button>
          ))}
        </div>
      </div>

      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
          {t('Available Programs', 'البرامج المتاحة')}
        </h2>
        <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
          {t(`Showing ${filteredPrograms.length} programs`, `عرض ${filteredPrograms.length} برنامج`)}
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 40, height: 40, border: `3px solid ${brand.border}`, borderTopColor: brand.primary,
              borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
            }} />
            <p style={{ color: brand.textSecondary, fontSize: 14 }}>{t('Loading programs...', 'جاري تحميل البرامج...')}</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <BookOpen size={48} style={{ color: brand.primary, margin: '0 auto 16px', opacity: 0.6 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
            {t('No programs found', 'لم يتم العثور على برامج')}
          </h3>
          <p style={{ fontSize: 14, color: brand.textSecondary }}>
            {t('Try adjusting your search or filter criteria', 'حاول تعديل معايير البحث أو التصفية')}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid', gap: 20,
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(340px, 1fr))' : '1fr'
        }}>
          {filteredPrograms.map(program => (
            <div
              key={program.id}
              onClick={() => openProgramModal(program)}
              style={{
                background: '#fff', borderRadius: 16,
                border: `1px solid ${brand.border}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer', overflow: 'hidden',
                transition: 'border-color 150ms, box-shadow 150ms',
                display: viewMode === 'list' ? 'flex' : 'block'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 2px 8px rgba(13,148,136,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
            >
              <div style={{ padding: 24, flex: 1 }}>
                {/* Card top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                      background: brand.primarySurface, color: brand.primary,
                      fontSize: 12, fontWeight: 500, marginBottom: 8
                    }}>
                      {program.category}
                    </span>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary, margin: 0, lineHeight: 1.4 }}>
                      {program.title[lang]}
                    </h3>
                  </div>
                  {program.featured && (
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, flexShrink: 0,
                      background: '#FEF3C7', color: '#92400E',
                      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>
                      {t('Featured', 'مميز')}
                    </span>
                  )}
                </div>

                {/* School info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 13, color: brand.textSecondary }}>
                  <Building2 size={14} style={{ flexShrink: 0 }} />
                  <span>{program.school.name[lang]}</span>
                  <span style={{ color: brand.textTertiary }}>·</span>
                  <MapPin size={13} style={{ flexShrink: 0 }} />
                  <span>{program.school.location}</span>
                </div>

                {/* Description */}
                <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {program.description[lang]}
                </p>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 16 }}>
                  {[
                    { icon: <Users size={14} />, text: t(`Ages ${program.ageRange.min}–${program.ageRange.max}`, `الأعمار ${program.ageRange.min}–${program.ageRange.max}`) },
                    { icon: <Clock size={14} />, text: program.duration },
                    { icon: <Star size={14} style={{ color: '#F59E0B' }} />, text: `${program.rating} / 5.0` },
                    { icon: <Award size={14} />, text: program.category }
                  ].map((detail, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: brand.textSecondary }}>
                      <span style={{ color: brand.textTertiary, display: 'flex' }}>{detail.icon}</span>
                      {detail.text}
                    </div>
                  ))}
                </div>

                {/* Enrollment bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: brand.textTertiary, marginBottom: 4 }}>
                    <span>{t('Enrollment', 'التسجيل')}</span>
                    <span>{program.enrolledStudents}/{program.maxCapacity}</span>
                  </div>
                  <div style={{ height: 4, background: brand.border, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${enrollmentPercent(program.enrolledStudents, program.maxCapacity)}%`, background: brand.primary, borderRadius: 2, transition: 'width 300ms' }} />
                  </div>
                </div>

                {/* Footer row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 600, color: brand.primary }}>
                      {program.fees.currency} {program.fees.amount.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 13, color: brand.textTertiary, marginInlineStart: 4 }}>
                      {t('/ year', '/ سنوياً')}
                    </span>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, color: brand.primary }}>
                    {t('Details', 'التفاصيل')}
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Tabs for EducationPathwayLayout
  const tabs = [
    {
      id: 'programs',
      label: t('Available Programs', 'البرامج المتاحة'),
      icon: <BookOpen className="h-4 w-4" />,
      content: programsContent
    },
    {
      id: 'enrolled',
      label: t('My Enrollments', 'تسجيلاتي'),
      icon: <Users className="h-4 w-4" />,
      content: (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Users style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
            {t('No enrollments yet', 'لا توجد تسجيلات حتى الآن')}
          </h3>
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>
            {t('Browse available programs and enroll to see them here.', 'تصفح البرامج المتاحة وسجل لعرضها هنا.')}
          </p>
        </div>
      )
    },
    {
      id: 'resources',
      label: t('Resources', 'الموارد'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Award style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
            {t('Program Resources', 'موارد البرامج')}
          </h3>
          <p style={{ color: brand.textSecondary, fontSize: 14 }}>
            {t('Resources and materials for enrolled programs will appear here.', 'ستظهر هنا الموارد والمواد للبرامج المسجل بها.')}
          </p>
        </div>
      )
    }
  ];

  return (
    <>
      <EducationPathwayLayout
        title={t('School Programs', 'البرامج المدرسية')}
        description={t(
          'Explore innovative educational programs across Dubai schools, aligned with KHDA standards and Education 33 goals.',
          'استكشف البرامج التعليمية المبتكرة في مدارس دبي، المتوافقة مع معايير هيئة المعرفة وأهداف التعليم 33.'
        )}
        icon={<GraduationCap className="h-12 w-12" style={{ color: brand.primary }} />}
        stats={stats}
        tabs={tabs}
        defaultTab="programs"
        actionButtonText={t('Browse Programs', 'تصفح البرامج')}
        actionButtonHref="#programs"
        academicYear="2025-2026"
      />

      {/* ── Program Detail Modal ── */}
      {showProgramModal && selectedProgram && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24
          }}
          onClick={closeProgramModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20, maxWidth: 720, width: '100%',
              maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 48px rgba(0,0,0,0.12)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', background: brand.primarySurface,
              borderBottom: `1px solid ${brand.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <span style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: 10,
                  background: brand.primaryLight, color: brand.primaryDark,
                  fontSize: 12, fontWeight: 500, marginBottom: 6
                }}>
                  {selectedProgram.category}
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                  {selectedProgram.title[lang]}
                </h2>
              </div>
              <button
                onClick={closeProgramModal}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: `1px solid ${brand.border}`, background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: brand.textSecondary, flexShrink: 0
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                {/* Left column */}
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>
                    {t('Program Overview', 'نظرة عامة على البرنامج')}
                  </h3>
                  <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                    {selectedProgram.description[lang]}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                      { icon: <Building2 size={18} />, primary: selectedProgram.school.name[lang], secondary: selectedProgram.school.location },
                      { icon: <Users size={18} />, primary: t(`Ages ${selectedProgram.ageRange.min}–${selectedProgram.ageRange.max}`, `الأعمار ${selectedProgram.ageRange.min}–${selectedProgram.ageRange.max}`) },
                      { icon: <Clock size={18} />, primary: selectedProgram.duration },
                      { icon: <Star size={18} style={{ color: '#F59E0B' }} />, primary: `${selectedProgram.rating} / 5.0` }
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: brand.primarySurface, color: brand.primary,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: brand.textPrimary }}>{item.primary}</div>
                          {item.secondary && <div style={{ fontSize: 13, color: brand.textSecondary }}>{item.secondary}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right column */}
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>
                    {t('Enrollment Details', 'تفاصيل التسجيل')}
                  </h3>

                  {/* Price card */}
                  <div style={{
                    background: brand.primarySurface, borderRadius: 14, padding: 20, marginBottom: 20,
                    border: `1px solid ${brand.primaryLight}`
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: brand.primary }}>
                      {selectedProgram.fees.currency} {selectedProgram.fees.amount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>
                      {t('per year', 'سنوياً')}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: brand.textSecondary }}>{t('Enrolled Students', 'الطلاب المسجلون')}</span>
                      <span style={{ fontWeight: 500, color: brand.textPrimary }}>
                        {selectedProgram.enrolledStudents} / {selectedProgram.maxCapacity}
                      </span>
                    </div>
                    <div style={{ height: 6, background: brand.border, borderRadius: 3 }}>
                      <div style={{
                        height: '100%', borderRadius: 3, background: brand.primary,
                        width: `${enrollmentPercent(selectedProgram.enrolledStudents, selectedProgram.maxCapacity)}%`
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: brand.textSecondary }}>{t('Category', 'الفئة')}</span>
                      <span style={{ fontWeight: 500, color: brand.textPrimary }}>{selectedProgram.category}</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button style={{
                      width: '100%', padding: '12px 24px', borderRadius: 12,
                      background: brand.primary, color: '#fff', fontWeight: 600, fontSize: 14,
                      border: 'none', cursor: 'pointer', transition: 'background 150ms'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = brand.primaryDark}
                      onMouseLeave={e => e.currentTarget.style.background = brand.primary}
                    >
                      {t('Apply Now', 'تقدم الآن')}
                    </button>
                    <button style={{
                      width: '100%', padding: '12px 24px', borderRadius: 12,
                      background: '#fff', color: brand.primary, fontWeight: 600, fontSize: 14,
                      border: `1px solid ${brand.primary}`, cursor: 'pointer',
                      transition: 'background 150ms'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = brand.primarySurface}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      {t('Download Brochure', 'تحميل الكتيب')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SchoolProgramsPage;
