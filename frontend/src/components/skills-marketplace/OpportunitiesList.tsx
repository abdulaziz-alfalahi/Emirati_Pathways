
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar,
  Filter,
  Send
} from 'lucide-react';
import { skillsMarketplaceService } from '@/services/skillsMarketplaceService';
import { useToast } from '@/hooks/use-toast';
import type { SkillOpportunity, SkillFilters } from '@/types/skillsMarketplace';

export const OpportunitiesList: React.FC = () => {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<SkillOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<SkillOpportunity | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [filters, setFilters] = useState<SkillFilters>({});
  const [applicationData, setApplicationData] = useState({
    cover_letter: '',
    proposed_timeline: '',
    proposed_budget: '',
    portfolio_links: ''
  });

  useEffect(() => {
    loadOpportunities();
  }, [filters]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const data = await skillsMarketplaceService.getOpportunities(filters);
      setOpportunities(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load opportunities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedOpportunity) return;

    try {
      const portfolioLinks = applicationData.portfolio_links
        ? applicationData.portfolio_links.split('\n').filter(link => link.trim())
        : [];

      await skillsMarketplaceService.submitApplication({
        opportunity_id: selectedOpportunity.id,
        cover_letter: applicationData.cover_letter,
        proposed_timeline: applicationData.proposed_timeline,
        proposed_budget: applicationData.proposed_budget ? parseFloat(applicationData.proposed_budget) : undefined,
        portfolio_links: portfolioLinks
      });

      toast({
        title: "Success",
        description: "Application submitted successfully!"
      });

      setShowApplicationDialog(false);
      setApplicationData({
        cover_letter: '',
        proposed_timeline: '',
        proposed_budget: '',
        portfolio_links: ''
      });
      setSelectedOpportunity(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive"
      });
    }
  };

  const getOpportunityTypeColor = (type: string) => {
    switch (type) {
      case 'project_based': return 'bg-blue-100 text-blue-800';
      case 'skill_exchange': return 'bg-green-100 text-green-800';
      case 'consultation': return 'bg-purple-100 text-purple-800';
      case 'mentoring': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter
              </CardTitle>
              <CardDescription>
                Find opportunities that match your skills and interests
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 me-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search opportunities..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="flex-1"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <Select
                value={filters.opportunity_type || ''}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  opportunity_type: value as any || undefined 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="project_based">Project Based</SelectItem>
                  <SelectItem value="skill_exchange">Skill Exchange</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="mentoring">Mentoring</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.skill_level || ''}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  skill_level: value as any || undefined 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Skill Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.is_remote?.toString() || ''}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  is_remote: value === 'true' ? true : value === 'false' ? false : undefined 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  <SelectItem value="true">Remote</SelectItem>
                  <SelectItem value="false">On-site</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  placeholder="Min budget"
                  type="number"
                  value={filters.budget_min || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    budget_min: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="flex-1"
                />
                <Input
                  placeholder="Max budget"
                  type="number"
                  value={filters.budget_max || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    budget_max: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opportunities List */}
      <div className="space-y-4">
        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
              <p className="text-muted-foreground text-center">
                Try adjusting your filters or search terms
              </p>
            </CardContent>
          </Card>
        ) : (
          opportunities.map(opportunity => (
            <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{opportunity.title}</h3>
                      <Badge className={getOpportunityTypeColor(opportunity.opportunity_type)}>
                        {opportunity.opportunity_type.replace('_', ' ')}
                      </Badge>
                      <Badge className={getSkillLevelColor(opportunity.skill_level_required)}>
                        {opportunity.skill_level_required}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {opportunity.description}
                    </p>
                  </div>
                  <Dialog 
                    open={showApplicationDialog && selectedOpportunity?.id === opportunity.id}
                    onOpenChange={(open) => {
                      setShowApplicationDialog(open);
                      if (!open) {
                        setSelectedOpportunity(null);
                        setApplicationData({
                          cover_letter: '',
                          proposed_timeline: '',
                          proposed_budget: '',
                          portfolio_links: ''
                        });
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setSelectedOpportunity(opportunity)}
                        className="ms-4"
                      >
                        <Send className="h-4 w-4 me-2" />
                        Apply
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Apply for: {opportunity.title}</DialogTitle>
                        <DialogDescription>
                          Submit your application with a cover letter and proposal
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cover_letter">Cover Letter</Label>
                          <Textarea
                            id="cover_letter"
                            placeholder="Tell them why you're the right person for this opportunity..."
                            value={applicationData.cover_letter}
                            onChange={(e) => setApplicationData(prev => ({ ...prev, cover_letter: e.target.value }))}
                            rows={4}
                          />
                        </div>
                        <div>
                          <Label htmlFor="timeline">Proposed Timeline</Label>
                          <Input
                            id="timeline"
                            placeholder="e.g., 2 weeks, 1 month, etc."
                            value={applicationData.proposed_timeline}
                            onChange={(e) => setApplicationData(prev => ({ ...prev, proposed_timeline: e.target.value }))}
                          />
                        </div>
                        {opportunity.opportunity_type === 'project_based' && (
                          <div>
                            <Label htmlFor="budget">Proposed Budget (AED)</Label>
                            <Input
                              id="budget"
                              type="number"
                              placeholder="Enter your proposed budget"
                              value={applicationData.proposed_budget}
                              onChange={(e) => setApplicationData(prev => ({ ...prev, proposed_budget: e.target.value }))}
                            />
                          </div>
                        )}
                        <div>
                          <Label htmlFor="portfolio">Portfolio Links</Label>
                          <Textarea
                            id="portfolio"
                            placeholder="Add relevant portfolio links (one per line)"
                            value={applicationData.portfolio_links}
                            onChange={(e) => setApplicationData(prev => ({ ...prev, portfolio_links: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowApplicationDialog(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleApply} className="flex-1">
                            Submit Application
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {opportunity.skills?.map(skill => (
                    <Badge key={skill.id} variant="outline">
                      {skill.name}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {opportunity.is_remote ? 'Remote' : opportunity.location || 'On-site'}
                  </div>
                  {opportunity.duration_hours && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {opportunity.duration_hours} hours
                    </div>
                  )}
                  {opportunity.budget_amount && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {opportunity.budget_amount} {opportunity.budget_currency}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {opportunity.application_count || 0}/{opportunity.max_applicants} applied
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Posted by {opportunity.creator?.full_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(opportunity.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
