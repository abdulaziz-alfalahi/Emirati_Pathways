import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from './context/EnhancedLanguageContext';
import { Toaster } from 'react-hot-toast';
import './i18n/config';
import './styles/enhanced-rtl.css';

// Loading component
import DashboardLoading from '@/components/dashboard/DashboardLoading';

// Auth Pages (not lazy loaded for faster initial access)
import AuthPage from '@/pages/auth';

// Home Page (not lazy loaded for faster initial access)
import BilingualHomePage from '@/pages/BilingualHomePage';
import LoginTestPage from './pages/LoginTestPage';

// Modern Pages - directly imported for better performance
import ModernCVBuilder from '@/pages/cv-builder/ModernCVBuilder';
import ModernIndustryExploration from '@/pages/industry-exploration/ModernIndustryExploration';
import ModernSchoolPrograms from '@/pages/education/ModernSchoolPrograms';
import ModernUniversityPrograms from '@/pages/education/ModernUniversityPrograms';
import ModernAnalytics from '@/pages/professional-growth/ModernAnalytics';
import ModernCommunities from '@/pages/lifelong-engagement/ModernCommunities';
import ModernCareerPlanningHub from '@/pages/career-planning-hub/ModernCareerPlanningHub';

// Lazy loaded components for better performance
const CandidateDashboard = lazy(() => import('@/pages/CandidateDashboard'));
const HRDashboard = lazy(() => import('@/pages/HRDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const EmployerDashboard = lazy(() => import('@/pages/EmployerDashboard'));
const EducatorDashboard = lazy(() => import('@/pages/EducatorDashboard'));
const MentorDashboard = lazy(() => import('@/pages/MentorDashboard'));
const GovernmentDashboard = lazy(() => import('@/pages/GovernmentDashboard'));

// Resume Builder
const ResumeBuilderPage = lazy(() => import('@/pages/resume-builder'));

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
const RecruiterDashboard = lazy(() => import('@/components/dashboard/role-dashboards/RecruiterDashboard'));

function App() {
  const { i18n } = useTranslation();

  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className={`App ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <Suspense fallback={<DashboardLoading />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<BilingualHomePage />} />
                <Route path="/home" element={<BilingualHomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login-test" element={<LoginTestPage />} />

                {/* Modern Pages - No Authentication Required for Testing */}
                <Route path="/school-programs" element={<ModernSchoolPrograms />} />
                <Route path="/university-programs" element={<ModernUniversityPrograms />} />
                <Route path="/career-planning-hub" element={<ModernCareerPlanningHub />} />
                <Route path="/industry-exploration" element={<ModernIndustryExploration />} />
                <Route path="/cv-builder" element={<ModernCVBuilder />} />
                <Route path="/analytics" element={<ModernAnalytics />} />
                <Route path="/communities" element={<ModernCommunities />} />

                {/* Dashboard Routes */}
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
                    <ProtectedRoute allowedRoles={['hr', 'recruiter']}>
                      <HRDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/employer-dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['employer']}>
                      <EmployerDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/recruiter-dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['recruiter']}>
                      <RecruiterDashboard activeTab="overview" />
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
                  path="/resume-builder" 
                  element={
                    <ProtectedRoute allowedRoles={['job_seeker', 'candidate']}>
                      <ResumeBuilderPage />
                    </ProtectedRoute>
                  } 
                />

                {/* Core Feature Routes */}
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
                  path="/digital-skills" 
                  element={
                    <ProtectedRoute>
                      <DigitalSkills />
                    </ProtectedRoute>
                  } 
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
                  element={<SuccessStories />} 
                />

                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
