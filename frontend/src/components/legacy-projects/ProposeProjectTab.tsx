
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { legacyProjectService } from '@/services/legacyProjectService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export const ProposeProjectTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    focus_area: '',
    funding_goal: '',
    location: '',
    start_date: '',
    expected_completion_date: '',
    requirements: '',
    skills_needed: '',
    impact_metrics: '',
    contact_email: '',
    website_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to propose a project",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const projectData = {
        title: formData.title,
        description: formData.description,
        focus_area: formData.focus_area as any,
        initiator_id: user.id,
        funding_goal: formData.funding_goal ? parseFloat(formData.funding_goal) : undefined,
        funding_currency: 'AED',
        location: formData.location || undefined,
        project_status: 'proposal' as const,
        start_date: formData.start_date || undefined,
        expected_completion_date: formData.expected_completion_date || undefined,
        requirements: formData.requirements || undefined,
        skills_needed: formData.skills_needed ? formData.skills_needed.split(',').map(s => s.trim()) : undefined,
        impact_metrics: formData.impact_metrics || undefined,
        contact_email: formData.contact_email || undefined,
        website_url: formData.website_url || undefined,
        is_featured: false
      };

      await legacyProjectService.createProject(projectData);
      
      toast({
        title: "Project Proposed Successfully",
        description: "Your project has been submitted for review. Thank you for your initiative!",
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        focus_area: '',
        funding_goal: '',
        location: '',
        start_date: '',
        expected_completion_date: '',
        requirements: '',
        skills_needed: '',
        impact_metrics: '',
        contact_email: '',
        website_url: ''
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to submit project proposal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Please sign in to propose a project.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Propose a Legacy Project</CardTitle>
        <p className="text-gray-600">
          Share your vision for creating lasting positive impact. All proposals are reviewed before being published.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter project title"
                required
              />
            </div>

            <div>
              <Label htmlFor="focus_area">Focus Area *</Label>
              <Select
                value={formData.focus_area}
                onValueChange={(value) => setFormData({ ...formData, focus_area: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select focus area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="culture">Culture</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="arts">Arts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Project Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your project, its goals, and expected impact..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="funding_goal">Funding Goal (AED)</Label>
              <Input
                id="funding_goal"
                type="number"
                value={formData.funding_goal}
                onChange={(e) => setFormData({ ...formData, funding_goal: e.target.value })}
                placeholder="Enter funding goal"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Project location"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Planned Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="expected_completion_date">Expected Completion</Label>
              <Input
                id="expected_completion_date"
                type="date"
                value={formData.expected_completion_date}
                onChange={(e) => setFormData({ ...formData, expected_completion_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="skills_needed">Skills Needed (comma-separated)</Label>
            <Input
              id="skills_needed"
              value={formData.skills_needed}
              onChange={(e) => setFormData({ ...formData, skills_needed: e.target.value })}
              placeholder="e.g., project management, web development, marketing"
            />
          </div>

          <div>
            <Label htmlFor="requirements">Requirements & Resources Needed</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="Describe what resources, partnerships, or requirements are needed..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="impact_metrics">Expected Impact Metrics</Label>
            <Textarea
              id="impact_metrics"
              value={formData.impact_metrics}
              onChange={(e) => setFormData({ ...formData, impact_metrics: e.target.value })}
              placeholder="How will you measure the project's success and impact?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="Project contact email"
              />
            </div>

            <div>
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="Project website (optional)"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            Submit Project Proposal
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
