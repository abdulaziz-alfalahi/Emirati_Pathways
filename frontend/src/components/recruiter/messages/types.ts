
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: string;
  read: boolean;
  messageType?: string; // 'text' | 'system'
  metadata?: any;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole?: string; // Derived role of the OTHER participant
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}
