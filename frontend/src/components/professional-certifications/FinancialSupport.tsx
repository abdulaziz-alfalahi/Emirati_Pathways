
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Award, Building, Calendar, CheckCircle, Users } from 'lucide-react';

export const FinancialSupport: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const governmentPrograms = [
    {
      id: '1',
      name: 'MOHRE Skills Development Grant',
      provider: 'Ministry of Human Resources and Emiratisation',
      coverage: '100%',
      maxAmount: 'AED 15,000',
      eligibility: ['UAE National', 'Employed in private sector', 'Approved certification list'],
      certifications: ['AWS', 'Microsoft', 'Google Cloud', 'PMP', 'CISSP'],
      applicationDeadline: '2024-06-30',
      processingTime: '4-6 weeks',
      requirements: 'Employment contract, Emirates ID, Certification details',
      status: 'Open'
    },
    {
      id: '2',
      name: 'ADEK Professional Development Scholarship',
      provider: 'Abu Dhabi Department of Education and Knowledge',
      coverage: '75%',
      maxAmount: 'AED 20,000',
      eligibility: ['UAE National', 'Abu Dhabi resident', 'Education sector employee'],
      certifications: ['Teaching Credentials', 'Educational Leadership', 'STEAM Certifications'],
      applicationDeadline: '2024-05-15',
      processingTime: '6-8 weeks',
      requirements: 'Teaching license, Employer endorsement, Study plan',
      status: 'Open'
    },
    {
      id: '3',
      name: 'Dubai Future Foundation Tech Grant',
      provider: 'Dubai Future Foundation',
      coverage: '90%',
      maxAmount: 'AED 25,000',
      eligibility: ['UAE National', 'Technology sector', 'Innovation focus'],
      certifications: ['AI/ML', 'Blockchain', 'IoT', 'Cybersecurity', 'Data Science'],
      applicationDeadline: '2024-04-30',
      processingTime: '3-4 weeks',
      requirements: 'Innovation proposal, Portfolio, Industry recommendation',
      status: 'Closing Soon'
    }
  ];

  const employerPrograms = [
    {
      id: '1',
      company: 'Emirates NBD',
      programName: 'Professional Excellence Initiative',
      coverage: '100%',
      conditions: 'Minimum 2 years service, Performance rating A/B',
      certifications: ['CFA', 'FRM', 'PMP', 'CISSP'],
      annualBudget: 'AED 50,000 per employee',
      applicationProcess: 'Internal portal application',
      contactEmail: 'learning@emiratesnbd.com'
    },
    {
      id: '2',
      company: 'Etisalat',
      programName: 'Digital Skills Advancement',
      coverage: '85%',
      conditions: 'Technical role, Manager approval',
      certifications: ['AWS', 'Azure', 'Google Cloud', 'CISSP', 'CISM'],
      annualBudget: 'AED 40,000 per employee',
      applicationProcess: 'HR department submission',
      contactEmail: 'hr-development@etisalat.ae'
    },
    {
      id: '3',
      company: 'ADNOC',
      programName: 'Leadership & Technical Excellence',
      coverage: '100%',
      conditions: 'Permanent employee, Career development plan',
      certifications: ['PMP', 'Six Sigma', 'Safety Certifications', 'Engineering'],
      annualBudget: 'AED 60,000 per employee',
      applicationProcess: 'Annual planning cycle',
      contactEmail: 'talent-development@adnoc.ae'
    }
  ];

  const scholarships = [
    {
      id: '1',
      name: 'UAE Excellence in Technology Scholarship',
      provider: 'Private Foundation',
      amount: 'AED 30,000',
      recipients: 50,
      deadline: '2024-07-31',
      requirements: ['UAE National', 'STEM background', 'Essay submission'],
      focus: 'Emerging Technologies',
      renewable: true
    },
    {
      id: '2',
      name: 'Women in Finance Certification Grant',
      provider: 'UAE Banking Federation',
      amount: 'AED 20,000',
      recipients: 25,
      deadline: '2024-05-30',
      requirements: ['UAE National Woman', 'Finance sector', 'Career goals statement'],
      focus: 'Financial Services',
      renewable: false
    }
  ];

  const budgetCalculator = {
    selectedCertification: '',
    studyMaterials: 1500,
    trainingCourse: 2500,
    examFee: 1000,
    totalCost: 5000,
    governmentCoverage: 4500,
    employerCoverage: 500,
    personalCost: 0
  };

  const filteredPrograms = governmentPrograms.filter(program => {
    return selectedCategory === 'all' || program.provider.includes(selectedCategory);
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Open': 'bg-green-100 text-green-800',
      'Closing Soon': 'bg-orange-100 text-orange-800',
      'Closed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Financial Support</h2>
          <p className="text-muted-foreground">Government subsidies, employer sponsorship, and scholarship opportunities for certification costs</p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">AED 85M</div>
            <div className="text-sm text-muted-foreground">Available Funding</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Building className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">15+</div>
            <div className="text-sm text-muted-foreground">Government Programs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">250+</div>
            <div className="text-sm text-muted-foreground">Employer Partners</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">89%</div>
            <div className="text-sm text-muted-foreground">Average Coverage</div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Calculator */}
      <Card>
        <CardHeader>
          <CardTitle>Certification Cost Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Select Your Certification</h4>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose certification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws-saa">AWS Solutions Architect</SelectItem>
                  <SelectItem value="pmp">Project Management Professional</SelectItem>
                  <SelectItem value="cfa-1">CFA Level 1</SelectItem>
                  <SelectItem value="cissp">CISSP</SelectItem>
                </SelectContent>
              </Select>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Study Materials:</span>
                  <span>AED {budgetCalculator.studyMaterials.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Training Course:</span>
                  <span>AED {budgetCalculator.trainingCourse.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exam Fee:</span>
                  <span>AED {budgetCalculator.examFee.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Cost:</span>
                    <span>AED {budgetCalculator.totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Funding Breakdown</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Government Coverage (90%)</span>
                    <span>AED {budgetCalculator.governmentCoverage.toLocaleString()}</span>
                  </div>
                  <Progress value={90} className="h-2 bg-green-100" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Employer Coverage (10%)</span>
                    <span>AED {budgetCalculator.employerCoverage.toLocaleString()}</span>
                  </div>
                  <Progress value={10} className="h-2 bg-blue-100" />
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium text-green-600">
                    <span>Your Cost:</span>
                    <span>AED {budgetCalculator.personalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Government Programs */}
      <Card>
        <CardHeader>
          <CardTitle>Government Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {governmentPrograms.map((program) => (
              <div key={program.id} className="border rounded-lg p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg mb-1">{program.name}</h4>
                        <p className="text-sm text-muted-foreground">{program.provider}</p>
                      </div>
                      <Badge className={getStatusColor(program.status)}>{program.status}</Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <span className="font-medium">Coverage:</span>
                        <div className="text-green-600 font-medium">{program.coverage} (up to {program.maxAmount})</div>
                      </div>
                      <div>
                        <span className="font-medium">Deadline:</span>
                        <div className="text-muted-foreground">{program.applicationDeadline}</div>
                      </div>
                      <div>
                        <span className="font-medium">Processing:</span>
                        <div className="text-muted-foreground">{program.processingTime}</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="font-medium text-sm">Eligible Certifications:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {program.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-sm">Eligibility:</span>
                      <ul className="text-sm text-muted-foreground mt-1">
                        {program.eligibility.map((req, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-40">
                    <Button size="sm" className="bg-slate-800 hover:bg-slate-700">
                      Apply Now
                    </Button>
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employer Programs */}
      <Card>
        <CardHeader>
          <CardTitle>Employer Sponsorship Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employerPrograms.map((program) => (
              <div key={program.id} className="border rounded-lg p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Building className="h-8 w-8 text-slate-600" />
                      <div>
                        <h4 className="font-semibold">{program.company}</h4>
                        <p className="text-sm text-muted-foreground">{program.programName}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Coverage:</span>
                        <div className="text-green-600 font-medium">{program.coverage}</div>
                        <span className="font-medium">Annual Budget:</span>
                        <div className="text-muted-foreground">{program.annualBudget}</div>
                      </div>
                      <div>
                        <span className="font-medium">Conditions:</span>
                        <div className="text-muted-foreground">{program.conditions}</div>
                        <span className="font-medium">Application:</span>
                        <div className="text-muted-foreground">{program.applicationProcess}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="font-medium text-sm">Supported Certifications:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {program.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-40">
                    <Button size="sm" variant="outline">
                      Contact HR
                    </Button>
                    <Button size="sm" variant="outline">
                      View Policy
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scholarships */}
      <Card>
        <CardHeader>
          <CardTitle>Private Scholarships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {scholarships.map((scholarship) => (
              <div key={scholarship.id} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">{scholarship.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{scholarship.provider}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium text-green-600">{scholarship.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipients:</span>
                    <span>{scholarship.recipients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deadline:</span>
                    <span>{scholarship.deadline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Renewable:</span>
                    <span>{scholarship.renewable ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="font-medium text-sm">Requirements:</span>
                  <ul className="text-xs text-muted-foreground mt-1">
                    {scholarship.requirements.map((req, index) => (
                      <li key={index}>• {req}</li>
                    ))}
                  </ul>
                </div>

                <Button size="sm" className="w-full mt-3 bg-slate-800 hover:bg-slate-700">
                  Apply for Scholarship
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
