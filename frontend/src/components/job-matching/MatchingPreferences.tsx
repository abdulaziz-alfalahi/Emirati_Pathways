
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Settings, MapPin, DollarSign, Clock, Building, Target } from 'lucide-react';

export const MatchingPreferences: React.FC = () => {
  const [salaryExpectation, setSalaryExpectation] = useState([15000]);
  const [matchThreshold, setMatchThreshold] = useState([70]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'TypeScript']);

  const skills = [
    'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 
    'Machine Learning', 'Data Analysis', 'Project Management', 'DevOps'
  ];

  const workStyles = [
    { id: 'remote', label: 'Remote Work', checked: true },
    { id: 'hybrid', label: 'Hybrid Work', checked: true },
    { id: 'onsite', label: 'On-site Work', checked: false },
    { id: 'flexible', label: 'Flexible Hours', checked: true },
    { id: 'travel', label: 'Travel Opportunities', checked: false }
  ];

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  return (
    <div className="space-y-6">
      {/* Job Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-ehrdc-teal" />
            Job Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Preferred Job Title</label>
            <Input placeholder="e.g., Senior Software Engineer" />
          </div>

          {/* Location Preferences */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Preferred Locations
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Dubai', 'Abu Dhabi', 'Sharjah', 'Remote'].map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox id={location} />
                  <label htmlFor={location} className="text-sm">{location}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Preferences */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Building className="h-4 w-4" />
              Preferred Industries
            </label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="education">Education</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company Size */}
          <div>
            <label className="text-sm font-medium mb-2 block">Company Size Preference</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup (1-50 employees)</SelectItem>
                <SelectItem value="medium">Medium (51-500 employees)</SelectItem>
                <SelectItem value="large">Large (500+ employees)</SelectItem>
                <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Compensation Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-ehrdc-teal" />
            Compensation Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Salary Expectation */}
          <div>
            <label className="text-sm font-medium mb-2 block">Expected Salary (AED/month)</label>
            <Slider
              value={salaryExpectation}
              onValueChange={setSalaryExpectation}
              max={50000}
              min={5000}
              step={1000}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>AED 5,000</span>
              <span className="font-medium">AED {salaryExpectation[0].toLocaleString()}</span>
              <span>AED 50,000+</span>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <label className="text-sm font-medium mb-2 block">Important Benefits</label>
            <div className="grid grid-cols-2 gap-2">
              {['Health Insurance', 'Visa Sponsorship', 'Annual Leave', 'Learning Budget', 'Performance Bonus', 'Stock Options'].map((benefit) => (
                <div key={benefit} className="flex items-center space-x-2">
                  <Checkbox id={benefit} />
                  <label htmlFor={benefit} className="text-sm">{benefit}</label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-ehrdc-teal" />
            Skills & Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Skills */}
          <div>
            <label className="text-sm font-medium mb-2 block">Key Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedSkills.map((skill) => (
                <Badge key={skill} className="bg-ehrdc-teal/10 text-ehrdc-teal">
                  {skill}
                  <button
                    onClick={() => toggleSkill(skill)}
                    className="ml-1 text-xs"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.filter(skill => !selectedSkills.includes(skill)).map((skill) => (
                <Button
                  key={skill}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </Button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="text-sm font-medium mb-2 block">Experience Level</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                <SelectItem value="senior">Senior Level (5-8 years)</SelectItem>
                <SelectItem value="lead">Lead/Principal (8+ years)</SelectItem>
                <SelectItem value="executive">Executive (10+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Matching Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-ehrdc-teal" />
            Matching Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Match Threshold */}
          <div>
            <label className="text-sm font-medium mb-2 block">Minimum Match Percentage</label>
            <Slider
              value={matchThreshold}
              onValueChange={setMatchThreshold}
              max={100}
              min={50}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>50%</span>
              <span className="font-medium">{matchThreshold[0]}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Work Style Preferences */}
          <div>
            <label className="text-sm font-medium mb-2 block">Work Style Preferences</label>
            <div className="space-y-2">
              {workStyles.map((style) => (
                <div key={style.id} className="flex items-center space-x-2">
                  <Checkbox id={style.id} defaultChecked={style.checked} />
                  <label htmlFor={style.id} className="text-sm">{style.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <label className="text-sm font-medium mb-2 block">Notification Preferences</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="email-daily" defaultChecked />
                <label htmlFor="email-daily" className="text-sm">Daily email digest</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="email-instant" />
                <label htmlFor="email-instant" className="text-sm">Instant notifications for high matches</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="sms" />
                <label htmlFor="sms" className="text-sm">SMS notifications</label>
              </div>
            </div>
          </div>

          {/* Save Preferences */}
          <div className="flex gap-2">
            <Button className="flex-1">
              Save Preferences
            </Button>
            <Button variant="outline" className="flex-1">
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
