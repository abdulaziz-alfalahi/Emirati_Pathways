
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Experience } from '../types';
import ExperienceItem from './ExperienceItem';
import { EmptyState } from '@/components/ui/empty-state';

interface ResumeExperienceSectionProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

const ResumeExperienceSection: React.FC<ResumeExperienceSectionProps> = ({
  data,
  onChange
}) => {
  const addExperience = () => {
    const newExperience: Experience = {
      id: uuidv4(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    onChange([...data, newExperience]);
  };

  const updateExperience = (updatedExperience: Experience) => {
    const updatedData = data.map(exp => 
      exp.id === updatedExperience.id ? updatedExperience : exp
    );
    onChange(updatedData);
  };

  const removeExperience = (id: string) => {
    const updatedData = data.filter(exp => exp.id !== id);
    onChange(updatedData);
  };

  const moveExperience = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const updatedData = [...data];
    const [movedItem] = updatedData.splice(fromIndex, 1);
    updatedData.splice(toIndex, 0, movedItem);
    onChange(updatedData);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {data.length === 0 ? (
            <EmptyState
              title="No work experience added"
              description="Add your work history to showcase your professional experience."
              icon="briefcase"
            />
          ) : (
            data.map((experience, index) => (
              <ExperienceItem
                key={experience.id}
                experience={experience}
                onChange={updateExperience}
                onRemove={removeExperience}
                onMoveUp={index > 0 ? () => moveExperience(index, index - 1) : undefined}
                onMoveDown={index < data.length - 1 ? () => moveExperience(index, index + 1) : undefined}
              />
            ))
          )}
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addExperience}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Work Experience
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeExperienceSection;
