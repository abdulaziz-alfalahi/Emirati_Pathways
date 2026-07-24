// Messaging Service for Emirati Journey Platform
// Handles all messaging and communication API calls to the backend.
//
// All calls go through `restClient` (axios) — NOT raw fetch — so that in
// cookie-auth mode they (a) send the auth cookie (withCredentials), (b) attach
// the X-CSRF-TOKEN header required for POST/PUT/DELETE, and (c) do NOT send the
// bogus `Authorization: Bearer cookie_authenticated` placeholder that the raw
// fetch used to send, which the server rejected with 401 "Invalid token"
// (feedback fb_1784884736: "Sending a message does not go through").
import { restClient } from '@/utils/api';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_role?: string;
  content: string;
  message_type: 'text' | 'file' | 'system' | 'application_update';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  created_at: string;
  updated_at?: string;
  read_by: string[];
  is_read: boolean;
  metadata?: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  participant_names?: string[];
  participant_roles?: string[];
  application_id?: string;
  job_id?: string;
  title: string;
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  job_title?: string;
  company_name?: string;
}

export interface CreateConversationData {
  participants: string[];
  application_id?: string;
  job_id?: string;
  title: string;
}

export interface SendMessageData {
  content: string;
  message_type?: 'text' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  metadata?: any;
}

export interface MessagingResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

/** Normalize an axios/other error into a human-readable message. */
function errMsg(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (error instanceof Error ? error.message : 'Unknown error occurred')
  );
}

class MessagingService {
  async getConversations(role?: string): Promise<MessagingResponse> {
    try {
      const res = await restClient.get('/api/communication/conversations', {
        params: role ? { role } : undefined,
      });
      return {
        success: true,
        data: res.data?.data?.conversations || res.data?.data || [],
        message: res.data?.message,
      };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return { success: false, error: errMsg(error) };
    }
  }

  async getConversationById(conversationId: string): Promise<MessagingResponse> {
    try {
      const res = await restClient.get(`/api/communication/conversations/${conversationId}`);
      return { success: true, data: res.data?.data, message: res.data?.message };
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return { success: false, error: errMsg(error) };
    }
  }

  async createConversation(conversationData: CreateConversationData): Promise<MessagingResponse> {
    try {
      const res = await restClient.post('/api/communication/conversations', conversationData);
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message || 'Conversation created successfully',
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: errMsg(error) };
    }
  }

  async deleteConversation(conversationId: string): Promise<MessagingResponse> {
    try {
      const res = await restClient.delete(`/api/communication/conversations/${conversationId}`);
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message || 'Conversation deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return { success: false, error: errMsg(error) };
    }
  }

  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MessagingResponse> {
    try {
      const res = await restClient.get(
        `/api/communication/conversations/${conversationId}/messages`,
        { params: { limit, offset } }
      );
      return {
        success: true,
        data: res.data?.data?.messages || [],
        message: res.data?.message,
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: errMsg(error) };
    }
  }

  async sendMessage(
    conversationId: string,
    messageData: SendMessageData & { sender_role?: string }
  ): Promise<MessagingResponse> {
    try {
      const body: any = { ...messageData, conversation_id: conversationId };
      if (messageData.sender_role) {
        body['sender_role'] = messageData.sender_role;
      }
      const res = await restClient.post('/api/communication/messages', body);
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message || 'Message sent successfully',
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: errMsg(error) };
    }
  }

  async markMessageAsRead(messageId: string): Promise<MessagingResponse> {
    try {
      const res = await restClient.post(`/api/communication/messages/${messageId}/read`);
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message || 'Message marked as read',
      };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: errMsg(error) };
    }
  }

  async markConversationAsRead(conversationId: string): Promise<MessagingResponse> {
    try {
      const res = await restClient.post(`/api/communication/conversations/${conversationId}/read`);
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message || 'Conversation marked as read',
      };
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return { success: false, error: errMsg(error) };
    }
  }

  async getNotifications(): Promise<MessagingResponse> {
    try {
      const res = await restClient.get('/api/communication/notifications');
      return {
        success: true,
        data: res.data?.data?.notifications || [],
        message: res.data?.message,
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: errMsg(error) };
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<MessagingResponse> {
    try {
      const res = await restClient.post(
        `/api/communication/notifications/${notificationId}/read`
      );
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message || 'Notification marked as read',
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: errMsg(error) };
    }
  }

  async searchConversations(query: string): Promise<MessagingResponse> {
    try {
      const res = await restClient.get('/api/communication/conversations/search', {
        params: { q: query },
      });
      return {
        success: true,
        data: res.data?.data?.conversations || [],
        message: res.data?.message,
      };
    } catch (error) {
      console.error('Error searching conversations:', error);
      return { success: false, error: errMsg(error) };
    }
  }

  async uploadFile(file: File): Promise<MessagingResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Let axios set the multipart boundary; restClient adds auth cookie + CSRF.
      const res = await restClient.post('/api/communication/upload', formData);
      return {
        success: true,
        data: res.data?.data,
        message: res.data?.message || 'File uploaded successfully',
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: errMsg(error) };
    }
  }

  // Real-time messaging support (WebSocket would be implemented here)
  async connectToRealTime(_userId: string, _onMessage?: (message: Message) => void): Promise<void> {
    // This would implement WebSocket connection for real-time messaging.
    console.log('Real-time messaging connection would be established here');
  }

  async disconnectFromRealTime(): Promise<void> {
    // This would disconnect from WebSocket.
    console.log('Real-time messaging connection would be closed here');
  }
}

export const messagingService = new MessagingService();
export default messagingService;
