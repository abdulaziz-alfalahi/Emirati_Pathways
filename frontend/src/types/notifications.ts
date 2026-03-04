
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  link?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  type?: 'info' | 'warning' | 'success' | 'urgent';
  is_read?: boolean;
}
