import type {
  VirtualEvent,
  VirtualBooth,
  EventRegistration,
  EventSession,
  NetworkingRoom,
  NetworkingConnection,
  BoothVisit,
  EventAnalytics,
  CreateEventData,
  CreateBoothData,
  CreateSessionData
} from '@/types/virtualEvents';

export class VirtualEventsService {
  // Event Management
  static async getEvents(filters?: {
    event_type?: string;
    status?: string;
    search?: string;
    upcoming?: boolean;
  }): Promise<VirtualEvent[]> {
    let query = supabase
      .from('virtual_events')
      .select('*')
      .order('start_date', { ascending: true });

    if (filters?.event_type) {
      // Convert string to enum type for filtering
      const eventTypeOptions = ['career_fair', 'job_expo', 'networking_event', 'workshop', 'webinar', 'conference'];
      if (eventTypeOptions.includes(filters.event_type)) {
        query = query.eq('event_type', filters.event_type as 'career_fair' | 'job_expo' | 'networking_event' | 'workshop' | 'webinar' | 'conference');
      }
    }
    if (filters?.status) {
      // Convert string to enum type for filtering
      const statusOptions = ['draft', 'published', 'live', 'completed', 'cancelled'];
      if (statusOptions.includes(filters.status)) {
        query = query.eq('status', filters.status as 'draft' | 'published' | 'live' | 'completed' | 'cancelled');
      }
    }
    if (filters?.upcoming) {
      query = query.gte('start_date', new Date().toISOString());
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(this.transformVirtualEvent);
  }

  static async getEventById(id: string): Promise<VirtualEvent | null> {
    const { data, error } = await supabase
      .from('virtual_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data ? this.transformVirtualEvent(data) : null;
  }

  static async createEvent(eventData: CreateEventData): Promise<VirtualEvent> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('virtual_events')
      .insert({
        organizer_id: user.user.id,
        ...eventData
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformVirtualEvent(data);
  }

  static async updateEvent(id: string, updates: Partial<CreateEventData>): Promise<VirtualEvent> {
    const { data, error } = await supabase
      .from('virtual_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.transformVirtualEvent(data);
  }

  static async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('virtual_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Registration Management
  static async registerForEvent(eventId: string, registrationData?: Record<string, any>): Promise<EventRegistration> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('virtual_event_registrations')
      .insert({
        event_id: eventId,
        user_id: user.user.id,
        registration_data: registrationData || {}
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformEventRegistration(data);
  }

  static async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    const { data, error } = await supabase
      .from('virtual_event_registrations')
      .select(`
        *,
        profiles(id, full_name, email, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('registration_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformEventRegistration);
  }

  static async getUserRegistration(eventId: string): Promise<EventRegistration | null> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data, error } = await supabase
      .from('virtual_event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.user.id)
      .single();

    if (error) return null;
    return data ? this.transformEventRegistration(data) : null;
  }

  static async checkInToEvent(eventId: string): Promise<void> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('virtual_event_registrations')
      .update({
        check_in_time: new Date().toISOString(),
        status: 'attended'
      })
      .eq('event_id', eventId)
      .eq('user_id', user.user.id);

    if (error) throw error;
  }

  // Booth Management
  static async createBooth(eventId: string, boothData: CreateBoothData): Promise<VirtualBooth> {
    const { data, error } = await supabase
      .from('virtual_booths')
      .insert({
        event_id: eventId,
        ...boothData
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformVirtualBooth(data);
  }

  static async getEventBooths(eventId: string): Promise<VirtualBooth[]> {
    const { data, error } = await supabase
      .from('virtual_booths')
      .select('*')
      .eq('event_id', eventId)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.transformVirtualBooth);
  }

  static async visitBooth(boothId: string): Promise<BoothVisit> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Get user's event registration
    const { data: booth } = await supabase
      .from('virtual_booths')
      .select('event_id')
      .eq('id', boothId)
      .single();

    if (!booth) throw new Error('Booth not found');

    const { data: registration } = await supabase
      .from('virtual_event_registrations')
      .select('id')
      .eq('event_id', booth.event_id)
      .eq('user_id', user.user.id)
      .single();

    if (!registration) throw new Error('User not registered for event');

    const { data, error } = await supabase
      .from('booth_visits')
      .insert({
        booth_id: boothId,
        visitor_id: user.user.id,
        event_registration_id: registration.id
      })
      .select()
      .single();

    if (error) throw error;

    // Update booth visitor count by fetching current count and incrementing it
    const { data: currentBooth } = await supabase
      .from('virtual_booths')
      .select('visitor_count')
      .eq('id', boothId)
      .single();

    if (currentBooth) {
      const { error: updateError } = await supabase
        .from('virtual_booths')
        .update({ visitor_count: (currentBooth.visitor_count || 0) + 1 })
        .eq('id', boothId);

      if (updateError) {
        console.warn('Failed to update booth visitor count:', updateError);
      }
    }

    return this.transformBoothVisit(data);
  }

  // Session Management
  static async createSession(eventId: string, sessionData: CreateSessionData): Promise<EventSession> {
    const { data, error } = await supabase
      .from('event_sessions')
      .insert({
        event_id: eventId,
        ...sessionData
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformEventSession(data);
  }

  static async getEventSessions(eventId: string): Promise<EventSession[]> {
    const { data, error } = await supabase
      .from('event_sessions')
      .select('*')
      .eq('event_id', eventId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.transformEventSession);
  }

  static async registerForSession(sessionId: string): Promise<void> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Get session and event registration
    const { data: session } = await supabase
      .from('event_sessions')
      .select('event_id')
      .eq('id', sessionId)
      .single();

    if (!session) throw new Error('Session not found');

    const { data: registration } = await supabase
      .from('virtual_event_registrations')
      .select('id')
      .eq('event_id', session.event_id)
      .eq('user_id', user.user.id)
      .single();

    if (!registration) throw new Error('User not registered for event');

    const { error } = await supabase
      .from('session_registrations')
      .insert({
        session_id: sessionId,
        user_id: user.user.id,
        event_registration_id: registration.id
      });

    if (error) throw error;
  }

  // Networking Management
  static async getNetworkingRooms(eventId: string): Promise<NetworkingRoom[]> {
    const { data, error } = await supabase
      .from('networking_rooms')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.transformNetworkingRoom);
  }

  static async createNetworkingConnection(
    eventId: string,
    recipientId: string,
    message?: string
  ): Promise<NetworkingConnection> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('virtual_networking_connections')
      .insert({
        event_id: eventId,
        initiator_id: user.user.id,
        recipient_id: recipientId,
        message
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformNetworkingConnection(data);
  }

  static async getNetworkingConnections(eventId: string): Promise<NetworkingConnection[]> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('virtual_networking_connections')
      .select(`
        *,
        initiator:profiles!virtual_networking_connections_initiator_id_fkey(id, full_name, avatar_url),
        recipient:profiles!virtual_networking_connections_recipient_id_fkey(id, full_name, avatar_url)
      `)
      .eq('event_id', eventId)
      .or(`initiator_id.eq.${user.user.id},recipient_id.eq.${user.user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformNetworkingConnection);
  }

  // Analytics
  static async recordAnalytic(
    eventId: string,
    metricType: string,
    metricName: string,
    metricValue: number,
    dimensions?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('virtual_event_analytics')
      .insert({
        event_id: eventId,
        metric_type: metricType,
        metric_name: metricName,
        metric_value: metricValue,
        dimensions: dimensions || {}
      });

    if (error) throw error;
  }

  static async getEventAnalytics(eventId: string): Promise<EventAnalytics[]> {
    const { data, error } = await supabase
      .from('virtual_event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformEventAnalytics);
  }

  static async getAnalyticsSummary(eventId: string): Promise<Record<string, any>> {
    const analytics = await this.getEventAnalytics(eventId);
    const registrations = await this.getEventRegistrations(eventId);
    
    const summary = {
      totalRegistrations: registrations.length,
      attendedCount: registrations.filter(r => r.status === 'attended').length,
      averageSessionDuration: registrations.reduce((acc, r) => acc + r.session_duration, 0) / registrations.length || 0,
      totalNetworkingConnections: registrations.reduce((acc, r) => acc + r.networking_connections, 0),
      metrics: analytics.reduce((acc, metric) => {
        acc[metric.metric_name] = metric.metric_value;
        return acc;
      }, {} as Record<string, number>)
    };

    return summary;
  }

  // Transform methods to handle Json to proper types
  private static transformVirtualEvent(data: any): VirtualEvent {
    return {
      ...data,
      agenda: Array.isArray(data.agenda) ? data.agenda : (typeof data.agenda === 'string' ? JSON.parse(data.agenda || '[]') : []),
      speakers: Array.isArray(data.speakers) ? data.speakers : (typeof data.speakers === 'string' ? JSON.parse(data.speakers || '[]') : []),
      sponsors: Array.isArray(data.sponsors) ? data.sponsors : (typeof data.sponsors === 'string' ? JSON.parse(data.sponsors || '[]') : []),
      registration_fields: typeof data.registration_fields === 'object' && data.registration_fields !== null ? data.registration_fields : (typeof data.registration_fields === 'string' ? JSON.parse(data.registration_fields || '{}') : {}),
      settings: typeof data.settings === 'object' && data.settings !== null ? data.settings : (typeof data.settings === 'string' ? JSON.parse(data.settings || '{}') : {}),
      analytics_data: typeof data.analytics_data === 'object' && data.analytics_data !== null ? data.analytics_data : (typeof data.analytics_data === 'string' ? JSON.parse(data.analytics_data || '{}') : {})
    };
  }

  private static transformVirtualBooth(data: any): VirtualBooth {
    return {
      ...data,
      booth_position: typeof data.booth_position === 'object' && data.booth_position !== null ? data.booth_position : (typeof data.booth_position === 'string' ? JSON.parse(data.booth_position || '{}') : {}),
      contact_info: typeof data.contact_info === 'object' && data.contact_info !== null ? data.contact_info : (typeof data.contact_info === 'string' ? JSON.parse(data.contact_info || '{}') : {}),
      resources: Array.isArray(data.resources) ? data.resources : (typeof data.resources === 'string' ? JSON.parse(data.resources || '[]') : [])
    };
  }

  private static transformEventRegistration(data: any): EventRegistration {
    return {
      ...data,
      registration_data: typeof data.registration_data === 'object' && data.registration_data !== null ? data.registration_data : (typeof data.registration_data === 'string' ? JSON.parse(data.registration_data || '{}') : {}),
      feedback: data.feedback && typeof data.feedback === 'object' ? data.feedback : (typeof data.feedback === 'string' ? JSON.parse(data.feedback || '{}') : undefined)
    };
  }

  private static transformEventSession(data: any): EventSession {
    return {
      ...data,
      speakers: Array.isArray(data.speakers) ? data.speakers : (typeof data.speakers === 'string' ? JSON.parse(data.speakers || '[]') : []),
      materials: Array.isArray(data.materials) ? data.materials : (typeof data.materials === 'string' ? JSON.parse(data.materials || '[]') : [])
    };
  }

  private static transformNetworkingRoom(data: any): NetworkingRoom {
    return data;
  }

  private static transformNetworkingConnection(data: any): NetworkingConnection {
    return data;
  }

  private static transformBoothVisit(data: any): BoothVisit {
    return {
      ...data,
      interactions: typeof data.interactions === 'object' && data.interactions !== null ? data.interactions : (typeof data.interactions === 'string' ? JSON.parse(data.interactions || '{}') : {})
    };
  }

  private static transformEventAnalytics(data: any): EventAnalytics {
    return {
      ...data,
      dimensions: typeof data.dimensions === 'object' && data.dimensions !== null ? data.dimensions : (typeof data.dimensions === 'string' ? JSON.parse(data.dimensions || '{}') : {})
    };
  }
}
