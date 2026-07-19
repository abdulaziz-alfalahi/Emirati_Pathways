import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ConversationList from './messages/ConversationList';
import MessageThread from './messages/MessageThread';
import EmptyConversation from './messages/EmptyConversation';
import { Conversation, Message } from './messages/types';
import { restClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/components/notifications/NotificationSystem';

const Messages: React.FC = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { socket } = useNotifications();
    const [searchParams] = useSearchParams();
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const selectedConversationRef = useRef<string | null>(null);

    // Fetch Conversations
    const fetchConversations = async () => {
        if (!user) return;
        try {
            const response = await restClient.get('/api/communication/conversations', {
                params: { role: 'candidate' }
            });
            if (response.data.success) {
                const backendConvs = response.data.data.conversations;

                const mappedConversations: Conversation[] = backendConvs.map((c: any) => {
                    const otherId = c.participants.find((p: string) => p !== String(user.id)) || c.participants[0];
                    const otherName = c.participant_names[otherId] || t('Unknown User', 'مستخدم مجهول');

                    return {
                        id: c.id,
                        participantId: otherId,
                        participantName: otherName,
                        jobTitle: c.job_title || c.title || t('Job Application', 'طلب توظيف'),
                        lastMessage: c.last_message_content || t('No messages yet', 'لا توجد رسائل بعد'),
                        lastMessageTime: c.last_message_at || c.created_at,
                        unreadCount: c.unread_count || 0
                    };
                });
                setConversations(mappedConversations);
            }
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 30000); // 30s fallback
        return () => clearInterval(interval);
    }, [user]);

    // Deep-link: auto-select conversation from URL
    useEffect(() => {
        const convIdParam = searchParams.get('conversationId') || searchParams.get('conversation');
        if (convIdParam && convIdParam !== selectedConversation) {
            setSelectedConversation(convIdParam);
            selectedConversationRef.current = convIdParam;
            setIsLoading(true);
            fetchMessages(convIdParam).finally(() => setIsLoading(false));
        }
    }, [searchParams]);

    // Fetch Messages
    const fetchMessages = async (convId: string) => {
        try {
            const response = await restClient.get(`/api/communication/conversations/${convId}/messages`);
            if (response.data.success) {
                const backendMsgs = response.data.data.messages;
                const mappedMsgs: Message[] = backendMsgs.map((m: any) => ({
                    id: m.id,
                    senderId: m.sender_id,
                    senderName: (m.sender_name && m.sender_name !== 'None None') ? m.sender_name : t('Recruiter', 'مسؤول توظيف'),
                    recipientId: m.recipient_id,
                    recipientName: '',
                    content: m.content,
                    timestamp: m.created_at,
                    read: m.status === 'read',
                    status: m.status || 'sent',
                    readAt: m.read_at || undefined,
                    metadata: (typeof m.metadata === 'string') ? (() => { try { return JSON.parse(m.metadata); } catch { return {}; } })() : (m.metadata || {}),
                    attachments: m.attachments || (() => {
                        const meta = (typeof m.metadata === 'string') ? (() => { try { return JSON.parse(m.metadata); } catch { return {}; } })() : (m.metadata || {});
                        return meta.attachments || undefined;
                    })()
                }));
                setMessages(mappedMsgs);
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const handleSelectConversation = (conversationId: string) => {
        setSelectedConversation(conversationId);
        selectedConversationRef.current = conversationId;
        setIsLoading(true);
        fetchMessages(conversationId).finally(() => setIsLoading(false));

        // Mark all messages in this conversation as read
        restClient.post(`/api/communication/conversations/${conversationId}/read`)
            .catch(err => console.error('Failed to mark as read:', err));
    };

    // Keep ref in sync
    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    // ─── Real-time Socket.IO listener ──────────────
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (data: any) => {
            const { message: msgData, conversation_id: convId } = data;
            if (!msgData) return;

            // If this message belongs to the active conversation, append it
            if (convId === selectedConversationRef.current) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msgData.id)) return prev;
                    const mapped: Message = {
                        id: msgData.id,
                        senderId: msgData.sender_id,
                        senderName: (msgData.sender_name && msgData.sender_name !== 'None None') ? msgData.sender_name : t('Recruiter', 'مسؤول توظيف'),
                        recipientId: msgData.recipient_id,
                        recipientName: '',
                        content: msgData.content || '',
                        timestamp: msgData.created_at,
                        read: msgData.status === 'read',
                        status: msgData.status || 'sent',
                        readAt: msgData.read_at || undefined,
                        metadata: (typeof msgData.metadata === 'string') ? (() => { try { return JSON.parse(msgData.metadata); } catch { return {}; } })() : (msgData.metadata || {}),
                        attachments: msgData.attachments || (() => {
                            const meta = (typeof msgData.metadata === 'string') ? (() => { try { return JSON.parse(msgData.metadata); } catch { return {}; } })() : (msgData.metadata || {});
                            return meta.attachments || undefined;
                        })()
                    };
                    return [...prev, mapped];
                });
            }

            // Refresh conversation list
            fetchConversations();
        };

        socket.on('new_message', handleNewMessage);
        return () => { socket.off('new_message', handleNewMessage); };
    }, [socket]);

    // Fallback polling for active conversation
    useEffect(() => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (selectedConversation) {
            pollingRef.current = setInterval(() => {
                fetchMessages(selectedConversation);
            }, 30000); // 30s fallback
        }
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [selectedConversation]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !user) return;

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
            content: newMessage,
            timestamp: new Date().toISOString(),
            read: false,
            status: 'sent',
            _optimistic: true,
        };

        setMessages(prev => [...prev, optimisticMsg]);
        const savedMessage = newMessage;
        setNewMessage('');

        try {
            const payload = {
                recipient_id: conversation.participantId,
                content: savedMessage,
                conversation_id: selectedConversation,
                message_type: 'text',
                sender_role: 'candidate'
            };

            const response = await restClient.post('/api/communication/messages', payload);
            if (response.data.success) {
                const realMsg = response.data.data?.message;
                if (realMsg) {
                    setMessages(prev => prev.map(m => m.id === tempId ? {
                        ...m, id: realMsg.id || m.id, _optimistic: false,
                    } : m));
                } else {
                    setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _optimistic: false } : m));
                }
                if (!socket?.connected) {
                    fetchMessages(selectedConversation);
                    fetchConversations();
                }
            }
        } catch (error) {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _optimistic: false, _failed: true } : m));
            toast({
                title: t('Error', 'خطأ'),
                description: t('Failed to send.', 'فشل في الإرسال.'),
                variant: 'destructive'
            });
        }
    };

    const handleDeleteConversation = async (conversationId: string) => {
        if (!confirm(t('Are you sure you want to delete this conversation?', 'هل أنت متأكد من حذف هذه المحادثة؟'))) return;

        try {
            // Optimistic update
            const previousConversations = [...conversations];
            setConversations(prev => prev.filter(c => c.id !== conversationId));

            if (selectedConversation === conversationId) {
                setSelectedConversation(null);
                setMessages([]);
            }

            // Backend call
            await restClient.delete(`/api/communication/conversations/${conversationId}`);

            toast({
                title: t('Conversation Deleted', 'تم حذف المحادثة'),
                description: t('Usage logs updated.', 'تم تحديث السجلات.'),
            });
        } catch (error) {
            console.error('Failed to delete conversation', error);
            // Revert on failure (normally) or just show error
            toast({
                title: t('Error', 'خطأ'),
                description: t('Failed to delete conversation.', 'فشل في حذف المحادثة.'),
                variant: 'destructive'
            });
            fetchConversations();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">{t('Your Messages', 'رسائلك')}</h2>
                <p className="text-muted-foreground">{t('Chat with recruiters directly.', 'تحدث مع مسؤولي التوظيف مباشرة.')}</p>
            </div>

            <Card className="flex flex-col md:flex-row h-[600px]">
                <div className="w-full md:w-1/3 border-e">
                    <ConversationList
                        conversations={conversations}
                        selectedConversation={selectedConversation}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onSelectConversation={handleSelectConversation}
                        onDeleteConversation={handleDeleteConversation}
                    />
                </div>

                <div className="w-full md:w-2/3 flex flex-col">
                    {selectedConversation ? (
                        <MessageThread
                            messages={messages}
                            newMessage={newMessage}
                            setNewMessage={setNewMessage}
                            handleSendMessage={handleSendMessage}
                            selectedConversation={selectedConversation}
                            conversations={conversations}
                            currentUserId={String(user?.id || '')}
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
