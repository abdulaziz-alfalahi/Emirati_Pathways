import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ConversationList from './messages/ConversationList';
import MessageThread from './messages/MessageThread';
import { Conversation, Message } from './messages/types';
import { restClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

const Messages: React.FC = () => {
  const { toast } = useToast();
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
      const response = await restClient.get('/api/communication/conversations');
      if (response.data.success && response.data.data) {
        const backendConvs = response.data.data.conversations || [];

        // Map Backend DTO to Frontend Interface
        const mappedConversations: Conversation[] = backendConvs.map((c: any) => {
          // Normalize IDs to strings for comparison
          const currentUserId = String(user.id);
          const participants = (c.participants || []).map(String);

          // Find "other" participant
          const otherId = participants.find((p: string) => p !== currentUserId) || participants[0];
          const otherName = (c.participant_names[otherId] && c.participant_names[otherId] !== 'None None')
            ? c.participant_names[otherId]
            : 'Unknown User/Candidate';

          console.log(`[Messages] Mapping Conv ${c.id}: User=${currentUserId}, Other=${otherId}, Name=${otherName}`);

          return {
            id: c.id,
            participantId: otherId,
            participantName: otherName,
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
          content: m.content,
          timestamp: m.created_at,
          read: m.status === 'read'
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
        message_type: 'text'
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
        <div className="w-full md:w-1/3 border-r">
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
        <div className="w-full md:w-2/3 flex flex-col">
          <MessageThread
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            selectedConversation={selectedConversation}
            conversations={conversations}
            currentUserId={String(user?.id || '')}
            onScheduleInterview={() => {
              toast({
                title: "Redirecting to Scheduler",
                description: "Opening interview scheduler for this candidate...",
              });
              // Navigation logic here
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default Messages;
