
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { skillsMarketplaceService } from '@/services/skillsMarketplaceService';
import { useToast } from '@/hooks/use-toast';
import type { Skill, OpportunityType, SkillLevel } from '@/types/skillsMarketplace';

interface CreateOpportunityDialogProps {
  children: React.ReactNode;
}

export const CreateOpportunityDialog: React.FC<CreateOpportunityDialogProps> = ({ children }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsByCategory, setSkillsByCategory] = useState<Record<string, Skill[]>>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    opportunity_type: 'project_based' as OpportunityType,
    required_skills: [] as string[],
    skill_level_required: 'intermediate' as SkillLevel,
    duration_hours: '',
    budget_amount: '',
    budget_currency: 'AED',
    location: '',
    is_remote: true,
    deadline: '',
    max_applicants: '5'
  });

  useEffect(() => {
    if (open) {
      loadSkills();
    }
  }, [open]);

  const loadSkills = async () => {
    try {
      const [allSkills, categorizedSkills] = await Promise.all([
        skillsMarketplaceService.getAllSkills(),
        skillsMarketplaceService.getSkillsByCategory()
      ]);
      setSkills(allSkills);
      setSkillsByCategory(categorizedSkills);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load skills",
        variant: "destructive"
      });
    }
  };

  const handleSkillToggle = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.includes(skillId)
        ? prev.required_skills.filter(id => id !== skillId)
        : [...prev.required_skills, skillId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.required_skills.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one required skill",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await skillsMarketplaceService.createOpportunity({
        title: formData.title,
        description: formData.description,
        opportunity_type: formData.opportunity_type,
        required_skills: formData.required_skills,
        skill_level_required: formData.skill_level_required,
        duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : undefined,
        budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : undefined,
        budget_currency: formData.budget_currency,
        location: formData.location || undefined,
        is_remote: formData.is_remote,
        deadline: formData.deadline || undefined,
        max_applicants: parseInt(formData.max_applicants)
      });

      toast({
        title: "Success",
        description: "Opportunity created successfully!"
      });

      setOpen(false);
      setFormData({
        title: '',
        description: '',
        opportunity_type: 'project_based',
        required_skills: [],
        skill_level_required: 'intermediate',
        duration_hours: '',
        budget_amount: '',
        budget_currency: 'AED',
        location: '',
        is_remote: true,
        deadline: '',
        max_applicants: '5'
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create opportunity",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedSkills = skills.filter(skill => formData.required_skills.includes(skill.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Opportunity</DialogTitle>
          <DialogDescription>
            Post a new opportunity for collaboration, skill exchange, or project work
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Need React Developer for E-commerce App"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you need, project requirements, and expectations..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Opportunity Type</Label>
              <Select
                value={formData.opportunity_type}
                onValueChange={(value: OpportunityType) => setFormData(prev => ({ ...prev, opportunity_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project_based">Project Based</SelectItem>
                  <SelectItem value="skill_exchange">Skill Exchange</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="mentoring">Mentoring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="skill_level">Required Skill Level</Label>
              <Select
                value={formData.skill_level_required}
                onValueChange={(value: SkillLevel) => setFormData(prev => ({ ...prev, skill_level_required: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="e.g., 40"
                value={formData.duration_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="budget">Budget (AED)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="e.g., 5000"
                value={formData.budget_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_amount: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="max_applicants">Max Applicants</Label>
              <Input
                id="max_applicants"
                type="number"
                min="1"
                max="20"
                value={formData.max_applicants}
                onChange={(e) => setFormData(prev => ({ ...prev, max_applicants: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="deadline">Application Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_remote"
                checked={formData.is_remote}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_remote: checked as boolean }))}
              />
              <Label htmlFor="is_remote">This is a remote opportunity</Label>
            </div>

            {!formData.is_remote && (
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Dubai, UAE"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Required Skills</Label>
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedSkills.map(skill => (
                  <Badge key={skill.id} variant="secondary" className="px-3 py-1">
                    {skill.name}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2"
                      onClick={() => handleSkillToggle(skill.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="max-h-48 overflow-y-auto border rounded-lg p-4">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category} className="mb-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {categorySkills.map(skill => (
                      <div key={skill.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={skill.id}
                          checked={formData.required_skills.includes(skill.id)}
                          onCheckedChange={() => handleSkillToggle(skill.id)}
                        />
                        <Label htmlFor={skill.id} className="text-sm">{skill.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Opportunity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
