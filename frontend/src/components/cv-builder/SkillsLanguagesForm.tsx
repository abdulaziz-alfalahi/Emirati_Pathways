
import React, { useState } from 'react';
import { useCV, Skill, Language } from '@/context/CVContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Save, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Skill level options
const skillLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" }
];

// Language proficiency options
const languageProficiencies = [
  { value: "elementary", label: "Elementary" },
  { value: "limited", label: "Limited Working" },
  { value: "professional", label: "Professional Working" },
  { value: "full_professional", label: "Full Professional" },
  { value: "native", label: "Native/Bilingual" },
];

const SkillsLanguagesForm: React.FC = () => {
  const { 
    cvData, 
    addSkill, 
    updateSkill, 
    removeSkill, 
    addLanguage, 
    updateLanguage, 
    removeLanguage, 
    saveCV, 
    isSaving 
  } = useCV();

  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' });
  const [newLanguage, setNewLanguage] = useState({ name: '', proficiency: 'professional' });

  // Skills management
  const handleAddSkill = () => {
    if (newSkill.name.trim()) {
      addSkill(newSkill);
      setNewSkill({ name: '', level: 'intermediate' });
    }
  };

  const handleSkillLevelChange = (skillId: string, level: string) => {
    const skill = cvData.skills.find(s => s.id === skillId);
    if (skill) {
      updateSkill({ ...skill, level });
    }
  };

  // Languages management
  const handleAddLanguage = () => {
    if (newLanguage.name.trim()) {
      addLanguage(newLanguage);
      setNewLanguage({ name: '', proficiency: 'professional' });
    }
  };

  const handleLanguageProficiencyChange = (languageId: string, proficiency: string) => {
    const language = cvData.languages.find(l => l.id === languageId);
    if (language) {
      updateLanguage({ ...language, proficiency });
    }
  };

  // Save both skills and languages
  const handleSave = async () => {
    await saveCV();
  };

  return (
    <div className="space-y-6">
      {/* Skills Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Skills</h3>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Add a skill (e.g., JavaScript, Project Management)"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
              </div>
              <Select
                value={newSkill.level}
                onValueChange={(value) => setNewSkill({ ...newSkill, level: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {skillLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddSkill}>
                <PlusCircle className="h-4 w-4 me-2" />
                Add
              </Button>
            </div>

            <div className="mb-2">
              <Label>Your Skills</Label>
            </div>

            {cvData.skills.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-muted-foreground">
                  No skills added yet. Add skills that are relevant to your field.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {cvData.skills.map((skill) => (
                  <div key={skill.id} className="flex items-center border rounded-md p-2">
                    <div className="flex-1 font-medium">{skill.name}</div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={skill.level}
                        onValueChange={(value) => handleSkillLevelChange(skill.id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {skillLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeSkill(skill.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Languages Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Languages</h3>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Add a language (e.g., English, Spanish)"
                  value={newLanguage.name}
                  onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLanguage();
                    }
                  }}
                />
              </div>
              <Select
                value={newLanguage.proficiency}
                onValueChange={(value) => setNewLanguage({ ...newLanguage, proficiency: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select proficiency" />
                </SelectTrigger>
                <SelectContent>
                  {languageProficiencies.map((proficiency) => (
                    <SelectItem key={proficiency.value} value={proficiency.value}>
                      {proficiency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddLanguage}>
                <PlusCircle className="h-4 w-4 me-2" />
                Add
              </Button>
            </div>

            <div className="mb-2">
              <Label>Your Languages</Label>
            </div>

            {cvData.languages.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-muted-foreground">
                  No languages added yet. Add languages that you can communicate in.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {cvData.languages.map((language) => (
                  <div key={language.id} className="flex items-center border rounded-md p-2">
                    <div className="flex-1 font-medium">{language.name}</div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={language.proficiency}
                        onValueChange={(value) => handleLanguageProficiencyChange(language.id, value)}
                      >
                        <SelectTrigger className="w-[150px] h-8">
                          <SelectValue placeholder="Select proficiency" />
                        </SelectTrigger>
                        <SelectContent>
                          {languageProficiencies.map((proficiency) => (
                            <SelectItem key={proficiency.value} value={proficiency.value}>
                              {proficiency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeLanguage(language.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full"
      >
        <Save className="me-2 h-4 w-4" />
        Save Skills & Languages
      </Button>
    </div>
  );
};

export default SkillsLanguagesForm;
