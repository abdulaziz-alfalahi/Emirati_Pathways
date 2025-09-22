import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Target, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Award, 
  BarChart3,
  MapPin,
  DollarSign,
  Clock,
  Star,
  ChevronRight,
  Play,
  BookOpen,
  Lightbulb,
  CheckCircle
} from 'lucide-react';

const FunctionalCareerPlanningHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('explorer');
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);

  // UAE-specific career data
  const careerPaths = [
    {
      id: 'technology',
      title: 'Technology & Innovation',
      description: 'Lead UAE\'s digital transformation with cutting-edge technology careers',
      averageSalary: 'AED 120,000 - 250,000',
      growthRate: '+18%',
      jobCount: '2,500+',
      icon: <TrendingUp className="h-8 w-8 text-blue-600" />,
      color: 'blue',
      skills: ['AI/ML', 'Cloud Computing', 'Cybersecurity', 'Blockchain', 'IoT'],
      companies: ['Emirates NBD', 'ADNOC', 'Dubai Future Foundation', 'Careem', 'Noon'],
      locations: ['Dubai', 'Abu Dhabi', 'Sharjah']
    },
    {
      id: 'healthcare',
      title: 'Healthcare & Life Sciences',
      description: 'Contribute to UAE\'s world-class healthcare system and medical innovation',
      averageSalary: 'AED 95,000 - 180,000',
      growthRate: '+15%',
      jobCount: '1,800+',
      icon: <Users className="h-8 w-8 text-green-600" />,
      color: 'green',
      skills: ['Clinical Care', 'Medical Research', 'Health Tech', 'Telemedicine', 'Public Health'],
      companies: ['Cleveland Clinic Abu Dhabi', 'Dubai Health Authority', 'Mediclinic', 'NMC Healthcare'],
      locations: ['Dubai', 'Abu Dhabi', 'Ras Al Khaimah']
    },
    {
      id: 'finance',
      title: 'Finance & Banking',
      description: 'Shape the future of Islamic finance and fintech in the regional hub',
      averageSalary: 'AED 100,000 - 200,000',
      growthRate: '+12%',
      jobCount: '1,500+',
      icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
      color: 'purple',
      skills: ['Islamic Finance', 'Investment Banking', 'Fintech', 'Risk Management', 'Wealth Management'],
      companies: ['Emirates NBD', 'ADCB', 'FAB', 'Dubai Islamic Bank', 'ENBD Capital'],
      locations: ['Dubai', 'Abu Dhabi', 'DIFC']
    },
    {
      id: 'energy',
      title: 'Energy & Sustainability',
      description: 'Drive UAE\'s clean energy transition and sustainable development goals',
      averageSalary: 'AED 110,000 - 220,000',
      growthRate: '+20%',
      jobCount: '1,200+',
      icon: <Target className="h-8 w-8 text-orange-600" />,
      color: 'orange',
      skills: ['Renewable Energy', 'Oil & Gas', 'Nuclear Energy', 'Carbon Management', 'Smart Grid'],
      companies: ['ADNOC', 'ENOC', 'Masdar', 'EWEC', 'Dubai Electricity & Water Authority'],
      locations: ['Abu Dhabi', 'Dubai', 'Fujairah']
    },
    {
      id: 'aerospace',
      title: 'Aerospace & Aviation',
      description: 'Excel in UAE\'s world-leading aviation and space exploration sectors',
      averageSalary: 'AED 105,000 - 190,000',
      growthRate: '+14%',
      jobCount: '900+',
      icon: <Award className="h-8 w-8 text-red-600" />,
      color: 'red',
      skills: ['Aircraft Engineering', 'Space Technology', 'Aviation Management', 'Drone Technology', 'Satellite Systems'],
      companies: ['Emirates', 'Etihad Airways', 'UAE Space Agency', 'Strata Manufacturing', 'Sanad'],
      locations: ['Dubai', 'Abu Dhabi', 'Al Ain']
    },
    {
      id: 'tourism',
      title: 'Tourism & Hospitality',
      description: 'Create exceptional experiences in UAE\'s thriving tourism industry',
      averageSalary: 'AED 75,000 - 150,000',
      growthRate: '+16%',
      jobCount: '2,000+',
      icon: <Briefcase className="h-8 w-8 text-teal-600" />,
      color: 'teal',
      skills: ['Hotel Management', 'Event Planning', 'Cultural Tourism', 'Digital Marketing', 'Guest Experience'],
      companies: ['Jumeirah Group', 'Rotana', 'Emaar Hospitality', 'Dubai Tourism', 'Louvre Abu Dhabi'],
      locations: ['Dubai', 'Abu Dhabi', 'Ras Al Khaimah']
    }
  ];

  const assessmentCategories = [
    {
      title: 'Personality Assessment',
      description: 'Discover your work style and ideal environment',
      progress: 0,
      icon: <Users className="h-6 w-6 text-blue-600" />,
      duration: '15 minutes',
      questions: 45
    },
    {
      title: 'Skills Evaluation',
      description: 'Assess your technical and soft skills',
      progress: 0,
      icon: <Target className="h-6 w-6 text-green-600" />,
      duration: '20 minutes',
      questions: 60
    },
    {
      title: 'Career Interests',
      description: 'Identify what motivates and excites you',
      progress: 0,
      icon: <Compass className="h-6 w-6 text-purple-600" />,
      duration: '12 minutes',
      questions: 35
    },
    {
      title: 'Values Alignment',
      description: 'Match careers with your personal values',
      progress: 0,
      icon: <Award className="h-6 w-6 text-orange-600" />,
      duration: '10 minutes',
      questions: 25
    }
  ];

  const marketStats = [
    { label: 'Active Job Openings', value: '12,500+', icon: <Briefcase className="h-5 w-5" />, color: 'blue' },
    { label: 'UAE Companies Hiring', value: '850+', icon: <Users className="h-5 w-5" />, color: 'green' },
    { label: 'Average Salary Growth', value: '+8.5%', icon: <TrendingUp className="h-5 w-5" />, color: 'purple' },
    { label: 'Remote Opportunities', value: '3,200+', icon: <MapPin className="h-5 w-5" />, color: 'orange' }
  ];

  const startAssessment = (category: string) => {
    alert(`Starting ${category} assessment... This would integrate with the backend assessment system.`);
  };

  const exploreCareer = (careerId: string) => {
    setSelectedCareer(careerId);
    alert(`Exploring ${careerPaths.find(c => c.id === careerId)?.title}... This would show detailed career information.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Career Planning Hub</h1>
              <p className="text-lg text-gray-600 mt-2">Discover your path to professional success in the UAE</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">D33 and Talent33</p>
                <p className="text-lg font-semibold text-teal-600">Emiratization Ready</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 via-green-500 to-black rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">UAE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'explorer', label: 'Career Explorer', icon: <Compass className="h-4 w-4" /> },
              { id: 'assessment', label: 'Skills Assessment', icon: <Target className="h-4 w-4" /> },
              { id: 'market', label: 'Job Market', icon: <TrendingUp className="h-4 w-4" /> },
              { id: 'resources', label: 'Resources', icon: <BookOpen className="h-4 w-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Career Explorer Tab */}
        {activeTab === 'explorer' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Explore Career Opportunities in the UAE</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Discover high-growth career paths aligned with D33 and Talent33 and the country's strategic priorities
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {careerPaths.map((career) => (
                <div key={career.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    {career.icon}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${career.color}-100 text-${career.color}-800`}>
                      {career.growthRate} growth
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{career.title}</h3>
                  <p className="text-gray-600 mb-4">{career.description}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Salary Range:</span>
                      <span className="font-medium text-green-600">{career.averageSalary}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Open Positions:</span>
                      <span className="font-medium text-blue-600">{career.jobCount}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Key Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {career.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                      {career.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                          +{career.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => exploreCareer(career.id)}
                    className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Explore Career</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Assessment Tab */}
        {activeTab === 'assessment' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Discover Your Strengths & Potential</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Take comprehensive assessments to understand your skills, interests, and ideal career matches
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {assessmentCategories.map((category, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    {category.icon}
                    <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{category.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="h-4 w-4" />
                      <span>{category.questions} questions</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{category.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${category.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <button
                    onClick={() => startAssessment(category.title)}
                    className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Play className="h-4 w-4" />
                    <span>Start Assessment</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Lightbulb className="h-8 w-8" />
                <h3 className="text-xl font-semibold">AI-Powered Career Matching</h3>
              </div>
              <p className="mb-4">
                Our advanced AI analyzes your assessment results to provide personalized career recommendations 
                tailored to the UAE job market and your unique profile.
              </p>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Powered by Gemini 2.5 Pro</span>
              </div>
            </div>
          </div>
        )}

        {/* Job Market Tab */}
        {activeTab === 'market' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">UAE Job Market Insights</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Real-time data on job opportunities, salary trends, and market demand across the UAE
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {marketStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-${stat.color}-100 mb-4`}>
                    <div className={`text-${stat.color}-600`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Trending Sectors</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: 'Artificial Intelligence', growth: '+25%', jobs: '1,200+' },
                  { name: 'Renewable Energy', growth: '+22%', jobs: '800+' },
                  { name: 'Fintech', growth: '+20%', jobs: '950+' },
                  { name: 'Healthcare Tech', growth: '+18%', jobs: '650+' },
                  { name: 'Space Technology', growth: '+30%', jobs: '300+' },
                  { name: 'Smart Cities', growth: '+16%', jobs: '750+' }
                ].map((sector, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{sector.name}</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium">{sector.growth}</span>
                      <span className="text-gray-600">{sector.jobs} jobs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career Development Resources</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Access tools, guides, and resources to accelerate your career growth in the UAE
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'CV Builder',
                  description: 'Create professional resumes tailored for UAE employers',
                  icon: <Briefcase className="h-8 w-8 text-blue-600" />,
                  action: 'Build CV'
                },
                {
                  title: 'Interview Preparation',
                  description: 'Practice with AI-powered mock interviews',
                  icon: <Users className="h-8 w-8 text-green-600" />,
                  action: 'Start Practice'
                },
                {
                  title: 'Salary Calculator',
                  description: 'Research competitive salaries for your role',
                  icon: <DollarSign className="h-8 w-8 text-purple-600" />,
                  action: 'Calculate'
                },
                {
                  title: 'Skill Development',
                  description: 'Find courses to enhance your capabilities',
                  icon: <BookOpen className="h-8 w-8 text-orange-600" />,
                  action: 'Browse Courses'
                },
                {
                  title: 'Industry Reports',
                  description: 'Stay updated with UAE market trends',
                  icon: <BarChart3 className="h-8 w-8 text-red-600" />,
                  action: 'Read Reports'
                },
                {
                  title: 'Networking Events',
                  description: 'Connect with professionals in your field',
                  icon: <Users className="h-8 w-8 text-teal-600" />,
                  action: 'Find Events'
                }
              ].map((resource, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-6">
                  <div className="mb-4">{resource.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{resource.title}</h3>
                  <p className="text-gray-600 mb-4">{resource.description}</p>
                  <button className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors">
                    {resource.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FunctionalCareerPlanningHub;
