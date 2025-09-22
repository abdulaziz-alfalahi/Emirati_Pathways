
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Experience } from '../types';

interface ExperienceItemProps {
  experience: Experience;
  onChange: (experience: Experience) => void;
  onRemove: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const ExperienceItem: React.FC<ExperienceItemProps> = ({
  experience,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown
}) => {
  const handleChange = (field: keyof Experience, value: string | boolean) => {
    onChange({
      ...experience,
      [field]: value
    });
  };

  const handleCurrentChange = (checked: boolean) => {
    onChange({
      ...experience,
      current: checked,
      endDate: checked ? '' : experience.endDate
    });
  };

  return (
    <Card className="relative">
      <CardContent className="pt-6">
        <div className="absolute right-4 top-4 flex space-x-2">
          {onMoveUp && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onMoveUp}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
          {onMoveDown && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onMoveDown}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onRemove(experience.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`company-${experience.id}`}>Company</Label>
            <Input
              id={`company-${experience.id}`}
              value={experience.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="Company name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`position-${experience.id}`}>Position</Label>
            <Input
              id={`position-${experience.id}`}
              value={experience.position}
              onChange={(e) => handleChange('position', e.target.value)}
              placeholder="Job title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`location-${experience.id}`}>Location</Label>
            <Input
              id={`location-${experience.id}`}
              value={experience.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="City, Country"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`startDate-${experience.id}`}>Start Date</Label>
              <Input
                id={`startDate-${experience.id}`}
                value={experience.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                placeholder="MM/YYYY"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`endDate-${experience.id}`}>End Date</Label>
              <Input
                id={`endDate-${experience.id}`}
                value={experience.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                placeholder="MM/YYYY"
                disabled={experience.current}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`current-${experience.id}`}
              checked={experience.current}
              onCheckedChange={handleCurrentChange}
            />
            <Label htmlFor={`current-${experience.id}`}>
              I currently work here
            </Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`description-${experience.id}`}>Description</Label>
            <Textarea
              id={`description-${experience.id}`}
              value={experience.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your responsibilities and achievements"
              rows={4}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperienceItem;
