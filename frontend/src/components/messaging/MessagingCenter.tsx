
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Card,
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Bell, 
  Search, 
  Send, 
  Users,
  Info,
  Megaphone,
  FileText,
  UserCheck
} from 'lucide-react';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import NotificationPanel from './NotificationPanel';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/auth';

const MessagingCenter: React.FC = () => {
  const { user, roles } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('messages');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to realtime updates for new messages
    const messageChannel = supabase
      .channel('messaging-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_messages',
        filter: `recipient_id=eq.${user.id}`
      }, (payload) => {
        // If the message is unread, increment the counter
        if (!payload.new.is_read) {
          setUnreadMessageCount(prev => prev + 1);
          
          toast({
            title: "New message",
            description: `You have received a new message.`,
          });
        }
      })
      .subscribe();
    
    // Get initial unread message count
    const fetchUnreadCount = async () => {
      try {
        const { data: unreadMessages, error } = await supabase
          .from('user_messages')
          .select('id')
          .eq('recipient_id', user.id)
          .eq('is_read', false);
          
        if (error) throw error;
        
        setUnreadMessageCount(unreadMessages?.length || 0);
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };
    
    fetchUnreadCount();
    setLoading(false);
    
    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [user, toast]);
  
  // When user views a conversation, mark messages as read
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    
    if (!user) return;
    
    // Mark messages as read in the database
    supabase
      .from('user_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('sender_id', conversationId)
      .then(({ error }) => {
        if (error) {
          console.error('Error marking messages as read:', error);
        } else {
          // Update the unread count
          setUnreadMessageCount(prev => Math.max(0, prev - 1));
        }
      });
  };
  
  // Get a list of roles the user can message based on the communication matrix
  const getAvailableContactRoles = (): UserRole[] => {
    let availableRoles: UserRole[] = [];
    
    if (roles.includes('school_student') || roles.includes('university_student')) {
      availableRoles = [
        'school_student', 'university_student', 'jobseeker',
        'full_time_employee', 'part_time_employee', 'gig_worker',
        'educational_institution', 'private_sector_recruiter',
        'parent', 'training_center', 'assessment_center',
        'mentor', 'career_advisor'
      ];
    } else if (roles.includes('private_sector_recruiter')) {
      // Recruiters can contact anyone
      availableRoles = [
        'school_student', 'university_student', 'jobseeker',
        'full_time_employee', 'part_time_employee', 'gig_worker',
        'educational_institution', 'private_sector_recruiter',
        'government_representative', 'parent', 'training_center', 
        'assessment_center', 'mentor', 'career_advisor'
      ];
    }
    // ... similar logic for other roles
    
    return availableRoles;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Communication Center</h2>
        <p className="text-muted-foreground">
          Manage your conversations, notifications, and announcements
        </p>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="messages" className="flex items-center justify-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
            {unreadMessageCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center rounded-full">
                {unreadMessageCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center justify-center">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadNotificationCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center rounded-full">
                {unreadNotificationCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center justify-center">
            <Megaphone className="h-4 w-4 mr-2" />
            Announcements
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages" className="pt-4">
          <Card className="flex flex-col md:flex-row h-[calc(80vh-170px)]">
            <ConversationList 
              selectedConversationId={selectedConversation}
              onSelectConversation={handleConversationSelect}
            />
            <MessageThread 
              conversationId={selectedConversation}
            />
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="pt-4">
          <NotificationPanel />
        </TabsContent>
        
        <TabsContent value="announcements" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Announcements</CardTitle>
              <CardDescription>
                Important updates and announcements from the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Info className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">System Maintenance</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        The system will be undergoing maintenance on Sunday, May 10th, 2025, from 2:00 AM to 5:00 AM GMT.
                      </p>
                      <div className="text-xs text-muted-foreground mt-2">
                        Posted: May 7, 2025
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Megaphone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">New Features Released</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        We've released new messaging and notification features to enhance your communication experience!
                      </p>
                      <div className="text-xs text-muted-foreground mt-2">
                        Posted: May 6, 2025
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessagingCenter;
