import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { Eye, Users, MapPin, Building, Calendar, Briefcase } from 'lucide-react';
import { apiClient } from '@/utils/apiClient';

const ActiveVacancies: React.FC = () => {
  const { user, roles, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Check if the user is authenticated (allow mock tokens)
  const hasToken = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
  const isMockToken = hasToken?.startsWith('mock_token_');
  
  if (!user && !isMockToken) {
    return <Navigate to="/auth" replace />;
  }
  
  // Check if the user has the recruiter role (or is using mock auth)
  const isRecruiter = isMockToken || 
                      (roles && (roles.includes('private_sector_recruiter') || roles.includes('recruiter'))) ||
                      (user?.email && user.email.includes('recruit'));
                      
  // Redirect to dashboard if not a recruiter
  if (!isRecruiter) {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch only published/active job descriptions
  const { data: activeVacancies, isLoading: isLoadingVacancies } = useQuery({
    queryKey: ['activeVacancies'],
    queryFn: async () => {
      const data = await apiClient.get<{ job_descriptions: any[] }>('/api/recruiter/jd/list');
      // Filter to show only published vacancies
      const allJDs = data.job_descriptions || [];
      return allJDs.filter((jd: any) => jd.status === 'published');
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Active Vacancies</h1>
            <p className="text-muted-foreground">
              Published job postings actively seeking suitable candidates
            </p>
          </div>
          <Button onClick={() => navigate('/recruiter/jd-builder')}>
            <Briefcase className="h-4 w-4 mr-2" />
            Create New Vacancy
          </Button>
        </div>

        {isLoadingVacancies ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Loading active vacancies...</p>
            </CardContent>
          </Card>
        ) : !activeVacancies || activeVacancies.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Vacancies</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any published vacancies at the moment.
                </p>
                <Button onClick={() => navigate('/recruiter/jd-builder')}>
                  Create Your First Vacancy
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Published Vacancies ({activeVacancies.length})</CardTitle>
              <CardDescription>
                These vacancies are live and actively seeking candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeVacancies.map((vacancy: any) => (
                    <TableRow key={vacancy.jd_id || vacancy.id}>
                      <TableCell className="font-medium">
                        {vacancy.title || vacancy.basic_info?.title || 'Untitled Position'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {vacancy.city || vacancy.basic_info?.city || 'Not specified'}
                            {vacancy.emirate || vacancy.basic_info?.emirate ? 
                              `, ${vacancy.emirate || vacancy.basic_info?.emirate}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {vacancy.department || vacancy.basic_info?.department || 'Not specified'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {vacancy.job_type || vacancy.basic_info?.job_type || 'Full-time'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {vacancy.published_at ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(vacancy.published_at).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Recently</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const jdId = vacancy.jd_id || vacancy.id;
                              navigate(`/recruiter/shortlist/${jdId}`);
                            }}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            View Candidates
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const jdId = vacancy.jd_id || vacancy.id;
                              navigate(`/recruiter/jd-builder?jd_id=${jdId}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ActiveVacancies;
