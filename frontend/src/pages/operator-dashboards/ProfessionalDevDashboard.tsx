import React, { useState, useEffect } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';
import {
    Award, BookOpen, Settings, Search,
    Clock, TrendingUp, Plus, Users, Eye, Shield, X, Check, AlertCircle
} from 'lucide-react';

const brand = {
    primary: '#0D9488', secondary: '#14B8A6', accent: '#5EEAD4',
    bg: '#F0FDFA', cardBg: '#FFFFFF',
    textPrimary: '#134E4A', textSecondary: '#6B7280', border: '#E5E7EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    redBg: '#FEF2F2', redText: '#DC2626',
    tealBg: '#CCFBF1', tealText: '#0D9488',
};

const ProfessionalDevDashboard: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    const [stats, setStats] = useState<any>({
        training_courses: 0,
        published_courses: 0,
        pending_courses: 0,
        total_enrolled: 0,
        total_certs_issued: 0,
        cert_bodies: 0
    });
    const [courses, setCourses] = useState<any[]>([]);
    const [certBodies, setCertBodies] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({
        training_accreditation: 'Required',
        blockchain_credential_issuing: 'Beta'
    });

    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);

    // Filter states
    const [courseFilter, setCourseFilter] = useState('all'); // all, published, pending

    // Modal state for adding a course
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseNameAr, setNewCourseNameAr] = useState('');
    const [newCourseProvider, setNewCourseProvider] = useState('');
    const [newCourseType, setNewCourseType] = useState('General');
    const [addingCourse, setAddingCourse] = useState(false);

    // Modal state for registering a body
    const [showAddBodyModal, setShowAddBodyModal] = useState(false);
    const [newBodyName, setNewBodyName] = useState('');
    const [newBodyCerts, setNewBodyCerts] = useState(0);
    const [addingBody, setAddingBody] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profResp, settingsResp] = await Promise.all([
                restClient.get('/api/education/profdev/operator/stats').catch((err) => {
                    console.error('Profdev stats fetch error:', err);
                    return null;
                }),
                restClient.get('/api/education/profdev/settings').catch((err) => {
                    console.error('Profdev settings fetch error:', err);
                    return null;
                })
            ]);
            if (profResp && profResp.status === 200) {
                const d = profResp.data;
                setStats(d.stats || {});
                setCourses(d.courses || []);
                setCertBodies(d.certification_bodies || []);
            }
            if (settingsResp && settingsResp.status === 200 && settingsResp.data.settings) {
                setSettings(settingsResp.data.settings);
            }
        } catch (err) {
            console.error('ProfDev operator fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCourseName || !newCourseProvider) return;
        setAddingCourse(true);
        try {
            const resp = await restClient.post('/api/education/profdev/courses', {
                name: newCourseName,
                name_ar: newCourseNameAr,
                provider: newCourseProvider,
                course_type: newCourseType
            });
            if (resp.status === 201) {
                setShowAddModal(false);
                setNewCourseName('');
                setNewCourseNameAr('');
                setNewCourseProvider('');
                setNewCourseType('General');
                await loadData();
            }
        } catch (err) {
            console.error('Failed to add course:', err);
        } finally {
            setAddingCourse(false);
        }
    };

    const handleAddBody = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBodyName) return;
        setAddingBody(true);
        try {
            const resp = await restClient.post('/api/education/profdev/certification-bodies', {
                name: newBodyName,
                certs_issued: newBodyCerts
            });
            if (resp.status === 201) {
                setShowAddBodyModal(false);
                setNewBodyName('');
                setNewBodyCerts(0);
                await loadData();
            }
        } catch (err) {
            console.error('Failed to register certification body:', err);
        } finally {
            setAddingBody(false);
        }
    };

    const handleToggleBody = async (bodyId: number) => {
        try {
            const resp = await restClient.put(`/api/education/profdev/certification-bodies/${bodyId}/toggle`);
            if (resp.status === 200) {
                await loadData();
            }
        } catch (err) {
            console.error('Failed to toggle certification body status:', err);
        }
    };

    const handleApproveCourse = async (courseId: number) => {
        try {
            const resp = await restClient.put(`/api/education/profdev/courses/${courseId}/approve`);
            if (resp.status === 200) {
                await loadData();
            }
        } catch (err) {
            console.error('Failed to approve course:', err);
        }
    };

    const handleRejectCourse = async (courseId: number) => {
        try {
            const resp = await restClient.put(`/api/education/profdev/courses/${courseId}/reject`);
            if (resp.status === 200) {
                await loadData();
            }
        } catch (err) {
            console.error('Failed to reject course:', err);
        }
    };

    const handleSaveSetting = async (key: string, value: string) => {
        setSavingSettings(true);
        try {
            const newSettings = { ...settings, [key]: value };
            const resp = await restClient.put('/api/education/profdev/settings', newSettings);
            if (resp.status === 200) {
                setSettings(newSettings);
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
        } finally {
            setSavingSettings(false);
        }
    };

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: TrendingUp },
        { id: 'training', label: t('Training', 'التدريب'), icon: BookOpen },
        { id: 'certifications', label: t('Certifications', 'الشهادات'), icon: Award },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    const overviewStats = [
        { label: t('Training Courses', 'الدورات التدريبية'), value: String(stats.training_courses || 0), icon: BookOpen },
        { label: t('Total Course Enrolments', 'إجمالي المسجلين'), value: String(stats.total_enrolled || 0), icon: Users },
        { label: t('Certifications Issued', 'الشهادات الصادرة'), value: String(stats.total_certs_issued || 0), icon: Award },
        { label: t('Pending Reviews', 'بانتظار المراجعة'), value: String(stats.pending_courses || 0), icon: Clock },
    ];

    const filteredCourses = courses.filter(c => {
        if (courseFilter === 'published') return c.status === 'published';
        if (courseFilter === 'pending') return c.status === 'pending';
        return true;
    });

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {overviewStats.map((s, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ background: brand.tealBg, borderRadius: 10, padding: 10 }}><s.icon size={20} color={brand.tealText} /></div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Popular Training Courses', 'أكثر الدورات شعبية')}</h3>
                    {courses.filter(c => c.status === 'published').sort((a: any, b: any) => b.enrolled - a.enrolled).slice(0, 4).map((c: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (c.name_ar || c.name) : c.name}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.provider}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500, background: brand.tealBg, color: brand.tealText }}>{c.course_type}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{c.enrolled || 0} {t('enrolled', 'مسجل')}</span>
                            </div>
                        </div>
                    ))}
                    {courses.filter(c => c.status === 'published').length === 0 && <div style={{ fontSize: 13, color: brand.textSecondary }}>{t('No training courses available yet', 'لا توجد دورات تدريبية متاحة بعد')}</div>}
                </div>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Certification Bodies', 'جهات الاعتماد')}</h3>
                    {certBodies.map((c: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < certBodies.length - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Shield size={14} color={c.is_active ? brand.tealText : brand.textSecondary} />
                                <span style={{ fontSize: 14, fontWeight: 500, color: brand.textPrimary }}>{c.name}</span>
                            </div>
                            <span style={{ fontSize: 13, color: brand.textSecondary }}>{c.certs_issued} {t('certs', 'شهادة')}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderTraining = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[
                        { id: 'all', label: t('All', 'الكل') },
                        { id: 'published', label: t('Published', 'منشور') },
                        { id: 'pending', label: t('Pending', 'قيد الانتظار') }
                    ].map((f) => (
                        <button key={f.id} onClick={() => setCourseFilter(f.id)} style={{
                            padding: '8px 16px', borderRadius: 20,
                            border: `1px solid ${courseFilter === f.id ? brand.primary : brand.border}`,
                            background: courseFilter === f.id ? brand.primary : 'white',
                            color: courseFilter === f.id ? 'white' : brand.textSecondary,
                            fontSize: 13, fontWeight: 500, cursor: 'pointer'
                        }}>{f.label}</button>
                    ))}
                </div>
                <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Add Course', 'إضافة دورة')}
                </button>
            </div>
            {filteredCourses.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('No courses found', 'لم يتم العثور على دورات')}</div>}
            {filteredCourses.map((c: any, i: number) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{isRTL ? (c.name_ar || c.name) : c.name}</span>
                            <span style={{ fontSize: 11, background: brand.tealBg, color: brand.tealText, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>{c.course_type}</span>
                        </div>
                        <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.provider} • {c.enrolled || 0} {t('enrolled', 'مسجل')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, background: c.status === 'published' ? brand.greenBg : brand.yellowBg, color: c.status === 'published' ? brand.greenText : brand.yellowText }}>
                            {c.status === 'published' ? t('Published', 'منشور') : t('Pending Approval', 'بانتظار الموافقة')}
                        </span>
                        {c.status === 'pending' ? (
                            <button onClick={() => handleApproveCourse(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: 'none', background: brand.primary, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                <Check size={13} /> {t('Approve', 'موافق')}
                            </button>
                        ) : (
                            <button onClick={() => handleRejectCourse(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.redText, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                <X size={13} /> {t('Reject', 'رفض')}
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderCertifications = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <button onClick={() => setShowAddBodyModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Register New Body', 'تسجيل جهة جديدة')}
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {certBodies.map((c: any, i: number) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 220 }}>
                        <div>
                            <Shield size={24} color={c.is_active ? brand.tealText : brand.textSecondary} style={{ margin: '0 auto 8px' }} />
                            <div style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary }}>{c.name}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: brand.primary, margin: '8px 0' }}>{c.certs_issued}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{t('certifications issued', 'شهادة صادرة')}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                            <span style={{ display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: c.is_active ? brand.greenBg : brand.redBg, color: c.is_active ? brand.greenText : brand.redText }}>
                                {c.is_active ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                            </span>
                            <button onClick={() => handleToggleBody(c.id)} style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.textSecondary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                {c.is_active ? t('Deactivate', 'تعطيل') : t('Activate', 'تفعيل')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSettings = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{t('Training Accreditation', 'اعتماد التدريب')}</div>
                    <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{t('Require KHDA/ACTVET accreditation for all courses', 'طلب اعتماد هيئة المعرفة/ ACTVET لجميع الدورات')}</div>
                </div>
                <select 
                    value={settings.training_accreditation || 'Required'}
                    onChange={(e) => handleSaveSetting('training_accreditation', e.target.value)}
                    disabled={savingSettings}
                    style={{ fontSize: 13, fontWeight: 600, color: brand.primary, background: brand.tealBg, border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', outline: 'none' }}
                >
                    <option value="Required">{t('Required', 'مطلوب')}</option>
                    <option value="Optional">{t('Optional', 'اختياري')}</option>
                </select>
            </div>
            <div style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{t('Blockchain Credential Issuing', 'إصدار الشهادات الرقمية')}</div>
                    <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{t('Enable blockchain-based digital credential issuance', 'تفعيل إصدار الشهادات الرقمية عبر البلوكتشين')}</div>
                </div>
                <select 
                    value={settings.blockchain_credential_issuing || 'Beta'}
                    onChange={(e) => handleSaveSetting('blockchain_credential_issuing', e.target.value)}
                    disabled={savingSettings}
                    style={{ fontSize: 13, fontWeight: 600, color: brand.primary, background: brand.tealBg, border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', outline: 'none' }}
                >
                    <option value="Enabled">{t('Enabled', 'نشط')}</option>
                    <option value="Beta">{t('Beta', 'تجريبي')}</option>
                    <option value="Disabled">{t('Disabled', 'معطل')}</option>
                </select>
            </div>
        </div>
    );

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: brand.bg }}>
            <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={language} />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: brand.tealBg, padding: '6px 16px', borderRadius: 20, marginBottom: 12 }}>
                        <Award size={16} color={brand.tealText} /> <span style={{ fontSize: 14, fontWeight: 600, color: brand.tealText }}>{t('Professional Development Operator', 'مشغل التطوير المهني')}</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: brand.textPrimary, marginBottom: 8 }}>{t('Professional Development Dashboard', 'لوحة التطوير المهني')}</h1>
                    <p style={{ fontSize: 15, color: brand.textSecondary }}>{t('Manage training programs, accreditations, certifications, and course providers', 'إدارة برامج التدريب والاعتمادات والشهادات ومزودي الدورات')}</p>
                </div>
                <div style={{ display: 'flex', gap: 4, background: brand.cardBg, padding: 4, borderRadius: 12, border: `1px solid ${brand.border}`, marginBottom: 24 }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '10px 12px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: activeTab === tab.id ? brand.primary : 'transparent',
                            color: activeTab === tab.id ? 'white' : brand.textSecondary, transition: 'all 0.2s ease'
                        }}>
                            <tab.icon size={15} /> {tab.label}
                        </button>
                    ))}
                </div>
                {loading && <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>{t('Loading...', 'جاري التحميل...')}</div>}
                {!loading && activeTab === 'overview' && renderOverview()}
                {!loading && activeTab === 'training' && renderTraining()}
                {!loading && activeTab === 'certifications' && renderCertifications()}
                {!loading && activeTab === 'settings' && renderSettings()}
            </div>

            {/* Add Course Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary }}>{t('Add New Training Course', 'إضافة دورة تدريبية جديدة')}</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: brand.textSecondary }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{t('Course Name (EN)', 'اسم الدورة (إنجليزي)')}</label>
                                <input required type="text" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14 }} placeholder="e.g. Advanced Leadership" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{t('Course Name (AR - Optional)', 'اسم الدورة (عربي - اختياري)')}</label>
                                <input type="text" value={newCourseNameAr} onChange={(e) => setNewCourseNameAr(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14 }} placeholder="مثال: القيادة المتقدمة" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{t('Provider / Institution', 'المؤسسة المزودة')}</label>
                                <input required type="text" value={newCourseProvider} onChange={(e) => setNewCourseProvider(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14 }} placeholder="e.g. PwC Academy" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{t('Course Category / Type', 'تصنيف الدورة')}</label>
                                <select value={newCourseType} onChange={(e) => setNewCourseType(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14 }}>
                                    <option value="General">{t('General', 'عام')}</option>
                                    <option value="Leadership">{t('Leadership', 'القيادة')}</option>
                                    <option value="Technology">{t('Technology', 'التكنولوجيا')}</option>
                                    <option value="Finance">{t('Finance', 'المالية')}</option>
                                    <option value="Management">{t('Management', 'الإدارة')}</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${brand.border}`, background: 'white', color: brand.textSecondary, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t('Cancel', 'إلغاء')}</button>
                                <button type="submit" disabled={addingCourse} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: brand.primary, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                                    {addingCourse ? t('Adding...', 'جاري الإضافة...') : t('Add Course', 'إضافة دورة')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Register Body Modal */}
            {showAddBodyModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary }}>{t('Register Certification Body', 'تسجيل جهة اعتماد جديدة')}</h3>
                            <button onClick={() => setShowAddBodyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: brand.textSecondary }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddBody} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{t('Organization Name', 'اسم المؤسسة')}</label>
                                <input required type="text" value={newBodyName} onChange={(e) => setNewBodyName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14 }} placeholder="e.g. ADEK, Pearson" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{t('Initial Certifications Count', 'العدد الأولي للشهادات')}</label>
                                <input type="number" min="0" value={newBodyCerts} onChange={(e) => setNewBodyCerts(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 14 }} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                                <button type="button" onClick={() => setShowAddBodyModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${brand.border}`, background: 'white', color: brand.textSecondary, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t('Cancel', 'إلغاء')}</button>
                                <button type="submit" disabled={addingBody} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: brand.primary, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                                    {addingBody ? t('Registering...', 'جاري التسجيل...') : t('Register Body', 'تسجيل الجهة')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessionalDevDashboard;
