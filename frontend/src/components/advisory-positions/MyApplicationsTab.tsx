
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Calendar, Building } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Application {
  id: string;
  status: string;
  submitted_at: string;
  cover_letter: string;
  resume_url?: string;
  additional_documents?: string[];
  notes?: string;
  position: {
    id: string;
    title: string;
    organization: string;
    location: string;
    compensation_type: string;
  };
}

export const MyApplicationsTab: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('advisory_applications')
        .select(`
          *,
          position:advisory_positions(
            id,
            title,
            organization,
            location,
            compensation_type
          )
        `)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'under_review': return 'Under Review';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Not Selected';
      default: return status;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
          <p className="text-gray-600 mb-4">Please sign in to view your applications.</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

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

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't applied for any advisory positions yet. Browse available positions to get started.
          </p>
          <Button onClick={() => {
            const browseTab = document.querySelector('[data-state="inactive"][value="browse"]') as HTMLElement;
            browseTab?.click();
          }}>
            Browse Positions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <Card key={application.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl mb-1">
                  {application.position.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Building className="h-4 w-4" />
                  {application.position.organization}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Applied on {new Date(application.submitted_at).toLocaleDateString()}
                </div>
              </div>
              <Badge className={getStatusBadgeColor(application.status)}>
                {getStatusText(application.status)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-sm text-gray-700 mb-2">Cover Letter:</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded line-clamp-3">
                  {application.cover_letter}
                </p>
              </div>

              {application.resume_url && (
                <div>
                  <p className="font-medium text-sm text-gray-700 mb-2">Documents:</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(application.resume_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 me-2" />
                    View Resume/CV
                  </Button>
                </div>
              )}

              {application.additional_documents && application.additional_documents.length > 0 && (
                <div>
                  {application.additional_documents.map((doc, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="me-2"
                      onClick={() => window.open(doc, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 me-2" />
                      Additional Document {index + 1}
                    </Button>
                  ))}
                </div>
              )}

              {application.notes && (
                <div>
                  <p className="font-medium text-sm text-gray-700 mb-2">Feedback/Notes:</p>
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    {application.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
