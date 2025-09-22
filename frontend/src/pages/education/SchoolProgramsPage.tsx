import React, { useState } from 'react';
import { GraduationCap, BookOpen, Users, Award, MapPin, Calendar, Clock, Star, ChevronRight, Search, Filter, Play, Download, ExternalLink, Target, TrendingUp } from 'lucide-react';

interface SchoolProgram {
  id: string;
  title: string;
  description: string;
  level: 'primary' | 'secondary' | 'high_school';
  duration: string;
  subjects: string[];
  careerPaths: string[];
  schools: string[];
  requirements: string[];
  outcomes: string[];
  rating: number;
  studentsEnrolled: number;
  successRate: number;
  isPopular: boolean;
  isNew: boolean;
  image: string;
  provider: string;
  location: string;
  startDate: string;
  applicationDeadline: string;
}

interface CareerPathway {
  id: string;
  name: string;
  description: string;
  requiredSubjects: string[];
  universityPrograms: string[];
  jobOpportunities: string[];
  averageSalary: string;
  growthRate: string;
  icon: string;
}

const SchoolProgramsPage: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('programs');

  const schoolPrograms: SchoolProgram[] = [
    {
      id: '1',
      title: 'Advanced STEM Program',
      description: 'Comprehensive Science, Technology, Engineering, and Mathematics program designed to prepare UAE students for future careers in innovation and technology.',
      level: 'high_school',
      duration: '2 years',
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Engineering Fundamentals'],
      careerPaths: ['Software Engineering', 'Biomedical Engineering', 'Data Science', 'Renewable Energy Engineering'],
      schools: ['Dubai International Academy', 'American School of Dubai', 'GEMS Wellington Academy'],
      requirements: ['Grade 10 completion', 'Mathematics grade B+ or higher', 'Science grade B+ or higher'],
      outcomes: ['University STEM program readiness', 'Industry internship opportunities', 'Research project completion'],
      rating: 4.8,
      studentsEnrolled: 1247,
      successRate: 94,
      isPopular: true,
      isNew: false,
      image: '🔬',
      provider: 'UAE Ministry of Education',
      location: 'Dubai, Abu Dhabi, Sharjah',
      startDate: '2024-09-01',
      applicationDeadline: '2024-06-30'
    },
    {
      id: '2',
      title: 'Arabic Language & Literature Excellence',
      description: 'Advanced Arabic language program focusing on classical and modern Arabic literature, poetry, and linguistic studies to preserve UAE cultural heritage.',
      level: 'secondary',
      duration: '3 years',
      subjects: ['Classical Arabic', 'Modern Arabic Literature', 'Poetry & Rhetoric', 'Islamic Studies', 'UAE History'],
      careerPaths: ['Journalism', 'Translation', 'Education', 'Cultural Affairs', 'Media & Communications'],
      schools: ['Al Mawakeb School', 'Dubai National School', 'Sharjah American International School'],
      requirements: ['Grade 8 completion', 'Arabic language proficiency', 'Cultural studies interest'],
      outcomes: ['Advanced Arabic fluency', 'Cultural preservation skills', 'Communication excellence'],
      rating: 4.6,
      studentsEnrolled: 892,
      successRate: 91,
      isPopular: false,
      isNew: true,
      image: '📚',
      provider: 'UAE Cultural Foundation',
      location: 'All Emirates',
      startDate: '2024-09-01',
      applicationDeadline: '2024-07-15'
    },
    {
      id: '3',
      title: 'Business & Entrepreneurship Track',
      description: 'Innovative business education program teaching entrepreneurship, financial literacy, and business management skills aligned with D33 and Talent33.',
      level: 'high_school',
      duration: '2 years',
      subjects: ['Business Studies', 'Economics', 'Accounting', 'Marketing', 'Entrepreneurship', 'Digital Commerce'],
      careerPaths: ['Business Management', 'Entrepreneurship', 'Finance', 'Marketing', 'E-commerce'],
      schools: ['GEMS World Academy', 'Repton School Dubai', 'Brighton College Dubai'],
      requirements: ['Grade 10 completion', 'Mathematics grade B or higher', 'English proficiency'],
      outcomes: ['Business plan development', 'Financial literacy certification', 'Startup incubation access'],
      rating: 4.7,
      studentsEnrolled: 756,
      successRate: 88,
      isPopular: true,
      isNew: false,
      image: '💼',
      provider: 'Dubai Chamber of Commerce',
      location: 'Dubai, Abu Dhabi',
      startDate: '2024-09-01',
      applicationDeadline: '2024-06-15'
    },
    {
      id: '4',
      title: 'Environmental Sciences & Sustainability',
      description: 'Cutting-edge environmental program focusing on sustainability, renewable energy, and environmental conservation in line with UAE Green Agenda 2030.',
      level: 'secondary',
      duration: '2 years',
      subjects: ['Environmental Science', 'Renewable Energy', 'Marine Biology', 'Climate Studies', 'Sustainable Development'],
      careerPaths: ['Environmental Engineering', 'Marine Conservation', 'Renewable Energy', 'Environmental Consulting'],
      schools: ['Dubai British School', 'American University of Sharjah Preparatory', 'Jumeirah College'],
      requirements: ['Grade 9 completion', 'Science grade B+ or higher', 'Environmental awareness'],
      outcomes: ['Environmental project completion', 'Sustainability certification', 'Research publication'],
      rating: 4.5,
      studentsEnrolled: 634,
      successRate: 92,
      isPopular: false,
      isNew: true,
      image: '🌱',
      provider: 'UAE Ministry of Climate Change',
      location: 'Dubai, Abu Dhabi, Ras Al Khaimah',
      startDate: '2024-09-01',
      applicationDeadline: '2024-07-01'
    },
    {
      id: '5',
      title: 'Digital Arts & Creative Media',
      description: 'Modern creative program combining traditional arts with digital media, animation, and multimedia design for the creative economy.',
      level: 'high_school',
      duration: '2 years',
      subjects: ['Digital Design', 'Animation', 'Video Production', 'Graphic Design', 'Creative Writing', 'Art History'],
      careerPaths: ['Graphic Design', 'Animation', 'Film Production', 'Digital Marketing', 'Game Design'],
      schools: ['GEMS Modern Academy', 'Dubai International Academy', 'American School of Creative Science'],
      requirements: ['Grade 10 completion', 'Portfolio submission', 'Creative aptitude test'],
      outcomes: ['Professional portfolio', 'Industry software certification', 'Creative project showcase'],
      rating: 4.4,
      studentsEnrolled: 523,
      successRate: 86,
      isPopular: false,
      isNew: false,
      image: '🎨',
      provider: 'Dubai Design District',
      location: 'Dubai, Sharjah',
      startDate: '2024-09-01',
      applicationDeadline: '2024-06-01'
    },
    {
      id: '6',
      title: 'Health Sciences Preparatory',
      description: 'Pre-medical and health sciences program preparing students for careers in healthcare, medicine, and biomedical research.',
      level: 'high_school',
      duration: '2 years',
      subjects: ['Biology', 'Chemistry', 'Physics', 'Health Sciences', 'Medical Ethics', 'Anatomy & Physiology'],
      careerPaths: ['Medicine', 'Nursing', 'Pharmacy', 'Biomedical Engineering', 'Public Health'],
      schools: ['American University of Sharjah Preparatory', 'Dubai Medical College Prep', 'RAK Medical School Prep'],
      requirements: ['Grade 10 completion', 'Science grades A- or higher', 'Healthcare interest'],
      outcomes: ['Medical school readiness', 'Healthcare internship', 'Research project completion'],
      rating: 4.9,
      studentsEnrolled: 1156,
      successRate: 96,
      isPopular: true,
      isNew: false,
      image: '🏥',
      provider: 'UAE Ministry of Health',
      location: 'Dubai, Abu Dhabi, Ras Al Khaimah',
      startDate: '2024-09-01',
      applicationDeadline: '2024-05-30'
    }
  ];

  const careerPathways: CareerPathway[] = [
    {
      id: '1',
      name: 'Technology & Innovation',
      description: 'Leading the UAE\'s digital transformation through software development, AI, and emerging technologies.',
      requiredSubjects: ['Mathematics', 'Computer Science', 'Physics'],
      universityPrograms: ['Computer Science', 'Software Engineering', 'Data Science', 'Artificial Intelligence'],
      jobOpportunities: ['Software Developer', 'Data Scientist', 'AI Engineer', 'Cybersecurity Specialist'],
      averageSalary: 'AED 120,000 - 250,000',
      growthRate: '+18%',
      icon: '💻'
    },
    {
      id: '2',
      name: 'Healthcare & Medicine',
      description: 'Contributing to UAE\'s world-class healthcare system through medical practice and research.',
      requiredSubjects: ['Biology', 'Chemistry', 'Physics', 'Mathematics'],
      universityPrograms: ['Medicine', 'Nursing', 'Pharmacy', 'Biomedical Engineering'],
      jobOpportunities: ['Doctor', 'Nurse', 'Pharmacist', 'Medical Researcher'],
      averageSalary: 'AED 150,000 - 400,000',
      growthRate: '+15%',
      icon: '🏥'
    },
    {
      id: '3',
      name: 'Business & Finance',
      description: 'Driving economic growth through business leadership, financial services, and entrepreneurship.',
      requiredSubjects: ['Mathematics', 'Economics', 'Business Studies'],
      universityPrograms: ['Business Administration', 'Finance', 'Economics', 'Marketing'],
      jobOpportunities: ['Business Analyst', 'Financial Advisor', 'Entrepreneur', 'Marketing Manager'],
      averageSalary: 'AED 100,000 - 300,000',
      growthRate: '+12%',
      icon: '💼'
    },
    {
      id: '4',
      name: 'Renewable Energy',
      description: 'Supporting UAE\'s clean energy goals through sustainable technology and environmental solutions.',
      requiredSubjects: ['Physics', 'Chemistry', 'Mathematics', 'Environmental Science'],
      universityPrograms: ['Renewable Energy Engineering', 'Environmental Science', 'Sustainable Development'],
      jobOpportunities: ['Solar Engineer', 'Environmental Consultant', 'Sustainability Manager'],
      averageSalary: 'AED 110,000 - 220,000',
      growthRate: '+20%',
      icon: '⚡'
    }
  ];

  const levels = [
    { id: 'all', name: 'All Levels', icon: '🎓' },
    { id: 'primary', name: 'Primary (Grades 1-5)', icon: '📝' },
    { id: 'secondary', name: 'Secondary (Grades 6-9)', icon: '📖' },
    { id: 'high_school', name: 'High School (Grades 10-12)', icon: '🎯' }
  ];

  const subjects = [
    { id: 'all', name: 'All Subjects' },
    { id: 'Mathematics', name: 'Mathematics' },
    { id: 'Science', name: 'Science' },
    { id: 'Arabic', name: 'Arabic Language' },
    { id: 'Business', name: 'Business Studies' },
    { id: 'Arts', name: 'Arts & Design' },
    { id: 'Technology', name: 'Technology' }
  ];

  const filteredPrograms = schoolPrograms.filter(program => {
    const matchesLevel = selectedLevel === 'all' || program.level === selectedLevel;
    const matchesSubject = selectedSubject === 'all' || 
                          program.subjects.some(subject => 
                            subject.toLowerCase().includes(selectedSubject.toLowerCase())
                          );
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.subjects.some(subject => 
                           subject.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    return matchesLevel && matchesSubject && matchesSearch;
  });

  const renderProgramsTab = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search programs, subjects, or schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {levels.map(level => (
                <option key={level.id} value={level.id}>
                  {level.icon} {level.name}
                </option>
              ))}
            </select>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPrograms.map((program) => (
          <div key={program.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{program.image}</div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-dubai-bold text-gray-900">{program.title}</h3>
                      {program.isPopular && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-dubai-medium">
                          Popular
                        </span>
                      )}
                      {program.isNew && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-dubai-medium">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{program.provider}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center mb-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                    <span className="text-sm font-dubai-medium">{program.rating}</span>
                  </div>
                  <p className="text-xs text-gray-500">{program.studentsEnrolled} students</p>
                </div>
              </div>

              <p className="text-gray-700 text-sm mb-4 line-clamp-2">{program.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Duration</p>
                  <p className="text-sm font-dubai-medium">{program.duration}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                  <p className="text-sm font-dubai-medium text-green-600">{program.successRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Level</p>
                  <p className="text-sm font-dubai-medium capitalize">{program.level.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="text-sm font-dubai-medium">{program.location}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Key Subjects</p>
                <div className="flex flex-wrap gap-1">
                  {program.subjects.slice(0, 3).map((subject, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {subject}
                    </span>
                  ))}
                  {program.subjects.length > 3 && (
                    <span className="text-gray-500 text-xs">+{program.subjects.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Career Paths</p>
                <div className="flex flex-wrap gap-1">
                  {program.careerPaths.slice(0, 2).map((path, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {path}
                    </span>
                  ))}
                  {program.careerPaths.length > 2 && (
                    <span className="text-gray-500 text-xs">+{program.careerPaths.length - 2} more</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  <span className="font-dubai-medium">Apply by:</span> {new Date(program.applicationDeadline).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Learn More
                  </button>
                  <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCareerPathwaysTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border p-6">
        <h2 className="text-xl font-dubai-bold text-gray-900 mb-2">Career Pathway Planning</h2>
        <p className="text-gray-700">Explore how your school subjects connect to future career opportunities in the UAE.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {careerPathways.map((pathway) => (
          <div key={pathway.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4 mb-4">
              <div className="text-3xl">{pathway.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-dubai-bold text-gray-900 mb-2">{pathway.name}</h3>
                <p className="text-gray-700 text-sm mb-4">{pathway.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-dubai-medium text-gray-900 mb-2">Required School Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {pathway.requiredSubjects.map((subject, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-dubai-medium text-gray-900 mb-2">University Programs</p>
                <div className="flex flex-wrap gap-2">
                  {pathway.universityPrograms.slice(0, 2).map((program, index) => (
                    <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                      {program}
                    </span>
                  ))}
                  {pathway.universityPrograms.length > 2 && (
                    <span className="text-gray-500 text-xs">+{pathway.universityPrograms.length - 2} more</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-dubai-medium text-gray-900 mb-2">Job Opportunities</p>
                <div className="flex flex-wrap gap-2">
                  {pathway.jobOpportunities.slice(0, 2).map((job, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {job}
                    </span>
                  ))}
                  {pathway.jobOpportunities.length > 2 && (
                    <span className="text-gray-500 text-xs">+{pathway.jobOpportunities.length - 2} more</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Average Salary</p>
                  <p className="text-sm font-dubai-bold text-green-600">{pathway.averageSalary}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Growth Rate</p>
                  <p className="text-sm font-dubai-bold text-blue-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {pathway.growthRate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'programs', name: 'School Programs', icon: GraduationCap },
    { id: 'pathways', name: 'Career Pathways', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-dubai">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-dubai-bold text-gray-900">School Programs</h1>
              <p className="text-gray-600 mt-2">Discover educational pathways for UAE National students</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
                🇦🇪 UAE Curriculum
              </span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
                📚 Ministry Approved
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-dubai-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'programs' && renderProgramsTab()}
        {activeTab === 'pathways' && renderCareerPathwaysTab()}

        {/* UAE Education System Info */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🇦🇪</span>
            <h3 className="text-lg font-dubai-bold text-gray-900">UAE Education Excellence</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-dubai-bold text-green-600 mb-2">95%</div>
              <p className="text-sm text-gray-700">Student satisfaction rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-dubai-bold text-blue-600 mb-2">1,200+</div>
              <p className="text-sm text-gray-700">Schools nationwide</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-dubai-bold text-purple-600 mb-2">15+</div>
              <p className="text-sm text-gray-700">Career pathway options</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolProgramsPage;
