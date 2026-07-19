
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare } from 'lucide-react';
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface MessageThreadProps {
  conversationId: string | null;
}

const MessageThread: React.FC<MessageThreadProps> = ({ conversationId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [participantName, setParticipantName] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to the bottom whenever messages change
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (!conversationId || !user) return;
    
    const fetchMessages = async () => {
      setLoading(true);
      try {
        // First fetch participant name separately
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', conversationId)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile data:', profileError);
        } else {
          setParticipantName(profileData?.full_name || 'Unknown User');
        }
        
        // Then fetch messages separately
        const { data: messageData, error: messageError } = await supabase
          .from('user_messages')
          .select('id, sender_id, recipient_id, message_text, created_at, is_read')
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${conversationId}),and(sender_id.eq.${conversationId},recipient_id.eq.${user.id})`)
          .order('created_at', { ascending: true });
          
        if (messageError) throw messageError;
        
        // Fetch all sender names in a separate query
        const senderIds = Array.from(new Set(messageData?.map(msg => msg.sender_id) || []));
        const { data: senderProfiles, error: sendersError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', senderIds);
          
        if (sendersError) {
          console.error('Error fetching sender profiles:', sendersError);
        }
        
        // Create a map of user IDs to names
        const nameMap: Record<string, string> = {};
        senderProfiles?.forEach(profile => {
          nameMap[profile.id] = profile.full_name || 'Unknown User';
        });
        
        // Transform data to match our interface
        const formattedMessages: Message[] = messageData?.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: nameMap[msg.sender_id] || 'Unknown User',
          recipientId: msg.recipient_id,
          content: msg.message_text,
          timestamp: msg.created_at,
          isRead: msg.is_read
        })) || [];
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Set up a subscription for realtime updates
    const channel = supabase
      .channel('message-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_messages',
        filter: `or(and(sender_id.eq.${user.id},recipient_id.eq.${conversationId}),and(sender_id.eq.${conversationId},recipient_id.eq.${user.id}))`
      }, (payload) => {
        // Add the new message to the state
        fetchMessages();
      })
      .subscribe();
      
    return () => {
      // TODO: Connect to Flask API - supabase.removeChannel(channel);
    };
  }, [conversationId, user]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user.id,
          recipient_id: conversationId,
          message_text: newMessage.trim(),
          is_read: false
        });
        
      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  const shouldShowDate = (currentIndex: number, currentMsg: Message, prevMsg?: Message) => {
    if (currentIndex === 0) return true;
    if (!prevMsg) return false;
    
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.timestamp).toDateString();
    
    return currentDate !== prevDate;
  };

  return (
    <div className="w-full md:w-2/3 flex flex-col h-full">
      {conversationId ? (
        <>
          <CardHeader className="px-6 pb-0">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarFallback>
                  {participantName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{participantName}</CardTitle>
                <CardDescription>
                  Online
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-grow flex flex-col p-0">
            <div className="flex-grow p-6 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => {
                    const isUserMessage = message.senderId === user?.id;
                    const showDate = shouldShowDate(index, message, messages[index - 1]);
                    
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <Badge variant="outline" className="bg-background">
                              {formatDate(message.timestamp)}
                            </Badge>
                          </div>
                        )}
                        <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex ${isUserMessage ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[80%]`}>
                            {!isUserMessage && (
                              <Avatar className="mt-1">
                                <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <div className={`rounded-lg p-3 ${
                                isUserMessage 
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}>
                                {message.content}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 text-end">
                                {formatTime(message.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messageEndRef} />
                </div>
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input 
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </>
      ) : (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No conversation selected</h3>
            <p className="mt-2 text-muted-foreground">
              Select a conversation from the list to start messaging.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageThread;
