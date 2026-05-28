import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase,
  MapPin,
  Clock,
  Star,
  Heart,
  ExternalLink,
  Filter,
  Search,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
  GraduationCap,
  Target,
  Award,
  XCircle,
  WifiOff,
  Coins
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDateFromString } from '@/utils/dateFormat';

interface MatchBreakdown {
  skills_match?: number;
  experience_match?: number;
  title_match?: number;
  location_match?: number;
  d33_alignment?: number;
  details?: {
    matching_skills?: string[];
    missing_skills?: string[];
    recommendation?: string;
    fit_assessment?: string;
    ai_analyzed?: boolean;
    ai_model?: string;
  };
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  matchScore: number;
  matchBreakdown?: MatchBreakdown;
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  isBookmarked?: boolean;
  candidateLevel?: string;
  jobLevel?: string;
  fitAssessment?: string;
  hasApplied?: boolean;
  applicationStatus?: string;  // 'submitted', 'under_review', 'withdrawn', 'rejected', etc.
  commute?: {
    distance_km?: number;
    time_mins?: number;
    peak_time_mins?: number;
    peak_difference_mins?: number;
  };
}

interface JobMatchesProps {
  candidateProfile?: any;
}


const JobMatches: React.FC<JobMatchesProps> = ({ candidateProfile }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const EXPERIENCE_LEVELS = [
    { value: 'all', label: t('All Levels', 'كل المستويات'), icon: '📋' },
    { value: 'trainee', label: t('Trainee/Intern', 'متدرب/متمرّن'), icon: '🎓' },
    { value: 'junior', label: t('Junior (0-2 yrs)', 'مبتدئ (0-2 سنة)'), icon: '🌱' },
    { value: 'mid', label: t('Mid-Level (2-5 yrs)', 'متوسط (2-5 سنوات)'), icon: '💼' },
    { value: 'senior', label: t('Senior (5+ yrs)', 'خبير (5+ سنوات)'), icon: '⭐' },
  ];

  const getJobTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'full-time': t('Full Time', 'دوام كامل'),
      'part-time': t('Part Time', 'دوام جزئي'),
      'contract': t('Contract', 'عقد'),
      'internship': t('Internship', 'تدريب'),
      'temporary': t('Temporary', 'مؤقت'),
      'freelance': t('Freelance', 'عمل حر'),
    };
    return typeMap[type] || type.replace('-', ' ');
  };
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high-match' | 'recent'>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'distance' | 'commute' | 'date'>('relevance');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());
  const [cvLoaded, setCvLoaded] = useState(false);
  const [aiMatching, setAiMatching] = useState(false);
  const [candidateLevel, setCandidateLevel] = useState<string>('');
  const [matchMessage, setMatchMessage] = useState('');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat?: number, long?: number }>({});

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number>(30);
  const [cvRequired, setCvRequired] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  const navigate = useNavigate();

  // Countdown timer for retry
  useEffect(() => {
    if (retryCountdown !== null && retryCountdown > 0) {
      const timer = setTimeout(() => {
        setRetryCountdown(retryCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (retryCountdown === 0) {
      // Auto-retry when countdown reaches 0
      setRetryCountdown(null);
      loadJobMatches(true);
    }
  }, [retryCountdown]);

  // Request user location on mount
  // useEffect removed as per user request (will use profile location from DB)

  const loadJobMatches = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    // Reset error states
    setError(null);
    setServiceUnavailable(false);
    setCvRequired(false);

    try {
      const params: any = {
        use_ai: 'true',
        filter_by_level: experienceFilter === 'all' ? 'false' : 'true',
        sort_by: sortBy
      };

      if (userLocation.lat && userLocation.long) {
        params.lat = userLocation.lat;
        params.long = userLocation.long;
      }

      const response = await restClient.get('/api/candidate/job-matches', {
        params
      });

      if (response.data.success) {
        setJobs(response.data.jobs || []);
        setCvLoaded(response.data.cv_loaded || false);
        setAiMatching(response.data.ai_matching || false);
        setCandidateLevel(response.data.candidate_level || '');
        setMatchMessage(response.data.message || '');

        // Update user location from response if available and not set locally
        if (response.data.user_location && !userLocation.lat) {
          setUserLocation({
            lat: response.data.user_location.lat,
            long: response.data.user_location.long
          });
        }

      } else {
        // Handle specific error types
        if (response.data.service_unavailable) {
          setServiceUnavailable(true);
          setRetryAfter(response.data.retry_after || 30);
          setError(response.data.error || 'AI matching service is not available. Please try again later.');
        } else if (response.data.cv_required) {
          setCvRequired(true);
          setError(response.data.error || 'Please upload your CV first to get personalized job matches.');
        } else {
          setError(response.data.error || 'Failed to load job matches');
        }
      }
    } catch (err: any) {
      console.error('Error loading job matches:', err);

      // Check if it's a 503 Service Unavailable error
      if (err.response?.status === 503) {
        setServiceUnavailable(true);
        setRetryAfter(err.response?.data?.retry_after || 30);
        setError(err.response?.data?.error || 'AI matching service is not available. Please try again later.');
      } else if (err.response?.status === 400 && err.response?.data?.cv_required) {
        setCvRequired(true);
        setError(err.response?.data?.error || 'Please upload your CV first to get personalized job matches.');
      } else {
        setError('Failed to connect to the matching service. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [experienceFilter, sortBy, userLocation]);

  useEffect(() => {
    loadJobMatches();
  }, [loadJobMatches, candidateProfile]);

  const handleRefresh = () => {
    loadJobMatches(true);
  };

  const handleSortChange = (type: 'relevance' | 'distance' | 'commute' | 'date') => {
    setSortBy(type);
  };

  const handleRetryWithCountdown = () => {
    setRetryCountdown(retryAfter);
  };

  const handleBookmark = (jobId: string) => {
    setBookmarkedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleApply = async (jobId: string) => {
    // Optimistic update — show "Applied" immediately
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId ? { ...job, hasApplied: true } : job
      )
    );

    try {
      const response = await restClient.post('/api/jobs/apply', {
        job_id: jobId,
        user_id: candidateProfile?.id,
        cover_letter: 'Application from Candidate Dashboard'
      });

      if (response.data.success) {
        alert(t('Application submitted successfully!', 'تم تقديم الطلب بنجاح!'));
      } else {
        // Rollback on failure
        setJobs(prevJobs =>
          prevJobs.map(job =>
            job.id === jobId ? { ...job, hasApplied: false } : job
          )
        );
        alert(response.data.message || t('Application failed', 'فشل تقديم الطلب'));
      }
    } catch (error: any) {
      console.error('Error applying to job:', error);
      if (error.response?.data?.message?.includes('already applied')) {
        // Keep the optimistic state — user already applied
        alert(t('You have already applied for this job.', 'لقد قدمت بالفعل على هذه الوظيفة.'));
      } else {
        // Rollback on network error
        setJobs(prevJobs =>
          prevJobs.map(job =>
            job.id === jobId ? { ...job, hasApplied: false } : job
          )
        );
        alert(t('Failed to submit application. Please try again.', 'فشل تقديم الطلب. يرجى المحاولة مرة أخرى.'));
      }
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getFitBadge = (fit: string | undefined) => {
    switch (fit) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800">{t('Excellent Fit', 'توافق ممتاز')}</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800">{t('Good Fit', 'توافق جيد')}</Badge>;
      case 'moderate':
        return <Badge className="bg-yellow-100 text-yellow-800">{t('Moderate Fit', 'توافق متوسط')}</Badge>;
      case 'poor':
        return <Badge className="bg-orange-100 text-orange-800">{t('Below Average', 'أقل من المتوسط')}</Badge>;
      case 'not_suitable':
        return <Badge className="bg-red-100 text-red-800">{t('Not Recommended', 'غير موصى به')}</Badge>;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-green-100 text-green-800';
      case 'part-time': return 'bg-blue-100 text-blue-800';
      case 'contract': return 'bg-purple-100 text-purple-800';
      case 'internship': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelBadge = (level: string | undefined) => {
    const levelConfig: Record<string, { color: string; label: string }> = {
      'trainee': { color: 'bg-purple-100 text-purple-800', label: t('Trainee/Intern', 'متدرب/متمرّن') },
      'junior': { color: 'bg-blue-100 text-blue-800', label: t('Junior', 'مبتدئ') },
      'mid': { color: 'bg-green-100 text-green-800', label: t('Mid-Level', 'متوسط') },
      'senior': { color: 'bg-orange-100 text-orange-800', label: t('Senior', 'خبير') },
      'executive': { color: 'bg-red-100 text-red-800', label: t('Executive', 'تنفيذي') }
    };

    const config = levelConfig[level || ''] || { color: 'bg-gray-100 text-gray-800', label: level || t('Unknown', 'غير معروف') };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredJobs = jobs.filter(job => {
    // Apply match score filter
    let passesScoreFilter = true;
    switch (filter) {
      case 'high-match':
        passesScoreFilter = job.matchScore >= 70;
        break;
      case 'recent':
        const jobDate = new Date(job.postedDate);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        passesScoreFilter = jobDate >= threeDaysAgo;
        break;
    }

    // Apply experience level filter
    let passesLevelFilter = true;
    if (experienceFilter !== 'all') {
      passesLevelFilter = job.jobLevel === experienceFilter;
    }

    return passesScoreFilter && passesLevelFilter;
  });

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>{t('Job Matches', 'الوظائف المطابقة')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('Analyzing your profile with AI and finding best matches...', 'جاري تحليل ملفك الشخصي بالذكاء الاصطناعي وإيجاد أفضل المطابقات...')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('This may take a moment...', 'قد يستغرق ذلك لحظة...')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Service Unavailable Error State
  if (serviceUnavailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>{t('Job Matches', 'الوظائف المطابقة')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <WifiOff className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800">{t('AI Matching Service Unavailable', 'خدمة المطابقة الذكية غير متاحة')}</AlertTitle>
            <AlertDescription className="text-red-700">
              <p className="mt-2">{error}</p>
              <p className="mt-2 text-sm">
                {t('The AI-powered job matching service is temporarily unavailable. This could be due to high demand or maintenance.', 'خدمة مطابقة الوظائف بالذكاء الاصطناعي غير متاحة مؤقتاً. قد يكون ذلك بسبب الطلب المرتفع أو الصيانة.')}
              </p>
              <div className="mt-4 flex items-center gap-4">
                {retryCountdown !== null ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    <span className="text-sm">{t(`Retrying in ${retryCountdown} seconds...`, `إعادة المحاولة خلال ${retryCountdown} ثواني...`)}</span>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} style={{ marginInlineEnd: 8 }} />
                      {t('Try Again Now', 'حاول مرة أخرى')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRetryWithCountdown}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <Clock className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                      {t(`Auto-retry in ${retryAfter}s`, `إعادة تلقائية خلال ${retryAfter}ث`)}
                    </Button>
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // CV Required Error State
  if (cvRequired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>{t('Job Matches', 'الوظائف المطابقة')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-200 bg-amber-50">
            <FileText className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">{t('CV Required for AI Matching', 'السيرة الذاتية مطلوبة للمطابقة الذكية')}</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mt-2">{error}</p>
              <p className="mt-2 text-sm">
                {t('To get accurate, AI-powered job matches based on your skills and experience, please upload your CV first.', 'للحصول على مطابقات وظيفية دقيقة بالذكاء الاصطناعي بناءً على مهاراتك وخبراتك، يرجى رفع سيرتك الذاتية أولاً.')}
              </p>
              <div className="mt-4">
                <Button
                  onClick={() => navigate('/cv-builder')}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <FileText className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                  {t('Upload or Create CV', 'ارفع أو أنشئ السيرة الذاتية')}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // General Error State
  if (error && !serviceUnavailable && !cvRequired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>{t('Job Matches', 'الوظائف المطابقة')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800">{t('Error Loading Job Matches', 'خطأ في تحميل الوظائف المطابقة')}</AlertTitle>
            <AlertDescription className="text-red-700">
              <p className="mt-2">{error}</p>
              <div className="mt-4">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} style={{ marginInlineEnd: 8 }} />
                  {t('Try Again', 'حاول مرة أخرى')}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!cvLoaded && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 flex justify-between items-center">
            <span>
              <strong>{t('Upload your CV for personalized matches!', 'ارفع سيرتك الذاتية للحصول على مطابقات مخصصة!')}</strong> {t('Job scores are currently generic.', 'درجات الوظائف حالياً عامة.')}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-4 border-amber-300 hover:bg-amber-100"
              onClick={() => navigate('/cv-builder')}
            >
              <FileText className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
              {t('Upload CV', 'ارفع السيرة الذاتية')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {cvLoaded && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>{t('CV Loaded!', 'تم تحميل السيرة الذاتية!')}</strong> {matchMessage}
                {candidateLevel && (
                  <span style={{ marginInlineStart: 8 }}>
                    {t('Your level:', 'مستواك:')} <Badge variant="outline" style={{ marginInlineStart: 4 }}>{candidateLevel}</Badge>
                  </span>
                )}
              </div>
              {aiMatching && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Sparkles className="h-3 w-3" style={{ marginInlineEnd: 4 }} />
                  {t('AI-Powered', 'مدعوم بالذكاء الاصطناعي')}
                </Badge>
              )}
              {userLocation.lat && (
                <Badge variant="outline" className="ml-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {t('Location Set', 'تم تحديد الموقع')}
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>{t('Job Matches', 'الوظائف المطابقة')}</span>
                  {aiMatching && <Sparkles className="h-4 w-4 text-purple-500" />}
                </CardTitle>
                <CardDescription>
                  {cvLoaded
                    ? t(`Showing ${filteredJobs.length} jobs matched to your profile`, `عرض ${filteredJobs.length} وظيفة مطابقة لملفك الشخصي`)
                    : t('Upload CV for personalized AI-powered matching', 'ارفع السيرة الذاتية للمطابقة الذكية المخصصة')
                  }
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? t('Refreshing...', 'جاري التحديث...') : t('Refresh', 'تحديث')}</span>
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('Level:', 'المستوى:')}</span>
                <div className="flex space-x-1">
                  {EXPERIENCE_LEVELS.map(level => (
                    <Button
                      key={level.value}
                      variant={experienceFilter === level.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExperienceFilter(level.value)}
                      className="text-xs"
                    >
                      {level.icon} {level.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('Sort:', 'ترتيب:')}</span>
                <div className="flex space-x-1">
                  <Button
                    variant={sortBy === 'relevance' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange('relevance')}
                  >
                    {t('Relevance', 'الصلة')}
                  </Button>
                  <Button
                    variant={sortBy === 'distance' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange('distance')}
                  >
                    {t('Distance', 'المسافة')}
                  </Button>
                  <Button
                    variant={sortBy === 'commute' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange('commute')}
                  >
                    {t('Commute', 'التنقل')}
                  </Button>
                  <Button
                    variant={sortBy === 'date' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange('date')}
                  >
                    {t('Recent', 'الأحدث')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('No jobs found matching your filters.', 'لم يتم العثور على وظائف تطابق معاييرك.')}</p>
                <p className="text-sm mt-2">{t('Try adjusting your experience level or filter settings.', 'حاول تعديل مستوى الخبرة أو إعدادات التصفية.')}</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <Card key={job.id} className={`border-l-4 ${job.matchScore >= 70 ? 'border-l-green-500' : job.matchScore >= 50 ? 'border-l-blue-500' : 'border-l-gray-300'}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <Badge className={getMatchScoreColor(job.matchScore)}>
                            {job.matchScore}% {t('match', 'مطابقة')}
                          </Badge>
                          {job.jobLevel && getLevelBadge(job.jobLevel)}
                          {job.fitAssessment && getFitBadge(job.fitAssessment)}
                        </div>
                        <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center space-x-1">
                            <Briefcase className="h-4 w-4" />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                          {job.commute?.distance_km && (
                            <>
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                🚗 {job.commute.distance_km} {t('km', 'كم')}
                              </Badge>
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                ⏱ {job.commute.time_mins} {t('min', 'دقيقة')}
                              </Badge>
                              {job.commute.peak_time_mins && (
                                <Badge className="text-xs flex items-center gap-1 bg-amber-100 text-amber-800">
                                  🚦 {t('Peak:', 'الذروة:')} {job.commute.peak_time_mins} {t('min', 'دقيقة')}
                                </Badge>
                              )}
                            </>
                          )}
                          <div className="flex items-center space-x-1">
                            <Coins className="h-4 w-4" />
                            <span>{job.salary}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDateFromString(job.postedDate)}</span>
                          </div>
                        </div>
                        <Badge className={getTypeColor(job.type)}>
                          {getJobTypeLabel(job.type)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookmark(job.id)}
                        className={bookmarkedJobs.has(job.id) ? 'text-red-500' : 'text-gray-400'}
                      >
                        <Heart className={`h-4 w-4 ${bookmarkedJobs.has(job.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">{job.description}</p>

                    {/* Match Breakdown (Expandable) */}
                    {job.matchBreakdown && cvLoaded && (
                      <div className="mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                          className="text-sm text-blue-600 p-0 h-auto"
                        >
                          {expandedJob === job.id ? t('▼ Hide Match Analysis', '▼ إخفاء تحليل المطابقة') : t('▶ Show Match Analysis', '▶ عرض تحليل المطابقة')}
                        </Button>

                        {expandedJob === job.id && (
                          <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              {t('Match Breakdown', 'تفصيل المطابقة')}
                              {job.matchBreakdown.details?.ai_analyzed && (
                                <Badge className="bg-purple-100 text-purple-800 text-xs">
                                  <Sparkles className="h-3 w-3" style={{ marginInlineEnd: 4 }} />
                                  {t('AI Analyzed', 'تحليل ذكاء اصطناعي')}
                                </Badge>
                              )}
                            </h4>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <div className="text-center p-2 bg-white rounded">
                                <div className="text-lg font-bold text-blue-600">{job.matchBreakdown.skills_match || 0}/40</div>
                                <div className="text-xs text-muted-foreground">{t('Skills', 'المهارات')}</div>
                              </div>
                              <div className="text-center p-2 bg-white rounded">
                                <div className="text-lg font-bold text-green-600">{job.matchBreakdown.experience_match || 0}/25</div>
                                <div className="text-xs text-muted-foreground">{t('Experience', 'الخبرة')}</div>
                              </div>
                              <div className="text-center p-2 bg-white rounded">
                                <div className="text-lg font-bold text-purple-600">{job.matchBreakdown.title_match || 0}/20</div>
                                <div className="text-xs text-muted-foreground">{t('Title', 'المسمى')}</div>
                              </div>
                              <div className="text-center p-2 bg-white rounded">
                                <div className="text-lg font-bold text-orange-600">{job.matchBreakdown.location_match || 0}/10</div>
                                <div className="text-xs text-muted-foreground">{t('Location', 'الموقع')}</div>
                              </div>
                              <div className="text-center p-2 bg-white rounded">
                                <div className="text-lg font-bold text-teal-600">{job.matchBreakdown.d33_alignment || 0}/5</div>
                                <div className="text-xs text-muted-foreground">D33</div>
                              </div>
                            </div>

                            {/* Radar Chart — Visual Skill-Gap Comparison */}
                            <div className="mt-3 flex justify-center">
                              <div style={{ width: 280, height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[
                                    { axis: t('Skills', 'المهارات'), value: Math.round(((job.matchBreakdown.skills_match || 0) / 40) * 100) },
                                    { axis: t('Experience', 'الخبرة'), value: Math.round(((job.matchBreakdown.experience_match || 0) / 25) * 100) },
                                    { axis: t('Title', 'المسمى'), value: Math.round(((job.matchBreakdown.title_match || 0) / 20) * 100) },
                                    { axis: t('Location', 'الموقع'), value: Math.round(((job.matchBreakdown.location_match || 0) / 10) * 100) },
                                    { axis: 'D33', value: Math.round(((job.matchBreakdown.d33_alignment || 0) / 5) * 100) },
                                  ]}>
                                    <PolarGrid stroke="#E5E7EB" />
                                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#6B7280' }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Match" dataKey="value" stroke="#0D9488" fill="#0D9488" fillOpacity={0.25} strokeWidth={2} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {job.matchBreakdown.details && (
                              <div className="space-y-2 mt-3">
                                {job.matchBreakdown.details.matching_skills && job.matchBreakdown.details.matching_skills.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium text-green-700">{t('Matching Skills: ', 'المهارات المطابقة: ')}</span>
                                    <span className="text-sm text-green-600">
                                      {job.matchBreakdown.details.matching_skills.join(', ')}
                                    </span>
                                  </div>
                                )}
                                {job.matchBreakdown.details.missing_skills && job.matchBreakdown.details.missing_skills.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium text-amber-700">{t('Skills to Develop: ', 'مهارات للتطوير: ')}</span>
                                    <span className="text-sm text-amber-600">
                                      {job.matchBreakdown.details.missing_skills.join(', ')}
                                    </span>
                                  </div>
                                )}
                                {job.matchBreakdown.details.recommendation && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                    <strong>{t('AI Recommendation:', 'توصية الذكاء الاصطناعي:')}</strong> {job.matchBreakdown.details.recommendation}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {job.requirements && job.requirements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">{t('Requirements:', 'المتطلبات:')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.requirements.slice(0, 5).map((req, index) => {
                            const reqText = typeof req === 'string'
                              ? req
                              : (req as any)?.description || (req as any)?.category || t('Requirement', 'متطلب');
                            return (
                              <Badge key={index} variant="outline" className="text-xs">
                                {reqText}
                              </Badge>
                            );
                          })}
                          {job.requirements.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.requirements.length - 5} {t('more', 'أخرى')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                        {t('View Details', 'عرض التفاصيل')}
                      </Button>
                      {job.hasApplied ? (
                        <Badge className="bg-green-100 text-green-800 px-4 py-2 flex items-center">
                          <CheckCircle className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                          {t('Already Applied', 'تم التقديم')}
                        </Badge>
                      ) : job.applicationStatus === 'withdrawn' ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-100 text-amber-800 px-3 py-2 flex items-center">
                            <XCircle className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                            {t('Withdrawn', 'تم السحب')}
                          </Badge>
                          <Button size="sm" onClick={() => handleApply(job.id)}>
                            {t('Re-Apply', 'إعادة التقديم')}
                          </Button>
                        </div>
                      ) : job.applicationStatus === 'rejected' ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-100 text-red-800 px-3 py-2 flex items-center">
                            <XCircle className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                            {t('Not Selected', 'لم يتم الاختيار')}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => handleApply(job.id)}>
                            {t('Re-Apply', 'إعادة التقديم')}
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => handleApply(job.id)}>
                          {t('Apply Now', 'قدّم الآن')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobMatches;
