
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { GitCompare, Plus, X, TrendingUp, Users, Clock, DollarSign, GraduationCap, Building, Download } from 'lucide-react';

export const CareerComparisonTool: React.FC = () => {
  const [selectedCareers, setSelectedCareers] = useState<string[]>(['software-engineer', 'data-scientist']);
  const [weights, setWeights] = useState({
    salary: 25,
    growth: 20,
    workLife: 20,
    demand: 15,
    education: 10,
    advancement: 10
  });

  const careerOptions = [
    { value: 'software-engineer', label: 'Software Engineer' },
    { value: 'data-scientist', label: 'Data Scientist' },
    { value: 'product-manager', label: 'Product Manager' },
    { value: 'ux-designer', label: 'UX Designer' },
    { value: 'marketing-manager', label: 'Marketing Manager' },
    { value: 'business-analyst', label: 'Business Analyst' },
    { value: 'cybersecurity-specialist', label: 'Cybersecurity Specialist' },
    { value: 'financial-analyst', label: 'Financial Analyst' }
  ];

  const careerData = {
    'software-engineer': {
      title: 'Software Engineer',
      avgSalary: 'AED 15,000',
      salaryRange: 'AED 8,000 - 25,000',
      growthRate: '12%',
      jobAvailability: 'Very High',
      workLifeBalance: 75,
      advancementOpps: 85,
      skillsRequired: ['Programming', 'Problem Solving', 'Algorithms', 'System Design'],
      education: 'Bachelor\'s in Computer Science',
      experience: '2-5 years',
      industryStability: 95,
      futureOutlook: 'Excellent',
      pros: ['High demand', 'Good salary growth', 'Remote work options', 'Creative problem solving'],
      cons: ['Long hours during deadlines', 'Constant learning required', 'Can be stressful'],
      overallScore: 85
    },
    'data-scientist': {
      title: 'Data Scientist',
      avgSalary: 'AED 18,000',
      salaryRange: 'AED 12,000 - 30,000',
      growthRate: '15%',
      jobAvailability: 'Very High',
      workLifeBalance: 70,
      advancementOpps: 90,
      skillsRequired: ['Statistics', 'Machine Learning', 'Python', 'Data Analysis'],
      education: 'Master\'s in Data Science',
      experience: '3-6 years',
      industryStability: 92,
      futureOutlook: 'Excellent',
      pros: ['High salary potential', 'Growing field', 'Intellectually stimulating', 'High impact work'],
      cons: ['Requires advanced education', 'Complex problems', 'Data quality challenges'],
      overallScore: 88
    },
    'product-manager': {
      title: 'Product Manager',
      avgSalary: 'AED 20,000',
      salaryRange: 'AED 15,000 - 35,000',
      growthRate: '10%',
      jobAvailability: 'Medium',
      workLifeBalance: 65,
      advancementOpps: 95,
      skillsRequired: ['Strategy', 'Communication', 'Analytics', 'Leadership'],
      education: 'Bachelor\'s + MBA preferred',
      experience: '5-8 years',
      industryStability: 85,
      futureOutlook: 'Very Good',
      pros: ['High leadership potential', 'Strategic impact', 'Cross-functional work', 'Executive path'],
      cons: ['High responsibility', 'Complex stakeholder management', 'Competitive field'],
      overallScore: 82
    },
    'ux-designer': {
      title: 'UX Designer',
      avgSalary: 'AED 13,000',
      salaryRange: 'AED 8,000 - 22,000',
      growthRate: '14%',
      jobAvailability: 'High',
      workLifeBalance: 80,
      advancementOpps: 75,
      skillsRequired: ['Design Thinking', 'Prototyping', 'User Research', 'Visual Design'],
      education: 'Bachelor\'s in Design',
      experience: '2-5 years',
      industryStability: 88,
      futureOutlook: 'Very Good',
      pros: ['Creative work', 'User impact', 'Growing demand', 'Good work-life balance'],
      cons: ['Subjective feedback', 'Design trends change', 'Portfolio dependent'],
      overallScore: 78
    }
  };

  const addCareer = (career: string) => {
    if (selectedCareers.length < 4 && !selectedCareers.includes(career)) {
      setSelectedCareers([...selectedCareers, career]);
    }
  };

  const removeCareer = (career: string) => {
    if (selectedCareers.length > 1) {
      setSelectedCareers(selectedCareers.filter(c => c !== career));
    }
  };

  const calculateWeightedScore = (career: any) => {
    const scores = {
      salary: (parseInt(career.avgSalary.replace(/[^\d]/g, '')) / 30000) * 100,
      growth: parseFloat(career.growthRate) * 5,
      workLife: career.workLifeBalance,
      demand: career.jobAvailability === 'Very High' ? 100 : career.jobAvailability === 'High' ? 80 : 60,
      education: career.education.includes('Master') ? 70 : 90, // Lower score for higher education requirement
      advancement: career.advancementOpps
    };

    return Math.round(
      (scores.salary * weights.salary + 
       scores.growth * weights.growth + 
       scores.workLife * weights.workLife + 
       scores.demand * weights.demand + 
       scores.education * weights.education + 
       scores.advancement * weights.advancement) / 100
    );
  };

  const exportComparison = () => {
    console.log('Exporting comparison report...');
    // This would generate a PDF or Excel report
  };

  return (
    <div className="space-y-6">
      {/* Comparison Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-ehrdc-teal" />
            Career Path Comparison Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Select onValueChange={addCareer}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Add career to compare" />
              </SelectTrigger>
              <SelectContent>
                {careerOptions
                  .filter(option => !selectedCareers.includes(option.value))
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary">
              {selectedCareers.length}/4 careers selected
            </Badge>
            <Button onClick={exportComparison} variant="outline" className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Weighting Controls */}
          <div className="mb-6 p-4 bg-ehrdc-neutral-light/20 rounded-lg">
            <h4 className="font-medium mb-4">Customize Your Priorities (Weights)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(weights).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium capitalize">
                      {key === 'workLife' ? 'Work-Life Balance' : key}
                    </label>
                    <span className="text-sm text-muted-foreground">{value}%</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={(newValue) => setWeights(prev => ({ ...prev, [key]: newValue[0] }))}
                    max={50}
                    min={0}
                    step={5}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Career Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {selectedCareers.map((careerId, index) => {
              const career = careerData[careerId as keyof typeof careerData];
              if (!career) return null;

              const weightedScore = calculateWeightedScore(career);

              return (
                <Card key={careerId} className={`border-2 ${index === 0 ? 'border-ehrdc-teal' : 'border-ehrdc-neutral-light'}`}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{career.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCareer(careerId)}
                        disabled={selectedCareers.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-ehrdc-teal mb-1">{weightedScore}</div>
                      <div className="text-sm text-muted-foreground">Weighted Score</div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Salary Information */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Salary</span>
                      </div>
                      <p className="font-semibold text-lg">{career.avgSalary}</p>
                      <p className="text-sm text-muted-foreground">{career.salaryRange}</p>
                    </div>

                    {/* Growth Rate */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">Growth Rate</span>
                      </div>
                      <span className="font-semibold text-green-600">{career.growthRate}</span>
                    </div>

                    {/* Job Demand */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Job Demand</span>
                      </div>
                      <Badge variant={career.jobAvailability === 'Very High' ? 'default' : 
                                   career.jobAvailability === 'High' ? 'secondary' : 'outline'}>
                        {career.jobAvailability}
                      </Badge>
                    </div>

                    {/* Work-Life Balance */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Work-Life Balance</span>
                        </div>
                        <span className="text-sm font-medium">{career.workLifeBalance}%</span>
                      </div>
                      <Progress value={career.workLifeBalance} className="h-2" />
                    </div>

                    {/* Education Requirements */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Education</span>
                      </div>
                      <p className="text-sm">{career.education}</p>
                    </div>

                    {/* Key Skills */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Key Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {career.skillsRequired.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {career.skillsRequired.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{career.skillsRequired.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Pros & Cons Preview */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-1">Top Pros:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {career.pros.slice(0, 2).map((pro, i) => (
                            <li key={i}>• {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700 mb-1">Main Cons:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {career.cons.slice(0, 2).map((con, i) => (
                            <li key={i}>• {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Detailed Comparison Table */}
          {selectedCareers.length > 1 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Detailed Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-ehrdc-neutral-light">
                  <thead>
                    <tr className="bg-ehrdc-neutral-light/20">
                      <th className="border border-ehrdc-neutral-light p-3 text-left">Criteria</th>
                      {selectedCareers.map(careerId => {
                        const career = careerData[careerId as keyof typeof careerData];
                        return (
                          <th key={careerId} className="border border-ehrdc-neutral-light p-3 text-center min-w-[150px]">
                            {career?.title}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-ehrdc-neutral-light p-3 font-medium">Weighted Score</td>
                      {selectedCareers.map(careerId => {
                        const career = careerData[careerId as keyof typeof careerData];
                        return (
                          <td key={careerId} className="border border-ehrdc-neutral-light p-3 text-center">
                            <span className="text-lg font-bold text-ehrdc-teal">
                              {career ? calculateWeightedScore(career) : 'N/A'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="border border-ehrdc-neutral-light p-3 font-medium">Average Salary</td>
                      {selectedCareers.map(careerId => {
                        const career = careerData[careerId as keyof typeof careerData];
                        return (
                          <td key={careerId} className="border border-ehrdc-neutral-light p-3 text-center">
                            {career?.avgSalary || 'N/A'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="border border-ehrdc-neutral-light p-3 font-medium">Growth Rate</td>
                      {selectedCareers.map(careerId => {
                        const career = careerData[careerId as keyof typeof careerData];
                        return (
                          <td key={careerId} className="border border-ehrdc-neutral-light p-3 text-center">
                            <span className="text-green-600 font-medium">
                              {career?.growthRate || 'N/A'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="border border-ehrdc-neutral-light p-3 font-medium">Future Outlook</td>
                      {selectedCareers.map(careerId => {
                        const career = careerData[careerId as keyof typeof careerData];
                        return (
                          <td key={careerId} className="border border-ehrdc-neutral-light p-3 text-center">
                            {career?.futureOutlook || 'N/A'}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedCareers.length > 1 && (
            <div className="mt-6 text-center">
              <Button className="bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
                <Download className="h-4 w-4 mr-2" />
                Generate Detailed Comparison Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
