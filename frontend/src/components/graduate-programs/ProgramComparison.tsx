
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, X, Star, DollarSign, Clock, Users, TrendingUp } from 'lucide-react';

export const ProgramComparison: React.FC = () => {
  const [selectedPrograms, setSelectedPrograms] = useState([
    { id: 1, name: 'Emirates Future Leaders', company: 'Emirates Group' },
    { id: 2, name: 'ADNOC Graduate Program', company: 'ADNOC' }
  ]);

  const availablePrograms = [
    { id: 3, name: 'ADCB Banking Scheme', company: 'ADCB' },
    { id: 4, name: 'Etisalat Tech Graduate', company: 'Etisalat' },
    { id: 5, name: 'Dubai Health Authority', company: 'DHA' }
  ];

  const comparisonData = {
    1: {
      name: 'Emirates Future Leaders',
      company: 'Emirates Group',
      salary: 15000,
      duration: 24,
      rating: 4.8,
      rotations: 4,
      mentorship: 'Yes',
      progressionSpeed: 85,
      workLifeBalance: 78,
      learningOpportunities: 92,
      networkingScore: 88,
      benefits: ['Housing allowance', 'Travel benefits', 'Health insurance', 'Performance bonus'],
      trainingComponents: ['Leadership workshops', 'Technical training', 'Cross-cultural exposure', 'Project management']
    },
    2: {
      name: 'ADNOC Graduate Program',
      company: 'ADNOC',
      salary: 18000,
      duration: 18,
      rating: 4.9,
      rotations: 3,
      mentorship: 'Yes',
      progressionSpeed: 90,
      workLifeBalance: 75,
      learningOpportunities: 95,
      networkingScore: 85,
      benefits: ['Performance bonus', 'Training budget', 'Career mentorship', 'Health insurance'],
      trainingComponents: ['Technical excellence', 'Safety training', 'Leadership development', 'Innovation workshops']
    }
  };

  const salaryData = selectedPrograms.map(program => ({
    name: comparisonData[program.id]?.company || program.company,
    salary: comparisonData[program.id]?.salary || 0
  }));

  const addProgram = (programId: string) => {
    const program = availablePrograms.find(p => p.id === parseInt(programId));
    if (program && selectedPrograms.length < 3) {
      setSelectedPrograms([...selectedPrograms, program]);
    }
  };

  const removeProgram = (programId: number) => {
    setSelectedPrograms(selectedPrograms.filter(p => p.id !== programId));
  };

  return (
    <div className="space-y-6">
      {/* Program Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Compare Graduate Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium">Selected Programs ({selectedPrograms.length}/3):</span>
            {selectedPrograms.map((program) => (
              <Badge key={program.id} variant="outline" className="flex items-center gap-2">
                {program.name}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeProgram(program.id)}
                />
              </Badge>
            ))}
          </div>
          
          {selectedPrograms.length < 3 && (
            <div className="flex items-center gap-4">
              <Select onValueChange={addProgram}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Add program to compare" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrograms.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.name} - {program.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Plus className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPrograms.length >= 2 && (
        <>
          {/* Salary Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-ehrdc-teal">Salary Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salaryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`AED ${value}`, 'Monthly Salary']} />
                  <Bar dataKey="salary" fill="#006E6D" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-ehrdc-teal">Program Details Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      {selectedPrograms.map((program) => (
                        <th key={program.id} className="text-left p-4 font-semibold text-ehrdc-teal">
                          {comparisonData[program.id]?.name || program.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Company</td>
                      {selectedPrograms.map((program) => (
                        <td key={program.id} className="p-4">
                          {comparisonData[program.id]?.company || program.company}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Monthly Salary</td>
                      {selectedPrograms.map((program) => (
                        <td key={program.id} className="p-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold">AED {comparisonData[program.id]?.salary || 'N/A'}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Duration</td>
                      {selectedPrograms.map((program) => (
                        <td key={program.id} className="p-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-ehrdc-teal" />
                            <span>{comparisonData[program.id]?.duration || 'N/A'} months</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Graduate Rating</td>
                      {selectedPrograms.map((program) => (
                        <td key={program.id} className="p-4">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{comparisonData[program.id]?.rating || 'N/A'}/5</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Career Progression Speed</td>
                      {selectedPrograms.map((program) => (
                        <td key={program.id} className="p-4">
                          <div className="space-y-2">
                            <Progress 
                              value={comparisonData[program.id]?.progressionSpeed || 0} 
                              className="h-2" 
                            />
                            <span className="text-sm text-gray-600">
                              {comparisonData[program.id]?.progressionSpeed || 0}%
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Work-Life Balance</td>
                      {selectedPrograms.map((program) => (
                        <td key={program.id} className="p-4">
                          <div className="space-y-2">
                            <Progress 
                              value={comparisonData[program.id]?.workLifeBalance || 0} 
                              className="h-2" 
                            />
                            <span className="text-sm text-gray-600">
                              {comparisonData[program.id]?.workLifeBalance || 0}%
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Benefits & Training Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-ehrdc-teal">Benefits Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPrograms.map((program) => (
                  <div key={program.id} className="mb-6 last:mb-0">
                    <h4 className="font-semibold mb-3">{comparisonData[program.id]?.name}</h4>
                    <div className="space-y-2">
                      {(comparisonData[program.id]?.benefits || []).map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-ehrdc-teal rounded-full"></div>
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-ehrdc-teal">Training Components</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPrograms.map((program) => (
                  <div key={program.id} className="mb-6 last:mb-0">
                    <h4 className="font-semibold mb-3">{comparisonData[program.id]?.name}</h4>
                    <div className="space-y-2">
                      {(comparisonData[program.id]?.trainingComponents || []).map((component, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">{component}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
