import React, { useState, useRef, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, GraduationCap, Building, Download } from 'lucide-react';
import { ExportManager } from './ExportManager';
import { AdvancedFilters } from './AdvancedFilters';
import { CrossFilterableChart } from './CrossFilterableChart';
import { FilterSummary } from './FilterSummary';
import { PredictiveAnalytics } from './PredictiveAnalytics';

// Mock data for UAE workforce analytics
const skillsData = [
  { skill: 'Digital Marketing', count: 15420, demand: 'High', growth: 25, category: 'Marketing' },
  { skill: 'Data Analysis', count: 12680, demand: 'Very High', growth: 40, category: 'Analytical' },
  { skill: 'Project Management', count: 18950, demand: 'High', growth: 18, category: 'Management' },
  { skill: 'Software Development', count: 9850, demand: 'Very High', growth: 55, category: 'Technical' },
  { skill: 'Financial Analysis', count: 11200, demand: 'Medium', growth: 12, category: 'Analytical' },
  { skill: 'AI/Machine Learning', count: 4850, demand: 'Very High', growth: 85, category: 'Technical' },
  { skill: 'Cybersecurity', count: 6420, demand: 'High', growth: 45, category: 'Technical' },
  { skill: 'Cloud Computing', count: 5680, demand: 'High', growth: 60, category: 'Technical' }
];

const educationData = [
  { level: 'High School', count: 285000, percentage: 35, emirates: 'Abu Dhabi' },
  { level: 'Bachelor\'s Degree', count: 320000, percentage: 40, emirates: 'Dubai' },
  { level: 'Master\'s Degree', count: 160000, percentage: 20, emirates: 'Sharjah' },
  { level: 'PhD', count: 40000, percentage: 5, emirates: 'Ajman' }
];

const sectorsData = [
  { sector: 'Technology', employees: 125000, emiratis: 35000, emiratization: 28, growth: 15 },
  { sector: 'Finance & Banking', employees: 95000, emiratis: 47500, emiratization: 50, growth: 8 },
  { sector: 'Healthcare', employees: 180000, emiratis: 54000, emiratization: 30, growth: 12 },
  { sector: 'Education', employees: 140000, emiratis: 84000, emiratization: 60, growth: 5 },
  { sector: 'Tourism & Hospitality', employees: 220000, emiratis: 44000, emiratization: 20, growth: 22 },
  { sector: 'Manufacturing', employees: 160000, emiratis: 32000, emiratization: 20, growth: 10 },
  { sector: 'Government', employees: 180000, emiratis: 144000, emiratization: 80, growth: 3 }
];

const emiratizationTrends = [
  { year: '2020', overall: 38, private: 25, government: 75 },
  { year: '2021', overall: 40, private: 28, government: 78 },
  { year: '2022', overall: 42, private: 32, government: 80 },
  { year: '2023', overall: 45, private: 35, government: 82 },
  { year: '2024', overall: 48, private: 38, government: 85 }
];

const demographics = [
  { group: 'Emirati Citizens', count: 450000, percentage: 35 },
  { group: 'Arab Expatriates', count: 390000, percentage: 30 },
  { group: 'Asian Expatriates', count: 325000, percentage: 25 },
  { group: 'Western Expatriates', count: 130000, percentage: 10 }
];

const COLORS = ['#3BACB6', '#601E88', '#E74C3C', '#F39C12', '#27AE60', '#8E44AD', '#E67E22', '#2ECC71'];

interface FilterState {
  emirate: string;
  sector: string;
  timeframe: string;
  skillCategory?: string;
  experienceLevel?: string;
  educationLevel?: string;
  emiratizationRange?: [number, number];
  dateRange?: {
    from: Date;
    to: Date;
  };
  searchTerm?: string;
}

const UAEWorkforceAnalytics = () => {
  const [filters, setFilters] = useState<FilterState>({
    emirate: 'all',
    sector: 'all',
    timeframe: '2024'
  });
  const [crossFilters, setCrossFilters] = useState<Record<string, any>>({});
  const [showExports, setShowExports] = useState(false);

  // Chart refs for export functionality
  const skillsChartRef = useRef<HTMLDivElement>(null);
  const skillsGrowthChartRef = useRef<HTMLDivElement>(null);
  const educationPieChartRef = useRef<HTMLDivElement>(null);
  const educationBarChartRef = useRef<HTMLDivElement>(null);
  const sectorsEmploymentChartRef = useRef<HTMLDivElement>(null);
  const sectorsGrowthChartRef = useRef<HTMLDivElement>(null);
  const sectorsDemographicsChartRef = useRef<HTMLDivElement>(null);
  const emiratizationTrendsChartRef = useRef<HTMLDivElement>(null);
  const emiratizationSectorsChartRef = useRef<HTMLDivElement>(null);

  const chartRefs = [
    skillsChartRef,
    skillsGrowthChartRef,
    educationPieChartRef,
    educationBarChartRef,
    sectorsEmploymentChartRef,
    sectorsGrowthChartRef,
    sectorsDemographicsChartRef,
    emiratizationTrendsChartRef,
    emiratizationSectorsChartRef
  ];

  const availableOptions = {
    emirates: ['all', 'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
    sectors: ['all', 'Technology', 'Finance & Banking', 'Healthcare', 'Education', 'Tourism & Hospitality', 'Manufacturing', 'Government'],
    skillCategories: ['Technical', 'Management', 'Creative', 'Analytical', 'Communication'],
    experienceLevel: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'],
    educationLevels: ['High School', "Bachelor's Degree", "Master's Degree", 'PhD']
  };

  // Filter data based on current filters and cross-filters
  const filteredData = useMemo(() => {
    const applyFilters = (data: any[], filterKey?: string) => {
      return data.filter(item => {
        // Apply main filters
        if (filters.emirate !== 'all' && item.emirates && item.emirates !== filters.emirate) {
          return false;
        }
        if (filters.sector !== 'all' && item.sector && item.sector !== filters.sector) {
          return false;
        }
        if (filters.skillCategory && item.category !== filters.skillCategory) {
          return false;
        }
        if (filters.searchTerm && !JSON.stringify(item).toLowerCase().includes(filters.searchTerm.toLowerCase())) {
          return false;
        }
        if (filters.emiratizationRange && item.emiratization) {
          const [min, max] = filters.emiratizationRange;
          if (item.emiratization < min || item.emiratization > max) {
            return false;
          }
        }

        // Apply cross-filters
        for (const [crossFilterKey, crossFilterValue] of Object.entries(crossFilters)) {
          if (crossFilterKey !== filterKey && item[crossFilterKey] && item[crossFilterKey] !== crossFilterValue) {
            return false;
          }
        }

        return true;
      });
    };

    return {
      skillsData: applyFilters(skillsData, 'skill'),
      educationData: applyFilters(educationData, 'level'),
      sectorsData: applyFilters(sectorsData, 'sector'),
      emiratizationTrends: applyFilters(emiratizationTrends, 'year'),
      demographics: applyFilters(demographics, 'group')
    };
  }, [filters, crossFilters]);

  const handleCrossFilter = (data: any, filterType: string) => {
    const newCrossFilters = { ...crossFilters };
    
    switch (filterType) {
      case 'skills':
        if (newCrossFilters.skill === data.skill) {
          delete newCrossFilters.skill;
        } else {
          newCrossFilters.skill = data.skill;
        }
        break;
      case 'sectors':
        if (newCrossFilters.sector === data.sector) {
          delete newCrossFilters.sector;
        } else {
          newCrossFilters.sector = data.sector;
        }
        break;
      case 'education':
        if (newCrossFilters.level === data.level) {
          delete newCrossFilters.level;
        } else {
          newCrossFilters.level = data.level;
        }
        break;
      default:
        break;
    }
    
    setCrossFilters(newCrossFilters);
  };

  const clearCrossFilters = () => {
    setCrossFilters({});
  };

  const analyticsData = {
    skillsData: filteredData.skillsData,
    educationData: filteredData.educationData,
    sectorsData: filteredData.sectorsData,
    emiratizationTrends: filteredData.emiratizationTrends,
    demographics: filteredData.demographics
  };

  const totalRecords = skillsData.length + educationData.length + sectorsData.length;
  const filteredRecords = filteredData.skillsData.length + filteredData.educationData.length + filteredData.sectorsData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>UAE Workforce Analytics Dashboard</CardTitle>
              <CardDescription>Comprehensive insights into workforce trends across the United Arab Emirates</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExports(!showExports)}
                className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </CardHeader>
        {showExports && (
          <CardContent>
            <ExportManager 
              data={analyticsData}
              chartRefs={chartRefs}
              selectedFilters={filters}
            />
          </CardContent>
        )}
      </Card>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableOptions={availableOptions}
        onCrossFilter={handleCrossFilter}
      />

      {/* Filter Summary */}
      <FilterSummary
        totalRecords={totalRecords}
        filteredRecords={filteredRecords}
        activeFilters={filters}
        crossFilters={crossFilters}
      />

      {Object.keys(crossFilters).length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Cross-filters are active. Click on chart elements to filter other visualizations.
              </span>
              <button
                onClick={clearCrossFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear cross-filters
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Workforce</CardTitle>
            <CardDescription>Overall number of professionals in the UAE</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">850,000+</div>
            <div className="text-sm text-muted-foreground">As of Q1 2024</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emiratization Rate</CardTitle>
            <CardDescription>Percentage of UAE Nationals in the workforce</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48%</div>
            <div className="text-sm text-muted-foreground">+3% YoY</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Growing Sectors</CardTitle>
            <CardDescription>Sectors with the highest employment growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Technology, Tourism</div>
            <div className="text-sm text-muted-foreground">Avg. growth: 18%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills in Demand</CardTitle>
            <CardDescription>Most sought-after skills by employers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Data Analysis, AI</div>
            <div className="text-sm text-muted-foreground">+45% job postings</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="skills" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="skills">Skills Distribution</TabsTrigger>
          <TabsTrigger value="education">Education Levels</TabsTrigger>
          <TabsTrigger value="sectors">Employment Sectors</TabsTrigger>
          <TabsTrigger value="emiratization">Emiratization Progress</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Skills by Count</CardTitle>
                <CardDescription>Most prevalent skills in the UAE workforce (click to cross-filter)</CardDescription>
              </CardHeader>
              <CardContent>
                <CrossFilterableChart
                  onDataClick={handleCrossFilter}
                  filterType="skills"
                  isFiltered={!!crossFilters.skill}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredData.skillsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value.toLocaleString()} professionals`} />
                      <Bar dataKey="count" fill="#3BACB6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CrossFilterableChart>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills Growth Rate</CardTitle>
                <CardDescription>Year-over-year growth in demand</CardDescription>
              </CardHeader>
              <CardContent>
                <CrossFilterableChart
                  onDataClick={handleCrossFilter}
                  filterType="skills"
                  isFiltered={!!crossFilters.skill}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredData.skillsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value) => `${value}% growth`} />
                      <Bar dataKey="growth" fill="#E74C3C" />
                    </BarChart>
                  </ResponsiveContainer>
                </CrossFilterableChart>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Skills Demand Analysis</CardTitle>
              <CardDescription>Current market demand for various skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredData.skillsData.map((skill, index) => (
                  <div key={skill.skill} className="p-4 border rounded-lg">
                    <h4 className="font-medium">{skill.skill}</h4>
                    <p className="text-sm text-muted-foreground">{skill.count.toLocaleString()} professionals</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant={
                        skill.demand === 'Very High' ? 'destructive' : 
                        skill.demand === 'High' ? 'default' : 'secondary'
                      }>
                        {skill.demand}
                      </Badge>
                      <span className="text-sm font-medium text-green-600">+{skill.growth}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Educational Attainment Distribution</CardTitle>
                <CardDescription>Breakdown of education levels across the workforce (click to cross-filter)</CardDescription>
              </CardHeader>
              <CardContent>
                <CrossFilterableChart
                  onDataClick={handleCrossFilter}
                  filterType="education"
                  isFiltered={!!crossFilters.level}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredData.educationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ level, percentage }) => `${level}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {filteredData.educationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toLocaleString()} people`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CrossFilterableChart>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Education by Count</CardTitle>
                <CardDescription>Absolute numbers for each education level</CardDescription>
              </CardHeader>
              <CardContent>
                <CrossFilterableChart
                  filterType="education"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredData.educationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value.toLocaleString()} people`} />
                      <Bar dataKey="count" fill="#601E88" />
                    </BarChart>
                  </ResponsiveContainer>
                </CrossFilterableChart>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sectors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employment by Sector</CardTitle>
                <CardDescription>Total workforce distribution across sectors (click to cross-filter)</CardDescription>
              </CardHeader>
              <CardContent>
                <CrossFilterableChart
                  onDataClick={handleCrossFilter}
                  filterType="sectors"
                  isFiltered={!!crossFilters.sector}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredData.sectorsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sector" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value.toLocaleString()} employees`} />
                      <Bar dataKey="employees" fill="#3BACB6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CrossFilterableChart>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sector Growth Rates</CardTitle>
                <CardDescription>Year-over-year employment growth by sector</CardDescription>
              </CardHeader>
              <CardContent>
                <CrossFilterableChart
                  filterType="sectors"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredData.sectorsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sector" angle={-45} textAnchor="end" height={100} />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value) => `${value}% growth`} />
                      <Bar dataKey="growth" fill="#F39C12" />
                    </BarChart>
                  </ResponsiveContainer>
                </CrossFilterableChart>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sector Demographics</CardTitle>
              <CardDescription>Workforce composition by nationality</CardDescription>
            </CardHeader>
            <CardContent>
              <CrossFilterableChart
                filterType="demographics"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredData.demographics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ group, percentage }) => `${group}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {filteredData.demographics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} people`} />
                  </PieChart>
                </ResponsiveContainer>
              </CrossFilterableChart>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emiratization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Emiratization Trends</CardTitle>
                <CardDescription>Progress over time in both public and private sectors</CardDescription>
              </CardHeader>
              <CardContent>
                <CrossFilterableChart
                  filterType="emiratization"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData.emiratizationTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Line type="monotone" dataKey="overall" stroke="#3BACB6" strokeWidth={2} name="Overall" />
                      <Line type="monotone" dataKey="private" stroke="#E74C3C" strokeWidth={2} name="Private Sector" />
                      <Line type="monotone" dataKey="government" stroke="#27AE60" strokeWidth={2} name="Government" />
                    </LineChart>
                  </ResponsiveContainer>
                </CrossFilterableChart>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emiratization by Sector</CardTitle>
                <CardDescription>Current Emirati representation across different sectors</CardDescription>
              </CardHeader>
              <CardContent>
                <CrossFilterableChart
                  filterType="sectors"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredData.sectorsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sector" angle={-45} textAnchor="end" height={100} />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value) => `${value}% Emiratization`} />
                      <Bar dataKey="emiratization" fill="#601E88" />
                    </BarChart>
                  </ResponsiveContainer>
                </CrossFilterableChart>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Emiratization Progress by Sector</CardTitle>
              <CardDescription>Detailed breakdown of Emirati workforce participation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData.sectorsData.map((sector) => (
                  <div key={sector.sector} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{sector.sector}</h4>
                      <Badge variant={sector.emiratization >= 50 ? 'default' : sector.emiratization >= 30 ? 'secondary' : 'destructive'}>
                        {sector.emiratization}% Emiratization
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total: {sector.employees.toLocaleString()} employees</span>
                      <span>Emiratis: {sector.emiratis.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-emirati-teal h-2 rounded-full" 
                        style={{ width: `${sector.emiratization}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <PredictiveAnalytics selectedFilters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UAEWorkforceAnalytics;
