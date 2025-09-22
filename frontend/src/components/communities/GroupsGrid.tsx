import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, Sparkles, TrendingUp, Users, BarChart3, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CommunitiesService } from '@/services/communitiesService';
import { ProfessionalGroup, GroupWithMetrics, AdvancedSearchFilters, GroupPoll, GroupEvent } from '@/types/communities';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import GroupCard from './GroupCard';
import CreateGroupDialog from './CreateGroupDialog';
import GroupRecommendations from './GroupRecommendations';
import AdvancedGroupSearch from './AdvancedGroupSearch';
import CreatePollDialog from './CreatePollDialog';
import PollCard from './PollCard';
import CreateEventDialog from './CreateEventDialog';
import EventCard from './EventCard';

const GroupsGrid: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupWithMetrics[]>([]);
  const [trendingGroups, setTrendingGroups] = useState<GroupWithMetrics[]>([]);
  const [polls, setPolls] = useState<GroupPoll[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [searchFilters, setSearchFilters] = useState<AdvancedSearchFilters>({});
  const [viewMode, setViewMode] = useState<'all' | 'recommended' | 'trending'>('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'discover') {
      if (Object.keys(searchFilters).length > 0) {
        loadFilteredGroups();
      } else {
        loadGroupsByMode();
      }
    }
  }, [searchFilters, viewMode, activeTab]);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupPolls();
      loadGroupEvents();
    }
  }, [selectedGroupId]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadUserGroups(),
        loadGroupsByMode(),
        loadTrendingGroups()
      ]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load communities",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupsByMode = async () => {
    try {
      let data: GroupWithMetrics[] = [];
      
      switch (viewMode) {
        case 'trending':
          data = await CommunitiesService.getTrendingGroups(20);
          break;
        case 'recommended':
          // For now, load regular groups - recommendations will be handled separately
          data = await CommunitiesService.getGroups({ is_private: false });
          break;
        default:
          data = await CommunitiesService.getGroups({ is_private: false });
      }
      
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadFilteredGroups = async () => {
    try {
      const data = await CommunitiesService.getGroupsWithAdvancedFilters(searchFilters);
      setGroups(data);
    } catch (error) {
      console.error('Failed to load filtered groups:', error);
    }
  };

  const loadTrendingGroups = async () => {
    try {
      const data = await CommunitiesService.getTrendingGroups(6);
      setTrendingGroups(data);
    } catch (error) {
      console.error('Failed to load trending groups:', error);
    }
  };

  const loadUserGroups = async () => {
    try {
      const userGroups = await CommunitiesService.getUserGroups();
      const joinedGroupIds = new Set(userGroups.map(g => g.id));
      setJoinedGroups(joinedGroupIds);
      
      if (userGroups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(userGroups[0].id);
      }
    } catch (error) {
      console.error('Failed to load user groups:', error);
    }
  };

  const loadGroupPolls = async () => {
    if (!selectedGroupId) return;
    try {
      const groupPolls = await CommunitiesService.getGroupPolls(selectedGroupId);
      setPolls(groupPolls);
    } catch (error) {
      console.error('Failed to load polls:', error);
    }
  };

  const loadGroupEvents = async () => {
    if (!selectedGroupId) return;
    try {
      const groupEvents = await CommunitiesService.getGroupEvents(selectedGroupId);
      setEvents(groupEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    setJoiningGroups(prev => new Set([...prev, groupId]));
    
    try {
      await CommunitiesService.joinGroup(groupId);
      setJoinedGroups(prev => new Set([...prev, groupId]));
      
      if (joinedGroups.size === 0) {
        setSelectedGroupId(groupId);
      }
      
      toast({
        title: "Success",
        description: "You've joined the community!",
      });
      
      await loadUserGroups();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join community. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoiningGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    }
  };

  const handleGroupCreated = async () => {
    loadInitialData();
  };

  const handleGroupClick = async (groupId: string) => {
    if (searchFilters.search) {
      await CommunitiesService.logGroupClick(groupId, searchFilters.search);
    }
  };

  const joinedGroupsList = groups.filter(group => joinedGroups.has(group.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Professional Communities</h1>
          <p className="text-muted-foreground mt-2">
            Connect with professionals in your field and expand your network
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/communities/analytics')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
          <CreateGroupDialog onGroupCreated={handleGroupCreated} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">
            <Users className="h-4 w-4 mr-2" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="polls" disabled={joinedGroups.size === 0}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Polls
          </TabsTrigger>
          <TabsTrigger value="events" disabled={joinedGroups.size === 0}>
            <Calendar className="h-4 w-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          {/* Search and Filters */}
          <AdvancedGroupSearch 
            onFiltersChange={setSearchFilters}
            initialFilters={searchFilters}
          />

          {/* Recommendations */}
          {Object.keys(searchFilters).length === 0 && (
            <GroupRecommendations 
              onJoinGroup={handleJoinGroup}
              onRecommendationDismissed={loadInitialData}
            />
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Communities</SelectItem>
                  <SelectItem value="recommended">
                    <Sparkles className="h-4 w-4 mr-2 inline" />
                    Recommended
                  </SelectItem>
                  <SelectItem value="trending">
                    <TrendingUp className="h-4 w-4 mr-2 inline" />
                    Trending
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary">
              {groups.length} communities found
            </Badge>
          </div>

          {/* Groups Grid */}
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No communities found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or create a new community to get started.
              </p>
              <CreateGroupDialog onGroupCreated={handleGroupCreated} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div key={group.id} onClick={() => handleGroupClick(group.id)}>
                  <GroupCard
                    group={group}
                    onJoin={handleJoinGroup}
                    isJoined={joinedGroups.has(group.id)}
                    isLoading={joiningGroups.has(group.id)}
                    showMetrics={true}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Trending Communities</h2>
              <p className="text-muted-foreground">
                Communities with the most activity and engagement
              </p>
            </div>
          </div>

          {trendingGroups.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No trending communities yet</h3>
              <p className="text-muted-foreground">
                Check back later for trending communities!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onJoin={handleJoinGroup}
                  isJoined={joinedGroups.has(group.id)}
                  isLoading={joiningGroups.has(group.id)}
                  showMetrics={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="polls" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Group Polls</h2>
              <p className="text-muted-foreground">
                Participate in polls from your communities
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {joinedGroupsList.length > 0 && (
                <>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {joinedGroupsList.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGroupId && (
                    <CreatePollDialog 
                      groupId={selectedGroupId} 
                      onPollCreated={loadGroupPolls}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {polls.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No polls yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to create a poll in this group!
              </p>
              {selectedGroupId && (
                <CreatePollDialog 
                  groupId={selectedGroupId} 
                  onPollCreated={loadGroupPolls}
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onVote={loadGroupPolls}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Group Events</h2>
              <p className="text-muted-foreground">
                Discover and join events from your communities
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {joinedGroupsList.length > 0 && (
                <>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {joinedGroupsList.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGroupId && (
                    <CreateEventDialog 
                      groupId={selectedGroupId} 
                      onEventCreated={loadGroupEvents}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to organize an event in this group!
              </p>
              {selectedGroupId && (
                <CreateEventDialog 
                  groupId={selectedGroupId} 
                  onEventCreated={loadGroupEvents}
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRsvp={loadGroupEvents}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupsGrid;
