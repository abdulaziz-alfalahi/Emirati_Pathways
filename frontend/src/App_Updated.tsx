import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';
import { EnhancedLanguageProvider } from './context/EnhancedLanguageContext';

// Layout Components
import { EnhancedHybridGovernmentNav } from './components/layout/EnhancedHybridGovernmentNav';

// Page Components - Modern Versions
import EnhancedHomePage from './pages/EnhancedHomePage';

// Career Entry Pages (Modern)
import ModernCareerPlanningHub from './pages/career-planning-hub/ModernCareerPlanningHub';
import ModernIndustryExploration from './pages/industry-exploration/ModernIndustryExploration';
import ModernCVBuilder from './pages/cv-builder/ModernCVBuilder';

// Education Pathway Pages (Modern)
import ModernSchoolPrograms from './pages/education/ModernSchoolPrograms';
import ModernUniversityPrograms from './pages/education/ModernUniversityPrograms';

// Professional Growth Pages (Modern)
import ModernAnalytics from './pages/professional-growth/ModernAnalytics';

// Lifelong Engagement Pages (Modern)
import ModernCommunities from './pages/lifelong-engagement/ModernCommunities';

// Existing Pages (to be gradually updated)
import CandidateDashboard from './pages/CandidateDashboard';
import AuthPage from './pages/AuthPage';

// Import CSS
import './styles/design-system.css';
import './styles/enhanced-rtl.css';
import './index.css';

const App: React.FC = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <EnhancedLanguageProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <EnhancedHybridGovernmentNav />
            
            <Routes>
              {/* Home Page */}
              <Route path="/" element={<EnhancedHomePage />} />
              
              {/* Authentication */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              
              {/* Dashboard */}
              <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
              
              {/* Career Entry Pages - Modern Design */}
              <Route path="/career-planning-hub" element={<ModernCareerPlanningHub />} />
              <Route path="/industry-exploration" element={<ModernIndustryExploration />} />
              <Route path="/financial-planning" element={<ModernCareerPlanningHub />} />
              <Route path="/cv-builder" element={<ModernCVBuilder />} />
              <Route path="/portfolio" element={<ModernCareerPlanningHub />} />
              <Route path="/interview-preparation" element={<ModernCareerPlanningHub />} />
              <Route path="/internships" element={<ModernCareerPlanningHub />} />
              <Route path="/job-matching" element={<ModernCareerPlanningHub />} />
              
              {/* Education Pathway Pages - Modern Design */}
              <Route path="/school-programs" element={<ModernSchoolPrograms />} />
              <Route path="/summer-camps" element={<ModernSchoolPrograms />} />
              <Route path="/scholarships" element={<ModernSchoolPrograms />} />
              <Route path="/university-programs" element={<ModernUniversityPrograms />} />
              <Route path="/graduate-programs" element={<ModernUniversityPrograms />} />
              <Route path="/learning-management" element={<ModernUniversityPrograms />} />
              
              {/* Professional Growth Pages - Modern Design */}
              <Route path="/analytics" element={<ModernAnalytics />} />
              <Route path="/training-programs" element={<ModernAnalytics />} />
              <Route path="/certifications" element={<ModernAnalytics />} />
              <Route path="/skill-assessments" element={<ModernAnalytics />} />
              <Route path="/mentorship" element={<ModernAnalytics />} />
              <Route path="/leadership-development" element={<ModernAnalytics />} />
              
              {/* Lifelong Engagement Pages - Modern Design */}
              <Route path="/communities" element={<ModernCommunities />} />
              <Route path="/networking" element={<ModernCommunities />} />
              <Route path="/alumni-network" element={<ModernCommunities />} />
              <Route path="/events" element={<ModernCommunities />} />
              <Route path="/volunteer-opportunities" element={<ModernCommunities />} />
              <Route path="/retirement-planning" element={<ModernCommunities />} />
              
              {/* Persona-Specific Routes */}
              <Route path="/job-seeker/*" element={<CandidateDashboard />} />
              <Route path="/hr-recruiter/*" element={<ModernAnalytics />} />
              <Route path="/mentor/*" element={<ModernAnalytics />} />
              <Route path="/educator/*" element={<ModernAnalytics />} />
              <Route path="/assessor/*" element={<ModernAnalytics />} />
              
              {/* Fallback Route */}
              <Route path="*" element={<EnhancedHomePage />} />
            </Routes>
          </div>
        </Router>
      </EnhancedLanguageProvider>
    </I18nextProvider>
  );
};

export default App;
