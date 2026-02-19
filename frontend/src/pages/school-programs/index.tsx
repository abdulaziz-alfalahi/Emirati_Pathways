
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { BookOpen, Users, Award, Target, MapPin, Star, Clock, CheckCircle, ArrowRight, GraduationCap, Lightbulb, Beaker, Palette, Globe, Code } from 'lucide-react';

// Brand tokens
const brand = {
  primary: '#0D9488',
  primarySurface: '#F0FDFA',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
};

const programs = [
  {
    id: '1',
    title: 'STEM Excellence Program',
    description: 'Advanced science, technology, engineering, and mathematics curriculum with robotics labs, coding bootcamps, and research mentorship.',
    grades: 'Grades 9–12',
    schools: 12,
    students: 1480,
    capacity: 1600,
    duration: 'Full Academic Year',
    features: ['Robotics Lab', 'Coding Bootcamp', 'Research Mentorship', 'Science Olympiad'],
    outcomes: ['University STEM Programs', 'Scholarships', 'National Science Competitions'],
    category: 'STEM',
    rating: 4.9,
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Future Leaders Initiative',
    description: 'Leadership development program combining public speaking, project management, community service, and mentoring by industry leaders.',
    grades: 'Grades 10–12',
    schools: 8,
    students: 640,
    capacity: 800,
    duration: 'Full Academic Year',
    features: ['Public Speaking', 'Project Management', 'Community Service', 'Industry Mentors'],
    outcomes: ['Student Council Leadership', 'Scholarship Applications', 'Government Youth Programs'],
    category: 'Leadership',
    rating: 4.8,
    isFeatured: true,
  },
  {
    id: '3',
    title: 'Innovation & Entrepreneurship Lab',
    description: 'Hands-on entrepreneurship program where students develop business ideas, build prototypes, and pitch to real investors.',
    grades: 'Grades 9–12',
    schools: 6,
    students: 420,
    capacity: 500,
    duration: 'Full Academic Year',
    features: ['Business Planning', 'Prototype Development', 'Investor Pitching', 'Startup Mentorship'],
    outcomes: ['Youth Business Awards', 'Innovation Grants', 'Incubator Programs'],
    category: 'Entrepreneurship',
    rating: 4.7,
    isFeatured: false,
  },
  {
    id: '4',
    title: 'Creative Arts & Design Academy',
    description: 'Comprehensive arts program covering digital design, visual arts, music production, and creative writing with exhibition opportunities.',
    grades: 'Grades 7–12',
    schools: 10,
    students: 890,
    capacity: 1000,
    duration: 'Full Academic Year',
    features: ['Digital Design', 'Visual Arts', 'Music Production', 'Creative Writing'],
    outcomes: ['Art Portfolio Development', 'Design University Programs', 'National Arts Competition'],
    category: 'Arts',
    rating: 4.6,
    isFeatured: false,
  },
  {
    id: '5',
    title: 'Arabic Heritage & Language Enrichment',
    description: 'Preserving Emirati heritage through advanced Arabic literature, calligraphy, poetry, and cultural research projects.',
    grades: 'Grades 6–12',
    schools: 15,
    students: 1250,
    capacity: 1500,
    duration: 'Full Academic Year',
    features: ['Arabic Literature', 'Calligraphy', 'Poetry Workshops', 'Heritage Research'],
    outcomes: ['Arabic Language Awards', 'Cultural Affairs Careers', 'Heritage Preservation'],
    category: 'Language',
    rating: 4.5,
    isFeatured: true,
  },
  {
    id: '6',
    title: 'Digital Skills & Coding Program',
    description: 'Comprehensive coding curriculum from block-based programming to app development, covering Python, JavaScript, and mobile technologies.',
    grades: 'Grades 6–10',
    schools: 14,
    students: 1120,
    capacity: 1200,
    duration: 'Full Academic Year',
    features: ['Python', 'JavaScript', 'App Development', 'Game Design'],
    outcomes: ['Coding Competitions', 'Tech Internships', 'University CS Programs'],
    category: 'Technology',
    rating: 4.8,
    isFeatured: true,
  },
];

const partnerSchools = [
  { name: 'Al Mawakeb School', location: 'Dubai', type: 'Private', programs: 5, students: 420 },
  { name: 'GEMS Modern Academy', location: 'Dubai', type: 'Private', programs: 4, students: 380 },
  { name: 'Abu Dhabi International School', location: 'Abu Dhabi', type: 'Private', programs: 6, students: 510 },
  { name: 'Sharjah National Schools', location: 'Sharjah', type: 'Public', programs: 4, students: 350 },
  { name: 'Al Ain Academy', location: 'Al Ain', type: 'Public', programs: 3, students: 280 },
  { name: 'RAK Academy', location: 'Ras Al Khaimah', type: 'Public', programs: 3, students: 240 },
];

const categoryFilters = ['All', 'STEM', 'Leadership', 'Entrepreneurship', 'Arts', 'Language', 'Technology'];

const SchoolProgramsPage: React.FC = () => {

    const { t } = useTranslation('school-programs');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = programs.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const getCategoryColor = (cat: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      'STEM': { bg: '#DBEAFE', color: '#1E40AF' },
      'Leadership': { bg: '#FEF3C7', color: '#92400E' },
      'Entrepreneurship': { bg: '#F3E8FF', color: '#6B21A8' },
      'Arts': { bg: '#FFF1F2', color: '#BE123C' },
      'Language': { bg: '#DCFCE7', color: '#166534' },
      'Technology': { bg: brand.primarySurface, color: brand.primary },
    };
    return map[cat] || { bg: '#F3F4F6', color: brand.textSecondary };
  };

  const stats = [
    { value: t('stats.partner_schools_value', '25+'), label: t('stats.partner_schools', 'Partner Schools'), icon: BookOpen },
    { value: t('stats.students_enrolled_value', '5,800+'), label: t('stats.students_enrolled', 'Students Enrolled'), icon: Users },
    { value: t('stats.specialized_programs_value', '18'), label: t('stats.specialized_programs', 'Specialized Programs'), icon: Award },
    { value: t('stats.success_rate_value', '94%'), label: t('stats.success_rate', 'Success Rate'), icon: Target },
  ];

  const tabs = [
    { id: 'programs', label: t('tabs.programs.label', 'Programs'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div>
          {/* Search and filter bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
              <input
                type="text"
                placeholder="Search programs, skills…"
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
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    border: selectedCategory === cat ? 'none' : `1px solid ${brand.border}`,
                    background: selectedCategory === cat ? brand.primary : '#fff',
                    color: selectedCategory === cat ? '#fff' : brand.textSecondary,
                    cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20 }}>
            Showing {filtered.length} program{filtered.length !== 1 ? 's' : ''}
          </p>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <BookOpen style={{ width: 48, height: 48, color: brand.textSecondary, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>No programs found</h3>
              <p style={{ color: brand.textSecondary, fontSize: 14 }}>Try adjusting your search or filter.</p>
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
                    <div style={{ height: 4, background: p.isFeatured ? brand.primary : brand.border }} />

                    <div style={{ padding: 22 }}>
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: catColor.bg, color: catColor.color,
                        }}>
                          {p.category}
                        </span>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                          background: '#F3F4F6', color: brand.textSecondary,
                        }}>
                          {p.grades}
                        </span>
                        {p.isFeatured && (
                          <span style={{
                            padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                            background: '#FEF3C7', color: '#92400E',
                          }}>
                            ★ Featured
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                        {p.title}
                      </h3>

                      <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 16 }}>
                        {p.description}
                      </p>

                      {/* Stats row */}
                      <div style={{
                        display: 'flex', gap: 0, marginBottom: 16,
                        borderRadius: 12, background: brand.primarySurface, overflow: 'hidden',
                      }}>
                        <div style={{ flex: 1, padding: '10px 14px' }}>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Schools</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: brand.primary }}>{p.schools}</div>
                        </div>
                        <div style={{ width: 1, background: brand.border }} />
                        <div style={{ flex: 1, padding: '10px 14px' }}>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Duration</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: brand.primary }}>Full Year</div>
                        </div>
                        <div style={{ width: 1, background: brand.border }} />
                        <div style={{ flex: 1, padding: '10px 14px' }}>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Rating</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star style={{ width: 14, height: 14, color: '#F59E0B', fill: '#F59E0B' }} />
                            <span style={{ fontSize: 15, fontWeight: 700, color: brand.primary }}>{p.rating}</span>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Key Features</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.features.map((f, i) => (
                            <span key={i} style={{
                              padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                              background: '#F3F4F6', color: brand.textPrimary,
                            }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Outcomes */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.outcomes.map((o, i) => (
                            <span key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 12, color: '#166534',
                              padding: '3px 8px', borderRadius: 8, background: '#DCFCE7',
                            }}>
                              <CheckCircle style={{ width: 12, height: 12 }} />
                              {o}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Enrollment bar */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: brand.textSecondary, marginBottom: 4 }}>
                          <span>{p.students.toLocaleString()} enrolled</span>
                          <span>{(p.capacity - p.students).toLocaleString()} spots left</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6' }}>
                          <div style={{
                            height: '100%', borderRadius: 2, background: brand.primary,
                            width: `${(p.students / p.capacity) * 100}%`,
                            transition: 'width 300ms',
                          }} />
                        </div>
                      </div>

                      {/* Apply button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '10px 22px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                          background: brand.primary, color: '#fff', cursor: 'pointer',
                        }}>
                          Learn More <ArrowRight style={{ width: 16, height: 16 }} />
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
    { id: 'schools', label: t('tabs.schools.label', 'Partner Schools'),
      icon: <MapPin className="h-4 w-4" />,
      content: (
        <div>
          <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20 }}>
            {partnerSchools.length} partnered institutions across the UAE
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {partnerSchools.map((s, i) => (
              <div
                key={i}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary, marginBottom: 4 }}>{s.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin style={{ width: 14, height: 14, color: brand.textSecondary }} />
                        <span style={{ fontSize: 14, color: brand.textSecondary }}>{s.location}, UAE</span>
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                      background: s.type === 'Public' ? '#DCFCE7' : '#DBEAFE',
                      color: s.type === 'Public' ? '#166534' : '#1E40AF',
                    }}>
                      {s.type}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex', gap: 0, borderRadius: 12,
                    background: brand.primarySurface, overflow: 'hidden',
                  }}>
                    <div style={{ flex: 1, padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: brand.primary }}>{s.programs}</div>
                      <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Programs</div>
                    </div>
                    <div style={{ width: 1, background: brand.border }} />
                    <div style={{ flex: 1, padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: brand.primary }}>{s.students}</div>
                      <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Students</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    { id: 'resources', label: t('tabs.resources.label', 'Resources & Support'),
      icon: <Lightbulb className="h-4 w-4" />,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {[
            {
              title: 'Student Enrollment Guide',
              desc: 'Step-by-step guide for students and parents to enrol in specialized school programs.',
              icon: <GraduationCap style={{ width: 20, height: 20, color: brand.primary }} />,
            },
            {
              title: 'Academic Counselling',
              desc: 'Connect with academic advisors to find the right programme path for your goals.',
              icon: <Users style={{ width: 20, height: 20, color: brand.primary }} />,
            },
            {
              title: 'Scholarship Pathways',
              desc: 'How school programs connect with university scholarships and financial aid.',
              icon: <Award style={{ width: 20, height: 20, color: brand.primary }} />,
              link: '/scholarships',
            },
            {
              title: 'University Readiness',
              desc: 'Prepare for university applications, entrance exams, and admissions processes.',
              icon: <Target style={{ width: 20, height: 20, color: brand.primary }} />,
              link: '/university-programs',
            },
          ].map((r, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 16,
              border: `1px solid ${brand.border}`, padding: 22,
              transition: 'border-color 150ms',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: brand.primarySurface,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                {r.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{r.title}</h3>
              <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.5, marginBottom: r.link ? 14 : 0 }}>{r.desc}</p>
              {r.link && (
                <a href={r.link} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 14, fontWeight: 500, color: brand.primary, textDecoration: 'none',
                }}>
                  Learn more <ArrowRight style={{ width: 14, height: 14 }} />
                </a>
              )}
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <EducationPathwayLayout
      title={t('title', 'School Programs')}
      description={t('description', 'Discover specialized school programs across the UAE — from STEM and leadership to arts and innovation — designed to prepare students for future success.')}
      icon={<BookOpen className="h-12 w-12" style={{ color: '#0D9488' }} />}
      stats={stats}
      tabs={tabs}
      defaultTab="programs"
      actionButtonText="Explore Programs"
      actionButtonHref="#programs"
      academicYear="2025-2026"
    />
  );
};

export default SchoolProgramsPage;
