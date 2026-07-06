import { VirtualEventsService } from './virtualEventsService';
import { EngagementTrackingService } from './engagementTrackingService';

export interface EventFeedback {
  id: string;
  event_id: string;
  user_id: string;
  overall_rating: number;
  content_rating: number;
  speakers_rating: number;
  networking_rating: number;
  platform_rating: number;
  recommendations: string;
  improvements: string;
  would_recommend: boolean;
  future_interests: string[];
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export interface AttendanceCertificate {
  id: string;
  event_id: string;
  user_id: string;
  certificate_number: string;
  issued_date: string;
  completion_percentage: number;
  certificate_url?: string;
  is_valid: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export interface FollowUpEmail {
  id: string;
  event_id: string;
  email_type: 'feedback' | 'certificate' | 'networking' | 'resources' | 'survey';
  recipient_count: number;
  sent_at: string;
  template_data: Record<string, any>;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  created_at: string;
}

export class PostEventFollowUpService {
  // Feedback Collection
  static async submitEventFeedback(
    eventId: string,
    feedbackData: {
      overall_rating: number;
      content_rating: number;
      speakers_rating: number;
      networking_rating: number;
      platform_rating: number;
      recommendations?: string;
      improvements?: string;
      would_recommend?: boolean;
      future_interests?: string[];
    }
  ): Promise<EventFeedback> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Create clean insert data without any extra properties
    const insertData = {
      event_id: eventId,
      user_id: user.user.id,
      overall_rating: feedbackData.overall_rating,
      content_rating: feedbackData.content_rating,
      speakers_rating: feedbackData.speakers_rating,
      networking_rating: feedbackData.networking_rating,
      platform_rating: feedbackData.platform_rating,
      recommendations: feedbackData.recommendations || '',
      improvements: feedbackData.improvements || '',
      would_recommend: feedbackData.would_recommend || false,
      future_interests: feedbackData.future_interests || []
    };

    const { data, error } = await supabase
      .from('event_feedback')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data as EventFeedback;
  }

  static async getEventFeedback(eventId: string): Promise<EventFeedback[]> {
    const { data, error } = await supabase
      .from('event_feedback')
      .select(`
        *,
        profiles(full_name, email)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as any[]) || [];
  }

  static async getFeedbackSummary(eventId: string): Promise<Record<string, any>> {
    const feedback = await this.getEventFeedback(eventId);
    
    if (feedback.length === 0) {
      return {
        totalResponses: 0,
        averageRatings: {},
        recommendationRate: 0,
        commonImprovements: [],
        topInterests: []
      };
    }

    const averageRatings = {
      overall: feedback.reduce((sum, f) => sum + f.overall_rating, 0) / feedback.length,
      content: feedback.reduce((sum, f) => sum + f.content_rating, 0) / feedback.length,
      speakers: feedback.reduce((sum, f) => sum + f.speakers_rating, 0) / feedback.length,
      networking: feedback.reduce((sum, f) => sum + f.networking_rating, 0) / feedback.length,
      platform: feedback.reduce((sum, f) => sum + f.platform_rating, 0) / feedback.length
    };

    const recommendationRate = feedback.filter(f => f.would_recommend).length / feedback.length * 100;

    return {
      totalResponses: feedback.length,
      averageRatings,
      recommendationRate,
      commonImprovements: this.extractCommonThemes(feedback.map(f => f.improvements).filter(Boolean)),
      topInterests: this.extractTopInterests(feedback.flatMap(f => f.future_interests || []))
    };
  }

  // Certificate Generation
  static async generateAttendanceCertificate(
    eventId: string,
    userId: string
  ): Promise<AttendanceCertificate> {
    // Get user's engagement data
    const engagementData = await EngagementTrackingService.getUserEngagementAnalytics(userId, eventId);
    const eventData = await VirtualEventsService.getEventById(eventId);
    
    if (!eventData) throw new Error('Event not found');

    // Calculate completion percentage based on engagement
    const completionPercentage = this.calculateCompletionPercentage(engagementData);
    
    // Only issue certificate if minimum requirements are met
    if (completionPercentage < 75) {
      throw new Error('Minimum attendance requirements not met');
    }

    const certificateNumber = this.generateCertificateNumber(eventId, userId);

    const { data, error } = await supabase
      .from('attendance_certificates')
      .insert({
        event_id: eventId,
        user_id: userId,
        certificate_number: certificateNumber,
        completion_percentage: completionPercentage,
        is_valid: true
      })
      .select()
      .single();

    if (error) throw error;

    // Generate certificate PDF (placeholder for actual implementation)
    await this.generateCertificatePDF(data, eventData, engagementData);

    return data as AttendanceCertificate;
  }

  static async getCertificatesByEvent(eventId: string): Promise<AttendanceCertificate[]> {
    const { data, error } = await supabase
      .from('attendance_certificates')
      .select(`
        *,
        profiles(full_name, email)
      `)
      .eq('event_id', eventId)
      .order('issued_date', { ascending: false });

    if (error) throw error;
    return (data as any[]) || [];
  }

  // Networking Export
  static async exportNetworkingConnections(eventId: string): Promise<any[]> {
    const connections = await VirtualEventsService.getNetworkingConnections(eventId);
    
    const exportData = connections.map(connection => ({
      initiator_name: 'Unknown', // Will be populated when we have proper relationships
      initiator_email: '',
      recipient_name: 'Unknown',
      recipient_email: '',
      connection_type: connection.connection_type,
      message: connection.message,
      status: connection.status,
      created_at: new Date(connection.created_at).toLocaleDateString()
    }));

    return exportData;
  }

  // Follow-up Email Campaigns
  static async sendFeedbackRequest(eventId: string): Promise<FollowUpEmail> {
    const registrations = await VirtualEventsService.getEventRegistrations(eventId);
    const attendees = registrations.filter(r => r.status === 'attended');

    const emailData = {
      event_id: eventId,
      email_type: 'feedback' as const,
      recipient_count: attendees.length,
      template_data: {
        event_name: (await VirtualEventsService.getEventById(eventId))?.title,
        feedback_url: `${window.location.origin}/events/${eventId}/feedback`
      },
      status: 'sent' as const
    };

    const { data, error } = await supabase
      .from('follow_up_emails')
      .insert(emailData)
      .select()
      .single();

    if (error) throw error;

    // Send emails to attendees (placeholder for actual email service)
    console.log(`Sending feedback requests to ${attendees.length} attendees`);

    return data as FollowUpEmail;
  }

  static async sendCertificateNotification(eventId: string): Promise<FollowUpEmail> {
    const certificates = await this.getCertificatesByEvent(eventId);

    const emailData = {
      event_id: eventId,
      email_type: 'certificate' as const,
      recipient_count: certificates.length,
      template_data: {
        certificate_count: certificates.length
      },
      status: 'sent' as const
    };

    const { data, error } = await supabase
      .from('follow_up_emails')
      .insert(emailData)
      .select()
      .single();

    if (error) throw error;
    return data as FollowUpEmail;
  }

  static async sendNetworkingExport(eventId: string): Promise<FollowUpEmail> {
    const connections = await this.exportNetworkingConnections(eventId);

    const emailData = {
      event_id: eventId,
      email_type: 'networking' as const,
      recipient_count: 1, // Usually sent to organizer
      template_data: {
        connections_count: connections.length
      },
      status: 'sent' as const
    };

    const { data, error } = await supabase
      .from('follow_up_emails')
      .insert(emailData)
      .select()
      .single();

    if (error) throw error;
    return data as FollowUpEmail;
  }

  // Automated Follow-up Process
  static async runPostEventSequence(eventId: string): Promise<void> {
    try {
      // Wait 24 hours after event end before starting sequence
      const event = await VirtualEventsService.getEventById(eventId);
      if (!event) throw new Error('Event not found');

      const eventEndTime = new Date(event.end_date);
      const now = new Date();
      const hoursSinceEnd = (now.getTime() - eventEndTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceEnd < 24) {
        console.log('Event ended less than 24 hours ago, scheduling follow-up');
        return;
      }

      // Step 1: Generate certificates for eligible attendees
      const registrations = await VirtualEventsService.getEventRegistrations(eventId);
      const attendees = registrations.filter(r => r.status === 'attended');

      for (const attendee of attendees) {
        try {
          await this.generateAttendanceCertificate(eventId, attendee.user_id);
        } catch (error) {
          console.log(`Could not generate certificate for user ${attendee.user_id}:`, error);
        }
      }

      // Step 2: Send feedback request
      await this.sendFeedbackRequest(eventId);

      // Step 3: Send certificate notifications
      await this.sendCertificateNotification(eventId);

      // Step 4: Export networking connections
      await this.sendNetworkingExport(eventId);

      console.log(`Post-event follow-up sequence completed for event ${eventId}`);
    } catch (error) {
      console.error('Error running post-event sequence:', error);
      throw error;
    }
  }

  // Helper Methods
  private static calculateCompletionPercentage(engagementData: any): number {
    if (!engagementData) return 0;

    const weights = {
      sessionTime: 0.4,
      sessionsAttended: 0.3,
      boothsVisited: 0.2,
      interactions: 0.1
    };

    const normalizedSessionTime = Math.min((engagementData.total_session_time || 0) / 3600, 1);
    const normalizedSessions = Math.min((engagementData.sessions_attended || 0) / 3, 1);
    const normalizedBooths = Math.min((engagementData.booths_visited || 0) / 5, 1);
    const normalizedInteractions = Math.min((engagementData.questions_asked || 0) / 2, 1);

    const percentage = (
      normalizedSessionTime * weights.sessionTime +
      normalizedSessions * weights.sessionsAttended +
      normalizedBooths * weights.boothsVisited +
      normalizedInteractions * weights.interactions
    ) * 100;

    return Math.round(percentage);
  }

  private static generateCertificateNumber(eventId: string, userId: string): string {
    const timestamp = Date.now().toString(36);
    const eventPrefix = eventId.substring(0, 8);
    const userPrefix = userId.substring(0, 8);
    return `CERT-${eventPrefix}-${userPrefix}-${timestamp}`.toUpperCase();
  }

  private static async generateCertificatePDF(
    certificate: AttendanceCertificate,
    event: any,
    engagement: any
  ): Promise<void> {
    // Placeholder for PDF generation
    // In a real implementation, you would use a PDF library like jsPDF
    console.log('Generating certificate PDF for:', certificate.certificate_number);
  }

  private static extractCommonThemes(improvements: string[]): string[] {
    // Simple keyword extraction - in a real app, you might use NLP
    const keywords = improvements
      .join(' ')
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3);
    
    const frequency = keywords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private static extractTopInterests(interests: string[]): string[] {
    const frequency = interests.reduce((acc, interest) => {
      acc[interest] = (acc[interest] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([interest]) => interest);
  }
}
