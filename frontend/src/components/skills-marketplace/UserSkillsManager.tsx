
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { skillsMarketplaceService } from '@/services/skillsMarketplaceService';
import { useToast } from '@/hooks/use-toast';
import type { UserSkill, Skill, SkillLevel } from '@/types/skillsMarketplace';

export const UserSkillsManager: React.FC = () => {
  const { toast } = useToast();
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  const [formData, setFormData] = useState({
    skill_id: '',
    skill_level: 'intermediate' as SkillLevel,
    years_experience: '0',
    description: '',
    portfolio_links: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [skills, allSkills] = await Promise.all([
        skillsMarketplaceService.getUserSkills(),
        skillsMarketplaceService.getAllSkills()
      ]);
      setUserSkills(skills);
      setAvailableSkills(allSkills);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load skills",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const portfolioLinks = formData.portfolio_links
        ? formData.portfolio_links.split('\n').filter(link => link.trim())
        : [];

      const skillData = {
        skill_id: formData.skill_id,
        skill_level: formData.skill_level,
        years_experience: parseInt(formData.years_experience),
        description: formData.description || undefined,
        portfolio_links: portfolioLinks
      };

      if (editingSkill) {
        await skillsMarketplaceService.updateUserSkill(editingSkill.id, skillData);
        toast({
          title: "Success",
          description: "Skill updated successfully!"
        });
      } else {
        await skillsMarketplaceService.addUserSkill(skillData);
        toast({
          title: "Success",
          description: "Skill added successfully!"
        });
      }

      setShowAddDialog(false);
      setEditingSkill(null);
      setFormData({
        skill_id: '',
        skill_level: 'intermediate',
        years_experience: '0',
        description: '',
        portfolio_links: ''
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save skill",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (skill: UserSkill) => {
    setEditingSkill(skill);
    setFormData({
      skill_id: skill.skill_id,
      skill_level: skill.skill_level,
      years_experience: skill.years_experience.toString(),
      description: skill.description || '',
      portfolio_links: skill.portfolio_links.join('\n')
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (skillId: string) => {
    if (!confirm('Are you sure you want to remove this skill?')) return;

    try {
      await skillsMarketplaceService.deleteUserSkill(skillId);
      toast({
        title: "Success",
        description: "Skill removed successfully!"
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove skill",
        variant: "destructive"
      });
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  const userSkillIds = userSkills.map(us => us.skill_id);
  const availableSkillsToAdd = availableSkills.filter(skill => !userSkillIds.includes(skill.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Skills</h2>
          <p className="text-muted-foreground">Manage your skills and showcase your expertise</p>
        </div>
        <Dialog 
          open={showAddDialog} 
          onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              setEditingSkill(null);
              setFormData({
                skill_id: '',
                skill_level: 'intermediate',
                years_experience: '0',
                description: '',
                portfolio_links: ''
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
              <DialogDescription>
                {editingSkill ? 'Update your skill information' : 'Add a new skill to your profile'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="skill">Skill</Label>
                <Select
                  value={formData.skill_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, skill_id: value }))}
                  disabled={!!editingSkill}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editingSkill ? availableSkills : availableSkillsToAdd).map(skill => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name} ({skill.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="level">Skill Level</Label>
                <Select
                  value={formData.skill_level}
                  onValueChange={(value: SkillLevel) => setFormData(prev => ({ ...prev, skill_level: value }))}
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
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.years_experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, years_experience: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your experience with this skill..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="portfolio">Portfolio Links</Label>
                <Textarea
                  id="portfolio"
                  placeholder="Add relevant portfolio or project links (one per line)"
                  value={formData.portfolio_links}
                  onChange={(e) => setFormData(prev => ({ ...prev, portfolio_links: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingSkill ? 'Update Skill' : 'Add Skill'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {userSkills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No skills added yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding your skills to showcase your expertise
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userSkills.map(userSkill => (
            <Card key={userSkill.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{userSkill.skill?.name}</CardTitle>
                    <CardDescription>{userSkill.skill?.category}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(userSkill)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(userSkill.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getSkillLevelColor(userSkill.skill_level)}>
                      {userSkill.skill_level}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {userSkill.years_experience} {userSkill.years_experience === 1 ? 'year' : 'years'}
                    </span>
                  </div>
                  
                  {userSkill.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {userSkill.description}
                    </p>
                  )}
                  
                  {userSkill.portfolio_links.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Portfolio:</p>
                      <div className="space-y-1">
                        {userSkill.portfolio_links.slice(0, 2).map((link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1 line-clamp-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {link}
                          </a>
                        ))}
                        {userSkill.portfolio_links.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{userSkill.portfolio_links.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
