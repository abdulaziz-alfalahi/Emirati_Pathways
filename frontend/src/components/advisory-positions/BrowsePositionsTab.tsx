
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Clock, DollarSign, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { ApplyDialog } from './ApplyDialog';

interface AdvisoryPosition {
  id: string;
  title: string;
  organization: string;
  description: string;
  requirements: string;
  commitment_hours_per_month: number;
  compensation_type: string;
  application_deadline: string;
  location: string;
  remote_allowed: boolean;
  skills_required: string[];
  experience_level: string;
  contact_email: string;
}

export const BrowsePositionsTab: React.FC = () => {
  const { user } = useAuth();
  const [positions, setPositions] = useState<AdvisoryPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<AdvisoryPosition | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('advisory_positions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching positions:', error);
        return;
      }

      setPositions(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPositions = positions.filter(
    position =>
      position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.skills_required.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleApply = (position: AdvisoryPosition) => {
    if (!user) {
      // Redirect to auth or show login prompt
      window.location.href = '/auth';
      return;
    }
    setSelectedPosition(position);
    setShowApplyDialog(true);
  };

  const getCompensationBadgeColor = (type: string) => {
    switch (type) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'stipend': return 'bg-blue-100 text-blue-800';
      case 'unpaid': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case 'entry': return 'bg-green-100 text-green-800';
      case 'mid': return 'bg-yellow-100 text-yellow-800';
      case 'senior': return 'bg-orange-100 text-orange-800';
      case 'executive': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-16 bg-gray-200 rounded mb-4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search positions, organizations, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Positions Grid */}
      <div className="space-y-4">
        {filteredPositions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No positions found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms.' : 'Check back later for new opportunities.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPositions.map((position) => (
            <Card key={position.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{position.title}</CardTitle>
                    <p className="text-lg font-medium text-gray-700 mb-2">{position.organization}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getCompensationBadgeColor(position.compensation_type)}>
                        {position.compensation_type}
                      </Badge>
                      <Badge className={getExperienceBadgeColor(position.experience_level)}>
                        {position.experience_level}
                      </Badge>
                      {position.remote_allowed && (
                        <Badge variant="outline">Remote Friendly</Badge>
                      )}
                    </div>
                  </div>
                  <Button onClick={() => handleApply(position)}>
                    Apply Now
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">{position.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {position.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {position.commitment_hours_per_month} hours/month
                  </div>
                  {position.application_deadline && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📅</span>
                      Deadline: {new Date(position.application_deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {position.skills_required.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {position.skills_required.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Apply Dialog */}
      {selectedPosition && (
        <ApplyDialog
          position={selectedPosition}
          open={showApplyDialog}
          onOpenChange={setShowApplyDialog}
          onApplicationSubmitted={fetchPositions}
        />
      )}
    </div>
  );
};
