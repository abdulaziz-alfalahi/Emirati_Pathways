// Messaging Service for Emirati Journey Platform
// Handles all messaging and communication API calls to the backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';

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

class MessagingService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async getConversations(role?: string): Promise<MessagingResponse> {
    try {
      const url = new URL(`${API_BASE_URL}/api/communication/conversations`);
      if (role) {
        url.searchParams.append('role', role);
      }
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch conversations');
      }

      return {
        success: true,
        data: data.data?.conversations || data.data || [], // Handle potential data structure difference
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getConversationById(conversationId: string): Promise<MessagingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/communication/conversations/${conversationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch conversation');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async createConversation(conversationData: CreateConversationData): Promise<MessagingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/communication/conversations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(conversationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create conversation');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Conversation created successfully',
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deleteConversation(conversationId: string): Promise<MessagingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/communication/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete conversation');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Conversation deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MessagingResponse> {
    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/communication/conversations/${conversationId}/messages?${queryParams}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch messages');
      }

      return {
        success: true,
        data: data.data?.messages || [],
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async sendMessage(conversationId: string, messageData: SendMessageData & { sender_role?: string }): Promise<MessagingResponse> {
    try {
      const body: any = {
        ...messageData,
        conversation_id: conversationId
      };

      if (messageData.sender_role) {
        body['sender_role'] = messageData.sender_role;
        // Clean up form messageData if needed, but it's safe to send extra fields usually
      }

      const response = await fetch(
        `${API_BASE_URL}/api/communication/messages`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Message sent successfully',
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async markMessageAsRead(messageId: string): Promise<MessagingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/communication/messages/${messageId}/read`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark message as read');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Message marked as read',
      };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async markConversationAsRead(conversationId: string): Promise<MessagingResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/communication/conversations/${conversationId}/read`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark conversation as read');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Conversation marked as read',
      };
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getNotifications(): Promise<MessagingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/communication/notifications`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notifications');
      }

      return {
        success: true,
        data: data.data?.notifications || [],
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<MessagingResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/communication/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark notification as read');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Notification marked as read',
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async searchConversations(query: string): Promise<MessagingResponse> {
    try {
      const queryParams = new URLSearchParams({ q: query });

      const response = await fetch(
        `${API_BASE_URL}/api/communication/conversations/search?${queryParams}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search conversations');
      }

      return {
        success: true,
        data: data.data?.conversations || [],
        message: data.message,
      };
    } catch (error) {
      console.error('Error searching conversations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async uploadFile(file: File): Promise<MessagingResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/communication/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload file');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'File uploaded successfully',
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Real-time messaging support (WebSocket would be implemented here)
  async connectToRealTime(userId: string, onMessage?: (message: Message) => void): Promise<void> {
    // This would implement WebSocket connection for real-time messaging
    // For now, we'll use polling as a fallback
    console.log('Real-time messaging connection would be established here');
  }

  async disconnectFromRealTime(): Promise<void> {
    // This would disconnect from WebSocket
    console.log('Real-time messaging connection would be closed here');
  }
}

export const messagingService = new MessagingService();
export default messagingService;

