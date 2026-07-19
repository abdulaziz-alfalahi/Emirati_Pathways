
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, TrendingUp, Award, MapPin, Users } from 'lucide-react';

export const SalaryBenchmarkTool: React.FC = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [experience, setExperience] = useState([5]);
  const [location, setLocation] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [results, setResults] = useState<any>(null);

  const salaryData = [
    { percentile: '25th', salary: 12000, label: 'Entry Level' },
    { percentile: '50th', salary: 18000, label: 'Market Average' },
    { percentile: '75th', salary: 25000, label: 'Experienced' },
    { percentile: '90th', salary: 35000, label: 'Senior Level' }
  ];

  const handleBenchmark = () => {
    // Simulate salary calculation
    const baseSalary = 18000;
    const experienceMultiplier = 1 + (experience[0] * 0.1);
    const calculatedSalary = Math.round(baseSalary * experienceMultiplier);
    
    setResults({
      estimatedSalary: calculatedSalary,
      marketPosition: experience[0] > 7 ? '75th percentile' : experience[0] > 3 ? '50th percentile' : '25th percentile',
      confidence: 85
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-ehrdc-teal" />
            Salary Benchmark Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Job Title</label>
              <Input
                placeholder="e.g., Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Industry</label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance & Banking</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value='compliance_auditor'>Government</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dubai">Dubai</SelectItem>
                  <SelectItem value="abu-dhabi">Abu Dhabi</SelectItem>
                  <SelectItem value="sharjah">Sharjah</SelectItem>
                  <SelectItem value="ajman">Ajman</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Company Size</label>
              <Select value={companySize} onValueChange={setCompanySize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup (1-50)</SelectItem>
                  <SelectItem value="small">Small (51-200)</SelectItem>
                  <SelectItem value="medium">Medium (201-1000)</SelectItem>
                  <SelectItem value="large">Large (1000+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">
                Years of Experience: {experience[0]} years
              </label>
              <Slider
                value={experience}
                onValueChange={setExperience}
                max={20}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <Button onClick={handleBenchmark} className="w-full bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
            <Search className="h-4 w-4 me-2" />
            Benchmark My Salary
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-ehrdc-teal" />
              Your Salary Benchmark Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-2 border-ehrdc-teal/20">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-ehrdc-teal">AED {results.estimatedSalary.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Estimated Monthly Salary</div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.marketPosition}</div>
                  <div className="text-sm text-muted-foreground">Market Position</div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{results.confidence}%</div>
                  <div className="text-sm text-muted-foreground">Confidence Level</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold mb-3">Market Salary Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salaryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="percentile" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`AED ${value?.toLocaleString()}`, 'Salary']} />
                  <Bar dataKey="salary" fill="#006E6D" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-3">Salary Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Skills premium: +15% for certifications</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Location premium: Dubai +20%</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-sm">Company size premium: Large +25%</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm">Market trend: +8% growth this year</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Salary Factors Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Experience Level</span>
              <Badge variant="secondary">+{experience[0] * 10}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Industry Premium</span>
              <Badge variant="secondary">+15%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Location Premium</span>
              <Badge variant="secondary">+20%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Company Size</span>
              <Badge variant="secondary">+25%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
