
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
  status?: 'sent' | 'delivered' | 'read';
  readAt?: string;
  attachments?: Attachment[];
  metadata?: any;
  _optimistic?: boolean;
  _failed?: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  jobTitle?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}
