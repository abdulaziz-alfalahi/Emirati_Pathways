
import React, { useState } from 'react';
import { useCV, Experience } from '@/context/CVContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Save, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface ExperienceItemProps {
  experience: Experience;
  onUpdate: (experience: Experience) => void;
  onRemove: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const ExperienceItem: React.FC<ExperienceItemProps> = ({
  experience,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown
}) => {
  const [formData, setFormData] = useState<Experience>(experience);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCurrentChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      current: checked,
      endDate: checked ? null : prev.endDate
    }));
  };

  const handleBlur = () => {
    onUpdate(formData);
  };

  return (
    <Card className="border border-muted">
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-medium">
          {formData.position || 'New Position'} 
          {formData.company ? ` at ${formData.company}` : ''}
        </CardTitle>
        <div className="flex space-x-2">
          {onMoveUp && (
            <Button size="icon" variant="ghost" onClick={onMoveUp}>
              <ArrowUpCircle size={18} />
            </Button>
          )}
          {onMoveDown && (
            <Button size="icon" variant="ghost" onClick={onMoveDown}>
              <ArrowDownCircle size={18} />
            </Button>
          )}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onRemove(experience.id)}
            className="text-destructive"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`company-${experience.id}`}>Company</Label>
              <Input
                id={`company-${experience.id}`}
                name="company"
                value={formData.company}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Company Name"
              />
            </div>
            <div>
              <Label htmlFor={`position-${experience.id}`}>Position</Label>
              <Input
                id={`position-${experience.id}`}
                name="position"
                value={formData.position}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Job Title"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor={`location-${experience.id}`}>Location (Optional)</Label>
            <Input
              id={`location-${experience.id}`}
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="City, Country"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`startDate-${experience.id}`}>Start Date</Label>
              <Input
                id={`startDate-${experience.id}`}
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor={`endDate-${experience.id}`}>End Date</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`current-${experience.id}`}
                    checked={formData.current}
                    onCheckedChange={handleCurrentChange}
                  />
                  <Label htmlFor={`current-${experience.id}`} className="text-sm">
                    Current
                  </Label>
                </div>
              </div>
              <Input
                id={`endDate-${experience.id}`}
                name="endDate"
                type="date"
                value={formData.endDate || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={formData.current}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor={`description-${experience.id}`}>Description</Label>
            <Textarea
              id={`description-${experience.id}`}
              name="description"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Describe your responsibilities and achievements"
              rows={4}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ExperienceForm: React.FC = () => {
  const { cvData, addExperience, updateExperience, removeExperience, saveCV, isSaving } = useCV();

  const handleAddExperience = () => {
    const newExperience = {
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    addExperience(newExperience);
  };

  const moveExperience = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const updatedExperiences = [...cvData.experience];
    const [movedItem] = updatedExperiences.splice(fromIndex, 1);
    updatedExperiences.splice(toIndex, 0, movedItem);
    
    // Update all experiences with new order
    updatedExperiences.forEach(exp => updateExperience(exp));
  };

  const handleSave = async () => {
    await saveCV();
  };

  const experienceItems = cvData.experience || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Work Experience</h3>
        <Button variant="outline" onClick={handleAddExperience}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Experience
        </Button>
      </div>
      
      {experienceItems.length === 0 ? (
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <p className="text-muted-foreground">
            No work experience added yet. Click the button above to add your first work experience.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {experienceItems.map((experience, index) => (
            <ExperienceItem
              key={experience.id}
              experience={experience}
              onUpdate={updateExperience}
              onRemove={removeExperience}
              onMoveUp={index > 0 ? () => moveExperience(index, index - 1) : undefined}
              onMoveDown={index < experienceItems.length - 1 ? () => moveExperience(index, index + 1) : undefined}
            />
          ))}
        </div>
      )}
      
      <Separator className="my-4" />
      
      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full"
      >
        <Save className="mr-2 h-4 w-4" />
        Save All Experience
      </Button>
    </div>
  );
};

export default ExperienceForm;
