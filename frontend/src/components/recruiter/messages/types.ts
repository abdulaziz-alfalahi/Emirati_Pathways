
export interface Attachment {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

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
  status?: 'sent' | 'delivered' | 'read';
  readAt?: string;
  attachments?: Attachment[];
  _optimistic?: boolean; // true while message is being sent
  _failed?: boolean;     // true if send failed
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
