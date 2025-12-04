import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Clock,
  Check,
  CheckCheck,
  User,
  Briefcase,
  Building,
  Star,
  Filter,
  Archive,
  Trash2
} from 'lucide-react';
import { messagingService, Conversation, Message } from '@/services/messagingService';
import { useToast } from '@/hooks/use-toast';

const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Mock data for demonstration
  const mockConversations: Conversation[] = [
    {
      id: '1',
      participants: ['user-1', 'recruiter-1'],
      participant_names: ['Ahmed Al Mansouri', 'Sarah Johnson'],
      participant_roles: ['candidate', 'recruiter'],
      application_id: 'app-1',
      job_id: 'job-1',
      title: 'Senior AI Engineer Position',
      last_message: {
        id: 'msg-1',
        conversation_id: '1',
        sender_id: 'recruiter-1',
        sender_name: 'Sarah Johnson',
        sender_role: 'recruiter',
        content: 'Thank you for your application. We would like to schedule an interview.',
        message_type: 'text',
        created_at: '2024-09-15T14:30:00Z',
        read_by: ['recruiter-1'],
        is_read: false
      },
      unread_count: 1,
      created_at: '2024-09-13T10:00:00Z',
      updated_at: '2024-09-15T14:30:00Z',
      is_active: true,
      job_title: 'Senior AI Engineer - D33 and Talent33',
      company_name: 'Dubai Future Foundation'
    },
    {
      id: '2',
      participants: ['user-1', 'recruiter-2'],
      participant_names: ['Ahmed Al Mansouri', 'Mohammed Al Rashid'],
      participant_roles: ['candidate', 'recruiter'],
      application_id: 'app-2',
      job_id: 'job-2',
      title: 'Digital Marketing Manager',
      last_message: {
        id: 'msg-2',
        conversation_id: '2',
        sender_id: 'user-1',
        sender_name: 'Ahmed Al Mansouri',
        sender_role: 'candidate',
        content: 'I am very interested in this opportunity and would love to discuss further.',
        message_type: 'text',
        created_at: '2024-09-14T16:45:00Z',
        read_by: ['user-1', 'recruiter-2'],
        is_read: true
      },
      unread_count: 0,
      created_at: '2024-09-12T14:30:00Z',
      updated_at: '2024-09-14T16:45:00Z',
      is_active: true,
      job_title: 'Digital Marketing Manager',
      company_name: 'Emirates Airlines'
    },
    {
      id: '3',
      participants: ['user-1', 'mentor-1'],
      participant_names: ['Ahmed Al Mansouri', 'Dr. Fatima Al Zahra'],
      participant_roles: ['candidate', 'mentor'],
      title: 'Career Guidance Session',
      last_message: {
        id: 'msg-3',
        conversation_id: '3',
        sender_id: 'mentor-1',
        sender_name: 'Dr. Fatima Al Zahra',
        sender_role: 'mentor',
        content: 'Great progress on your career development! Keep focusing on AI and machine learning skills.',
        message_type: 'text',
        created_at: '2024-09-11T11:20:00Z',
        read_by: ['user-1', 'mentor-1'],
        is_read: true
      },
      unread_count: 0,
      created_at: '2024-09-10T09:00:00Z',
      updated_at: '2024-09-11T11:20:00Z',
      is_active: true
    }
  ];

  const mockMessages: { [key: string]: Message[] } = {
    '1': [
      {
        id: 'msg-1-1',
        conversation_id: '1',
        sender_id: 'user-1',
        sender_name: 'Ahmed Al Mansouri',
        sender_role: 'candidate',
        content: 'Hello, I submitted my application for the Senior AI Engineer position. I am very excited about this opportunity to contribute to D33 and Talent33.',
        message_type: 'text',
        created_at: '2024-09-13T10:15:00Z',
        read_by: ['user-1', 'recruiter-1'],
        is_read: true
      },
      {
        id: 'msg-1-2',
        conversation_id: '1',
        sender_id: 'recruiter-1',
        sender_name: 'Sarah Johnson',
        sender_role: 'recruiter',
        content: 'Hello Ahmed! Thank you for your application. Your background in AI and machine learning is impressive. We would like to schedule an interview with you.',
        message_type: 'text',
        created_at: '2024-09-15T14:30:00Z',
        read_by: ['recruiter-1'],
        is_read: false
      }
    ],
    '2': [
      {
        id: 'msg-2-1',
        conversation_id: '2',
        sender_id: 'recruiter-2',
        sender_name: 'Mohammed Al Rashid',
        sender_role: 'recruiter',
        content: 'Hi Ahmed, we received your application for the Digital Marketing Manager position. Could you tell us more about your experience with UAE market?',
        message_type: 'text',
        created_at: '2024-09-12T15:00:00Z',
        read_by: ['user-1', 'recruiter-2'],
        is_read: true
      },
      {
        id: 'msg-2-2',
        conversation_id: '2',
        sender_id: 'user-1',
        sender_name: 'Ahmed Al Mansouri',
        sender_role: 'candidate',
        content: 'I am very interested in this opportunity and would love to discuss further. I have 3 years of experience in digital marketing in the UAE, specifically with tourism and hospitality sectors.',
        message_type: 'text',
        created_at: '2024-09-14T16:45:00Z',
        read_by: ['user-1', 'recruiter-2'],
        is_read: true
      }
    ]
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await messagingService.getConversations();

      if (response.success) {
        setConversations(response.data || []);
      } else {
        // Use mock data if API fails
        setConversations(mockConversations);
        console.log('Using mock data for conversations');
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Use mock data as fallback
      setConversations(mockConversations);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await messagingService.getConversationMessages(conversationId);

      if (response.success) {
        setMessages(response.data || []);
      } else {
        // Use mock data if API fails
        setMessages(mockMessages[conversationId] || []);
        console.log('Using mock data for messages');
      }

      // Mark conversation as read
      await messagingService.markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Use mock data as fallback
      setMessages(mockMessages[conversationId] || []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const response = await messagingService.sendMessage(selectedConversation.id, {
        content: newMessage.trim(),
        message_type: 'text'
      });

      if (response.success) {
        // Add message to local state immediately for better UX
        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          conversation_id: selectedConversation.id,
          sender_id: 'current-user',
          sender_name: 'You',
          sender_role: 'candidate',
          content: newMessage.trim(),
          message_type: 'text',
          created_at: new Date().toISOString(),
          read_by: ['current-user'],
          is_read: true
        };

        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');

        toast({
          title: "Message Sent",
          description: "Your message has been sent successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-AE', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-AE', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'recruiter': return <Briefcase className="h-3 w-3" />;
      case 'mentor': return <Star className="h-3 w-3" />;
      case 'employer': return <Building className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'recruiter': return 'bg-blue-100 text-blue-800';
      case 'mentor': return 'bg-purple-100 text-purple-800';
      case 'employer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participant_names?.some(name =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">💬 Messages</h1>
              <p className="text-xl opacity-90">Connect with recruiters, mentors, and career advisors</p>
            </div>
            <Button
              onClick={() => setShowNewConversation(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Message
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Conversations</CardTitle>
                  <Badge variant="secondary">
                    {conversations.filter(c => c.unread_count > 0).length} unread
                  </Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  {isLoading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading conversations...</p>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-4 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">No conversations found</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation)}
                          className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 transition-colors ${selectedConversation?.id === conversation.id
                              ? 'bg-blue-50 border-l-blue-500'
                              : 'border-l-transparent'
                            }`}
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {getInitials(conversation.participant_names?.[1] || 'Unknown')}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium truncate">
                                    {conversation.participant_names?.[1] || 'Unknown'}
                                  </p>
                                  {conversation.participant_roles?.[1] && (
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getRoleColor(conversation.participant_roles[1])}`}
                                    >
                                      <div className="flex items-center space-x-1">
                                        {getRoleIcon(conversation.participant_roles[1])}
                                        <span>{conversation.participant_roles[1]}</span>
                                      </div>
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1">
                                  {conversation.unread_count > 0 && (
                                    <Badge className="bg-red-500 text-white text-xs">
                                      {conversation.unread_count}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {formatTime(conversation.updated_at)}
                                  </span>
                                </div>
                              </div>

                              <p className="text-sm text-gray-600 truncate mt-1">
                                {conversation.job_title || conversation.title}
                              </p>

                              {conversation.last_message && (
                                <p className="text-xs text-gray-500 truncate mt-1">
                                  {conversation.last_message.sender_name}: {conversation.last_message.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Messages View */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-full flex flex-col">
                {/* Conversation Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(selectedConversation.participant_names?.[1] || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {selectedConversation.participant_names?.[1] || 'Unknown'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedConversation.job_title || selectedConversation.title}
                        </p>
                        {selectedConversation.company_name && (
                          <p className="text-xs text-gray-500">
                            {selectedConversation.company_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700"
                        onClick={() => {
                          toast({
                            title: "Redirecting",
                            description: "Opening interview scheduler...",
                          });
                          // Navigate to the interview scheduler
                          window.location.href = '/recruiter/interviews/schedule';
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule Interview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <Separator />

                {/* Messages */}
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === 'current-user' || message.sender_name === 'You'
                              ? 'justify-end'
                              : 'justify-start'
                            }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender_id === 'current-user' || message.sender_name === 'You'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                              }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs opacity-70">
                                {formatTime(message.created_at)}
                              </span>
                              {message.sender_id === 'current-user' || message.sender_name === 'You' ? (
                                <div className="flex items-center space-x-1">
                                  {message.is_read ? (
                                    <CheckCheck className="h-3 w-3 opacity-70" />
                                  ) : (
                                    <Check className="h-3 w-3 opacity-70" />
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                <Separator />

                {/* Message Input */}
                <div className="p-4">
                  <div className="flex items-end space-x-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        rows={1}
                        className="resize-none"
                      />
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p className="text-gray-600 mb-6">
                    Choose a conversation from the list to start messaging
                  </p>
                  <Button onClick={() => setShowNewConversation(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Conversation
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;

