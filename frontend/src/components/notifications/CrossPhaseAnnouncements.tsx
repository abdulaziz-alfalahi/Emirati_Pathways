
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Megaphone, 
  Globe, 
  Users, 
  Calendar, 
  TrendingUp,
  AlertCircle,
  Info,
  CheckCircle,
  Star,
  ArrowRight
} from 'lucide-react';
import { usePhase } from '@/context/PhaseContext';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'platform_update' | 'new_opportunity' | 'policy_change' | 'community_event' | 'system_maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetPhases: string[];
  targetAudience: string;
  actionUrl?: string;
  actionText?: string;
  effectiveDate?: string;
  expiryDate?: string;
  tags: string[];
  isRead: boolean;
  createdAt: string;
  createdBy: string;
}

export const CrossPhaseAnnouncements: React.FC = () => {
  const { phaseInfo } = usePhase();
  const [activeTab, setActiveTab] = useState('all');

  // Mock announcements - in real implementation, these would come from CMS
  const announcements: Announcement[] = [
    {
      id: '1',
      title: 'New AI-Powered Career Matching Feature Launched',
      content: 'We\'re excited to announce our new AI-powered career matching system that provides personalized job recommendations based on your skills, interests, and career goals. This feature is now available across all phases.',
      type: 'platform_update',
      priority: 'high',
      targetPhases: ['career', 'professional'],
      targetAudience: 'All active job seekers',
      actionUrl: '/job-matching',
      actionText: 'Try Career Matching',
      effectiveDate: '2024-01-15',
      tags: ['AI', 'Career', 'Innovation'],
      isRead: false,
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'EHRDC Platform Team'
    },
    {
      id: '2',
      title: 'Enhanced Scholarship Database with 500+ New Opportunities',
      content: 'Our scholarship database has been significantly expanded with over 500 new opportunities from local and international institutions. Students can now access more funding options for their educational journey.',
      type: 'new_opportunity',
      priority: 'high',
      targetPhases: ['education'],
      targetAudience: 'Students and prospective students',
      actionUrl: '/scholarships',
      actionText: 'Browse Scholarships',
      effectiveDate: '2024-01-12',
      tags: ['Education', 'Scholarships', 'Funding'],
      isRead: true,
      createdAt: '2024-01-12T14:30:00Z',
      createdBy: 'Education Services Team'
    },
    {
      id: '3',
      title: 'Privacy Policy Update - Enhanced Data Protection',
      content: 'We have updated our privacy policy to include enhanced data protection measures and clearer consent mechanisms. All users are encouraged to review the updated policy.',
      type: 'policy_change',
      priority: 'medium',
      targetPhases: ['education', 'career', 'professional', 'lifelong'],
      targetAudience: 'All platform users',
      actionUrl: '/privacy-policy',
      actionText: 'Review Policy',
      effectiveDate: '2024-01-20',
      tags: ['Privacy', 'Policy', 'Legal'],
      isRead: false,
      createdAt: '2024-01-10T09:15:00Z',
      createdBy: 'Legal & Compliance Team'
    },
    {
      id: '4',
      title: 'Virtual Career Fair 2024 - Connect with Top Employers',
      content: 'Join our annual virtual career fair featuring over 100 leading employers from various industries. Network with recruiters, attend workshops, and explore job opportunities.',
      type: 'community_event',
      priority: 'high',
      targetPhases: ['career', 'professional'],
      targetAudience: 'Job seekers and career changers',
      actionUrl: '/events/career-fair-2024',
      actionText: 'Register Now',
      effectiveDate: '2024-02-15',
      expiryDate: '2024-02-17',
      tags: ['Career Fair', 'Networking', 'Jobs'],
      isRead: false,
      createdAt: '2024-01-08T16:45:00Z',
      createdBy: 'Events Team'
    },
    {
      id: '5',
      title: 'Scheduled Maintenance - Platform Downtime',
      content: 'The platform will undergo scheduled maintenance on January 28th from 2:00 AM to 6:00 AM GST. During this time, some services may be temporarily unavailable.',
      type: 'system_maintenance',
      priority: 'medium',
      targetPhases: ['education', 'career', 'professional', 'lifelong'],
      targetAudience: 'All platform users',
      effectiveDate: '2024-01-28',
      tags: ['Maintenance', 'Downtime', 'Technical'],
      isRead: true,
      createdAt: '2024-01-05T11:20:00Z',
      createdBy: 'Technical Operations Team'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'platform_update': return <TrendingUp className="h-4 w-4" />;
      case 'new_opportunity': return <Star className="h-4 w-4" />;
      case 'policy_change': return <AlertCircle className="h-4 w-4" />;
      case 'community_event': return <Users className="h-4 w-4" />;
      case 'system_maintenance': return <Info className="h-4 w-4" />;
      default: return <Megaphone className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'platform_update': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'new_opportunity': return 'bg-green-100 text-green-800 border-green-200';
      case 'policy_change': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'community_event': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'system_maintenance': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filterAnnouncements = (filter: string) => {
    switch (filter) {
      case 'unread':
        return announcements.filter(a => !a.isRead);
      case 'urgent':
        return announcements.filter(a => a.priority === 'urgent' || a.priority === 'high');
      case 'opportunities':
        return announcements.filter(a => a.type === 'new_opportunity');
      case 'updates':
        return announcements.filter(a => a.type === 'platform_update');
      default:
        return announcements;
    }
  };

  const filteredAnnouncements = filterAnnouncements(activeTab);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Platform Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="urgent">Important</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {filteredAnnouncements.length === 0 ? (
                  <div className="text-center py-8">
                    <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No announcements</h3>
                    <p className="text-gray-600">No announcements available for this category.</p>
                  </div>
                ) : (
                  filteredAnnouncements.map((announcement) => (
                    <Card key={announcement.id} className={`${!announcement.isRead ? 'ring-2 ring-blue-200 bg-blue-50/50' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${getTypeColor(announcement.type)}`}>
                                {getTypeIcon(announcement.type)}
                              </div>
                              <h3 className="font-semibold text-lg flex-1">{announcement.title}</h3>
                              {!announcement.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <Badge className={getPriorityColor(announcement.priority)}>
                                {announcement.priority} priority
                              </Badge>
                              <Badge className={getTypeColor(announcement.type)}>
                                {announcement.type.replace('_', ' ')}
                              </Badge>
                              {announcement.targetPhases.map(phase => (
                                <Badge 
                                  key={phase}
                                  variant="outline" 
                                  style={{ 
                                    borderColor: phaseInfo[phase as keyof typeof phaseInfo]?.color,
                                    color: phaseInfo[phase as keyof typeof phaseInfo]?.color
                                  }}
                                >
                                  {phaseInfo[phase as keyof typeof phaseInfo]?.name}
                                </Badge>
                              ))}
                            </div>
                            
                            <p className="text-gray-700 mb-4">{announcement.content}</p>
                            
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              {announcement.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>By {announcement.createdBy}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}</span>
                              {announcement.effectiveDate && (
                                <>
                                  <span>•</span>
                                  <span>Effective: {new Date(announcement.effectiveDate).toLocaleDateString()}</span>
                                </>
                              )}
                              {announcement.expiryDate && (
                                <>
                                  <span>•</span>
                                  <span className="text-red-600">
                                    Expires: {new Date(announcement.expiryDate).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {announcement.actionUrl && (
                            <Button className="shrink-0">
                              {announcement.actionText || 'Learn More'}
                              <ArrowRight className="h-4 w-4 ms-2" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
