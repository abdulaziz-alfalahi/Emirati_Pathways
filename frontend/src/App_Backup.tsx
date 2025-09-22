import React, { Suspense, lazy, useEffect } from 'react';
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

// Home Page (not lazy loaded for faster initial access)
import BilingualHomePage from '@/pages/BilingualHomePage';
import LoginTestPage from './pages/LoginTestPage';

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
                <Route path="/auth" element={<AuthPage />} />
                
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
                  path="/cv-builder" 
                  element={
                    <ProtectedRoute allowedRoles={['job_seeker', 'candidate']}>
                      <ResumeBuilderPage />
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

// Main App Component with Enhanced Language Provider
function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
