import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
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
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { messagingService, Conversation, Message } from '@/services/messagingService';
import { useToast } from '@/hooks/use-toast';

import { useNotifications } from '@/components/notifications/NotificationSystem';
import { useAuth } from '@/context/AuthContext';
import NewConversationDialog from '@/components/messaging/NewConversationDialog';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();

  // Redirect Recruiters to their Dashboard
  if (user?.role === 'recruiter' || user?.user_type === 'recruiter' || user?.role === 'hr_manager' || user?.user_type === 'hr_manager' || user?.role === 'hr_recruiter' || user?.user_type === 'hr_recruiter') {
    return <Navigate to="/recruiter?tab=messages" replace />;
  }

  // --- Existing Candidate View Logic Below ---
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
  const { socket } = useNotifications();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    return '/candidate-dashboard';
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      if (selectedConversation && data.conversation_id === selectedConversation.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
      loadConversations();
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, selectedConversation]);

  const getParticipantName = (conversation: Conversation) => {
    if (Array.isArray(conversation.participant_names)) {
      return conversation.participant_names[1] || 'Unknown';
    }
    if (conversation.participant_names && user?.id) {
      const currentUserId = String(user.id);
      const participants = (conversation.participants || []).map(String);
      const otherId = participants.find(p => p !== currentUserId) || participants[0];
      return conversation.participant_names[otherId] || 'Unknown User';
    }
    return 'Unknown';
  };

  const mockConversations: Conversation[] = [
    {
      id: '1',
      participants: ['user-1', 'recruiter-1'],
      participant_names: { 'user-1': 'Ahmed Al Mansouri', 'recruiter-1': 'Sarah Johnson' } as any,
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
        content: 'Hello, I submitted my application.',
        message_type: 'text',
        created_at: '2024-09-13T10:15:00Z',
        read_by: ['user-1', 'recruiter-1'],
        is_read: true
      }
    ]
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const conversationIdParam = searchParams.get('conversation');
  const userIdParam = searchParams.get('userId');
  const userNameParam = searchParams.get('userName');

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const handleUrlSelection = async () => {
      if (conversationIdParam) {
        const found = conversations.find(c => c.id === conversationIdParam);
        if (found) {
          setSelectedConversation(found);
        } else {
          try {
            const response = await messagingService.getConversationById(conversationIdParam);
            if (response.success && response.data) {
              const newConv = response.data;
              setSelectedConversation(newConv);
              setConversations(prev => {
                if (!prev.some(c => c.id === newConv.id)) {
                  return [newConv, ...prev];
                }
                return prev;
              });
            }
          } catch (error) {
            console.error('Failed to load conversation from URL:', error);
          }
        }
      } else if (userIdParam) {
        const found = conversations.find(c => c.participants && c.participants.includes(userIdParam));
        if (found) {
          setSelectedConversation(found);
        } else {
          try {
            const response = await messagingService.createConversation({
              participants: [userIdParam],
              title: userNameParam ? decodeURIComponent(userNameParam) : 'New Conversation'
            });
            if (response.success && response.data) {
              const newConv = response.data;
              setConversations(prev => [newConv, ...prev]);
              setSelectedConversation(newConv);
              toast({ title: "Conversation Started", description: `New chat started with ${userNameParam || 'User'}` });
            }
          } catch (error) {
            console.error('Failed to create conversation via URL:', error);
          }
        }
      }
    };
    if (!isLoading) {
      handleUrlSelection();
    }
  }, [conversationIdParam, userIdParam, isLoading]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      if (selectedConversation.id !== conversationIdParam) {
        setSearchParams({ conversation: selectedConversation.id });
      }
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await messagingService.getConversations('candidate');
      if (response.success) {
        setConversations(response.data || []);
      } else {
        setConversations(mockConversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations(mockConversations);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Prevent selection
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const response = await messagingService.deleteConversation(conversationId);
      if (response.success) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
        toast({ title: "Deleted", description: "Conversation deleted successfully" });
      } else {
        toast({ title: "Error", description: "Failed to delete conversation", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await messagingService.getConversationMessages(conversationId);
      if (response.success) {
        setMessages(response.data || []);
      } else {
        setMessages(mockMessages[conversationId] || []);
      }
      await messagingService.markConversationAsRead(conversationId);
    } catch (error) {
      setMessages(mockMessages[conversationId] || []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;
    setIsSending(true);
    try {
      const response = await messagingService.sendMessage(selectedConversation.id, {
        content: newMessage.trim(),
        message_type: 'text',
        sender_role: 'candidate'
      });
      if (response.success) {
        // Optimistic
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
        toast({ title: "Message Sent", description: "Your message has been sent successfully." });
      } else {
        toast({ title: "Error", description: response.error || "Failed to send message", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
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
    if (diffDays === 1) return date.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' });
    if (diffDays < 7) return date.toLocaleDateString('en-AE', { weekday: 'short' });
    return date.toLocaleDateString('en-AE', { month: 'short', day: 'numeric' });
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 pl-0 hover:text-white" onClick={() => navigate(getDashboardPath())}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">💬 Messages</h1>
              <p className="text-xl opacity-90">Connect with recruiters, mentors, and career advisors</p>
            </div>
            <Button onClick={() => setShowNewConversation(true)} className="bg-purple-600 hover:bg-purple-700 text-white" size="lg">
              <Plus className="h-5 w-5 mr-2" /> New Message
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Conversations</CardTitle>
                  <Badge variant="secondary">{conversations.filter(c => c.unread_count > 0).length} unread</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search conversations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
                      {filteredConversations.map((conversation) => {
                        const displayName = getParticipantName(conversation);
                        return (
                          <div
                            key={conversation.id}
                            onClick={() => setSelectedConversation(conversation)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 transition-colors ${selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-blue-500' : 'border-l-transparent'}`}
                          >
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-blue-100 text-blue-600">{getInitials(displayName)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium truncate">{displayName}</p>
                                    {conversation.participant_roles?.[1] && (
                                      <Badge variant="outline" className={`text-xs ${getRoleColor(conversation.participant_roles[1])}`}>
                                        <div className="flex items-center space-x-1">
                                          {getRoleIcon(conversation.participant_roles[1])}
                                          <span>{conversation.participant_roles[1]}</span>
                                        </div>
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-red-600" onClick={(e) => handleDeleteConversation(e, conversation.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                    {conversation.unread_count > 0 && <Badge className="bg-red-500 text-white text-xs">{conversation.unread_count}</Badge>}
                                    <span className="text-xs text-gray-500">{formatTime(conversation.updated_at)}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 truncate mt-1">{conversation.job_title || conversation.title}</p>
                                {conversation.last_message && (
                                  <p className="text-xs text-gray-500 truncate mt-1">{conversation.last_message.sender_name}: {conversation.last_message.content}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-100 text-blue-600">{getInitials(getParticipantName(selectedConversation))}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{getParticipantName(selectedConversation)}</h3>
                        <p className="text-sm text-gray-600">{selectedConversation.job_title || selectedConversation.title}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.sender_id === 'current-user' || message.sender_name === 'You' || (user && String(message.sender_id) === String(user.id)) ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender_id === 'current-user' || message.sender_name === 'You' || (user && String(message.sender_id) === String(user.id)) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className={`text-xs ${message.sender_id === 'current-user' || message.sender_name === 'You' || (user && String(message.sender_id) === String(user.id)) ? 'text-blue-100' : 'opacity-70'}`}>
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>
                <Separator />
                <div className="p-4">
                  <div className="flex items-end space-x-2">
                    <Button variant="outline" size="sm"><Paperclip className="h-4 w-4" /></Button>
                    <div className="flex-1">
                      <Textarea placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} rows={1} className="resize-none" />
                    </div>
                    <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending} className="bg-blue-600 hover:bg-blue-700">
                      {isSending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p className="text-gray-600 mb-6">Choose a conversation from the list to start messaging</p>
                  <Button onClick={() => setShowNewConversation(true)}><Plus className="h-4 w-4 mr-2" /> Start New Conversation</Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      <NewConversationDialog open={showNewConversation} onClose={() => setShowNewConversation(false)} onConversationCreated={(conversation) => { setConversations(prev => [conversation, ...prev]); setSelectedConversation(conversation); setShowNewConversation(false); loadMessages(conversation.id); }} />
    </div>
  );
};

export default MessagesPage;
