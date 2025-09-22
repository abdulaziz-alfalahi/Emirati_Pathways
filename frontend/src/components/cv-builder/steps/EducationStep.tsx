import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Trash2,
  GraduationCap,
  Calendar,
  MapPin,
  Edit,
  Save,
  X,
  Award
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Education } from '@/types/cv';

interface EducationStepProps {
  data: { education?: Education[] };
  onChange: (section: string, data: Education[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const EMPTY_EDUCATION: Education = {
  id: '',
  institution: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  isCurrentStudy: false,
  location: '',
  description: '',
  achievements: [] as string[],
};

const DEGREE_TYPES = [
  'High School Diploma',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate (PhD)',
  'Professional Certificate',
  'Diploma',
  'Other'
];

const UAE_UNIVERSITIES = [
  'United Arab Emirates University',
  'American University of Sharjah',
  'Zayed University',
  'Higher Colleges of Technology',
  'Khalifa University',
  'American University of Dubai',
  'University of Dubai',
  'Al Ghurair University',
  'Ajman University',
  'University of Sharjah',
  'Abu Dhabi University',
  'Canadian University Dubai',
  'Heriot-Watt University Dubai',
  'Murdoch University Dubai',
  'Other'
];

export const EducationStep: React.FC<EducationStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious
}) => {
  const { t } = useTranslation();
  const [educations, setEducations] = useState<Education[]>(data.education || []);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [currentEducation, setCurrentEducation] = useState<Education>(EMPTY_EDUCATION);
  const [newAchievement, setNewAchievement] = useState('');

  const handleAddEducation = () => {
    const newEdu: Education = {
      ...EMPTY_EDUCATION,
      id: `edu_${Date.now()}`
    };
    setCurrentEducation(newEdu);
    setEditingIndex(educations.length);
  };

  const handleEditEducation = (index: number) => {
    setCurrentEducation(educations[index]);
    setEditingIndex(index);
  };

  const handleSaveEducation = () => {
    if (!currentEducation.institution || !currentEducation.degree) {
      return;
    }

    const updatedEducations = [...educations];
    if (editingIndex === educations.length) {
      // Adding new education
      updatedEducations.push(currentEducation);
    } else {
      // Editing existing education
      updatedEducations[editingIndex] = currentEducation;
    }

    // Sort by start date (most recent first)
    updatedEducations.sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    setEducations(updatedEducations);
    onChange('education', updatedEducations);
    setEditingIndex(-1);
    setCurrentEducation(EMPTY_EDUCATION);
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setCurrentEducation(EMPTY_EDUCATION);
  };

  const handleDeleteEducation = (index: number) => {
    const updatedEducations = educations.filter((_, i) => i !== index);
    setEducations(updatedEducations);
    onChange('education', updatedEducations);
  };

  const handleFieldChange = (field: keyof Education, value: any) => {
    setCurrentEducation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      const updatedAchievements = [...(currentEducation.achievements || []), newAchievement.trim()];
      setCurrentEducation(prev => ({
        ...prev,
        achievements: updatedAchievements
      }));
      setNewAchievement('');
    }
  };

  const handleRemoveAchievement = (index: number) => {
    const updatedAchievements =
      currentEducation.achievements?.filter((_, i) => i !== index) || [];
    setCurrentEducation(prev => ({
      ...prev,
      achievements: updatedAchievements
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {t('cv.builder.education.title', 'Education')}
        </h2>
        <p className="text-muted-foreground">
          {t('cv.builder.education.description', 'Add your educational background and qualifications')}
        </p>
      </div>

      {/* Existing Education */}
      <div className="space-y-4">
        {educations.map((education, index) => (
          <Card key={education.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{education.degree}</CardTitle>
                <div className="flex space-x-2">
                  <Button onClick={() => handleEditEducation(index)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleDeleteEducation(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  {education.fieldOfStudy} at {education.institution}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {education.startDate} - {education.isCurrentStudy ? 'Present' : education.endDate}
                </div>
                {education.location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {education.location}
                  </div>
                )}
                {education.gpa && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Award className="h-4 w-4 mr-2" />
                    GPA: {education.gpa}
                  </div>
                )}
                {education.description && (
                  <p className="text-sm mt-2">{education.description}</p>
                )}
                {education.achievements && education.achievements.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Achievements:</p>
                    <ul className="text-sm space-y-1">
                      {education.achievements.map((achievement, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Education Form */}
      {editingIndex >= 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>
              {editingIndex === educations.length
                ? t('cv.builder.education.add', 'Add New Education')
                : t('cv.builder.education.edit', 'Edit Education')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="institution">
                  {t('cv.builder.education.institution', 'Institution')} *
                </Label>
                <Select
                  value={currentEducation.institution}
                  onValueChange={(value) => handleFieldChange('institution', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('cv.builder.education.institutionPlaceholder', 'Select or type institution')} />
                  </SelectTrigger>
                  <SelectContent>
                    {UAE_UNIVERSITIES.map((uni) => (
                      <SelectItem key={uni} value={uni}>
                        {uni}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentEducation.institution === 'Other' && (
                  <Input
                    className="mt-2"
                    placeholder={t('cv.builder.education.customInstitution', 'Enter institution name')}
                    onChange={(e) => handleFieldChange('institution', e.target.value)}
                  />
                )}
              </div>
              <div>
                <Label htmlFor="degree">
                  {t('cv.builder.education.degree', 'Degree')} *
                </Label>
                <Select
                  value={currentEducation.degree}
                  onValueChange={(value) => handleFieldChange('degree', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('cv.builder.education.degreePlaceholder', 'Select degree type')} />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREE_TYPES.map((degree) => (
                      <SelectItem key={degree} value={degree}>
                        {degree}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="fieldOfStudy">
                {t('cv.builder.education.fieldOfStudy', 'Field of Study')} *
              </Label>
              <Input
                id="fieldOfStudy"
                value={currentEducation.fieldOfStudy}
                onChange={(e) => handleFieldChange('fieldOfStudy', e.target.value)}
                placeholder={t('cv.builder.education.fieldPlaceholder', 'e.g., Computer Science, Business Administration')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">
                  {t('cv.builder.education.startDate', 'Start Date')} *
                </Label>
                <Input
                  id="startDate"
                  type="month"
                  value={currentEducation.startDate}
                  onChange={(e) => handleFieldChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">
                  {t('cv.builder.education.endDate', 'End Date')}
                </Label>
                <Input
                  id="endDate"
                  type="month"
                  value={currentEducation.endDate}
                  onChange={(e) => handleFieldChange('endDate', e.target.value)}
                  disabled={currentEducation.isCurrentStudy}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="currentlyStudying"
                  checked={currentEducation.isCurrentStudy}
                  onCheckedChange={(checked) => {
                    const isChecked = Boolean(checked);
                    handleFieldChange('isCurrentStudy', isChecked);
                    if (isChecked) {
                      handleFieldChange('endDate', '');
                    }
                  }}
                />
                <Label htmlFor="currentlyStudying" className="text-sm">
                  {t('cv.builder.education.currentlyStudying', 'Currently studying')}
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">
                  {t('cv.builder.education.location', 'Location')}
                </Label>
                <Input
                  id="location"
                  value={currentEducation.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  placeholder={t('cv.builder.education.locationPlaceholder', 'e.g., Dubai, UAE')}
                />
              </div>
              <div>
                <Label htmlFor="gpa">
                  {t('cv.builder.education.gpa', 'GPA/Grade')}
                </Label>
                <Input
                  id="gpa"
                  value={(currentEducation as any).gpa || ''}
                  onChange={(e) => handleFieldChange('gpa' as keyof Education, e.target.value)}
                  placeholder={t('cv.builder.education.gpaPlaceholder', 'e.g., 3.8/4.0 or First Class')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">
                {t('cv.builder.education.description', 'Description')}
              </Label>
              <Textarea
                id="description"
                value={currentEducation.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder={t('cv.builder.education.descriptionPlaceholder', 'Relevant coursework, thesis, or additional details...')}
                className="min-h-[80px]"
              />
            </div>

            {/* Achievements */}
            <div>
              <Label>{t('cv.builder.education.achievements', 'Academic Achievements')}</Label>
              <div className="space-y-2">
                {currentEducation.achievements?.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={achievement} readOnly className="flex-1" />
                    <Button onClick={() => handleRemoveAchievement(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    placeholder={t(
                      'cv.builder.education.achievementPlaceholder',
                      "e.g., Dean's List, Magna Cum Laude, Scholarship recipient..."
                    )}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAchievement()}
                  />
                  <Button onClick={handleAddAchievement}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSaveEducation}>
                <Save className="h-4 w-4 mr-2" />
                {t('common.save', 'Save')}
              </Button>
              <Button onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel', 'Cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Education Button */}
      {editingIndex === -1 && (
        <Card className="border-dashed border-2 border-gray-300 hover:border-primary cursor-pointer transition-colors">
          <CardContent className="flex items-center justify-center py-8" onClick={handleAddEducation}>
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">
                {t('cv.builder.education.addNew', 'Add Education')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* UAE Education Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">
            {t('cv.builder.education.uaeTips', 'UAE Education Tips')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• {t('cv.builder.education.tip1', 'Include degree equivalency if educated outside UAE')}</p>
            <p>• {t('cv.builder.education.tip2', 'Mention relevant coursework for career changes')}</p>
            <p>• {t('cv.builder.education.tip3', 'Highlight honors, scholarships, and academic achievements')}</p>
            <p>• {t('cv.builder.education.tip4', 'Include professional development and continuing education')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button onClick={onPrevious}>
          {t('common.previous', 'Previous')}
        </Button>
        <Button onClick={onNext}>
          {t('common.next', 'Next')}
        </Button>
      </div>
    </div>
  );
};
