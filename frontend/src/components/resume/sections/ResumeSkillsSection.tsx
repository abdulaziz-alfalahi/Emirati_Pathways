
import React from 'react';
import { Skill, Language } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ResumeSkillsSectionProps {
  skills: Skill[];
  languages: Language[];
  onSkillsChange: (skills: Skill[]) => void;
  onLanguagesChange: (languages: Language[]) => void;
}

const ResumeSkillsSection: React.FC<ResumeSkillsSectionProps> = ({ 
  skills, 
  languages, 
  onSkillsChange, 
  onLanguagesChange 
}) => {
  // Skills handlers
  const addSkill = () => {
    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name: '',
      level: 'intermediate'
    };
    onSkillsChange([...skills, newSkill]);
  };

  const updateSkill = (index: number, field: keyof Skill, value: any) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = {
      ...updatedSkills[index],
      [field]: value
    };
    onSkillsChange(updatedSkills);
  };

  const removeSkill = (index: number) => {
    const updatedSkills = [...skills];
    updatedSkills.splice(index, 1);
    onSkillsChange(updatedSkills);
  };

  // Languages handlers
  const addLanguage = () => {
    const newLanguage: Language = {
      id: crypto.randomUUID(),
      name: '',
      proficiency: 'fluent'
    };
    onLanguagesChange([...languages, newLanguage]);
  };

  const updateLanguage = (index: number, field: keyof Language, value: any) => {
    const updatedLanguages = [...languages];
    updatedLanguages[index] = {
      ...updatedLanguages[index],
      [field]: value
    };
    onLanguagesChange(updatedLanguages);
  };

  const removeLanguage = (index: number) => {
    const updatedLanguages = [...languages];
    updatedLanguages.splice(index, 1);
    onLanguagesChange(updatedLanguages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills & Languages</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="skills" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="skills">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Add your technical and professional skills.</p>
                <Button variant="outline" size="sm" onClick={addSkill}>
                  <Plus size={16} className="mr-2" />
                  Add Skill
                </Button>
              </div>
              
              {skills.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No skills added. Click "Add Skill" to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {skills.map((skill, index) => (
                    <div key={skill.id} className="flex items-center gap-4">
                      <div className="grow">
                        <Input
                          value={skill.name}
                          onChange={(e) => updateSkill(index, 'name', e.target.value)}
                          placeholder="e.g., Project Management"
                        />
                      </div>
                      <div className="w-40">
                        <Select
                          value={skill.level}
                          onValueChange={(value) => updateSkill(index, 'level', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeSkill(index)}
                        className="text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="languages">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Add languages you speak and their proficiency level.</p>
                <Button variant="outline" size="sm" onClick={addLanguage}>
                  <Plus size={16} className="mr-2" />
                  Add Language
                </Button>
              </div>
              
              {languages.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No languages added. Click "Add Language" to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {languages.map((language, index) => (
                    <div key={language.id} className="flex items-center gap-4">
                      <div className="grow">
                        <Input
                          value={language.name}
                          onChange={(e) => updateLanguage(index, 'name', e.target.value)}
                          placeholder="e.g., Arabic"
                        />
                      </div>
                      <div className="w-40">
                        <Select
                          value={language.proficiency}
                          onValueChange={(value) => updateLanguage(index, 'proficiency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Proficiency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="conversational">Conversational</SelectItem>
                            <SelectItem value="fluent">Fluent</SelectItem>
                            <SelectItem value="native">Native</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeLanguage(index)}
                        className="text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ResumeSkillsSection;
