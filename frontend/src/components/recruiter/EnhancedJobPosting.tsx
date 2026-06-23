import React, { useState, useEffect } from 'react';
import { getAuthToken } from '@/utils/tokenUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Briefcase, 
  GraduationCap, 
  Users, 
  Calendar,
  MapPin,
  DollarSign,
  Award,
  BookOpen,
  Clock,
  Target,
  Sparkles,
  Save,
  Send,
  Eye
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Types for educational opportunities
interface EducationalDetails {
  target_age_group?: string;
  age_range_min?: number;
  age_range_max?: number;
  academic_prerequisites?: string[];
  program_duration?: string;
  program_schedule?: string;
  program_format?: string;
  certification_offered?: string;
  learning_outcomes?: string[];
  skills_developed?: string[];
  program_cost?: number;
  scholarship_amount?: number;
  financial_aid_available?: boolean;
  application_requirements?: string[];
  required_documents?: string[];
  max_participants?: number;
  instructor_info?: string;
  contact_person?: string;
}

interface OpportunityFormData {
  title: string;
  description: string;
  employment_type: string;
  company_name: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  educational_details?: EducationalDetails;
  enhance_with_ai: boolean;
}

const EMPLOYMENT_TYPES = [
  // Traditional Employment
  { value: 'full_time', label: 'Full-time Job', category: 'employment', icon: Briefcase },
  { value: 'part_time', label: 'Part-time Job', category: 'employment', icon: Briefcase },
  { value: 'contract', label: 'Contract Position', category: 'employment', icon: Briefcase },
  { value: 'temporary', label: 'Temporary Position', category: 'employment', icon: Briefcase },
  { value: 'internship', label: 'Internship', category: 'employment', icon: Briefcase },
  { value: 'freelance', label: 'Freelance Project', category: 'employment', icon: Briefcase },
  
  // Educational Opportunities
  { value: 'summer_camp', label: 'Summer Camp', category: 'education', icon: GraduationCap },
  { value: 'winter_camp', label: 'Winter Camp', category: 'education', icon: GraduationCap },
  { value: 'scholarship', label: 'Scholarship', category: 'education', icon: Award },
  { value: 'vocational_training', label: 'Vocational Training', category: 'education', icon: BookOpen },
  { value: 'apprenticeship', label: 'Apprenticeship Program', category: 'education', icon: Users },
  { value: 'certification_program', label: 'Certification Program', category: 'education', icon: Award },
  { value: 'workshop', label: 'Workshop', category: 'education', icon: BookOpen },
  { value: 'seminar', label: 'Seminar', category: 'education', icon: BookOpen },
  { value: 'mentorship_program', label: 'Mentorship Program', category: 'education', icon: Users },
  { value: 'bootcamp', label: 'Bootcamp', category: 'education', icon: Target },
  { value: 'exchange_program', label: 'Exchange Program', category: 'education', icon: GraduationCap },
];

const AGE_GROUPS = [
  { value: 'youth_15_18', label: 'Youth (15-18)', description: 'High school students' },
  { value: 'young_adult_18_25', label: 'Young Adults (18-25)', description: 'University students and early career' },
  { value: 'adult_25_35', label: 'Adults (25-35)', description: 'Early to mid-career professionals' },
  { value: 'mid_career_35_45', label: 'Mid-Career (35-45)', description: 'Experienced professionals' },
  { value: 'senior_45_plus', label: 'Senior (45+)', description: 'Senior professionals and executives' },
  { value: 'all_ages', label: 'All Ages', description: 'Open to all age groups' },
];

const PROGRAM_SCHEDULES = [
  'Full-time',
  'Part-time', 
  'Weekends',
  'Evenings',
  'Flexible',
  'Online',
  'Hybrid'
];

const PROGRAM_FORMATS = [
  'In-person',
  'Online',
  'Hybrid',
  'Self-paced',
  'Live sessions',
  'Recorded content'
];

const EnhancedJobPosting = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<OpportunityFormData>({
    title: '',
    description: '',
    employment_type: '',
    company_name: '',
    location: '',
    enhance_with_ai: true,
    educational_details: {
      academic_prerequisites: [],
      learning_outcomes: [],
      skills_developed: [],
      application_requirements: [],
      required_documents: [],
      financial_aid_available: false
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');

  // Check if current type is educational
  const isEducationalOpportunity = () => {
    const selectedType = EMPLOYMENT_TYPES.find(type => type.value === formData.employment_type);
    return selectedType?.category === 'education';
  };

  // Handle form field changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle educational details changes
  const handleEducationalChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      educational_details: {
        ...prev.educational_details,
        [field]: value
      }
    }));
  };

  // Handle array field changes (prerequisites, outcomes, etc.)
  const handleArrayFieldChange = (field: string, index: number, value: string) => {
    setFormData(prev => {
      const currentArray = prev.educational_details?.[field as keyof EducationalDetails] as string[] || [];
      const newArray = [...currentArray];
      newArray[index] = value;
      
      return {
        ...prev,
        educational_details: {
          ...prev.educational_details,
          [field]: newArray
        }
      };
    });
  };

  // Add new array item
  const addArrayItem = (field: string) => {
    setFormData(prev => {
      const currentArray = prev.educational_details?.[field as keyof EducationalDetails] as string[] || [];
      
      return {
        ...prev,
        educational_details: {
          ...prev.educational_details,
          [field]: [...currentArray, '']
        }
      };
    });
  };

  // Remove array item
  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => {
      const currentArray = prev.educational_details?.[field as keyof EducationalDetails] as string[] || [];
      const newArray = currentArray.filter((_, i) => i !== index);
      
      return {
        ...prev,
        educational_details: {
          ...prev.educational_details,
          [field]: newArray
        }
      };
    });
  };

  // Get AI enhancement
  const handleAIEnhancement = async () => {
    if (!formData.description || !formData.employment_type) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide description and opportunity type for AI enhancement'
      });
      return;
    }

    try {
      const response = await fetch('/api/educational/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          description: formData.description,
          opportunity_type: formData.employment_type
        })
      });

      const result = await response.json();

      if (result.success) {
        const enhancement = result.enhancement;
        
        // Update form with AI enhancements
        setFormData(prev => ({
          ...prev,
          title: enhancement.enhanced_title || prev.title,
          description: enhancement.enhanced_description || prev.description,
          educational_details: {
            ...prev.educational_details,
            ...enhancement.educational_details
          }
        }));

        toast({
          title: 'AI Enhancement Applied!',
          description: `Enhanced with ${enhancement.ai_confidence}% confidence`
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Enhancement Failed',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Submit opportunity
  const handleSubmit = async (action: 'draft' | 'publish') => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/opportunities/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          ...formData,
          status: action === 'draft' ? 'draft' : 'published'
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: `Opportunity ${action === 'draft' ? 'Saved' : 'Published'}!`,
          description: `${formData.title} has been ${action === 'draft' ? 'saved as draft' : 'published successfully'}`
        });

        // Reset form
        setFormData({
          title: '',
          description: '',
          employment_type: '',
          company_name: '',
          location: '',
          enhance_with_ai: true,
          educational_details: {
            academic_prerequisites: [],
            learning_outcomes: [],
            skills_developed: [],
            application_requirements: [],
            required_documents: [],
            financial_aid_available: false
          }
        });
        
        setCurrentTab('basic');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview opportunity
  const handlePreview = () => {
    setPreviewData(formData);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Create Opportunity</h2>
          <p className="text-muted-foreground">
            Post jobs, educational programs, scholarships, and training opportunities
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          {isEducationalOpportunity() && (
            <Button variant="outline" onClick={handleAIEnhancement}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Enhance
            </Button>
          )}
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Opportunity Details</CardTitle>
          <CardDescription>
            Create comprehensive job postings and educational opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="educational" disabled={!isEducationalOpportunity()}>
                Educational
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., UAE Youth Leadership Summer Camp"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employment_type">Opportunity Type *</Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={(value) => handleInputChange('employment_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select opportunity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <div className="text-sm font-medium text-muted-foreground mb-2">Employment</div>
                        {EMPLOYMENT_TYPES.filter(type => type.category === 'employment').map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </div>
                      <Separator />
                      <div className="p-2">
                        <div className="text-sm font-medium text-muted-foreground mb-2">Educational</div>
                        {EMPLOYMENT_TYPES.filter(type => type.category === 'education').map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Organization *</Label>
                  <Input
                    id="company_name"
                    placeholder="e.g., UAE Ministry of Education"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Dubai, UAE"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the opportunity, requirements, and benefits..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                />
              </div>

              {!isEducationalOpportunity() && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="salary_min">Minimum Monthly Salary (AED)</Label>
                    <Input
                      id="salary_min"
                      type="number"
                      placeholder="e.g., 10000 (Monthly)"
                      value={formData.salary_min || ''}
                      onChange={(e) => handleInputChange('salary_min', parseInt(e.target.value) || undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary_max">Maximum Monthly Salary (AED)</Label>
                    <Input
                      id="salary_max"
                      type="number"
                      placeholder="e.g., 15000 (Monthly)"
                      value={formData.salary_max || ''}
                      onChange={(e) => handleInputChange('salary_max', parseInt(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enhance_with_ai"
                  checked={formData.enhance_with_ai}
                  onCheckedChange={(checked) => handleInputChange('enhance_with_ai', checked)}
                />
                <Label htmlFor="enhance_with_ai">
                  Enhance with AI
                </Label>
              </div>

              {isEducationalOpportunity() && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Educational Program Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Target Age Group</Label>
                      <Select
                        value={formData.educational_details?.target_age_group || ''}
                        onValueChange={(value) => handleEducationalChange('target_age_group', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                        <SelectContent>
                          {AGE_GROUPS.map((group) => (
                            <SelectItem key={group.value} value={group.value}>
                              <div>
                                <div className="font-medium">{group.label}</div>
                                <div className="text-sm text-muted-foreground">{group.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Program Duration</Label>
                      <Input
                        placeholder="e.g., 3 weeks, 6 months"
                        value={formData.educational_details?.program_duration || ''}
                        onChange={(e) => handleEducationalChange('program_duration', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Program Schedule</Label>
                      <Select
                        value={formData.educational_details?.program_schedule || ''}
                        onValueChange={(value) => handleEducationalChange('program_schedule', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select schedule" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROGRAM_SCHEDULES.map((schedule) => (
                            <SelectItem key={schedule} value={schedule}>
                              {schedule}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Program Format</Label>
                      <Select
                        value={formData.educational_details?.program_format || ''}
                        onValueChange={(value) => handleEducationalChange('program_format', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROGRAM_FORMATS.map((format) => (
                            <SelectItem key={format} value={format}>
                              {format}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Educational Tab */}
            <TabsContent value="educational" className="space-y-6">
              {isEducationalOpportunity() && (
                <>
                  {/* Financial Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Financial Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Program Cost (AED)</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 2000"
                          value={formData.educational_details?.program_cost || ''}
                          onChange={(e) => handleEducationalChange('program_cost', parseInt(e.target.value) || undefined)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Scholarship Amount (AED)</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 5000"
                          value={formData.educational_details?.scholarship_amount || ''}
                          onChange={(e) => handleEducationalChange('scholarship_amount', parseInt(e.target.value) || undefined)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Maximum Participants</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 50"
                          value={formData.educational_details?.max_participants || ''}
                          onChange={(e) => handleEducationalChange('max_participants', parseInt(e.target.value) || undefined)}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="financial_aid"
                          checked={formData.educational_details?.financial_aid_available || false}
                          onCheckedChange={(checked) => handleEducationalChange('financial_aid_available', checked)}
                        />
                        <Label htmlFor="financial_aid">
                          Financial aid available
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Learning Outcomes */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Learning Outcomes
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addArrayItem('learning_outcomes')}
                      >
                        Add Outcome
                      </Button>
                    </div>
                    
                    {formData.educational_details?.learning_outcomes?.map((outcome, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="e.g., Develop leadership skills"
                          value={outcome}
                          onChange={(e) => handleArrayFieldChange('learning_outcomes', index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('learning_outcomes', index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Skills Developed */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Skills Developed
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addArrayItem('skills_developed')}
                      >
                        Add Skill
                      </Button>
                    </div>
                    
                    {formData.educational_details?.skills_developed?.map((skill, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="e.g., Public speaking"
                          value={skill}
                          onChange={(e) => handleArrayFieldChange('skills_developed', index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('skills_developed', index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting || !formData.title || !formData.description}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSubmit('publish')}
              disabled={isSubmitting || !formData.title || !formData.description}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Opportunity Preview</DialogTitle>
            <DialogDescription>
              Preview how your opportunity will appear to candidates
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">{previewData.title}</h2>
                <div className="flex items-center gap-4 text-muted-foreground mt-2">
                  <span>{previewData.company_name}</span>
                  <span>•</span>
                  <span>{previewData.location}</span>
                  <span>•</span>
                  <Badge variant="secondary">
                    {EMPLOYMENT_TYPES.find(t => t.value === previewData.employment_type)?.label}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="whitespace-pre-wrap">{previewData.description}</p>
              </div>
              
              {isEducationalOpportunity() && previewData.educational_details && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Program Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {previewData.educational_details.target_age_group && (
                      <div>
                        <span className="font-medium">Age Group:</span>{' '}
                        {AGE_GROUPS.find(g => g.value === previewData.educational_details.target_age_group)?.label}
                      </div>
                    )}
                    {previewData.educational_details.program_duration && (
                      <div>
                        <span className="font-medium">Duration:</span>{' '}
                        {previewData.educational_details.program_duration}
                      </div>
                    )}
                    {previewData.educational_details.program_schedule && (
                      <div>
                        <span className="font-medium">Schedule:</span>{' '}
                        {previewData.educational_details.program_schedule}
                      </div>
                    )}
                    {previewData.educational_details.program_format && (
                      <div>
                        <span className="font-medium">Format:</span>{' '}
                        {previewData.educational_details.program_format}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedJobPosting;
