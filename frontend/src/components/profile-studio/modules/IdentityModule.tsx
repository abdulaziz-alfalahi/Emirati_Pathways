import React, { useEffect, useState, useRef } from 'react';
import { profileService, CandidateProfile } from '@/services/profile/profileService';
import { User, MapPin, Phone, Mail, Globe, Video, Upload, FileText, Car, Clock, Info, X, Play, Square, RefreshCw, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';
import LocationPicker from '@/components/common/LocationPicker';
import { calculateHaversineDistance, estimateCommuteTime } from '@/utils/geoUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UnifiedProfileHeader } from '../UnifiedProfileHeader';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { useTranslation } from 'react-i18next';

export const IdentityModule = () => {
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    // CV Management State
    const [cvs, setCvs] = useState<any[]>([]);
    const [loadingCvs, setLoadingCvs] = useState(false);
    const [debugData, setDebugData] = useState<any>(null);

    const { language, isRTL } = useLanguage();
    const { t: i18t } = useTranslation();
    const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

    // Form inputs
    const [formData, setFormData] = useState({
        headline: '',
        bio: '',
        phone: '',
        location: '',
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined,
        english_proficiency: 'conversational'
    });

    useEffect(() => {
        loadProfile();
        loadCVs();
    }, []);

    const loadCVs = async () => {
        setLoadingCvs(true);
        try {
            const res = await profileService.listCVs();
            if (res.success && Array.isArray(res.cvs)) {
                setCvs(res.cvs);
                // If empty, fetch debug info to diagnose
                if (res.cvs.length === 0) {
                    profileService.getDebugAuth().then(d => setDebugData(d));
                }
            }
        } catch (e) {
            console.error("Failed to load CVs", e);
        } finally {
            setLoadingCvs(false);
        }
    };

    const loadProfile = async () => {
        try {
            const res = await profileService.getProfile();
            if (res.success) {
                setProfile(res.data);
                const contact = res.data.contact || {};

                // Robust Latitude/Longitude Extraction
                let lat = res.data.latitude || contact.latitude;
                let lng = res.data.longitude || contact.longitude;

                // Fallback: Try to parse from location string if coordinates are missing but string looks like "25.123, 55.123"
                if (!lat && contact.location && typeof contact.location === 'string' && contact.location.includes(',')) {
                    const parts = contact.location.split(',');
                    if (parts.length === 2) {
                        const p1 = parseFloat(parts[0]);
                        const p2 = parseFloat(parts[1]);
                        if (!isNaN(p1) && !isNaN(p2) && Math.abs(p1) <= 90 && Math.abs(p2) <= 180) {
                            lat = p1;
                            lng = p2;
                        }
                    }
                }

                setFormData({
                    headline: res.data.headline || '',
                    bio: res.data.bio || '',
                    phone: contact.phone || '',
                    location: contact.location || '',
                    latitude: lat,
                    longitude: lng,
                    english_proficiency: res.data.english_proficiency || 'conversational'
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = async (cvId: string, currentStatus: boolean) => {
        try {
            await profileService.toggleCVVisibility(cvId, !currentStatus);
            await loadCVs();
            // Re-load profile so Experience/Education/Skills update to match the selected CV
            await loadProfile();
        } catch (e) {
            alert(t("Failed to update visibility", "فشل تحديث الظهور"));
        }
    };

    const handleDeleteCV = async (cvId: string) => {
        if (!confirm(t("Are you sure you want to delete this CV?", "هل أنت متأكد من حذف هذه السيرة الذاتية؟"))) return;
        try {
            await profileService.deleteCV(cvId);
            loadCVs();
        } catch (e) {
            alert(t("Failed to delete CV", "فشل حذف السيرة الذاتية"));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        try {
            await profileService.uploadCV(file);
            await loadProfile();
            await loadCVs();
            alert(t('CV Imported successfully! Please review your profile sections.', 'تم استيراد السيرة الذاتية بنجاح! يرجى مراجعة أقسام ملفك الشخصي.'));
        } catch (error) {
            console.error('Upload failed:', error);
            alert(t('Failed to upload CV', 'فشل رفع السيرة الذاتية'));
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            await profileService.updateIdentity({
                headline: formData.headline,
                bio: formData.bio,
                phone: formData.phone,
                location: formData.location,
                latitude: formData.latitude,
                longitude: formData.longitude,
                english_proficiency: formData.english_proficiency,
                contact: {
                    phone: formData.phone,
                    location: formData.location,
                    email: profile?.contact?.email || '',
                    latitude: formData.latitude,
                    longitude: formData.longitude
                }
            } as any);
            setIsEditing(false);
            loadProfile();
        } catch (e) {
            alert(t('Failed to save', 'فشل الحفظ'));
        }
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        }));
    };

    if (loading) return <div className="p-8">{t('Loading profile...', 'جارٍ تحميل الملف...')}</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Unified Profile Header (Role Switcher) */}
            <UnifiedProfileHeader initialProfile={profile} cvUploaded={cvs.length > 0} />

            {/* Profile Actions Bar */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{t('Profile Actions', 'إجراءات الملف')}</h2>
                    <p className="text-sm text-muted-foreground">{t('Manage your profile visibility and data', 'إدارة ظهور ملفك وبياناتك')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex flex-col items-end">
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                                        cvs.length >= 3 ? 'bg-muted border-border text-muted-foreground cursor-not-allowed' :
                                            'bg-card border-teal-200 text-teal-600 hover:bg-teal-50 cursor-pointer'
                                        }`}>
                                        {uploading ? <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={18} />}
                                        <span className="font-medium text-sm">
                                            {uploading ? t('Parsing...', 'جارٍ التحليل...') : cvs.length >= 3 ? t('Limit Reached (3/3)', 'تم بلوغ الحد (3/3)') : t('Import CV', 'استيراد السيرة الذاتية')}
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.docx"
                                            onChange={handleFileUpload}
                                            disabled={uploading || cvs.length >= 3}
                                        />
                                    </label>
                                </div>
                            </TooltipTrigger>
                            {cvs.length >= 3 && (
                                <TooltipContent side="bottom" className="bg-red-50 text-red-600 border border-red-100">
                                    <p className="text-xs">{t('You have reached the limit of 3 CVs. Please delete an older CV to upload a new one.', 'لقد بلغت الحد الأقصى وهو 3 سير ذاتية. يرجى حذف سيرة ذاتية قديمة لرفع واحدة جديدة.')}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>

                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${isEditing
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : 'bg-card border border-border text-foreground hover:bg-muted'
                            }`}
                    >
                        {isEditing ? t('Save Changes', 'حفظ التغييرات') : t('Edit Identity', 'تعديل الهوية')}
                    </button>
                </div>
            </div>

            {/* Headline Editor (if editing) */}
            {isEditing && (
                <div className="bg-card p-4 rounded-xl border border-teal-100 mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">{t('Profile Headline', 'العنوان المهني')}</label>
                    <input
                        type="text"
                        value={formData.headline}
                        onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                        placeholder={t('Software Engineer | Problem Solver', 'مهندس برمجيات | حلّال مشاكل')}
                        className="w-full text-lg text-foreground border border-input rounded-lg p-2 focus:border-teal-500 outline-none bg-background"
                    />
                </div>
            )}

            {/* Commute Intelligence / Location Map */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-foreground">{t('Location & Commute', 'الموقع والتنقل')}</h3>
                        {!isEditing && profile?.contact?.latitude && (
                            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full flex items-center gap-1">
                                <Car size={12} /> {t('Commute Active', 'التنقل مُفعّل')}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t('Residence Location', 'موقع السكن')}</label>
                                {isEditing ? (
                                    <>
                                        <div className="h-[300px] w-full bg-slate-100 rounded-md border overflow-hidden relative z-0">
                                            <LocationPicker
                                                lat={formData.latitude}
                                                lng={formData.longitude}
                                                onLocationSelect={handleLocationSelect}
                                                height="300px"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t('Click on the map to pin your exact location. This is used to calculate commute times.', 'انقر على الخريطة لتحديد موقعك بدقة. يُستخدم هذا لحساب أوقات التنقل.')}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        {formData.latitude && formData.longitude ? (
                                            <div className="h-[200px] w-full bg-slate-100 rounded-md border overflow-hidden relative z-0 pointer-events-none opacity-90">
                                                <LocationPicker
                                                    lat={formData.latitude}
                                                    lng={formData.longitude}
                                                    onLocationSelect={() => { }}
                                                    height="200px"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-[200px] w-full bg-slate-50 rounded-md border border-dashed flex items-center justify-center text-muted-foreground">
                                                <div className="text-center p-4">
                                                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p>{t('No location set', 'لم يتم تحديد الموقع')}</p>
                                                    <button
                                                        onClick={() => setIsEditing(true)}
                                                        className="text-teal-600 text-sm hover:underline mt-1"
                                                    >
                                                        {t('Add Location', 'إضافة موقع')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t('Address Text', 'نص العنوان')}</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full p-2 border border-input rounded-md bg-background"
                                    placeholder={t('e.g. Downtown Dubai, UAE', 'مثال: وسط دبي، الإمارات')}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{t('English Proficiency', 'مستوى اللغة الإنجليزية')}</label>
                                <select
                                    value={formData.english_proficiency}
                                    onChange={(e) => setFormData({ ...formData, english_proficiency: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full p-2 border border-input rounded-md bg-background text-foreground focus:border-teal-500 outline-none disabled:opacity-75"
                                >
                                    <option value="conversational">{t('Basic / Conversational', 'أساسي / محادثة')}</option>
                                    <option value="professional">{t('Professional / Fluent', 'مهني / طليق')}</option>
                                    <option value="native">{t('Native / Bilingual', 'أصلي / ثنائي اللغة')}</option>
                                </select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t('Used for AI matching. Fluent/Native awards a 25 point bonus, Conversational awards 15 points.', 'يُستخدم للمطابقة بالذكاء الاصطناعي. المستوى الطليق/الأصلي يمنح ٢٥ نقطة إضافية، والمحادثة تمنح ١٥ نقطة.')}
                                </p>
                            </div>

                            <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                                <h4 className="font-semibold text-teal-900 flex items-center gap-2 mb-2">
                                    <Info size={16} /> {t('Why set this?', 'لماذا تحدد هذا؟')}
                                </h4>
                                <p className="text-sm text-teal-800 leading-relaxed mb-3">
                                    {t('Setting your residence location enables our AI to calculate accurate commute times for every job listing.', 'تحديد موقع سكنك يمكّن الذكاء الاصطناعي من حساب أوقات التنقل بدقة لكل وظيفة.')}
                                </p>
                                <ul className={`text-sm text-teal-800 space-y-1 ${isRTL ? 'mr-5' : 'ml-5'} list-disc`}>
                                    <li>{t('See drive times during peak hours', 'عرض أوقات القيادة في ساعات الذروة')}</li>
                                    <li>{t('Filter jobs by max commute time', 'تصفية الوظائف حسب أقصى وقت تنقل')}</li>
                                    <li>{t('Find opportunities closer to home', 'إيجاد فرص أقرب إلى المنزل')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </div>

            {/* Documents & CVs Management Section */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-foreground">{t('Documents & CVs', 'المستندات والسير الذاتية')}</h3>
                    <div className="text-sm text-muted-foreground">
                        {t('Select which CV is visible to recruiters', 'اختر السيرة الذاتية المرئية لمسؤولي التوظيف')}
                    </div>
                </div>

                <div className="space-y-4">
                    {loadingCvs ? (
                        <div className="text-center py-4 text-gray-400">{t('Loading documents...', 'جارٍ تحميل المستندات...')}</div>
                    ) : cvs.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
                            <FileText className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                            <p className="text-gray-500">{t('No CVs uploaded yet.', 'لم يتم رفع أي سيرة ذاتية بعد.')}</p>
                            {debugData && (
                                <div className={`mt-4 mx-auto max-w-sm p-3 bg-red-50 text-red-800 text-xs ${isRTL ? 'text-right' : 'text-left'} rounded border border-red-100 font-mono`}>
                                    <div className="font-bold mb-1">{t('Diagnostic Info:', 'معلومات تشخيصية:')}</div>
                                    <div>User ID: {JSON.stringify(debugData.user_id)}</div>
                                    <div>Type: {debugData.user_id_type}</div>
                                    <div>Auth: {debugData.raw_header}</div>
                                    <div className="mt-1 text-[10px] text-red-600">
                                        {t('If User ID matches your expectation but list is empty, please report this.', 'إذا كان معرف المستخدم مطابقاً لتوقعاتك ولكن القائمة فارغة، يرجى الإبلاغ.')}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {cvs.map((cv) => (
                                <div key={cv.cv_id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${cv.is_visible ? 'border-teal-200 bg-teal-50/30' : 'border-border hover:border-teal-100'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-lg ${cv.is_visible ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-semibold ${cv.is_visible ? 'text-teal-900' : 'text-foreground'}`}>
                                                    {cv.filename || cv.file_info?.original_filename || t('Untitled CV', 'سيرة ذاتية بدون عنوان')}
                                                </h4>
                                                {cv.is_visible && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white px-2 py-0.5 rounded-full">
                                                        {t('Visible', 'مرئي')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {t('Uploaded on', 'تم الرفع في')} {new Date(cv.upload_timestamp || cv.created_at || Date.now()).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleToggleVisibility(cv.cv_id, cv.is_visible)}
                                            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${cv.is_visible
                                                ? 'bg-card border border-teal-200 text-teal-700 hover:bg-teal-50'
                                                : 'text-muted-foreground hover:bg-muted'
                                                }`}
                                        >
                                            {cv.is_visible ? t('Published', 'منشور') : t('Make Visible', 'اجعلها مرئية')}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCV(cv.cv_id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title={t('Delete CV', 'حذف السيرة الذاتية')}
                                        >
                                            <Upload className="h-4 w-4 rotate-45" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bio Section */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <h3 className="text-xl font-bold text-foreground mb-4">{t('About Me', 'عن نفسي')}</h3>
                {isEditing ? (
                    <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full h-32 p-4 border border-input rounded-lg focus:ring-2 focus:ring-teal-100 outline-none resize-none bg-background text-foreground"
                        placeholder={t('Tell recruiters about yourself...', 'أخبر مسؤولي التوظيف عن نفسك...')}
                    />
                ) : (
                    <p className="text-muted-foreground leading-relaxed">
                        {profile?.bio || t('No bio added yet. Click edit to tell your story.', 'لم يتم إضافة نبذة بعد. انقر تعديل لتحكي قصتك.')}
                    </p>
                )}
            </div>

            {/* Video Pitch */}
            <div className="bg-card rounded-2xl p-8 border border-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground">{t('Video Introduction', 'المقدمة المرئية')}</h3>
                        <p className="text-muted-foreground text-sm max-w-lg">
                            {t('Stand out by recording a 60-second video pitch. Recruiters are 3x more likely to contact candidates with a video.', 'تميّز بتسجيل فيديو تعريفي مدته 60 ثانية. مسؤولو التوظيف أكثر احتمالاً بـ3 مرات للتواصل مع المرشحين الذين لديهم فيديو.')}
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowVideoModal(true)}
                        className="flex items-center justify-center gap-2 bg-background border border-border hover:bg-muted text-foreground px-6 py-3 rounded-full font-medium shadow-sm hover:shadow-md transition-all self-start md:self-auto"
                    >
                        <Video size={20} className="text-purple-600" />
                        <span>{profile?.video_intro_url ? t('Re-record Video', 'إعادة تسجيل الفيديو') : t('Record Video', 'تسجيل فيديو')}</span>
                    </button>
                </div>

                {profile?.video_intro_url && (
                    <div className="mt-6 max-w-md bg-muted p-4 rounded-xl border border-border">
                        <h4 className="text-sm font-semibold mb-3 text-foreground">{t('Your Current Video Pitch', 'فيديو تعريفي الحالي')}</h4>
                        <video 
                            src={profile.video_intro_url} 
                            controls 
                            className="w-full aspect-video rounded-lg shadow-sm border border-border bg-black"
                        />
                    </div>
                )}
            </div>

            {showVideoModal && (
                <VideoRecorderModal 
                    onClose={() => setShowVideoModal(false)}
                    onSave={async (blob) => {
                        await profileService.uploadVideoIntro(blob);
                        await loadProfile();
                    }}
                    t={t}
                />
            )}
        </div>
    );
};

interface VideoRecorderModalProps {
    onClose: () => void;
    onSave: (blob: Blob) => Promise<void>;
    t: (en: string, ar: string) => string;
}

const VideoRecorderModal = ({ onClose, onSave, t }: VideoRecorderModalProps) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recording, setRecording] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const previewRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startCamera = async () => {
        setLoading(true);
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: true
            });
            setStream(mediaStream);
            setPermissionStatus('granted');
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err: any) {
            console.error("Camera access error:", err);
            setPermissionStatus('denied');
            setError(t(
                "Could not access camera or microphone. Please ensure permissions are granted.",
                "تعذر الوصول إلى الكاميرا أو الميكروفون. يرجى التأكد من منح الأذونات."
            ));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const handleStartRecording = () => {
        if (!stream) return;
        setVideoUrl(null);
        setRecordedBlob(null);

        const options = { mimeType: 'video/webm;codecs=vp9,opus' };
        let recorder: MediaRecorder;
        try {
            recorder = new MediaRecorder(stream, options);
        } catch (e) {
            try {
                recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            } catch (err) {
                recorder = new MediaRecorder(stream);
            }
        }

        const chunks: Blob[] = [];
        recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            setRecordedBlob(blob);
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
            if (previewRef.current) {
                previewRef.current.src = url;
            }
        };

        recorder.start(1000);
        setMediaRecorder(recorder);
        setRecording(true);
        setCountdown(60);

        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    recorder.stop();
                    setRecording(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleStopRecording = () => {
        if (mediaRecorder && recording) {
            mediaRecorder.stop();
            setRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const handleReset = () => {
        setVideoUrl(null);
        setRecordedBlob(null);
        setCountdown(60);
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    };

    const handleSaveVideo = async () => {
        if (!recordedBlob) return;
        setUploading(true);
        try {
            await onSave(recordedBlob);
            onClose();
        } catch (err) {
            setError(t("Failed to upload video introduction", "فشل رفع الفيديو التعريفي"));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">{t("Record Video Introduction", "تسجيل مقدمة مرئية")}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center">
                    {error && (
                        <div className="w-full bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3 mb-4 text-sm">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <div>{error}</div>
                        </div>
                    )}

                    {permissionStatus === 'prompt' && loading && (
                        <div className="flex flex-col items-center py-12">
                            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-gray-500 text-sm">{t("Requesting camera permission...", "جارٍ طلب إذن الكاميرا...")}</p>
                        </div>
                    )}

                    {permissionStatus === 'denied' && (
                        <div className="text-center py-8">
                            <Video size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-600 mb-4 font-medium">{t("Camera Access Denied", "تم رفض الوصول للكاميرا")}</p>
                            <button onClick={startCamera} className="bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 font-medium text-sm transition-colors">
                                {t("Try Again", "إعادة المحاولة")}
                            </button>
                        </div>
                    )}

                    {permissionStatus === 'granted' && (
                        <div className="w-full flex flex-col items-center">
                            {/* Video Display */}
                            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                                {!videoUrl ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover scale-x-[-1]"
                                        />
                                        {recording && (
                                            <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-2 font-medium tracking-wide">
                                                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0" />
                                                <span>REC</span>
                                                <span className="border-l border-white/20 pl-2 ml-1 text-red-400 font-mono">{countdown}s</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <video
                                        ref={previewRef}
                                        controls
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            {/* Info instructions */}
                            {!videoUrl && !recording && (
                                <p className="text-xs text-gray-500 mt-3 text-center max-w-md">
                                    {t(
                                        "Position yourself in a well-lit room. Speak clearly about your experience and career goals.",
                                        "ضع نفسك في غرفة مضاءة جيداً. تحدث بوضوح عن خبرتك وأهدافك المهنية."
                                    )}
                                </p>
                            )}

                            {/* Control Actions */}
                            <div className="flex gap-4 mt-6">
                                {!videoUrl ? (
                                    !recording ? (
                                        <button
                                            onClick={handleStartRecording}
                                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-full font-medium transition-all shadow-md"
                                        >
                                            <Play size={18} fill="currentColor" />
                                            <span>{t("Start Recording (60s)", "بدء التسجيل (٦٠ ثانية)")}</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleStopRecording}
                                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-medium transition-all shadow-md"
                                        >
                                            <Square size={18} fill="currentColor" />
                                            <span>{t("Stop & Review", "إيقاف ومعاينة")}</span>
                                        </button>
                                    )
                                ) : (
                                    <>
                                        <button
                                            onClick={handleReset}
                                            disabled={uploading}
                                            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all"
                                        >
                                            <RefreshCw size={18} />
                                            <span>{t("Record Again", "إعادة التسجيل")}</span>
                                        </button>
                                        <button
                                            onClick={handleSaveVideo}
                                            disabled={uploading}
                                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-full font-medium transition-all shadow-md disabled:bg-teal-400"
                                        >
                                            {uploading ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Check size={18} />
                                            )}
                                            <span>{uploading ? t("Uploading...", "جارٍ الرفع...") : t("Save & Use Video", "حفظ واستخدام الفيديو")}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
