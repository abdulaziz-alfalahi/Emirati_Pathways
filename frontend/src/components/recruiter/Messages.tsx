import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ConversationList from './messages/ConversationList';
import MessageThread from './messages/MessageThread';
import { Conversation, Message } from './messages/types';
import { restClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

const Messages: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-select conversation from URL if present
  useEffect(() => {
    const conversationIdParam = searchParams.get('conversationId');
    if (conversationIdParam) {
      setSelectedConversation(conversationIdParam);
    }
  }, [searchParams]);

  // Fetch Conversations
  const fetchConversations = async () => {
    if (!user) return;
    try {
      console.log('Fetching conversations for user:', user?.id);
      const response = await restClient.get('/api/communication/conversations', {
        params: { role: 'recruiter' }
      });
      if (response.data.success && response.data.data) {
        const backendConvs = response.data.data.conversations || [];

        // Map Backend DTO to Frontend Interface
        const mappedConversations: Conversation[] = backendConvs.map((c: any) => {
          // Normalize IDs to strings for comparison
          const currentUserId = String(user.id);
          const participants = (c.participants || []).map(String);

          // Find "other" participant
          const otherId = participants.find((p: string) => p !== currentUserId) || participants[0];

          const pNames = c.participant_names || {};
          const pRoles = c.participant_roles || {};

          const otherName = (pNames[otherId] && pNames[otherId] !== 'None None')
            ? pNames[otherId]
            : 'Unknown User/Candidate';

          const otherRole = (pRoles[otherId])
            ? pRoles[otherId]
            : 'candidate'; // Default to candidate

          console.log(`[Messages] Mapping Conv ${c.id}: User=${currentUserId}, Other=${otherId}, Name=${otherName}, Role=${otherRole}`);

          return {
            id: c.id,
            participantId: otherId,
            participantName: otherName,
            participantRole: otherRole,
            lastMessage: c.last_message_content || 'No messages yet',
            lastMessageTime: c.last_message_at || c.created_at,
            unreadCount: c.unread_count || 0
          };
        });
        setConversations(mappedConversations);
      } else {
        console.warn('Fetch conversations success=false or no data', response.data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);
      toast({
        title: "Network Error",
        description: "Could not load messages. Please try refreshing.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchConversations();
    // Poll for conversation list updates ? Maybe lazily.
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch Messages when conversation selected
  const fetchMessages = async (convId: string) => {
    try {
      const response = await restClient.get(`/api/communication/conversations/${convId}/messages`);
      if (response.data.success) {
        const backendMsgs = response.data.data.messages;
        // Backend Message -> Frontend Message
        // Backend has sender_name.
        const mappedMsgs: Message[] = backendMsgs.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id, // Ensure match with user.id type (string vs number)
          senderName: (m.sender_name && m.sender_name !== 'None None') ? m.sender_name : 'User',
          recipientId: m.recipient_id,
          recipientName: '', // Not used by UI
          content: m.content || '',
          timestamp: m.created_at,
          read: m.status === 'read',
          messageType: m.message_type || 'text',
          metadata: (typeof m.metadata === 'string')
            ? (function () { try { return JSON.parse(m.metadata); } catch (e) { return {}; } })()
            : (m.metadata || {})
        }));
        // Sort oldest to newest for chat UI (Backend already returns oldest first)
        setMessages(mappedMsgs);
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  // Handle Select
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setIsLoading(true);
    fetchMessages(conversationId).finally(() => setIsLoading(false));
  };

  // Polling for active conversation
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    if (selectedConversation) {
      pollingRef.current = setInterval(() => {
        fetchMessages(selectedConversation);
      }, 3000); // 3s polling for chat
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedConversation]);

  // Send Message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    // Optimistic UI update? Or wait for API?
    // Let's wait for API for robustness first.
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    try {
      const payload = {
        recipient_id: conversation.participantId,
        content: newMessage,
        conversation_id: selectedConversation,
        message_type: 'text',
        sender_role: 'recruiter'
      };

      const response = await restClient.post('/api/communication/messages', payload);
      if (response.data.success) {
        setNewMessage('');
        fetchMessages(selectedConversation); // Refresh
        fetchConversations(); // Update list order/snippet

        toast({
          title: 'Message Sent',
          description: 'Your message has been sent successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive'
      });
    }
  };

  // Handle Delete Conversation
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      // Optimistic update
      const previousConversations = [...conversations];
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      await restClient.delete(`/api/communication/conversations/${conversationId}`);

      toast({
        title: "Conversation Deleted",
        description: "The conversation has been removed from your list.",
      });
    } catch (error) {
      console.error("Failed to delete conversation", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive"
      });
      // Re-fetch to restore state if failed
      fetchConversations();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-muted-foreground">Communicate with candidates and team members</p>
        </div>
      </div>

      <Card className="flex flex-col md:flex-row h-[600px]">
        {/* Conversations list */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-r">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>

        {/* Message thread */}
        <div className="w-full md:w-2/3 lg:w-1/2 flex flex-col">
          <MessageThread
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            selectedConversation={selectedConversation}
            conversations={conversations}
            currentUserId={String(user?.id || '')}
            onScheduleInterview={() => {
              if (selectedConversation) {
                const conv = conversations.find(c => c.id === selectedConversation);
                if (conv) {
                  // Navigate to interviews tab with candidateId param
                  // Check role to determine which dashboard to go to
                  const dashboardPath = user?.role === 'recruiter' ? '/recruiter' : '/hr-dashboard';
                  navigate(`${dashboardPath}?tab=interviews&candidateId=${conv.participantId}`);
                }
              }
            }}
          />
        </div>

        {/* Profile Sidebar */}
        {selectedConversation && (
          <div className="hidden lg:block w-1/4 border-l p-4 bg-slate-50">
            {(() => {
              const conv = conversations.find(c => c.id === selectedConversation);
              if (!conv) return null;
              return (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Candidate Profile</h3>
                  <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                    <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-slate-500">
                      {conv.participantName.charAt(0)}
                    </div>
                    <h4 className="font-bold text-lg">{conv.participantName}</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {conv.participantRole === 'recruiter' || conv.participantRole === 'admin'
                        ? 'Team Member'
                        : 'Candidate'}
                    </p>

                    {/* ONLY show profile buttons if it is a candidate */}
                    {(conv.participantRole !== 'recruiter' && conv.participantRole !== 'admin') && (
                      <div className="grid gap-2">
                        <Button className="w-full" variant="outline" onClick={() => navigate(`/candidate-profile/${conv.participantId}`)}>
                          View Full Profile
                        </Button>
                        <Button className="w-full" variant="ghost" onClick={() => navigate(`/candidate-profile/${conv.participantId}`)}>
                          View Application
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Quick Notes / Context Placeholder */}
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h4 className="font-semibold text-sm mb-2">About</h4>
                    <p className="text-xs text-muted-foreground">
                      {(conv.participantRole === 'recruiter' || conv.participantRole === 'admin')
                        ? "Internal team member. View team settings for more details."
                        : "Profile details are loading..."}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Messages;
