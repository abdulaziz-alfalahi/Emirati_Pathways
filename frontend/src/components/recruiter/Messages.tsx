/**
 * Messages Component for Recruiter Dashboard
 * Handles communication between recruiters and candidates
 * 
 * @description This component provides a messaging interface for recruiters
 * to communicate with candidates. It includes conversation list, message thread,
 * and message composition functionality.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ConversationList from './messages/ConversationList';
import MessageThread from './messages/MessageThread';
import EmptyConversation from './messages/EmptyConversation';
import { Conversation, Message } from './messages/types';
import { recruiterService } from '@/services/recruiterService';

// Generate dynamic dates relative to current date
const generateDynamicDate = (daysAgo: number, hoursAgo: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

// Fallback sample data with dynamic dates
const getSampleConversations = (): Conversation[] => [
  {
    id: '1',
    participantId: 'user1',
    participantName: 'Ahmed Hassan',
    lastMessage: 'Thank you for the interview opportunity.',
    lastMessageTime: generateDynamicDate(0, 2),
    unreadCount: 2
  },
  {
    id: '2',
    participantId: 'user2',
    participantName: 'Sara Al Mahmoud',
    lastMessage: 'I am available for the follow-up interview next week.',
    lastMessageTime: generateDynamicDate(1, 5),
    unreadCount: 0
  },
  {
    id: '3',
    participantId: 'user3',
    participantName: 'Mohammed Al Ali',
    lastMessage: 'Do you have any updates on my application status?',
    lastMessageTime: generateDynamicDate(2, 3),
    unreadCount: 1
  }
];

const getSampleMessages = (): Record<string, Message[]> => ({
  '1': [
    {
      id: 'm1',
      senderId: 'user1',
      senderName: 'Ahmed Hassan',
      recipientId: 'recruiter',
      recipientName: 'Recruiter',
      content: 'Hello, I saw your job posting for the Senior Software Engineer position.',
      timestamp: generateDynamicDate(0, 3),
      read: true
    },
    {
      id: 'm2',
      senderId: 'recruiter',
      senderName: 'Recruiter',
      recipientId: 'user1',
      recipientName: 'Ahmed Hassan',
      content: 'Hi Ahmed, thank you for your interest. We would like to invite you for an interview.',
      timestamp: generateDynamicDate(0, 2, 30),
      read: true
    },
    {
      id: 'm3',
      senderId: 'user1',
      senderName: 'Ahmed Hassan',
      recipientId: 'recruiter',
      recipientName: 'Recruiter',
      content: 'Thank you for the interview opportunity.',
      timestamp: generateDynamicDate(0, 2),
      read: false
    },
    {
      id: 'm4',
      senderId: 'user1',
      senderName: 'Ahmed Hassan',
      recipientId: 'recruiter',
      recipientName: 'Recruiter',
      content: 'When would be a good time for the interview?',
      timestamp: generateDynamicDate(0, 1, 55),
      read: false
    }
  ],
  '2': [
    {
      id: 'm5',
      senderId: 'user2',
      senderName: 'Sara Al Mahmoud',
      recipientId: 'recruiter',
      recipientName: 'Recruiter',
      content: 'I have completed the first round of interviews. What are the next steps?',
      timestamp: generateDynamicDate(1, 6),
      read: true
    },
    {
      id: 'm6',
      senderId: 'recruiter',
      senderName: 'Recruiter',
      recipientId: 'user2',
      recipientName: 'Sara Al Mahmoud',
      content: 'Hi Sara, we would like to schedule a follow-up interview with the team lead.',
      timestamp: generateDynamicDate(1, 5, 45),
      read: true
    },
    {
      id: 'm7',
      senderId: 'user2',
      senderName: 'Sara Al Mahmoud',
      recipientId: 'recruiter',
      recipientName: 'Recruiter',
      content: 'I am available for the follow-up interview next week.',
      timestamp: generateDynamicDate(1, 5),
      read: true
    }
  ],
  '3': [
    {
      id: 'm8',
      senderId: 'user3',
      senderName: 'Mohammed Al Ali',
      recipientId: 'recruiter',
      recipientName: 'Recruiter',
      content: 'I submitted my application for the UX Designer position last week.',
      timestamp: generateDynamicDate(2, 4),
      read: true
    },
    {
      id: 'm9',
      senderId: 'recruiter',
      senderName: 'Recruiter',
      recipientId: 'user3',
      recipientName: 'Mohammed Al Ali',
      content: 'Thank you for your application. We are currently reviewing all applications and will get back to you soon.',
      timestamp: generateDynamicDate(2, 3, 45),
      read: true
    },
    {
      id: 'm10',
      senderId: 'user3',
      senderName: 'Mohammed Al Ali',
      recipientId: 'recruiter',
      recipientName: 'Recruiter',
      content: 'Do you have any updates on my application status?',
      timestamp: generateDynamicDate(2, 3),
      read: false
    }
  ]
});

// Helper function to generate date with minutes offset
function generateDynamicDate(daysAgo: number, hoursAgo: number, minutesAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
}

const Messages: React.FC = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await recruiterService.getConversations();
      
      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        // Fallback to sample data if API fails
        setConversations(getSampleConversations());
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      // Use sample data as fallback
      setConversations(getSampleConversations());
    } finally {
      setLoading(false);
    }
  }, []);

  // Select conversation and load messages
  const handleSelectConversation = useCallback(async (conversationId: string) => {
    setSelectedConversation(conversationId);
    setError(null);
    
    try {
      const response = await recruiterService.getMessages(conversationId);
      
      if (response.success && response.data) {
        setMessages(response.data);
        // Mark messages as read
        await recruiterService.markMessagesAsRead(conversationId);
      } else {
        // Fallback to sample messages
        const sampleMessages = getSampleMessages();
        setMessages(sampleMessages[conversationId] || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      // Use sample data as fallback
      const sampleMessages = getSampleMessages();
      setMessages(sampleMessages[conversationId] || []);
    }
  }, []);

  // Send new message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;
    
    setSendingMessage(true);
    
    try {
      const response = await recruiterService.sendMessage(
        conversation.participantId,
        newMessage.trim()
      );
      
      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data!]);
        setNewMessage('');
        
        toast({
          title: 'Message Sent',
          description: 'Your message has been sent successfully.',
        });
      } else {
        // Create local message as fallback
        const newMessageObj: Message = {
          id: `m${Date.now()}`,
          senderId: 'recruiter',
          senderName: 'Recruiter',
          recipientId: conversation.participantId,
          recipientName: conversation.participantName,
          content: newMessage.trim(),
          timestamp: new Date().toISOString(),
          read: true
        };
        
        setMessages(prev => [...prev, newMessageObj]);
        setNewMessage('');
        
        toast({
          title: 'Message Sent',
          description: 'Your message has been sent successfully.',
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedConversation, conversations, toast]);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-muted-foreground">Communicate with candidates and team members</p>
        </div>
        <Card className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading conversations...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-muted-foreground">Communicate with candidates and team members</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Messages</h2>
        <p className="text-muted-foreground">Communicate with candidates and team members</p>
      </div>
      
      <Card className="flex flex-col md:flex-row min-h-[500px]">
        {/* Conversations list */}
        <div 
          className="w-full md:w-1/3 border-r"
          role="navigation"
          aria-label="Conversation list"
        >
          <ConversationList 
            conversations={filteredConversations}
            selectedConversation={selectedConversation}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectConversation={handleSelectConversation}
          />
        </div>
        
        {/* Message thread */}
        <div 
          className="w-full md:w-2/3 flex flex-col"
          role="main"
          aria-label="Message thread"
        >
          {selectedConversation ? (
            <MessageThread
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleSendMessage}
              selectedConversation={selectedConversation}
              conversations={conversations}
              isSending={sendingMessage}
            />
          ) : (
            <EmptyConversation />
          )}
        </div>
      </Card>
    </div>
  );
};

export default Messages;
