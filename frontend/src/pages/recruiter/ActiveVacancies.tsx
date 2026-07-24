import React from 'react';
import { getAuthToken } from '@/utils/tokenUtils';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { Eye, Users, MapPin, Building, Calendar, Briefcase, Plus, ArrowLeft } from 'lucide-react';
import { restClient } from '@/utils/api';

const ActiveVacancies: React.FC = () => {
  const { user, roles, isLoading } = useAuth();
  const navigate = useNavigate();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-dubai-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if the user is authenticated (allow mock tokens)
  const hasToken = getAuthToken();
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
      const response = await restClient.get('/api/recruiter/jd/list');

      if (!response.data) {
        throw new Error('Failed to fetch active vacancies');
      }

      const data = response.data;
      // Filter to show only published vacancies
      const allJDs = data.job_descriptions || [];
      return allJDs.filter((jd: any) => jd.status === 'published');
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai">
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} />

      {/* Main Content */}
      <div className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link to="/recruiter-dashboard" className="text-slate-500 hover:text-teal-600 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                  <h1 className="text-3xl font-dubai-bold text-slate-900">
                    Active Vacancies
                  </h1>
                </div>
                <p className="text-slate-600 font-dubai-medium ms-7">
                  Published job postings actively seeking suitable candidates
                </p>
              </div>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium" onClick={() => navigate('/recruiter/jd-builder')}>
                <Plus className="h-4 w-4 me-2" />
                Create New Vacancy
              </Button>
            </div>
          </div>

          {isLoadingVacancies ? (
            <Card className="bg-white shadow-sm">
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  <p className="text-slate-500 font-dubai-medium">Loading active vacancies...</p>
                </div>
              </CardContent>
            </Card>
          ) : !activeVacancies || activeVacancies.length === 0 ? (
            <Card className="bg-white shadow-sm">
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <Briefcase className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">No Active Vacancies</h3>
                  <p className="text-slate-500 mb-6 font-dubai-medium max-w-md mx-auto">
                    You don't have any published vacancies at the moment. Create a new vacancy to start receiving applications.
                  </p>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium" onClick={() => navigate('/recruiter/jd-builder')}>
                    Create Your First Vacancy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-dubai-bold text-slate-900">Published Vacancies</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      {activeVacancies.length} live positions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-slate-200">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-dubai-bold text-slate-700">Job Title</TableHead>
                        <TableHead className="font-dubai-bold text-slate-700">Status</TableHead>
                        <TableHead className="font-dubai-bold text-slate-700">Recruitment Stage</TableHead>
                        <TableHead className="font-dubai-bold text-slate-700">Applications</TableHead>
                        <TableHead className="font-dubai-bold text-slate-700">Type</TableHead>
                        <TableHead className="font-dubai-bold text-slate-700 text-end">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeVacancies.map((vacancy: any) => {
                        // Honest values from the vacancy record — no fabricated
                        // stage/progress/application counts (was Math.random + '45').
                        const stage = vacancy.stage || '—';
                        const progress = vacancy.progress ?? 0;
                        const applications = vacancy.applications_count ?? 0;

                        return (
                          <TableRow
                            key={vacancy.jd_id || vacancy.id}
                            className="hover:bg-teal-50/30 transition-colors cursor-pointer group border-s-4 border-s-transparent hover:border-s-teal-500"
                          >
                            <TableCell className="font-dubai-bold text-slate-900">
                              <div>
                                {vacancy.title || vacancy.basic_info?.title || 'Untitled Position'}
                                <div className="flex items-center gap-1 text-xs text-slate-500 font-dubai-medium mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {vacancy.city || vacancy.basic_info?.city || 'Not specified'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 font-dubai-medium">
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell className="w-48">
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-dubai-medium">
                                  <span className="text-slate-700">{stage}</span>
                                  <span className="text-slate-500">{progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 font-dubai-bold text-slate-700">
                                <Users className="h-4 w-4 text-slate-400" />
                                {applications}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-dubai-medium">
                                {vacancy.job_type || vacancy.basic_info?.job_type || 'Full-time'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-end">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium"
                                  onClick={() => {
                                    const jdId = vacancy.jd_id || vacancy.id;
                                    navigate(`/recruiter/shortlist/${jdId}`);
                                  }}
                                >
                                  Candidates
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="font-dubai-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 border-slate-200"
                                  onClick={() => {
                                    const jdId = vacancy.jd_id || vacancy.id;
                                    navigate(`/recruiter/jd-builder?jd_id=${jdId}`);
                                  }}
                                >
                                  Details
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveVacancies;
