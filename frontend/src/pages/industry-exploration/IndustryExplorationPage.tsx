import React, { useState } from 'react';
import { Search, TrendingUp, MapPin, Users, DollarSign, Calendar, Building, Award, ChevronRight, Filter, Star } from 'lucide-react';

const IndustryExplorationPage: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEmirate, setSelectedEmirate] = useState<string>('all');

  const industries = [
    {
      id: 'technology',
      name: 'Technology & Innovation',
      icon: '💻',
      growth: '+18%',
      jobs: '2,500+',
      avgSalary: 'AED 120K-250K',
      topCompanies: ['Careem', 'Noon', 'Etisalat Digital', 'ADNOC Digital'],
      description: 'Leading the digital transformation of the UAE with cutting-edge technology solutions.',
      skills: ['Python', 'React', 'AI/ML', 'Cloud Computing', 'DevOps'],
      locations: ['Dubai', 'Abu Dhabi', 'Sharjah'],
      trending: true
    },
    {
      id: 'finance',
      name: 'Banking & Finance',
      icon: '🏦',
      growth: '+12%',
      jobs: '1,800+',
      avgSalary: 'AED 100K-200K',
      topCompanies: ['Emirates NBD', 'ADCB', 'FAB', 'Mashreq Bank'],
      description: 'Driving financial innovation and Islamic banking excellence in the region.',
      skills: ['Financial Analysis', 'Risk Management', 'Fintech', 'Compliance'],
      locations: ['Dubai', 'Abu Dhabi'],
      trending: false
    },
    {
      id: 'energy',
      name: 'Energy & Sustainability',
      icon: '⚡',
      growth: '+20%',
      jobs: '1,200+',
      avgSalary: 'AED 110K-220K',
      topCompanies: ['ADNOC', 'DEWA', 'Masdar', 'ENOC'],
      description: 'Pioneering renewable energy and sustainable development initiatives.',
      skills: ['Renewable Energy', 'Project Management', 'Engineering', 'Sustainability'],
      locations: ['Abu Dhabi', 'Dubai'],
      trending: true
    },
    {
      id: 'healthcare',
      name: 'Healthcare & Life Sciences',
      icon: '🏥',
      growth: '+15%',
      jobs: '1,500+',
      avgSalary: 'AED 95K-180K',
      topCompanies: ['DHA', 'SEHA', 'Mediclinic', 'NMC Healthcare'],
      description: 'Advancing healthcare excellence and medical innovation in the UAE.',
      skills: ['Medical Technology', 'Healthcare Management', 'Clinical Research'],
      locations: ['Dubai', 'Abu Dhabi', 'Sharjah'],
      trending: false
    },
    {
      id: 'aerospace',
      name: 'Aerospace & Aviation',
      icon: '✈️',
      growth: '+14%',
      jobs: '900+',
      avgSalary: 'AED 105K-190K',
      topCompanies: ['Emirates', 'Etihad Airways', 'Dubai Airports', 'Strata Manufacturing'],
      description: 'Connecting the world through aviation excellence and aerospace innovation.',
      skills: ['Aviation Management', 'Aerospace Engineering', 'Operations'],
      locations: ['Dubai', 'Abu Dhabi'],
      trending: false
    },
    {
      id: 'tourism',
      name: 'Tourism & Hospitality',
      icon: '🏨',
      growth: '+16%',
      jobs: '2,000+',
      avgSalary: 'AED 75K-150K',
      topCompanies: ['Jumeirah Group', 'Rotana', 'DTCM', 'Emaar Hospitality'],
      description: 'Creating world-class hospitality experiences and tourism destinations.',
      skills: ['Hospitality Management', 'Customer Service', 'Event Planning'],
      locations: ['Dubai', 'Abu Dhabi', 'Ras Al Khaimah'],
      trending: false
    }
  ];

  const emirates = [
    { id: 'all', name: 'All Emirates' },
    { id: 'dubai', name: 'Dubai' },
    { id: 'abu_dhabi', name: 'Abu Dhabi' },
    { id: 'sharjah', name: 'Sharjah' },
    { id: 'ajman', name: 'Ajman' },
    { id: 'uaq', name: 'Umm Al Quwain' },
    { id: 'rak', name: 'Ras Al Khaimah' },
    { id: 'fujairah', name: 'Fujairah' }
  ];

  const marketInsights = [
    {
      title: 'D33 and Talent33 Impact',
      description: 'Government initiatives driving 25% increase in tech sector jobs',
      icon: '🎯',
      trend: '+25%'
    },
    {
      title: 'Emiratization Focus',
      description: 'Priority sectors offering enhanced opportunities for UAE Nationals',
      icon: '🇦🇪',
      trend: 'Priority'
    },
    {
      title: 'Remote Work Growth',
      description: 'Flexible work arrangements increasing across all industries',
      icon: '🏠',
      trend: '+40%'
    },
    {
      title: 'Skills Demand',
      description: 'AI, sustainability, and digital skills in highest demand',
      icon: '🚀',
      trend: 'High'
    }
  ];

  const filteredIndustries = industries.filter(industry => {
    const matchesSearch = industry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         industry.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesIndustry = selectedIndustry === 'all' || industry.id === selectedIndustry;
    const matchesEmirate = selectedEmirate === 'all' || 
                          industry.locations.some(loc => loc.toLowerCase() === selectedEmirate.replace('_', ' '));
    
    return matchesSearch && matchesIndustry && matchesEmirate;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-dubai">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-dubai-bold text-gray-900">Industry Exploration</h1>
              <p className="text-gray-600 mt-2">Discover career opportunities across UAE's thriving industries</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
                🇦🇪 UAE Nationals Only
              </span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
                🤖 AI-Powered
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Market Insights */}
        <div className="mb-8">
          <h2 className="text-2xl font-dubai-bold text-gray-900 mb-6">Market Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {marketInsights.map((insight, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{insight.icon}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-dubai-medium">
                    {insight.trend}
                  </span>
                </div>
                <h3 className="font-dubai-bold text-gray-900 mb-2">{insight.title}</h3>
                <p className="text-gray-600 text-sm">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search industries or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Industry Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400 h-5 w-5" />
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Industries</option>
                {industries.map(industry => (
                  <option key={industry.id} value={industry.id}>{industry.name}</option>
                ))}
              </select>
            </div>

            {/* Emirate Filter */}
            <div className="flex items-center space-x-2">
              <MapPin className="text-gray-400 h-5 w-5" />
              <select
                value={selectedEmirate}
                onChange={(e) => setSelectedEmirate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {emirates.map(emirate => (
                  <option key={emirate.id} value={emirate.id}>{emirate.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Industries Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredIndustries.map((industry) => (
            <div key={industry.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Industry Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{industry.icon}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-dubai-bold text-gray-900">{industry.name}</h3>
                        {industry.trending && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-dubai-medium flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{industry.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Industry Stats */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-lg font-dubai-bold text-green-600">{industry.growth}</div>
                    <div className="text-xs text-gray-600">Growth Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-lg font-dubai-bold text-blue-600">{industry.jobs}</div>
                    <div className="text-xs text-gray-600">Open Positions</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-lg font-dubai-bold text-purple-600">{industry.avgSalary}</div>
                    <div className="text-xs text-gray-600">Salary Range</div>
                  </div>
                </div>

                {/* Top Companies */}
                <div className="mb-6">
                  <h4 className="font-dubai-bold text-gray-900 mb-3 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Top Employers
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {industry.topCompanies.map((company, index) => (
                      <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                        {company}
                      </span>
                    ))}
                  </div>
                </div>

                {/* In-Demand Skills */}
                <div className="mb-6">
                  <h4 className="font-dubai-bold text-gray-900 mb-3 flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    In-Demand Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {industry.skills.map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Locations */}
                <div className="mb-6">
                  <h4 className="font-dubai-bold text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Key Locations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {industry.locations.map((location, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {location}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-dubai-medium">
                  Explore Career Opportunities
                  <ChevronRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredIndustries.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-dubai-bold text-gray-900 mb-2">No industries found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndustryExplorationPage;
