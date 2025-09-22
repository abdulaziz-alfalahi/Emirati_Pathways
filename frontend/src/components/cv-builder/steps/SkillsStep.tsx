import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Removed unused imports that caused confusion / typing mismatches
// import { getRecommendedSkills, UAE_HIGH_DEMAND_SKILLS } from '@/utils/uae-data';
import { 
  Plus,
  X,
  Code,
  Users,
  Languages as LanguagesIcon,
  Settings,
  Star,
  Zap,
  Globe,
  Lightbulb,
  Target
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skill, UAE_STRATEGIC_SKILLS } from '@/types/cv';

interface SkillsStepProps {
  data: { skills?: Skill[] };
  onChange: (section: string, data: Skill[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const SKILL_LEVELS: Array<{ value: Skill['level']; label: string; description: string }> = [
  { value: 'Beginner', label: 'Beginner', description: 'Basic understanding' },
  { value: 'Intermediate', label: 'Intermediate', description: 'Working knowledge' },
  { value: 'Advanced', label: 'Advanced', description: 'Proficient and experienced' },
  { value: 'Expert', label: 'Expert', description: 'Highly skilled and can teach others' }
];

// Categories UI config
const SKILL_CATEGORIES: Array<{
  value: Skill['category'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  strategic: boolean;
}> = [
  { value: 'Technical', label: 'Technical & Digital', icon: Code, strategic: true },
  { value: 'Strategic', label: 'Strategic & Innovation', icon: Target, strategic: true },
  { value: 'Soft', label: 'Soft Skills', icon: Users, strategic: false },
  { value: 'Cultural', label: 'Cultural Intelligence', icon: Globe, strategic: true },
  { value: 'Language', label: 'Languages', icon: LanguagesIcon, strategic: false },
  { value: 'Other', label: 'Other', icon: Settings, strategic: false }
];

// Build suggestions using proper keys from UAE_STRATEGIC_SKILLS (title-cased)
const TECH_SUGGESTIONS = [
  UAE_STRATEGIC_SKILLS['Artificial Intelligence'],
  UAE_STRATEGIC_SKILLS['Machine Learning'],
  UAE_STRATEGIC_SKILLS['Data Science'],
  UAE_STRATEGIC_SKILLS['Cybersecurity'],
  UAE_STRATEGIC_SKILLS['Cloud Computing'],
  UAE_STRATEGIC_SKILLS['Blockchain Technology'],
  UAE_STRATEGIC_SKILLS['IoT Development'],
  UAE_STRATEGIC_SKILLS['Digital Transformation'],
  UAE_STRATEGIC_SKILLS['Smart City Planning'],
];

const STRATEGIC_SUGGESTIONS = [
  UAE_STRATEGIC_SKILLS['Innovation Leadership'],
  UAE_STRATEGIC_SKILLS['Strategic Thinking'],
  UAE_STRATEGIC_SKILLS['Change Management'],
  UAE_STRATEGIC_SKILLS['Future Planning'],
  UAE_STRATEGIC_SKILLS['Economic Diversification'],
  UAE_STRATEGIC_SKILLS['Future Readiness'],
];

const CULTURAL_SUGGESTIONS = [
  UAE_STRATEGIC_SKILLS['Cultural Intelligence'],
  UAE_STRATEGIC_SKILLS['Cross-cultural Communication'],
  UAE_STRATEGIC_SKILLS['Arabic Language Proficiency'],
];

const SKILL_SUGGESTIONS: Record<Skill['category'], string[]> = {
  Technical: TECH_SUGGESTIONS,
  Strategic: STRATEGIC_SUGGESTIONS,
  Cultural: CULTURAL_SUGGESTIONS,
  Soft: [
    'Leadership',
    'Communication',
    'Problem Solving',
    'Team Management',
    'Project Management',
    'Strategic Planning',
    'Customer Service',
    'Negotiation',
    'Presentation Skills',
    'Time Management',
    'Critical Thinking',
    'Adaptability',
  ],
  Language: [
    'Arabic',
    'English',
    'Hindi',
    'Urdu',
    'French',
    'German',
    'Spanish',
    'Mandarin',
    'Russian',
    'Japanese',
    'Korean',
    'Italian',
  ],
  Other: [
    'Project Management',
    'Data Analysis',
    'Customer Service',
    'Quality Assurance',
    'Research',
    'Training & Development',
    'Event Management',
    'Social Media Management',
  ],
};

export const SkillsStep: React.FC<SkillsStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
}) => {
  const { t } = useTranslation('cv-builder');
  const [skills, setSkills] = useState<Skill[]>(data.skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<Skill['level']>('Intermediate');
  const [newSkillCategory, setNewSkillCategory] = useState<Skill['category']>('Technical');
  const [activeCategory, setActiveCategory] = useState<Skill['category']>('Technical');

  const computeIsStrategic = (category: Skill['category'], name?: string): boolean => {
    // Treat Technical, Strategic, and Cultural as strategic; plus any skill explicitly in UAE_STRATEGIC_SKILLS
    const categoryStrategic = category === 'Technical' || category === 'Strategic' || category === 'Cultural';
    const nameStrategic = name ? Object.prototype.hasOwnProperty.call(UAE_STRATEGIC_SKILLS, name) : false;
    return categoryStrategic || nameStrategic;
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;

    const newSkill: Skill = {
      id: `skill_${Date.now()}`,
      name: newSkillName.trim(),
      level: newSkillLevel,
      category: newSkillCategory,
      isStrategic: computeIsStrategic(newSkillCategory, newSkillName.trim()),
    };

    const updatedSkills = [...skills, newSkill];
    setSkills(updatedSkills);
    onChange('skills', updatedSkills);
    setNewSkillName('');
  };

  const handleRemoveSkill = (skillId: string) => {
    const updatedSkills = skills.filter((skill) => skill.id !== skillId);
    setSkills(updatedSkills);
    onChange('skills', updatedSkills);
  };

  const handleUpdateSkillLevel = (skillId: string, level: Skill['level']) => {
    const updatedSkills = skills.map((skill) =>
      skill.id === skillId ? { ...skill, level } : skill
    );
    setSkills(updatedSkills);
    onChange('skills', updatedSkills);
  };

  const handleAddPresetSkill = (skillName: string, category: Skill['category']) => {
    if (skills.some((skill) => skill.name.toLowerCase() === skillName.toLowerCase())) {
      return; // Skill already exists
    }

    const newSkill: Skill = {
      id: `skill_${Date.now()}`,
      name: skillName,
      level: 'Intermediate',
      category,
      isStrategic: computeIsStrategic(category, skillName),
    };

    const updatedSkills = [...skills, newSkill];
    setSkills(updatedSkills);
    onChange('skills', updatedSkills);
  };

  const getSkillsByCategory = (category: Skill['category']) => {
    return skills.filter((skill) => skill.category === category);
  };

  const getLevelColor = (level: Skill['level']) => {
    switch (level) {
      case 'Beginner':
        return 'bg-red-100 text-red-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-blue-100 text-blue-800';
      case 'Expert':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelStars = (level: Skill['level']) => {
    const levels = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 } as const;
    return levels[level] || 1;
  };

  const getStrategicSkillsCount = () => {
    return skills.filter(
      (skill) =>
        skill.isStrategic ||
        skill.category === 'Technical' ||
        skill.category === 'Strategic' ||
        skill.category === 'Cultural'
    ).length;
  };

  const getAdvancedSkillsCount = () => {
    return skills.filter((skill) => skill.level === 'Advanced' || skill.level === 'Expert').length;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {t('steps.skills.title', 'Skills & Strategic Competencies')}
        </h2>
        <p className="text-muted-foreground">
          {t(
            'steps.skills.description',
            'Showcase your technical skills, strategic thinking, and cultural intelligence aligned with D33 and Talent33'
          )}
        </p>
      </div>

      {/* Strategic Skills Overview */}
      {skills.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('steps.skills.strategicOverview', 'Strategic Skills Overview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-700">{skills.length}</div>
                <div className="text-sm text-blue-600">{t('steps.skills.totalSkills', 'Total Skills')}</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">{getStrategicSkillsCount()}</div>
                <div className="text-sm text-green-600">{t('steps.skills.strategicSkills', 'Strategic Skills')}</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-700">{getAdvancedSkillsCount()}</div>
                <div className="text-sm text-purple-600">{t('steps.skills.advancedSkills', 'Advanced+ Skills')}</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-700">
                  {skills.filter((s) => s.category === 'Language').length}
                </div>
                <div className="text-sm text-orange-600">{t('steps.skills.languages', 'Languages')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Skill */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            {t('steps.skills.addNew', 'Add New Skill')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="skillName">{t('steps.skills.name', 'Skill Name')}</Label>
              <Input
                id="skillName"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder={t(
                  'steps.skills.namePlaceholder',
                  'e.g., Artificial Intelligence, Strategic Planning, Arabic'
                )}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              />
            </div>
            <div>
              <Label htmlFor="skillCategory">{t('steps.skills.category', 'Category')}</Label>
              <Select
                value={newSkillCategory}
                onValueChange={(value: Skill['category']) => setNewSkillCategory(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        {category.strategic && <Star className="h-3 w-3 text-yellow-500" />}
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="skillLevel">{t('steps.skills.level', 'Level')}</Label>
              <Select value={newSkillLevel} onValueChange={(value: Skill['level']) => setNewSkillLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddSkill} className="mt-4" disabled={!newSkillName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            {t('steps.skills.add', 'Add Skill')}
          </Button>
        </CardContent>
      </Card>

      {/* Skills by Category */}
      <Tabs value={activeCategory} onValueChange={(value: string) => setActiveCategory(value as Skill['category'])}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {SKILL_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const categorySkills = getSkillsByCategory(category.value);
            return (
              <TabsTrigger key={category.value} value={category.value} className="flex items-center space-x-1 text-xs">
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{category.label.split(' ')[0]}</span>
                {categorySkills.length > 0 && <Badge className="ml-1 text-xs">{categorySkills.length}</Badge>}
                {category.strategic && <Star className="h-2 w-2 text-yellow-500" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {SKILL_CATEGORIES.map((category) => (
          <TabsContent key={category.value} value={category.value} className="mt-6">
            <div className="space-y-4">
              {/* Current Skills in Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <category.icon className="h-5 w-5" />
                      {t(`steps.skills.categories.${category.value.toLowerCase()}`, category.label)}
                      {category.strategic && (
                        <Badge className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          {t('steps.skills.strategic', 'Strategic')}
                        </Badge>
                      )}
                    </div>
                    {category.strategic && (
                      <div className="flex items-center">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        <span className="sr-only">Strategic Framework Aligned</span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getSkillsByCategory(category.value).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        {t(
                          'steps.skills.noSkills',
                          'No skills added yet. Add some skills or choose from suggestions below.'
                        )}
                      </p>
                      {category.strategic && (
                        <p className="text-sm text-blue-600">
                          {t(
                            'steps.skills.strategicImportance',
                            'These skills are highly valued for D33 and Talent33 and strategic frameworks.'
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getSkillsByCategory(category.value).map((skill) => (
                        <div
                          key={skill.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{skill.name}</span>
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: 4 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < getLevelStars(skill.level) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <Badge className={getLevelColor(skill.level)}>{skill.level}</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Select
                              value={skill.level}
                              onValueChange={(value: Skill['level']) => handleUpdateSkillLevel(skill.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SKILL_LEVELS.map((level) => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button onClick={() => handleRemoveSkill(skill.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Skill Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    {t('steps.skills.suggestions', 'Suggested Skills')}
                    {category.strategic && (
                      <Badge className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        {t('steps.skills.highDemand', 'High Demand')}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {SKILL_SUGGESTIONS[category.value].map((skillName, index) => {
                      const isAlreadyAdded = skills.some(
                        (skill) => skill.name.toLowerCase() === skillName.toLowerCase()
                      );

                      return (
                        <Button
                          key={`${category.value}-${index}-${skillName}`}
                          onClick={() => handleAddPresetSkill(skillName, category.value)}
                          disabled={isAlreadyAdded}
                          className={`text-left justify-start h-auto p-2 ${
                            isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <Plus className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="text-xs">{skillName}</span>
                        </Button>
                      );
                    })}
                  </div>

                  {category.strategic && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {t('steps.skills.strategicAlignment', 'Strategic Framework Alignment')}
                        </span>
                      </div>
                      <p className="text-xs text-blue-700">
                        {t(
                          'steps.skills.strategicDescription',
                          'These skills align with D33 and Talent33 strategic priorities and are highly valued by employers in the UAE market.'
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button onClick={onPrevious}>{t('common.previous', 'Previous')}</Button>
        <Button onClick={onNext} disabled={skills.length === 0}>
          {t('common.next', 'Next')}
        </Button>
      </div>
    </div>
  );
};
