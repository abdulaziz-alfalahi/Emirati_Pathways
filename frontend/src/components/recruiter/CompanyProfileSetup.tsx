import React, { useState, useEffect } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Upload,
  MapPin,
  Globe,
  Users,
  Award,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Camera,
  FileText,
  Star
} from 'lucide-react';

interface CompanyProfile {
  // Basic Information
  companyName: string;
  legalName: string;
  tradeLicense: string;
  establishedYear: string;
  companySize: string;
  industry: string;
  subIndustry: string;

  // Contact & Location
  headquarters: string;
  offices: string[];
  website: string;
  email: string;
  phone: string;

  // Description & Culture
  description: string;
  mission: string;
  vision: string;
  values: string[];
  culture: string;

  // Benefits & Perks
  benefits: string[];
  perks: string[];
  workEnvironment: string[];

  // Media & Branding
  logo?: File;
  coverImage?: File;
  companyPhotos: File[];
  companyVideo?: string;

  // Certifications & Awards
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
    description: string;
  }>;
  awards: Array<{
    title: string;
    organization: string;
    year: string;
    description: string;
  }>;

  // Social Media
  socialMedia: {
    linkedin: string;
    twitter: string;
    instagram: string;
    facebook: string;
  };
}

interface CompanyProfileSetupProps {
  onComplete?: (profile: CompanyProfile) => void;
  onProfileUpdate?: () => void;
  initialData?: Partial<CompanyProfile>;
}

const CompanyProfileSetup: React.FC<CompanyProfileSetupProps> = ({
  onComplete,
  onProfileUpdate,
  initialData
}) => {
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: '',
    legalName: '',
    tradeLicense: '',
    establishedYear: '',
    companySize: '',
    industry: '',
    subIndustry: '',
    headquarters: '',
    offices: [],
    website: '',
    email: '',
    phone: '',
    description: '',
    mission: '',
    vision: '',
    values: [],
    culture: '',
    benefits: [],
    perks: [],
    workEnvironment: [],
    companyPhotos: [],
    certifications: [],
    awards: [],
    socialMedia: {
      linkedin: '',
      twitter: '',
      instagram: '',
      facebook: ''
    },
    ...initialData
  });

  useEffect(() => {
    if (initialData) {
      setProfile(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const [currentStep, setCurrentStep] = useState(1);
  const [newValue, setNewValue] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newOffice, setNewOffice] = useState('');

  const industries = [
    'Technology',
    'Finance & Banking',
    'Healthcare',
    'Education',
    'Government',
    'Oil & Gas',
    'Construction',
    'Tourism & Hospitality',
    'Retail',
    'Manufacturing',
    'Real Estate',
    'Transportation',
    'Telecommunications',
    'Media & Entertainment',
    'Consulting',
    'Other'
  ];

  const companySizes = [
    'Startup (1-10 employees)',
    'Small (11-50 employees)',
    'Medium (51-200 employees)',
    'Large (201-1000 employees)',
    'Enterprise (1000+ employees)'
  ];

  const commonBenefits = [
    'Health Insurance',
    'Dental Insurance',
    'Vision Insurance',
    'Life Insurance',
    'Retirement Plan',
    'Paid Time Off',
    'Sick Leave',
    'Maternity/Paternity Leave',
    'Professional Development',
    'Training Budget',
    'Conference Attendance',
    'Flexible Working Hours',
    'Remote Work Options',
    'Transportation Allowance',
    'Housing Allowance',
    'Education Allowance',
    'Annual Bonus',
    'Performance Bonus',
    'Stock Options',
    'Profit Sharing'
  ];

  const commonPerks = [
    'Free Meals',
    'Gym Membership',
    'Wellness Programs',
    'Team Building Events',
    'Company Car',
    'Parking',
    'Childcare Support',
    'Pet-Friendly Office',
    'Game Room',
    'Coffee & Snacks',
    'Flexible Dress Code',
    'Birthday Leave',
    'Sabbatical Leave',
    'Employee Discounts',
    'Travel Opportunities',
    'Language Classes',
    'Mental Health Support'
  ];

  const workEnvironmentOptions = [
    'Collaborative',
    'Innovative',
    'Fast-paced',
    'Supportive',
    'Diverse',
    'Inclusive',
    'Results-oriented',
    'Learning-focused',
    'Entrepreneurial',
    'Traditional',
    'Casual',
    'Professional',
    'International',
    'Multicultural',
    'Tech-savvy',
    'Customer-focused'
  ];

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof CompanyProfile] as any),
        [field]: value
      }
    }));
  };

  const addToArray = (field: string, value: string) => {
    const list = profile[field as keyof CompanyProfile];
    if (value.trim() && Array.isArray(list) && !list.includes(value.trim())) {
      setProfile(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof CompanyProfile] as any[]), value.trim()]
      }));
    }
  };

  const removeFromArray = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field as keyof CompanyProfile] as string[]).filter(item => item !== value)
    }));
  };

  const addCertification = () => {
    setProfile(prev => ({
      ...prev,
      certifications: [...prev.certifications, {
        name: '',
        issuer: '',
        year: '',
        description: ''
      }]
    }));
  };

  const updateCertification = (index: number, field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const removeCertification = (index: number) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const addAward = () => {
    setProfile(prev => ({
      ...prev,
      awards: [...prev.awards, {
        title: '',
        organization: '',
        year: '',
        description: ''
      }]
    }));
  };

  const updateAward = (index: number, field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      awards: prev.awards.map((award, i) =>
        i === index ? { ...award, [field]: value } : award
      )
    }));
  };

  const removeAward = (index: number) => {
    setProfile(prev => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== index)
    }));
  };

  const calculateCompletion = () => {
    const requiredFields = [
      'companyName', 'industry', 'companySize', 'headquarters',
      'description', 'website', 'email'
    ];
    const completed = requiredFields.filter(field =>
      profile[field as keyof CompanyProfile]
    ).length;
    return Math.round((completed / requiredFields.length) * 100);
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    try {
      // Persist Company Data
      const response = await restClient.put('/api/auth/profile', {
        ...profile,
        role: 'recruiter',
        update_type: 'company'
      });

      if (response.data.success) {
        if (onComplete) {
          onComplete(profile);
        } else if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        console.error('Save failed:', response.data.message);
        alert('Failed to save company profile. Please try again.');
      }
    } catch (e) {
      console.error("Failed to save company profile", e);
      alert('An error occurred while saving.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Company Profile Setup
          </CardTitle>
          <CardDescription>
            Create a comprehensive company profile to attract top talent
          </CardDescription>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span>Step {currentStep} of 4</span>
                <span>{calculateCompletion()}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Company Information</CardTitle>
            <CardDescription>
              Essential details about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={profile.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Emirates Technology Solutions"
                />
              </div>
              <div>
                <Label htmlFor="legalName">Legal Name</Label>
                <Input
                  id="legalName"
                  value={profile.legalName}
                  onChange={(e) => handleInputChange('legalName', e.target.value)}
                  placeholder="Emirates Technology Solutions LLC"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tradeLicense">Trade License Number</Label>
                <Input
                  id="tradeLicense"
                  value={profile.tradeLicense}
                  onChange={(e) => handleInputChange('tradeLicense', e.target.value)}
                  placeholder="123456"
                />
              </div>
              <div>
                <Label htmlFor="establishedYear">Established Year</Label>
                <Input
                  id="establishedYear"
                  type="number"
                  value={profile.establishedYear}
                  onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                  placeholder="2010"
                />
              </div>
              <div>
                <Label htmlFor="companySize">Company Size *</Label>
                <Select
                  value={profile.companySize}
                  onValueChange={(value) => handleInputChange('companySize', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={profile.industry}
                  onValueChange={(value) => handleInputChange('industry', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subIndustry">Sub-Industry</Label>
                <Input
                  id="subIndustry"
                  value={profile.subIndustry}
                  onChange={(e) => handleInputChange('subIndustry', e.target.value)}
                  placeholder="Software Development, Fintech, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="website">Website *</Label>
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://company.ae"
                />
              </div>
              <div>
                <Label htmlFor="email">Company Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="info@company.ae"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+971 4 123 4567"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Location & Description */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Locations
              </CardTitle>
              <CardDescription>
                Where is your company located?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="headquarters">Headquarters *</Label>
                <Input
                  id="headquarters"
                  value={profile.headquarters}
                  onChange={(e) => handleInputChange('headquarters', e.target.value)}
                  placeholder="Dubai, UAE"
                />
              </div>

              <div>
                <Label>Additional Offices</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newOffice}
                    onChange={(e) => setNewOffice(e.target.value)}
                    placeholder="Add office location..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('offices', newOffice);
                        setNewOffice('');
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      addToArray('offices', newOffice);
                      setNewOffice('');
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.offices.map(office => (
                    <Badge key={office} variant="secondary" className="flex items-center gap-1">
                      {office}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromArray('offices', office)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Description & Culture</CardTitle>
              <CardDescription>
                Tell candidates about your company and what makes it special
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Company Description *</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your company, what you do, and what makes you unique..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mission">Mission Statement</Label>
                  <Textarea
                    id="mission"
                    value={profile.mission}
                    onChange={(e) => handleInputChange('mission', e.target.value)}
                    placeholder="Our mission is to..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="vision">Vision Statement</Label>
                  <Textarea
                    id="vision"
                    value={profile.vision}
                    onChange={(e) => handleInputChange('vision', e.target.value)}
                    placeholder="Our vision is to..."
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label>Company Values</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Add a company value..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('values', newValue);
                        setNewValue('');
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      addToArray('values', newValue);
                      setNewValue('');
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.values.map(value => (
                    <Badge key={value} variant="secondary" className="flex items-center gap-1">
                      {value}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromArray('values', value)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="culture">Company Culture</Label>
                <Textarea
                  id="culture"
                  value={profile.culture}
                  onChange={(e) => handleInputChange('culture', e.target.value)}
                  placeholder="Describe your company culture, work environment, and team dynamics..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Work Environment</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {workEnvironmentOptions.map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={option}
                        checked={profile.workEnvironment.includes(option)}
                        onChange={() => {
                          if (profile.workEnvironment.includes(option)) {
                            removeFromArray('workEnvironment', option);
                          } else {
                            addToArray('workEnvironment', option);
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={option} className="text-sm">{option}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Benefits & Perks */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Benefits & Perks</CardTitle>
            <CardDescription>
              Showcase what you offer to attract top talent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Employee Benefits</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {commonBenefits.map(benefit => (
                  <div key={benefit} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={benefit}
                      checked={profile.benefits.includes(benefit)}
                      onChange={() => {
                        if (profile.benefits.includes(benefit)) {
                          removeFromArray('benefits', benefit);
                        } else {
                          addToArray('benefits', benefit);
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={benefit} className="text-sm">{benefit}</Label>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add custom benefit..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('benefits', newBenefit);
                      setNewBenefit('');
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    addToArray('benefits', newBenefit);
                    setNewBenefit('');
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Company Perks</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {commonPerks.map(perk => (
                  <div key={perk} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={perk}
                      checked={profile.perks.includes(perk)}
                      onChange={() => {
                        if (profile.perks.includes(perk)) {
                          removeFromArray('perks', perk);
                        } else {
                          addToArray('perks', perk);
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={perk} className="text-sm">{perk}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Certifications & Social Media */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications & Awards
              </CardTitle>
              <CardDescription>
                Showcase your company's achievements and certifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Company Certifications</Label>
                  <Button onClick={addCertification} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Certification
                  </Button>
                </div>

                {profile.certifications.map((cert, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Certification Name</Label>
                        <Input
                          value={cert.name}
                          onChange={(e) => updateCertification(index, 'name', e.target.value)}
                          placeholder="ISO 9001:2015"
                        />
                      </div>
                      <div>
                        <Label>Issuing Organization</Label>
                        <Input
                          value={cert.issuer}
                          onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                          placeholder="International Organization for Standardization"
                        />
                      </div>
                      <div>
                        <Label>Year Obtained</Label>
                        <Input
                          value={cert.year}
                          onChange={(e) => updateCertification(index, 'year', e.target.value)}
                          placeholder="2023"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={() => removeCertification(index)}
                          variant="destructive"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Description</Label>
                      <Textarea
                        value={cert.description}
                        onChange={(e) => updateCertification(index, 'description', e.target.value)}
                        placeholder="Brief description of the certification..."
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Company Awards</Label>
                  <Button onClick={addAward} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Award
                  </Button>
                </div>

                {profile.awards.map((award, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Award Title</Label>
                        <Input
                          value={award.title}
                          onChange={(e) => updateAward(index, 'title', e.target.value)}
                          placeholder="Best Employer Award"
                        />
                      </div>
                      <div>
                        <Label>Awarding Organization</Label>
                        <Input
                          value={award.organization}
                          onChange={(e) => updateAward(index, 'organization', e.target.value)}
                          placeholder="UAE Ministry of Human Resources"
                        />
                      </div>
                      <div>
                        <Label>Year Received</Label>
                        <Input
                          value={award.year}
                          onChange={(e) => updateAward(index, 'year', e.target.value)}
                          placeholder="2023"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={() => removeAward(index)}
                          variant="destructive"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Description</Label>
                      <Textarea
                        value={award.description}
                        onChange={(e) => updateAward(index, 'description', e.target.value)}
                        placeholder="Brief description of the award..."
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Media & Online Presence
              </CardTitle>
              <CardDescription>
                Connect your social media profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedin">LinkedIn Company Page</Label>
                  <Input
                    id="linkedin"
                    value={profile.socialMedia.linkedin}
                    onChange={(e) => handleNestedChange('socialMedia', 'linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/your-company"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter">Twitter/X</Label>
                  <Input
                    id="twitter"
                    value={profile.socialMedia.twitter}
                    onChange={(e) => handleNestedChange('socialMedia', 'twitter', e.target.value)}
                    placeholder="https://twitter.com/yourcompany"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={profile.socialMedia.instagram}
                    onChange={(e) => handleNestedChange('socialMedia', 'instagram', e.target.value)}
                    placeholder="https://instagram.com/yourcompany"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={profile.socialMedia.facebook}
                    onChange={(e) => handleNestedChange('socialMedia', 'facebook', e.target.value)}
                    placeholder="https://facebook.com/yourcompany"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={prevStep}
          disabled={currentStep === 1}
          variant="outline"
        >
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button onClick={nextStep}>
            Next
          </Button>
        ) : (
          <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Setup
          </Button>
        )}
      </div>
    </div>
  );
};

export default CompanyProfileSetup;
