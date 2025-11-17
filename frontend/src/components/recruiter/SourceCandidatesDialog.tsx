import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Briefcase, GraduationCap, Users, Mail, Phone, ExternalLink } from 'lucide-react';

interface SourceCandidatesDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  current_position?: string;
  experience_years?: number;
  education?: string;
  skills?: string[];
}

const SourceCandidatesDialog: React.FC<SourceCandidatesDialogProps> = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setSearched(true);

      // Get token - check both possible storage keys
      // authService stores it as 'access_token', but some code might use 'accessToken'
      let token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
      
      if (!token) {
        alert('You must be logged in to search candidates. Please log in and try again.');
        setLoading(false);
        return;
      }
      
      // Validate JWT token format (should have 3 parts separated by dots)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        // Try the other key if current token is invalid
        const otherToken = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
        if (otherToken && otherToken !== token) {
          const otherParts = otherToken.split('.');
          if (otherParts.length === 3) {
            token = otherToken;
            console.log('Using alternate token key');
          } else {
            alert('Your session token is invalid. Please log out and log back in.');
            console.error('Invalid JWT token format. Expected 3 parts, got:', tokenParts.length);
            setLoading(false);
            return;
          }
        } else {
          alert('Your session token is invalid. Please log out and log back in.');
          console.error('Invalid JWT token format. Expected 3 parts, got:', tokenParts.length);
          setLoading(false);
          return;
        }
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (location) params.append('preferred_location', location);
      if (minExperience) params.append('min_experience', minExperience);
      if (skills) params.append('skills', skills);

      const response = await fetch(
        `http://localhost:5003/api/hr/candidates/search?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        // Try to refresh the token before giving up
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch('http://localhost:5003/api/auth/refresh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}`,
              },
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              if (refreshData.success && refreshData.data?.access_token) {
                // Save new token
                localStorage.setItem('access_token', refreshData.data.access_token);
                // Retry the search with new token
                const retryResponse = await fetch(
                  `http://localhost:5003/api/hr/candidates/search?${params.toString()}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${refreshData.data.access_token}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                
                if (retryResponse.ok) {
                  const result = await retryResponse.json();
                  if (result.success && result.data && result.data.candidates) {
                    setCandidates(result.data.candidates);
                    return;
                  }
                }
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
        }
        
        // If refresh failed or no refresh token, redirect to login
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.candidates) {
          setCandidates(result.data.candidates);
        } else {
          setCandidates([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        setCandidates([]);
        alert(`Failed to search candidates: ${errorData.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error searching candidates:', error);
      setCandidates([]);
      alert('Failed to search candidates. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (candidateId: string) => {
    // Open candidate profile in new tab
    window.open(`/candidate-profile/${candidateId}`, '_blank');
  };

  const handleContactCandidate = (candidate: Candidate) => {
    // Open email client
    if (candidate.email) {
      window.location.href = `mailto:${candidate.email}`;
    }
  };

  const resetSearch = () => {
    setSearchQuery('');
    setLocation('');
    setMinExperience('');
    setSkills('');
    setCandidates([]);
    setSearched(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Source Candidates
          </DialogTitle>
          <DialogDescription>
            Search and discover qualified candidates from the talent pool
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Filters */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-2 gap-4">
              {/* Search Query */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="searchQuery">
                  Search Keywords
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="searchQuery"
                    placeholder="Job title, skills, or keywords"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    placeholder="e.g., Dubai, Abu Dhabi"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Min Experience */}
              <div className="space-y-2">
                <Label htmlFor="minExperience">Min. Experience (Years)</Label>
                <Input
                  id="minExperience"
                  type="number"
                  placeholder="e.g., 3"
                  value={minExperience}
                  onChange={(e) => setMinExperience(e.target.value)}
                  min="0"
                />
              </div>

              {/* Skills */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="skills">
                  Skills (comma-separated)
                </Label>
                <Input
                  id="skills"
                  placeholder="e.g., Python, React, Project Management"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetSearch} disabled={loading}>
                Reset
              </Button>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Candidates
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3">
            {searched && !loading && (
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-700">
                  {candidates.length} Candidate{candidates.length !== 1 ? 's' : ''} Found
                </h3>
              </div>
            )}

            {searched && !loading && candidates.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No candidates found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your search criteria</p>
              </div>
            )}

            {candidates.length > 0 && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-5 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg">
                          {candidate.first_name} {candidate.last_name}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          {candidate.experience_years !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Briefcase className="h-4 w-4 flex-shrink-0" />
                              <span>{candidate.experience_years} years experience</span>
                            </div>
                          )}

                          {candidate.education_level && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <GraduationCap className="h-4 w-4 flex-shrink-0" />
                              <span>{candidate.education_level}</span>
                            </div>
                          )}

                          {candidate.preferred_location && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span>{candidate.preferred_location}</span>
                            </div>
                          )}
                        </div>

                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-2">
                              {candidate.skills.slice(0, 8).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {candidate.skills.length > 8 && (
                                <Badge variant="outline" className="text-xs">
                                  +{candidate.skills.length - 8} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-sm">
                          {candidate.email && (
                            <a
                              href={`mailto:${candidate.email}`}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                            >
                              <Mail className="h-4 w-4" />
                              {candidate.email}
                            </a>
                          )}
                          {candidate.phone && (
                            <span className="flex items-center gap-1 text-gray-600">
                              <Phone className="h-4 w-4" />
                              {candidate.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewProfile(candidate.id)}
                          className="whitespace-nowrap"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleContactCandidate(candidate)}
                          className="whitespace-nowrap"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
            <p className="text-blue-700">
              <strong>Tip:</strong> Use specific keywords and skills to find the most relevant candidates.
              You can also search by location to find local talent.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SourceCandidatesDialog;

