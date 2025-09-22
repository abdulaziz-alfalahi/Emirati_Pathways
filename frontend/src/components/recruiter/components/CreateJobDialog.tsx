import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Building, MapPin, DollarSign, Users, Award, Globe } from 'lucide-react';

interface CreateJobDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateJob: (jobData: any) => Promise<void>;
}

interface JobFormData {
  // Basic Information
  title: string;
  description: string;
  summary: string;
  
  // Company Information
  company_name: string;
  department: string;
  
  // Job Details
  employment_type: string;
  experience_level: string;
  experience_years_min: number | null;
  experience_years_max: number | null;
  
  // Location
  location: {
    emirate: string;
    city: string;
    area: string;
    is_remote: boolean;
    is_hybrid: boolean;
    remote_percentage: number | null;
  };
  
  // Compensation
  salary: {
    min_salary: number | null;
    max_salary: number | null;
    currency: string;
    is_negotiable: boolean;
    includes_benefits: boolean;
  };
  
  // Requirements and Skills
  requirements: string[];
  responsibilities: string[];
  required_skills: string[];
  preferred_skills: string[];
  education_requirements: string[];
  language_requirements: string[];
  benefits: string[];
  
  // UAE Specific
  emiratization_priority: boolean;
  security_clearance_required: boolean;
  visa_sponsorship_available: boolean;
  requires_uae_experience: boolean;
  arabic_language_required: boolean;
  
  // Categories
  industry: string;
  job_category: string;
  tags: string[];
  
  // Dates
  application_deadline: string;
  start_date: string;
}

const CreateJobDialog = ({ isOpen, onOpenChange, onCreateJob }: CreateJobDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    summary: '',
    company_name: '',
    department: '',
    employment_type: 'full_time',
    experience_level: 'mid_level',
    experience_years_min: null,
    experience_years_max: null,
    location: {
      emirate: '',
      city: '',
      area: '',
      is_remote: false,
      is_hybrid: false,
      remote_percentage: null,
    },
    salary: {
      min_salary: null,
      max_salary: null,
      currency: 'AED',
      is_negotiable: true,
      includes_benefits: false,
    },
    requirements: [],
    responsibilities: [],
    required_skills: [],
    preferred_skills: [],
    education_requirements: [],
    language_requirements: [],
    benefits: [],
    emiratization_priority: false,
    security_clearance_required: false,
    visa_sponsorship_available: true,
    requires_uae_experience: false,
    arabic_language_required: false,
    industry: '',
    job_category: '',
    tags: [],
    application_deadline: '',
    start_date: '',
  });

  const [newItem, setNewItem] = useState('');
  const [currentListType, setCurrentListType] = useState<keyof JobFormData | null>(null);

  const emirates = [
    'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'
  ];

  const employmentTypes = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' },
  ];

  const experienceLevels = [
    { value: 'entry_level', label: 'Entry Level' },
    { value: 'junior', label: 'Junior' },
    { value: 'mid_level', label: 'Mid Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead' },
    { value: 'manager', label: 'Manager' },
    { value: 'director', label: 'Director' },
    { value: 'executive', label: 'Executive' },
  ];

  const industries = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Government', 'Oil & Gas',
    'Construction', 'Tourism', 'Retail', 'Manufacturing', 'Transportation', 'Real Estate'
  ];

  const jobCategories = [
    'Engineering', 'Sales & Marketing', 'Human Resources', 'Finance & Accounting',
    'Operations', 'Customer Service', 'Design', 'Legal', 'Research & Development'
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof JobFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addToList = (listType: keyof JobFormData) => {
    if (newItem.trim() && Array.isArray(formData[listType])) {
      setFormData(prev => ({
        ...prev,
        [listType]: [...(prev[listType] as string[]), newItem.trim()]
      }));
      setNewItem('');
      setCurrentListType(null);
    }
  };

  const removeFromList = (listType: keyof JobFormData, index: number) => {
    if (Array.isArray(formData[listType])) {
      setFormData(prev => ({
        ...prev,
        [listType]: (prev[listType] as string[]).filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Transform form data to match backend API structure
      const jobData = {
        ...formData,
        company_id: 'temp-company-id', // This should be set based on the logged-in user's company
        posted_by: 'current-user-id', // This should be set from auth context
        status: 'published',
        priority: 'normal',
      };

      await onCreateJob(jobData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        summary: '',
        company_name: '',
        department: '',
        employment_type: 'full_time',
        experience_level: 'mid_level',
        experience_years_min: null,
        experience_years_max: null,
        location: {
          emirate: '',
          city: '',
          area: '',
          is_remote: false,
          is_hybrid: false,
          remote_percentage: null,
        },
        salary: {
          min_salary: null,
          max_salary: null,
          currency: 'AED',
          is_negotiable: true,
          includes_benefits: false,
        },
        requirements: [],
        responsibilities: [],
        required_skills: [],
        preferred_skills: [],
        education_requirements: [],
        language_requirements: [],
        benefits: [],
        emiratization_priority: false,
        security_clearance_required: false,
        visa_sponsorship_available: true,
        requires_uae_experience: false,
        arabic_language_required: false,
        industry: '',
        job_category: '',
        tags: [],
        application_deadline: '',
        start_date: '',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderListInput = (listType: keyof JobFormData, label: string, placeholder: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex space-x-2">
        <Input
          value={currentListType === listType ? newItem : ''}
          onChange={(e) => {
            setNewItem(e.target.value);
            setCurrentListType(listType);
          }}
          placeholder={placeholder}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addToList(listType);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addToList(listType)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(formData[listType] as string[])?.map((item, index) => (
          <Badge key={index} variant="secondary" className="flex items-center space-x-1">
            <span>{item}</span>
            <button
              type="button"
              onClick={() => removeFromList(listType, index)}
              className="ml-1 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Create New Job Posting</span>
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive job posting with UAE-specific requirements and features.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="compensation">Compensation</TabsTrigger>
            <TabsTrigger value="uae">UAE Specific</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Senior Software Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      placeholder="Dubai Future Foundation"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employment_type">Employment Type</Label>
                    <Select value={formData.employment_type} onValueChange={(value) => handleInputChange('employment_type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience_level">Experience Level</Label>
                    <Select value={formData.experience_level} onValueChange={(value) => handleInputChange('experience_level', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Engineering"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job_category">Job Category</Label>
                    <Select value={formData.job_category} onValueChange={(value) => handleInputChange('job_category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Job Summary</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    placeholder="Brief overview of the role..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detailed job description with responsibilities, requirements, and benefits..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Location Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emirate">Emirate *</Label>
                    <Select value={formData.location.emirate} onValueChange={(value) => handleInputChange('location.emirate', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select emirate" />
                      </SelectTrigger>
                      <SelectContent>
                        {emirates.map((emirate) => (
                          <SelectItem key={emirate} value={emirate}>
                            {emirate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.location.city}
                      onChange={(e) => handleInputChange('location.city', e.target.value)}
                      placeholder="Dubai"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Area</Label>
                    <Input
                      id="area"
                      value={formData.location.area}
                      onChange={(e) => handleInputChange('location.area', e.target.value)}
                      placeholder="DIFC"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_remote"
                      checked={formData.location.is_remote}
                      onCheckedChange={(checked) => handleInputChange('location.is_remote', checked)}
                    />
                    <Label htmlFor="is_remote">Remote Work Available</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_hybrid"
                      checked={formData.location.is_hybrid}
                      onCheckedChange={(checked) => handleInputChange('location.is_hybrid', checked)}
                    />
                    <Label htmlFor="is_hybrid">Hybrid Work Available</Label>
                  </div>

                  {formData.location.is_hybrid && (
                    <div className="space-y-2">
                      <Label htmlFor="remote_percentage">Remote Work Percentage</Label>
                      <Input
                        id="remote_percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.location.remote_percentage || ''}
                        onChange={(e) => handleInputChange('location.remote_percentage', parseInt(e.target.value) || null)}
                        placeholder="50"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>Requirements & Skills</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience_years_min">Min Experience (Years)</Label>
                    <Input
                      id="experience_years_min"
                      type="number"
                      min="0"
                      value={formData.experience_years_min || ''}
                      onChange={(e) => handleInputChange('experience_years_min', parseInt(e.target.value) || null)}
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience_years_max">Max Experience (Years)</Label>
                    <Input
                      id="experience_years_max"
                      type="number"
                      min="0"
                      value={formData.experience_years_max || ''}
                      onChange={(e) => handleInputChange('experience_years_max', parseInt(e.target.value) || null)}
                      placeholder="8"
                    />
                  </div>
                </div>

                {renderListInput('required_skills', 'Required Skills', 'e.g., JavaScript, React, Node.js')}
                {renderListInput('preferred_skills', 'Preferred Skills', 'e.g., TypeScript, AWS, Docker')}
                {renderListInput('education_requirements', 'Education Requirements', 'e.g., Bachelor\'s degree in Computer Science')}
                {renderListInput('language_requirements', 'Language Requirements', 'e.g., English (Fluent), Arabic (Basic)')}
                {renderListInput('responsibilities', 'Key Responsibilities', 'e.g., Develop web applications')}
                {renderListInput('requirements', 'General Requirements', 'e.g., Valid UAE driving license')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compensation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Compensation & Benefits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_salary">Minimum Salary (AED)</Label>
                    <Input
                      id="min_salary"
                      type="number"
                      min="0"
                      value={formData.salary.min_salary || ''}
                      onChange={(e) => handleInputChange('salary.min_salary', parseInt(e.target.value) || null)}
                      placeholder="15000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_salary">Maximum Salary (AED)</Label>
                    <Input
                      id="max_salary"
                      type="number"
                      min="0"
                      value={formData.salary.max_salary || ''}
                      onChange={(e) => handleInputChange('salary.max_salary', parseInt(e.target.value) || null)}
                      placeholder="25000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.salary.currency} onValueChange={(value) => handleInputChange('salary.currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_negotiable"
                      checked={formData.salary.is_negotiable}
                      onCheckedChange={(checked) => handleInputChange('salary.is_negotiable', checked)}
                    />
                    <Label htmlFor="is_negotiable">Salary is Negotiable</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includes_benefits"
                      checked={formData.salary.includes_benefits}
                      onCheckedChange={(checked) => handleInputChange('salary.includes_benefits', checked)}
                    />
                    <Label htmlFor="includes_benefits">Includes Benefits Package</Label>
                  </div>
                </div>

                {renderListInput('benefits', 'Benefits', 'e.g., Health insurance, Annual leave, Performance bonus')}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="application_deadline">Application Deadline</Label>
                    <Input
                      id="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Expected Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uae" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>UAE-Specific Requirements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emiratization_priority"
                      checked={formData.emiratization_priority}
                      onCheckedChange={(checked) => handleInputChange('emiratization_priority', checked)}
                    />
                    <Label htmlFor="emiratization_priority">Emiratization Priority (UAE Nationals Preferred)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="security_clearance_required"
                      checked={formData.security_clearance_required}
                      onCheckedChange={(checked) => handleInputChange('security_clearance_required', checked)}
                    />
                    <Label htmlFor="security_clearance_required">Security Clearance Required</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="visa_sponsorship_available"
                      checked={formData.visa_sponsorship_available}
                      onCheckedChange={(checked) => handleInputChange('visa_sponsorship_available', checked)}
                    />
                    <Label htmlFor="visa_sponsorship_available">Visa Sponsorship Available</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requires_uae_experience"
                      checked={formData.requires_uae_experience}
                      onCheckedChange={(checked) => handleInputChange('requires_uae_experience', checked)}
                    />
                    <Label htmlFor="requires_uae_experience">UAE Work Experience Required</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="arabic_language_required"
                      checked={formData.arabic_language_required}
                      onCheckedChange={(checked) => handleInputChange('arabic_language_required', checked)}
                    />
                    <Label htmlFor="arabic_language_required">Arabic Language Required</Label>
                  </div>
                </div>

                {renderListInput('tags', 'Job Tags', 'e.g., D33 and Talent33, D33 Talent33, Innovation')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !formData.title || !formData.description}>
            {isLoading ? 'Creating...' : 'Create Job Posting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobDialog;

