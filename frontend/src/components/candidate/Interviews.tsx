
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Clock, Loader2, Sparkles, Building, CheckCircle, BookOpen, GraduationCap, Users, ChevronRight } from 'lucide-react';
import { restClient } from '@/utils/api';
import { VideoRoom } from '@/components/common/VideoRoom';
import { toast } from 'sonner';

import { Switch } from '@/components/ui/switch';

export default function CandidateInterviews() {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [showCancelled, setShowCancelled] = useState(false);
    const [livekitUrl, setLivekitUrl] = useState<string>('');
    const [livekitToken, setLivekitToken] = useState<string>('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());

    const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [recommendations, setRecommendations] = useState<any>(null);
    const [selectedSession, setSelectedSession] = useState<any>(null);

    const handleViewRecommendations = async (session: any) => {
        setSelectedSession(session);
        setShowRecommendationsModal(true);
        setLoadingRecommendations(true);
        try {
            const res = await restClient.get(`/api/video-interview/sessions/${session.id}/recommendations`);
            if (res.data.success) {
                setRecommendations(res.data.data);
            } else {
                setRecommendations(null);
            }
        } catch (err) {
            console.warn('Failed to load recommendations:', err);
            setRecommendations(null);
        } finally {
            setLoadingRecommendations(false);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 15000); // Check every 15 seconds to update button states dynamically
        return () => clearInterval(interval);
    }, []);

    // How long after the scheduled start a session can still be joined / stays "active".
    const sessionGraceMinutes = (session: any) => (Number(session.duration_minutes) || 45) + 30;

    // True once the join window has fully passed (ended more than duration + grace ago).
    const isPastWindow = (session: any) => {
        const scheduledTime = new Date(session.scheduled_time || session.scheduled_at);
        if (isNaN(scheduledTime.getTime())) return false;
        const diffMinutes = (scheduledTime.getTime() - currentTime) / (1000 * 60);
        return diffMinutes < -sessionGraceMinutes(session);
    };

    const isJoinable = (session: any) => {
        if (session.status === 'completed' || session.status === 'cancelled') return false;
        const scheduledTime = new Date(session.scheduled_time || session.scheduled_at);
        if (isNaN(scheduledTime.getTime())) return false; // no valid time -> not joinable
        const diffMinutes = (scheduledTime.getTime() - currentTime) / (1000 * 60);
        // Joinable from 10 min before the start until duration + grace after the start
        // (previously only had the upper bound, so any past session stayed joinable).
        return diffMinutes <= 10 && diffMinutes >= -sessionGraceMinutes(session);
    };

    // Get user data from localStorage
    const getUserData = () => {
        return {
            id: user?.id || '',
            name: user?.full_name || user?.first_name || user?.name || 'Candidate'
        };
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const userData = getUserData();
            const res = await restClient.get(`/api/video-interview/sessions?role=candidate&candidate_id=${userData.id}`);
            // Normalize response (backend returns { success: true, sessions: [...] })
            if (res.data.success) {
                setSessions(res.data.sessions || []);
            } else if (Array.isArray(res.data)) {
                // Fallback if backend structure differs
                setSessions(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async (session: any) => {
        // G3: Acquire LiveKit token before rendering VideoRoom
        const userData = getUserData();
        setIsConnecting(true);
        try {
            const res = await restClient.post(`/api/video-interview/sessions/${session.id}/start`, {
                user_id: userData.id,
                user_name: userData.name,
                role: 'candidate'
            });
            const data = res.data;
            const token = data?.token || data?.session_config?.token;
            const livekit_url = data?.livekit_url || data?.session_config?.livekit_url;
            if (token && livekit_url) {
                setLivekitUrl(livekit_url);
                setLivekitToken(token);
            }
        } catch (err) {
            console.warn('LiveKit token acquisition failed (session may still work):', err);
        }
        setActiveSession(session);
        setIsConnecting(false);
    };

    const handleEndCall = () => {
        setActiveSession(null);
        setLivekitUrl('');
        setLivekitToken('');
    };

    const handleConfirm = async (session: any) => {
        try {
            const res = await restClient.put(`/api/video-interview/sessions/${session.id}/status`, {
                status: 'accepted'
            });
            if (res.data?.success || res.status === 200) {
                toast.success(t('Interview confirmed successfully', 'تم تأكيد المقابلة بنجاح'));
                fetchSessions();
            } else {
                toast.error(res.data?.message || t('Failed to confirm interview', 'فشل تأكيد المقابلة'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('An error occurred while confirming', 'حدث خطأ أثناء التأكيد'));
        }
    };

    if (isConnecting) {
        return (
            <div className="h-[calc(100vh-100px)] flex items-center justify-center bg-slate-900 rounded-lg">
                <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>{t('Connecting to interview...', 'جاري الاتصال بالمقابلة...')}</p>
                </div>
            </div>
        );
    }

    if (activeSession) {
        const userData = getUserData();
        return (
            <div className="h-[calc(100vh-100px)]">
                <VideoRoom
                    sessionId={activeSession.id}
                    userId={userData.id}
                    userName={userData.name}
                    onEndCall={handleEndCall}
                    livekitUrl={livekitUrl}
                    token={livekitToken}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('My Interviews', 'مقابلاتي')}</h2>
                    <p className="text-muted-foreground">{t('Join your scheduled video sessions.', 'انضم إلى جلسات الفيديو المجدولة.')}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="show-cancelled" checked={showCancelled} onCheckedChange={setShowCancelled} />
                    <label htmlFor="show-cancelled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {t('Show Cancelled', 'إظهار الملغاة')}
                    </label>
                </div>
            </div>

            {isLoading ? (
                <div>{t('Loading...', 'جاري التحميل...')}</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sessions
                        .filter(session => showCancelled || session.status !== 'cancelled')
                        .map((session) => (
                            <Card key={session.id} className={`hover:shadow-md transition-shadow ${session.status === 'cancelled' ? 'opacity-60 bg-slate-50' : ''}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{session.title || session.job_title || t('Interview', 'مقابلة')}</CardTitle>
                                            <div className="text-sm font-medium text-slate-700 mb-1">{session.job_title}</div>
                                            {(session.company_name || session.recruiter_name) && (
                                                <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                                    <Building className="h-3 w-3" />
                                                    {session.company_name || session.recruiter_name}
                                                </div>
                                            )}
                                            <CardDescription>{new Date(session.scheduled_time || session.scheduled_at).toLocaleString(isRTL ? 'ar-AE' : 'en-US')}</CardDescription>
                                        </div>
                                        <Badge variant={
                                            session.status === 'cancelled' ? 'destructive' :
                                                session.status === 'completed' ? 'secondary' :
                                                    (isPastWindow(session) ? 'outline' : 'default')
                                        }>
                                            {(() => {
                                                // A past-window session that never completed/cancelled reads as
                                                // "Expired" regardless of a stale stored status (accepted/in_progress).
                                                if (isPastWindow(session) && session.status !== 'completed' && session.status !== 'cancelled') {
                                                    return t('Expired', 'منتهية');
                                                }
                                                const statusMap: Record<string, string> = {
                                                    scheduled: t('Scheduled', 'مجدولة'),
                                                    completed: t('Completed', 'مكتملة'),
                                                    cancelled: t('Cancelled', 'ملغاة'),
                                                    confirmed: t('Confirmed', 'مؤكدة'),
                                                    accepted: t('In Progress', 'جارية'),
                                                    in_progress: t('In Progress', 'جارية'),
                                                };
                                                return statusMap[session.status] || session.status;
                                            })()}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                                            {t('Expected Duration:', 'المدة المتوقعة:')} {session.duration_minutes || 45} {t('Mins', 'دقيقة')}
                                        </div>

                                        {session.ai_analysis && (
                                            <div className="bg-slate-50 p-3 rounded-lg text-sm border">
                                                <div className="flex items-center font-semibold text-purple-600 mb-1">
                                                    <Sparkles className="h-3 w-3" style={{ marginInlineEnd: 4 }} /> {t('Feedback', 'ملاحظات')}
                                                </div>
                                                <p className="line-clamp-2 text-slate-600">
                                                    {session.ai_analysis.summary || t('Feedback available.', 'الملاحظات متاحة.')}
                                                </p>
                                            </div>
                                        )}

                                        {session.status === 'scheduled' && !isPastWindow(session) && (
                                            <Button variant="outline" className="w-full mb-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => handleConfirm(session)}>
                                                <CheckCircle className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                                                {t('Confirm Attendance', 'تأكيد الحضور')}
                                            </Button>
                                        )}
                                        {session.status === 'completed' && (
                                            <Button 
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md shadow-purple-100 animate-in fade-in" 
                                                onClick={() => handleViewRecommendations(session)}
                                            >
                                                <Sparkles className="h-4 w-4 animate-pulse" style={{ marginInlineEnd: 8 }} />
                                                {t('View AI Career Guidance', 'عرض الإرشاد المهني بالذكاء الاصطناعي')}
                                            </Button>
                                        )}
                                        {session.status !== 'completed' && session.status !== 'cancelled' && !isPastWindow(session) && (
                                            <Button
                                                className="w-full"
                                                onClick={() => handleJoin(session)}
                                                disabled={!isJoinable(session)}
                                            >
                                                <Video className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                                                {!isJoinable(session)
                                                    ? t('Available 10m before', 'متاح قبل ١٠ دقائق')
                                                    : t('Join Call', 'انضم للمكالمة')}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                    {sessions
                        .filter(session => showCancelled || session.status !== 'cancelled')
                        .length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg">
                                <Video className="h-12 w-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-1">{t('No Upcoming Interviews', 'لا توجد مقابلات قادمة')}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t('When a recruiter schedules an interview, it will appear here.', 'عندما يجدول مسؤول التوظيف مقابلة، ستظهر هنا.')}
                                </p>
                            </div>
                        )}
                </div>
            )}

            {/* AI Career Guidance Recommendations Modal */}
            {showRecommendationsModal && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div 
                        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col transform scale-100 transition-transform duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-600 rounded-xl text-white shadow-md shadow-purple-200">
                                    <Sparkles className="h-5 w-5 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 font-dubai-bold">
                                        {t('Your Personalized AI Growth Plan', 'خطتك الشخصية للنمو بالذكاء الاصطناعي')}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {t('Based on your interview for', 'بناءً على مقابلتك لوظيفة')} <span className="font-semibold text-purple-700">{selectedSession.job_title || selectedSession.title}</span>
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0 rounded-full hover:bg-slate-200/50" 
                                onClick={() => {
                                    setShowRecommendationsModal(false);
                                    setRecommendations(null);
                                }}
                            >
                                <span className="text-lg font-bold text-slate-400">&times;</span>
                            </Button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            {loadingRecommendations ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-3">
                                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                                    <span className="text-sm text-slate-500 font-medium">{t('Analyzing performance and loading recommendations...', 'جاري تحليل الأداء وتحميل التوصيات...')}</span>
                                </div>
                            ) : recommendations ? (
                                <div className="space-y-6">
                                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-800 leading-relaxed font-dubai-medium">
                                        ✨ {t(
                                            "Our AI Placement Engine analyzed your interview and mapped specific platform learning resources to help you close skills gaps and prepare for next steps.",
                                            "قام محرك التوظيف الذكي بتحليل مقابلتك وربط مصادر تعليمية محددة على المنصة لمساعدتك في سد الفجوات المهارية والاستعداد للخطوات القادمة."
                                        )}
                                    </div>

                                    {/* Recommended Articles */}
                                    <div className="space-y-3">
                                        <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                                            {t('Recommended Knowledge Base Articles', 'مقالات موصى بها من قاعدة المعرفة')}
                                        </h4>
                                        <div className="grid gap-3">
                                            {recommendations.recommended_articles && recommendations.recommended_articles.length > 0 ? (
                                                recommendations.recommended_articles.map((article: any, idx: number) => (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => {
                                                            setShowRecommendationsModal(false);
                                                            navigate(`/knowledge-base#article-${article.id}`);
                                                        }}
                                                        className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 cursor-pointer flex items-center justify-between group transition-all duration-200"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <BookOpen className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors">
                                                                    {article.title || t('Knowledge Base Article', 'مقال قاعدة المعرفة')}
                                                                </p>
                                                                <p className="text-xs text-slate-400 mt-0.5">{t('Article • Platform Guide', 'مقال • دليل المنصة')}</p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">{t('No specific articles recommended', 'لا توجد مقالات موصى بها')}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recommended Courses / Training */}
                                    <div className="space-y-3">
                                        <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                            {t('Recommended Professional Training Courses', 'دورات تدريبية مهنية موصى بها')}
                                        </h4>
                                        <div className="grid gap-3">
                                            {recommendations.recommended_trainings && recommendations.recommended_trainings.length > 0 ? (
                                                recommendations.recommended_trainings.map((course: any, idx: number) => (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => {
                                                            setShowRecommendationsModal(false);
                                                            navigate(`/candidate-dashboard#profile`);
                                                        }}
                                                        className="p-4 rounded-xl border border-slate-100 hover:border-green-200 hover:bg-green-50/10 cursor-pointer flex items-center justify-between group transition-all duration-200"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <GraduationCap className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800 group-hover:text-green-700 transition-colors">
                                                                    {course.course_name || t('Training Course', 'دورة تدريبية')}
                                                                </p>
                                                                <p className="text-xs text-slate-400 mt-0.5">{t('Course • Platform Academy', 'دورة • أكاديمية المنصة')}</p>
                                                            </div>
                                                        </div>
                                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8">
                                                            {t('Enroll Now', 'سجل الآن')}
                                                        </Button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">{t('No specific courses recommended', 'لا توجد دورات موصى بها')}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recommended Mentors */}
                                    <div className="space-y-3">
                                        <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-purple-500" />
                                            {t('Recommended Industry Mentors', 'مرشدون مهنيون موصى بهم')}
                                        </h4>
                                        <div className="grid gap-3">
                                            {recommendations.recommended_mentors && recommendations.recommended_mentors.length > 0 ? (
                                                recommendations.recommended_mentors.map((mentor: any, idx: number) => (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => {
                                                            setShowRecommendationsModal(false);
                                                            navigate(`/mentorship`);
                                                        }}
                                                        className="p-4 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/10 cursor-pointer flex items-center justify-between group transition-all duration-200"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <Users className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800 group-hover:text-purple-700 transition-colors">
                                                                    {mentor.full_name || t('Professional Mentor', 'مرشد مهني')}
                                                                </p>
                                                                <p className="text-xs text-slate-400 mt-0.5">{mentor.title || t('Expert Mentor', 'مرشد خبير')}</p>
                                                            </div>
                                                        </div>
                                                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8">
                                                            {t('Book Session', 'احجز جلسة')}
                                                        </Button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">{t('No specific mentors recommended', 'لا يوجد مرشدون موصى بهم')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400 italic">
                                    {t('Growth recommendations are being processed and will be available shortly.', 'جاري معالجة توصيات النمو وستكون متاحة قريباً.')}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <Button 
                                variant="outline" 
                                className="text-xs" 
                                onClick={() => {
                                    setShowRecommendationsModal(false);
                                    setRecommendations(null);
                                }}
                            >
                                {t('Close Plan', 'إغلاق الخطة')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
