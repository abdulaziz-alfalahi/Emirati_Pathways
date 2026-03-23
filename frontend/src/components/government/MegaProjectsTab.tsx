import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Landmark,
  Users,
  Target,
  Plane,
  Building2,
  Waves,
  Globe,
  ChevronDown,
  ChevronUp,
  Search,
  Clock,
  MapPin,
  Banknote,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Cpu,
  HardHat,
  Wrench,
  Plus,
  Zap,
  HeartPulse,
  Building,
  ArrowRight,
  CheckCircle,
  Star,
  X,
  Sparkles,
  FileEdit
} from 'lucide-react';

interface MegaProjectsTabProps {
  isRTL: boolean;
  b: (en: string, ar: string) => string;
}

// ── Data Types ─────────────────────────────────────────────────────
interface TalentProfile {
  role: string;
  roleAr: string;
  skills: string[];
  headcount: number;
  urgency: 'critical' | 'high' | 'medium';
  emiratizationTarget: number;
}

interface ProjectStage {
  name: string;
  nameAr: string;
  status: 'completed' | 'active' | 'upcoming';
  talentNeeded: number;
  timeline: string;
  timelineAr: string;
}

interface MegaProject {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  accentColor: string;
  accentBg: string;
  status: 'active' | 'planning' | 'phase_1';
  budget: string;
  budgetAr: string;
  timeline: string;
  timelineAr: string;
  location: string;
  locationAr: string;
  description: string;
  descriptionAr: string;
  initiative: string;
  initiativeAr: string;
  totalJobs: number;
  emiratizationTarget: number;
  currentEmiratization: number;
  stages: ProjectStage[];
  talentProfiles: TalentProfile[];
}

interface ProjectTemplate {
  name: string;
  nameAr: string;
  icon: React.ElementType;
  description: string;
  descriptionAr: string;
  sector: string;
  sectorAr: string;
}

// ── Mock Data ──────────────────────────────────────────────────────
const megaProjects: MegaProject[] = [
  {
    id: 'al-maktoum-airport',
    name: 'Al Maktoum International Airport',
    nameAr: 'مطار آل مكتوم الدولي',
    icon: Plane,
    gradient: 'from-sky-500 to-blue-600',
    borderColor: 'border-sky-200',
    accentColor: 'text-sky-700',
    accentBg: 'bg-sky-50',
    status: 'active',
    budget: 'AED 128 Billion ($35B)',
    budgetAr: '128 مليار درهم (35 مليار دولار)',
    timeline: '2024 – 2034 (Phase 1)',
    timelineAr: '2024 – 2034 (المرحلة الأولى)',
    location: 'Dubai South, Jebel Ali',
    locationAr: 'دبي الجنوب، جبل علي',
    description: "World's largest airport — 260M passengers/year, 5 runways, 400 gates. Cornerstone of Dubai's aviation future.",
    descriptionAr: 'أكبر مطار في العالم — 260 مليون مسافر/سنة، 5 مدارج، 400 بوابة. حجر الزاوية لمستقبل الطيران في دبي.',
    initiative: 'Aviation Talents 33',
    initiativeAr: 'مواهب الطيران 33',
    totalJobs: 15000,
    emiratizationTarget: 45,
    currentEmiratization: 28,
    stages: [
      { name: 'Terminal Design & Planning', nameAr: 'تصميم وتخطيط المبنى', status: 'completed', talentNeeded: 1200, timeline: '2023–2024', timelineAr: '2023–2024' },
      { name: 'Foundation & Runway Construction', nameAr: 'بناء الأساسات والمدارج', status: 'active', talentNeeded: 4500, timeline: '2024–2028', timelineAr: '2024–2028' },
      { name: 'Systems Integration & Technology', nameAr: 'تكامل الأنظمة والتكنولوجيا', status: 'upcoming', talentNeeded: 3800, timeline: '2028–2032', timelineAr: '2028–2032' },
      { name: 'Operations & Workforce Ramp-up', nameAr: 'العمليات وتوسيع القوى العاملة', status: 'upcoming', talentNeeded: 5500, timeline: '2032–2034', timelineAr: '2032–2034' },
    ],
    talentProfiles: [
      { role: 'Aviation Engineers', roleAr: 'مهندسو طيران', skills: ['Airport Systems', 'Air Traffic Management', 'Safety Compliance', 'ICAO Standards'], headcount: 3200, urgency: 'critical', emiratizationTarget: 50 },
      { role: 'Construction Project Managers', roleAr: 'مديرو مشاريع البناء', skills: ['Mega-project Management', 'BIM', 'HSE Compliance', 'Stakeholder Management'], headcount: 800, urgency: 'critical', emiratizationTarget: 60 },
      { role: 'Smart Airport Technologists', roleAr: 'تقنيو المطارات الذكية', skills: ['AI/ML', 'IoT Sensors', 'Biometric Systems', 'Cloud Infrastructure'], headcount: 2400, urgency: 'high', emiratizationTarget: 40 },
      { role: 'Aviation Operations Specialists', roleAr: 'أخصائيو عمليات الطيران', skills: ['Ground Handling', 'Flight Operations', 'Passenger Experience', 'Crisis Management'], headcount: 5000, urgency: 'high', emiratizationTarget: 45 },
      { role: 'Sustainability & Green Airport Experts', roleAr: 'خبراء الاستدامة والمطارات الخضراء', skills: ['Renewable Energy', 'Carbon Neutrality', 'LEED Certification', 'Waste Management'], headcount: 600, urgency: 'medium', emiratizationTarget: 55 },
    ]
  },
  {
    id: 'difc-2',
    name: 'DIFC 2.0 — Zabeel District',
    nameAr: 'مركز دبي المالي الدولي 2.0 — حي زعبيل',
    icon: Building2,
    gradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-200',
    accentColor: 'text-amber-700',
    accentBg: 'bg-amber-50',
    status: 'phase_1',
    budget: 'AED 100+ Billion ($27.2B)',
    budgetAr: 'أكثر من 100 مليار درهم (27.2 مليار دولار)',
    timeline: '2024 – 2040',
    timelineAr: '2024 – 2040',
    location: 'DIFC, Trade Centre Area',
    locationAr: 'مركز دبي المالي الدولي، منطقة المركز التجاري',
    description: 'Tripling DIFC — 13M sqft of new space, world\'s largest innovation hub, first purpose-built AI Campus for 6,000+ businesses.',
    descriptionAr: 'مضاعفة حجم المركز ثلاث مرات — 13 مليون قدم مربع من المساحات الجديدة، أكبر مركز ابتكار في العالم، أول حرم جامعي للذكاء الاصطناعي مصمم خصيصًا.',
    initiative: 'DIFC Innovation Hub & AI Campus',
    initiativeAr: 'مركز الابتكار وحرم الذكاء الاصطناعي',
    totalJobs: 125000,
    emiratizationTarget: 35,
    currentEmiratization: 22,
    stages: [
      { name: 'Infrastructure & Foundation', nameAr: 'البنية التحتية والأساسات', status: 'active', talentNeeded: 8000, timeline: '2024–2028', timelineAr: '2024–2028' },
      { name: 'Core Commercial & Residential Build', nameAr: 'بناء الأبراج التجارية والسكنية', status: 'upcoming', talentNeeded: 15000, timeline: '2028–2032', timelineAr: '2028–2032' },
      { name: 'AI Campus & Innovation Hub Launch', nameAr: 'إطلاق حرم الذكاء الاصطناعي ومركز الابتكار', status: 'upcoming', talentNeeded: 30000, timeline: '2030–2035', timelineAr: '2030–2035' },
      { name: 'Full District Operations', nameAr: 'تشغيل الحي بالكامل', status: 'upcoming', talentNeeded: 72000, timeline: '2035–2040', timelineAr: '2035–2040' },
    ],
    talentProfiles: [
      { role: 'FinTech & Financial Services', roleAr: 'التكنولوجيا المالية والخدمات المالية', skills: ['Blockchain', 'Digital Banking', 'RegTech', 'Risk Analytics'], headcount: 35000, urgency: 'high', emiratizationTarget: 30 },
      { role: 'AI & Data Scientists', roleAr: 'علماء الذكاء الاصطناعي والبيانات', skills: ['Machine Learning', 'NLP', 'Computer Vision', 'MLOps'], headcount: 12000, urgency: 'critical', emiratizationTarget: 35 },
      { role: 'Sustainable Architecture & Design', roleAr: 'الهندسة المعمارية المستدامة والتصميم', skills: ['Green Building', 'Smart City Design', 'LEED Platinum', 'Urban Planning'], headcount: 3000, urgency: 'high', emiratizationTarget: 45 },
      { role: 'Legal & Compliance Professionals', roleAr: 'المهنيون القانونيون والامتثال', skills: ['International Law', 'Financial Regulation', 'AML/KYC', 'IP Law'], headcount: 8000, urgency: 'medium', emiratizationTarget: 40 },
    ]
  },
  {
    id: 'palm-jebel-ali',
    name: 'Palm Jebel Ali',
    nameAr: 'نخلة جبل علي',
    icon: Waves,
    gradient: 'from-teal-500 to-emerald-600',
    borderColor: 'border-teal-200',
    accentColor: 'text-teal-700',
    accentBg: 'bg-teal-50',
    status: 'active',
    budget: 'AED 20+ Billion',
    budgetAr: 'أكثر من 20 مليار درهم',
    timeline: '2023 – 2029',
    timelineAr: '2023 – 2029',
    location: 'Jebel Ali Waterfront',
    locationAr: 'واجهة جبل علي البحرية',
    description: 'Twice the size of Palm Jumeirah — 13.4 km², 16 fronds, 110 km of coastline, 35,000 families, 80+ hotels. Eco-conscious, future-ready island community.',
    descriptionAr: 'ضعف حجم نخلة الجميرا — 13.4 كم²، 16 سعفة، 110 كم من الساحل، 35,000 عائلة، 80+ فندق. مجتمع جزيري مستدام ومستقبلي.',
    initiative: 'Nakheel Waterfront Development Program',
    initiativeAr: 'برنامج نخيل لتطوير الواجهات البحرية',
    totalJobs: 28000,
    emiratizationTarget: 40,
    currentEmiratization: 18,
    stages: [
      { name: 'Marine Works & Land Reclamation', nameAr: 'الأعمال البحرية واستصلاح الأراضي', status: 'completed', talentNeeded: 3000, timeline: '2023–2025', timelineAr: '2023–2025' },
      { name: 'Roads, Utilities & Infrastructure', nameAr: 'الطرق والمرافق والبنية التحتية', status: 'active', talentNeeded: 5500, timeline: '2024–2026', timelineAr: '2024–2026' },
      { name: 'Villa & Resort Construction', nameAr: 'بناء الفلل والمنتجعات', status: 'upcoming', talentNeeded: 8000, timeline: '2025–2028', timelineAr: '2025–2028' },
      { name: 'Hospitality & Community Operations', nameAr: 'عمليات الضيافة والمجتمع', status: 'upcoming', talentNeeded: 11500, timeline: '2027–2029', timelineAr: '2027–2029' },
    ],
    talentProfiles: [
      { role: 'Marine & Coastal Engineers', roleAr: 'مهندسو البحرية والسواحل', skills: ['Dredging', 'Breakwater Design', 'Environmental Impact', 'Hydrology'], headcount: 2500, urgency: 'critical', emiratizationTarget: 45 },
      { role: 'Luxury Hospitality Managers', roleAr: 'مديرو الضيافة الفاخرة', skills: ['5-Star Operations', 'Guest Experience', 'F&B Management', 'Revenue Management'], headcount: 8000, urgency: 'high', emiratizationTarget: 50 },
      { role: 'Real Estate & Urban Planners', roleAr: 'المخططون العقاريون والعمرانيون', skills: ['Master Planning', 'Zoning', 'Community Design', 'Smart Infrastructure'], headcount: 1500, urgency: 'high', emiratizationTarget: 40 },
      { role: 'Sustainability & Environmental Specialists', roleAr: 'أخصائيو الاستدامة والبيئة', skills: ['Marine Conservation', 'Renewable Energy', 'Waste Reduction', 'ESG Reporting'], headcount: 800, urgency: 'medium', emiratizationTarget: 55 },
    ]
  },
  {
    id: 'dubai-south',
    name: 'Dubai South — Integrated City',
    nameAr: 'دبي الجنوب — مدينة متكاملة',
    icon: Globe,
    gradient: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-200',
    accentColor: 'text-violet-700',
    accentBg: 'bg-violet-50',
    status: 'active',
    budget: 'AED 128+ Billion (linked to DWC)',
    budgetAr: 'أكثر من 128 مليار درهم (مرتبط بمطار آل مكتوم)',
    timeline: '2006 – 2040',
    timelineAr: '2006 – 2040',
    location: 'Jebel Ali, near Expo City',
    locationAr: 'جبل علي، بالقرب من مدينة إكسبو',
    description: 'Self-sustaining city for 1M residents. 500,000 jobs across aviation, logistics, commercial, and residential zones. Multi-modal transport hub with Etihad Rail.',
    descriptionAr: 'مدينة مستدامة ذاتيًا لمليون ساكن. 500,000 وظيفة في الطيران واللوجستيات والتجارة والسكن. محور نقل متعدد الوسائط مع الاتحاد للقطارات.',
    initiative: 'Dubai 2040 Urban Master Plan',
    initiativeAr: 'خطة دبي الحضرية الرئيسية 2040',
    totalJobs: 500000,
    emiratizationTarget: 30,
    currentEmiratization: 15,
    stages: [
      { name: 'Urban Master Planning & Zoning', nameAr: 'التخطيط العمراني والتقسيم', status: 'completed', talentNeeded: 2000, timeline: '2006–2020', timelineAr: '2006–2020' },
      { name: 'Logistics & Aviation Hub Buildout', nameAr: 'بناء محور اللوجستيات والطيران', status: 'active', talentNeeded: 45000, timeline: '2020–2030', timelineAr: '2020–2030' },
      { name: 'Residential Communities & Retail', nameAr: 'المجتمعات السكنية والتجارية', status: 'active', talentNeeded: 60000, timeline: '2024–2035', timelineAr: '2024–2035' },
      { name: 'Smart City & Full Operations', nameAr: 'المدينة الذكية والتشغيل الكامل', status: 'upcoming', talentNeeded: 393000, timeline: '2030–2040', timelineAr: '2030–2040' },
    ],
    talentProfiles: [
      { role: 'Logistics & Supply Chain Experts', roleAr: 'خبراء اللوجستيات وسلسلة الإمداد', skills: ['Warehouse Automation', 'Fleet Management', 'Last-Mile Delivery', 'Trade Compliance'], headcount: 45000, urgency: 'critical', emiratizationTarget: 30 },
      { role: 'Smart City Engineers', roleAr: 'مهندسو المدن الذكية', skills: ['IoT Infrastructure', '5G Networks', 'Digital Twin', 'Autonomous Transport'], headcount: 12000, urgency: 'high', emiratizationTarget: 40 },
      { role: 'Community & Facility Managers', roleAr: 'مديرو المجتمعات والمرافق', skills: ['Property Management', 'Community Engagement', 'Safety & Security', 'Amenity Operations'], headcount: 25000, urgency: 'high', emiratizationTarget: 45 },
      { role: 'Transport & Mobility Planners', roleAr: 'مخططو النقل والتنقل', skills: ['Multi-modal Transport', 'Rail Systems', 'Traffic Modeling', 'EV Infrastructure'], headcount: 5000, urgency: 'medium', emiratizationTarget: 35 },
    ]
  }
];

const projectTemplates: ProjectTemplate[] = [
  {
    name: 'Future Urban Development',
    nameAr: 'تطوير حضري مستقبلي',
    icon: Building,
    description: 'Template for residential/commercial mega-developments',
    descriptionAr: 'قالب للمشاريع الضخمة السكنية والتجارية',
    sector: 'Real Estate & Infrastructure',
    sectorAr: 'العقارات والبنية التحتية'
  },
  {
    name: 'Future Energy Initiative',
    nameAr: 'مبادرة الطاقة المستقبلية',
    icon: Zap,
    description: 'Template for clean energy and sustainability projects',
    descriptionAr: 'قالب لمشاريع الطاقة النظيفة والاستدامة',
    sector: 'Energy & Sustainability',
    sectorAr: 'الطاقة والاستدامة'
  },
  {
    name: 'Future Healthcare Campus',
    nameAr: 'حرم الرعاية الصحية المستقبلي',
    icon: HeartPulse,
    description: 'Template for healthcare and medical city developments',
    descriptionAr: 'قالب لتطوير مدن الرعاية الصحية والطبية',
    sector: 'Healthcare & Life Sciences',
    sectorAr: 'الرعاية الصحية وعلوم الحياة'
  }
];

// ── Helpers ─────────────────────────────────────────────────────────
const getStatusBadge = (status: string, b: (en: string, ar: string) => string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] font-dubai-medium"><CheckCircle className="h-3 w-3 mr-1 inline" />{b('Active', 'نشط')}</Badge>;
    case 'phase_1':
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-dubai-medium"><Clock className="h-3 w-3 mr-1 inline" />{b('Phase 1', 'المرحلة 1')}</Badge>;
    case 'planning':
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-dubai-medium"><Clock className="h-3 w-3 mr-1 inline" />{b('Planning', 'تخطيط')}</Badge>;
    default:
      return null;
  }
};

const getUrgencyBadge = (urgency: string, b: (en: string, ar: string) => string) => {
  switch (urgency) {
    case 'critical':
      return <Badge className="bg-red-50 text-red-600 border-red-200 text-[9px] font-dubai-medium">{b('Critical', 'حرج')}</Badge>;
    case 'high':
      return <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[9px] font-dubai-medium">{b('High', 'عالي')}</Badge>;
    case 'medium':
      return <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[9px] font-dubai-medium">{b('Medium', 'متوسط')}</Badge>;
    default:
      return null;
  }
};

const getStageIcon = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'active': return 'bg-blue-500 animate-pulse';
    case 'upcoming': return 'bg-slate-300';
    default: return 'bg-slate-200';
  }
};

// ── Component ──────────────────────────────────────────────────────
const MegaProjectsTab: React.FC<MegaProjectsTabProps> = ({ isRTL, b }) => {
  const [expandedProject, setExpandedProject] = useState<string | null>('al-maktoum-airport');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createdProjects, setCreatedProjects] = useState<Array<{id: string; name: string; sector: string; budget: string; timeline: string; location: string; description: string; emiratizationTarget: number; stages: string[]; createdAt: string}>>([]);
  const [formData, setFormData] = useState({
    name: '', sector: '', budget: '', timeline: '', location: '', description: '', emiratizationTarget: 30,
    stage1: 'Planning & Design', stage2: 'Core Infrastructure', stage3: 'Construction & Build', stage4: 'Operations & Handover'
  });
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const openCreateDialog = (template?: ProjectTemplate) => {
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: isRTL ? template.nameAr : template.name,
        sector: isRTL ? template.sectorAr : template.sector,
        description: isRTL ? template.descriptionAr : template.description,
      }));
    } else {
      setFormData({ name: '', sector: '', budget: '', timeline: '', location: '', description: '', emiratizationTarget: 30, stage1: 'Planning & Design', stage2: 'Core Infrastructure', stage3: 'Construction & Build', stage4: 'Operations & Handover' });
    }
    setShowCreateDialog(true);
  };

  const handleCreateProject = () => {
    if (!formData.name.trim()) return;
    const newProject = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      sector: formData.sector,
      budget: formData.budget,
      timeline: formData.timeline,
      location: formData.location,
      description: formData.description,
      emiratizationTarget: formData.emiratizationTarget,
      stages: [formData.stage1, formData.stage2, formData.stage3, formData.stage4].filter(s => s.trim()),
      createdAt: new Date().toLocaleDateString(),
    };
    setCreatedProjects(prev => [newProject, ...prev]);
    setShowCreateDialog(false);
    setShowSuccess(formData.name);
    setTimeout(() => setShowSuccess(null), 4000);
    setFormData({ name: '', sector: '', budget: '', timeline: '', location: '', description: '', emiratizationTarget: 30, stage1: 'Planning & Design', stage2: 'Core Infrastructure', stage3: 'Construction & Build', stage4: 'Operations & Handover' });
  };

  const allProjects = megaProjects;
  const totalTalentDemand = allProjects.reduce((sum, p) => sum + p.totalJobs, 0);
  const avgEmiratizationTarget = Math.round(allProjects.reduce((sum, p) => sum + p.emiratizationTarget, 0) / allProjects.length);
  const activeSearches = allProjects.reduce((sum, p) => sum + p.talentProfiles.filter(tp => tp.urgency === 'critical').length, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: b('Mega Projects', 'المشاريع الكبرى'), value: megaProjects.length, icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', sub: b('Active & In Progress', 'نشطة وقيد التنفيذ') },
          { label: b('Total Talent Demand', 'إجمالي الطلب على المواهب'), value: totalTalentDemand.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', sub: b('Across all projects', 'عبر جميع المشاريع') },
          { label: b('Avg. Emiratization Target', 'متوسط هدف التوطين'), value: `${avgEmiratizationTarget}%`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', sub: b('National workforce goal', 'هدف القوى العاملة الوطنية') },
          { label: b('Critical Talent Searches', 'بحث المواهب الحرجة'), value: activeSearches, icon: Search, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', sub: b('Urgent roles to fill', 'أدوار عاجلة للتوظيف') },
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

      {/* ─── Project Cards ─── */}
      {megaProjects.map((project) => {
        const isExpanded = expandedProject === project.id;
        const ProjectIcon = project.icon;

        return (
          <Card key={project.id} className={`bg-white border ${project.borderColor} overflow-hidden transition-all duration-300 hover:shadow-lg`}>

            {/* Project Header */}
            <div
              className="cursor-pointer"
              onClick={() => setExpandedProject(isExpanded ? null : project.id)}
            >
              <div className={`h-2 bg-gradient-to-r ${project.gradient}`} />
              <CardHeader className="pb-3">
                <div className={`flex items-start justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${project.gradient} text-white shadow-lg shadow-${project.gradient.split('-')[1]}-500/20`}>
                      <ProjectIcon className="h-6 w-6" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <CardTitle className="text-lg font-dubai-bold text-slate-900">
                          {isRTL ? project.nameAr : project.name}
                        </CardTitle>
                        {getStatusBadge(project.status, b)}
                      </div>
                      <CardDescription className="font-dubai-medium text-slate-500 text-sm max-w-2xl">
                        {isRTL ? project.descriptionAr : project.description}
                      </CardDescription>
                      <div className={`flex items-center gap-4 mt-2 text-xs text-slate-400 font-dubai-medium flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="flex items-center gap-1"><Banknote className="h-3 w-3" /> {isRTL ? project.budgetAr : project.budget}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {isRTL ? project.timelineAr : project.timeline}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {isRTL ? project.locationAr : project.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {/* KPI pills */}
                    <div className="hidden md:flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-lg ${project.accentBg} ${project.accentColor} text-xs font-dubai-bold`}>
                        {project.totalJobs.toLocaleString()} {b('jobs', 'وظيفة')}
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-dubai-bold">
                        {project.emiratizationTarget}% {b('target', 'هدف')}
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
              <CardContent className="pt-0 pb-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">

                {/* Initiative Banner */}
                <div className={`mx-1 p-3 rounded-xl ${project.accentBg} border ${project.borderColor}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Star className={`h-4 w-4 ${project.accentColor}`} />
                    <span className={`text-sm font-dubai-bold ${project.accentColor}`}>
                      {b('Linked Initiative', 'المبادرة المرتبطة')}: {isRTL ? project.initiativeAr : project.initiative}
                    </span>
                  </div>
                </div>

                {/* Emiratization Progress */}
                <div className="mx-1 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-dubai-bold text-emerald-800">{b('Emiratization Progress', 'تقدم التوطين')}</span>
                    <span className="text-sm font-dubai-bold text-emerald-700">{project.currentEmiratization}% / {project.emiratizationTarget}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={project.currentEmiratization} className="h-3 bg-emerald-100" />
                    <div
                      className="absolute top-0 h-3 border-r-2 border-dashed border-emerald-600"
                      style={{ left: `${project.emiratizationTarget}%` }}
                      title={`${b('Target', 'الهدف')}: ${project.emiratizationTarget}%`}
                    />
                  </div>
                  <p className="text-[10px] text-emerald-600 font-dubai-medium mt-1">
                    {b(`Gap: ${project.emiratizationTarget - project.currentEmiratization}% to reach target`, `الفجوة: ${project.emiratizationTarget - project.currentEmiratization}% للوصول إلى الهدف`)}
                  </p>
                </div>

                {/* Project Stages Timeline */}
                <div className="mx-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <h3 className={`text-sm font-dubai-bold text-slate-800 mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Clock className="h-4 w-4 text-slate-500" />
                    {b('Project Stages & Talent Pipeline', 'مراحل المشروع وخط أنابيب المواهب')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {project.stages.map((stage, i) => (
                      <div key={i} className={`relative p-4 rounded-xl border transition-all ${
                        stage.status === 'active'
                          ? 'border-blue-200 bg-blue-50/50 shadow-sm'
                          : stage.status === 'completed'
                            ? 'border-green-200 bg-green-50/30'
                            : 'border-slate-100 bg-slate-50/30'
                      }`}>
                        <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStageIcon(stage.status)}`} />
                          <span className="text-xs font-dubai-bold text-slate-700">{isRTL ? stage.nameAr : stage.name}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-dubai-medium flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> {isRTL ? stage.timelineAr : stage.timeline}
                          </p>
                          <p className="text-[10px] text-slate-400 font-dubai-medium flex items-center gap-1">
                            <Users className="h-2.5 w-2.5" /> {stage.talentNeeded.toLocaleString()} {b('roles', 'وظيفة')}
                          </p>
                        </div>
                        {stage.status === 'active' && (
                          <div className="absolute top-2 right-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Required Talent Profiles */}
                <div className="mx-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <h3 className={`text-sm font-dubai-bold text-slate-800 mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Briefcase className="h-4 w-4 text-slate-500" />
                    {b('Required Talent Profiles', 'ملفات المواهب المطلوبة')}
                  </h3>
                  <div className="space-y-3">
                    {project.talentProfiles.map((profile, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
                        <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h4 className="text-sm font-dubai-bold text-slate-800">{isRTL ? profile.roleAr : profile.role}</h4>
                            {getUrgencyBadge(profile.urgency, b)}
                          </div>
                          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs text-slate-500 font-dubai-medium">
                              {profile.headcount.toLocaleString()} {b('positions', 'وظيفة')} · {profile.emiratizationTarget}% {b('Emirati', 'توطين')}
                            </span>
                            <Button
                              size="sm"
                              className="h-7 px-3 text-xs font-dubai-medium bg-emerald-600 hover:bg-emerald-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Search className="h-3 w-3 mr-1" />
                              {b('Find Candidates', 'ابحث عن مرشحين')}
                            </Button>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {profile.skills.map((skill, si) => (
                            <Badge key={si} variant="secondary" className="text-[10px] font-dubai-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                              {skill}
                            </Badge>
                          ))}
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
                {b('Mega Project Templates', 'قوالب المشاريع الكبرى')}
              </CardTitle>
              <CardDescription className="font-dubai-medium text-slate-500 text-xs mt-1">
                {b('Ready-made templates to quickly onboard new mega projects', 'قوالب جاهزة لإدراج مشاريع كبرى جديدة بسرعة')}
              </CardDescription>
            </div>
            <Button onClick={() => openCreateDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {b('Create New Project', 'إنشاء مشروع جديد')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {projectTemplates.map((template, i) => {
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
                    {isRTL ? template.sectorAr : template.sector}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── User-Created Projects ─── */}
      {createdProjects.length > 0 && (
        <div className="space-y-4">
          <h3 className={`text-sm font-dubai-bold text-slate-800 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <FileEdit className="h-4 w-4 text-emerald-600" />
            {b('Your Custom Projects', 'مشاريعك المخصصة')}
          </h3>
          {createdProjects.map((cp) => (
            <Card key={cp.id} className="bg-white border border-emerald-200 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <CardHeader className="pb-3">
                <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <CardTitle className="text-lg font-dubai-bold text-slate-900">{cp.name}</CardTitle>
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-dubai-medium">
                          <Clock className="h-3 w-3 mr-1 inline" />{b('Draft', 'مسودة')}
                        </Badge>
                      </div>
                      {cp.description && <CardDescription className="font-dubai-medium text-slate-500 text-sm">{cp.description}</CardDescription>}
                      <div className={`flex items-center gap-4 mt-2 text-xs text-slate-400 font-dubai-medium flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {cp.budget && <span className="flex items-center gap-1"><Banknote className="h-3 w-3" /> {cp.budget}</span>}
                        {cp.timeline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {cp.timeline}</span>}
                        {cp.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {cp.location}</span>}
                        {cp.sector && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {cp.sector}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-dubai-bold">
                      {cp.emiratizationTarget}% {b('target', 'هدف')}
                    </div>
                  </div>
                </div>
              </CardHeader>
              {cp.stages.length > 0 && (
                <CardContent className="pt-0 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    {cp.stages.map((stage, si) => (
                      <div key={si} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-slate-300" />
                          <span className="text-xs font-dubai-medium text-slate-600">{stage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
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

      {/* ─── Create Mega Project Dialog ─── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-dubai-bold text-slate-900 text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              {b('Create New Mega Project', 'إنشاء مشروع كبير جديد')}
            </DialogTitle>
            <DialogDescription className="font-dubai-medium text-slate-500 text-sm">
              {b('Define the details for a new mega project. You can refine talent profiles and stages after creation.', 'حدد تفاصيل مشروع كبير جديد. يمكنك تحسين ملفات المواهب والمراحل بعد الإنشاء.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* Row 1: Name + Sector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Project Name *', 'اسم المشروع *')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={b('e.g. Dubai Maritime City', 'مثال: مدينة دبي البحرية')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Sector', 'القطاع')}</label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                  placeholder={b('e.g. Maritime & Logistics', 'مثال: البحرية واللوجستيات')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Row 2: Budget + Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Est. Budget', 'الميزانية التقديرية')}</label>
                <input
                  type="text"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder={b('e.g. AED 50 Billion', 'مثال: 50 مليار درهم')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Timeline', 'الجدول الزمني')}</label>
                <input
                  type="text"
                  value={formData.timeline}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                  placeholder={b('e.g. 2025 – 2035', 'مثال: 2025 – 2035')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Row 3: Location + Emiratization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Location', 'الموقع')}</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder={b('e.g. Dubai Waterfront', 'مثال: واجهة دبي البحرية')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Emiratization Target (%)', 'هدف التوطين (%)')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.emiratizationTarget}
                    onChange={(e) => setFormData(prev => ({ ...prev, emiratizationTarget: parseInt(e.target.value) }))}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <span className="text-sm font-dubai-bold text-emerald-700 w-10 text-center">{formData.emiratizationTarget}%</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Description', 'الوصف')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={b('Brief description of the mega project...', 'وصف مختصر للمشروع الكبير...')}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300 resize-none"
              />
            </div>

            {/* Project Stages */}
            <div>
              <label className="text-xs font-dubai-bold text-slate-700 mb-1.5 block">{b('Project Stages', 'مراحل المشروع')}</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {([['stage1', 1], ['stage2', 2], ['stage3', 3], ['stage4', 4]] as const).map(([key, num]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-dubai-bold shrink-0">{num}</div>
                    <input
                      type="text"
                      value={formData[key]}
                      onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-dubai-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="font-dubai-medium">
              {b('Cancel', 'إلغاء')}
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!formData.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {b('Create Project', 'إنشاء المشروع')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default MegaProjectsTab;
