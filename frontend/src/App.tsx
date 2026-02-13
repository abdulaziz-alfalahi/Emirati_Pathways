import * as React from 'react';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from '@/context/AuthContext';
// import { MockAuthProvider } from '@/context/MockAuthContext';
import { LanguageProvider } from './context/EnhancedLanguageContext';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as HotToaster } from 'react-hot-toast';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import './i18n/config';
import './styles/enhanced-rtl.css';

// Development components

// Loading component
import DashboardLoading from '@/components/dashboard/DashboardLoading';
// Shadcn Toaster
import { Toaster } from '@/components/ui/toaster';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';

// Auth Pages (not lazy loaded for faster initial access)
// import AuthPage from '@/pages/auth'; 
// import AuthPage from './pages/auth';
// import MockLogin from '@/pages/auth/MockLogin'; 
import EnhancedAuthPage from '@/pages/auth/EnhancedAuth';
import { VerifyJob } from '@/pages/public/VerifyJob';

// Lazy loaded components for better performance
const CandidateDashboard = lazy(() => import('@/pages/CandidateDashboard'));
const StudentDashboard = lazy(() => import('@/pages/StudentDashboard'));
const HRDashboard = lazy(() => import('@/pages/HRDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const GrowthOperatorDashboard = lazy(() => import('@/pages/GrowthOperatorDashboard'));
const EmployerDashboard = lazy(() => import('@/pages/EmployerDashboard'));
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

// Resume Builder
const ResumeBuilderPage = lazy(() => import('@/pages/resume-builder'));
// const EnhancedCVBuilderPage = lazy(() => import('@/pages/cv-builder/EnhancedCVBuilderPage'));
const SimpleCVBuilderPage = lazy(() => import('@/pages/cv-builder/SimpleCVBuilderPage'));
const AutoFillCVBuilder = lazy(() => import('@/pages/cv-builder/AutoFillCVBuilder'));
const PublicCVViewer = lazy(() => import('@/pages/cv-builder/PublicCVViewer'));

// Home Page (not lazy loaded for faster initial access)
import BilingualHomePage from '@/pages/BilingualHomePage';
import LoginTestPage from './pages/LoginTestPage';

// CV Upload Page
const CVUploadPage = lazy(() => import('@/pages/cv-upload/CVUploadPage'));

// Core Pages
const IndustryExplorationPage = lazy(() => import('./pages/industry-exploration/IndustryExplorationPage'));
const CVBuilderPage = lazy(() => import('./pages/cv-builder/CVBuilderPage'));
const AnalyticsDashboard = lazy(() => import('./pages/analytics/AnalyticsDashboard'));
const CommunitiesPage = lazy(() => import('./pages/communities/CommunitiesPage'));
const SchoolProgramsPage = lazy(() => import('./pages/SchoolProgramsPage'));
const SchoolProgramsAdmin = lazy(() => import('./pages/admin/SchoolProgramsAdmin'));
const SchoolProgramsAdminAPI = lazy(() => import('./pages/admin/SchoolProgramsAdminAPI'));
const RoleRequestsPage = lazy(() => import('./pages/admin/RoleRequestsPage'));
const UniversityProgramsPage = lazy(() => import('./pages/education/UniversityProgramsPage'));

// Other key pages
const Analytics = lazy(() => import('@/pages/analytics'));
const Messages = lazy(() => import('@/pages/messages'));
const Profile = lazy(() => import('@/pages/profile'));
const JobMatching = lazy(() => import('@/pages/job-matching'));
const Applications = lazy(() => import('@/pages/applications'));
const Training = lazy(() => import('@/pages/training'));
const Communities = lazy(() => import('@/pages/communities'));
const DigitalSkills = lazy(() => import('@/pages/digital-skills'));
const CareerPlanningHub = lazy(() => import('@/pages/career-planning-hub/functional'));
const Mentorship = lazy(() => import('@/pages/mentorship'));
const SuccessStories = lazy(() => import('@/pages/success-stories'));
const NotFound = lazy(() => import('@/pages/not-found'));

// Protected Route Component
import ProtectedRoute from '@/components/auth/ProtectedRoute';
const AssessmentsPage = lazy(() => import('@/pages/assessments'));

// Role-based Dashboard Components
// Removed old RecruiterDashboard import - now using the new one from pages
import OperatorDashboard from './pages/OperatorDashboard';

// Global Styles
import './index.css';

import { useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/components/notifications/NotificationSystem';

// App Content Component with bilingual support
const AppContent: React.FC = () => {
  const { i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();

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

  const token = localStorage.getItem('access_token') || '';

  return (
    <div className="App min-h-screen bg-background">
      {isAuthenticated && user && user.id && (
        <NotificationProvider
          userId={user.id.toString()}
          userType={user.user_type || user.role || 'user'}
          authToken={token}
        >
          <Suspense fallback={<DashboardLoading />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<BilingualHomePage />} />
              <Route path="/auth" element={<EnhancedAuthPage />} />
              <Route path="/welcome" element={
                <ProtectedRoute>
                  <WelcomePage />
                </ProtectedRoute>
              } />
              <Route path="/cv/share/:id" element={<PublicCVViewer />} />
              <Route path="/public/job/:token" element={<VerifyJob />} />
              <Route path="/jobs/:token" element={<VerifyJob />} />
              <Route path="/verify-job/:token" element={<VerifyJob />} />

              {/* Protected Role-Based Routes */}
              <Route
                path="/candidate-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'job_seeker']}>
                    <CandidateDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessments"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'job_seeker', 'student']}>
                    <AssessmentsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/candidate/profile/*"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'job_seeker', 'recruiter', 'hr_manager', 'hr_recruiter', 'hr']}>
                    <ProfileStudioPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/*"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'hr_manager', 'hr_recruiter']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/verify-job/:token" element={<VerifyJob />} />
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
                  <ProtectedRoute allowedRoles={['hr_manager', 'hr']}>
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
                  <ProtectedRoute>
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
                  <ProtectedRoute allowedRoles={['recruiter', 'hr_recruiter', 'hr_manager', 'hr', 'administrator', 'admin']}>
                    <ShortlistPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/candidate-profile/:candidateId"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'hr_recruiter', 'hr_manager', 'hr', 'administrator', 'admin']}>
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
                  <ProtectedRoute allowedRoles={['recruiter', 'hr', 'hr_manager']}>
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
                  <ProtectedRoute allowedRoles={['administrator', 'admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Growth Operator Dashboard Routes */}
              <Route
                path="/growth-operator-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['growth_operator', 'growth_operator_candidate', 'growth_operator_company', 'growth_operator_education', 'growth_operator_assessment', 'growth_operator_mentorship', 'growth_operator_community', 'administrator', 'admin']}>
                    <GrowthOperatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/growth-operator-dashboard/:domain"
                element={
                  <ProtectedRoute allowedRoles={['growth_operator', 'growth_operator_candidate', 'growth_operator_company', 'growth_operator_education', 'growth_operator_assessment', 'growth_operator_mentorship', 'growth_operator_community', 'administrator', 'admin']}>
                    <GrowthOperatorDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/school-programs"
                element={
                  <ProtectedRoute allowedRoles={['administrator', 'admin', 'khda_staff', 'content_manager']}>
                    <SchoolProgramsAdminAPI />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/role-requests"
                element={
                  <ProtectedRoute allowedRoles={['administrator', 'admin']}>
                    <RoleRequestsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/educator-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['educator']}>
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
                  <ProtectedRoute allowedRoles={['government']}>
                    <GovernmentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Resume Builder Routes */}
              <Route
                path="/cv-builder"
                element={
                  <ProtectedRoute allowedRoles={['job_seeker', 'candidate']}>
                    <AutoFillCVBuilder />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/resume-builder"
                element={
                  <ProtectedRoute allowedRoles={['job_seeker', 'candidate']}>
                    <ResumeBuilderPage />
                  </ProtectedRoute>
                }
              />

              {/* CV Upload Route */}
              <Route
                path="/cv-upload"
                element={<CVUploadPage />}
              />

              {/* Core Pages Routes */}
              <Route
                path="/industry-exploration"
                element={<IndustryExplorationPage />}
              />

              <Route
                path="/cv-builder-new"
                element={<CVBuilderPage />}
              />

              <Route
                path="/analytics-dashboard"
                element={<AnalyticsDashboard />}
              />

              <Route
                path="/communities-new"
                element={<CommunitiesPage />}
              />

              <Route
                path="/school-programs"
                element={<SchoolProgramsPage />}
              />

              <Route
                path="/university-programs"
                element={<UniversityProgramsPage />}
              />

              {/* Core Feature Routes */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
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

              <Route
                path="/job-matching"
                element={
                  <ProtectedRoute allowedRoles={['job_seeker', 'candidate']}>
                    <JobMatching />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/applications"
                element={
                  <ProtectedRoute allowedRoles={['job_seeker', 'candidate']}>
                    <Applications />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/training"
                element={
                  <ProtectedRoute>
                    <Training />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/communities"
                element={
                  <ProtectedRoute>
                    <Communities />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/digital-skills"
                element={
                  <ProtectedRoute>
                    <DigitalSkills />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/career-planning-hub"
                element={<CareerPlanningHub />}
              />

              <Route
                path="/mentorship"
                element={
                  <ProtectedRoute>
                    <Mentorship />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/success-stories"
                element={
                  <ProtectedRoute>
                    <SuccessStories />
                  </ProtectedRoute>
                }
              />

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
        </NotificationProvider>
      )}
      {!isAuthenticated && (
        <Suspense fallback={<DashboardLoading />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<BilingualHomePage />} />
            {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
            {/* <Route path="/reset-password" element={<ResetPassword />} /> */}
            <Route path="/welcome" element={
              <ProtectedRoute>
                <WelcomePage />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<EnhancedAuthPage />} />
            <Route path="/verify-job/:token" element={<VerifyJob />} />
            <Route path="/guest/interview/:token" element={<GuestLobby />} />

            {/* Catch all route for unauthenticated - redirect to auth or home */}
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </Suspense>
      )}
      <Toaster />
      <FeedbackWidget />
    </div>
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

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
              <AppContent />
              <Toaster />
              <HotToaster position="top-center" />
              <FeedbackWidget />
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
