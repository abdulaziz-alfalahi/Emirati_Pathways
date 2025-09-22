import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Building,
  Calendar,
  MapPin,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Experience } from '@/types/cv';

interface ExperienceStepProps {
  data: { experience?: Experience[] };
  onChange: (section: string, data: Experience[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const EMPTY_EXPERIENCE: Experience = {
  id: '',
  company: '',
  jobTitle: '',
  startDate: '',
  endDate: '',
  isCurrentJob: false,
  location: '',
  description: '',
  achievements: [] as string[],
  skills: [] as string[],
};

export const ExperienceStep: React.FC<ExperienceStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious
}) => {
  const { t } = useTranslation();
  const [experiences, setExperiences] = useState<Experience[]>(data.experience || []);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [currentExperience, setCurrentExperience] = useState<Experience>(EMPTY_EXPERIENCE);
  const [newAchievement, setNewAchievement] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const handleAddExperience = () => {
    const newExp: Experience = {
      ...EMPTY_EXPERIENCE,
      id: `exp_${Date.now()}`
    };
    setCurrentExperience(newExp);
    setEditingIndex(experiences.length);
  };

  const handleEditExperience = (index: number) => {
    setCurrentExperience(experiences[index]);
    setEditingIndex(index);
  };

  const handleSaveExperience = () => {
    if (!currentExperience.company || !currentExperience.jobTitle) {
      return;
    }

    const updatedExperiences = [...experiences];
    if (editingIndex === experiences.length) {
      // Adding new experience
      updatedExperiences.push(currentExperience);
    } else {
      // Editing existing experience
      updatedExperiences[editingIndex] = currentExperience;
    }

    setExperiences(updatedExperiences);
    onChange('experience', updatedExperiences);
    setEditingIndex(-1);
    setCurrentExperience(EMPTY_EXPERIENCE);
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setCurrentExperience(EMPTY_EXPERIENCE);
  };

  const handleDeleteExperience = (index: number) => {
    const updatedExperiences = experiences.filter((_, i) => i !== index);
    setExperiences(updatedExperiences);
    onChange('experience', updatedExperiences);
  };

  const handleFieldChange = (field: keyof Experience, value: any) => {
    setCurrentExperience(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      const updatedAchievements = [...(currentExperience.achievements || []), newAchievement.trim()];
      setCurrentExperience(prev => ({
        ...prev,
        achievements: updatedAchievements
      }));
      setNewAchievement('');
    }
  };

  const handleRemoveAchievement = (index: number) => {
    const updatedAchievements = currentExperience.achievements?.filter((_, i) => i !== index) || [];
    setCurrentExperience(prev => ({
      ...prev,
      achievements: updatedAchievements
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      const updatedSkills = [...(currentExperience.skills || []), newSkill.trim()];
      setCurrentExperience(prev => ({
        ...prev,
        skills: updatedSkills
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    const updatedSkills = currentExperience.skills?.filter((_, i) => i !== index) || [];
    setCurrentExperience(prev => ({
      ...prev,
      skills: updatedSkills
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {t('cv.builder.experience.title', 'Work Experience')}
        </h2>
        <p className="text-muted-foreground">
          {t('cv.builder.experience.description', 'Add your professional work experience')}
        </p>
      </div>

      {/* Existing Experiences */}
      <div className="space-y-4">
        {experiences.map((experience, index) => (
          <Card key={experience.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{experience.jobTitle}</CardTitle>
                <div className="flex space-x-2">
                  <Button onClick={() => handleEditExperience(index)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleDeleteExperience(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="h-4 w-4 mr-2" />
                  {experience.company}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {experience.startDate} - {experience.isCurrentJob ? 'Present' : experience.endDate}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {experience.location}
                </div>
                <p className="text-sm mt-2">{experience.description}</p>
                {experience.achievements && experience.achievements.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Key Achievements:</p>
                    <ul className="text-sm space-y-1">
                      {experience.achievements.map((achievement, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {experience.skills && experience.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {experience.skills.map((skill, i) => (
                      <Badge key={i} className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Experience Form */}
      {editingIndex >= 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>
              {editingIndex === experiences.length
                ? t('cv.builder.experience.add', 'Add New Experience')
                : t('cv.builder.experience.edit', 'Edit Experience')
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobTitle">
                  {t('cv.builder.experience.position', 'Job Title')} *
                </Label>
                <Input
                  id="jobTitle"
                  value={currentExperience.jobTitle}
                  onChange={(e) => handleFieldChange('jobTitle', e.target.value)}
                  placeholder={t('cv.builder.experience.positionPlaceholder', 'e.g., Senior Software Engineer')}
                />
              </div>
              <div>
                <Label htmlFor="company">
                  {t('cv.builder.experience.company', 'Company')} *
                </Label>
                <Input
                  id="company"
                  value={currentExperience.company}
                  onChange={(e) => handleFieldChange('company', e.target.value)}
                  placeholder={t('cv.builder.experience.companyPlaceholder', 'e.g., Emirates NBD')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">
                  {t('cv.builder.experience.startDate', 'Start Date')} *
                </Label>
                <Input
                  id="startDate"
                  type="month"
                  value={currentExperience.startDate}
                  onChange={(e) => handleFieldChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">
                  {t('cv.builder.experience.endDate', 'End Date')}
                </Label>
                <Input
                  id="endDate"
                  type="month"
                  value={currentExperience.endDate}
                  onChange={(e) => handleFieldChange('endDate', e.target.value)}
                  disabled={currentExperience.isCurrentJob}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="currentlyWorking"
                  checked={currentExperience.isCurrentJob}
                  onCheckedChange={(checked) => {
                    const isChecked = Boolean(checked);
                    handleFieldChange('isCurrentJob', isChecked);
                    if (isChecked) {
                      handleFieldChange('endDate', '');
                    }
                  }}
                />
                <Label htmlFor="currentlyWorking" className="text-sm">
                  {t('cv.builder.experience.currentlyWorking', 'Currently working here')}
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="location">
                {t('cv.builder.experience.location', 'Location')}
              </Label>
              <Input
                id="location"
                value={currentExperience.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                placeholder={t('cv.builder.experience.locationPlaceholder', 'e.g., Dubai, UAE')}
              />
            </div>

            <div>
              <Label htmlFor="description">
                {t('cv.builder.experience.description', 'Job Description')}
              </Label>
              <Textarea
                id="description"
                value={currentExperience.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder={t('cv.builder.experience.descriptionPlaceholder', 'Describe your role and responsibilities...')}
                className="min-h-[100px]"
              />
            </div>

            {/* Achievements */}
            <div>
              <Label>{t('cv.builder.experience.achievements', 'Key Achievements')}</Label>
              <div className="space-y-2">
                {currentExperience.achievements?.map((achievement, index) => (
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
                    placeholder={t('cv.builder.experience.achievementPlaceholder', 'Add an achievement...')}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAchievement()}
                  />
                  <Button onClick={handleAddAchievement}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <Label>{t('cv.builder.experience.skills', 'Skills Used')}</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {currentExperience.skills?.map((skill, index) => (
                    <Badge key={index} className="cursor-pointer">
                      {skill}
                      <X
                        className="h-3 w-3 ml-1"
                        onClick={() => handleRemoveSkill(index)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder={t('cv.builder.experience.skillPlaceholder', 'Add a skill...')}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                  <Button onClick={handleAddSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSaveExperience}>
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

      {/* Add New Experience Button */}
      {editingIndex === -1 && (
        <Card className="border-dashed border-2 border-gray-300 hover:border-primary cursor-pointer transition-colors">
          <CardContent className="flex items-center justify-center py-8" onClick={handleAddExperience}>
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">
                {t('cv.builder.experience.addNew', 'Add Work Experience')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
