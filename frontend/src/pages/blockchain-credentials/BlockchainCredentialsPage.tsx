
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Shield, Link2, Award, CheckCircle, Globe,
    Clock, ChevronRight, ChevronLeft, Star, Lock, Eye,
    FileText, Building2, Users, Zap, ExternalLink,
    BadgeCheck, QrCode, Download, Share2
} from 'lucide-react';

// Brand tokens (unified with Education Pathway)
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
    purple: '#F3E8FF',
    purpleText: '#6B21A8',
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const BlockchainCredentialsPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const myCredentials = [
        { title: t('Bachelor of Computer Science', 'بكالوريوس علوم الحاسوب'), issuer: t('Ministry of Education (MOE)', 'وزارة التربية والتعليم'), date: t('Feb 2026', 'فبراير 2026'), txHash: '0x8c4b...f12e', network: 'Ethereum', status: t('Verified', 'مُوثّقة') as const, verifications: 28, badge: '🎓', primary: true },
        { title: t('Higher Education Equivalency Certificate', 'شهادة معادلة التعليم العالي'), issuer: t('Ministry of Higher Education & Scientific Research (MOHESR)', 'وزارة التعليم العالي والبحث العلمي'), date: t('Jan 2026', 'يناير 2026'), txHash: '0x3e7d...a93c', network: 'Ethereum', status: t('Verified', 'مُوثّقة') as const, verifications: 22, badge: '📜', primary: true },
        { title: t('UAE Teaching License', 'رخصة التدريس الإماراتية'), issuer: t('Ministry of Education (MOE)', 'وزارة التربية والتعليم'), date: t('Dec 2025', 'ديسمبر 2025'), txHash: '0x5a1f...b74d', network: 'Ethereum', status: t('Verified', 'مُوثّقة') as const, verifications: 18, badge: '🏛️', primary: true },
        { title: t('AWS Cloud Practitioner', 'ممارس AWS السحابي'), issuer: t('Amazon Web Services', 'خدمات أمازون السحابية'), date: t('Nov 2025', 'نوفمبر 2025'), txHash: '0x7f3a...e82d', network: 'Polygon', status: t('Verified', 'مُوثّقة') as const, verifications: 12, badge: '☁️', primary: false },
        { title: t('Google Data Analytics Professional', 'محترف تحليلات البيانات من Google'), issuer: 'Google', date: t('Oct 2025', 'أكتوبر 2025'), txHash: '0x4b2c...a91f', network: 'Polygon', status: t('Verified', 'مُوثّقة') as const, verifications: 8, badge: '📊', primary: false },
        { title: t('UAE Government Excellence Award', 'جائزة التميز الحكومي الإماراتية'), issuer: t('Federal Authority for Gov HR (FAHR)', 'الهيئة الاتحادية للموارد البشرية الحكومية'), date: t('Sep 2025', 'سبتمبر 2025'), txHash: '0x9d1e...c73b', network: 'Ethereum', status: t('Verified', 'مُوثّقة') as const, verifications: 15, badge: '🏅', primary: false },
    ];

    const verificationLog = [
        { credential: t('Bachelor of Computer Science (MOE)', 'بكالوريوس علوم الحاسوب (وزارة التعليم)'), verifier: t('Emirates Group HR', 'الموارد البشرية لمجموعة الإمارات'), date: t('Feb 16, 2026', '16 فبراير 2026'), purpose: t('Job Application', 'طلب توظيف') },
        { credential: t('Higher Education Equivalency (MOHESR)', 'معادلة التعليم العالي (وزارة التعليم العالي)'), verifier: t('Dubai Government HR', 'الموارد البشرية لحكومة دبي'), date: t('Feb 14, 2026', '14 فبراير 2026'), purpose: t('Credential Check', 'فحص الاعتماد') },
        { credential: t('UAE Teaching License (MOE)', 'رخصة التدريس الإماراتية (وزارة التعليم)'), verifier: t('Dubai Education Council', 'مجلس دبي للتعليم'), date: t('Feb 12, 2026', '12 فبراير 2026'), purpose: t('License Validation', 'التحقق من الرخصة') },
        { credential: t('Bachelor of Computer Science (MOE)', 'بكالوريوس علوم الحاسوب (وزارة التعليم)'), verifier: t('Etisalat Digital', 'اتصالات ديجيتال'), date: t('Feb 10, 2026', '10 فبراير 2026'), purpose: t('Interview', 'مقابلة') },
        { credential: t('AWS Cloud Practitioner', 'ممارس AWS السحابي'), verifier: t('Dubai Digital Authority', 'هيئة دبي الرقمية'), date: t('Feb 8, 2026', '8 فبراير 2026'), purpose: t('Vendor Pre-qual', 'تأهيل موردين') },
        { credential: t('Higher Education Equivalency (MOHESR)', 'معادلة التعليم العالي (وزارة التعليم العالي)'), verifier: t('University of Dubai', 'جامعة دبي'), date: t('Feb 5, 2026', '5 فبراير 2026'), purpose: t('Graduate Admission', 'قبول دراسات عليا') },
        { credential: t('Google Data Analytics', 'تحليلات بيانات Google'), verifier: t('Careem Engineering', 'هندسة كريم'), date: t('Feb 3, 2026', '3 فبراير 2026'), purpose: t('Job Application', 'طلب توظيف') },
    ];

    const issuers = [
        { name: t('Ministry of Education (MOE)', 'وزارة التربية والتعليم'), credentials: 85, verified: 42000, network: 'Ethereum', region: t('UAE', 'الإمارات'), tier: 'Primary' as const, tierLabel: t('Primary', 'رئيسي') },
        { name: t('Ministry of Higher Education & Scientific Research (MOHESR)', 'وزارة التعليم العالي والبحث العلمي'), credentials: 62, verified: 31500, network: 'Ethereum', region: t('UAE', 'الإمارات'), tier: 'Primary' as const, tierLabel: t('Primary', 'رئيسي') },
        { name: t('Federal Authority for Gov HR (FAHR)', 'الهيئة الاتحادية للموارد البشرية الحكومية'), credentials: 28, verified: 15200, network: 'Ethereum', region: t('UAE', 'الإمارات'), tier: 'Government' as const, tierLabel: t('Government', 'حكومي') },
        { name: t('Knowledge & Human Development Authority (KHDA)', 'هيئة المعرفة والتنمية البشرية'), credentials: 22, verified: 9400, network: 'Ethereum', region: t('UAE', 'الإمارات'), tier: 'Government' as const, tierLabel: t('Government', 'حكومي') },
        { name: t('Dubai Education Council', 'مجلس دبي للتعليم'), credentials: 34, verified: 12800, network: 'Ethereum', region: t('UAE', 'الإمارات'), tier: 'Government' as const, tierLabel: t('Government', 'حكومي') },
        { name: t('Amazon Web Services', 'خدمات أمازون السحابية'), credentials: 45, verified: 12400, network: 'Polygon', region: t('Global', 'عالمي'), tier: 'Industry' as const, tierLabel: t('Industry', 'قطاعي') },
        { name: 'Google', credentials: 32, verified: 9800, network: 'Polygon', region: t('Global', 'عالمي'), tier: 'Industry' as const, tierLabel: t('Industry', 'قطاعي') },
        { name: 'Microsoft', credentials: 38, verified: 11200, network: 'Polygon', region: t('Global', 'عالمي'), tier: 'Industry' as const, tierLabel: t('Industry', 'قطاعي') },
    ];

    const stats = [
        { value: '6', label: t('My Credentials', 'اعتماداتي'), icon: Award },
        { value: '103', label: t('Verifications', 'عمليات التحقق'), icon: CheckCircle },
        { value: '150+', label: t('Issuers', 'جهة مصدّرة'), icon: Building2 },
        { value: '100%', label: t('On-Chain', 'على السلسلة'), icon: Shield },
    ];

    /* ── Tab 1: My Credentials ── */
    const credentialsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Blockchain Credentials', 'اعتماداتي على البلوكتشين')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Your tamper-proof, verifiable digital credentials stored on the blockchain — featuring official credentials from the UAE Ministry of Education and Ministry of Higher Education, plus industry certifications.',
                    'اعتماداتك الرقمية غير القابلة للتلاعب والقابلة للتحقق المخزنة على البلوكتشين — تتضمن اعتمادات رسمية من وزارة التربية والتعليم ووزارة التعليم العالي، إضافة إلى شهادات قطاعية.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myCredentials.map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ fontSize: 28 }}>{c.badge}</span>
                                    {c.primary && <span style={{ position: 'absolute', top: -4, right: -6, width: 14, height: 14, borderRadius: '50%', background: brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={8} style={{ color: '#fff' }} /></span>}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{c.title}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                        <span>{c.issuer}</span>
                                        <span style={{ margin: '0 6px' }}>·</span>
                                        <span>{t('Issued', 'صدرت في')} {c.date}</span>
                                    </div>
                                </div>
                            </div>
                            <span style={{ background: brand.green, color: brand.greenText, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <BadgeCheck size={12} /> {c.status}
                            </span>
                        </div>

                        <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: brand.textSecondary }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Link2 size={12} /> {c.txHash}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Globe size={12} /> {c.network}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={12} /> {c.verifications} {t('verifications', 'تحقق')}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button style={{ background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <QrCode size={12} /> QR
                                </button>
                                <button style={{ background: 'transparent', color: brand.primary, border: `1px solid ${brand.primary}`, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Download size={12} /> PDF
                                </button>
                                <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Share2 size={12} /> {t('Share', 'مشاركة')}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Verification Log ── */
    const verifyTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Verification Log', 'سجل التحقق')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'See who has verified your credentials — complete transparency on how your qualifications are being accessed.',
                    'اطّلع على من تحقّق من اعتماداتك — شفافية كاملة حول كيفية الوصول إلى مؤهلاتك.'
                )}
            </p>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                    { label: t('Total Verifications', 'إجمالي التحققات'), value: '41', Icon: CheckCircle },
                    { label: t('This Month', 'هذا الشهر'), value: '5', Icon: Clock },
                    { label: t('Unique Verifiers', 'جهات فريدة'), value: '12', Icon: Users },
                    { label: t('Job Applications', 'طلبات التوظيف'), value: '8', Icon: FileText },
                ].map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, textAlign: 'center' }}>
                        <s.Icon size={20} style={{ color: brand.primary, margin: '0 auto 6px' }} />
                        <div style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                        <span style={{ fontSize: 11, color: brand.textSecondary }}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Log entries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {verificationLog.map((v, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CheckCircle size={18} style={{ color: brand.primary }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{v.verifier}</span>
                            <span style={{ fontSize: 13, color: brand.textSecondary }}> {t('verified', 'تحقّق من')} </span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: brand.textPrimary }}>{v.credential}</span>
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>
                                {v.date} · {v.purpose}
                            </div>
                        </div>
                        <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>
                            {v.purpose}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Trusted Issuers ── */
    const issuersTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Trusted Issuers', 'الجهات المصدّرة الموثوقة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Browse verified credential issuers on our blockchain network — led by UAE Ministry of Education and Ministry of Higher Education, plus government bodies and global industry leaders.',
                    'تصفّح الجهات المصدّرة الموثوقة على شبكة البلوكتشين — بقيادة وزارة التربية والتعليم ووزارة التعليم العالي، إضافة إلى الجهات الحكومية وقادة الصناعة العالميين.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {issuers.map((iss, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Building2 size={20} style={{ color: brand.primary }} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{iss.name}</h4>
                                    <span style={{ fontSize: 11, color: brand.textSecondary }}>{iss.region}</span>
                                </div>
                            </div>
                            <span style={{
                                background: iss.tier === 'Primary' ? brand.purple : iss.tier === 'Government' ? brand.blue : brand.green,
                                color: iss.tier === 'Primary' ? brand.purpleText : iss.tier === 'Government' ? brand.blueText : brand.greenText,
                                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 3
                            }}>
                                <Lock size={10} /> {iss.tierLabel}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span>{iss.credentials} {t('credentials', 'اعتماد')}</span>
                            <span>{iss.verified.toLocaleString()} {t('verified', 'تحقق')}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Globe size={12} /> {iss.network}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: How It Works ── */
    const howTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('How It Works', 'كيف يعمل')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Blockchain credentials are tamper-proof digital certificates stored on a decentralized ledger — no one can forge, alter, or revoke them without your knowledge.',
                    'اعتمادات البلوكتشين هي شهادات رقمية غير قابلة للتلاعب مخزنة على سجل لامركزي — لا يمكن لأحد تزويرها أو تعديلها أو إلغاؤها دون علمك.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {[
                    { step: 1, title: t('Earn a Credential', 'احصل على اعتماد'), desc: t('Complete a certification, training program, or assessment through any trusted issuer on our platform.', 'أكمل شهادة أو برنامج تدريبي أو تقييم من خلال أي جهة مصدّرة موثوقة على منصتنا.'), Icon: Award },
                    { step: 2, title: t('Issued on Blockchain', 'يُصدر على البلوكتشين'), desc: t("The issuer mints your credential as a verifiable token on the Polygon or Ethereum blockchain — it's permanent and tamper-proof.", 'تسكّ الجهة المصدّرة اعتمادك كرمز قابل للتحقق على شبكة Polygon أو Ethereum — إنه دائم وغير قابل للتلاعب.'), Icon: Link2 },
                    { step: 3, title: t('Share Instantly', 'شارك فوراً'), desc: t('Share your credential via QR code, link, or PDF. Employers can verify it in seconds without contacting the issuer.', 'شارك اعتمادك عبر رمز QR أو رابط أو PDF. يمكن لأصحاب العمل التحقق منه في ثوانٍ دون الاتصال بالجهة المصدّرة.'), Icon: Share2 },
                    { step: 4, title: t('Verify Anywhere', 'تحقّق من أي مكان'), desc: t('Any verifier worldwide can confirm the authenticity, issuer, and date of your credential by checking the blockchain directly.', 'يمكن لأي جهة تحقق في العالم التأكد من صحة اعتمادك والجهة المصدّرة والتاريخ بالرجوع مباشرة إلى البلوكتشين.'), Icon: CheckCircle },
                ].map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 16, color: brand.primary }}>
                            {s.step}
                        </div>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{s.title}</h3>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Benefits */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Zap size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Why Blockchain?', 'لماذا البلوكتشين؟')}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        t('Tamper-proof — no one can forge or alter your credentials after issuance', 'غير قابلة للتلاعب — لا يمكن لأحد تزوير أو تعديل اعتماداتك بعد الإصدار'),
                        t('Instant verification — employers verify in seconds, no phone calls or emails needed', 'تحقق فوري — يتحقق أصحاب العمل في ثوانٍ، دون حاجة لمكالمات أو رسائل'),
                        t('You own it — your credential exists on the blockchain forever, even if the issuer closes', 'ملكك أنت — اعتمادك موجود على البلوكتشين للأبد، حتى لو أغلقت الجهة المصدّرة'),
                        t('Global recognition — accepted worldwide by any organization that supports W3C verifiable credentials', 'اعتراف عالمي — مقبولة في جميع أنحاء العالم من أي مؤسسة تدعم اعتمادات W3C القابلة للتحقق'),
                    ].map((b, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{b}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'credentials', label: t('My Credentials', 'اعتماداتي'), icon: <Shield className="h-4 w-4" />, content: credentialsTab },
        { id: 'verification', label: t('Verification Log', 'سجل التحقق'), icon: <CheckCircle className="h-4 w-4" />, content: verifyTab },
        { id: 'issuers', label: t('Trusted Issuers', 'الجهات الموثوقة'), icon: <Building2 className="h-4 w-4" />, content: issuersTab },
        { id: 'how-it-works', label: t('How It Works', 'كيف يعمل'), icon: <Zap className="h-4 w-4" />, content: howTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Blockchain Credentials', 'اعتمادات البلوكتشين')}
            description={t(
                'Tamper-proof, instantly verifiable digital credentials stored on the blockchain — own your qualifications and share them with employers worldwide',
                'اعتمادات رقمية غير قابلة للتلاعب وقابلة للتحقق فوراً مخزنة على البلوكتشين — امتلك مؤهلاتك وشاركها مع أصحاب العمل حول العالم'
            )}
            icon={<Shield className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="credentials"
        />
    );
};

export default BlockchainCredentialsPage;
