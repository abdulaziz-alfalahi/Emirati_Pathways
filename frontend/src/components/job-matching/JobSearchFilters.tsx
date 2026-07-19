
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  MapPin, 
  Building, 
  DollarSign, 
  Briefcase,
  Clock,
  Users,
  Star,
  Settings
} from 'lucide-react';

const JobSearchFilters: React.FC = () => {
  const [filters, setFilters] = useState({
    keywords: '',
    location: '',
    industry: '',
    companySize: '',
    jobType: '',
    experienceLevel: '',
    salaryRange: [5000, 50000],
    remote: false,
    benefits: [] as string[],
    skills: [] as string[]
  });

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Government',
    'Oil & Gas', 'Construction', 'Hospitality', 'Retail', 'Manufacturing'
  ];

  const companySizes = [
    'Startup (1-10)', 'Small (11-50)', 'Medium (51-200)', 
    'Large (201-1000)', 'Enterprise (1000+)'
  ];

  const jobTypes = [
    'Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'
  ];

  const experienceLevels = [
    'Entry Level', 'Mid Level', 'Senior Level', 'Executive', 'Director'
  ];

  const benefitOptions = [
    'Health Insurance', 'Dental Coverage', 'Vision Coverage',
    'Retirement Plan', 'Paid Time Off', 'Flexible Hours',
    'Work from Home', 'Professional Development', 'Gym Membership',
    'Transportation Allowance', 'Housing Allowance', 'Education Allowance'
  ];

  const popularSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'SQL',
    'Project Management', 'Digital Marketing', 'Data Analysis',
    'UI/UX Design', 'Business Analysis', 'Leadership'
  ];

  const searchResults = [
    {
      id: '1',
      title: 'Full Stack Developer',
      company: 'Dubizzle',
      location: 'Dubai',
      salary: 'AED 16,000 - 22,000',
      type: 'Full-time',
      posted: '1 day ago'
    },
    {
      id: '2',
      title: 'Marketing Specialist',
      company: 'Jumeirah Group',
      location: 'Dubai',
      salary: 'AED 10,000 - 14,000',
      type: 'Full-time',
      posted: '2 days ago'
    },
    {
      id: '3',
      title: 'Data Analyst',
      company: 'First Abu Dhabi Bank',
      location: 'Abu Dhabi',
      salary: 'AED 12,000 - 16,000',
      type: 'Full-time',
      posted: '3 days ago'
    }
  ];

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleBenefitToggle = (benefit: string) => {
    setFilters(prev => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter(b => b !== benefit)
        : [...prev.benefits, benefit]
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      keywords: '',
      location: '',
      industry: '',
      companySize: '',
      jobType: '',
      experienceLevel: '',
      salaryRange: [5000, 50000],
      remote: false,
      benefits: [],
      skills: []
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Filters Panel */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-ehrdc-teal" />
              Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Keywords */}
            <div>
              <label className="text-sm font-medium mb-2 block">Keywords</label>
              <div className="relative">
                <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Job title, skills, company..."
                  value={filters.keywords}
                  onChange={(e) => handleFilterChange('keywords', e.target.value)}
                  className="ps-9"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <div className="relative">
                <MapPin className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="City, emirate, or country"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="ps-9"
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="text-sm font-medium mb-2 block">Industry</label>
              <Select value={filters.industry} onValueChange={(value) => handleFilterChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry.toLowerCase()}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company Size */}
            <div>
              <label className="text-sm font-medium mb-2 block">Company Size</label>
              <Select value={filters.companySize} onValueChange={(value) => handleFilterChange('companySize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map((size) => (
                    <SelectItem key={size} value={size.toLowerCase()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Job Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Job Type</label>
              <Select value={filters.jobType} onValueChange={(value) => handleFilterChange('jobType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="text-sm font-medium mb-2 block">Experience Level</label>
              <Select value={filters.experienceLevel} onValueChange={(value) => handleFilterChange('experienceLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((level) => (
                    <SelectItem key={level} value={level.toLowerCase()}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salary Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Salary Range (AED): {filters.salaryRange[0].toLocaleString()} - {filters.salaryRange[1].toLocaleString()}
              </label>
              <Slider
                value={filters.salaryRange}
                onValueChange={(value) => handleFilterChange('salaryRange', value)}
                min={3000}
                max={100000}
                step={1000}
                className="w-full"
              />
            </div>

            {/* Remote Work */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remote"
                checked={filters.remote}
                onCheckedChange={(checked) => handleFilterChange('remote', checked)}
              />
              <label htmlFor="remote" className="text-sm font-medium">
                Remote work opportunities
              </label>
            </div>

            {/* Benefits */}
            <div>
              <label className="text-sm font-medium mb-2 block">Benefits</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {benefitOptions.map((benefit) => (
                  <div key={benefit} className="flex items-center space-x-2">
                    <Checkbox
                      id={benefit}
                      checked={filters.benefits.includes(benefit)}
                      onCheckedChange={() => handleBenefitToggle(benefit)}
                    />
                    <label htmlFor={benefit} className="text-sm">
                      {benefit}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="text-sm font-medium mb-2 block">Skills</label>
              <div className="flex flex-wrap gap-2">
                {popularSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant={filters.skills.includes(skill) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => handleSkillToggle(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <Button variant="outline" onClick={clearAllFilters} className="w-full">
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Search Results */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-ehrdc-teal" />
                Search Results
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {searchResults.length} jobs found
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((job) => (
                <Card key={job.id} className="border-s-4 border-s-ehrdc-teal">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                        <div className="flex items-center gap-2 text-ehrdc-teal mb-2">
                          <Building className="h-4 w-4" />
                          {job.company}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-sm text-muted-foreground">{job.posted}</div>
                        <Badge variant="outline">{job.type}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {job.salary}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1">
                        Apply Now
                      </Button>
                      <Button variant="outline">
                        View Details
                      </Button>
                      <Button variant="outline" size="icon">
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobSearchFilters;
