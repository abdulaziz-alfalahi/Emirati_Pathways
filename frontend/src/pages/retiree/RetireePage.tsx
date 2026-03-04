
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Heart, Users, Shield, Award, Calendar,
    Activity, Phone, ArrowRight, ArrowLeft, CheckCircle, Building,
    MapPin, Star, Clock
} from 'lucide-react';

/* ──────────────────────── COMPONENT ──────────────────────── */

const RetireePage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const pensionBenefits = [
        { title: t('GPSSA Pension', 'معاش الهيئة العامة للمعاشات'), desc: t('General Pension and Social Security Authority — monthly pension based on years of service and final salary. Covers all UAE nationals in federal and private sectors.', 'الهيئة العامة للمعاشات والتأمينات الاجتماعية — معاش شهري بناءً على سنوات الخدمة والراتب الأخير. تشمل جميع المواطنين الإماراتيين في القطاعين الاتحادي والخاص.'), icon: '🏛️', provider: t('GPSSA', 'الهيئة العامة للمعاشات'), details: [t('Based on final salary × service years', 'بناءً على الراتب الأخير × سنوات الخدمة'), t('Minimum 20 years of service', 'حد أدنى 20 سنة خدمة'), t('Annual cost-of-living adjustments', 'تعديلات سنوية لتكاليف المعيشة'), t('24/7 digital portal access', 'وصول على مدار الساعة للبوابة الرقمية')] },
        { title: t('Abu Dhabi Pension Fund (ADPF)', 'صندوق أبوظبي للتقاعد'), desc: t('Retirement benefits for Abu Dhabi government employees — comprehensive pension, gratuity, and end-of-service benefits.', 'مزايا تقاعد لموظفي حكومة أبوظبي — معاش شامل ومكافأة نهاية الخدمة.'), icon: '🏦', provider: t('ADPF', 'صندوق أبوظبي للتقاعد'), details: [t('Abu Dhabi government employees', 'موظفو حكومة أبوظبي'), t('Pension + gratuity combined', 'معاش + مكافأة مجمّعة'), t('Family pension for dependents', 'معاش عائلي للمعالين'), t('Medical insurance continuation', 'استمرار التأمين الطبي')] },
        { title: t('Dubai Government Pension', 'معاش حكومة دبي'), desc: t('DGRFA manages Dubai government employee pensions — generous benefits including housing and family support.', 'تدير الهيئة العامة للتقاعد والتأمينات الاجتماعية في دبي معاشات موظفي الحكومة — مزايا سخية تشمل الإسكان ودعم الأسرة.'), icon: '🌆', provider: t('DGRFA', 'الهيئة العامة لتقاعد دبي'), details: [t('Dubai government employees', 'موظفو حكومة دبي'), t('Housing benefit continuation', 'استمرار مزايا الإسكان'), t("Children's education support", 'دعم تعليم الأبناء'), t('Special merit awards', 'جوائز الجدارة الخاصة')] },
        { title: t('Private Sector End-of-Service', 'نهاية خدمة القطاع الخاص'), desc: t('End-of-service gratuity for private sector employees under UAE Labour Law — 21 days salary per year for first 5 years, 30 days per year thereafter.', 'مكافأة نهاية الخدمة لموظفي القطاع الخاص بموجب قانون العمل الإماراتي — 21 يوم راتب سنوياً لأول 5 سنوات، و30 يوماً سنوياً بعد ذلك.'), icon: '💼', provider: t('Ministry of Human Resources', 'وزارة الموارد البشرية'), details: [t('21 days/year (first 5 years)', '21 يوماً/سنة (أول 5 سنوات)'), t('30 days/year (after 5 years)', '30 يوماً/سنة (بعد 5 سنوات)'), t('Based on last basic salary', 'بناءً على آخر راتب أساسي'), t('Payable upon contract end', 'تُدفع عند انتهاء العقد')] },
    ];

    const healthcareServices = [
        { title: t('Thiqa Health Insurance', 'تأمين ثقة الصحي'), provider: t('DAMAN / Abu Dhabi', 'ضمان / أبوظبي'), desc: t('Premium health insurance for retired UAE nationals in Abu Dhabi — covers outpatient, inpatient, dental, maternity, and chronic disease management.', 'تأمين صحي متميز للمتقاعدين الإماراتيين في أبوظبي — يشمل العيادات الخارجية والداخلية والأسنان والأمومة وإدارة الأمراض المزمنة.'), coverage: t('Comprehensive', 'شامل'), icon: '🏥' },
        { title: t('Saada Card Benefits', 'مزايا بطاقة سعادة'), provider: t('Ministry of Community Development', 'وزارة تنمية المجتمع'), desc: t('Saada Card provides retirees with priority access to government healthcare, discounts at partner pharmacies, and wellness programme enrolment.', 'توفر بطاقة سعادة للمتقاعدين أولوية الوصول للرعاية الصحية الحكومية وخصومات في الصيدليات الشريكة والتسجيل في برامج الصحة.'), coverage: t('Government Services', 'الخدمات الحكومية'), icon: '💳' },
        { title: t('Home Healthcare Programme', 'برنامج الرعاية الصحية المنزلية'), provider: t('DoH / SEHA', 'دائرة الصحة / صحة'), desc: t('In-home nursing, physiotherapy, and specialist visits for senior citizens who prefer care at home — covered under national insurance.', 'تمريض منزلي وعلاج طبيعي وزيارات متخصصة لكبار السن الذين يفضلون الرعاية في المنزل — مغطاة بالتأمين الوطني.'), coverage: t('Home-Based Care', 'رعاية منزلية'), icon: '🏠' },
        { title: t('Mental Wellness Support', 'دعم الصحة النفسية'), provider: t('SEHA / Dubai Health', 'صحة / صحة دبي'), desc: t('Counselling, cognitive health programmes, and social wellbeing services designed specifically for retirees — combating isolation and maintaining mental sharpness.', 'إرشاد نفسي وبرامج صحة إدراكية وخدمات رفاهية اجتماعية مصممة خصيصاً للمتقاعدين — لمكافحة العزلة والحفاظ على الحدة الذهنية.'), coverage: t('Mental Health', 'الصحة النفسية'), icon: '🧠' },
    ];

    const mentoring = t('Mentoring', 'إرشاد');
    const advisory = t('Advisory', 'استشاري');
    const volunteering = t('Volunteering', 'تطوع');
    const consulting = t('Consulting', 'استشارات');
    const teaching = t('Teaching', 'تدريس');

    const engagementOpportunities = [
        { title: t('Weyak Mentorship Programme', 'برنامج وياك للإرشاد'), org: t('Ministry of Community Development', 'وزارة تنمية المجتمع'), type: mentoring, desc: t('Share your decades of professional experience with young Emiratis entering the workforce — structured mentoring sessions and workshops.', 'شارك عقوداً من خبرتك المهنية مع الشباب الإماراتي الداخل لسوق العمل — جلسات إرشاد وورش عمل منظمة.'), commitment: t('4–6 hrs/week', '4–6 ساعات/أسبوع'), spots: 50 },
        { title: t('Majlis Advisory Council', 'مجلس المجالس الاستشاري'), org: t('Federal National Council', 'المجلس الوطني الاتحادي'), type: advisory, desc: t('Retired senior officials invited to serve on advisory councils for government policy review — leveraging your governance experience.', 'يُدعى كبار المسؤولين المتقاعدين للعمل في مجالس استشارية لمراجعة السياسات الحكومية — الاستفادة من خبرتك في الحوكمة.'), commitment: t('8 hrs/month', '8 ساعات/شهر'), spots: 20 },
        { title: t('Heritage & Cultural Preservation', 'الحفاظ على التراث والثقافة'), org: t('Department of Culture & Tourism', 'دائرة الثقافة والسياحة'), type: volunteering, desc: t('Help preserve UAE oral history, traditional crafts, and cultural heritage through storytelling, documentation, and community workshops.', 'ساهم في الحفاظ على التاريخ الشفهي الإماراتي والحرف التقليدية والتراث الثقافي من خلال الرواية والتوثيق وورش العمل المجتمعية.'), commitment: t('3–5 hrs/week', '3–5 ساعات/أسبوع'), spots: 40 },
        { title: t('Board Observer Programme', 'برنامج مراقب مجلس الإدارة'), org: t('Abu Dhabi Securities Exchange', 'سوق أبوظبي للأوراق المالية'), type: consulting, desc: t('Retired executives and directors can serve as board observers or non-executive directors for listed companies — governance expertise in demand.', 'يمكن للتنفيذيين والمديرين المتقاعدين العمل كمراقبين في مجالس الإدارة أو أعضاء غير تنفيذيين للشركات المدرجة — خبرة الحوكمة مطلوبة.'), commitment: t('Monthly meetings', 'اجتماعات شهرية'), spots: 15 },
        { title: t('Entrepreneurship Support', 'دعم ريادة الأعمال'), org: t('Khalifa Fund', 'صندوق خليفة'), type: mentoring, desc: t('Guide young Emirati entrepreneurs through business planning, financial management, and industry connections — your experience is their advantage.', 'وجّه رواد الأعمال الإماراتيين الشباب في تخطيط الأعمال والإدارة المالية والعلاقات الصناعية — خبرتك هي ميزتهم.'), commitment: t('4 hrs/week', '4 ساعات/أسبوع'), spots: 30 },
        { title: t('University Guest Lecturing', 'محاضرات جامعية استضافية'), org: t('UAE University / Zayed University', 'جامعة الإمارات / جامعة زايد'), type: teaching, desc: t('Share industry insights with the next generation — guest lecture series for final-year students in business, engineering, and public administration.', 'شارك رؤى صناعية مع الجيل القادم — سلسلة محاضرات لطلاب السنة الأخيرة في الأعمال والهندسة والإدارة العامة.'), commitment: t('Monthly lectures', 'محاضرات شهرية'), spots: 25 },
    ];

    const lifestylePerks = [
        { icon: '✈️', title: t('Travel Discounts', 'خصومات السفر'), desc: t('Up to 30% off Emirates & Etihad flights, plus partner hotel rates across the GCC', 'خصم يصل إلى 30% على رحلات طيران الإمارات والاتحاد، مع أسعار فنادق شريكة في دول الخليج'), category: t('Travel', 'سفر') },
        { icon: '🏊', title: t('Fitness & Recreation', 'اللياقة والترفيه'), desc: t('Free access to 50+ government fitness centres, swimming pools, and community sports facilities', 'دخول مجاني لأكثر من 50 مركز لياقة حكومياً ومسابح ومرافق رياضية مجتمعية'), category: t('Wellness', 'صحة') },
        { icon: '📚', title: t('Lifelong Learning', 'التعلم مدى الحياة'), desc: t('Free university course auditing at UAE University, Zayed University, and Khalifa University', 'حضور مجاني لمحاضرات جامعية في جامعة الإمارات وجامعة زايد وجامعة خليفة'), category: t('Education', 'تعليم') },
        { icon: '🛒', title: t('Retail Discounts', 'خصومات التجزئة'), desc: t('Saada Card and senior citizen discounts at 200+ retail partners and pharmacies', 'خصومات بطاقة سعادة وكبار السن في أكثر من 200 شريك تجزئة وصيدلية'), category: t('Shopping', 'تسوّق') },
        { icon: '🎭', title: t('Cultural Access', 'الوصول الثقافي'), desc: t('Free or discounted entry to Louvre Abu Dhabi, cultural events, and national heritage sites', 'دخول مجاني أو مخفّض إلى لوفر أبوظبي والفعاليات الثقافية ومواقع التراث الوطني'), category: t('Culture', 'ثقافة') },
        { icon: '🚗', title: t('Transport Benefits', 'مزايا النقل'), desc: t('Free RTA public transport in Dubai, subsidised taxi services, and priority parking', 'نقل عام مجاني من هيئة الطرق في دبي وخدمات تاكسي مدعومة وأولوية في المواقف'), category: t('Transport', 'نقل') },
    ];

    const serviceCentres = [
        { city: t('Abu Dhabi', 'أبوظبي'), location: t('Al Bateen, GPSSA HQ', 'البطين، مقر الهيئة العامة للمعاشات'), phone: '800-2070' },
        { city: t('Dubai', 'دبي'), location: t('Al Twar, DGRFA', 'الطوار، الهيئة العامة لتقاعد دبي'), phone: '800-DGRFA' },
        { city: t('Sharjah', 'الشارقة'), location: t('Al Khan, SSD', 'الخان، دائرة الخدمات الاجتماعية'), phone: '06-5068888' },
        { city: t('Al Ain', 'العين'), location: t('Zakher, GPSSA Branch', 'زاخر، فرع الهيئة العامة للمعاشات'), phone: '800-2070' },
    ];

    /* Badge color helper */
    const badgeColor = (type: string) => {
        const map: Record<string, string> = { [mentoring]: 'ep-badge--blue', [advisory]: 'ep-badge--purple', [consulting]: 'ep-badge--amber', [volunteering]: 'ep-badge--green', [teaching]: 'ep-badge--green' };
        return map[type] || 'ep-badge--teal';
    };

    const stats = [
        { value: '15,000+', label: t('Active Retirees', 'متقاعد نشط'), icon: Users },
        { value: '96%', label: t('Satisfaction Rate', 'معدل الرضا'), icon: Star },
        { value: '120+', label: t('Monthly Activities', 'نشاط شهري'), icon: Calendar },
        { value: '45+', label: t('Support Programmes', 'برنامج دعم'), icon: Heart },
    ];

    /* ── Tab 1: Pension & Financial ── */
    const pensionTab = (
        <div>
            <h2 className="ep-section-title">{t('Pension & Financial Benefits', 'المعاشات والمزايا المالية')}</h2>
            <p className="ep-section-desc">
                {t(
                    'Comprehensive pension and end-of-service benefits for UAE nationals — from GPSSA, ADPF, DGRFA, and private sector providers. Your lifetime of service is recognised and rewarded.',
                    'معاشات شاملة ومزايا نهاية الخدمة للمواطنين الإماراتيين — من الهيئة العامة للمعاشات وصندوق أبوظبي للتقاعد والهيئة العامة لتقاعد دبي ومقدمي القطاع الخاص. عمرك من الخدمة مُقدَّر ومُكافأ.'
                )}
            </p>

            <div className="ep-grid ep-grid--2col">
                {pensionBenefits.map((b, i) => (
                    <div key={i} className="ep-card">
                        <div className="ep-card__header">
                            <span className="ep-card__icon">{b.icon}</span>
                            <div>
                                <h3 className="ep-card__title">{b.title}</h3>
                                <div className="ep-card__subtitle">{b.provider}</div>
                            </div>
                        </div>
                        <p className="ep-card__desc">{b.desc}</p>
                        <div className="ep-card__divider">
                            {b.details.map((d, j) => (
                                <div key={j} className="ep-checklist">
                                    <CheckCircle size={12} className="ep-checklist__icon" />
                                    <span className="ep-checklist__text">{d}</span>
                                </div>
                            ))}
                        </div>
                        <button className="ep-btn ep-btn--primary-full">{t('Learn More', 'اعرف المزيد')}</button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Healthcare ── */
    const healthcareTab = (
        <div>
            <h2 className="ep-section-title">{t('Healthcare & Wellness', 'الرعاية الصحية والعافية')}</h2>
            <p className="ep-section-desc">
                {t(
                    'Premium healthcare services for retired UAE nationals — from Thiqa insurance and home healthcare to mental wellness programmes. Your health is a national priority.',
                    'خدمات رعاية صحية متميزة للمتقاعدين الإماراتيين — من تأمين ثقة والرعاية المنزلية إلى برامج الصحة النفسية. صحتك أولوية وطنية.'
                )}
            </p>

            <div className="ep-grid ep-grid--3col ep-grid--gap-md" style={{ marginBottom: 24 }}>
                {healthcareServices.map((s, i) => (
                    <div key={i} className="ep-card" style={{ gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="ep-card__header">
                                <span className="ep-card__icon">{s.icon}</span>
                                <div>
                                    <h3 className="ep-card__title" style={{ fontSize: 14 }}>{s.title}</h3>
                                    <div className="ep-card__subtitle">{s.provider}</div>
                                </div>
                            </div>
                            <span className="ep-badge ep-badge--green">{s.coverage}</span>
                        </div>
                        <p className="ep-card__desc">{s.desc}</p>
                        <button className="ep-btn ep-btn--outline">{t('Access Service', 'الوصول للخدمة')}</button>
                    </div>
                ))}
            </div>

            {/* Emergency contacts */}
            <div className="ep-banner ep-banner--red">
                <Phone size={24} style={{ color: 'var(--ep-red-text)' }} />
                <div className="ep-banner__body">
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ep-red-text)', marginBottom: 2 }}>{t('24/7 Senior Health Helpline', 'خط مساعدة صحة كبار السن على مدار الساعة')}</div>
                    <div style={{ fontSize: 13, color: 'var(--ep-red-text)' }}>{t('For urgent health queries, home visit requests, or emergency medical guidance', 'للاستفسارات الصحية العاجلة وطلبات الزيارة المنزلية أو التوجيه الطبي الطارئ')}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="ep-contact-chip" style={{ color: 'var(--ep-red-text)' }}>800-SEHA (7342)</span>
                    <span className="ep-contact-chip" style={{ color: 'var(--ep-red-text)' }}>999</span>
                </div>
            </div>
        </div>
    );

    /* ── Tab 3: Engagement ── */
    const engagementTab = (
        <div>
            <h2 className="ep-section-title">{t('Stay Active & Engaged', 'ابقَ نشطاً ومنخرطاً')}</h2>
            <p className="ep-section-desc">
                {t(
                    "Retirement is a new chapter, not the end of the story. Share your expertise through mentoring, advisory councils, cultural preservation, and teaching — your experience is the nation's asset.",
                    'التقاعد فصل جديد، وليس نهاية القصة. شارك خبرتك من خلال الإرشاد والمجالس الاستشارية وحفظ التراث والتدريس — خبرتك ثروة وطنية.'
                )}
            </p>

            <div className="ep-stack">
                {engagementOpportunities.map((o, i) => (
                    <div key={i} className="ep-card ep-card--row">
                        <div className="ep-card__body">
                            <h3 className="ep-card__title" style={{ marginBottom: 4 }}>{o.title}</h3>
                            <div className="ep-card__meta">
                                <span className="ep-card__meta-item"><Building size={12} /> {o.org}</span>
                                <span className="ep-card__meta-item"><Clock size={12} /> {o.commitment}</span>
                            </div>
                            <p className="ep-card__desc">{o.desc}</p>
                        </div>
                        <div className="ep-card__actions">
                            <span className={`ep-badge ${badgeColor(o.type)}`}>{o.type}</span>
                            <span className="ep-text-sm">{o.spots} {t('spots open', 'مقعد متاح')}</span>
                            <button className="ep-btn ep-btn--primary">
                                {t('Apply', 'تقديم')} <ArrowIcon size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Lifestyle Perks ── */
    const perksTab = (
        <div>
            <h2 className="ep-section-title">{t('Lifestyle Benefits & Perks', 'مزايا وامتيازات نمط الحياة')}</h2>
            <p className="ep-section-desc">
                {t(
                    "Exclusive discounts, free access, and priority services for retired UAE nationals — from travel and fitness to education and culture. You've earned it.",
                    'خصومات حصرية ودخول مجاني وخدمات أولوية للمتقاعدين الإماراتيين — من السفر واللياقة إلى التعليم والثقافة. لقد استحققتها.'
                )}
            </p>

            <div className="ep-grid ep-grid--3col ep-grid--gap-md" style={{ marginBottom: 28 }}>
                {lifestylePerks.map((p, i) => (
                    <div key={i} className="ep-card ep-card--center">
                        <span style={{ fontSize: 32 }}>{p.icon}</span>
                        <h3 className="ep-card__title">{p.title}</h3>
                        <p className="ep-card__desc" style={{ marginBottom: 10 }}>{p.desc}</p>
                        <span className="ep-badge ep-badge--teal ep-badge--pill">{p.category}</span>
                    </div>
                ))}
            </div>

            {/* Saada Card CTA */}
            <div className="ep-banner ep-banner--teal">
                <div className="ep-banner__body" style={{ minWidth: 240 }}>
                    <h3 className="ep-banner__title">{t('Get Your Saada Card', 'احصل على بطاقة سعادة')}</h3>
                    <p className="ep-banner__desc">
                        {t(
                            'The Saada Card is your gateway to all retiree benefits — priority healthcare, retail discounts, cultural access, and transport benefits. Apply through the Ministry of Community Development.',
                            'بطاقة سعادة هي بوابتك لجميع مزايا المتقاعدين — أولوية الرعاية الصحية وخصومات التجزئة والوصول الثقافي ومزايا النقل. قدّم عبر وزارة تنمية المجتمع.'
                        )}
                    </p>
                </div>
                <button className="ep-btn ep-btn--primary ep-btn--lg">
                    {t('Apply for Saada Card', 'تقديم على بطاقة سعادة')} <ArrowIcon size={16} />
                </button>
            </div>

            {/* Service centres */}
            <div className="ep-card" style={{ marginTop: 20 }}>
                <h3 className="ep-card__title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <MapPin size={18} style={{ color: 'var(--ep-primary)' }} /> {t('Retiree Service Centres', 'مراكز خدمة المتقاعدين')}
                </h3>
                <div className="ep-grid ep-grid--4col ep-grid--gap-sm">
                    {serviceCentres.map((c, i) => (
                        <div key={i} className="ep-info-block">
                            <div className="ep-info-block__title">{c.city}</div>
                            <div className="ep-info-block__desc">{c.location}</div>
                            <div className="ep-info-block__link">{c.phone}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'pension', label: t('Pension & Financial', 'المعاشات والمالية'), icon: <Shield className="h-4 w-4" />, content: pensionTab },
        { id: 'healthcare', label: t('Healthcare', 'الرعاية الصحية'), icon: <Heart className="h-4 w-4" />, content: healthcareTab },
        { id: 'engagement', label: t('Stay Engaged', 'ابقَ منخرطاً'), icon: <Activity className="h-4 w-4" />, content: engagementTab },
        { id: 'perks', label: t('Lifestyle Perks', 'امتيازات نمط الحياة'), icon: <Award className="h-4 w-4" />, content: perksTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Retiree Services', 'خدمات المتقاعدين')}
            description={t(
                'Comprehensive support for retired UAE nationals — pension management, premium healthcare, engagement opportunities, and exclusive lifestyle benefits. Your lifetime of service is honoured',
                'دعم شامل للمتقاعدين الإماراتيين — إدارة المعاشات والرعاية الصحية المتميزة وفرص المشاركة ومزايا نمط الحياة الحصرية. عمرك من الخدمة مُكرَّم'
            )}
            icon={<Heart className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="pension"
        />
    );
};

export default RetireePage;
