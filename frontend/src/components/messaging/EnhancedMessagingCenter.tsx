
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Users, 
  Search, 
  Filter,
  Plus,
  FileText,
  Calendar,
  Settings
} from 'lucide-react';
import { DocumentSharing } from './DocumentSharing';
import { CollaborationFeatures } from './CollaborationFeatures';
import { usePhase } from '@/context/PhaseContext';
import { useAuth } from '@/context/AuthContext';

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  type: 'direct' | 'group' | 'institutional';
  phase?: string;
  title?: string;
}

export const EnhancedMessagingCenter: React.FC = () => {
  const { user } = useAuth();
  const { currentPhase, phaseInfo } = usePhase();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');

  // Mock data - in real implementation, this would come from API
  const conversations: Conversation[] = [
    {
      id: '1',
      participants: ['Dubai University', 'Student Affairs'],
      lastMessage: 'Your scholarship application has been approved!',
      lastMessageTime: '2 hours ago',
      unreadCount: 1,
      type: 'institutional',
      phase: 'education',
      title: 'Scholarship Application'
    },
    {
      id: '2',
      participants: ['Emirates Airlines', 'HR Department'],
      lastMessage: 'Thank you for your interest in our internship program.',
      lastMessageTime: '1 day ago',
      unreadCount: 0,
      type: 'institutional',
      phase: 'career',
      title: 'Internship Application'
    },
    {
      id: '3',
      participants: ['Ahmed Hassan', 'Career Mentor'],
      lastMessage: 'Let\'s schedule our next mentoring session.',
      lastMessageTime: '3 days ago',
      unreadCount: 2,
      type: 'direct',
      phase: 'professional',
      title: 'Mentoring Discussion'
    }
  ];

  const documents = [
    {
      id: '1',
      name: 'Scholarship_Application_Form.pdf',
      type: 'application/pdf',
      size: 245760,
      uploadedAt: '2 days ago',
      uploadedBy: 'Dubai University',
      url: '#',
      permissions: 'view' as const
    }
  ];

  const tasks = [
    {
      id: '1',
      title: 'Submit final transcript',
      description: 'Upload official transcript for scholarship verification',
      assignee: 'Student',
      dueDate: '2024-01-30',
      status: 'pending' as const,
      priority: 'high' as const
    }
  ];

  const meetings = [
    {
      id: '1',
      title: 'Career Guidance Session',
      description: 'Discuss career path options and professional development',
      date: '2024-01-25',
      time: '14:00',
      location: 'Virtual Meeting Room',
      attendees: ['Ahmed Hassan', 'Career Mentor'],
      organizer: 'Career Mentor'
    }
  ];

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participants.some(p => 
      p.toLowerCase().includes(searchQuery.toLowerCase())
    ) || (conv.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPhase = filterPhase === 'all' || conv.phase === filterPhase;
    
    return matchesSearch && matchesPhase;
  });

  const getPhaseColor = (phase?: string) => {
    if (!phase) return 'bg-gray-100 text-gray-800';
    return phaseInfo[phase as keyof typeof phaseInfo]?.color || '#006E6D';
  };

  const handleUpload = (file: File) => {
    console.log('Uploading file:', file.name);
    // Implementation for file upload
  };

  const handleDownload = (document: any) => {
    console.log('Downloading document:', document.name);
    // Implementation for file download
  };

  const handleDeleteDocument = (documentId: string) => {
    console.log('Deleting document:', documentId);
    // Implementation for file deletion
  };

  const handleCreateTask = (task: any) => {
    console.log('Creating task:', task);
    // Implementation for task creation
  };

  const handleUpdateTask = (taskId: string, updates: any) => {
    console.log('Updating task:', taskId, updates);
    // Implementation for task update
  };

  const handleCreateMeeting = (meeting: any) => {
    console.log('Creating meeting:', meeting);
    // Implementation for meeting creation
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute start-2 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterPhase}
                  onChange={(e) => setFilterPhase(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Phases</option>
                  <option value="education">Education</option>
                  <option value="career">Career Entry</option>
                  <option value="professional">Professional Growth</option>
                  <option value="lifelong">Lifelong Engagement</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 border-s-4 ${
                    activeConversation === conversation.id ? 'bg-blue-50 border-s-blue-500' : 'border-s-transparent'
                  }`}
                  onClick={() => setActiveConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {conversation.title || conversation.participants.join(', ')}
                        </h4>
                        {conversation.phase && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ 
                              borderColor: getPhaseColor(conversation.phase),
                              color: getPhaseColor(conversation.phase)
                            }}
                          >
                            {phaseInfo[conversation.phase as keyof typeof phaseInfo]?.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {conversation.participants.join(', ')}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {conversation.lastMessageTime}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-2">
        {activeConversation ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {conversations.find(c => c.id === activeConversation)?.title || 'Conversation'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Users className="h-4 w-4 me-2" />
                    Participants
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="messages" className="h-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="collaboration">Tasks</TabsTrigger>
                  <TabsTrigger value="meetings">Meetings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="messages" className="h-full">
                  <div className="h-96 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
                    <div className="space-y-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-sm">Your scholarship application has been approved! Please check your email for next steps.</p>
                        <p className="text-xs text-gray-500 mt-1">Dubai University • 2 hours ago</p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-lg shadow-sm ms-auto max-w-xs">
                        <p className="text-sm">Thank you so much! When do I need to submit the additional documents?</p>
                        <p className="text-xs text-gray-500 mt-1">You • 1 hour ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Type your message..." className="flex-1" />
                    <Button>Send</Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="documents">
                  <DocumentSharing
                    conversationId={activeConversation}
                    documents={documents}
                    onUpload={handleUpload}
                    onDownload={handleDownload}
                    onDelete={handleDeleteDocument}
                  />
                </TabsContent>
                
                <TabsContent value="collaboration">
                  <CollaborationFeatures
                    conversationId={activeConversation}
                    tasks={tasks}
                    meetings={meetings}
                    onCreateTask={handleCreateTask}
                    onUpdateTask={handleUpdateTask}
                    onCreateMeeting={handleCreateMeeting}
                  />
                </TabsContent>
                
                <TabsContent value="meetings">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Scheduled Meetings</h3>
                      <Button size="sm">
                        <Calendar className="h-4 w-4 me-2" />
                        Schedule New
                      </Button>
                    </div>
                    {meetings.map((meeting) => (
                      <Card key={meeting.id}>
                        <CardContent className="p-4">
                          <h4 className="font-medium">{meeting.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{meeting.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{meeting.date} at {meeting.time}</span>
                            <span>{meeting.location}</span>
                            <span>{meeting.attendees.length} attendees</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
              <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
