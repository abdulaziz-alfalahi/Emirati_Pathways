import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Mail,
  Calendar,
  Clock,
  ChevronRight,
  Briefcase,
  Eye
} from 'lucide-react';
import { restClient } from '@/utils/api';
import { formatDateFromString } from '@/utils/dateFormat';

interface RecentApplicant {
  application_id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  submitted_at: string;
  cover_letter: string;
  job_title: string;
  company_name: string;
  candidate_name: string;
  candidate_email: string;
}

interface RecentApplicantsProps {
  onViewAll?: () => void;
  limit?: number;
}

export const RecentApplicants: React.FC<RecentApplicantsProps> = ({ onViewAll, limit = 5 }) => {
  const navigate = useNavigate();

  // Fetch recent applicants
  const { data: recentApplicantsData, isLoading } = useQuery({
    queryKey: ['recentApplicants', limit],
    queryFn: async () => {
      try {
        const response = await restClient.get(`/api/recruiter/recent-applicants?limit=${limit}&days=30`);
        if (response.data?.success) {
          return response.data;
        }
        return { data: [], count: 0 };
      } catch (error) {
        console.error('Failed to fetch recent applicants:', error);
        return { data: [], count: 0 };
      }
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const recentApplicants = recentApplicantsData?.data || [];
  const totalCount = recentApplicantsData?.count || 0;

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDateFromString(dateString);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      'pending': { variant: 'secondary', label: 'New' },
      'submitted': { variant: 'secondary', label: 'New' },
      'under_review': { variant: 'default', label: 'In Review' },
      'screening': { variant: 'default', label: 'Screening' },
      'interview_scheduled': { variant: 'outline', label: 'Interview' },
      'interview': { variant: 'outline', label: 'Interview' },
    };
    return statusConfig[status] || { variant: 'secondary', label: status };
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-dubai-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Recent Applicants
          </CardTitle>
          <CardDescription className="font-dubai-medium text-slate-600">
            Latest job applications received
          </CardDescription>
        </div>
        {totalCount > 0 && (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            {totalCount} new
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-600"></div>
          </div>
        ) : recentApplicants.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-muted-foreground">No recent applicants</p>
            <p className="text-xs text-muted-foreground mt-1">
              New applications will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentApplicants.map((applicant: RecentApplicant) => {
              const statusInfo = getStatusBadge(applicant.status);

              return (
                <div
                  key={applicant.application_id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/recruiter?tab=jobs`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-700 font-semibold text-sm">
                        {applicant.candidate_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {applicant.candidate_name || 'Unknown Candidate'}
                        </p>
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        <span className="truncate">{applicant.job_title || 'Unknown Job'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(applicant.submitted_at)}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              );
            })}

            {/* View All Button */}
            {totalCount > limit && (
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => onViewAll ? onViewAll() : navigate('/recruiter?tab=jobs')}
              >
                <Eye className="h-4 w-4 me-2" />
                View All Applicants
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentApplicants;
