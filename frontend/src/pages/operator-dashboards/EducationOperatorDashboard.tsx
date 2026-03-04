import React, { useState } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    GraduationCap, Building2, BookOpen, Users, Settings, Search,
    CheckCircle, Clock, AlertTriangle, TrendingUp, Plus, Filter,
    ArrowUp, ArrowDown, Eye, Calendar, Award, FileText
} from 'lucide-react';

const brand = {
    primary: '#6D28D9',
    secondary: '#7C3AED',
    accent: '#A78BFA',
    bg: '#FAF8FF',
    cardBg: '#FFFFFF',
    textPrimary: '#1E1B4B',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    redBg: '#FEF2F2', redText: '#DC2626',
    purpleBg: '#F3E8FF', purpleText: '#7C3AED',
};

const EducationOperatorDashboard: React.FC = () => {
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: TrendingUp },
        { id: 'institutions', label: t('Institutions', 'المؤسسات'), icon: Building2 },
        { id: 'programs', label: t('Programs', 'البرامج'), icon: BookOpen },
        { id: 'enrollment', label: t('Enrollment', 'التسجيل'), icon: Users },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    const stats = [
        { label: t('Institutions', 'المؤسسات'), value: '142', change: '+8', up: true, icon: Building2 },
        { label: t('Active Programs', 'البرامج النشطة'), value: '385', change: '+24', up: true, icon: BookOpen },
        { label: t('Enrolled Students', 'الطلاب المسجلون'), value: '28,450', change: '+1,250', up: true, icon: GraduationCap },
        { label: t('Pending Approvals', 'بانتظار الموافقة'), value: '17', change: '-3', up: false, icon: Clock },
    ];

    const institutions = [
        { name: t('UAE University', 'جامعة الإمارات'), type: t('University', 'جامعة'), programs: 42, students: 6500, status: 'active', emirate: t('Al Ain', 'العين') },
        { name: t('Zayed University', 'جامعة زايد'), type: t('University', 'جامعة'), programs: 35, students: 4200, status: 'active', emirate: t('Abu Dhabi', 'أبوظبي') },
        { name: t('Higher Colleges of Technology', 'كليات التقنية العليا'), type: t('Technical College', 'كلية تقنية'), programs: 58, students: 8300, status: 'active', emirate: t('Multiple', 'متعدد') },
        { name: t('GEMS Education', 'جيمس للتعليم'), type: t('School Group', 'مجموعة مدارس'), programs: 24, students: 3800, status: 'active', emirate: t('Dubai', 'دبي') },
        { name: t('Abu Dhabi Polytechnic', 'بوليتكنك أبوظبي'), type: t('Polytechnic', 'معهد تقني'), programs: 18, students: 2100, status: 'pending', emirate: t('Abu Dhabi', 'أبوظبي') },
    ];

    const pendingPrograms = [
        { name: t('AI & Machine Learning Certificate', 'شهادة الذكاء الاصطناعي وتعلم الآلة'), institution: t('UAE University', 'جامعة الإمارات'), type: t('Certificate', 'شهادة'), submitted: '2024-02-17' },
        { name: t('Cybersecurity Bootcamp', 'معسكر الأمن السيبراني'), institution: t('Higher Colleges of Technology', 'كليات التقنية العليا'), type: t('Bootcamp', 'معسكر تدريبي'), submitted: '2024-02-16' },
        { name: t('Sustainable Energy Program', 'برنامج الطاقة المستدامة'), institution: t('Zayed University', 'جامعة زايد'), type: t('Degree', 'درجة علمية'), submitted: '2024-02-15' },
    ];

    const enrollmentByType = [
        { type: t('University Degrees', 'الدرجات الجامعية'), count: 12500, pct: 44, color: brand.primary },
        { type: t('Technical Programs', 'البرامج التقنية'), count: 8300, pct: 29, color: brand.secondary },
        { type: t('School Programs', 'البرامج المدرسية'), count: 4800, pct: 17, color: brand.accent },
        { type: t('Scholarships', 'المنح الدراسية'), count: 2850, pct: 10, color: '#10B981' },
    ];

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {stats.map((s, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ background: brand.purpleBg, borderRadius: 10, padding: 10 }}>
                            <s.icon size={20} color={brand.purpleText} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                            <div style={{ fontSize: 12, color: s.up ? brand.greenText : brand.redText, display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
                                {s.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {s.change} {t('this month', 'هذا الشهر')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>
                        <AlertTriangle size={16} color={brand.yellowText} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Pending Program Approvals', 'برامج بانتظار الموافقة')}
                    </h3>
                    {pendingPrograms.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < pendingPrograms.length - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{p.name}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{p.institution} • {p.type} • {p.submitted}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: brand.greenBg, color: brand.greenText, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓ {t('Approve', 'موافقة')}</button>
                                <button style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.textSecondary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t('Review', 'مراجعة')}</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Enrollment by Type', 'التسجيل حسب النوع')}</h3>
                    {enrollmentByType.map((e, i) => (
                        <div key={i} style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, color: brand.textPrimary }}>{e.type}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: e.color }}>{e.count.toLocaleString()} ({e.pct}%)</span>
                            </div>
                            <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4 }}>
                                <div style={{ height: '100%', width: `${e.pct}%`, background: e.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderInstitutions = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: brand.textSecondary }} />
                    <input placeholder={t('Search institutions...', 'بحث عن مؤسسات...')} style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14, outline: 'none' }} />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Add Institution', 'إضافة مؤسسة')}
                </button>
            </div>

            {institutions.map((inst, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.purpleBg, borderRadius: 10, padding: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={20} color={brand.purpleText} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{inst.name}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{inst.type} • {inst.emirate} • {inst.programs} {t('programs', 'برنامج')} • {inst.students.toLocaleString()} {t('students', 'طالب')}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                            fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500,
                            background: inst.status === 'active' ? brand.greenBg : brand.yellowBg,
                            color: inst.status === 'active' ? brand.greenText : brand.yellowText
                        }}>
                            {inst.status === 'active' ? t('Active', 'نشط') : t('Pending', 'قيد الانتظار')}
                        </span>
                        <button style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.primary, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                            <Eye size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t('Manage', 'إدارة')}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderPrograms = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[t('All', 'الكل'), t('Active', 'نشط'), t('Pending', 'قيد الانتظار'), t('Draft', 'مسودة')].map((f, i) => (
                        <button key={i} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${i === 0 ? brand.primary : brand.border}`, background: i === 0 ? brand.primary : 'white', color: i === 0 ? 'white' : brand.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{f}</button>
                    ))}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Add Program', 'إضافة برنامج')}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {[
                    { name: t('Computer Science BSc', 'بكالوريوس علوم الحاسب'), inst: t('UAE University', 'جامعة الإمارات'), type: t('Degree', 'درجة'), students: 450, status: 'published' },
                    { name: t('Business Administration MBA', 'ماجستير إدارة الأعمال'), inst: t('Zayed University', 'جامعة زايد'), type: t('Degree', 'درجة'), students: 120, status: 'published' },
                    { name: t('Automation Engineering', 'هندسة الأتمتة'), inst: t('Higher Colleges of Technology', 'كليات التقنية العليا'), type: t('Technical', 'تقني'), students: 280, status: 'published' },
                    { name: t('Digital Marketing Certificate', 'شهادة التسويق الرقمي'), inst: t('GEMS Education', 'جيمس'), type: t('Certificate', 'شهادة'), students: 85, status: 'pending' },
                    { name: t('Data Science Bootcamp', 'معسكر علم البيانات'), inst: t('Abu Dhabi Polytechnic', 'بوليتكنك أبوظبي'), type: t('Bootcamp', 'معسكر'), students: 0, status: 'draft' },
                ].map((p, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{p.name}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 4 }}>{p.inst} • {p.type}</div>
                            </div>
                            <span style={{
                                fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500,
                                background: p.status === 'published' ? brand.greenBg : p.status === 'pending' ? brand.yellowBg : '#F1F5F9',
                                color: p.status === 'published' ? brand.greenText : p.status === 'pending' ? brand.yellowText : brand.textSecondary
                            }}>{p.status === 'published' ? t('Published', 'منشور') : p.status === 'pending' ? t('Pending', 'قيد الانتظار') : t('Draft', 'مسودة')}</span>
                        </div>
                        <div style={{ fontSize: 13, color: brand.textSecondary }}><Users size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {p.students} {t('enrolled', 'مسجل')}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderEnrollment = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {enrollmentByType.map((e, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: e.color }}>{e.count.toLocaleString()}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 4 }}>{e.type}</div>
                        <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginTop: 12 }}>
                            <div style={{ height: '100%', width: `${e.pct}%`, background: e.color, borderRadius: 3 }} />
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Recent Enrollments', 'التسجيلات الأخيرة')}</h3>
                {[
                    { student: t('Ahmed Al Mansouri', 'أحمد المنصوري'), program: t('Computer Science BSc', 'بكالوريوس علوم الحاسب'), date: '2024-02-18' },
                    { student: t('Fatima Al Hashmi', 'فاطمة الهاشمي'), program: t('Business Administration MBA', 'ماجستير إدارة الأعمال'), date: '2024-02-17' },
                    { student: t('Khalid Al Dhaheri', 'خالد الظاهري'), program: t('Automation Engineering', 'هندسة الأتمتة'), date: '2024-02-17' },
                    { student: t('Mariam Al Shamsi', 'مريم الشامسي'), program: t('Digital Marketing Certificate', 'شهادة التسويق الرقمي'), date: '2024-02-16' },
                ].map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? `1px solid ${brand.border}` : 'none' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{e.student}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{e.program}</div>
                        </div>
                        <span style={{ fontSize: 12, color: brand.textSecondary }}>{e.date}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSettings = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
                { title: t('Auto-Approve Institutions', 'الموافقة التلقائية على المؤسسات'), desc: t('Automatically approve institutions from accredited bodies', 'الموافقة التلقائية على المؤسسات من الجهات المعتمدة'), value: t('Disabled', 'معطّل') },
                { title: t('Program Review SLA', 'مدة مراجعة البرامج'), desc: t('Maximum days to review a submitted program', 'الحد الأقصى لأيام مراجعة البرنامج المقدم'), value: t('3 Days', '3 أيام') },
                { title: t('Enrollment Cap', 'سقف التسجيل'), desc: t('Maximum students per program before requiring approval', 'الحد الأقصى للطلاب لكل برنامج قبل طلب الموافقة'), value: '500' },
                { title: t('KHDA Integration', 'تكامل هيئة المعرفة'), desc: t('Sync with KHDA for school accreditation data', 'المزامنة مع هيئة المعرفة لبيانات الاعتماد'), value: t('Enabled', 'مفعّل') },
            ].map((s, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.title}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: brand.primary, background: brand.purpleBg, padding: '6px 14px', borderRadius: 6 }}>{s.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: brand.bg }}>
            <HybridGovernmentNavFixed />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: brand.purpleBg, padding: '6px 16px', borderRadius: 20, marginBottom: 12 }}>
                        <GraduationCap size={16} color={brand.purpleText} /> <span style={{ fontSize: 14, fontWeight: 600, color: brand.purpleText }}>{t('Education Operator', 'مشغل التعليم')}</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: brand.textPrimary, marginBottom: 8 }}>{t('Education Operations Dashboard', 'لوحة عمليات التعليم')}</h1>
                    <p style={{ fontSize: 15, color: brand.textSecondary }}>{t('Manage institutions, programs, scholarships, and student enrollment', 'إدارة المؤسسات والبرامج والمنح الدراسية وتسجيل الطلاب')}</p>
                </div>

                <div style={{ display: 'flex', gap: 4, background: brand.cardBg, padding: 4, borderRadius: 12, border: `1px solid ${brand.border}`, marginBottom: 24 }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '10px 12px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: activeTab === tab.id ? brand.primary : 'transparent',
                            color: activeTab === tab.id ? 'white' : brand.textSecondary,
                            transition: 'all 0.2s ease'
                        }}>
                            <tab.icon size={15} /> {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'institutions' && renderInstitutions()}
                {activeTab === 'programs' && renderPrograms()}
                {activeTab === 'enrollment' && renderEnrollment()}
                {activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

export default EducationOperatorDashboard;
