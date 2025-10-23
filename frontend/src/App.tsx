import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from '@/context/AuthContext';
import { MockAuthProvider } from '@/context/MockAuthContext';
import { LanguageProvider } from './context/EnhancedLanguageContext';
import { Toaster } from 'react-hot-toast';
import './i18n/config';
import './styles/enhanced-rtl.css';

// Development components

// Loading component
import DashboardLoading from '@/components/dashboard/DashboardLoading';

// Auth Pages (not lazy loaded for faster initial access)
import AuthPage from '@/pages/auth';
import MockLogin from '@/pages/auth/MockLogin';

// Lazy loaded components for better performance
const CandidateDashboard = lazy(() => import('@/pages/CandidateDashboard'));
const HRDashboard = lazy(() => import('@/pages/HRDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const EmployerDashboard = lazy(() => import('@/pages/EmployerDashboard'));
const EducatorDashboard = lazy(() => import('@/pages/EducatorDashboard'));
const MentorDashboard = lazy(() => import('@/pages/MentorDashboard'));
const RecruiterDashboard = lazy(() => import('@/pages/RecruiterDashboard'));
const RecruiterJobs = lazy(() => import('@/pages/recruiter/Jobs'));
const RecruiterCandidates = lazy(() => import('@/pages/recruiter/Candidates'));
const RecruiterOffers = lazy(() => import('@/pages/recruiter/Offers'));
const RecruiterApprovals = lazy(() => import('@/pages/recruiter/Approvals'));
const RecruiterDistribution = lazy(() => import('@/pages/recruiter/Distribution'));
const NewJobWizard = lazy(() => import('@/pages/recruiter/NewJobWizard'));
const JobDetailsPage = lazy(() => import('@/pages/recruiter/JobDetails'));
const InterviewSchedulerPage = lazy(() => import('@/pages/recruiter/InterviewScheduler'));
const AssessorDashboard = lazy(() => import('@/pages/AssessorDashboard'));
const GovernmentDashboard = lazy(() => import('@/pages/GovernmentDashboard'));

// Resume Builder
const ResumeBuilderPage = lazy(() => import('@/pages/resume-builder'));
const EnhancedCVBuilderPage = lazy(() => import('@/pages/cv-builder/EnhancedCVBuilderPage'));
const SimpleCVBuilderPage = lazy(() => import('@/pages/cv-builder/SimpleCVBuilderPage'));
const AutoFillCVBuilder = lazy(() => import('@/pages/cv-builder/AutoFillCVBuilder'));

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

// Role-based Dashboard Components
// Removed old RecruiterDashboard import - now using the new one from pages

// Global Styles
import './index.css';

// App Content Component with bilingual support
const AppContent: React.FC = () => {
  const { i18n } = useTranslation();

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

  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
            <Suspense fallback={<DashboardLoading />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<BilingualHomePage />} />
                <Route path="/auth" element={<MockLogin />} />
                
                {/* Protected Dashboard Routes */}
                <Route 
                  path="/candidate-dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['job_seeker', 'candidate']}>
                      <CandidateDashboard />
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
                  path="/recruiter/jobs/new" 
                  element={
                    <ProtectedRoute>
                      <NewJobWizard />
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
                  path="/recruiter/candidates" 
                  element={
                    <ProtectedRoute>
                      <RecruiterCandidates />
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
                    <ProtectedRoute allowedRoles={['recruiter']}>
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

                <Route 
                  path="/admin/school-programs" 
                  element={
                    <ProtectedRoute allowedRoles={['administrator', 'admin', 'khda_staff', 'content_manager']}>
                      <SchoolProgramsAdminAPI />
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
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
  );
};

// Main App Component with Enhanced Language Provider and Mock Auth
function App() {
  return (
    <LanguageProvider>
      <MockAuthProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </MockAuthProvider>
    </LanguageProvider>
  );
}

export default App;
