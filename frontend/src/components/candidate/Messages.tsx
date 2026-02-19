import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ConversationList from './messages/ConversationList';
import MessageThread from './messages/MessageThread';
import EmptyConversation from './messages/EmptyConversation';
import { Conversation, Message } from './messages/types';
import { restClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

const Messages: React.FC = () => {
    const { toast } = useToast();
    const { user } = useAuth();
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
        const interval = setInterval(fetchConversations, 15000);
        return () => clearInterval(interval);
    }, [user]);

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
                    read: m.status === 'read'
                }));
                setMessages(mappedMsgs);
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const handleSelectConversation = (conversationId: string) => {
        setSelectedConversation(conversationId);
        setIsLoading(true);
        fetchMessages(conversationId).finally(() => setIsLoading(false));
    };

    useEffect(() => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (selectedConversation) {
            pollingRef.current = setInterval(() => {
                fetchMessages(selectedConversation);
            }, 3000);
        }
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [selectedConversation]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !user) return;

        const conversation = conversations.find(c => c.id === selectedConversation);
        if (!conversation) return;

        try {
            const payload = {
                recipient_id: conversation.participantId,
                content: newMessage,
                conversation_id: selectedConversation,
                message_type: 'text',
                sender_role: 'candidate'
            };

            const response = await restClient.post('/api/communication/messages', payload);
            if (response.data.success) {
                setNewMessage('');
                fetchMessages(selectedConversation);
                fetchConversations();

                toast({
                    title: t('Message Sent', 'تم إرسال الرسالة'),
                    description: t('Sent successfully.', 'تم الإرسال بنجاح.'),
                });
            }
        } catch (error) {
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
