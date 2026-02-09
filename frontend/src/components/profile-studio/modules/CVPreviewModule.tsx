import React, { useState, useEffect, useRef } from 'react';
import { profileService, CandidateProfile } from '@/services/profile/profileService';
import { Download, Layout, Printer, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const CVPreviewModule = () => {
    const [profile, setProfile] = useState<any>(null);
    const [template, setTemplate] = useState('modern');
    const [loading, setLoading] = useState(true);
    const cvRef = useRef<HTMLDivElement>(null);

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
            alert('Failed to generate PDF');
        }
    };

    if (loading) return <div className="p-8">Generating preview...</div>;

    const getTemplateStyles = () => {
        switch (template) {
            case 'classic':
                return {
                    container: "font-serif text-gray-900 border-t-8 border-gray-800",
                    header: "text-center border-b-2 border-gray-300 pb-6 mb-8",
                    name: "text-3xl font-bold tracking-widest uppercase mb-2",
                    sectionTitle: "text-lg font-bold border-b border-gray-300 mb-4 pb-1 uppercase tracking-widest",
                    grid: "block space-y-8"
                };
            case 'creative':
                return {
                    container: "font-sans text-gray-800 flex flex-row-reverse",
                    header: "hidden",
                    sidebar: "w-1/3 bg-purple-900 text-white p-6 min-h-full",
                    main: "w-2/3 p-6",
                    name: "text-3xl font-bold mb-4",
                    sectionTitle: "text-purple-900 font-bold text-lg mb-3 uppercase tracking-wide",
                    grid: "flex gap-0"
                };
            case 'executive':
                return {
                    container: "font-sans text-slate-900",
                    header: "bg-slate-900 text-white p-8 mb-8 -mx-[15mm] -mt-[15mm]",
                    name: "text-4xl font-bold mb-2",
                    subtext: "text-slate-300",
                    sectionTitle: "text-slate-900 font-bold text-lg border-l-4 border-slate-900 pl-3 mb-4 uppercase",
                    grid: "grid grid-cols-3 gap-8"
                };
            default:
                return {
                    container: "font-sans text-gray-900",
                    header: "border-b border-gray-900 pb-6 mb-6",
                    name: "text-4xl font-bold uppercase tracking-tight mb-2",
                    sectionTitle: "text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 border-b pb-1",
                    grid: "grid grid-cols-3 gap-8"
                };
        }
    };

    const styles = getTemplateStyles();
    const isCreative = template === 'creative';

    return (
        <div className="flex h-[calc(100vh-100px)]">
            {/* Controls Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-6">CV Settings</h2>

                {/* Template Selector */}
                <div className="mb-8">
                    <label className="text-sm font-semibold text-gray-500 mb-3 block">Choose Template</label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'modern', color: 'bg-blue-50', border: 'border-blue-200' },
                            { id: 'classic', color: 'bg-gray-50', border: 'border-gray-300' },
                            { id: 'creative', color: 'bg-purple-900', border: 'border-purple-200' },
                            { id: 'executive', color: 'bg-slate-800', border: 'border-slate-600' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTemplate(t.id)}
                                className={`p-2 border rounded-lg text-sm capitalize transition-all ${template === t.id
                                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className={`h-16 mb-2 rounded border ${t.border} ${t.color} flex items-center justify-center opacity-80`}>
                                    <div className="w-8 h-[2px] bg-current opacity-40"></div>
                                </div>
                                <span className={template === t.id ? 'text-blue-700 font-medium' : 'text-gray-600'}>{t.id}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 shadow-sm"
                    >
                        <Download size={18} />
                        <span>Download PDF</span>
                    </button>
                    <button className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50">
                        <Share2 size={18} />
                        <span>Share Link</span>
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
                                <h1 className="text-3xl font-bold mb-2">{profile?.full_name || 'My Name'}</h1>
                                <p className="text-purple-200 mb-6">{profile?.headline}</p>

                                <div className="space-y-6 text-sm">
                                    <div>
                                        <h3 className="font-bold border-b border-purple-700 pb-1 mb-2">Contact</h3>
                                        <div className="space-y-1 text-purple-100">
                                            <p>{profile?.contact?.email}</p>
                                            <p>{profile?.contact?.phone}</p>
                                            <p>{profile?.contact?.location}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold border-b border-purple-700 pb-1 mb-2">Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile?.skills?.map((s: any, i: number) => (
                                                <span key={i} className="bg-purple-800 px-2 py-1 rounded text-xs">{s.name}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold border-b border-purple-700 pb-1 mb-2">Education</h3>
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
                                    <h3 className={styles.sectionTitle}>Profile</h3>
                                    <p className="text-gray-600 leading-relaxed">{profile?.bio}</p>
                                </section>

                                <section>
                                    <h3 className={styles.sectionTitle}>Experience</h3>
                                    <div className="space-y-6 border-l-2 border-purple-100 pl-4">
                                        {profile?.experience?.sort((a: any, b: any) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime()).map((exp: any, i: number) => (
                                            <div key={i} className="relative">
                                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-white"></div>
                                                <h4 className="font-bold text-gray-900">{exp.job_title}</h4>
                                                <div className="text-sm text-purple-600 font-medium mb-1">{exp.company} | {new Date(exp.start_date).getFullYear()} - {exp.is_current ? 'Present' : new Date(exp.end_date).getFullYear()}</div>
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
                                    {profile?.full_name || profile?.user?.fullname || 'My Name'}
                                </h1>
                                <p className={`text-xl mb-4 ${styles.subtext || 'text-gray-600'}`}>
                                    {profile?.headline || profile?.bio?.slice(0, 100) + '...'}
                                </p>
                                <div className={`flex space-x-4 text-sm ${styles.subtext || 'text-gray-500'}`}>
                                    <span>{profile?.contact?.email}</span>
                                    <span>•</span>
                                    <span>{profile?.contact?.phone}</span>
                                    <span>•</span>
                                    <span>{profile?.contact?.location}</span>
                                </div>
                            </header>

                            <main className={styles.grid}>
                                {/* Main Content Area */}
                                <div className={template === 'classic' ? 'space-y-8' : 'col-span-2 space-y-8'}>
                                    <section>
                                        <h3 className={styles.sectionTitle}>Profile</h3>
                                        <p className="text-gray-700 leading-relaxed text-sm">
                                            {profile?.bio}
                                        </p>
                                    </section>

                                    <section>
                                        <h3 className={styles.sectionTitle}>Experience</h3>
                                        <div className="space-y-6">
                                            {profile?.experience
                                                ?.sort((a: any, b: any) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime())
                                                .map((exp: any, i: number) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <h4 className="font-bold text-gray-900">{exp.job_title}</h4>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(exp.start_date).getFullYear()} - {exp.is_current ? 'Present' : new Date(exp.end_date).getFullYear()}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-blue-600 font-medium mb-2">{exp.company}, {exp.location}</div>
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
                                            <h3 className={styles.sectionTitle}>Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {profile?.skills?.map((s: any, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className={styles.sectionTitle}>Education</h3>
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
                                            <h3 className={styles.sectionTitle}>Education</h3>
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
                                            <h3 className={styles.sectionTitle}>Skills</h3>
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
