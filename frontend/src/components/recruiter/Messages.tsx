
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ConversationList from './messages/ConversationList';
import MessageThread from './messages/MessageThread';
import EmptyConversation from './messages/EmptyConversation';
import { Conversation, Message } from './messages/types';

const sampleConversations: Conversation[] = [
  {
    id: '1',
    participantId: 'user1',
    participantName: 'Ahmed Hassan',
    lastMessage: 'Thank you for the interview opportunity.',
    lastMessageTime: '2023-06-14T15:30:00',
    unreadCount: 2
  },
  {
    id: '2',
    participantId: 'user2',
    participantName: 'Sara Al Mahmoud',
    lastMessage: 'I am available for the follow-up interview next week.',
    lastMessageTime: '2023-06-13T09:15:00',
    unreadCount: 0
  },
  {
    id: '3',
    participantId: 'user3',
    participantName: 'Mohammed Al Ali',
    lastMessage: 'Do you have any updates on my application status?',
    lastMessageTime: '2023-06-12T14:20:00',
    unreadCount: 1
  }
];

const sampleMessages: Record<string, Message[]> = {
  '1': [
    {
      id: 'm1',
      senderId: 'user1',
      senderName: 'Ahmed Hassan',
      recipientId: 'recruiter',
      recipientName: 'Recruiter',
      content: 'Hello, I saw your job posting for the Senior Software Engineer position.',
      timestamp: '2023-06-14T15:20:00',
      read: true
    },
    {
      id: 'm2',
      senderId: 'recruiter',
      senderName: 'Recruiter',
      recipientId: 'user1',
      recipientName: 'Ahmed Hassan',
      content: 'Hi Ahmed, thank you for your interest. We would like to invite you for an interview.',
      timestamp: '2023-06-14T15:25:00',
      read: true
    },
    {
      id: 'm3',
      senderId: 'user1',
      senderName: 'Ahmed Hassan',
      recipientId: 'recruiter',
      recipientName: 'Recruiter',
      content: 'Thank you for the interview opportunity.',
      timestamp: '2023-06-14T15:30:00',
      read: false
    },
    {
      id: 'm4',
      senderId: 'user1',
      senderName: 'Ahmed Hassan',
      recipientId: 'recruiter',
      recipientName: 'Recruiter',
      content: 'When would be a good time for the interview?',
      timestamp: '2023-06-14T15:31:00',
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
      timestamp: '2023-06-13T09:10:00',
      read: true
    },
    {
      id: 'm6',
      senderId: 'recruiter',
      senderName: 'Recruiter',
      recipientId: 'user2',
      recipientName: 'Sara Al Mahmoud',
      content: 'Hi Sara, we would like to schedule a follow-up interview with the team lead.',
      timestamp: '2023-06-13T09:12:00',
      read: true
    },
    {
      id: 'm7',
      senderId: 'user2',
      senderName: 'Sara Al Mahmoud',
      recipientId: 'recruiter',
      recipientName: 'Recruiter',
      content: 'I am available for the follow-up interview next week.',
      timestamp: '2023-06-13T09:15:00',
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
      timestamp: '2023-06-12T14:15:00',
      read: true
    },
    {
      id: 'm9',
      senderId: 'recruiter',
      senderName: 'Recruiter',
      recipientId: 'user3',
      recipientName: 'Mohammed Al Ali',
      content: 'Thank you for your application. We are currently reviewing all applications and will get back to you soon.',
      timestamp: '2023-06-12T14:18:00',
      read: true
    },
    {
      id: 'm10',
      senderId: 'user3',
      senderName: 'Mohammed Al Ali',
      recipientId: 'recruiter',
      recipientName: 'Recruiter',
      content: 'Do you have any updates on my application status?',
      timestamp: '2023-06-12T14:20:00',
      read: false
    }
  ]
};

const Messages: React.FC = () => {
  const { toast } = useToast();
  const [conversations] = useState<Conversation[]>(sampleConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Select conversation and load messages
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    if (sampleMessages[conversationId]) {
      setMessages(sampleMessages[conversationId]);
    } else {
      setMessages([]);
    }
  };

  // Send new message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;
    
    const newMessageObj: Message = {
      id: `m${Date.now()}`,
      senderId: 'recruiter',
      senderName: 'Recruiter',
      recipientId: conversation.participantId,
      recipientName: conversation.participantName,
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: true
    };
    
    setMessages([...messages, newMessageObj]);
    setNewMessage('');
    
    toast({
      title: 'Message Sent',
      description: 'Your message has been sent successfully.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Messages</h2>
        <p className="text-muted-foreground">Communicate with candidates and team members</p>
      </div>
      
      <Card className="flex flex-col md:flex-row">
        {/* Conversations list */}
        <div className="w-full md:w-1/3 border-r">
          <ConversationList 
            conversations={conversations}
            selectedConversation={selectedConversation}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectConversation={handleSelectConversation}
          />
        </div>
        
        {/* Message thread */}
        <div className="w-full md:w-2/3 flex flex-col">
          {selectedConversation ? (
            <MessageThread
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleSendMessage}
              selectedConversation={selectedConversation}
              conversations={conversations}
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
