import React, { useState, useEffect, useRef } from 'react';
import { profileService, CandidateProfile } from '@/services/profile/profileService';
import { Download, Layout, Printer, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { cvStorageService } from '@/services/cvStorageService';
import toast from 'react-hot-toast';

export const CVPreviewModule = () => {
    const [profile, setProfile] = useState<any>(null);
    const [template, setTemplate] = useState('modern');
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState(false);
    const cvRef = useRef<HTMLDivElement>(null);
    const { language, isRTL } = useLanguage();
    const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

    const handleShareLink = async () => {
        setSharing(true);
        try {
            // 1. Fetch CV list
            const listRes = await cvStorageService.listCVs();
            let cvId = null;
            if (listRes.success && listRes.data && listRes.data.length > 0) {
                // Find visible CV or fallback to the first one
                const visibleCV = listRes.data.find(c => c.is_visible) || listRes.data[0];
                cvId = visibleCV.id;
                if (!visibleCV.is_visible) {
                    await cvStorageService.setVisible(cvId);
                }
            } else {
                // 2. If no CV exists, create one from current profile
                const personalInfo = {
                    firstName: profile?.full_name?.split(' ')[0] || '',
                    lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
                    email: profile?.contact?.email || '',
                    phone: profile?.contact?.phone || '',
                    location: profile?.contact?.location || '',
                    nationality: profile?.nationality || 'UAE'
                };

                const cvData = {
                    personalInfo,
                    professionalSummary: profile?.bio || '',
                    technicalSkills: profile?.skills?.map((s: any) => s.name) || [],
                    softSkills: [],
                    experience: profile?.experience?.map((exp: any) => ({
                        jobTitle: exp.role || '',
                        company: exp.company || '',
                        location: exp.location || '',
                        startDate: exp.start_date || '',
                        endDate: exp.end_date || '',
                        responsibilities: exp.description || ''
                    })) || [],
                    education: profile?.education?.map((edu: any) => ({
                        degree: edu.degree || '',
                        institution: edu.school || '',
                        graduationYear: edu.graduation_year || '',
                        field: edu.field_of_study || ''
                    })) || []
                };

                const saveRes = await cvStorageService.saveCV({
                    cvData,
                    title: profile?.full_name ? `${profile.full_name}'s CV` : 'My CV',
                    templateId: template
                });

                if (saveRes.success && saveRes.cv_id) {
                    cvId = saveRes.cv_id;
                    await cvStorageService.setVisible(cvId);
                }
            }

            if (cvId) {
                const shareUrl = `${window.location.origin}/cv/share/${cvId}`;
                await navigator.clipboard.writeText(shareUrl);
                toast.success(t('Shareable CV link copied to clipboard!', 'تم نسخ رابط السيرة الذاتية للمشاركة إلى الحافظة!'));
            } else {
                toast.error(t('Failed to generate share link', 'فشل إنشاء رابط المشاركة'));
            }
        } catch (err: any) {
            console.error('Error sharing link:', err);
            toast.error(t('An error occurred while sharing the link', 'حدث خطأ أثناء مشاركة الرابط'));
        } finally {
            setSharing(false);
        }
    };


    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await profileService.getProfile();
            if (res.success) {
                setProfile(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!cvRef.current) return;

        try {
            const element = cvRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                height: element.scrollHeight,
                windowHeight: element.scrollHeight
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            const ratio = pageWidth / canvasWidth;
            const scaledHeight = canvasHeight * ratio;

            let heightLeft = scaledHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pageWidth, scaledHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - scaledHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pageWidth, scaledHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${profile?.headline || 'CV'}_${template}_Emirati_Pathway.pdf`);
        } catch (e) {
            alert(t('Failed to generate PDF', 'فشل إنشاء ملف PDF'));
        }
    };

    if (loading) return <div className="p-8">{t('Generating preview...', 'جارٍ إنشاء المعاينة...')}</div>;

    const templateLabels: Record<string, string> = {
        'modern': t('Modern', 'عصري'),
        'classic': t('Classic', 'كلاسيكي'),
        'creative': t('Creative', 'إبداعي'),
        'executive': t('Executive', 'تنفيذي')
    };

    const getTemplateStyles = () => {
        switch (template) {
            case 'classic':
                return {
                    container: "font-serif text-gray-900 border-t-8 border-gray-800 text-xs",
                    header: "text-center border-b-2 border-gray-300 pb-4 mb-6",
                    name: "text-2xl font-bold tracking-widest uppercase mb-1",
                    sectionTitle: "text-sm font-bold border-b border-gray-300 mb-3 pb-1 uppercase tracking-widest",
                    grid: "block space-y-6"
                };
            case 'creative':
                return {
                    container: "font-sans text-gray-800 flex flex-row-reverse text-xs",
                    header: "hidden",
                    sidebar: "w-1/3 bg-purple-900 text-white p-4 min-h-full",
                    main: "w-2/3 p-4",
                    name: "text-2xl font-bold mb-2",
                    sectionTitle: "text-purple-900 font-bold text-sm mb-2 uppercase tracking-wide border-b pb-0.5",
                    grid: "flex gap-0"
                };
            case 'executive':
                return {
                    container: "font-sans text-slate-900 text-xs",
                    header: "bg-slate-900 text-white p-6 mb-6 -mx-[15mm] -mt-[15mm]",
                    name: "text-2xl font-bold mb-1",
                    subtext: "text-slate-300 text-sm",
                    sectionTitle: `text-slate-900 font-bold text-sm ${isRTL ? 'border-r-4 pr-2' : 'border-l-4 pl-2'} border-slate-900 mb-3 uppercase`,
                    grid: "grid grid-cols-3 gap-6"
                };
            default:
                return {
                    container: "font-sans text-gray-900 text-xs",
                    header: "border-b border-gray-900 pb-4 mb-4",
                    name: "text-2xl font-bold uppercase tracking-tight mb-1",
                    sectionTitle: "text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 border-b pb-0.5",
                    grid: "grid grid-cols-3 gap-6"
                };
        }
    };

    const styles = getTemplateStyles();
    const isCreative = template === 'creative';

    const contactDetails = [
        profile?.contact?.email,
        profile?.contact?.phone,
        profile?.contact?.location
    ].filter(val => {
        if (!val) return false;
        const clean = val.trim();
        return clean !== '' && 
               clean !== '***@***.com' && 
               clean !== '+971 *******' && 
               !clean.includes('undefined');
    });

    const headlineText = profile?.headline || (profile?.bio ? profile.bio.slice(0, 100) + '...' : '');

    return (
        <div className="flex h-[calc(100vh-100px)]">
            {/* Controls Sidebar */}
            <div className={`w-80 bg-white ${isRTL ? 'border-l' : 'border-r'} border-gray-200 p-6 overflow-y-auto`}>
                <h2 className="text-xl font-bold mb-6">{t('CV Settings', 'إعدادات السيرة الذاتية')}</h2>

                {/* Template Selector */}
                <div className="mb-8">
                    <label className="text-sm font-semibold text-gray-500 mb-3 block">{t('Choose Template', 'اختر القالب')}</label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'modern', color: 'bg-teal-50', border: 'border-teal-200' },
                            { id: 'classic', color: 'bg-gray-50', border: 'border-gray-300' },
                            { id: 'creative', color: 'bg-purple-900', border: 'border-purple-200' },
                            { id: 'executive', color: 'bg-slate-800', border: 'border-slate-600' }
                        ].map(tmpl => (
                            <button
                                key={tmpl.id}
                                onClick={() => setTemplate(tmpl.id)}
                                className={`p-2 border rounded-lg text-sm capitalize transition-all ${template === tmpl.id
                                    ? 'border-teal-500 ring-2 ring-teal-200 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className={`h-16 mb-2 rounded border ${tmpl.border} ${tmpl.color} flex items-center justify-center opacity-80`}>
                                    <div className="w-8 h-[2px] bg-current opacity-40"></div>
                                </div>
                                <span className={template === tmpl.id ? 'text-teal-700 font-medium' : 'text-gray-600'}>{templateLabels[tmpl.id]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 shadow-sm"
                    >
                        <Download size={18} />
                        <span>{t('Download PDF', 'تحميل PDF')}</span>
                    </button>
                    <button
                        onClick={handleShareLink}
                        disabled={sharing}
                        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                        <Share2 size={18} />
                        <span>{sharing ? t('Sharing...', 'جاري المشاركة...') : t('Share Link', 'مشاركة الرابط')}</span>
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex justify-center">
                <div
                    ref={cvRef}
                    className={`bg-white shadow-2xl w-[210mm] min-h-[297mm] h-auto p-[15mm] mx-auto ${styles.container}`}
                >
                    {isCreative ? (
                        <div className="-m-[15mm] flex min-h-[297mm]">
                            <div className={styles.sidebar}>
                                <h1 className="text-3xl font-bold mb-2">{profile?.full_name || t('My Name', 'اسمي')}</h1>
                                <p className="text-purple-200 mb-6">{profile?.headline}</p>

                                <div className="space-y-6 text-sm">
                                    <div>
                                        <h3 className="font-bold border-b border-purple-700 pb-1 mb-2">{t('Contact', 'التواصل')}</h3>
                                        <div className="space-y-1 text-purple-100">
                                            {contactDetails.map((detail, idx) => (
                                                <p key={idx}>{detail}</p>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold border-b border-purple-700 pb-1 mb-2">{t('Skills', 'المهارات')}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile?.skills?.map((s: any, i: number) => (
                                                <span key={i} className="bg-purple-800 px-2 py-1 rounded text-xs">{s.name}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold border-b border-purple-700 pb-1 mb-2">{t('Education', 'التعليم')}</h3>
                                        {profile?.education?.map((edu: any, i: number) => (
                                            <div key={i} className="mb-3">
                                                <div className="font-bold">{edu.institution}</div>
                                                <div className="text-purple-200">{edu.degree}</div>
                                                <div className="text-xs opacity-70">{new Date(edu.start_date).getFullYear()} - {new Date(edu.end_date).getFullYear()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.main}>
                                <section className="mb-8">
                                    <h3 className={styles.sectionTitle}>{t('Profile', 'الملف الشخصي')}</h3>
                                    <p className="text-gray-600 leading-relaxed">{profile?.bio}</p>
                                </section>

                                <section>
                                    <h3 className={styles.sectionTitle}>{t('Experience', 'الخبرة')}</h3>
                                    <div className={`space-y-6 ${isRTL ? 'border-r-2 pr-4' : 'border-l-2 pl-4'} border-purple-100`}>
                                        {profile?.experience?.sort((a: any, b: any) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime()).map((exp: any, i: number) => (
                                            <div key={i} className="relative">
                                                <div className={`absolute ${isRTL ? '-right-[21px]' : '-left-[21px]'} top-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-white`}></div>
                                                <h4 className="font-bold text-gray-900">{exp.job_title}</h4>
                                                <div className="text-sm text-purple-600 font-medium mb-1">{exp.company} | {new Date(exp.start_date).getFullYear()} - {exp.is_current ? t('Present', 'الحالي') : new Date(exp.end_date).getFullYear()}</div>
                                                <p className="text-sm text-gray-600">{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <>
                            <header className={styles.header}>
                                <h1 className={styles.name}>
                                    {profile?.full_name || profile?.user?.fullname || t('My Name', 'اسمي')}
                                </h1>
                                {headlineText && (
                                    <p className={`text-sm mb-3 ${styles.subtext || 'text-gray-600'}`}>
                                        {headlineText}
                                    </p>
                                )}
                                {contactDetails.length > 0 && (
                                    <div className={`flex gap-3 text-xs ${styles.subtext || 'text-gray-500'} flex-wrap ${template === 'classic' ? 'justify-center' : ''}`}>
                                        {contactDetails.map((detail, idx) => (
                                            <React.Fragment key={idx}>
                                                {idx > 0 && <span>•</span>}
                                                <span>{detail}</span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </header>

                            <main className={styles.grid}>
                                {/* Main Content Area */}
                                <div className={template === 'classic' ? 'space-y-8' : 'col-span-2 space-y-8'}>
                                    <section>
                                        <h3 className={styles.sectionTitle}>{t('Profile', 'الملف الشخصي')}</h3>
                                        <p className="text-gray-700 leading-relaxed text-sm">
                                            {profile?.bio}
                                        </p>
                                    </section>

                                    <section>
                                        <h3 className={styles.sectionTitle}>{t('Experience', 'الخبرة')}</h3>
                                        <div className="space-y-6">
                                            {profile?.experience
                                                ?.sort((a: any, b: any) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime())
                                                .map((exp: any, i: number) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <h4 className="font-bold text-gray-900">{exp.job_title}</h4>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(exp.start_date).getFullYear()} - {exp.is_current ? t('Present', 'الحالي') : new Date(exp.end_date).getFullYear()}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-teal-600 font-medium mb-2">{exp.company}, {exp.location}</div>
                                                        <p className="text-sm text-gray-600 whitespace-pre-line">{exp.description}</p>
                                                    </div>
                                                ))}
                                        </div>
                                    </section>
                                </div>

                                {/* Sidebar Area (For Modern/Executive) */}
                                {template !== 'classic' && (
                                    <div className="space-y-8">
                                        <section>
                                            <h3 className={styles.sectionTitle}>{t('Skills', 'المهارات')}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {profile?.skills?.map((s: any, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className={styles.sectionTitle}>{t('Education', 'التعليم')}</h3>
                                            <div className="space-y-4">
                                                {profile?.education?.map((edu: any, i: number) => (
                                                    <div key={i}>
                                                        <div className="font-bold text-sm text-gray-900">{edu.institution}</div>
                                                        <div className="text-sm text-gray-600">{edu.degree}</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {new Date(edu.start_date).getFullYear()} - {new Date(edu.end_date).getFullYear()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {template === 'classic' && (
                                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-300">
                                        <section>
                                            <h3 className={styles.sectionTitle}>{t('Education', 'التعليم')}</h3>
                                            <div className="space-y-4">
                                                {profile?.education?.map((edu: any, i: number) => (
                                                    <div key={i}>
                                                        <div className="font-bold text-sm text-gray-900">{edu.institution}</div>
                                                        <div className="text-sm text-gray-600">{edu.degree}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                        <section>
                                            <h3 className={styles.sectionTitle}>{t('Skills', 'المهارات')}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {profile?.skills?.map((s: any, i: number) => (
                                                    <span key={i} className="text-sm text-gray-700">{s.name}, </span>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </main>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
