import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, Calendar, MessageCircle, Target, Clock, User, Heart, BarChart3, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mentorshipService } from '@/services/mentorshipService';
import { MatchVisualization, MatchInsights } from '@/components/mentorship/matching';
import type { MatchSuggestion, MenteePreferences, Mentor } from '@/types/mentorship';
import { useMatchReEvaluation } from '@/hooks/useMatchReEvaluation';
import { MatchReEvaluationNotification } from '@/components/mentorship/matching/MatchReEvaluationNotification';

const EXPERTISE_OPTIONS = [
  'Software Development', 'Data Science', 'Product Management', 'Digital Marketing',
  'UX/UI Design', 'Business Strategy', 'Finance', 'Healthcare', 'Education',
  'Engineering', 'Sales', 'Human Resources', 'Project Management', 'Consulting'
];

const CAREER_GOALS = [
  'Career Transition', 'Skill Development', 'Leadership Growth', 'Entrepreneurship',
  'Work-Life Balance', 'Networking', 'Interview Preparation', 'Promotion Guidance'
];

export const MentorshipMatching: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSuggestion[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [requestGoals, setRequestGoals] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchSuggestion | null>(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  
  const [preferences, setPreferences] = useState<MenteePreferences>({
    desired_expertise: [],
    career_goals: [],
    preferred_communication: [],
    availability: {
      days: [],
      hours: [],
      timezone: 'UTC+4 (UAE)'
    },
    experience_level: 'intermediate'
  });

  const [filters, setFilters] = useState({
    search: '',
    expertise: '',
    min_rating: '',
    experience_level: ''
  });

  // Get current user ID for re-evaluation
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initialize re-evaluation hook
  const {
    isReEvaluating,
    needsReEvaluation,
    lastEvaluationTime,
    triggerReEvaluation,
    scheduleReEvaluation
  } = useMatchReEvaluation(currentUserId, preferences);

  useEffect(() => {
    // Get current user ID
    const getCurrentUser = async () => {
      // TODO: Connect to Flask API - const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (preferences.desired_expertise.length > 0) {
      findMatches();
    }
  }, [preferences]);

  const findMatches = async () => {
    setLoading(true);
    try {
      const suggestions = await mentorshipService.getMatchSuggestions(preferences);
      setMatchSuggestions(suggestions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find mentor matches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle re-evaluation trigger
  const handleReEvaluation = async () => {
    const newSuggestions = await triggerReEvaluation();
    if (newSuggestions) {
      setMatchSuggestions(newSuggestions);
    }
  };

  const handleExpertiseChange = (expertise: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      desired_expertise: checked
        ? [...prev.desired_expertise, expertise]
        : prev.desired_expertise.filter(e => e !== expertise)
    }));
  };

  const handleCareerGoalChange = (goal: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      career_goals: checked
        ? [...prev.career_goals, goal]
        : prev.career_goals.filter(g => g !== goal)
    }));
  };

  const handleRequestMentorship = async () => {
    if (!selectedMentor || !requestGoals.trim()) {
      toast({
        title: "Error",
        description: "Please provide your mentorship goals",
        variant: "destructive"
      });
      return;
    }

    try {
      await mentorshipService.requestMentorship(selectedMentor.id, requestGoals);
      toast({
        title: "Success",
        description: "Mentorship request sent successfully!"
      });
      setShowRequestDialog(false);
      setRequestGoals('');
      setSelectedMentor(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send mentorship request",
        variant: "destructive"
      });
    }
  };

  const filteredSuggestions = matchSuggestions.filter(suggestion => {
    const mentor = suggestion.mentor;
    
    if (filters.search && !mentor.bio?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    if (filters.expertise && !mentor.expertise.includes(filters.expertise)) {
      return false;
    }
    
    if (filters.min_rating && mentor.rating && mentor.rating < parseFloat(filters.min_rating)) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-pink-500" />
          Find Your Perfect Mentor
        </h1>
        <p className="text-muted-foreground mt-2">
          Get matched with experienced mentors based on your career goals and learning preferences
        </p>
      </div>

      {/* Re-evaluation Notification */}
      <div className="mb-6">
        <MatchReEvaluationNotification
          needsReEvaluation={needsReEvaluation}
          isReEvaluating={isReEvaluating}
          lastEvaluationTime={lastEvaluationTime}
          onTriggerReEvaluation={handleReEvaluation}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preferences Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Preferences
              </CardTitle>
              <CardDescription>
                Tell us what you're looking for in a mentor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Desired Expertise */}
              <div>
                <Label className="text-base font-medium mb-3 block">Areas of Interest</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {EXPERTISE_OPTIONS.map(expertise => (
                    <div key={expertise} className="flex items-center space-x-2">
                      <Checkbox
                        id={`pref-${expertise}`}
                        checked={preferences.desired_expertise.includes(expertise)}
                        onCheckedChange={(checked) => 
                          handleExpertiseChange(expertise, checked as boolean)
                        }
                      />
                      <Label htmlFor={`pref-${expertise}`} className="text-sm">
                        {expertise}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Career Goals */}
              <div>
                <Label className="text-base font-medium mb-3 block">Career Goals</Label>
                <div className="space-y-2">
                  {CAREER_GOALS.map(goal => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={`goal-${goal}`}
                        checked={preferences.career_goals.includes(goal)}
                        onCheckedChange={(checked) => 
                          handleCareerGoalChange(goal, checked as boolean)
                        }
                      />
                      <Label htmlFor={`goal-${goal}`} className="text-sm">
                        {goal}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <Label htmlFor="experience-level">Your Experience Level</Label>
                <Select 
                  value={preferences.experience_level} 
                  onValueChange={(value: any) => setPreferences(prev => ({ 
                    ...prev, 
                    experience_level: value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={findMatches} 
                disabled={loading || preferences.desired_expertise.length === 0}
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Finding Matches...' : 'Find Mentors'}
              </Button>
            </CardContent>
          </Card>

          {/* New Insights Panel */}
          {matchSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Match Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MatchInsights suggestions={filteredSuggestions} />
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search mentor bios..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="expertise-filter">Expertise</Label>
                <Select value={filters.expertise} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, expertise: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Any expertise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any expertise</SelectItem>
                    {EXPERTISE_OPTIONS.map(expertise => (
                      <SelectItem key={expertise} value={expertise}>
                        {expertise}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rating-filter">Minimum Rating</Label>
                <Select value={filters.min_rating} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, min_rating: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any rating</SelectItem>
                    <SelectItem value="4.5">4.5+ stars</SelectItem>
                    <SelectItem value="4.0">4.0+ stars</SelectItem>
                    <SelectItem value="3.5">3.5+ stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {loading || isReEvaluating ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>
                    {isReEvaluating ? 'Updating your matches...' : 'Finding your perfect mentors...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : filteredSuggestions.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No mentors found</h3>
                  <p className="text-muted-foreground">
                    {preferences.desired_expertise.length === 0 
                      ? "Select your areas of interest to find mentors"
                      : "Try adjusting your preferences or filters"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {filteredSuggestions.length} Mentor{filteredSuggestions.length !== 1 ? 's' : ''} Found
                </h2>
              </div>

              {filteredSuggestions.map((suggestion) => (
                <Card key={suggestion.mentor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-lg">
                          {suggestion.mentor.user_id.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">Expert Mentor</h3>
                              {suggestion.mentor.is_verified && (
                                <Badge variant="secondary">Verified</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {suggestion.mentor.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">
                                    {suggestion.mentor.rating.toFixed(1)}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    ({suggestion.mentor.review_count} reviews)
                                  </span>
                                </div>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {suggestion.mentor.years_experience}+ years experience
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {suggestion.compatibility_score}%
                            </div>
                            <div className="text-sm text-muted-foreground">Match</div>
                          </div>
                        </div>

                        {/* Expertise */}
                        <div className="flex flex-wrap gap-2">
                          {suggestion.mentor.expertise.slice(0, 4).map(skill => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {suggestion.mentor.expertise.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{suggestion.mentor.expertise.length - 4} more
                            </Badge>
                          )}
                        </div>

                        {/* Bio */}
                        {suggestion.mentor.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {suggestion.mentor.bio}
                          </p>
                        )}

                        {/* Match Reasons */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Why you're a great match:</div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {suggestion.match_reasons.slice(0, 3).map((reason, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Enhanced Match Scores with Progress Bars */}
                        <div className="grid grid-cols-3 gap-4 py-3 border-t">
                          <div className="text-center">
                            <div className="text-sm font-medium mb-1">Expertise</div>
                            <Progress value={suggestion.expertise_match} className="h-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                              {suggestion.expertise_match}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium mb-1">Schedule</div>
                            <Progress value={suggestion.availability_match} className="h-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                              {suggestion.availability_match}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium mb-1">Experience</div>
                            <Progress value={suggestion.experience_compatibility} className="h-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                              {suggestion.experience_compatibility}%
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setSelectedMatch(suggestion);
                              setShowMatchDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Match Details
                          </Button>
                          
                          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                onClick={() => setSelectedMentor(suggestion.mentor)}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Request Mentorship
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Request Mentorship</DialogTitle>
                                <DialogDescription>
                                  Tell this mentor about your goals and why you'd like their guidance
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="goals">Your Goals & Expectations</Label>
                                  <Textarea
                                    id="goals"
                                    placeholder="Describe what you hope to achieve through this mentorship..."
                                    value={requestGoals}
                                    onChange={(e) => setRequestGoals(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setShowRequestDialog(false)}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={handleRequestMentorship} className="flex-1">
                                    Send Request
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button variant="outline">
                            <Calendar className="h-4 w-4 mr-2" />
                            View Schedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Match Details Dialog */}
      <Dialog open={showMatchDetails} onOpenChange={setShowMatchDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detailed Match Analysis</DialogTitle>
            <DialogDescription>
              Comprehensive breakdown of why this mentor matches your preferences
            </DialogDescription>
          </DialogHeader>
          
          {selectedMatch && (
            <Tabs defaultValue="visualization" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="visualization">Match Visualization</TabsTrigger>
                <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visualization" className="mt-6">
                <MatchVisualization 
                  suggestion={selectedMatch} 
                  showDetailed={false}
                />
              </TabsContent>
              
              <TabsContent value="detailed" className="mt-6">
                <MatchVisualization 
                  suggestion={selectedMatch} 
                  showDetailed={true}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
