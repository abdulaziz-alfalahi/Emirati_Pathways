
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from '@/components/ui/card';
import { Education } from '../types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface ResumeEducationSectionProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

const ResumeEducationSection: React.FC<ResumeEducationSectionProps> = ({
  data,
  onChange
}) => {
  const addEducation = () => {
    const newEducation: Education = {
      id: uuidv4(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false
    };
    onChange([...data, newEducation]);
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const updatedData = [...data];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value
    };
    onChange(updatedData);
  };

  const removeEducation = (index: number) => {
    const updatedData = [...data];
    updatedData.splice(index, 1);
    onChange(updatedData);
  };

  const handleCurrentChange = (index: number, checked: boolean) => {
    const updatedData = [...data];
    updatedData[index] = {
      ...updatedData[index],
      current: checked,
      endDate: checked ? null : updatedData[index].endDate
    };
    onChange(updatedData);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Education</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addEducation}
          >
            <Plus size={16} className="mr-1" /> Add Education
          </Button>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No education entries yet. Click "Add Education" to add your educational background.
          </div>
        ) : (
          <div className="space-y-6">
            {data.map((education, index) => (
              <div key={education.id} className="p-4 border rounded-md relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                  onClick={() => removeEducation(index)}
                >
                  <Trash2 size={16} />
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`institution-${index}`}>Institution</Label>
                    <Input
                      id={`institution-${index}`}
                      value={education.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      placeholder="University or School Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`location-${index}`}>Location (Optional)</Label>
                    <Input
                      id={`location-${index}`}
                      value={education.location || ''}
                      onChange={(e) => updateEducation(index, 'location', e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`degree-${index}`}>Degree</Label>
                    <Input
                      id={`degree-${index}`}
                      value={education.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      placeholder="Bachelor's, Master's, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor={`field-${index}`}>Field of Study</Label>
                    <Input
                      id={`field-${index}`}
                      value={education.field}
                      onChange={(e) => updateEducation(index, 'field', e.target.value)}
                      placeholder="Computer Science, Business, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`startDate-${index}`}>Start Date</Label>
                    <Input
                      id={`startDate-${index}`}
                      value={education.startDate}
                      onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                      placeholder="MM/YYYY"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`endDate-${index}`}>End Date</Label>
                    <Input
                      id={`endDate-${index}`}
                      value={education.endDate || ''}
                      onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                      placeholder="MM/YYYY"
                      disabled={education.current}
                    />
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <Checkbox
                    id={`current-${index}`}
                    checked={education.current || false}
                    onCheckedChange={(checked) => handleCurrentChange(index, checked === true)}
                  />
                  <Label htmlFor={`current-${index}`} className="ml-2">
                    Currently studying here
                  </Label>
                </div>

                <div>
                  <Label htmlFor={`description-${index}`}>Description (Optional)</Label>
                  <Textarea
                    id={`description-${index}`}
                    value={education.description || ''}
                    onChange={(e) => updateEducation(index, 'description', e.target.value)}
                    placeholder="Relevant coursework, achievements, activities, etc."
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeEducationSection;
