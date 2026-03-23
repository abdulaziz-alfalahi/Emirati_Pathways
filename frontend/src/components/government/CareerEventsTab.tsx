import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Calendar,
  MapPin,
  Users,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Target,
  TrendingUp,
  Plus,
  Star,
  GraduationCap,
  Shield,
  Landmark,
  Award,
  UserCheck,
  FileText,
  Sparkles,
  Radio,
  CalendarCheck
} from 'lucide-react';

interface CareerEventsTabProps {
  isRTL: boolean;
  b: (en: string, ar: string) => string;
}

// ── Data Types ─────────────────────────────────────────────────────
interface ParticipatingCompany {
  name: string;
  nameAr: string;
  sector: string;
  sectorAr: string;
  jobsOffered: number;
  emiratizationContribution: number;
}

interface EventOutcome {
  candidatesAttended: number;
  interviewsConducted: number;
  offersExtended: number;
  placements: number;
}

interface CareerEvent {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  accentColor: string;
  accentBg: string;
  type: 'career_fair' | 'open_day' | 'university_fair' | 'sector_event';
  status: 'upcoming' | 'registration_open' | 'live' | 'completed';
  organizer: string;
  organizerAr: string;
  dateRange: string;
  dateRangeAr: string;
  venue: string;
  venueAr: string;
  description: string;
  descriptionAr: string;
  expectedAttendance: number;
  totalJobs: number;
  registeredCandidates: number;
  companies: ParticipatingCompany[];
  outcomes?: EventOutcome;
}

interface EventTemplate {
  name: string;
  nameAr: string;
  icon: React.ElementType;
  description: string;
  descriptionAr: string;
  type: string;
  typeAr: string;
}

// ── Mock Data ──────────────────────────────────────────────────────
const careerEvents: CareerEvent[] = [
  {
    id: 'ruya-2025',
    name: "Ru'ya Careers UAE 2025",
    nameAr: 'معرض رؤية للتوظيف 2025',
    icon: Star,
    gradient: 'from-indigo-500 to-purple-600',
    borderColor: 'border-indigo-200',
    accentColor: 'text-indigo-700',
    accentBg: 'bg-indigo-50',
    type: 'career_fair',
    status: 'registration_open',
    organizer: 'Informa Markets / EHRDC',
    organizerAr: 'إنفورما ماركتس / مجلس تنمية الموارد البشرية الإماراتية',
    dateRange: 'Sep 23–25, 2025',
    dateRangeAr: '23–25 سبتمبر 2025',
    venue: 'Dubai World Trade Centre (DWTC)',
    venueAr: 'مركز دبي التجاري العالمي',
    description: '24th edition — 180 organizations, on-the-spot interviews, career coaching, AI/coding innovation challenges, and skills workshops for Emirati nationals.',
    descriptionAr: 'الدورة 24 — 180 منظمة، مقابلات فورية، توجيه مهني، تحديات ابتكار الذكاء الاصطناعي والبرمجة، وورش عمل لتطوير المهارات للمواطنين الإماراتيين.',
    expectedAttendance: 15000,
    totalJobs: 5000,
    registeredCandidates: 3420,
    companies: [
      { name: 'DP World', nameAr: 'موانئ دبي العالمية', sector: 'Logistics', sectorAr: 'اللوجستيات', jobsOffered: 280, emiratizationContribution: 45 },
      { name: 'Emirates NBD', nameAr: 'الإمارات دبي الوطني', sector: 'Banking', sectorAr: 'المصارف', jobsOffered: 150, emiratizationContribution: 78 },
      { name: 'Amazon', nameAr: 'أمازون', sector: 'Technology', sectorAr: 'التكنولوجيا', jobsOffered: 120, emiratizationContribution: 25 },
      { name: 'DEWA', nameAr: 'هيئة كهرباء ومياه دبي', sector: 'Energy', sectorAr: 'الطاقة', jobsOffered: 200, emiratizationContribution: 89 },
      { name: 'Majid Al Futtaim', nameAr: 'ماجد الفطيم', sector: 'Retail', sectorAr: 'التجزئة', jobsOffered: 180, emiratizationContribution: 12 },
    ],
    outcomes: undefined
  },
  {
    id: 'ehrdc-open-day-jun',
    name: 'EHRDC Open Recruitment Day',
    nameAr: 'يوم التوظيف المفتوح — مجلس تنمية الموارد البشرية',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-200',
    accentColor: 'text-emerald-700',
    accentBg: 'bg-emerald-50',
    type: 'open_day',
    status: 'completed',
    organizer: 'EHRDC',
    organizerAr: 'مجلس تنمية الموارد البشرية الإماراتية',
    dateRange: 'Jun 8, 2025',
    dateRangeAr: '8 يونيو 2025',
    venue: 'Umm Suqeim Majlis, Dubai',
    venueAr: 'مجلس أم سقيم، دبي',
    description: 'Community-based recruitment event with direct hiring from private sector companies. 130 job opportunities with on-site interviews and Nafis program integration.',
    descriptionAr: 'فعالية توظيف مجتمعية مع توظيف مباشر من شركات القطاع الخاص. 130 فرصة عمل مع مقابلات في الموقع وتكامل مع برنامج نافس.',
    expectedAttendance: 500,
    totalJobs: 130,
    registeredCandidates: 487,
    companies: [
      { name: 'Dubai Customs', nameAr: 'جمارك دبي', sector: 'Government', sectorAr: 'الحكومة', jobsOffered: 25, emiratizationContribution: 92 },
      { name: 'Mashreq Bank', nameAr: 'بنك المشرق', sector: 'Banking', sectorAr: 'المصارف', jobsOffered: 18, emiratizationContribution: 65 },
      { name: 'Etisalat (e&)', nameAr: 'اتصالات (e&)', sector: 'Telecom', sectorAr: 'الاتصالات', jobsOffered: 22, emiratizationContribution: 72 },
    ],
    outcomes: {
      candidatesAttended: 412,
      interviewsConducted: 287,
      offersExtended: 98,
      placements: 76
    }
  },
  {
    id: 'tawdheef-2025',
    name: 'Tawdheef x Zaheb 2025',
    nameAr: 'توظيف × ذهب 2025',
    icon: Award,
    gradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-200',
    accentColor: 'text-amber-700',
    accentBg: 'bg-amber-50',
    type: 'career_fair',
    status: 'upcoming',
    organizer: 'Informa Markets / Abu Dhabi Government',
    organizerAr: 'إنفورما ماركتس / حكومة أبوظبي',
    dateRange: 'Nov 18–20, 2025',
    dateRangeAr: '18–20 نوفمبر 2025',
    venue: 'ADNEC, Abu Dhabi — Halls 8, 9 & 10',
    venueAr: 'أدنيك، أبوظبي — القاعات 8 و9 و10',
    description: 'Abu Dhabi\'s premier Emirati career fair. Structured zones for career guidance, skills enhancement, CV clinics, mock interviews, and Empowerment Stage with inspirational speakers.',
    descriptionAr: 'معرض التوظيف الإماراتي الأول في أبوظبي. مناطق منظمة للتوجيه المهني وتعزيز المهارات وعيادات السيرة الذاتية والمقابلات التجريبية ومنصة التمكين مع متحدثين ملهمين.',
    expectedAttendance: 12000,
    totalJobs: 3500,
    registeredCandidates: 890,
    companies: [
      { name: 'ADNOC', nameAr: 'أدنوك', sector: 'Oil & Gas', sectorAr: 'النفط والغاز', jobsOffered: 350, emiratizationContribution: 60 },
      { name: 'Etihad Airways', nameAr: 'الاتحاد للطيران', sector: 'Aviation', sectorAr: 'الطيران', jobsOffered: 200, emiratizationContribution: 55 },
      { name: 'Mubadala', nameAr: 'مبادلة', sector: 'Investment', sectorAr: 'الاستثمار', jobsOffered: 120, emiratizationContribution: 80 },
    ],
    outcomes: undefined
  },
  {
    id: 'national-service-fair',
    name: 'National Service Career Fair 2025',
    nameAr: 'معرض الخدمة الوطنية المهني 2025',
    icon: Shield,
    gradient: 'from-slate-600 to-slate-800',
    borderColor: 'border-slate-300',
    accentColor: 'text-slate-700',
    accentBg: 'bg-slate-50',
    type: 'sector_event',
    status: 'completed',
    organizer: 'UAE Armed Forces / MoHRE',
    organizerAr: 'القوات المسلحة الإماراتية / وزارة الموارد البشرية والتوطين',
    dateRange: 'May 12–14, 2025',
    dateRangeAr: '12–14 مايو 2025',
    venue: 'Dubai Exhibition Centre',
    venueAr: 'مركز دبي للمعارض',
    description: 'Dedicated to National Service graduates — connecting military-trained Emiratis with government and private sector opportunities, including higher education pathways.',
    descriptionAr: 'مخصص لخريجي الخدمة الوطنية — ربط الإماراتيين المدربين عسكرياً بفرص القطاعين الحكومي والخاص، بما في ذلك مسارات التعليم العالي.',
    expectedAttendance: 5000,
    totalJobs: 1500,
    registeredCandidates: 4200,
    companies: [
      { name: 'EDGE Group', nameAr: 'مجموعة إيدج', sector: 'Defense', sectorAr: 'الدفاع', jobsOffered: 180, emiratizationContribution: 75 },
      { name: 'Tawazun', nameAr: 'توازن', sector: 'Defense', sectorAr: 'الدفاع', jobsOffered: 90, emiratizationContribution: 85 },
      { name: 'Emirates', nameAr: 'طيران الإمارات', sector: 'Aviation', sectorAr: 'الطيران', jobsOffered: 150, emiratizationContribution: 50 },
    ],
    outcomes: {
      candidatesAttended: 3850,
      interviewsConducted: 2100,
      offersExtended: 680,
      placements: 520
    }
  },
  {
    id: 'mohre-open-day',
    name: 'MoHRE Open Career Day — Q2',
    nameAr: 'يوم التوظيف المفتوح — وزارة الموارد البشرية — الربع الثاني',
    icon: Landmark,
    gradient: 'from-blue-500 to-cyan-600',
    borderColor: 'border-blue-200',
    accentColor: 'text-blue-700',
    accentBg: 'bg-blue-50',
    type: 'open_day',
    status: 'completed',
    organizer: 'Ministry of Human Resources & Emiratisation',
    organizerAr: 'وزارة الموارد البشرية والتوطين',
    dateRange: 'Apr 15, 2025',
    dateRangeAr: '15 أبريل 2025',
    venue: 'MoHRE Headquarters, Dubai',
    venueAr: 'مقر وزارة الموارد البشرية، دبي',
    description: 'Part of MoHRE\'s series of 50+ open career days in H1 2025. 160+ private companies, supervised interviews, and real-time Nafis job matching.',
    descriptionAr: 'جزء من سلسلة أكثر من 50 يوم توظيف مفتوح في النصف الأول من 2025. أكثر من 160 شركة خاصة، مقابلات مُراقبة، ومطابقة وظائف نافس الفورية.',
    expectedAttendance: 800,
    totalJobs: 200,
    registeredCandidates: 650,
    companies: [
      { name: 'Emaar Properties', nameAr: 'إعمار العقارية', sector: 'Real Estate', sectorAr: 'العقارات', jobsOffered: 35, emiratizationContribution: 18 },
      { name: 'Dubai Holding', nameAr: 'دبي القابضة', sector: 'Diversified', sectorAr: 'متنوع', jobsOffered: 28, emiratizationContribution: 42 },
      { name: 'Al Futtaim Group', nameAr: 'مجموعة الفطيم', sector: 'Automotive', sectorAr: 'السيارات', jobsOffered: 20, emiratizationContribution: 15 },
    ],
    outcomes: {
      candidatesAttended: 580,
      interviewsConducted: 390,
      offersExtended: 145,
      placements: 112
    }
  },
  {
    id: 'uaeu-fair',
    name: 'UAEU "Pathways to Success" Career Fair',
    nameAr: 'معرض جامعة الإمارات "مسارات النجاح" المهني',
    icon: GraduationCap,
    gradient: 'from-rose-500 to-pink-600',
    borderColor: 'border-rose-200',
    accentColor: 'text-rose-700',
    accentBg: 'bg-rose-50',
    type: 'university_fair',
    status: 'completed',
    organizer: 'United Arab Emirates University',
    organizerAr: 'جامعة الإمارات العربية المتحدة',
    dateRange: 'Sep 3–4, 2025',
    dateRangeAr: '3–4 سبتمبر 2025',
    venue: 'UAEU Campus, Al Ain',
    venueAr: 'حرم جامعة الإمارات، العين',
    description: 'Two-day campus fair connecting students and alumni with government and private sector employers. CV workshops, interview prep, and one-on-one career consultations.',
    descriptionAr: 'معرض جامعي لمدة يومين يربط الطلاب والخريجين بأصحاب العمل من القطاعين الحكومي والخاص. ورش عمل السيرة الذاتية والتحضير للمقابلات والاستشارات المهنية الفردية.',
    expectedAttendance: 3000,
    totalJobs: 800,
    registeredCandidates: 2100,
    companies: [
      { name: 'Abu Dhabi Health Services (SEHA)', nameAr: 'شركة أبوظبي للخدمات الصحية (صحة)', sector: 'Healthcare', sectorAr: 'الرعاية الصحية', jobsOffered: 80, emiratizationContribution: 55 },
      { name: 'First Abu Dhabi Bank (FAB)', nameAr: 'بنك أبوظبي الأول', sector: 'Banking', sectorAr: 'المصارف', jobsOffered: 60, emiratizationContribution: 70 },
    ],
    outcomes: {
      candidatesAttended: 2450,
      interviewsConducted: 1200,
      offersExtended: 380,
      placements: 290
    }
  }
];

const eventTemplates: EventTemplate[] = [
  { name: 'Career Fair', nameAr: 'معرض توظيف', icon: Star, description: 'Large-scale multi-day exhibition', descriptionAr: 'معرض كبير متعدد الأيام', type: 'Career Fair', typeAr: 'معرض توظيف' },
  { name: 'Open Recruitment Day', nameAr: 'يوم توظيف مفتوح', icon: Users, description: 'Single-day community hiring event', descriptionAr: 'فعالية توظيف مجتمعية ليوم واحد', type: 'Open Day', typeAr: 'يوم مفتوح' },
  { name: 'University Career Fair', nameAr: 'معرض توظيف جامعي', icon: GraduationCap, description: 'Campus-based graduate recruitment', descriptionAr: 'توظيف خريجين في الحرم الجامعي', type: 'University Fair', typeAr: 'معرض جامعي' },
  { name: 'Sector Recruitment Day', nameAr: 'يوم توظيف قطاعي', icon: Briefcase, description: 'Industry-specific targeted hiring', descriptionAr: 'توظيف مستهدف لقطاع محدد', type: 'Sector Event', typeAr: 'فعالية قطاعية' },
];

// ── Helpers ─────────────────────────────────────────────────────────
const getEventTypeBadge = (type: string, b: (en: string, ar: string) => string) => {
  switch (type) {
    case 'career_fair':
      return <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] font-dubai-medium">{b('Career Fair', 'معرض توظيف')}</Badge>;
    case 'open_day':
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-dubai-medium">{b('Open Day', 'يوم مفتوح')}</Badge>;
    case 'university_fair':
      return <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[9px] font-dubai-medium">{b('University Fair', 'معرض جامعي')}</Badge>;
    case 'sector_event':
      return <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[9px] font-dubai-medium">{b('Sector Event', 'فعالية قطاعية')}</Badge>;
    default:
      return null;
  }
};

const getStatusBadge = (status: string, b: (en: string, ar: string) => string) => {
  switch (status) {
    case 'upcoming':
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-dubai-medium"><Clock className="h-3 w-3 mr-1 inline" />{b('Upcoming', 'قادم')}</Badge>;
    case 'registration_open':
      return <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] font-dubai-medium"><Radio className="h-3 w-3 mr-1 inline" />{b('Registration Open', 'التسجيل مفتوح')}</Badge>;
    case 'live':
      return <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-dubai-medium animate-pulse"><Radio className="h-3 w-3 mr-1 inline" />{b('Live Now', 'مباشر الآن')}</Badge>;
    case 'completed':
      return <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-dubai-medium"><CheckCircle className="h-3 w-3 mr-1 inline" />{b('Completed', 'مكتمل')}</Badge>;
    default:
      return null;
  }
};

// ── Component ──────────────────────────────────────────────────────
const CareerEventsTab: React.FC<CareerEventsTabProps> = ({ isRTL, b }) => {
  const [expandedEvent, setExpandedEvent] = useState<string | null>('ruya-2025');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createdEvents, setCreatedEvents] = useState<Array<{id: string; name: string; type: string; date: string; venue: string; description: string; expectedJobs: number; createdAt: string}>>([]);
  const [formData, setFormData] = useState({
    name: '', type: '', date: '', venue: '', organizer: '', description: '', expectedJobs: 100
  });
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const openCreateDialog = (template?: EventTemplate) => {
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: isRTL ? template.nameAr : template.name,
        type: isRTL ? template.typeAr : template.type,
        description: isRTL ? template.descriptionAr : template.description,
      }));
    } else {
      setFormData({ name: '', type: '', date: '', venue: '', organizer: '', description: '', expectedJobs: 100 });
    }
    setShowCreateDialog(true);
  };

  const handleCreateEvent = () => {
    if (!formData.name.trim()) return;
    setCreatedEvents(prev => [{
      id: `custom-${Date.now()}`, name: formData.name, type: formData.type, date: formData.date,
      venue: formData.venue, description: formData.description, expectedJobs: formData.expectedJobs,
      createdAt: new Date().toLocaleDateString(),
    }, ...prev]);
    setShowCreateDialog(false);
    setShowSuccess(formData.name);
    setTimeout(() => setShowSuccess(null), 4000);
    setFormData({ name: '', type: '', date: '', venue: '', organizer: '', description: '', expectedJobs: 100 });
  };

  const totalEvents = careerEvents.length;
  const totalRegistered = careerEvents.reduce((sum, e) => sum + e.registeredCandidates, 0);
  const completedEvents = careerEvents.filter(e => e.status === 'completed');
  const totalPlacements = completedEvents.reduce((sum, e) => sum + (e.outcomes?.placements || 0), 0);
  const totalCompanies = careerEvents.reduce((sum, e) => sum + e.companies.length, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: b('Total Events (2025)', 'إجمالي الفعاليات (2025)'), value: totalEvents, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', sub: `${completedEvents.length} ${b('completed', 'مكتمل')}` },
          { label: b('Candidates Registered', 'المرشحون المسجلون'), value: totalRegistered.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', sub: b('Across all events', 'عبر جميع الفعاليات') },
          { label: b('Companies Participating', 'الشركات المشاركة'), value: totalCompanies, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', sub: b('Public & private sector', 'القطاعان العام والخاص') },
          { label: b('Successful Placements', 'التوظيف الناجح'), value: totalPlacements.toLocaleString(), icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', sub: b('From completed events', 'من الفعاليات المكتملة') },
        ].map((stat, i) => (
          <Card key={i} className={`bg-white border ${stat.border} hover:shadow-md transition-all duration-200 group`}>
            <CardContent className="pt-5 pb-4 px-5">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 font-dubai-medium">{stat.label}</p>
                  <p className="text-3xl font-dubai-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-dubai-medium">{stat.sub}</p>
                </div>
                <div className={`p-3 ${stat.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Event Cards ─── */}
      {careerEvents.map((event) => {
        const isExpanded = expandedEvent === event.id;
        const EventIcon = event.icon;

        return (
          <Card key={event.id} className={`bg-white border ${event.borderColor} overflow-hidden transition-all duration-300 hover:shadow-lg`}>
            {/* Event Header */}
            <div className="cursor-pointer" onClick={() => setExpandedEvent(isExpanded ? null : event.id)}>
              <div className={`h-2 bg-gradient-to-r ${event.gradient}`} />
              <CardHeader className="pb-3">
                <div className={`flex items-start justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${event.gradient} text-white shadow-lg`}>
                      <EventIcon className="h-6 w-6" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <div className={`flex items-center gap-2 mb-1 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <CardTitle className="text-lg font-dubai-bold text-slate-900">
                          {isRTL ? event.nameAr : event.name}
                        </CardTitle>
                        {getStatusBadge(event.status, b)}
                        {getEventTypeBadge(event.type, b)}
                      </div>
                      <CardDescription className="font-dubai-medium text-slate-500 text-sm max-w-2xl">
                        {isRTL ? event.descriptionAr : event.description}
                      </CardDescription>
                      <div className={`flex items-center gap-4 mt-2 text-xs text-slate-400 font-dubai-medium flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {isRTL ? event.dateRangeAr : event.dateRange}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {isRTL ? event.venueAr : event.venue}</span>
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {isRTL ? event.organizerAr : event.organizer}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="hidden md:flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-lg ${event.accentBg} ${event.accentColor} text-xs font-dubai-bold`}>
                        {event.totalJobs.toLocaleString()} {b('jobs', 'وظيفة')}
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-dubai-bold">
                        {event.registeredCandidates.toLocaleString()} {b('registered', 'مسجل')}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <CardContent className="pt-0 pb-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">

                {/* Registration Progress */}
                <div className="mx-1 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-dubai-bold text-blue-800">{b('Candidate Registration', 'تسجيل المرشحين')}</span>
                    <span className="text-sm font-dubai-bold text-blue-700">{event.registeredCandidates.toLocaleString()} / {event.expectedAttendance.toLocaleString()}</span>
                  </div>
                  <Progress value={Math.min((event.registeredCandidates / event.expectedAttendance) * 100, 100)} className="h-3 bg-blue-100" />
                  <p className="text-[10px] text-blue-500 font-dubai-medium mt-1">
                    {Math.round((event.registeredCandidates / event.expectedAttendance) * 100)}% {b('of expected attendance', 'من الحضور المتوقع')}
                  </p>
                </div>

                {/* Outcomes (for completed events) */}
                {event.outcomes && (
                  <div className="mx-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <h3 className={`text-sm font-dubai-bold text-slate-800 mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      {b('Event Outcomes', 'نتائج الفعالية')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: b('Attended', 'الحضور'), value: event.outcomes.candidatesAttended.toLocaleString(), color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
                        { label: b('Interviews', 'المقابلات'), value: event.outcomes.interviewsConducted.toLocaleString(), color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-100' },
                        { label: b('Offers', 'العروض'), value: event.outcomes.offersExtended.toLocaleString(), color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
                        { label: b('Placements', 'التوظيف'), value: event.outcomes.placements.toLocaleString(), color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-100' },
                      ].map((stat, i) => (
                        <div key={i} className={`p-4 rounded-xl ${stat.bg} border ${stat.border} text-center`}>
                          <p className={`text-2xl font-dubai-bold ${stat.color}`}>{stat.value}</p>
                          <p className="text-[10px] text-slate-500 font-dubai-medium mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    {/* Placement rate */}
                    <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-100">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs font-dubai-bold text-green-800">{b('Placement Rate', 'نسبة التوظيف')}</span>
                        <span className="text-sm font-dubai-bold text-green-700">
                          {Math.round((event.outcomes.placements / event.outcomes.candidatesAttended) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Participating Companies */}
                <div className="mx-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <h3 className={`text-sm font-dubai-bold text-slate-800 mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Building2 className="h-4 w-4 text-slate-500" />
                    {b('Participating Companies', 'الشركات المشاركة')} ({event.companies.length})
                  </h3>
                  <div className="space-y-2">
                    {event.companies.map((company, i) => (
                      <div key={i} className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all flex items-center justify-between" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-slate-500" />
                          </div>
                          <div className={isRTL ? 'text-right' : 'text-left'}>
                            <p className="text-sm font-dubai-bold text-slate-800">{isRTL ? company.nameAr : company.name}</p>
                            <p className="text-[10px] text-slate-400 font-dubai-medium">{isRTL ? company.sectorAr : company.sector}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="text-right">
                            <p className="text-xs font-dubai-bold text-slate-700">{company.jobsOffered} {b('jobs', 'وظيفة')}</p>
                            <p className="text-[10px] text-slate-400 font-dubai-medium">{company.emiratizationContribution}% {b('Emiratization', 'توطين')}</p>
                          </div>
                          <div className="w-10">
                            <Progress value={company.emiratizationContribution} className="h-1.5 bg-slate-100" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </CardContent>
            )}
          </Card>
        );
      })}

      {/* ─── Templates Section ─── */}
      <Card className="bg-white border border-dashed border-slate-300">
        <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <div>
              <CardTitle className={`font-dubai-bold text-slate-900 text-base flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Plus className="h-4 w-4 text-emerald-600" />
                {b('Event Templates', 'قوالب الفعاليات')}
              </CardTitle>
              <CardDescription className="font-dubai-medium text-slate-500 text-xs mt-1">
                {b('Ready-made templates to quickly create new career events', 'قوالب جاهزة لإنشاء فعاليات مهنية جديدة بسرعة')}
              </CardDescription>
            </div>
            <Button onClick={() => openCreateDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {b('Create New Event', 'إنشاء فعالية جديدة')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {eventTemplates.map((template, i) => {
              const TemplateIcon = template.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer group text-center"
                  onClick={() => openCreateDialog(template)}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mx-auto mb-3 transition-colors">
                    <TemplateIcon className="h-6 w-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <h4 className="text-sm font-dubai-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                    {isRTL ? template.nameAr : template.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-dubai-medium mt-1">
                    {isRTL ? template.descriptionAr : template.description}
                  </p>
                  <Badge variant="secondary" className="mt-2 text-[10px] font-dubai-medium">
                    {isRTL ? template.typeAr : template.type}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── User-Created Events ─── */}
      {createdEvents.length > 0 && (
        <div className="space-y-4">
          <h3 className={`text-sm font-dubai-bold text-slate-800 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <CalendarCheck className="h-4 w-4 text-emerald-600" />
            {b('Your Custom Events', 'فعالياتك المخصصة')}
          </h3>
          {createdEvents.map((ce) => (
            <Card key={ce.id} className="bg-white border border-emerald-200 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <CardHeader className="pb-3">
                <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <CardTitle className="text-lg font-dubai-bold text-slate-900">{ce.name}</CardTitle>
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-dubai-medium">
                          <Clock className="h-3 w-3 mr-1 inline" />{b('Draft', 'مسودة')}
                        </Badge>
                      </div>
                      {ce.description && <CardDescription className="font-dubai-medium text-slate-500 text-sm">{ce.description}</CardDescription>}
                      <div className={`flex items-center gap-4 mt-2 text-xs text-slate-400 font-dubai-medium flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {ce.date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {ce.date}</span>}
                        {ce.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {ce.venue}</span>}
                        {ce.type && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {ce.type}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-dubai-bold">
                    {ce.expectedJobs} {b('jobs', 'وظيفة')}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Success Toast ─── */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-dubai-medium">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">{b(`"${showSuccess}" created successfully!`, `تم إنشاء "${showSuccess}" بنجاح!`)}</span>
          </div>
        </div>
      )}

      {/* ─── Create Event Dialog ─── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-dubai-bold text-slate-900 text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              {b('Create New Career Event', 'إنشاء فعالية مهنية جديدة')}
            </DialogTitle>
            <DialogDescription className="font-dubai-medium text-slate-500 text-sm">
              {b('Define the details for a new career event. Companies and candidates can be added after creation.', 'حدد تفاصيل فعالية مهنية جديدة. يمكن إضافة الشركات والمرشحين بعد الإنشاء.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Event Name *', 'اسم الفعالية *')}</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={b('e.g. EHRDC Open Day — March', 'مثال: يوم مفتوح — مارس')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300" />
              </div>
              <div>
                <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Event Type', 'نوع الفعالية')}</label>
                <input type="text" value={formData.type} onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  placeholder={b('e.g. Career Fair', 'مثال: معرض توظيف')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Date', 'التاريخ')}</label>
                <input type="text" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  placeholder={b('e.g. Mar 15–16, 2026', 'مثال: 15–16 مارس 2026')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300" />
              </div>
              <div>
                <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Venue', 'المكان')}</label>
                <input type="text" value={formData.venue} onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder={b('e.g. DWTC, Dubai', 'مثال: مركز دبي التجاري العالمي')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Organizer', 'المنظم')}</label>
                <input type="text" value={formData.organizer} onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                  placeholder={b('e.g. EHRDC / MoHRE', 'مثال: مجلس تنمية الموارد البشرية')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300" />
              </div>
              <div>
                <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Expected Job Openings', 'الوظائف المتوقعة')}</label>
                <input type="number" value={formData.expectedJobs} onChange={(e) => setFormData(prev => ({ ...prev, expectedJobs: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
            </div>
            <div>
              <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Description', 'الوصف')}</label>
              <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={b('Brief description of the event...', 'وصف مختصر للفعالية...')} rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300 resize-none" />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="font-dubai-medium">
              {b('Cancel', 'إلغاء')}
            </Button>
            <Button onClick={handleCreateEvent} disabled={!formData.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium flex items-center gap-2 disabled:opacity-50">
              <Plus className="h-4 w-4" />
              {b('Create Event', 'إنشاء الفعالية')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CareerEventsTab;
