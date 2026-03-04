import React, { useState } from 'react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    MessageSquare, Users, Calendar, Flag, Settings, Heart,
    CheckCircle, Clock, TrendingUp, Plus, Star,
    ArrowUp, ArrowDown, Eye, ThumbsUp, AlertTriangle, FileText
} from 'lucide-react';

const brand = {
    primary: '#DB2777',
    secondary: '#EC4899',
    accent: '#F9A8D4',
    bg: '#FDF2F8',
    cardBg: '#FFFFFF',
    textPrimary: '#831843',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    yellowBg: '#FFFBEB', yellowText: '#D97706',
    redBg: '#FEF2F2', redText: '#DC2626',
    pinkBg: '#FCE7F3', pinkText: '#DB2777',
};

const CommunityOperatorDashboard: React.FC = () => {
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: TrendingUp },
        { id: 'content', label: t('Content', 'المحتوى'), icon: FileText },
        { id: 'flagged', label: t('Flagged', 'مبلّغ عنه'), icon: Flag },
        { id: 'events', label: t('Events', 'الفعاليات'), icon: Calendar },
        { id: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings },
    ];

    const stats = [
        { label: t('Active Communities', 'المجتمعات النشطة'), value: '48', change: '+5', up: true, icon: Users },
        { label: t('Published Stories', 'القصص المنشورة'), value: '1,245', change: '+87', up: true, icon: Heart },
        { label: t('Flagged Content', 'محتوى مبلّغ عنه'), value: '12', change: '+3', up: true, icon: Flag },
        { label: t('Upcoming Events', 'الفعاليات القادمة'), value: '8', change: '+2', up: true, icon: Calendar },
    ];

    const contentQueue = [
        { title: t('My Journey from Fresh Graduate to CTO', 'رحلتي من خريج جديد إلى مدير تقنية'), author: t('Ahmed Al Falasi', 'أحمد الفلاسي'), type: t('Success Story', 'قصة نجاح'), submitted: '2024-02-18', likes: 45 },
        { title: t('Navigating Career Change in UAE', 'التنقل المهني في الإمارات'), author: t('Fatima Al Hashmi', 'فاطمة الهاشمي'), type: t('Article', 'مقال'), submitted: '2024-02-17', likes: 32 },
        { title: t('Youth Innovation Summit Recap', 'ملخص قمة الابتكار الشبابي'), author: t('Omar Al Suwaidi', 'عمر السويدي'), type: t('Event Recap', 'تلخيص فعالية'), submitted: '2024-02-16', likes: 28 },
        { title: t('Building Community Through Sports', 'بناء المجتمع من خلال الرياضة'), author: t('Mariam Al Shamsi', 'مريم الشامسي'), type: t('Article', 'مقال'), submitted: '2024-02-15', likes: 19 },
    ];

    const flaggedContent = [
        { title: t('Inappropriate job listing', 'إعلان وظيفي غير لائق'), reporter: t('System Auto-Flag', 'فحص تلقائي'), reason: t('Misleading content', 'محتوى مضلل'), severity: 'high', date: '2024-02-18' },
        { title: t('Spam community post', 'منشور مجتمعي مزعج'), reporter: t('User Report x3', 'بلاغ مستخدمين ×3'), reason: t('Spam / advertising', 'إزعاج / إعلان'), severity: 'medium', date: '2024-02-17' },
        { title: t('Duplicate success story', 'قصة نجاح مكررة'), reporter: t('Admin Review', 'مراجعة إدارية'), reason: t('Duplicate content', 'محتوى مكرر'), severity: 'low', date: '2024-02-16' },
    ];

    const events = [
        { name: t('UAE Career Fair 2024', 'معرض الوظائف الإماراتي 2024'), date: '2024-03-15', location: t('ADNEC, Abu Dhabi', 'أدنيك، أبوظبي'), registrations: 2400, status: 'upcoming' },
        { name: t('Youth Innovation Challenge', 'تحدي الابتكار الشبابي'), date: '2024-03-22', location: t('Dubai Exhibition Centre', 'مركز دبي للمعارض'), registrations: 850, status: 'upcoming' },
        { name: t('Retiree Networking Evening', 'أمسية تواصل المتقاعدين'), date: '2024-03-08', location: t('Jumeirah Emirates Towers', 'أبراج الإمارات جميرا'), registrations: 120, status: 'upcoming' },
        { name: t('National Service Alumni Meetup', 'لقاء خريجي الخدمة الوطنية'), date: '2024-02-25', location: t('Sharjah Youth Center', 'مركز الشارقة للشباب'), registrations: 200, status: 'completed' },
    ];

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {stats.map((s, i) => (
                    <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ background: brand.pinkBg, borderRadius: 10, padding: 10 }}>
                            <s.icon size={20} color={brand.pinkText} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                            <div style={{ fontSize: 12, color: s.up ? brand.greenText : brand.redText, display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
                                {s.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {s.change}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Content Awaiting Review', 'محتوى بانتظار المراجعة')}</h3>
                    {contentQueue.slice(0, 3).map((c, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{c.title}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.author} • {c.type}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: brand.greenBg, color: brand.greenText, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓</button>
                                <button style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.textSecondary, fontSize: 12, cursor: 'pointer' }}>
                                    <Eye size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ background: brand.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>
                        <AlertTriangle size={16} color={brand.yellowText} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {t('Flagged Items', 'العناصر المبلّغ عنها')}
                    </h3>
                    {flaggedContent.map((f, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < flaggedContent.length - 1 ? `1px solid ${brand.border}` : 'none' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{f.title}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{f.reason} • {f.reporter}</div>
                            </div>
                            <span style={{
                                fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                                background: f.severity === 'high' ? brand.redBg : f.severity === 'medium' ? brand.yellowBg : '#F1F5F9',
                                color: f.severity === 'high' ? brand.redText : f.severity === 'medium' ? brand.yellowText : brand.textSecondary
                            }}>{f.severity === 'high' ? t('High', 'عالي') : f.severity === 'medium' ? t('Medium', 'متوسط') : t('Low', 'منخفض')}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderContent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[t('Pending', 'قيد الانتظار'), t('Published', 'منشور'), t('Rejected', 'مرفوض')].map((f, i) => (
                        <button key={i} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${i === 0 ? brand.primary : brand.border}`, background: i === 0 ? brand.primary : 'white', color: i === 0 ? 'white' : brand.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{f}</button>
                    ))}
                </div>
            </div>
            {contentQueue.map((c, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.pinkBg, borderRadius: 10, padding: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={20} color={brand.pinkText} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{c.title}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.author} • {c.type} • {c.submitted}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, color: brand.textSecondary }}><ThumbsUp size={13} /> {c.likes}</span>
                        <button style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: brand.greenBg, color: brand.greenText, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓ {t('Approve', 'موافقة')}</button>
                        <button style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: brand.redBg, color: brand.redText, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✗ {t('Reject', 'رفض')}</button>
                        <button style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.primary, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                            <Eye size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t('Preview', 'معاينة')}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderFlagged = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {flaggedContent.map((f, i) => (
                <div key={i} style={{
                    background: brand.cardBg, borderRadius: 12, padding: 20,
                    border: `1px solid ${f.severity === 'high' ? '#FCA5A5' : f.severity === 'medium' ? '#FCD34D' : brand.border}`,
                    borderLeftWidth: 4
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{f.title}</div>
                            <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 4 }}>{t('Reason', 'السبب')}: {f.reason}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>{t('Reported by', 'أبلغ بواسطة')}: {f.reporter} • {f.date}</div>
                        </div>
                        <span style={{
                            fontSize: 12, padding: '4px 14px', borderRadius: 20, fontWeight: 600,
                            background: f.severity === 'high' ? brand.redBg : f.severity === 'medium' ? brand.yellowBg : '#F1F5F9',
                            color: f.severity === 'high' ? brand.redText : f.severity === 'medium' ? brand.yellowText : brand.textSecondary
                        }}>{f.severity.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: brand.redBg, color: brand.redText, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('Remove Content', 'إزالة المحتوى')}</button>
                        <button style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.textPrimary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{t('Dismiss Flag', 'تجاهل البلاغ')}</button>
                        <button style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${brand.border}`, background: 'white', color: brand.primary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{t('View Content', 'عرض المحتوى')}</button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderEvents = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: brand.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> {t('Create Event', 'إنشاء فعالية')}
                </button>
            </div>
            {events.map((e, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: brand.pinkBg, borderRadius: 10, padding: 12, textAlign: 'center', minWidth: 50 }}>
                            <Calendar size={18} color={brand.pinkText} />
                            <div style={{ fontSize: 11, fontWeight: 700, color: brand.pinkText, marginTop: 2 }}>{e.date.split('-')[2]}/{e.date.split('-')[1]}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{e.name}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{e.location} • {e.registrations.toLocaleString()} {t('registrations', 'تسجيل')}</div>
                        </div>
                    </div>
                    <span style={{
                        fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500,
                        background: e.status === 'upcoming' ? brand.greenBg : '#F1F5F9',
                        color: e.status === 'upcoming' ? brand.greenText : brand.textSecondary
                    }}>{e.status === 'upcoming' ? t('Upcoming', 'قادم') : t('Completed', 'مكتمل')}</span>
                </div>
            ))}
        </div>
    );

    const renderSettings = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
                { title: t('Auto-Flag Keywords', 'كلمات البلاغ التلقائي'), desc: t('Automatically flag content containing specific keywords', 'الإبلاغ التلقائي عن المحتوى المتضمن كلمات محددة'), value: t('42 keywords', '42 كلمة') },
                { title: t('Content Approval SLA', 'مدة اعتماد المحتوى'), desc: t('Maximum hours to review submitted content', 'الحد الأقصى لساعات مراجعة المحتوى المقدم'), value: t('24 Hours', '24 ساعة') },
                { title: t('Community Size Limit', 'حد حجم المجتمع'), desc: t('Maximum members per community before requiring admin approval', 'الحد الأقصى للأعضاء قبل طلب موافقة المسؤول'), value: '5,000' },
                { title: t('Event Auto-publish', 'النشر التلقائي للفعاليات'), desc: t('Allow verified organizers to publish events without review', 'السماح للمنظمين المعتمدين بنشر الفعاليات بدون مراجعة'), value: t('Enabled', 'مفعّل') },
            ].map((s, i) => (
                <div key={i} style={{ background: brand.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${brand.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.title}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: brand.primary, background: brand.pinkBg, padding: '6px 14px', borderRadius: 6 }}>{s.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: brand.bg }}>
            <HybridGovernmentNavFixed />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: brand.pinkBg, padding: '6px 16px', borderRadius: 20, marginBottom: 12 }}>
                        <MessageSquare size={16} color={brand.pinkText} /> <span style={{ fontSize: 14, fontWeight: 600, color: brand.pinkText }}>{t('Community & Engagement Operator', 'مشغل المجتمع والتفاعل')}</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: brand.textPrimary, marginBottom: 8 }}>{t('Community Operations Dashboard', 'لوحة عمليات المجتمع')}</h1>
                    <p style={{ fontSize: 15, color: brand.textSecondary }}>{t('Moderate content, manage events, and foster community engagement', 'إدارة المحتوى والفعاليات وتعزيز التفاعل المجتمعي')}</p>
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
                {activeTab === 'content' && renderContent()}
                {activeTab === 'flagged' && renderFlagged()}
                {activeTab === 'events' && renderEvents()}
                {activeTab === 'settings' && renderSettings()}
            </div>
        </div>
    );
};

export default CommunityOperatorDashboard;
