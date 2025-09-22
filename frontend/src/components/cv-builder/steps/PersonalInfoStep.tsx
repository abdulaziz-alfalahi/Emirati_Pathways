import React, { useEffect, useMemo, useState } from 'react';
import { useCV } from '@/context/CVContext';

// UAE data utilities
import {
  getCitiesByEmirate,
  UAE_EMIRATES,
  validateUAELocation,
} from '@/utils/uae-data';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Icons
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Info,
  BadgeCheck,
} from 'lucide-react';

interface PersonalInfoStepProps {
  onNext: () => void;
  onBack: () => void;
}

type FormState = {
  firstName: string;
  lastName: string;
  arabicFirstName: string;
  arabicLastName: string;
  email: string;
  phone: string;
  emiratesId: string;
  nationality: string;
  emirate: string;
  city: string;
  linkedinUrl: string;
  portfolioUrl: string;
};

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ onNext, onBack }) => {
  const {
    currentCV,
    updatePersonalInfo,
    // validation/formatting helpers from context
    validateUAEPhone,
    formatUAEPhone,
    validateEmiratesId,
    formatEmiratesId,
    loading,
  } = useCV();

  // ---- initial form state from current CV (camelCase) ----
  const initial: FormState = useMemo(
    () => ({
      firstName: currentCV?.personalInfo?.firstName || '',
      lastName: currentCV?.personalInfo?.lastName || '',
      arabicFirstName: currentCV?.personalInfo?.arabicFirstName || '',
      arabicLastName: currentCV?.personalInfo?.arabicLastName || '',
      email: currentCV?.personalInfo?.email || '',
      phone: currentCV?.personalInfo?.phone || '',
      emiratesId: currentCV?.personalInfo?.emiratesId || '',
      nationality: currentCV?.personalInfo?.nationality || 'UAE',
      emirate: currentCV?.personalInfo?.emirate || '',
      city: currentCV?.personalInfo?.city || '',
      linkedinUrl: currentCV?.personalInfo?.linkedinUrl || '',
      portfolioUrl: currentCV?.personalInfo?.portfolioUrl || '',
    }),
    [currentCV]
  );

  const [formData, setFormData] = useState<FormState>(initial);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  // Update available cities when emirate changes
  useEffect(() => {
    if (formData.emirate) {
      const cities = getCitiesByEmirate(formData.emirate);
      setAvailableCities(cities);
      if (formData.city && !cities.includes(formData.city)) {
        setFormData((prev) => ({ ...prev, city: '' }));
      }
    } else {
      setAvailableCities([]);
    }
  }, [formData.emirate]);

  // Real-time validation
  useEffect(() => {
    validateForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validateUAEPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid UAE phone number (e.g., +971 50 123 4567)';
    }

    if (!formData.emirate) newErrors.emirate = 'Please select your emirate';

    if (!formData.city) {
      newErrors.city = 'Please select your city';
    } else if (formData.emirate && !validateUAELocation(formData.emirate, formData.city)) {
      newErrors.city = 'Please select a valid city for the selected emirate';
    }

    // Optional fields
    if (formData.emiratesId && !validateEmiratesId(formData.emiratesId)) {
      newErrors.emiratesId = 'Please enter a valid Emirates ID (784-YYYY-XXXXXXX-X)';
    }

    if (formData.linkedinUrl) {
      try {
        const u = new URL(formData.linkedinUrl);
        if (!u.hostname.includes('linkedin.com')) {
          newErrors.linkedinUrl = 'Please enter a valid LinkedIn URL';
        }
      } catch {
        newErrors.linkedinUrl = 'Please enter a valid LinkedIn URL';
      }
    }

    if (formData.portfolioUrl) {
      try {
        // Accept any valid URL scheme (http/https primarily)
        // If you want only http/https, also check u.protocol
        // e.g., if (!(u.protocol === 'http:' || u.protocol === 'https:')) ...
        // eslint-disable-next-line no-new
        new URL(formData.portfolioUrl);
      } catch {
        newErrors.portfolioUrl = 'Please enter a valid portfolio URL';
      }
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    let processed = value;

    if (field === 'phone') {
      processed = formatUAEPhone(value);
    } else if (field === 'emiratesId') {
      processed = formatEmiratesId(value);
    }

    setFormData((prev) => ({ ...prev, [field]: processed }));
  };

  const getFieldStatus = (field: keyof FormState) => {
    if (errors[field]) return 'error';
    if (formData[field]) return 'success';
    return 'default';
  };

  const getCompletionPercentage = () => {
    const required: (keyof FormState)[] = ['firstName', 'lastName', 'email', 'phone', 'emirate', 'city'];
    const optional: (keyof FormState)[] = ['arabicFirstName', 'arabicLastName', 'emiratesId', 'linkedinUrl', 'portfolioUrl'];

    const requiredCompleted = required.filter((f) => Boolean(formData[f])).length;
    const optionalCompleted = optional.filter((f) => Boolean(formData[f])).length;

    const totalScore = (requiredCompleted / required.length) * 70 + (optionalCompleted / optional.length) * 30;
    return Math.round(totalScore);
  };

  const handleNext = async () => {
    if (!isValid) return;

    try {
      await updatePersonalInfo({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        arabicFirstName: formData.arabicFirstName.trim(),
        arabicLastName: formData.arabicLastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        emiratesId: formData.emiratesId.trim(),
        nationality: formData.nationality.trim(),
        emirate: formData.emirate,
        city: formData.city,
        linkedinUrl: formData.linkedinUrl.trim(),
        portfolioUrl: formData.portfolioUrl.trim(),
      });
      onNext();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error updating personal info:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Let's start with your basic information. This will be the foundation of your professional CV
          optimized for the UAE job market.
        </p>
      </div>

      {/* Progress Indicator */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Profile Completion</span>
            <span className="text-sm font-bold text-blue-900">{getCompletionPercentage()}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                First Name *
              </Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter your first name"
                className={`w-full ${
                  getFieldStatus('firstName') === 'error'
                    ? 'border-red-500'
                    : getFieldStatus('firstName') === 'success'
                    ? 'border-green-500'
                    : ''
                }`}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Last Name *
              </Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter your last name"
                className={`w-full ${
                  getFieldStatus('lastName') === 'error'
                    ? 'border-red-500'
                    : getFieldStatus('lastName') === 'success'
                    ? 'border-green-500'
                    : ''
                }`}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.lastName}
                </p>
              )}
            </div>

            {/* Arabic First Name */}
            <div className="space-y-2">
              <Label htmlFor="arabicFirstName" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Arabic First Name (Optional)
              </Label>
              <Input
                id="arabicFirstName"
                type="text"
                value={formData.arabicFirstName}
                onChange={(e) => handleInputChange('arabicFirstName', e.target.value)}
                placeholder="الاسم الأول"
                className="w-full"
                dir="rtl"
              />
            </div>

            {/* Arabic Last Name */}
            <div className="space-y-2">
              <Label htmlFor="arabicLastName" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Arabic Last Name (Optional)
              </Label>
              <Input
                id="arabicLastName"
                type="text"
                value={formData.arabicLastName}
                onChange={(e) => handleInputChange('arabicLastName', e.target.value)}
                placeholder="اسم العائلة"
                className="w-full"
                dir="rtl"
              />
              <p className="text-xs text-gray-500">Adding your Arabic name helps with local employers</p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@example.com"
                className={`w-full ${
                  getFieldStatus('email') === 'error'
                    ? 'border-red-500'
                    : getFieldStatus('email') === 'success'
                    ? 'border-green-500'
                    : ''
                }`}
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                UAE Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+971 50 123 4567"
                className={`w-full ${
                  getFieldStatus('phone') === 'error'
                    ? 'border-red-500'
                    : getFieldStatus('phone') === 'success'
                    ? 'border-green-500'
                    : ''
                }`}
              />
              {errors.phone && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
              {formData.phone && !errors.phone && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Valid UAE phone number
                </p>
              )}
            </div>

            {/* Emirates ID */}
            <div className="space-y-2">
              <Label htmlFor="emiratesId" className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4" />
                Emirates ID (Optional)
              </Label>
              <Input
                id="emiratesId"
                type="text"
                value={formData.emiratesId}
                onChange={(e) => handleInputChange('emiratesId', e.target.value)}
                placeholder="784-YYYY-XXXXXXX-X"
                className={`w-full ${
                  getFieldStatus('emiratesId') === 'error'
                    ? 'border-red-500'
                    : getFieldStatus('emiratesId') === 'success'
                    ? 'border-green-500'
                    : ''
                }`}
              />
              {errors.emiratesId && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.emiratesId}
                </p>
              )}
              <p className="text-xs text-gray-500">For UAE nationals - helps verify citizenship</p>
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                type="text"
                value={formData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                placeholder="UAE"
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location in UAE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emirate */}
            <div className="space-y-2">
              <Label htmlFor="emirate">Emirate *</Label>
              <Select value={formData.emirate} onValueChange={(value) => handleInputChange('emirate', value)}>
                <SelectTrigger
                  className={`w-full ${
                    getFieldStatus('emirate') === 'error'
                      ? 'border-red-500'
                      : getFieldStatus('emirate') === 'success'
                      ? 'border-green-500'
                      : ''
                  }`}
                >
                  <SelectValue placeholder="Select your emirate" />
                </SelectTrigger>
                <SelectContent>
                  {UAE_EMIRATES.map((emirate) => (
                    <SelectItem key={emirate} value={emirate}>
                      {emirate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.emirate && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.emirate}
                </p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Select
                value={formData.city}
                onValueChange={(value) => handleInputChange('city', value)}
                disabled={!formData.emirate}
              >
                <SelectTrigger
                  className={`w-full ${
                    getFieldStatus('city') === 'error'
                      ? 'border-red-500'
                      : getFieldStatus('city') === 'success'
                      ? 'border-green-500'
                      : ''
                  }`}
                >
                  <SelectValue placeholder={formData.emirate ? 'Select your city' : 'Select emirate first'} />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.city && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.city}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Professional Links (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn Profile
              </Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className={`w-full ${
                  getFieldStatus('linkedinUrl') === 'error'
                    ? 'border-red-500'
                    : getFieldStatus('linkedinUrl') === 'success'
                    ? 'border-green-500'
                    : ''
                }`}
              />
              {errors.linkedinUrl && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.linkedinUrl}
                </p>
              )}
              <p className="text-xs text-gray-500">LinkedIn profiles increase your credibility with employers</p>
            </div>

            {/* Portfolio */}
            <div className="space-y-2">
              <Label htmlFor="portfolioUrl" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Portfolio/Website
              </Label>
              <Input
                id="portfolioUrl"
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                placeholder="https://yourportfolio.com"
                className={`w-full ${
                  getFieldStatus('portfolioUrl') === 'error'
                    ? 'border-red-500'
                    : getFieldStatus('portfolioUrl') === 'success'
                    ? 'border-green-500'
                    : ''
                }`}
              />
              {errors.portfolioUrl && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.portfolioUrl}
                </p>
              )}
              <p className="text-xs text-gray-500">Showcase your work with a portfolio or personal website</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>💡 UAE CV Tips:</strong> Make sure your contact information is accurate and professional.
          UAE employers often prefer candidates who are already in the country and have local phone numbers.
        </AlertDescription>
      </Alert>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!isValid || loading.isLoading} className="min-w-[120px]">
          {loading.isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
