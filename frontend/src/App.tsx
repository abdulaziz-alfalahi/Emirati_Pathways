import * as React from 'react';
import { GROWTH_OPERATOR_ROLES } from '@/config/routeAccess';
import EventLiveBoard from '@/pages/events/EventLiveBoard';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from '@/context/AuthContext';
// import { MockAuthProvider } from '@/context/MockAuthContext';
import { LanguageProvider } from './context/EnhancedLanguageContext';
import { useLanguage } from './context/EnhancedLanguageContext';
import { DirectionProvider } from '@radix-ui/react-direction';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as HotToaster } from 'react-hot-toast';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import './i18n/config';
import './styles/enhanced-rtl.css';
import './styles/content-pages.css';
import './styles/accessibility.css';
import { SkipNavigation } from '@/components/accessibility/SkipNavigation';

// Development components

// Loading component
import DashboardLoading from '@/components/dashboard/DashboardLoading';
// Shadcn Toaster
import { Toaster } from '@/components/ui/toaster';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';
import { SupportChatProvider } from '@/context/SupportChatContext';
import SupportChatWidget from '@/components/support/SupportChatWidget';

// Auth Pages (not lazy loaded for faster initial access)
// import AuthPage from '@/pages/auth'; 
// import AuthPage from './pages/auth';
// import MockLogin from '@/pages/auth/MockLogin'; 
const EnhancedAuthPage = lazy(() => import('@/pages/auth/EnhancedAuth'));
const UAEPassCallback = lazy(() => import('@/pages/auth/UAEPassCallback'));
const VerifyJob = lazy(() => import('@/pages/public/VerifyJob').then(m => ({ default: m.VerifyJob })));
const CompanyOnboardingWizard = lazy(() => import('@/pages/public/CompanyOnboardingWizard'));
const JoinTeamPage = lazy(() => import('@/pages/public/JoinTeamPage'));
const JoinStaffPage = lazy(() => import('@/pages/public/JoinStaffPage'));
import MaintenanceGate from '@/components/common/MaintenanceGate';
const SeekerOnboardingWizard = lazy(() => import('@/pages/public/SeekerOnboardingWizard'));

// Lazy loaded components for better performance
const CandidateDashboard = lazy(() => import('@/pages/CandidateDashboard'));
const StudentDashboard = lazy(() => import('@/pages/StudentDashboard'));
const HRDashboard = lazy(() => import('@/pages/HRDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const GrowthOperatorDashboard = lazy(() => import('@/pages/GrowthOperatorDashboard'));
const ParentDashboardPage = lazy(() => import('@/pages/ParentDashboardPage'));
// EmployerDashboard removed — consolidated into HR Manager
const EducatorDashboard = lazy(() => import('@/pages/EducatorDashboard'));
const MentorDashboard = lazy(() => import('@/pages/MentorDashboard'));
const RecruiterDashboard = lazy(() => import('@/pages/RecruiterDashboard'));
const RecruiterJobs = lazy(() => import('@/pages/recruiter/Jobs'));
const ActiveVacancies = lazy(() => import('@/pages/recruiter/ActiveVacancies'));
const RecruiterCandidates = lazy(() => import('@/pages/recruiter/Candidates'));

// Auth Components
// const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
// const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const WelcomePage = lazy(() => import('@/pages/onboarding/WelcomePage'));
const VideoInterviewPage = lazy(() => import('@/pages/recruiter/VideoInterviewPage'));
const InterviewAnalyticsPage = lazy(() => import('@/pages/recruiter/InterviewAnalyticsPage'));
const RecruiterOffers = lazy(() => import('@/pages/recruiter/Offers'));
const GuestLobby = lazy(() => import('@/pages/public/GuestLobby'));


const RecruiterApprovals = lazy(() => import('@/pages/recruiter/Approvals'));
const RecruiterDistribution = lazy(() => import('@/pages/recruiter/Distribution'));

const JobDescriptionWizardPage = lazy(() => import('@/pages/recruiter/JobDescriptionWizardPage'));
const JobDetailsPage = lazy(() => import('@/pages/recruiter/JobDetails'));
const InterviewSchedulerPage = lazy(() => import('@/pages/recruiter/InterviewSchedulerPage'));
const JDTemplatesPage = lazy(() => import('@/pages/recruiter/JDTemplates'));
const BatchUploadPage = lazy(() => import('@/pages/recruiter/BatchUpload'));
const RecruiterAnalyticsPage = lazy(() => import('@/pages/recruiter/Analytics'));
const InterviewDetailsPage = lazy(() => import('@/pages/recruiter/InterviewDetails'));
const ShortlistPage = lazy(() => import('@/pages/recruiter/ShortlistPage'));
const CandidateProfilePage = lazy(() => import('@/pages/CandidateProfilePage'));
const AssessorDashboard = lazy(() => import('@/pages/AssessorDashboard'));
const GovernmentDashboard = lazy(() => import('@/pages/GovernmentDashboard'));
const ProfileStudioPage = lazy(() => import('@/pages/candidate/profile-studio/ProfileStudioPage').then(module => ({ default: module.ProfileStudioPage })));

// Resume Builder removed — consolidated into CV Builder
// const EnhancedCVBuilderPage = lazy(() => import('@/pages/cv-builder/EnhancedCVBuilderPage'));
// const SimpleCVBuilderPage = lazy(() => import('@/pages/cv-builder/SimpleCVBuilderPage'));
const AutoFillCVBuilder = lazy(() => import('@/pages/cv-builder/AutoFillCVBuilder'));
const EventsCalendarPage = lazy(() => import('@/pages/events/EventsCalendarPage'));
const EventDetailPage = lazy(() => import('@/pages/events/EventsCalendarPage').then(m => ({ default: m.EventDetailPage })));
const EventCheckInPage = lazy(() => import('@/pages/events/EventCheckInPage'));
const EventManagePage = lazy(() => import('@/pages/events/EventManagePage'));
const PublicCVViewer = lazy(() => import('@/pages/cv-builder/PublicCVViewer'));

// Home Page (lazy loaded to reduce initial bundle — was 650 lines)
const BilingualHomePage = lazy(() => import('@/pages/BilingualHomePage'));
const LoginTestPage = lazy(() => import('./pages/LoginTestPage'));

// CV Upload Page
const CVUploadPage = lazy(() => import('@/pages/cv-upload/CVUploadPage'));

// Core Pages
// IndustryExplorationPage merged into CareerPlanningHub — redirect below
/* Old CVBuilderPage import removed — /cv-builder-new now redirects to /cv-builder */
/* Old AnalyticsDashboard import removed — replaced by AnalyticsPage3 */

const SchoolProgramsPage = lazy(() => import('./pages/SchoolProgramsPage'));
const SchoolProgramsAdmin = lazy(() => import('./pages/admin/SchoolProgramsAdmin'));
const SchoolProgramsAdminAPI = lazy(() => import('./pages/admin/SchoolProgramsAdminAPI'));
const RoleRequestsPage = lazy(() => import('./pages/admin/RoleRequestsPage'));
const UniversityProgramsPage = lazy(() => import('./pages/education/UniversityProgramsPage'));
const KnowledgeCampsPage = lazy(() => import('./pages/summer-camps'));
const ScholarshipsPage = lazy(() => import('./pages/scholarships'));
const GraduateProgramsPage = lazy(() => import('./pages/graduate-programs'));
// LMS retired: the whole /lms module was frontend-only with no backend
// (fabricated courses/services). The route redirects to Coming Soon and the
// nav item is gated off via the page_lms feature flag.
const ComingSoonPage = lazy(() => import('@/pages/ComingSoonPage'));

// Other key pages
const AnalyticsPage3 = lazy(() => import('@/pages/analytics/AnalyticsPage2'));
// Messages page removed — redirected to candidate dashboard messaging tab
const Profile = lazy(() => import('@/pages/profile'));
const JobMatchingPage2 = lazy(() => import('@/pages/job-matching/JobMatchingPage'));
const Applications = lazy(() => import('@/pages/applications'));
const TrainingPage2 = lazy(() => import('@/pages/training/TrainingPage'));
const CommunitiesPage3 = lazy(() => import('@/pages/communities/CommunitiesPage2'));
const DigitalSkillsPage2 = lazy(() => import('@/pages/digital-skills/DigitalSkillsPage'));
const CareerPlanningHub = lazy(() => import('@/pages/career-planning-hub/functional'));
const FinancialPlanningPage = lazy(() => import('@/pages/financial-planning/FinancialPlanningPage'));
const PortfolioPage = lazy(() => import('@/pages/portfolio/PortfolioPage'));
const InterviewPreparationPage2 = lazy(() => import('@/pages/interview-preparation/InterviewPreparationPage'));
const InternshipsPage = lazy(() => import('@/pages/internships/InternshipsPage'));
const GigMarketplacePage = lazy(() => import('@/pages/gig-marketplace/GigMarketplacePage'));
const StartupLaunchpadPage = lazy(() => import('@/pages/startup-launchpad/StartupLaunchpadPage'));
const CareerPathwaySimulator = lazy(() => import('@/pages/career-simulator/CareerPathwaySimulator'));
const CareerPassportPage = lazy(() => import('@/pages/career-passport/CareerPassportPage'));
const InteractiveMapPage = lazy(() => import('@/pages/interactive-map/InteractiveMapPage'));
const CredentialsCenterPage = lazy(() => import('@/pages/credentials/CredentialsCenterPage'));
const AssessmentsPage2 = lazy(() => import('@/pages/assessments/AssessmentsPage'));
const ProfessionalCertificationsPage = lazy(() => import('@/pages/professional-certifications/ProfessionalCertificationsPage'));
const BlockchainCredentialsPage = lazy(() => import('@/pages/blockchain-credentials/BlockchainCredentialsPage'));
const MentorshipPage2 = lazy(() => import('@/pages/mentorship/MentorshipPage'));
const YouthDevelopmentPage = lazy(() => import('@/pages/youth-development/YouthDevelopmentPage'));
const NationalServicePage = lazy(() => import('@/pages/national-service/NationalServicePage'));
const ThoughtLeadershipPage = lazy(() => import('@/pages/thought-leadership/ThoughtLeadershipPage'));
const ShareSuccessStoriesPage = lazy(() => import('@/pages/success-stories/ShareSuccessStoriesPage'));
const RetireePage = lazy(() => import('@/pages/retiree/RetireePage'));
const NafisTalentDashboard = lazy(() => import('@/pages/operator-dashboards/NafisTalentDashboard'));
const EducationOperatorDashboard = lazy(() => import('@/pages/operator-dashboards/EducationOperatorDashboard'));
const ProfessionalDevDashboard = lazy(() => import('@/pages/operator-dashboards/ProfessionalDevDashboard'));
const CommunityOperatorDashboard = lazy(() => import('@/pages/operator-dashboards/CommunityOperatorDashboard'));
const OperationsMonitoringCenter = lazy(() => import('@/pages/operator-dashboards/OperationsMonitoringCenter'));
const OperationsWallDisplay = lazy(() => import('@/pages/operator-dashboards/OperationsWallDisplay'));
const DemographicsAnalytics = lazy(() => import('@/pages/operator-dashboards/DemographicsAnalytics'));
const ExecutiveDashboard = lazy(() => import('@/pages/operator-dashboards/ExecutiveDashboard'));
const BoardSecretaryDashboard = lazy(() => import('@/pages/operator-dashboards/BoardSecretaryDashboard'));
const ServiceCatalog = lazy(() => import('@/pages/operator-dashboards/ServiceCatalog'));
const AssessmentOperatorDashboard = lazy(() => import('@/pages/operator-dashboards/AssessmentOperatorDashboard'));
const MentorshipOperatorDashboard = lazy(() => import('@/pages/operator-dashboards/MentorshipOperatorDashboard'));
const CareerServicesDashboard = lazy(() => import('@/pages/operator-dashboards/CareerServicesDashboard'));
const BoardMeetingRoom = lazy(() => import('@/pages/board/BoardMeetingRoom'));
// Phase 2-4 New Role Dashboards
const AdvisorDashboard = lazy(() => import('@/pages/AdvisorDashboard'));
const CoachDashboard = lazy(() => import('@/pages/CoachDashboard'));
const InternshipCoordinatorDashboard = lazy(() => import('@/pages/InternshipCoordinatorDashboard'));
const TrainingCenterDashboard = lazy(() => import('@/pages/TrainingCenterDashboard'));
const CallCenterDashboard = lazy(() => import('@/pages/CallCenterDashboard'));
// Company Workspace (Multi-Tenant)
const WorkspaceLayout = lazy(() => import('@/pages/workspace/WorkspaceLayout'));
const WorkspaceDashboard = lazy(() => import('@/pages/workspace/WorkspaceDashboard'));
const EmployeeManagerPage = lazy(() => import('@/pages/workspace/EmployeeManager'));
const ResourceAssignmentPage = lazy(() => import('@/pages/workspace/ResourceAssignment'));
const WorkspaceJobsPage = lazy(() => import('@/pages/workspace/WorkspaceJobs'));
const WorkspaceSettingsPage = lazy(() => import('@/pages/workspace/WorkspaceSettings'));
const MyCompanyView = lazy(() => import('@/pages/workspace/MyCompanyView'));
const EmiratiComplianceDashboard = lazy(() => import('@/pages/workspace/EmiratiComplianceDashboard'));
const DocumentCenter = lazy(() => import('@/pages/workspace/DocumentCenter'));
const CSVManager = lazy(() => import('@/pages/workspace/CSVManager'));
const EngagementAnalytics = lazy(() => import('@/pages/workspace/EngagementAnalytics'));
const MentorReportsPage = lazy(() => import('@/pages/workspace/MentorReports'));
const ResourceVault = lazy(() => import('@/pages/workspace/ResourceVault'));
const NotFound = lazy(() => import('@/pages/not-found'));
const OurMission = lazy(() => import('@/pages/OurMission'));

// Protected Route Component
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Role-based Dashboard Components
const OperatorDashboard = lazy(() => import('./pages/OperatorDashboard'));

// Global Styles
import './index.css';

import { useAuth } from '@/context/AuthContext';
import { getAuthToken } from '@/utils/tokenUtils';
import { NotificationProvider } from '@/components/notifications/NotificationSystem';
import ConnectionBanner from '@/components/notifications/ConnectionBanner';
import { FeatureFlagsProvider } from '@/components/common/FeatureFlagGuard';

// Government Dashboard Route Redirect to maintain query params
const GovernmentRedirect: React.FC = () => {
  const location = useLocation();
  return <Navigate to={`/government-dashboard${location.search}`} replace />;
};

// App Content Component with bilingual support
const AppContent: React.FC = () => {
  const { i18n } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pathname } = useLocation();

  // The command-room wall display owns the whole screen. Global chrome —
  // skip links, connection banner, FABs, toasts — is wasted wall space and
  // there is nobody standing at the wall to click it.
  const isWallDisplay = pathname.startsWith('/operations-center/display');

  useEffect(() => {
    // Set initial language and direction
    const currentLang = i18n.language || 'en';
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;

    // Add appropriate body class
    if (currentLang === 'ar') {
      document.body.classList.add('rtl', 'font-arabic');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl', 'font-arabic');
    }
  }, [i18n.language]);

  const token = getAuthToken() || '';

  // Show loading spinner while auth state is being resolved
  // This prevents the unauthenticated catch-all redirect from firing
  // before the stored JWT token is loaded from localStorage
  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <MaintenanceGate>
    <div className="App min-h-screen bg-background">
      {!isWallDisplay && <SkipNavigation />}
      {isAuthenticated && user && user.id && (
        <NotificationProvider
          userId={user.id.toString()}
          userType={user.user_type || user.role || 'user'}
          authToken={token}
        >
          {!isWallDisplay && <ConnectionBanner />}
          <SupportChatProvider>
          <Suspense fallback={<DashboardLoading />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<BilingualHomePage />} />
              <Route path="/our-mission" element={<OurMission />} />
              <Route path="/auth" element={<EnhancedAuthPage />} />
              <Route path="/auth/uaepass/callback" element={
                <Suspense fallback={<DashboardLoading />}>
                  <UAEPassCallback />
                </Suspense>
              } />
              <Route path="/welcome" element={
                <ProtectedRoute>
                  <WelcomePage />
                </ProtectedRoute>
              } />
              <Route path="/cv/share/:id" element={<PublicCVViewer />} />
              <Route path="/public/job/:token" element={<VerifyJob />} />
              <Route path="/jobs/:token" element={<VerifyJob />} />
              <Route path="/verify-job/:token" element={<VerifyJob />} />
              <Route path="/join/:token" element={<CompanyOnboardingWizard />} />
              <Route path="/join-team/:token" element={<JoinTeamPage />} />
              <Route path="/join-staff/:token" element={<JoinStaffPage />} />
              <Route path="/live/:token" element={<EventLiveBoard />} />

              {/* Protected Role-Based Routes */}
              <Route
                path="/candidate-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'candidate', 'candidate']}>
                    <CandidateDashboard />
                  </ProtectedRoute>
                }
              />
              {/* Old protected /assessments route removed — replaced by new route below */}

              {/* Your OWN profile — no role list (#404 follow-up).
                  It was gated to candidate/recruiter/employer_admin, which
                  excluded every operator role, so a career services operator
                  clicking "Update Personal Information" in Profile Management
                  was refused from editing their own details
                  (fb_1786429083_513f8863). The Studio reads the signed-in
                  identity from the JWT and shows nobody else's record, so the
                  role list was gating the wrong thing: managing your own
                  profile is not a privilege any role should have to hold. */}
              <Route
                path="/candidate/profile/*"
                element={
                  <ProtectedRoute>
                    <ProfileStudioPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['candidate']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guardian-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['parent', 'parent']}>
                    <ParentDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/*"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'employer_admin', 'recruiter']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/verify-job/:token" element={<VerifyJob />} />
              <Route path="/join/:token" element={<CompanyOnboardingWizard />} />
              <Route path="/join-team/:token" element={<JoinTeamPage />} />
              <Route path="/join-staff/:token" element={<JoinStaffPage />} />
              <Route path="/live/:token" element={<EventLiveBoard />} />
              <Route path="/guest/interview/:token" element={<GuestLobby />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/operator-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator']}>
                    <OperatorDashboard />
                  </ProtectedRoute>
                }
              />



              <Route
                path="/hr-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['employer_admin', 'employer_admin']}>
                    <HRDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/recruiter/jobs"
                element={
                  <ProtectedRoute>
                    <RecruiterJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/vacancies"
                element={
                  <ProtectedRoute>
                    <ActiveVacancies />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/recruiter/jd-builder"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'employer_admin']}>
                    <JobDescriptionWizardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/jobs/:id"
                element={
                  <ProtectedRoute>
                    <JobDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/interviews/schedule"
                element={
                  <ProtectedRoute>
                    <InterviewSchedulerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/jd-templates"
                element={
                  <ProtectedRoute>
                    <JDTemplatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/batch-upload"
                element={
                  <ProtectedRoute>
                    <BatchUploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/analytics"
                element={
                  <ProtectedRoute>
                    <RecruiterAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/interviews/details"
                element={
                  <ProtectedRoute>
                    <InterviewDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/candidates"
                element={
                  <ProtectedRoute>
                    <RecruiterCandidates />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/recruiter/video-interview/:sessionId"
                element={
                  <ProtectedRoute>
                    <VideoInterviewPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/recruiter/interview-analytics/:interviewId"
                element={
                  <ProtectedRoute>
                    <InterviewAnalyticsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/recruiter/shortlist/:jdId"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'recruiter', 'employer_admin', 'employer_admin', 'admin', 'admin']}>
                    <ShortlistPage />
                  </ProtectedRoute>
                }
              />

              {/* Career-services staff need this: counselling a candidate is their
                  job, and they already see the same candidate PII in the CRM
                  (/api/profile/crm-candidates is gated to exactly these roles).
                  Their absence here is why 'View Profile' and 'View Application'
                  bounced an operator to the home page (fb_1785823460/823507). */}
              <Route
                path="/candidate-profile/:candidateId"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'employer_admin', 'admin',
                                                 'career_services_operator', 'call_center_agent', 'operator']}>
                    <CandidateProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/recruiter/offers"
                element={
                  <ProtectedRoute>
                    <RecruiterOffers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/recruiter/approvals"
                element={
                  <ProtectedRoute>
                    <RecruiterApprovals />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/recruiter/distribution"
                element={
                  <ProtectedRoute>
                    <RecruiterDistribution />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/recruiter-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'employer_admin', 'employer_admin']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/assessor-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['assessor']}>
                    <AssessorDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Growth Operator Dashboard Routes */}
              <Route
                path="/growth-operator-dashboard"
                element={
                  <ProtectedRoute allowedRoles={[...GROWTH_OPERATOR_ROLES, 'growth_operator', 'operator', 'talent_operator', 'employer_relations', 'education_operator', 'assessment_operator', 'mentorship_operator', 'community_operator', 'platform_operator', 'admin', 'admin']}>
                    <GrowthOperatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/growth-operator-dashboard/:domain"
                element={
                  <ProtectedRoute allowedRoles={[...GROWTH_OPERATOR_ROLES, 'growth_operator', 'operator', 'talent_operator', 'employer_relations', 'education_operator', 'assessment_operator', 'mentorship_operator', 'community_operator', 'platform_operator', 'admin', 'admin']}>
                    <GrowthOperatorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Career Services CRM Dashboard Route */}
              <Route
                path="/career-services-crm"
                element={
                  <ProtectedRoute allowedRoles={['operator', 'career_services_operator', 'admin', 'admin']}>
                    <CareerServicesDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/career-services-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['operator', 'career_services_operator', 'admin', 'admin']}>
                    <CareerServicesDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/school-programs"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'admin', 'khda_staff', 'content_manager']}>
                    <SchoolProgramsAdminAPI />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/role-requests"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'admin']}>
                    <RoleRequestsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/educator-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['training_provider']}>
                    <EducatorDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/mentor-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['mentor']}>
                    <MentorDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/advisor-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['advisor', 'admin', 'admin']}>
                    <AdvisorDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/coach-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['coach', 'admin', 'admin']}>
                    <CoachDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/guardian-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['parent', 'parent']}>
                    <ParentDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/user-roles"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <Suspense fallback={<DashboardLoading />}>
                      {React.createElement(lazy(() => import('@/components/admin/UserManager')))}
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/government-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['compliance_auditor', 'platform_operator', 'admin']}>
                    <GovernmentDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/government"
                element={<GovernmentRedirect />}
              />

              {/* Recruitment open days (#376). The check-in route is what the
                  venue QR points at; it needs a signed-in user (UAE Pass) but no
                  particular role, because a walk-in has just created an account. */}
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <EventsCalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/manage"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'platform_administrator', 'career_services_operator', 'call_center_agent', 'operator']}>
                    <EventManagePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:eventId/check-in"
                element={
                  <ProtectedRoute>
                    <EventCheckInPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:eventId"
                element={
                  <ProtectedRoute>
                    <EventDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Resume Builder Routes */}
              <Route
                path="/cv-builder"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'candidate', 'candidate']}>
                    <AutoFillCVBuilder />
                  </ProtectedRoute>
                }
              />

              {/* Resume Builder removed — redirect to CV Builder */}
              <Route
                path="/resume-builder"
                element={<Navigate to="/cv-builder" replace />}
              />

              {/* CV Upload Route */}
              <Route
                path="/cv-upload"
                element={<CVUploadPage />}
              />

              {/* Industry Exploration merged into Career Planning Hub */}
              <Route
                path="/industry-exploration"
                element={<Navigate to="/career-planning-hub" replace />}
              />

              {/* Redirect old cv-builder-new to cv-builder */}
              <Route
                path="/cv-builder-new"
                element={<Navigate to="/cv-builder" replace />}
              />

              {/* Old /analytics-dashboard route removed — merged into /analytics */}

              {/* Old /communities-new route removed — merged into /communities */}

              <Route
                path="/coming-soon"
                element={<ComingSoonPage />}
              />

              <Route
                path="/school-programs"
                element={<SchoolProgramsPage />}
              />

              <Route
                path="/university-programs"
                element={<UniversityProgramsPage />}
              />

              <Route
                path="/knowledge-camps"
                element={<KnowledgeCampsPage />}
              />

              <Route
                path="/scholarships"
                element={<ScholarshipsPage />}
              />

              <Route
                path="/graduate-programs"
                element={<GraduateProgramsPage />}
              />

              <Route
                path="/lms"
                element={<Navigate to="/coming-soon?module=Learning%20Management%20System&desc=A%20full%20learning%20management%20system%20is%20planned%20but%20not%20yet%20available." replace />}
              />

              {/* Core Feature Routes */}
              <Route
                path="/analytics"
                element={<AnalyticsPage3 />}
              />

              <Route
                path="/messages"
                element={
                  <Navigate to="/candidate-dashboard?tab=messages" replace />
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Old protected /job-matching route removed — replaced by new route below */}

              <Route
                path="/applications"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'candidate', 'candidate']}>
                    <Applications />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/training"
                element={<TrainingPage2 />}
              />

              <Route
                path="/communities"
                element={<CommunitiesPage3 />}
              />

              <Route
                path="/digital-skills"
                element={<DigitalSkillsPage2 />}
              />

              {/* Digital Skills Development → merged into Training */}
              <Route
                path="/digital-skills-development"
                element={<Navigate to="/training" replace />}
              />

              {/* ── IA Consolidation: Career Hub (merged Career Planning + Advisory + Simulator) ── */}
              <Route
                path="/career-hub"
                element={<CareerPlanningHub />}
              />
              <Route
                path="/career-planning-hub"
                element={<Navigate to="/career-hub" replace />}
              />

              <Route
                path="/career-simulator"
                element={<Navigate to="/career-hub" replace />}
              />

              <Route
                path="/career-advisory"
                element={<Navigate to="/career-hub" replace />}
              />

              {/* Career Passport → redirect to Credentials Center */}

              <Route
                path="/interactive-map"
                element={<InteractiveMapPage />}
              />

              <Route
                path="/financial-planning"
                element={<FinancialPlanningPage />}
              />

              <Route
                path="/portfolio"
                element={<PortfolioPage />}
              />

              <Route
                path="/interview-preparation"
                element={<InterviewPreparationPage2 />}
              />

              <Route
                path="/internships"
                element={<InternshipsPage />}
              />

              <Route
                path="/job-matching"
                element={<JobMatchingPage2 />}
              />

              <Route
                path="/gig-marketplace"
                element={<GigMarketplacePage />}
              />

              <Route
                path="/startup-launchpad"
                element={<StartupLaunchpadPage />}
              />

              {/* Career Advisory redirected to Career Hub (IA consolidation) */}

              {/* ── IA Consolidation: Credentials Center (3→1 tabs) ── */}
              <Route
                path="/credentials"
                element={<CredentialsCenterPage />}
              />

              <Route
                path="/assessments"
                element={<AssessmentsPage2 />}
              />

              {/* Emiratization Tracker consolidated into Government Dashboard */}
              <Route
                path="/emiratization-tracker"
                element={<Navigate to="/government-dashboard?tab=compliance" replace />}
              />

              {/* Credential sub-pages → redirect to Credentials Center tabs */}
              <Route
                path="/professional-certifications"
                element={<Navigate to="/credentials?tab=certifications" replace />}
              />
              <Route
                path="/blockchain-credentials"
                element={<Navigate to="/credentials?tab=blockchain" replace />}
              />
              <Route
                path="/career-passport"
                element={<Navigate to="/credentials?tab=passport" replace />}
              />

              <Route
                path="/mentorship"
                element={<MentorshipPage2 />}
              />

              <Route
                path="/youth-development"
                element={<YouthDevelopmentPage />}
              />

              <Route
                path="/national-service"
                element={<NationalServicePage />}
              />

              {/* Thought Leadership & Success Stories → merged into Communities (IA consolidation) */}
              <Route
                path="/thought-leadership"
                element={<Navigate to="/communities" replace />}
              />
              <Route
                path="/share-success-stories"
                element={<Navigate to="/communities" replace />}
              />

              <Route
                path="/retiree"
                element={<RetireePage />}
              />

              {/* Operator Dashboards — each guarded (P0 security fix: these
                  six previously rendered with no ProtectedRoute). */}
              <Route
                path="/nafis-talent-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['talent_operator', 'operator', 'growth_operator', ...GROWTH_OPERATOR_ROLES, ...GROWTH_OPERATOR_ROLES, 'admin', 'super_admin', 'platform_administrator']}>
                    <NafisTalentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/education-operator-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['education_operator', 'operator', 'growth_operator', ...GROWTH_OPERATOR_ROLES, 'admin', 'super_admin', 'platform_administrator']}>
                    <EducationOperatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/professional-dev-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['professional_dev_operator', 'operator', 'growth_operator', ...GROWTH_OPERATOR_ROLES, 'admin', 'super_admin', 'platform_administrator']}>
                    <ProfessionalDevDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community-operator-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['community_operator', 'operator', 'growth_operator', ...GROWTH_OPERATOR_ROLES, 'admin', 'super_admin', 'platform_administrator']}>
                    <CommunityOperatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessment-operator-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['assessment_operator', 'operator', 'growth_operator', ...GROWTH_OPERATOR_ROLES, 'admin', 'super_admin', 'platform_administrator']}>
                    <AssessmentOperatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentorship-operator-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['mentorship_operator', 'operator', 'growth_operator', ...GROWTH_OPERATOR_ROLES, 'admin', 'super_admin', 'platform_administrator']}>
                    <MentorshipOperatorDashboard />
                  </ProtectedRoute>
                }
              />
              {/* Operations Center is TWO surfaces sharing one data source:
                  the at-desk view below, and the command-room wall display.
                  A wall display is not the dashboard darker — viewing distance
                  changes the design — so it gets its own route rather than a
                  mode toggle. Declared first: it is the more specific path. */}
              <Route
                path="/operations-center/display"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'platform_administrator', 'platform_operator']}>
                    <OperationsWallDisplay />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operations-center"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'platform_administrator', 'platform_operator']}>
                    <OperationsMonitoringCenter />
                  </ProtectedRoute>
                }
              />
              {/* career_services_operator added by owner decision 2026-08-15.
                  The navigation had always offered this page to that role while
                  the route refused it, so it bounced to the home page
                  (fb_1786427865_96351906). #404 narrowed the menu to stop the
                  lie; the owner's call is that the page was right and the ROUTE
                  was wrong — counselling operators need the talent-pool picture,
                  and they already see far more identifying data in the CRM
                  roster than these aggregates contain.
                  NB the comment sits ABOVE <Route: inside the element it pushes
                  allowedRoles out of the window routeAccess.test.ts parses, and
                  the path reads as undeclared. */}
              <Route
                path="demographics"
                element={
                  <ProtectedRoute allowedRoles={['board_member', 'admin', 'platform_operator', 'compliance_auditor', 'career_services_operator']}>
                    <DemographicsAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="executive"
                element={
                  <ProtectedRoute allowedRoles={['board_member', 'board_chairman', 'board_operator', 'admin', 'platform_operator', 'compliance_auditor']}>
                    <ExecutiveDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board-secretary"
                element={
                  <ProtectedRoute allowedRoles={['board_operator', 'admin', 'platform_operator']}>
                    <BoardSecretaryDashboard />
                  </ProtectedRoute>
                }
              />
              {/* Any authenticated user may OPEN the room; POST /join decides
                  whether they get in, from the per-meeting attendee list.
                  A role gate here refused the guest at the door — the subject
                  expert invited for one agenda item is not a board member, so
                  additional attendees (PR #469) and the waiting room (PR #471)
                  were both unreachable by the people they exist for. The
                  backend guard had the same flaw (PR #472); this is its twin,
                  and it only showed up in a browser. Someone not on the list
                  still gets "Unable to join" from the API. */}
              <Route
                path="/board-meeting/:meetingId"
                element={
                  <ProtectedRoute>
                    <BoardMeetingRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board-portal"
                element={<Navigate to="/executive" replace />}
              />
              <Route
                path="service-catalog"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'board_member', 'compliance_auditor', 'platform_operator']}>
                    <ServiceCatalog />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/internship-coordinator-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['internship_coordinator', 'admin', 'admin']}>
                    <InternshipCoordinatorDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/training-center-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['training_provider', 'admin', 'admin']}>
                    <TrainingCenterDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/call-center-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['call_center_agent', 'admin', 'admin']}>
                    <CallCenterDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Company Workspace Routes (Multi-Tenant) */}
              <Route
                path="/workspace/:companyId"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'employer_admin', 'employer_admin', 'recruiter', 'growth_operator', ...GROWTH_OPERATOR_ROLES, 'employer_relations', 'admin', 'admin', 'candidate', 'candidate', 'seeker', 'employee']}>
                    <WorkspaceLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<WorkspaceDashboard />} />
                <Route path="employees" element={<EmployeeManagerPage />} />
                <Route path="resources" element={<ResourceAssignmentPage />} />
                <Route path="jobs" element={<WorkspaceJobsPage />} />
                <Route path="settings" element={<WorkspaceSettingsPage />} />
                <Route path="emiratisation" element={<EmiratiComplianceDashboard />} />
                <Route path="documents" element={<DocumentCenter />} />
                <Route path="csv-import" element={<CSVManager />} />
                <Route path="analytics" element={<EngagementAnalytics />} />
                <Route path="mentor-reports" element={<MentorReportsPage />} />
                <Route path="vault" element={<ResourceVault />} />
              </Route>

              {/* Public magic-link routes (accessible even when authenticated) */}
              <Route path="/register/:token" element={<SeekerOnboardingWizard />} />
              <Route path="/join/:token" element={<CompanyOnboardingWizard />} />
              <Route path="/join-team/:token" element={<JoinTeamPage />} />
              <Route path="/join-staff/:token" element={<JoinStaffPage />} />
              <Route path="/live/:token" element={<EventLiveBoard />} />
              <Route path="/verify-job/:token" element={<VerifyJob />} />

              {/* Login Test Route */}
              <Route path="/login-test" element={<LoginTestPage />} />

              {/* Catch all route - 404 page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          {/* Toast Notifications */}
          <HotToaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          {/* Support Chat Widget — visible to all non-agent personas */}
          {user.role !== 'call_center_agent' && !isWallDisplay && <SupportChatWidget />}
          </SupportChatProvider>
        </NotificationProvider>
      )}
      {!isAuthenticated && (
        <Suspense fallback={<DashboardLoading />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<BilingualHomePage />} />
            <Route path="/our-mission" element={<OurMission />} />
            {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
            {/* <Route path="/reset-password" element={<ResetPassword />} /> */}
            <Route path="/welcome" element={
              <ProtectedRoute>
                <WelcomePage />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<EnhancedAuthPage />} />
            <Route path="/auth/uaepass/callback" element={
              <Suspense fallback={<DashboardLoading />}>
                <UAEPassCallback />
              </Suspense>
            } />
            {/* Links shared with people OUTSIDE the platform must resolve for
                signed-out visitors — they were only registered in the
                authenticated group, so a shared CV bounced to /auth
                (feedback fb_1785817165). */}
            <Route path="/cv/share/:id" element={<PublicCVViewer />} />
            <Route path="/public/job/:token" element={<VerifyJob />} />
            <Route path="/jobs/:token" element={<VerifyJob />} />
            <Route path="/verify-job/:token" element={<VerifyJob />} />
            <Route path="/join/:token" element={<CompanyOnboardingWizard />} />
              <Route path="/join-team/:token" element={<JoinTeamPage />} />
              <Route path="/join-staff/:token" element={<JoinStaffPage />} />
              <Route path="/live/:token" element={<EventLiveBoard />} />
            <Route path="/register/:token" element={<SeekerOnboardingWizard />} />
            <Route path="/guest/interview/:token" element={<GuestLobby />} />

            {/* Catch all route for unauthenticated - redirect to auth or home */}
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </Suspense>
      )}
      {!isWallDisplay && <Toaster />}
      {!isWallDisplay && <FeedbackWidget />}
    </div>
  </MaintenanceGate>
  );
};

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Tells Radix which way the page reads.
 *
 * Radix primitives — Tabs, Select, DropdownMenu, Slider, Popover — do NOT read
 * the DOM `dir` attribute. Each one takes its own `dir` prop and defaults to
 * 'ltr' unless a DirectionProvider supplies it. So the Board Secretariat page
 * set dir="rtl" on its root, the page flipped, and its tab strip stayed
 * left-aligned (fb_1787248956).
 *
 * Mounted once here rather than passing dir= to every primitive: correctness by
 * opt-in fails wherever someone forgets, and 52 of ~118 components were already
 * hand-rolling their own dir attribute.
 *
 * Must sit INSIDE LanguageProvider — it reads the language from it.
 */
const RadixDirection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  return <DirectionProvider dir={language === 'ar' ? 'rtl' : 'ltr'}>{children}</DirectionProvider>;
};

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <LanguageProvider>
            <RadixDirection>
            <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
              <FeatureFlagsProvider>
                <AppContent />
                {/* Toaster mounts once, inside AppContent (wall-display aware).
                    A second mount here stacked two viewports over each other. */}
                <HotToaster position="top-center" />
              </FeatureFlagsProvider>
            </ThemeProvider>
            </RadixDirection>
          </LanguageProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
