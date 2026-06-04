/**
 * SupportChatContext — Global state for the user ↔ Call-Center live-chat.
 *
 * Provides:
 *  • startChat(category, message) → creates a live-chat session
 *  • sendMessage(text) → sends a message in the active conversation
 *  • endChat() → ends the active session
 *  • rateChat(n) → rate after session ends
 *  • Socket.IO listeners for live_chat_assigned / live_chat_ended / new_message
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { restClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/components/notifications/NotificationSystem';

/* ── Types ── */
export type ChatStatus = 'idle' | 'waiting' | 'active' | 'ended';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isAgent: boolean;
}

interface SupportChatState {
  status: ChatStatus;
  sessionId: number | null;
  conversationId: string | null;
  agentId: string | null;
  agentName: string | null;
  ticketId: number | null;
  messages: ChatMessage[];
  category: string;
  unreadCount: number;
  rating: number;
}

interface SupportChatActions {
  startChat: (category: string, message: string, contextMeta?: { user_role?: string; current_route?: string; entity_id?: string }) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  endChat: () => Promise<void>;
  rateChat: (rating: number) => Promise<void>;
  resetChat: () => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const initialState: SupportChatState = {
  status: 'idle',
  sessionId: null,
  conversationId: null,
  agentId: null,
  agentName: null,
  ticketId: null,
  messages: [],
  category: 'general',
  unreadCount: 0,
  rating: 0,
};

const SupportChatContext = createContext<(SupportChatState & SupportChatActions) | null>(null);

export const useSupportChat = () => {
  const ctx = useContext(SupportChatContext);
  if (!ctx) throw new Error('useSupportChat must be inside SupportChatProvider');
  return ctx;
};

/* ── Provider ── */
export const SupportChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const notif = useNotifications();
  const socket = notif?.socket ?? null;

  const [state, setState] = useState<SupportChatState>(initialState);
  const [isOpen, setIsOpen] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  /* ── Start Chat ── */
  const startChat = useCallback(async (category: string, message: string, contextMeta?: { user_role?: string; current_route?: string; entity_id?: string }) => {
    if (!user) return;
    setState(prev => ({ ...prev, status: 'waiting', category }));
    try {
      const res = await restClient.post('/api/platform-ops/live-chat/start', {
        category,
        message,
        user_id: user.id,
        user_role: contextMeta?.user_role || user.role || '',
        current_route: contextMeta?.current_route || window.location.pathname,
        entity_id: contextMeta?.entity_id || '',
      });
      const data = res.data;
      setState(prev => ({
        ...prev,
        sessionId: data.session_id,
        conversationId: data.conversation_id,
        agentId: data.agent_id ? String(data.agent_id) : null,
        agentName: data.agent_name || null,
        status: 'waiting',
        messages: message
          ? [{
              id: `init_${Date.now()}`,
              senderId: String(user.id),
              senderName: (user as any).full_name || 'You',
              content: message,
              timestamp: new Date().toISOString(),
              isAgent: false,
            }]
          : [],
      }));
    } catch (err) {
      console.error('Failed to start chat', err);
      setState(prev => ({ ...prev, status: 'idle' }));
    }
  }, [user]);

  /* ── Send Message ── */
  const sendMessage = useCallback(async (text: string) => {
    if (!stateRef.current.conversationId || !user) return;
    const tempMsg: ChatMessage = {
      id: `_tmp_${Date.now()}`,
      senderId: String(user.id),
      senderName: (user as any).full_name || 'You',
      content: text,
      timestamp: new Date().toISOString(),
      isAgent: false,
    };
    setState(prev => ({ ...prev, messages: [...prev.messages, tempMsg] }));
    try {
      await restClient.post('/api/communication/messages', {
        conversation_id: stateRef.current.conversationId,
        recipient_id: stateRef.current.agentId,
        content: text,
        message_type: 'text',
        sender_role: user.role || 'job_seeker',
      });
    } catch (err) {
      console.error('Failed to send chat message', err);
    }
  }, [user]);

  /* ── End Chat ── */
  const endChat = useCallback(async () => {
    if (!stateRef.current.sessionId) return;
    try {
      await restClient.put(
        `/api/platform-ops/live-chat/session/${stateRef.current.sessionId}/end`,
        { ended_by: 'user' }
      );
    } catch (err) {
      console.error('Failed to end chat', err);
    }
    setState(prev => ({ ...prev, status: 'ended' }));
  }, []);

  /* ── Rate Chat ── */
  const rateChat = useCallback(async (rating: number) => {
    if (!stateRef.current.sessionId) return;
    try {
      await restClient.put(
        `/api/platform-ops/live-chat/session/${stateRef.current.sessionId}/rate`,
        { rating }
      );
    } catch (err) {
      console.error('Failed to rate chat', err);
    }
    setState(prev => ({ ...prev, rating }));
  }, []);

  /* ── Reset ── */
  const resetChat = useCallback(() => {
    setState(initialState);
  }, []);

  /* ── Socket.IO Listeners ── */
  useEffect(() => {
    if (!socket) return;

    const handleAssigned = (data: any) => {
      if (stateRef.current.sessionId && data.session_id === stateRef.current.sessionId) {
        setState(prev => ({
          ...prev,
          status: 'active',
          agentId: data.agent_id ? String(data.agent_id) : prev.agentId,
          agentName: data.agent_name || 'Agent',
          conversationId: data.conversation_id || prev.conversationId,
          messages: [
            ...prev.messages,
            {
              id: `sys_${Date.now()}`,
              senderId: 'system',
              senderName: 'System',
              content: `Connected to ${data.agent_name || 'an agent'}`,
              timestamp: new Date().toISOString(),
              isAgent: false,
            },
          ],
        }));
      }
    };

    const handleEnded = (data: any) => {
      if (stateRef.current.sessionId && data.session_id === stateRef.current.sessionId) {
        const ticketId = data.ticket_id || null;
        const endMsg = ticketId
          ? `Chat session has ended. A support ticket #${ticketId} has been created for follow-up. You can track it in your dashboard.`
          : 'Chat session has ended.';
        setState(prev => ({
          ...prev,
          status: 'ended',
          ticketId,
          messages: [
            ...prev.messages,
            {
              id: `sys_end_${Date.now()}`,
              senderId: 'system',
              senderName: 'System',
              content: endMsg,
              timestamp: new Date().toISOString(),
              isAgent: false,
            },
          ],
        }));
      }
    };

    const handleNewMessage = (data: any) => {
      if (!stateRef.current.conversationId) return;
      const { message: msgData, conversation_id: convId } = data;
      if (!msgData) return;
      const myConvId = stateRef.current.conversationId;
      if (convId !== myConvId && String(convId) !== String(myConvId)) return;
      // Don't duplicate own messages
      if (String(msgData.sender_id) === String(user?.id)) return;

      const mapped: ChatMessage = {
        id: msgData.id || `msg_${Date.now()}`,
        senderId: String(msgData.sender_id),
        senderName: msgData.sender_name || 'Agent',
        content: msgData.content || '',
        timestamp: msgData.created_at || new Date().toISOString(),
        isAgent: true,
      };
      setState(prev => {
        if (prev.messages.some(m => m.id === mapped.id)) return prev;
        return {
          ...prev,
          messages: [...prev.messages, mapped],
          unreadCount: prev.unreadCount + (isOpen ? 0 : 1),
        };
      });
    };

    socket.on('live_chat_assigned', handleAssigned);
    socket.on('live_chat_ended', handleEnded);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('live_chat_assigned', handleAssigned);
      socket.off('live_chat_ended', handleEnded);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, user, isOpen]);

  // Clear unread when widget opens
  useEffect(() => {
    if (isOpen) setState(prev => ({ ...prev, unreadCount: 0 }));
  }, [isOpen]);

  return (
    <SupportChatContext.Provider
      value={{
        ...state,
        startChat,
        sendMessage,
        endChat,
        rateChat,
        resetChat,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </SupportChatContext.Provider>
  );
};

export default SupportChatProvider;
