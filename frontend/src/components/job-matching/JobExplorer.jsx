
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Briefcase, 
  MapPin, 
  Star, 
  StarOff, 
  Share2, 
  Send,
  TrendingUp,
  Calendar,
  Filter,
  Building
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const JobExplorer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    location: 'all',
    jobType: 'all',
    industry: 'all',
    sortBy: 'match'
  });

  // Sample locations and industries for filters
  const locations = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain'];
  const industries = ['Technology', 'Healthcare', 'Education', 'Finance', 'Government', 'Manufacturing', 'Retail'];
  const jobTypes = ['Full-time', 'Part-time', 'Internship', 'Remote', 'Hybrid'];
  
  useEffect(() => {
    fetchJobs();
    if (user) {
      fetchFavorites();
    }
  }, [user]);
  
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Add match score, ranking and format the data
      const formattedJobs = data.map(job => ({
        ...job,
        matchScore: Math.floor(Math.random() * 51) + 50, // Random score between 50-100 for demo
        postedDate: new Date(job.created_at).toLocaleDateString(),
        rankingFactors: {
          skills: Math.floor(Math.random() * 101),
          experience: Math.floor(Math.random() * 101),
          education: Math.floor(Math.random() * 101),
          location: Math.floor(Math.random() * 101)
        }
      }));
      
      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch job listings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFavorites = async () => {
    try {
      // This would be implemented with a real favorites table
      // For demo purposes, we're using local state
      setFavorites([]);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };
  
  const toggleFavorite = (jobId) => {
    if (favorites.includes(jobId)) {
      setFavorites(favorites.filter(id => id !== jobId));
      toast({
        title: 'Removed from favorites',
        description: 'Job has been removed from your favorites',
      });
    } else {
      setFavorites([...favorites, jobId]);
      toast({
        title: 'Added to favorites',
        description: 'Job has been added to your favorites',
      });
    }
  };
  
  const shareJob = (job) => {
    // In a real app, this would open a share dialog
    // For now, just show a toast
    toast({
      title: 'Share job',
      description: `Share "${job.title}" with your parents or advisors`,
    });
  };
  
  const applyForJob = (job) => {
    // In a real app, this would navigate to an application form
    toast({
      title: 'Apply for job',
      description: `You're applying for "${job.title}"`,
    });
  };
  
  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };
  
  const resetFilters = () => {
    setFilters({
      search: '',
      location: 'all',
      jobType: 'all',
      industry: 'all',
      sortBy: 'match'
    });
  };
  
  // Apply filters to jobs
  const filteredJobs = jobs.filter(job => {
    // Search filter
    if (filters.search && !job.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !job.company?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !job.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Location filter
    if (filters.location !== 'all' && job.location !== filters.location) {
      return false;
    }
    
    // Job type filter
    if (filters.jobType !== 'all' && job.employment_type !== filters.jobType) {
      return false;
    }
    
    // Industry filter
    if (filters.industry !== 'all' && !job.description?.toLowerCase().includes(filters.industry.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (filters.sortBy === 'match') {
      return b.matchScore - a.matchScore;
    } else if (filters.sortBy === 'date') {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    return 0;
  });
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="space-y-4 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading career opportunities...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-muted p-4 rounded-lg">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, skills, or companies..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-1.5">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <div className="p-2 space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Location</p>
                    <Select 
                      value={filters.location} 
                      onValueChange={(value) => handleFilterChange('location', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All locations</SelectItem>
                        {locations.map(location => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Job Type</p>
                    <Select 
                      value={filters.jobType} 
                      onValueChange={(value) => handleFilterChange('jobType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All job types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All job types</SelectItem>
                        {jobTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Industry</p>
                    <Select 
                      value={filters.industry} 
                      onValueChange={(value) => handleFilterChange('industry', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All industries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All industries</SelectItem>
                        {industries.map(industry => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Sort By</p>
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(value) => handleFilterChange('sortBy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Best match" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match">Best match</SelectItem>
                        <SelectItem value="date">Most recent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button className="w-full mt-2" variant="outline" onClick={resetFilters}>
                    Reset filters
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Select 
              value={filters.sortBy} 
              onValueChange={(value) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best match</SelectItem>
                <SelectItem value="date">Most recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{sortedJobs.length} Matching Opportunities</h2>
        </div>
        
        {sortedJobs.length === 0 ? (
          <div className="text-center p-12 border rounded-lg bg-muted/30">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No jobs found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search criteria</p>
            <Button onClick={resetFilters} variant="outline" className="mt-4">
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedJobs.map((job) => (
              <Card key={job.id} className="overflow-hidden">
                <div className="md:flex">
                  <div className="flex-1">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-1.5">
                            {job.title}
                            {job.matchScore >= 90 && (
                              <Badge variant="default" className="ml-2">Top Match</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <Building className="h-3.5 w-3.5 mr-1" />
                            {job.company || 'Unknown Company'}
                            {job.location && (
                              <>
                                <Separator orientation="vertical" className="mx-2 h-3" />
                                <MapPin className="h-3.5 w-3.5 mr-1" />
                                {job.location}
                              </>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(job.id)}
                            title={favorites.includes(job.id) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {favorites.includes(job.id) ? (
                              <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => shareJob(job)}
                            title="Share with parents or advisors"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm line-clamp-2 mb-2">{job.description}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {job.employment_type && (
                              <Badge variant="outline">{job.employment_type}</Badge>
                            )}
                            {job.work_mode && (
                              <Badge variant="outline">{job.work_mode}</Badge>
                            )}
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {job.postedDate}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center">
                              <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-primary" />
                              Match Score
                            </span>
                            <span className="text-sm font-bold">{job.matchScore}%</span>
                          </div>
                          <Progress value={job.matchScore} className="h-2" />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Skills</span>
                                <span>{job.rankingFactors.skills}%</span>
                              </div>
                              <Progress value={job.rankingFactors.skills} className="h-1.5 mt-0.5" />
                            </div>
                            <div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Experience</span>
                                <span>{job.rankingFactors.experience}%</span>
                              </div>
                              <Progress value={job.rankingFactors.experience} className="h-1.5 mt-0.5" />
                            </div>
                            <div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Education</span>
                                <span>{job.rankingFactors.education}%</span>
                              </div>
                              <Progress value={job.rankingFactors.education} className="h-1.5 mt-0.5" />
                            </div>
                            <div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Location</span>
                                <span>{job.rankingFactors.location}%</span>
                              </div>
                              <Progress value={job.rankingFactors.location} className="h-1.5 mt-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => navigate(`/job-descriptions/${job.id}`)}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => applyForJob(job)}
                        className="gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Apply Now
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobExplorer;
