
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  created_at: string;
}

interface SessionChatProps {
  sessionId: string;
  eventId: string;
}

const SessionChat: React.FC<SessionChatProps> = ({ sessionId, eventId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    setupRealtimeSubscription();
    trackAttendance();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      // In a real implementation, this would fetch from a session_messages table
      // For now, we'll simulate with some mock data
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          user_id: 'user1',
          user_name: 'Sarah Ahmed',
          message: 'Great session! Looking forward to the Q&A',
          created_at: new Date().toISOString()
        }
      ];
      setMessages(mockMessages);
      setAttendeeCount(Math.floor(Math.random() * 50) + 10);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    // Set up real-time subscription for chat messages
    const channel = supabase
      .channel(`session-chat-${sessionId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setAttendeeCount(Object.keys(state).length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const trackAttendance = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Track user presence in the session
      const channel = supabase.channel(`session-chat-${sessionId}`);
      await channel.track({
        user_id: user.user.id,
        online_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track attendance:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setIsLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Error",
          description: "You must be logged in to send messages",
          variant: "destructive",
        });
        return;
      }

      // In a real implementation, this would save to a session_messages table
      const message: ChatMessage = {
        id: Date.now().toString(),
        user_id: user.user.id,
        user_name: user.user.user_metadata?.full_name || 'Anonymous',
        user_avatar: user.user.user_metadata?.avatar_url,
        message: newMessage,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      toast({
        title: "Message sent",
        description: "Your message has been sent to the session",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Session Chat</span>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{attendeeCount} attendees</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 py-2">
            {messages.map((message) => (
              <div key={message.id} className="flex space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={message.user_avatar} />
                  <AvatarFallback className="text-xs">
                    {message.user_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium">{message.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString('en-AE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 break-words">{message.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !newMessage.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionChat;
