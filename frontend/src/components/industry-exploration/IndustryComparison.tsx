
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Users, DollarSign, Clock, Target } from 'lucide-react';

interface IndustryData {
  id: string;
  name: string;
  growth: number;
  averageSalary: number;
  jobSecurity: number;
  workLifeBalance: number;
  careerProgression: number;
  emiratizationTarget: number;
  openPositions: number;
  requiredEducation: string;
  topSkills: string[];
}

export const IndustryComparison: React.FC = () => {
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(['technology', 'oil-gas']);
  const [comparisonMetric, setComparisonMetric] = useState('overall');

  const industries: IndustryData[] = [
    {
      id: 'technology',
      name: 'Technology & Innovation',
      growth: 25,
      averageSalary: 95000,
      jobSecurity: 85,
      workLifeBalance: 75,
      careerProgression: 90,
      emiratizationTarget: 60,
      openPositions: 1250,
      requiredEducation: 'Bachelor\'s in CS/Engineering',
      topSkills: ['Programming', 'Cloud Computing', 'AI/ML', 'Data Analysis']
    },
    {
      id: 'oil-gas',
      name: 'Oil & Gas',
      growth: 8,
      averageSalary: 120000,
      jobSecurity: 90,
      workLifeBalance: 65,
      careerProgression: 75,
      emiratizationTarget: 75,
      openPositions: 890,
      requiredEducation: 'Bachelor\'s in Engineering',
      topSkills: ['Petroleum Engineering', 'Project Management', 'HSE', 'Process Engineering']
    },
    {
      id: 'financial-services',
      name: 'Financial Services',
      growth: 12,
      averageSalary: 110000,
      jobSecurity: 88,
      workLifeBalance: 70,
      careerProgression: 80,
      emiratizationTarget: 80,
      openPositions: 720,
      requiredEducation: 'Bachelor\'s in Finance/Business',
      topSkills: ['Financial Analysis', 'Risk Management', 'Compliance', 'Digital Banking']
    },
    {
      id: 'healthcare',
      name: 'Healthcare & Life Sciences',
      growth: 18,
      averageSalary: 85000,
      jobSecurity: 95,
      workLifeBalance: 60,
      careerProgression: 70,
      emiratizationTarget: 70,
      openPositions: 980,
      requiredEducation: 'Medical Degree/Healthcare Certification',
      topSkills: ['Clinical Skills', 'Patient Care', 'Medical Technology', 'Research']
    },
    {
      id: 'tourism-hospitality',
      name: 'Tourism & Hospitality',
      growth: 15,
      averageSalary: 65000,
      jobSecurity: 70,
      workLifeBalance: 55,
      careerProgression: 75,
      emiratizationTarget: 65,
      openPositions: 1500,
      requiredEducation: 'Hospitality Management/Related Field',
      topSkills: ['Customer Service', 'Event Management', 'Cultural Awareness', 'Languages']
    },
    {
      id: 'real-estate',
      name: 'Real Estate & Construction',
      growth: 10,
      averageSalary: 78000,
      jobSecurity: 75,
      workLifeBalance: 60,
      careerProgression: 85,
      emiratizationTarget: 70,
      openPositions: 650,
      requiredEducation: 'Engineering/Architecture/Business',
      topSkills: ['Project Management', 'Construction', 'Sales', 'Design']
    }
  ];

  const getSelectedIndustriesData = () => {
    return industries.filter(industry => selectedIndustries.includes(industry.id));
  };

  const handleIndustryToggle = (industryId: string) => {
    if (selectedIndustries.includes(industryId)) {
      if (selectedIndustries.length > 1) {
        setSelectedIndustries(selectedIndustries.filter(id => id !== industryId));
      }
    } else {
      if (selectedIndustries.length < 3) {
        setSelectedIndustries([...selectedIndustries, industryId]);
      }
    }
  };

  const getMetricValue = (industry: IndustryData, metric: string) => {
    switch (metric) {
      case 'growth': return industry.growth;
      case 'salary': return industry.averageSalary / 1000;
      case 'security': return industry.jobSecurity;
      case 'balance': return industry.workLifeBalance;
      case 'progression': return industry.careerProgression;
      case 'emiratization': return industry.emiratizationTarget;
      default: return (industry.growth + industry.jobSecurity + industry.workLifeBalance + industry.careerProgression) / 4;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'growth': return 'Growth Rate (%)';
      case 'salary': return 'Average Salary (K AED)';
      case 'security': return 'Job Security (%)';
      case 'balance': return 'Work-Life Balance (%)';
      case 'progression': return 'Career Progression (%)';
      case 'emiratization': return 'Emiratization Target (%)';
      default: return 'Overall Score (%)';
    }
  };

  const selectedData = getSelectedIndustriesData();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-ehrdc-teal" />
            Industry Comparison Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Compare different industries across various metrics to make informed career decisions.
          </p>

          {/* Industry Selection */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Select Industries to Compare (Max 3)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {industries.map((industry) => (
                <Button
                  key={industry.id}
                  variant={selectedIndustries.includes(industry.id) ? "default" : "outline"}
                  onClick={() => handleIndustryToggle(industry.id)}
                  className={`text-left justify-start ${
                    selectedIndustries.includes(industry.id)
                      ? 'bg-ehrdc-teal hover:bg-ehrdc-dark-teal'
                      : 'hover:border-ehrdc-teal'
                  }`}
                  disabled={!selectedIndustries.includes(industry.id) && selectedIndustries.length >= 3}
                >
                  {industry.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Comparison Metric Selection */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Comparison Metric</h3>
            <Select value={comparisonMetric} onValueChange={setComparisonMetric}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall Score</SelectItem>
                <SelectItem value="growth">Growth Rate</SelectItem>
                <SelectItem value="salary">Average Salary</SelectItem>
                <SelectItem value="security">Job Security</SelectItem>
                <SelectItem value="balance">Work-Life Balance</SelectItem>
                <SelectItem value="progression">Career Progression</SelectItem>
                <SelectItem value="emiratization">Emiratization Target</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comparison Results */}
          <div className="space-y-6">
            <div className="grid gap-4">
              {selectedData.map((industry, index) => (
                <Card key={industry.id} className="border-ehrdc-neutral-light">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{industry.name}</h4>
                      <Badge className="bg-ehrdc-teal/10 text-ehrdc-teal">
                        Rank #{index + 1}
                      </Badge>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">
                          {getMetricLabel(comparisonMetric)}
                        </span>
                        <span className="font-medium">
                          {getMetricValue(industry, comparisonMetric).toFixed(1)}
                          {comparisonMetric === 'salary' ? 'K' : comparisonMetric !== 'overall' ? '%' : '%'}
                        </span>
                      </div>
                      <Progress 
                        value={getMetricValue(industry, comparisonMetric)} 
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Growth:</span>
                        <div className="font-medium flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          {industry.growth}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Salary:</span>
                        <div className="font-medium flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          {(industry.averageSalary / 1000).toFixed(0)}K AED
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Open Positions:</span>
                        <div className="font-medium flex items-center gap-1">
                          <Users className="h-3 w-3 text-blue-600" />
                          {industry.openPositions}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Emiratization:</span>
                        <div className="font-medium flex items-center gap-1">
                          <Target className="h-3 w-3 text-ehrdc-teal" />
                          {industry.emiratizationTarget}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Metric</th>
                        {selectedData.map(industry => (
                          <th key={industry.id} className="text-left p-2">{industry.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Required Education</td>
                        {selectedData.map(industry => (
                          <td key={industry.id} className="p-2">{industry.requiredEducation}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Top Skills</td>
                        {selectedData.map(industry => (
                          <td key={industry.id} className="p-2">
                            <div className="flex flex-wrap gap-1">
                              {industry.topSkills.slice(0, 2).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Job Security</td>
                        {selectedData.map(industry => (
                          <td key={industry.id} className="p-2">{industry.jobSecurity}%</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">Work-Life Balance</td>
                        {selectedData.map(industry => (
                          <td key={industry.id} className="p-2">{industry.workLifeBalance}%</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
