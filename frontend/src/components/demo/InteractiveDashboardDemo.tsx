import React, { useState, useEffect } from 'react';
import { X, Play, Pause, SkipForward, SkipBack, Users, BarChart3, Settings, BookOpen, UserCheck, Shield } from 'lucide-react';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  dashboard: string;
}

interface InteractiveDashboardDemoProps {
  isOpen: boolean;
  onClose: () => void;
}

const demoSteps: DemoStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Emirati Pathways Demo',
    description: 'Experience how our AI-powered platform transforms career development for UAE nationals. We\'ll guide you through different user dashboards.',
    targetSelector: '.demo-container',
    position: 'top',
    dashboard: 'intro'
  },
  {
    id: 'candidate-overview',
    title: 'Candidate Dashboard Overview',
    description: 'This is Ahmed\'s dashboard - a recent engineering graduate. See how he manages his career journey with personalized recommendations.',
    targetSelector: '.dashboard-header',
    position: 'bottom',
    dashboard: 'candidate'
  },
  {
    id: 'candidate-profile',
    title: 'AI-Powered Profile',
    description: 'Our AI analyzes Ahmed\'s skills, experience, and career goals to create a comprehensive professional profile.',
    targetSelector: '.profile-section',
    position: 'right',
    dashboard: 'candidate'
  },
  {
    id: 'job-matching',
    title: 'Smart Job Matching',
    description: 'See personalized job recommendations with 95% compatibility scores based on skills, culture fit, and career trajectory.',
    targetSelector: '.job-recommendations',
    position: 'left',
    dashboard: 'candidate'
  },
  {
    id: 'hr-dashboard',
    title: 'HR Manager Dashboard',
    description: 'Now let\'s see Sara\'s perspective - an HR Manager at Emirates NBD managing talent acquisition for 50+ positions.',
    targetSelector: '.dashboard-header',
    position: 'bottom',
    dashboard: 'hr'
  },
  {
    id: 'recruitment-pipeline',
    title: 'Recruitment Pipeline',
    description: 'Track candidates through the entire hiring process with automated workflows and collaborative evaluation tools.',
    targetSelector: '.pipeline-section',
    position: 'right',
    dashboard: 'hr'
  },
  {
    id: 'analytics-metrics',
    title: 'Hiring Analytics',
    description: 'Comprehensive analytics ensure Emiratization compliance while providing insights to improve recruitment strategies.',
    targetSelector: '.analytics-section',
    position: 'left',
    dashboard: 'hr'
  },
  {
    id: 'recruiter-tools',
    title: 'Recruiter Dashboard',
    description: 'Omar uses advanced sourcing tools to find the perfect candidates with AI-powered matching and diversity tracking.',
    targetSelector: '.dashboard-header',
    position: 'bottom',
    dashboard: 'recruiter'
  },
  {
    id: 'mentor-impact',
    title: 'Mentor Dashboard',
    description: 'Khalid tracks his mentoring impact with 89% career advancement success rate across 18 active mentees.',
    targetSelector: '.dashboard-header',
    position: 'bottom',
    dashboard: 'mentor'
  },
  {
    id: 'demo-complete',
    title: 'Demo Complete!',
    description: 'You\'ve experienced how Emirati Pathways supports D33 and Talent33 initiatives. Ready to start your journey?',
    targetSelector: '.demo-container',
    position: 'top',
    dashboard: 'complete'
  }
];

const dashboardRoutes = {
  candidate: '/candidate-dashboard',
  hr: '/hr-dashboard',
  recruiter: '/recruiter-dashboard',
  mentor: '/mentor-dashboard',
  educator: '/educator-dashboard',
  assessor: '/assessor-dashboard',
  admin: '/admin-dashboard'
};

export const InteractiveDashboardDemo: React.FC<InteractiveDashboardDemoProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState('intro');

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsPlaying(false);
      setCurrentDashboard('intro');
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStep < demoSteps.length - 1) {
      interval = setInterval(() => {
        nextStep();
      }, 4000); // 4 seconds per step
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep]);

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      
      // Navigate to appropriate dashboard
      const step = demoSteps[newStep];
      if (step.dashboard !== currentDashboard && step.dashboard !== 'intro' && step.dashboard !== 'complete') {
        setCurrentDashboard(step.dashboard);
        if (dashboardRoutes[step.dashboard as keyof typeof dashboardRoutes]) {
          window.location.href = dashboardRoutes[step.dashboard as keyof typeof dashboardRoutes];
        }
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      
      // Navigate to appropriate dashboard
      const step = demoSteps[newStep];
      if (step.dashboard !== currentDashboard && step.dashboard !== 'intro' && step.dashboard !== 'complete') {
        setCurrentDashboard(step.dashboard);
        if (dashboardRoutes[step.dashboard as keyof typeof dashboardRoutes]) {
          window.location.href = dashboardRoutes[step.dashboard as keyof typeof dashboardRoutes];
        }
      }
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const currentStepData = demoSteps[currentStep];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="demo-container bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Demo Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">Interactive Platform Demo</h2>
              <p className="text-teal-100">Experience the power of AI-driven career development</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-teal-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-teal-100 mb-2">
              <span>Step {currentStep + 1} of {demoSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / demoSteps.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-teal-700 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="p-6">
          {/* Current Step Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">{currentStepData.title}</h3>
            <p className="text-gray-600 leading-relaxed">{currentStepData.description}</p>
          </div>

          {/* Dashboard Preview */}
          {currentStepData.dashboard === 'intro' && (
            <div className="text-center py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col items-center p-4 bg-teal-50 rounded-lg">
                  <Users className="text-teal-600 mb-2" size={32} />
                  <span className="text-sm font-medium">Candidates</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-emerald-50 rounded-lg">
                  <BarChart3 className="text-emerald-600 mb-2" size={32} />
                  <span className="text-sm font-medium">HR Managers</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                  <BookOpen className="text-blue-600 mb-2" size={32} />
                  <span className="text-sm font-medium">Educators</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
                  <UserCheck className="text-purple-600 mb-2" size={32} />
                  <span className="text-sm font-medium">Mentors</span>
                </div>
              </div>
              <p className="text-gray-600">Seven specialized dashboards for the complete UAE career ecosystem</p>
            </div>
          )}

          {currentStepData.dashboard === 'complete' && (
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg p-8 mb-6">
                <h4 className="text-2xl font-bold text-gray-800 mb-4">Ready to Transform Your Career?</h4>
                <p className="text-gray-600 mb-6">Join thousands of UAE nationals already succeeding on our platform</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-teal-600">15,000+</div>
                    <div className="text-sm text-gray-600">Job Placements</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">8,000+</div>
                    <div className="text-sm text-gray-600">Mentorship Pairs</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">94%</div>
                    <div className="text-sm text-gray-600">User Satisfaction</div>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-emerald-700 transition-all"
              >
                Start Your Journey
              </button>
            </div>
          )}

          {/* Demo Controls */}
          <div className="flex justify-center items-center space-x-4 mt-6">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SkipBack size={16} />
              <span>Previous</span>
            </button>

            <button
              onClick={togglePlay}
              className="flex items-center space-x-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={nextStep}
              disabled={currentStep === demoSteps.length - 1}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <SkipForward size={16} />
            </button>
          </div>

          {/* Dashboard Navigation Hint */}
          {currentStepData.dashboard !== 'intro' && currentStepData.dashboard !== 'complete' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-blue-800 text-sm">
                💡 <strong>Tip:</strong> This demo will automatically navigate between dashboards. 
                You can also explore each dashboard manually using the persona switcher.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveDashboardDemo;
