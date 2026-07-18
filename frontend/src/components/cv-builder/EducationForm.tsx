
import React, { useState } from 'react';
import { useCV, Education } from '@/context/CVContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Save, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface EducationItemProps {
  education: Education;
  onUpdate: (education: Education) => void;
  onRemove: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const EducationItem: React.FC<EducationItemProps> = ({
  education,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown
}) => {
  const [formData, setFormData] = useState<Education>(education);

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
          {formData.degree || 'Degree'} 
          {formData.institution ? ` at ${formData.institution}` : ''}
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
            onClick={() => onRemove(education.id)}
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
              <Label htmlFor={`institution-${education.id}`}>Institution</Label>
              <Input
                id={`institution-${education.id}`}
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="University Name"
              />
            </div>
            <div>
              <Label htmlFor={`degree-${education.id}`}>Degree</Label>
              <Input
                id={`degree-${education.id}`}
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Bachelor's, Master's, etc."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`field-${education.id}`}>Field of Study</Label>
              <Input
                id={`field-${education.id}`}
                name="field"
                value={formData.field}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Computer Science, Business, etc."
              />
            </div>
            <div>
              <Label htmlFor={`location-${education.id}`}>Location (Optional)</Label>
              <Input
                id={`location-${education.id}`}
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="City, Country"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`startDate-${education.id}`}>Start Date</Label>
              <Input
                id={`startDate-${education.id}`}
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor={`endDate-${education.id}`}>End Date</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`current-${education.id}`}
                    checked={formData.current}
                    onCheckedChange={handleCurrentChange}
                  />
                  <Label htmlFor={`current-${education.id}`} className="text-sm">
                    Current
                  </Label>
                </div>
              </div>
              <Input
                id={`endDate-${education.id}`}
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
            <Label htmlFor={`description-${education.id}`}>Description (Optional)</Label>
            <Textarea
              id={`description-${education.id}`}
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Describe your academic achievements, projects, etc."
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EducationForm: React.FC = () => {
  const { cvData, addEducation, updateEducation, removeEducation, saveCV, isSaving } = useCV();

  const handleAddEducation = () => {
    const newEducation = {
      institution: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    addEducation(newEducation);
  };

  const moveEducation = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const updatedEducations = [...cvData.education];
    const [movedItem] = updatedEducations.splice(fromIndex, 1);
    updatedEducations.splice(toIndex, 0, movedItem);
    
    // Update all educations with new order
    updatedEducations.forEach(edu => updateEducation(edu));
  };

  const handleSave = async () => {
    await saveCV();
  };

  const educationItems = cvData.education || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Education</h3>
        <Button variant="outline" onClick={handleAddEducation}>
          <PlusCircle className="me-2 h-4 w-4" />
          Add Education
        </Button>
      </div>
      
      {educationItems.length === 0 ? (
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <p className="text-muted-foreground">
            No education added yet. Click the button above to add your first education.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {educationItems.map((education, index) => (
            <EducationItem
              key={education.id}
              education={education}
              onUpdate={updateEducation}
              onRemove={removeEducation}
              onMoveUp={index > 0 ? () => moveEducation(index, index - 1) : undefined}
              onMoveDown={index < educationItems.length - 1 ? () => moveEducation(index, index + 1) : undefined}
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
        <Save className="me-2 h-4 w-4" />
        Save All Education
      </Button>
    </div>
  );
};

export default EducationForm;
