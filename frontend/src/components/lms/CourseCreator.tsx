
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { lmsService } from '@/services/lms';
import { useToast } from '@/hooks/use-toast';
import type { CreateCourseData } from '@/types/lms';

export const CourseCreator: React.FC = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateCourseData>({
    title: '',
    description: '',
    category: '',
    difficulty_level: 'beginner',
    duration_hours: 0,
    price: 0,
    currency: 'AED',
    prerequisites: [],
    learning_objectives: [],
    tags: []
  });
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newTag, setNewTag] = useState('');

  const categories = [
    'Technical',
    'Professional',
    'Leadership',
    'Language',
    'Business',
    'Design',
    'Marketing'
  ];

  const handleInputChange = (field: keyof CreateCourseData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addArrayItem = (field: 'prerequisites' | 'learning_objectives' | 'tags', value: string) => {
    if (!value.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()]
    }));
    
    // Clear the input
    if (field === 'prerequisites') setNewPrerequisite('');
    if (field === 'learning_objectives') setNewObjective('');
    if (field === 'tags') setNewTag('');
  };

  const removeArrayItem = (field: 'prerequisites' | 'learning_objectives' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in the required fields (Title and Category)",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      await lmsService.createCourse(formData);
      
      toast({
        title: "Course Created",
        description: "Your course has been created successfully!"
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        difficulty_level: 'beginner',
        duration_hours: 0,
        price: 0,
        currency: 'AED',
        prerequisites: [],
        learning_objectives: [],
        tags: []
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Course</CardTitle>
        <CardDescription>
          Create comprehensive courses with modules, lessons, and assessments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter course title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what students will learn"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select onValueChange={(value) => handleInputChange('difficulty_level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Hours)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_hours}
                onChange={(e) => handleInputChange('duration_hours', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price (AED)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Prerequisites */}
          <div className="space-y-2">
            <Label>Prerequisites</Label>
            <div className="flex gap-2">
              <Input
                value={newPrerequisite}
                onChange={(e) => setNewPrerequisite(e.target.value)}
                placeholder="Add prerequisite"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('prerequisites', newPrerequisite))}
              />
              <Button type="button" onClick={() => addArrayItem('prerequisites', newPrerequisite)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.prerequisites?.map((prereq, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {prereq}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeArrayItem('prerequisites', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="space-y-2">
            <Label>Learning Objectives</Label>
            <div className="flex gap-2">
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Add learning objective"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('learning_objectives', newObjective))}
              />
              <Button type="button" onClick={() => addArrayItem('learning_objectives', newObjective)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.learning_objectives?.map((objective, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {objective}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeArrayItem('learning_objectives', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? 'Creating Course...' : 'Create Course'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
