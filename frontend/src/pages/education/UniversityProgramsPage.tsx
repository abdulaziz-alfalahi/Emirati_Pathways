import React, { useState } from 'react';
import { GraduationCap, MapPin, Calendar, Clock, Star, Users, Award, BookOpen, TrendingUp, ExternalLink, Search, Filter, Building, Globe, Briefcase } from 'lucide-react';

interface UniversityProgram {
  id: string;
  title: string;
  degree: 'bachelor' | 'master' | 'phd' | 'diploma';
  university: string;
  location: string;
  duration: string;
  language: 'english' | 'arabic' | 'bilingual';
  tuition: string;
  description: string;
  requirements: string[];
  careerOutcomes: string[];
  subjects: string[];
  rating: number;
  studentsEnrolled: number;
  employmentRate: number;
  averageSalary: string;
  isPopular: boolean;
  isNew: boolean;
  scholarshipAvailable: boolean;
  applicationDeadline: string;
  startDate: string;
  accreditation: string[];
  image: string;
  category: string;
}

interface University {
  id: string;
  name: string;
  location: string;
  type: 'public' | 'private';
  established: number;
  ranking: number;
  studentsCount: number;
  programsCount: number;
  image: string;
  website: string;
  description: string;
  specialties: string[];
}

const UniversityProgramsPage: React.FC = () => {
  const [selectedDegree, setSelectedDegree] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('programs');

  const universityPrograms: UniversityProgram[] = [
    {
      id: '1',
      title: 'Computer Science and Engineering',
      degree: 'bachelor',
      university: 'American University of Sharjah',
      location: 'Sharjah',
      duration: '4 years',
      language: 'english',
      tuition: 'AED 65,000/year',
      description: 'Comprehensive computer science program covering software engineering, artificial intelligence, cybersecurity, and data science with hands-on industry projects.',
      requirements: ['High School Diploma', 'Mathematics grade A-', 'English proficiency (IELTS 6.5)', 'SAT score 1200+'],
      careerOutcomes: ['Software Engineer', 'Data Scientist', 'Cybersecurity Analyst', 'AI Engineer', 'System Architect'],
      subjects: ['Programming', 'Data Structures', 'Machine Learning', 'Cybersecurity', 'Software Engineering'],
      rating: 4.8,
      studentsEnrolled: 1247,
      employmentRate: 96,
      averageSalary: 'AED 120,000 - 180,000',
      isPopular: true,
      isNew: false,
      scholarshipAvailable: true,
      applicationDeadline: '2024-06-30',
      startDate: '2024-09-01',
      accreditation: ['ABET', 'UAE Ministry of Education'],
      image: '💻',
      category: 'Technology'
    },
    {
      id: '2',
      title: 'Medicine and Surgery',
      degree: 'bachelor',
      university: 'UAE University',
      location: 'Al Ain',
      duration: '6 years',
      language: 'english',
      tuition: 'Free for UAE Nationals',
      description: 'Comprehensive medical education program preparing students for medical practice with clinical rotations in UAE hospitals and international medical centers.',
      requirements: ['High School Diploma', 'Biology grade A', 'Chemistry grade A', 'Physics grade B+', 'MCAT score'],
      careerOutcomes: ['General Practitioner', 'Specialist Doctor', 'Surgeon', 'Medical Researcher', 'Hospital Administrator'],
      subjects: ['Anatomy', 'Physiology', 'Pathology', 'Pharmacology', 'Clinical Medicine'],
      rating: 4.9,
      studentsEnrolled: 856,
      employmentRate: 98,
      averageSalary: 'AED 200,000 - 500,000',
      isPopular: true,
      isNew: false,
      scholarshipAvailable: true,
      applicationDeadline: '2024-05-15',
      startDate: '2024-09-01',
      accreditation: ['LCME', 'UAE Ministry of Health'],
      image: '🏥',
      category: 'Healthcare'
    },
    {
      id: '3',
      title: 'Business Administration (MBA)',
      degree: 'master',
      university: 'American University of Dubai',
      location: 'Dubai',
      duration: '2 years',
      language: 'english',
      tuition: 'AED 85,000/year',
      description: 'Executive MBA program designed for working professionals, focusing on strategic management, leadership, and innovation in the Middle East business environment.',
      requirements: ['Bachelor\'s degree', '3+ years work experience', 'GMAT score 550+', 'English proficiency'],
      careerOutcomes: ['CEO/Executive', 'Management Consultant', 'Business Development Manager', 'Entrepreneur', 'Investment Manager'],
      subjects: ['Strategic Management', 'Financial Analysis', 'Marketing Strategy', 'Operations Management', 'Leadership'],
      rating: 4.7,
      studentsEnrolled: 324,
      employmentRate: 94,
      averageSalary: 'AED 180,000 - 350,000',
      isPopular: true,
      isNew: false,
      scholarshipAvailable: false,
      applicationDeadline: '2024-07-31',
      startDate: '2024-09-15',
      accreditation: ['AACSB', 'UAE Ministry of Education'],
      image: '💼',
      category: 'Business'
    },
    {
      id: '4',
      title: 'Renewable Energy Engineering',
      degree: 'bachelor',
      university: 'Masdar Institute (Khalifa University)',
      location: 'Abu Dhabi',
      duration: '4 years',
      language: 'english',
      tuition: 'AED 45,000/year',
      description: 'Cutting-edge engineering program focused on sustainable energy technologies, solar power systems, and environmental engineering aligned with D33 and Talent33.',
      requirements: ['High School Diploma', 'Mathematics grade A', 'Physics grade A-', 'English proficiency'],
      careerOutcomes: ['Renewable Energy Engineer', 'Solar System Designer', 'Environmental Consultant', 'Sustainability Manager'],
      subjects: ['Solar Energy Systems', 'Wind Power', 'Energy Storage', 'Environmental Engineering', 'Sustainable Design'],
      rating: 4.6,
      studentsEnrolled: 567,
      employmentRate: 92,
      averageSalary: 'AED 110,000 - 160,000',
      isPopular: false,
      isNew: true,
      scholarshipAvailable: true,
      applicationDeadline: '2024-06-15',
      startDate: '2024-09-01',
      accreditation: ['ABET', 'UAE Ministry of Energy'],
      image: '⚡',
      category: 'Engineering'
    },
    {
      id: '5',
      title: 'Arabic Language and Literature',
      degree: 'bachelor',
      university: 'United Arab Emirates University',
      location: 'Al Ain',
      duration: '4 years',
      language: 'arabic',
      tuition: 'Free for UAE Nationals',
      description: 'Comprehensive Arabic language and literature program preserving UAE cultural heritage while preparing students for careers in education, media, and cultural affairs.',
      requirements: ['High School Diploma', 'Arabic language proficiency', 'Literature appreciation test'],
      careerOutcomes: ['Arabic Teacher', 'Translator', 'Journalist', 'Cultural Affairs Officer', 'Media Specialist'],
      subjects: ['Classical Arabic', 'Modern Arabic Literature', 'Poetry', 'Linguistics', 'Islamic Studies'],
      rating: 4.5,
      studentsEnrolled: 423,
      employmentRate: 89,
      averageSalary: 'AED 80,000 - 120,000',
      isPopular: false,
      isNew: false,
      scholarshipAvailable: true,
      applicationDeadline: '2024-07-15',
      startDate: '2024-09-01',
      accreditation: ['UAE Ministry of Education', 'Arab League Educational Organization'],
      image: '📚',
      category: 'Arts & Humanities'
    },
    {
      id: '6',
      title: 'Aviation Management',
      degree: 'bachelor',
      university: 'Emirates Aviation University',
      location: 'Dubai',
      duration: '4 years',
      language: 'english',
      tuition: 'AED 75,000/year',
      description: 'Specialized aviation program covering airline operations, airport management, and aviation safety, with partnerships with Emirates Airlines and Dubai Airports.',
      requirements: ['High School Diploma', 'Mathematics grade B+', 'English proficiency', 'Medical fitness'],
      careerOutcomes: ['Airport Manager', 'Airline Operations Manager', 'Aviation Safety Officer', 'Air Traffic Controller'],
      subjects: ['Aviation Operations', 'Airport Management', 'Aviation Safety', 'Air Traffic Control', 'Airline Economics'],
      rating: 4.4,
      studentsEnrolled: 289,
      employmentRate: 91,
      averageSalary: 'AED 95,000 - 150,000',
      isPopular: false,
      isNew: false,
      scholarshipAvailable: false,
      applicationDeadline: '2024-06-01',
      startDate: '2024-09-01',
      accreditation: ['ICAO', 'UAE General Civil Aviation Authority'],
      image: '✈️',
      category: 'Aviation'
    }
  ];

  const universities: University[] = [
    {
      id: '1',
      name: 'United Arab Emirates University',
      location: 'Al Ain',
      type: 'public',
      established: 1976,
      ranking: 1,
      studentsCount: 14000,
      programsCount: 85,
      image: '🏛️',
      website: 'www.uaeu.ac.ae',
      description: 'The UAE\'s flagship university, offering comprehensive programs across all disciplines with a focus on research and innovation.',
      specialties: ['Medicine', 'Engineering', 'Business', 'Education', 'Agriculture']
    },
    {
      id: '2',
      name: 'American University of Sharjah',
      location: 'Sharjah',
      type: 'private',
      established: 1997,
      ranking: 2,
      studentsCount: 6000,
      programsCount: 45,
      image: '🎓',
      website: 'www.aus.edu',
      description: 'Leading private university offering American-style education with strong programs in engineering, business, and liberal arts.',
      specialties: ['Engineering', 'Computer Science', 'Business', 'Architecture', 'Liberal Arts']
    },
    {
      id: '3',
      name: 'Khalifa University',
      location: 'Abu Dhabi',
      type: 'public',
      established: 2007,
      ranking: 3,
      studentsCount: 3000,
      programsCount: 35,
      image: '🔬',
      website: 'www.ku.ac.ae',
      description: 'Research-intensive university focusing on science, engineering, and technology with world-class facilities.',
      specialties: ['Engineering', 'Science', 'Medicine', 'Technology', 'Research']
    },
    {
      id: '4',
      name: 'American University of Dubai',
      location: 'Dubai',
      type: 'private',
      established: 1995,
      ranking: 4,
      studentsCount: 2500,
      programsCount: 25,
      image: '🏢',
      website: 'www.aud.edu',
      description: 'Business-focused university with strong industry connections and practical learning approach.',
      specialties: ['Business', 'Engineering', 'Communication', 'Design', 'Information Technology']
    }
  ];

  const degrees = [
    { id: 'all', name: 'All Degrees', icon: '🎓' },
    { id: 'bachelor', name: 'Bachelor\'s Degree', icon: '📚' },
    { id: 'master', name: 'Master\'s Degree', icon: '🎯' },
    { id: 'phd', name: 'PhD/Doctorate', icon: '👨‍🎓' },
    { id: 'diploma', name: 'Diploma/Certificate', icon: '📜' }
  ];

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'Technology', name: 'Technology & IT' },
    { id: 'Healthcare', name: 'Healthcare & Medicine' },
    { id: 'Business', name: 'Business & Management' },
    { id: 'Engineering', name: 'Engineering' },
    { id: 'Arts & Humanities', name: 'Arts & Humanities' },
    { id: 'Aviation', name: 'Aviation & Aerospace' }
  ];

  const languages = [
    { id: 'all', name: 'All Languages' },
    { id: 'english', name: 'English' },
    { id: 'arabic', name: 'Arabic' },
    { id: 'bilingual', name: 'Bilingual' }
  ];

  const filteredPrograms = universityPrograms.filter(program => {
    const matchesDegree = selectedDegree === 'all' || program.degree === selectedDegree;
    const matchesCategory = selectedCategory === 'all' || program.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'all' || program.language === selectedLanguage;
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDegree && matchesCategory && matchesLanguage && matchesSearch;
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
              placeholder="Search programs, universities, or subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedDegree}
              onChange={(e) => setSelectedDegree(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {degrees.map(degree => (
                <option key={degree.id} value={degree.id}>
                  {degree.icon} {degree.name}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {languages.map(language => (
                <option key={language.id} value={language.id}>
                  {language.name}
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
                      {program.scholarshipAvailable && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-dubai-medium">
                          💰 Scholarship
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{program.university}</p>
                    <p className="text-xs text-gray-500 capitalize">{program.degree} • {program.language}</p>
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
                  <p className="text-xs text-gray-500 mb-1">Employment Rate</p>
                  <p className="text-sm font-dubai-medium text-green-600">{program.employmentRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tuition</p>
                  <p className="text-sm font-dubai-medium">{program.tuition}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                    <p className="text-sm font-dubai-medium">{program.location}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Average Salary</p>
                <p className="text-sm font-dubai-bold text-green-600">{program.averageSalary}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Career Outcomes</p>
                <div className="flex flex-wrap gap-1">
                  {program.careerOutcomes.slice(0, 3).map((career, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {career}
                    </span>
                  ))}
                  {program.careerOutcomes.length > 3 && (
                    <span className="text-gray-500 text-xs">+{program.careerOutcomes.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Accreditation</p>
                <div className="flex flex-wrap gap-1">
                  {program.accreditation.map((acc, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      ✓ {acc}
                    </span>
                  ))}
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

  const renderUniversitiesTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border p-6">
        <h2 className="text-xl font-dubai-bold text-gray-900 mb-2">UAE Universities</h2>
        <p className="text-gray-700">Explore leading higher education institutions in the United Arab Emirates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {universities.map((university) => (
          <div key={university.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4 mb-4">
              <div className="text-3xl">{university.image}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-dubai-bold text-gray-900">{university.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-dubai-medium ${
                    university.type === 'public' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {university.type}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {university.location} • Est. {university.established}
                </div>
                <p className="text-gray-700 text-sm mb-3">{university.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-dubai-bold text-blue-600">#{university.ranking}</div>
                <p className="text-xs text-gray-500">UAE Ranking</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-dubai-bold text-green-600">{university.studentsCount.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Students</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-dubai-bold text-purple-600">{university.programsCount}</div>
                <p className="text-xs text-gray-500">Programs</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Specialties</p>
              <div className="flex flex-wrap gap-1">
                {university.specialties.map((specialty, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-600">
                <Globe className="h-4 w-4 mr-1" />
                {university.website}
              </div>
              <div className="flex space-x-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  View Programs
                </button>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'programs', name: 'University Programs', icon: GraduationCap },
    { id: 'universities', name: 'Universities', icon: Building }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-dubai">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-dubai-bold text-gray-900">University Programs</h1>
              <p className="text-gray-600 mt-2">Explore higher education opportunities in the UAE</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
                🇦🇪 UAE Universities
              </span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
                🎓 Accredited Programs
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
        {activeTab === 'universities' && renderUniversitiesTab()}

        {/* UAE Higher Education Stats */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🇦🇪</span>
            <h3 className="text-lg font-dubai-bold text-gray-900">UAE Higher Education Excellence</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-dubai-bold text-green-600 mb-2">50+</div>
              <p className="text-sm text-gray-700">Universities & Colleges</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-dubai-bold text-blue-600 mb-2">200+</div>
              <p className="text-sm text-gray-700">Degree programs</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-dubai-bold text-purple-600 mb-2">92%</div>
              <p className="text-sm text-gray-700">Graduate employment rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-dubai-bold text-orange-600 mb-2">Free</div>
              <p className="text-sm text-gray-700">Tuition for UAE Nationals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityProgramsPage;
