
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './context/QueryContext';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import { ErrorBoundary } from './components/ui/error-boundary';

// Pages - Updated import paths to match actual file structure
import Home from './pages/home';
import Dashboard from './pages/dashboard';
import AuthPage from './pages/auth';
import CareerAdvisory from './pages/career-advisory';
import Training from './pages/training';
import Jobs from './pages/job-matching';
import Internships from './pages/internships';
import CareerJourney from './pages/career-journey';
import Portfolio from './pages/portfolio';
import Communities from './pages/communities/analytics';
import Analytics from './pages/analytics';
import DigitalSkills from './pages/digital-skills';
import ProfessionalCertifications from './pages/professional-certifications';
import MentorshipPrograms from './pages/mentorship';
import GraduatePrograms from './pages/graduate-programs';
import LegacyProjects from './pages/legacy-projects';
import AdvisoryPositions from './pages/advisory-positions';
import CommunityLeadership from './pages/community-leadership';
import NationalService from './pages/national-service';
import IndustryExploration from './pages/industry-exploration';
import InterviewPreparation from './pages/interview-preparation';
import JobMatching from './pages/job-matching';
import CareerComparison from './pages/career-comparison';
import AssessmentsPage from './pages/assessments';
import CollaborativeAssessments from './pages/collaborative-assessments';
import CVBuilder from './pages/cv-builder';
import BecomeMentor from './pages/become-mentor';
import MentorMatching from './pages/mentor-matching';
import Blockchain from './pages/blockchain-credentials';
import LMS from './pages/lms';
import Settings from './pages/not-found'; // Placeholder - adjust if actual page exists
import Profile from './pages/profile';
import Admin from './pages/not-found'; // Placeholder - adjust if actual page exists
import SummerCamps from './pages/summer-camps';
import SchoolPrograms from './pages/school-programs';
import Scholarships from './pages/scholarships';
import UniversityPrograms from './pages/university-programs';
import CareerPlanningHubPage from './pages/career-planning-hub';
import ResumeBuilderPage from './pages/resume-builder';
import YouthDevelopment from './pages/youth-development';
import SuccessStoriesPage from './pages/success-stories';
import ThoughtLeadershipPage from './pages/thought-leadership';
import FinancialPlanningPage from './pages/financial-planning';
import RetireeServicesPage from './pages/retiree';

// Error fallback component
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Reload Page
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary fallback={<ErrorFallback error={new Error('Application error')} />}>
      <QueryProvider>
        <AuthProvider>
          <RoleProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/career-advisory" element={<CareerAdvisory />} />
                <Route path="/career-planning-hub" element={<CareerPlanningHubPage />} />
                <Route path="/training" element={<Training />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/internships" element={<Internships />} />
                <Route path="/career-journey" element={<CareerJourney />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/digital-skills" element={<DigitalSkills />} />
                <Route path="/digital-skills-development" element={<DigitalSkills />} />
                <Route path="/professional-certifications" element={<ProfessionalCertifications />} />
                <Route path="/mentorship" element={<MentorshipPrograms />} />
                <Route path="/graduate-programs" element={<GraduatePrograms />} />
                <Route path="/university-programs" element={<UniversityPrograms />} />
                <Route path="/legacy-projects" element={<LegacyProjects />} />
                <Route path="/advisory-positions" element={<AdvisoryPositions />} />
                <Route path="/community-leadership" element={<CommunityLeadership />} />
                <Route path="/national-service" element={<NationalService />} />
                <Route path="/industry-exploration" element={<IndustryExploration />} />
                <Route path="/interview-preparation" element={<InterviewPreparation />} />
                <Route path="/job-matching" element={<JobMatching />} />
                <Route path="/career-comparison" element={<CareerComparison />} />
                <Route path="/assessments" element={<AssessmentsPage />} />
                <Route path="/collaborative-assessments" element={<CollaborativeAssessments />} />
                <Route path="/cv-builder" element={<CVBuilder />} />
                <Route path="/resume-builder" element={<ResumeBuilderPage />} />
                <Route path="/become-mentor" element={<BecomeMentor />} />
                <Route path="/mentor-matching" element={<MentorMatching />} />
                <Route path="/blockchain" element={<Blockchain />} />
                <Route path="/blockchain-credentials" element={<Blockchain />} />
                <Route path="/lms" element={<LMS />} />
                <Route path="/summer-camps" element={<SummerCamps />} />
                <Route path="/school-programs" element={<SchoolPrograms />} />
                <Route path="/scholarships" element={<Scholarships />} />
                <Route path="/youth-development" element={<YouthDevelopment />} />
                <Route path="/share-success-stories" element={<SuccessStoriesPage />} />
                <Route path="/success-stories" element={<SuccessStoriesPage />} />
                <Route path="/thought-leadership" element={<ThoughtLeadershipPage />} />
                <Route path="/financial-planning" element={<FinancialPlanningPage />} />
                <Route path="/retiree" element={<RetireeServicesPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </Router>
          </RoleProvider>
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
