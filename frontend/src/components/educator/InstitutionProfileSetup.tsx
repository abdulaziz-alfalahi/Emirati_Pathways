import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  School, 
  MapPin, 
  Globe, 
  Users, 
  Award,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Building,
  Calendar,
  Star
} from 'lucide-react';

interface InstitutionProfile {
  // Basic Information
  institutionName: string;
  legalName: string;
  institutionType: string;
  establishedYear: string;
  accreditation: string[];
  licenseNumber: string;
  
  // Contact & Location
  address: string;
  city: string;
  emirate: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  
  // Academic Information
  studentCapacity: string;
  currentEnrollment: string;
  facultyCount: string;
  staffCount: string;
  campusSize: string;
  
  // Programs & Departments
  departments: string[];
  programs: Array<{
    name: string;
    level: string;
    duration: string;
    accreditation?: string;
  }>;
  
  // Academic Calendar
  academicYear: {
    start: string;
    end: string;
  };
  semesters: Array<{
    name: string;
    start: string;
    end: string;
  }>;
  
  // Facilities & Resources
  facilities: string[];
  laboratories: string[];
  libraries: string[];
  sportsActivities: string[];
  
  // Partnerships & Affiliations
  partnerships: Array<{
    organization: string;
    type: string;
    description: string;
    year: string;
  }>;
  
  // Certifications & Rankings
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
    validUntil?: string;
  }>;
  rankings: Array<{
    organization: string;
    rank: string;
    category: string;
    year: string;
  }>;
  
  // Mission & Vision
  mission: string;
  vision: string;
  values: string[];
  
  // Social Media & Online Presence
  socialMedia: {
    linkedin: string;
    twitter: string;
    instagram: string;
    facebook: string;
    youtube: string;
  };
}

interface InstitutionProfileSetupProps {
  onComplete?: (profile: InstitutionProfile) => void;
  initialData?: Partial<InstitutionProfile>;
}

const InstitutionProfileSetup: React.FC<InstitutionProfileSetupProps> = ({
  onComplete,
  initialData
}) => {
  const [profile, setProfile] = useState<InstitutionProfile>({
    institutionName: '',
    legalName: '',
    institutionType: '',
    establishedYear: '',
    accreditation: [],
    licenseNumber: '',
    address: '',
    city: '',
    emirate: '',
    country: 'United Arab Emirates',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    studentCapacity: '',
    currentEnrollment: '',
    facultyCount: '',
    staffCount: '',
    campusSize: '',
    departments: [],
    programs: [],
    academicYear: {
      start: '',
      end: ''
    },
    semesters: [],
    facilities: [],
    laboratories: [],
    libraries: [],
    sportsActivities: [],
    partnerships: [],
    certifications: [],
    rankings: [],
    mission: '',
    vision: '',
    values: [],
    socialMedia: {
      linkedin: '',
      twitter: '',
      instagram: '',
      facebook: '',
      youtube: ''
    },
    ...initialData
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [newItem, setNewItem] = useState('');

  const institutionTypes = [
    'University',
    'College',
    'Technical Institute',
    'Vocational School',
    'Training Center',
    'Research Institute',
    'Community College',
    'Private School',
    'International School',
    'Language Institute',
    'Professional Institute',
    'Online Institution'
  ];

  const emirates = [
    'Abu Dhabi',
    'Dubai',
    'Sharjah',
    'Ajman',
    'Umm Al Quwain',
    'Ras Al Khaimah',
    'Fujairah'
  ];

  const accreditationBodies = [
    'Ministry of Education - UAE',
    'Commission for Academic Accreditation (CAA)',
    'Knowledge and Human Development Authority (KHDA)',
    'Abu Dhabi Department of Education',
    'ABET (Engineering)',
    'AACSB (Business)',
    'NCAAA (Saudi Arabia)',
    'QAA (UK)',
    'NEASC (USA)',
    'ISO 21001',
    'Other International'
  ];

  const commonFacilities = [
    'Library',
    'Computer Labs',
    'Science Laboratories',
    'Engineering Labs',
    'Medical Labs',
    'Auditorium',
    'Conference Rooms',
    'Cafeteria',
    'Student Housing',
    'Parking',
    'Sports Complex',
    'Gymnasium',
    'Swimming Pool',
    'Prayer Room',
    'Medical Center',
    'Bookstore',
    'ATM',
    'WiFi Campus',
    'Security Services',
    'Transportation'
  ];

  const programLevels = [
    'Certificate',
    'Diploma',
    'Associate Degree',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'Doctoral Degree',
    'Professional Degree',
    'Continuing Education',
    'Executive Education'
  ];

  const partnershipTypes = [
    'Academic Partnership',
    'Research Collaboration',
    'Industry Partnership',
    'Exchange Program',
    'Dual Degree',
    'Internship Program',
    'Training Partnership',
    'Technology Transfer',
    'Consulting Services',
    'Joint Venture'
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
        ...prev[parent as keyof InstitutionProfile],
        [field]: value
      }
    }));
  };

  const addToArray = (field: string, value: string) => {
    if (value.trim() && !profile[field as keyof InstitutionProfile]?.includes(value.trim())) {
      setProfile(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof InstitutionProfile] as string[]), value.trim()]
      }));
    }
  };

  const removeFromArray = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field as keyof InstitutionProfile] as string[]).filter(item => item !== value)
    }));
  };

  const addProgram = () => {
    setProfile(prev => ({
      ...prev,
      programs: [...prev.programs, {
        name: '',
        level: '',
        duration: '',
        accreditation: ''
      }]
    }));
  };

  const updateProgram = (index: number, field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      programs: prev.programs.map((prog, i) => 
        i === index ? { ...prog, [field]: value } : prog
      )
    }));
  };

  const removeProgram = (index: number) => {
    setProfile(prev => ({
      ...prev,
      programs: prev.programs.filter((_, i) => i !== index)
    }));
  };

  const addSemester = () => {
    setProfile(prev => ({
      ...prev,
      semesters: [...prev.semesters, {
        name: '',
        start: '',
        end: ''
      }]
    }));
  };

  const updateSemester = (index: number, field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      semesters: prev.semesters.map((sem, i) => 
        i === index ? { ...sem, [field]: value } : sem
      )
    }));
  };

  const removeSemester = (index: number) => {
    setProfile(prev => ({
      ...prev,
      semesters: prev.semesters.filter((_, i) => i !== index)
    }));
  };

  const addPartnership = () => {
    setProfile(prev => ({
      ...prev,
      partnerships: [...prev.partnerships, {
        organization: '',
        type: '',
        description: '',
        year: ''
      }]
    }));
  };

  const updatePartnership = (index: number, field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      partnerships: prev.partnerships.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const removePartnership = (index: number) => {
    setProfile(prev => ({
      ...prev,
      partnerships: prev.partnerships.filter((_, i) => i !== index)
    }));
  };

  const calculateCompletion = () => {
    const requiredFields = [
      'institutionName', 'institutionType', 'address', 'city', 'emirate',
      'phone', 'email', 'website'
    ];
    const completed = requiredFields.filter(field => 
      profile[field as keyof InstitutionProfile]
    ).length;
    return Math.round((completed / requiredFields.length) * 100);
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleComplete = () => {
    onComplete?.(profile);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-6 w-6" />
            Institution Profile Setup
          </CardTitle>
          <CardDescription>
            Create a comprehensive profile for your educational institution
          </CardDescription>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span>Step {currentStep} of 5</span>
                <span>{calculateCompletion()}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
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
            <CardTitle>Basic Institution Information</CardTitle>
            <CardDescription>
              Essential details about your educational institution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="institutionName">Institution Name *</Label>
                <Input
                  id="institutionName"
                  value={profile.institutionName}
                  onChange={(e) => handleInputChange('institutionName', e.target.value)}
                  placeholder="American University of Sharjah"
                />
              </div>
              <div>
                <Label htmlFor="legalName">Legal Name</Label>
                <Input
                  id="legalName"
                  value={profile.legalName}
                  onChange={(e) => handleInputChange('legalName', e.target.value)}
                  placeholder="American University of Sharjah LLC"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="institutionType">Institution Type *</Label>
                <Select 
                  value={profile.institutionType} 
                  onValueChange={(value) => handleInputChange('institutionType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutionTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="establishedYear">Established Year</Label>
                <Input
                  id="establishedYear"
                  type="number"
                  value={profile.establishedYear}
                  onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                  placeholder="1997"
                />
              </div>
              <div>
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={profile.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  placeholder="EDU-123456"
                />
              </div>
            </div>

            <div>
              <Label>Accreditation Bodies</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {accreditationBodies.map(body => (
                  <div key={body} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={body}
                      checked={profile.accreditation.includes(body)}
                      onChange={() => {
                        if (profile.accreditation.includes(body)) {
                          removeFromArray('accreditation', body);
                        } else {
                          addToArray('accreditation', body);
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={body} className="text-sm">{body}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Contact & Location */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Contact & Location Information
            </CardTitle>
            <CardDescription>
              Where is your institution located and how can people contact you?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="University City, Sharjah"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Sharjah"
                />
              </div>
              <div>
                <Label htmlFor="emirate">Emirate *</Label>
                <Select 
                  value={profile.emirate} 
                  onValueChange={(value) => handleInputChange('emirate', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select emirate" />
                  </SelectTrigger>
                  <SelectContent>
                    {emirates.map(emirate => (
                      <SelectItem key={emirate} value={emirate}>{emirate}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={profile.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="26666"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+971 6 515 0000"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="info@aus.edu"
                />
              </div>
              <div>
                <Label htmlFor="website">Website *</Label>
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.aus.edu"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Academic Information */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Academic Information
              </CardTitle>
              <CardDescription>
                Details about your institution's capacity and academic structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="studentCapacity">Student Capacity</Label>
                  <Input
                    id="studentCapacity"
                    type="number"
                    value={profile.studentCapacity}
                    onChange={(e) => handleInputChange('studentCapacity', e.target.value)}
                    placeholder="6000"
                  />
                </div>
                <div>
                  <Label htmlFor="currentEnrollment">Current Enrollment</Label>
                  <Input
                    id="currentEnrollment"
                    type="number"
                    value={profile.currentEnrollment}
                    onChange={(e) => handleInputChange('currentEnrollment', e.target.value)}
                    placeholder="5500"
                  />
                </div>
                <div>
                  <Label htmlFor="campusSize">Campus Size (sq ft)</Label>
                  <Input
                    id="campusSize"
                    value={profile.campusSize}
                    onChange={(e) => handleInputChange('campusSize', e.target.value)}
                    placeholder="1,000,000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facultyCount">Faculty Count</Label>
                  <Input
                    id="facultyCount"
                    type="number"
                    value={profile.facultyCount}
                    onChange={(e) => handleInputChange('facultyCount', e.target.value)}
                    placeholder="350"
                  />
                </div>
                <div>
                  <Label htmlFor="staffCount">Staff Count</Label>
                  <Input
                    id="staffCount"
                    type="number"
                    value={profile.staffCount}
                    onChange={(e) => handleInputChange('staffCount', e.target.value)}
                    placeholder="500"
                  />
                </div>
              </div>

              <div>
                <Label>Departments/Faculties</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add department..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('departments', newItem);
                        setNewItem('');
                      }
                    }}
                  />
                  <Button 
                    onClick={() => {
                      addToArray('departments', newItem);
                      setNewItem('');
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.departments.map(dept => (
                    <Badge key={dept} variant="secondary" className="flex items-center gap-1">
                      {dept}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeFromArray('departments', dept)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Programs
              </CardTitle>
              <CardDescription>
                List the academic programs offered by your institution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Programs Offered</Label>
                <Button onClick={addProgram} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Program
                </Button>
              </div>
              
              {profile.programs.map((program, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Program Name</Label>
                      <Input
                        value={program.name}
                        onChange={(e) => updateProgram(index, 'name', e.target.value)}
                        placeholder="Computer Science"
                      />
                    </div>
                    <div>
                      <Label>Level</Label>
                      <Select 
                        value={program.level} 
                        onValueChange={(value) => updateProgram(index, 'level', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {programLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <Input
                        value={program.duration}
                        onChange={(e) => updateProgram(index, 'duration', e.target.value)}
                        placeholder="4 years"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={() => removeProgram(index)}
                        variant="destructive"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Academic Calendar
              </CardTitle>
              <CardDescription>
                Set up your academic year and semester schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Academic Year</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="yearStart">Start Date</Label>
                    <Input
                      id="yearStart"
                      type="date"
                      value={profile.academicYear.start}
                      onChange={(e) => handleNestedChange('academicYear', 'start', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearEnd">End Date</Label>
                    <Input
                      id="yearEnd"
                      type="date"
                      value={profile.academicYear.end}
                      onChange={(e) => handleNestedChange('academicYear', 'end', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Semesters/Terms</Label>
                  <Button onClick={addSemester} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Semester
                  </Button>
                </div>
                
                {profile.semesters.map((semester, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Semester Name</Label>
                        <Input
                          value={semester.name}
                          onChange={(e) => updateSemester(index, 'name', e.target.value)}
                          placeholder="Fall 2024"
                        />
                      </div>
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={semester.start}
                          onChange={(e) => updateSemester(index, 'start', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={semester.end}
                          onChange={(e) => updateSemester(index, 'end', e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={() => removeSemester(index)}
                          variant="destructive"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Facilities & Partnerships */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Facilities & Resources
              </CardTitle>
              <CardDescription>
                What facilities and resources does your institution offer?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Campus Facilities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {commonFacilities.map(facility => (
                    <div key={facility} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={facility}
                        checked={profile.facilities.includes(facility)}
                        onChange={() => {
                          if (profile.facilities.includes(facility)) {
                            removeFromArray('facilities', facility);
                          } else {
                            addToArray('facilities', facility);
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={facility} className="text-sm">{facility}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Specialized Laboratories</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add laboratory..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('laboratories', newItem);
                        setNewItem('');
                      }
                    }}
                  />
                  <Button 
                    onClick={() => {
                      addToArray('laboratories', newItem);
                      setNewItem('');
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.laboratories.map(lab => (
                    <Badge key={lab} variant="secondary" className="flex items-center gap-1">
                      {lab}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeFromArray('laboratories', lab)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Partnerships & Collaborations</CardTitle>
              <CardDescription>
                Industry partnerships and academic collaborations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Partnerships</Label>
                <Button onClick={addPartnership} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Partnership
                </Button>
              </div>
              
              {profile.partnerships.map((partnership, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Organization</Label>
                      <Input
                        value={partnership.organization}
                        onChange={(e) => updatePartnership(index, 'organization', e.target.value)}
                        placeholder="Microsoft, IBM, etc."
                      />
                    </div>
                    <div>
                      <Label>Partnership Type</Label>
                      <Select 
                        value={partnership.type} 
                        onValueChange={(value) => updatePartnership(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {partnershipTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Year Established</Label>
                      <Input
                        value={partnership.year}
                        onChange={(e) => updatePartnership(index, 'year', e.target.value)}
                        placeholder="2023"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={() => removePartnership(index)}
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
                      value={partnership.description}
                      onChange={(e) => updatePartnership(index, 'description', e.target.value)}
                      placeholder="Brief description of the partnership..."
                      rows={2}
                    />
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 5: Mission & Social Media */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mission, Vision & Values</CardTitle>
              <CardDescription>
                Define your institution's purpose and core values
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mission">Mission Statement</Label>
                <Textarea
                  id="mission"
                  value={profile.mission}
                  onChange={(e) => handleInputChange('mission', e.target.value)}
                  placeholder="Our mission is to provide world-class education..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="vision">Vision Statement</Label>
                <Textarea
                  id="vision"
                  value={profile.vision}
                  onChange={(e) => handleInputChange('vision', e.target.value)}
                  placeholder="Our vision is to be a leading institution..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Core Values</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add a core value..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('values', newItem);
                        setNewItem('');
                      }
                    }}
                  />
                  <Button 
                    onClick={() => {
                      addToArray('values', newItem);
                      setNewItem('');
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Media & Online Presence
              </CardTitle>
              <CardDescription>
                Connect your social media profiles and online presence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedin">LinkedIn Page</Label>
                  <Input
                    id="linkedin"
                    value={profile.socialMedia.linkedin}
                    onChange={(e) => handleNestedChange('socialMedia', 'linkedin', e.target.value)}
                    placeholder="https://linkedin.com/school/your-institution"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter">Twitter/X</Label>
                  <Input
                    id="twitter"
                    value={profile.socialMedia.twitter}
                    onChange={(e) => handleNestedChange('socialMedia', 'twitter', e.target.value)}
                    placeholder="https://twitter.com/yourinstitution"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={profile.socialMedia.instagram}
                    onChange={(e) => handleNestedChange('socialMedia', 'instagram', e.target.value)}
                    placeholder="https://instagram.com/yourinstitution"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={profile.socialMedia.facebook}
                    onChange={(e) => handleNestedChange('socialMedia', 'facebook', e.target.value)}
                    placeholder="https://facebook.com/yourinstitution"
                  />
                </div>
                <div>
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    value={profile.socialMedia.youtube}
                    onChange={(e) => handleNestedChange('socialMedia', 'youtube', e.target.value)}
                    placeholder="https://youtube.com/c/yourinstitution"
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
        
        {currentStep < 5 ? (
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

export default InstitutionProfileSetup;
