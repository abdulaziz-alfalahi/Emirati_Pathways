
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  Award, 
  Activity,
  Plus,
  Search,
  Filter,
  Star,
  Clock,
  MapPin,
  Eye
} from 'lucide-react';

const CommunityAnalyticsDashboard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const communityMetrics = [
    {
      title: "Engagement Score",
      value: "94%",
      change: "+12%",
      trend: "up",
      icon: Activity,
      color: "text-[rgb(var(--pg-primary))]"
    },
    {
      title: "Network Growth",
      value: "287",
      change: "+45",
      trend: "up", 
      icon: TrendingUp,
      color: "text-[rgb(var(--pg-secondary))]"
    },
    {
      title: "Event Attendance",
      value: "156",
      change: "+23",
      trend: "up",
      icon: Calendar,
      color: "text-[rgb(var(--pg-accent))]"
    },
    {
      title: "Discussion Posts",
      value: "89",
      change: "+8",
      trend: "up",
      icon: MessageSquare,
      color: "text-purple-500"
    }
  ];

  const myCommunities = [
    {
      id: 1,
      name: "UAE Tech Leaders",
      description: "Connect with technology leaders across the UAE",
      members: 2847,
      category: "Technology",
      lastActive: "2 hours ago",
      engagement: "High",
      role: "Member",
      image: "/placeholder-community.jpg"
    },
    {
      id: 2,
      name: "Dubai Entrepreneurs",
      description: "Supporting the entrepreneurial ecosystem in Dubai",
      members: 1923,
      category: "Business",
      lastActive: "1 day ago",
      engagement: "Medium",
      role: "Moderator",
      image: "/placeholder-community.jpg"
    },
    {
      id: 3,
      name: "Healthcare Professionals UAE",
      description: "Advancing healthcare excellence in the UAE",
      members: 3456,
      category: "Healthcare",
      lastActive: "3 hours ago",
      engagement: "High",
      role: "Member",
      image: "/placeholder-community.jpg"
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "AI Innovation Summit 2024",
      community: "UAE Tech Leaders",
      date: "2024-02-15",
      time: "09:00 AM",
      location: "DIFC, Dubai",
      type: "In-Person",
      attendees: 245,
      status: "Registered"
    },
    {
      id: 2,
      title: "Startup Pitch Night",
      community: "Dubai Entrepreneurs", 
      date: "2024-02-18",
      time: "06:00 PM",
      location: "Virtual Event",
      type: "Virtual",
      attendees: 156,
      status: "Interested"
    }
  ];

  const activeDiscussions = [
    {
      id: 1,
      title: "Future of Remote Work in UAE",
      author: "Sarah Al-Mansouri",
      community: "UAE Tech Leaders",
      replies: 23,
      likes: 45,
      lastActivity: "15 minutes ago",
      tags: ["Remote Work", "Future Trends"]
    },
    {
      id: 2,
      title: "Healthcare Digital Transformation",
      author: "Dr. Ahmed Hassan",
      community: "Healthcare Professionals UAE",
      replies: 18,
      likes: 32,
      lastActivity: "1 hour ago",
      tags: ["Digital Health", "Innovation"]
    }
  ];

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'High':
        return 'bg-[rgb(var(--pg-secondary))] text-white';
      case 'Medium':
        return 'bg-[rgb(var(--pg-accent))] text-white';
      case 'Low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {communityMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="border-s-4 border-s-[rgb(var(--pg-primary))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold text-[rgb(var(--pg-primary))]">{metric.value}</p>
                    <p className={`text-sm ${metric.color}`}>{metric.change} this month</p>
                  </div>
                  <div className={`p-3 rounded-full bg-[rgb(var(--pg-primary))/10]`}>
                    <IconComponent className={`h-6 w-6 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="communities" className="w-full">
        <TabsList className="mb-6 bg-white border shadow-sm">
          <TabsTrigger 
            value="communities" 
            className="data-[state=active]:bg-[rgb(var(--pg-primary))] data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 me-2" />
            My Communities
          </TabsTrigger>
          <TabsTrigger 
            value="events" 
            className="data-[state=active]:bg-[rgb(var(--pg-secondary))] data-[state=active]:text-white"
          >
            <Calendar className="h-4 w-4 me-2" />
            Events
          </TabsTrigger>
          <TabsTrigger 
            value="discussions" 
            className="data-[state=active]:bg-[rgb(var(--pg-accent))] data-[state=active]:text-white"
          >
            <MessageSquare className="h-4 w-4 me-2" />
            Discussions
          </TabsTrigger>
        </TabsList>

        {/* My Communities Tab */}
        <TabsContent value="communities">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[rgb(var(--pg-primary))]">Your Professional Communities</h3>
              <Button className="bg-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/90]">
                <Plus className="h-4 w-4 me-2" />
                Join Community
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myCommunities.map((community) => (
                <Card key={community.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-s-4 border-s-[rgb(var(--pg-primary))]">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge className={getEngagementColor(community.engagement)}>
                        {community.engagement} Activity
                      </Badge>
                      <Badge variant="outline" className="border-[rgb(var(--pg-secondary))] text-[rgb(var(--pg-secondary))]">
                        {community.role}
                      </Badge>
                    </div>
                    <CardTitle className="text-[rgb(var(--pg-primary))]">{community.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {community.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="h-4 w-4 me-2" />
                      <span>{community.members.toLocaleString()} members</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 me-2" />
                      <span>Active {community.lastActive}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant="outline" className="text-xs border-[rgb(var(--pg-accent))] text-[rgb(var(--pg-accent))]">
                        {community.category}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/10]"
                      >
                        <Eye className="h-4 w-4 me-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[rgb(var(--pg-secondary))]">Upcoming Community Events</h3>
              <Button variant="outline" className="border-[rgb(var(--pg-secondary))] text-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))/10]">
                <Calendar className="h-4 w-4 me-2" />
                View Calendar
              </Button>
            </div>
            
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow border-s-4 border-s-[rgb(var(--pg-secondary))]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-[rgb(var(--pg-secondary))]">{event.title}</h4>
                          <Badge 
                            className={event.status === 'Registered' 
                              ? 'bg-[rgb(var(--pg-secondary))] text-white' 
                              : 'bg-[rgb(var(--pg-accent))] text-white'
                            }
                          >
                            {event.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{event.community}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 me-1" />
                            {event.date} at {event.time}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 me-1" />
                            {event.location}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 me-1" />
                            {event.attendees} attending
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))/90]"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Discussions Tab */}
        <TabsContent value="discussions">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[rgb(var(--pg-accent))]">Active Discussions</h3>
              <Button variant="outline" className="border-[rgb(var(--pg-accent))] text-[rgb(var(--pg-accent))] hover:bg-[rgb(var(--pg-accent))/10]">
                <Plus className="h-4 w-4 me-2" />
                Start Discussion
              </Button>
            </div>
            
            <div className="space-y-3">
              {activeDiscussions.map((discussion) => (
                <Card key={discussion.id} className="hover:shadow-md transition-shadow border-s-4 border-s-[rgb(var(--pg-accent))]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[rgb(var(--pg-accent))] mb-1">{discussion.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          by {discussion.author} in {discussion.community}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 me-1" />
                            {discussion.replies} replies
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 me-1" />
                            {discussion.likes} likes
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 me-1" />
                            {discussion.lastActivity}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {discussion.tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs border-[rgb(var(--pg-accent))] text-[rgb(var(--pg-accent))]"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-[rgb(var(--pg-accent))] hover:bg-[rgb(var(--pg-accent))/10]"
                      >
                        Join Discussion
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityAnalyticsDashboard;
