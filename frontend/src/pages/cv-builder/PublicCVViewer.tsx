import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TemplatePreview from '@/components/cv-templates/TemplatePreview';
import { Loader2, AlertCircle, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const PublicCVViewer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [cvData, setCvData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [senderName, setSenderName] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [senderCompany, setSenderCompany] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        const fetchCV = async () => {
            try {
                const response = await fetch(`/api/cv/public/${id}`);
                const result = await response.json();

                if (result.success && result.data) {
                    const backendRow = result.data;
                    const mappedData = {
                        personalInfo: backendRow.personal_info || {},
                        professionalSummary: backendRow.professional_summary || '',
                        technicalSkills: backendRow.technical_skills || [],
                        softSkills: backendRow.soft_skills || [],
                        experience: backendRow.work_experience || [],
                        education: backendRow.education || []
                    };
                    setCvData({
                        data: mappedData,
                        template: backendRow.template_name || 'professional',
                        title: backendRow.title
                    });
                } else {
                    setError(result.message || 'Failed to load CV');
                }
            } catch (err) {
                setError('Network error loading CV');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCV();
    }, [id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!senderName || !senderEmail || !subject || !message) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSending(true);
        try {
            const response = await fetch(`/api/cv/public/${id}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender_name: senderName,
                    sender_email: senderEmail,
                    sender_company: senderCompany,
                    subject: subject,
                    message: message
                })
            });
            const result = await response.json();
            if (result.success) {
                setSent(true);
                toast.success('Inquiry sent successfully to the candidate!');
                setSenderName('');
                setSenderEmail('');
                setSenderCompany('');
                setSubject('');
                setMessage('');
            } else {
                toast.error(result.message || 'Failed to send inquiry');
            }
        } catch (err) {
            console.error('Error sending message:', err);
            toast.error('Network error. Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>;
    if (error) return <div className="flex h-screen items-center justify-center flex-col bg-slate-900 text-white"><AlertCircle className="w-12 h-12 text-red-500 mb-4" /><p className="text-xl">{error}</p></div>;
    if (!cvData) return null;

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">{cvData.title}</h1>
                        <p className="text-slate-400 text-sm mt-1">
                          Securely shared via <span className="font-semibold text-teal-400">Emirati Pathways</span> Platform
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                        <span className="text-xs text-slate-300 font-medium">Closed Platform Protected Profile</span>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* CV Preview (Left/Center) */}
                    <div className="lg:col-span-2 shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-white">
                        <div id="public-cv-preview" className="w-full">
                            <TemplatePreview
                                templateId={cvData.template}
                                cvData={cvData.data}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Interactive Messaging Panel (Right Sidebar) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
                                <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Contact Candidate</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Platform secure messaging system</p>
                                </div>
                            </div>

                            {sent ? (
                                <div className="py-8 text-center">
                                    <div className="inline-flex p-3 rounded-full bg-teal-500/10 text-teal-400 mb-4">
                                        <CheckCircle2 size={40} className="animate-bounce" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">Message Sent!</h3>
                                    <p className="text-sm text-slate-400 mt-2 px-4">
                                        Your inquiry has been routed to the candidate. They will receive a notification alert on their dashboard.
                                    </p>
                                    <button 
                                        onClick={() => setSent(false)} 
                                        className="mt-6 text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors"
                                    >
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                            Your Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={senderName}
                                            onChange={(e) => setSenderName(e.target.value)}
                                            required
                                            placeholder="e.g. Salem Al Ali"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                            Company <span className="text-slate-500">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={senderCompany}
                                            onChange={(e) => setSenderCompany(e.target.value)}
                                            placeholder="e.g. ADNOC"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                            Your Email <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={senderEmail}
                                            onChange={(e) => setSenderEmail(e.target.value)}
                                            required
                                            placeholder="e.g. contact@company.ae"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                            Subject <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            required
                                            placeholder="e.g. Job Opportunity / Interview Invite"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                            Message <span className="text-red-400">*</span>
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                            rows={4}
                                            placeholder="Write your proposal or message here..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-lg font-semibold hover:bg-teal-500 transition-colors shadow-lg shadow-teal-900/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                    >
                                        {sending ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                <span>Send Message</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-slate-500 text-sm border-t border-slate-800 pt-6">
                    <p>Powered by <span className="font-semibold text-teal-500">Emirati Pathways</span> Platform</p>
                </div>
            </div>
        </div>
    );
};

export default PublicCVViewer;
