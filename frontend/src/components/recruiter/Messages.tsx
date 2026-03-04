import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import ConversationList from './messages/ConversationList';
import MessageThread from './messages/MessageThread';
import { Conversation, Message, Attachment } from './messages/types';
import { restClient } from '@/utils/api';
import { messagingService } from '@/services/messagingService';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { Plus, Send, Search, X, Loader2 } from 'lucide-react';

interface PlatformUser {
  id: string | number;
  full_name?: string;
  name?: string;
  email: string;
  role?: string;
}

interface MessagesProps {
  senderRole?: string;
  showNewConversation?: boolean;
}

const Messages: React.FC<MessagesProps> = ({ senderRole = 'recruiter', showNewConversation = false }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = String(user?.id || '');
  const { socket } = useNotifications();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const selectedConversationRef = useRef<string | null>(null);

  // ─── Typing indicator state ──────────
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingEmitRef = useRef<number>(0);

  // ─── File attachment state ──────────
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // ─── Pagination state ──────────
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ─── New Conversation dialog state ──────────
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [foundUsers, setFoundUsers] = useState<PlatformUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [newInitialMsg, setNewInitialMsg] = useState('');
  const [creatingConv, setCreatingConv] = useState(false);

  // ─── Mobile responsive state ──────────
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');

  // Auto-select conversation from URL if present
  useEffect(() => {
    const conversationIdParam = searchParams.get('conversationId');
    if (conversationIdParam && conversationIdParam !== selectedConversation) {
      setSelectedConversation(conversationIdParam);
      selectedConversationRef.current = conversationIdParam;
      setIsLoading(true);
      fetchMessages(conversationIdParam).finally(() => setIsLoading(false));
    }
  }, [searchParams]);

  // Fetch Conversations
  const fetchConversations = async () => {
    if (!user) return;
    try {
      console.log('Fetching conversations for user:', user?.id);
      const response = await restClient.get('/api/communication/conversations', {
        params: { role: senderRole }
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
    // Fallback poll for conversation list (socket handles real-time updates)
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch Messages when conversation selected
  const fetchMessages = async (convId: string) => {
    try {
      const response = await restClient.get(`/api/communication/conversations/${convId}/messages`);
      if (response.data.success) {
        const backendMsgs = response.data.data.messages;
        const mappedMsgs: Message[] = backendMsgs.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: (m.sender_name && m.sender_name !== 'None None') ? m.sender_name : 'User',
          recipientId: m.recipient_id,
          recipientName: '',
          content: m.content || '',
          timestamp: m.created_at,
          read: m.status === 'read',
          status: m.status || 'sent',
          readAt: m.read_at || undefined,
          messageType: m.message_type || 'text',
          metadata: (typeof m.metadata === 'string')
            ? (function () { try { return JSON.parse(m.metadata); } catch (e) { return {}; } })()
            : (m.metadata || {}),
          attachments: m.attachments || (() => {
            const meta = (typeof m.metadata === 'string') ? (() => { try { return JSON.parse(m.metadata); } catch { return {}; } })() : (m.metadata || {});
            return meta.attachments || undefined;
          })()
        }));
        setMessages(mappedMsgs);
        setHasMore(response.data.data.has_more || false);
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  // Load older messages (infinite scroll)
  const loadOlderMessages = async () => {
    if (!selectedConversation || loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldestTimestamp = messages[0]?.timestamp;
      const response = await restClient.get(
        `/api/communication/conversations/${selectedConversation}/messages`,
        { params: { before: oldestTimestamp, limit: 30 } }
      );
      if (response.data.success) {
        const backendMsgs = response.data.data.messages;
        const olderMsgs: Message[] = backendMsgs.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: (m.sender_name && m.sender_name !== 'None None') ? m.sender_name : 'User',
          recipientId: m.recipient_id,
          recipientName: '',
          content: m.content || '',
          timestamp: m.created_at,
          read: m.status === 'read',
          status: m.status || 'sent',
          readAt: m.read_at || undefined,
          messageType: m.message_type || 'text',
          metadata: (typeof m.metadata === 'string')
            ? (function () { try { return JSON.parse(m.metadata); } catch (e) { return {}; } })()
            : (m.metadata || {}),
          attachments: m.attachments || (() => {
            const meta = (typeof m.metadata === 'string') ? (() => { try { return JSON.parse(m.metadata); } catch { return {}; } })() : (m.metadata || {});
            return meta.attachments || undefined;
          })()
        }));
        setMessages(prev => [...olderMsgs, ...prev]);
        setHasMore(response.data.data.has_more || false);
      }
    } catch (error) {
      console.error("Failed to load older messages", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle Select — also marks conversation as read
  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    selectedConversationRef.current = conversationId;
    setMobileView('thread');
    setIsTyping(false);
    setPendingAttachments([]);
    setIsLoading(true);
    try {
      await fetchMessages(conversationId);
      // Mark all messages in this conversation as read
      await restClient.post(`/api/communication/conversations/${conversationId}/read`);
      // Update local unread count
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Keep ref in sync with selected conversation
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // ─── Real-time Socket.IO listener ──────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      const { message: msgData, conversation_id: convId } = data;
      if (!msgData) return;

      // Map backend message to frontend Message type
      const mapped: Message = {
        id: msgData.id,
        senderId: msgData.sender_id,
        senderName: (msgData.sender_name && msgData.sender_name !== 'None None') ? msgData.sender_name : 'User',
        recipientId: msgData.recipient_id,
        recipientName: '',
        content: msgData.content || '',
        timestamp: msgData.created_at,
        status: msgData.status || 'sent',
        readAt: msgData.read_at || undefined,
        attachments: msgData.attachments || (() => {
          const meta = (typeof msgData.metadata === 'string') ? (() => { try { return JSON.parse(msgData.metadata); } catch { return {}; } })() : (msgData.metadata || {});
          return meta.attachments || undefined;
        })(),
        read: msgData.status === 'read',
        messageType: msgData.message_type || 'text',
        metadata: (typeof msgData.metadata === 'string')
          ? (() => { try { return JSON.parse(msgData.metadata); } catch { return {}; } })()
          : (msgData.metadata || {})
      };

      // If this message belongs to the currently active conversation, append it
      if (convId === selectedConversationRef.current) {
        setMessages(prev => {
          // Prevent duplicates (in case HTTP response + socket both arrive)
          if (prev.some(m => m.id === mapped.id)) return prev;
          return [...prev, mapped];
        });
      }

      // Always refresh conversation list to update last message preview & ordering
      fetchConversations();
    };

    // ─── Typing indicator listener ──────────
    const handleTypingEvent = (data: any) => {
      if (data.conversation_id === selectedConversationRef.current &&
        String(data.user_id) !== userId) {
        setIsTyping(true);
        setTypingUserName(data.user_name || '');
        // Clear typing after 3s of no events
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    // ─── Read receipt listener ──────────
    const handleMessageRead = (data: any) => {
      if (data.conversation_id === selectedConversationRef.current) {
        setMessages(prev => prev.map(m =>
          m.id === data.message_id || data.all
            ? { ...m, status: 'read' as const, read: true, readAt: data.read_at }
            : m
        ));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing', handleTypingEvent);
    socket.on('message_read', handleMessageRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing', handleTypingEvent);
      socket.off('message_read', handleMessageRead);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket]); // Only depends on socket instance

  // Fallback polling for active conversation (in case socket disconnects)
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    if (selectedConversation) {
      pollingRef.current = setInterval(() => {
        fetchMessages(selectedConversation);
      }, 30000); // 30s fallback (socket handles real-time)
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedConversation]);

  // ─── Emit typing event (debounced) ──────────
  const emitTyping = useCallback(() => {
    if (!socket?.connected || !selectedConversation) return;
    const now = Date.now();
    if (now - lastTypingEmitRef.current < 2000) return; // Debounce 2s
    lastTypingEmitRef.current = now;
    socket.emit('typing', {
      conversation_id: selectedConversation,
      user_id: userId,
      user_name: user?.full_name || 'Someone',
    });
  }, [socket, selectedConversation, userId, user]);

  // ─── File upload handler ──────────
  const handleAttachFiles = async (files: FileList) => {
    setUploadingFiles(true);
    try {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        try {
          const res = await restClient.post('/api/communication/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (res.data.success && res.data.data) {
            newAttachments.push(res.data.data);
          }
        } catch (err) {
          console.error('File upload failed:', err);
          toast({ title: 'Upload Error', description: `Failed to upload ${files[i].name}`, variant: 'destructive' });
        }
      }
      setPendingAttachments(prev => [...prev, ...newAttachments]);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Send Message
  const handleSendMessage = async () => {
    const hasContent = newMessage.trim() || pendingAttachments.length > 0;
    if (!hasContent || !selectedConversation || !user) return;

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    // ── Optimistic UI: show message immediately ──
    const tempId = `_opt_${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      senderId: String(user.id),
      senderName: (user as any).full_name || (user as any).name || user.email || 'You',
      recipientId: conversation.participantId,
      recipientName: conversation.participantName,
      content: newMessage || (pendingAttachments.length > 0 ? `📎 ${pendingAttachments.map(a => a.filename).join(', ')}` : ''),
      timestamp: new Date().toISOString(),
      read: false,
      status: 'sent',
      attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
      _optimistic: true,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    const savedMessage = newMessage;
    const savedAttachments = [...pendingAttachments];
    setNewMessage('');
    setPendingAttachments([]);

    try {
      const metadata: any = {};
      if (savedAttachments.length > 0) {
        metadata.attachments = savedAttachments;
      }

      const payload = {
        recipient_id: conversation.participantId,
        content: savedMessage || (savedAttachments.length > 0 ? `📎 ${savedAttachments.map(a => a.filename).join(', ')}` : ''),
        conversation_id: selectedConversation,
        message_type: 'text',
        sender_role: senderRole,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };

      const response = await restClient.post('/api/communication/messages', payload);
      if (response.data.success) {
        // Replace optimistic message with real one from server
        const realMsg = response.data.data?.message;
        if (realMsg) {
          setMessages(prev => prev.map(m => m.id === tempId ? {
            ...m,
            id: realMsg.id || m.id,
            _optimistic: false,
          } : m));
        } else {
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _optimistic: false } : m));
        }
        // Socket event will handle conversation list refresh
        if (!socket?.connected) {
          fetchMessages(selectedConversation);
          fetchConversations();
        }
      }
    } catch (error) {
      // Mark as failed so UI shows retry indicator
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _optimistic: false, _failed: true } : m));
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

  // ─── Recent contacts (from existing conversations) ──────────
  const recentContacts: PlatformUser[] = React.useMemo(() => {
    const seen = new Set<string>();
    return conversations
      .filter(c => c.participantId && String(c.participantId) !== userId)
      .map(c => ({
        id: c.participantId,
        full_name: c.participantName,
        email: '',
        role: c.participantRole || 'user',
      }))
      .filter(u => { if (seen.has(String(u.id))) return false; seen.add(String(u.id)); return true; })
      .slice(0, 8);
  }, [conversations, userId]);

  // ─── User search for new conversation ──────────
  useEffect(() => {
    if (!showNewConversation) return;
    // Show recent contacts when search is empty
    if (userSearch.length < 2) { setFoundUsers(recentContacts); return; }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await restClient.get('/api/admin/users', {
          params: { search: userSearch, per_page: 10, page: 1 },
        });
        const users: PlatformUser[] =
          (res as any)?.data?.data?.users ||
          (res as any)?.data?.users ||
          (res as any)?.users ||
          [];
        setFoundUsers(users.filter((u: PlatformUser) => String(u.id) !== userId));
      } catch { setFoundUsers([]); }
      finally { setSearchingUsers(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch, userId, showNewConversation, recentContacts]);

  // ─── Create new conversation ──────────────────
  const handleCreateConversation = async () => {
    if (!selectedUser || !newInitialMsg.trim()) return;
    setCreatingConv(true);
    try {
      const convRes = await messagingService.createConversation({
        participants: [userId, String(selectedUser.id)],
        title: newSubject || `${senderRole === 'administrator' ? 'Admin' : 'Message'} → ${selectedUser.full_name || selectedUser.name || selectedUser.email}`,
      });
      if (convRes.success && convRes.data?.id) {
        await messagingService.sendMessage(convRes.data.id, {
          content: newInitialMsg.trim(),
          message_type: 'text',
          sender_role: senderRole,
        });
        setShowNewDialog(false);
        setSelectedUser(null);
        setNewSubject('');
        setNewInitialMsg('');
        setUserSearch('');
        setFoundUsers([]);
        await fetchConversations();
        setSelectedConversation(convRes.data.id);
        selectedConversationRef.current = convRes.data.id;
        fetchMessages(convRes.data.id);
        toast({ title: 'Conversation created', description: 'Your message has been sent.' });
      }
    } catch (e) {
      console.error('Create conversation failed', e);
      toast({ title: 'Error', description: 'Failed to create conversation.', variant: 'destructive' });
    } finally {
      setCreatingConv(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-muted-foreground">Communicate with candidates and team members</p>
        </div>
        {showNewConversation && (
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Message
          </Button>
        )}
      </div>

      {/* ── New Conversation dialog ────────────── */}
      {showNewConversation && showNewDialog && (
        <Card className="p-4 space-y-4 border-primary/30 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">New Conversation</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowNewDialog(false); setSelectedUser(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Recipient search */}
          {!selectedUser ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{userSearch.length < 2 ? 'Recent contacts' : 'Search results'}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="pl-9 h-9"
                  autoFocus
                />
              </div>
              {searchingUsers && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Searching…</p>}
              {foundUsers.length > 0 && (() => {
                // Group users by role
                const grouped: Record<string, PlatformUser[]> = {};
                foundUsers.forEach(u => {
                  const roleLabel = u.role === 'recruiter' ? 'Recruiters'
                    : u.role === 'administrator' || u.role === 'admin' ? 'Admins'
                      : u.role === 'hr_manager' ? 'HR Managers'
                        : 'Candidates';
                  (grouped[roleLabel] = grouped[roleLabel] || []).push(u);
                });
                return (
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {Object.entries(grouped).map(([role, users]) => (
                      <div key={role}>
                        <div className="px-3 py-1.5 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky top-0">{role}</div>
                        {users.map(u => (
                          <button
                            key={String(u.id)}
                            className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2 border-t border-transparent"
                            onClick={() => { setSelectedUser(u); setUserSearch(''); setFoundUsers([]); }}
                          >
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                              {(u.full_name || u.name || '?')?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{u.full_name || u.name || 'User'}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.role?.replace('_', ' ') || 'User'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-accent/50 rounded-md px-3 py-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                {(selectedUser.full_name || selectedUser.name || '?')?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{selectedUser.full_name || selectedUser.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{selectedUser.role?.replace('_', ' ') || 'User'}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedUser(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Subject (optional)</label>
            <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="e.g. Application follow-up" className="h-9" />
          </div>

          {/* Initial message */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Message</label>
            <textarea
              value={newInitialMsg}
              onChange={e => setNewInitialMsg(e.target.value)}
              placeholder="Type your message…"
              rows={3}
              className="w-full border rounded-md p-2 text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowNewDialog(false); setSelectedUser(null); }}>Cancel</Button>
            <Button size="sm" disabled={!selectedUser || !newInitialMsg.trim() || creatingConv} onClick={handleCreateConversation}>
              {creatingConv ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Send
            </Button>
          </div>
        </Card>
      )}

      <Card className="flex flex-col md:flex-row h-[calc(100vh-200px)] md:h-[600px]">
        {/* Conversations list - hidden on mobile when viewing a thread */}
        <div className={`w-full md:w-1/3 lg:w-1/4 border-r ${mobileView === 'thread' ? 'hidden md:block' : ''}`}>
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>

        {/* Message thread - hidden on mobile when viewing the list */}
        <div className={`w-full md:w-2/3 lg:w-1/2 flex flex-col ${mobileView === 'list' ? 'hidden md:flex' : ''}`}>
          <MessageThread
            messages={messages}
            newMessage={newMessage}
            setNewMessage={(val) => { setNewMessage(val); emitTyping(); }}
            handleSendMessage={handleSendMessage}
            selectedConversation={selectedConversation}
            conversations={conversations}
            currentUserId={String(user?.id || '')}
            isTyping={isTyping}
            typingUserName={typingUserName}
            pendingAttachments={pendingAttachments}
            onAttachFiles={handleAttachFiles}
            onRemoveAttachment={handleRemoveAttachment}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadOlderMessages}
            onScheduleInterview={(senderRole === 'recruiter' || senderRole === 'hr_manager') ? (() => {
              if (selectedConversation) {
                const conv = conversations.find(c => c.id === selectedConversation);
                if (conv) {
                  const dashboardPath = user?.role === 'recruiter' ? '/recruiter' : '/hr-dashboard';
                  navigate(`${dashboardPath}?tab=interviews&candidateId=${conv.participantId}`);
                }
              }
            }) : undefined}
            onBack={() => { setMobileView('list'); setSelectedConversation(null); }}
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
