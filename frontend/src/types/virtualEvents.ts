
export interface VirtualEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'career_fair' | 'job_expo' | 'networking_event' | 'workshop' | 'webinar' | 'conference';
  status: 'draft' | 'published' | 'live' | 'completed' | 'cancelled';
  organizer_id: string;
  start_date: string;
  end_date: string;
  timezone: string;
  is_public: boolean;
  max_attendees?: number;
  registration_deadline?: string;
  cover_image_url?: string;
  banner_image_url?: string;
  meeting_platform: string;
  meeting_url?: string;
  meeting_id?: string;
  meeting_password?: string;
  agenda: any[];
  speakers: any[];
  sponsors: any[];
  tags: string[];
  registration_fields: Record<string, any>;
  settings: Record<string, any>;
  analytics_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface VirtualBooth {
  id: string;
  event_id: string;
  company_id: string;
  booth_type: 'company' | 'university' | 'government' | 'training_center' | 'startup';
  title: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  booth_position?: Record<string, any>;
  booth_size: string;
  contact_info: Record<string, any>;
  resources: any[];
  meeting_room_url?: string;
  chat_enabled: boolean;
  video_enabled: boolean;
  is_featured: boolean;
  visitor_count: number;
  lead_count: number;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registration_data: Record<string, any>;
  status: 'registered' | 'confirmed' | 'attended' | 'no_show' | 'cancelled';
  registration_date: string;
  check_in_time?: string;
  check_out_time?: string;
  session_duration: number;
  booths_visited: string[];
  sessions_attended: string[];
  networking_connections: number;
  feedback?: Record<string, any>;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface EventSession {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  session_type: string;
  speaker_id?: string;
  speakers: any[];
  start_time: string;
  end_time: string;
  room_name?: string;
  meeting_url?: string;
  max_attendees?: number;
  current_attendees: number;
  is_recording_enabled: boolean;
  recording_url?: string;
  materials: any[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NetworkingRoom {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  room_type: string;
  max_participants: number;
  current_participants: number;
  meeting_url?: string;
  host_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  topics: string[];
  industry_focus?: string;
  career_level?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NetworkingConnection {
  id: string;
  event_id: string;
  initiator_id: string;
  recipient_id: string;
  connection_type: string;
  room_id?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface BoothVisit {
  id: string;
  booth_id: string;
  visitor_id: string;
  event_registration_id: string;
  visit_start: string;
  visit_end?: string;
  duration_minutes: number;
  interactions: Record<string, any>;
  is_lead: boolean;
  lead_notes?: string;
  follow_up_requested: boolean;
  created_at: string;
}

export interface EventAnalytics {
  id: string;
  event_id: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  dimensions: Record<string, any>;
  recorded_at: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  event_type: VirtualEvent['event_type'];
  start_date: string;
  end_date: string;
  timezone?: string;
  is_public?: boolean;
  max_attendees?: number;
  registration_deadline?: string;
  cover_image_url?: string;
  banner_image_url?: string;
  meeting_platform?: string;
  agenda?: any[];
  speakers?: any[];
  sponsors?: any[];
  tags?: string[];
  registration_fields?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface CreateBoothData {
  company_id: string;
  booth_type: VirtualBooth['booth_type'];
  title: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  booth_size?: string;
  contact_info?: Record<string, any>;
  resources?: any[];
  meeting_room_url?: string;
  chat_enabled?: boolean;
  video_enabled?: boolean;
}

export interface CreateSessionData {
  title: string;
  description?: string;
  session_type?: string;
  speaker_id?: string;
  speakers?: any[];
  start_time: string;
  end_time: string;
  room_name?: string;
  meeting_url?: string;
  max_attendees?: number;
  is_recording_enabled?: boolean;
  materials?: any[];
  tags?: string[];
}
