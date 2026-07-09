import type { 
  Mentor, 
  MentorshipRelationship, 
  MentorshipSession,
  MentorProfile,
  MenteePreferences,
  MatchSuggestion
} from '@/types/mentorship';

// Helper function to cast availability from database
const castAvailability = (availability: any): { days: string[]; hours: string[]; timezone: string } | undefined => {
  if (!availability) return undefined;
  return availability as { days: string[]; hours: string[]; timezone: string };
};

// Helper function to cast mentor data from database
const castMentorData = (data: any): Mentor => {
  return {
    ...data,
    availability: castAvailability(data.availability)
  } as Mentor;
};

export class MentorshipService {
  // Mentor profile management
  async createMentorProfile(profileData: MentorProfile): Promise<Mentor> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('mentors')
      .insert({
        user_id: user.user.id,
        ...profileData
      })
      .select()
      .single();

    if (error) throw error;
    return castMentorData(data);
  }

  async updateMentorProfile(updates: Partial<MentorProfile>): Promise<Mentor> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('mentors')
      .update(updates)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;
    return castMentorData(data);
  }

  async getMentorProfile(userId?: string): Promise<Mentor | null> {
    // TODO: Connect to Flask API - const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return null;

    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error) return null;
    return castMentorData(data);
  }

  // Mentor discovery and matching
  async getAvailableMentors(filters?: {
    expertise?: string[];
    experience_level?: string;
    rating_min?: number;
  }): Promise<Mentor[]> {
    let query = supabase
      .from('mentors')
      .select('*')
      .eq('is_active', true);

    if (filters?.expertise && filters.expertise.length > 0) {
      query = query.overlaps('expertise', filters.expertise);
    }

    if (filters?.experience_level) {
      const minYears = filters.experience_level === 'senior' ? 5 : 
                      filters.experience_level === 'intermediate' ? 2 : 0;
      query = query.gte('years_experience', minYears);
    }

    if (filters?.rating_min) {
      query = query.gte('rating', filters.rating_min);
    }

    const { data, error } = await query.order('rating', { ascending: false });
    if (error) throw error;
    return (data || []).map(castMentorData);
  }

  // Advanced matching algorithm
  async getMatchSuggestions(preferences: MenteePreferences): Promise<MatchSuggestion[]> {
    const mentors = await this.getAvailableMentors();
    
    const suggestions: MatchSuggestion[] = mentors.map(mentor => {
      const expertiseMatch = this.calculateExpertiseMatch(
        mentor.expertise, 
        preferences.desired_expertise
      );
      
      const availabilityMatch = this.calculateAvailabilityMatch(
        mentor.availability,
        preferences.availability
      );
      
      const experienceCompatibility = this.calculateExperienceCompatibility(
        mentor.years_experience || 0,
        preferences.experience_level
      );

      const compatibility_score = (
        expertiseMatch * 0.4 + 
        availabilityMatch * 0.3 + 
        experienceCompatibility * 0.3
      );

      const match_reasons = this.generateMatchReasons(
        mentor,
        preferences,
        expertiseMatch,
        availabilityMatch,
        experienceCompatibility
      );

      return {
        mentor,
        compatibility_score: Math.round(compatibility_score * 100),
        match_reasons,
        expertise_match: Math.round(expertiseMatch * 100),
        availability_match: Math.round(availabilityMatch * 100),
        experience_compatibility: Math.round(experienceCompatibility * 100)
      };
    });

    return suggestions
      .filter(s => s.compatibility_score >= 30)
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, 10);
  }

  private calculateExpertiseMatch(mentorExpertise: string[], desiredExpertise: string[]): number {
    if (!mentorExpertise.length || !desiredExpertise.length) return 0;
    
    const matches = mentorExpertise.filter(skill => 
      desiredExpertise.some(desired => 
        skill.toLowerCase().includes(desired.toLowerCase()) ||
        desired.toLowerCase().includes(skill.toLowerCase())
      )
    ).length;
    
    return matches / desiredExpertise.length;
  }

  private calculateAvailabilityMatch(
    mentorAvailability?: { days: string[]; hours: string[]; timezone: string },
    menteeAvailability?: { days: string[]; hours: string[]; timezone: string }
  ): number {
    if (!mentorAvailability || !menteeAvailability) return 0.5;
    
    const dayMatches = mentorAvailability.days.filter(day => 
      menteeAvailability.days.includes(day)
    ).length;
    
    const hourMatches = mentorAvailability.hours.filter(hour => 
      menteeAvailability.hours.includes(hour)
    ).length;
    
    const dayScore = dayMatches / Math.max(menteeAvailability.days.length, 1);
    const hourScore = hourMatches / Math.max(menteeAvailability.hours.length, 1);
    
    return (dayScore + hourScore) / 2;
  }

  private calculateExperienceCompatibility(mentorYears: number, menteeLevel: string): number {
    const levelRequirements = {
      'beginner': { min: 1, ideal: 3 },
      'intermediate': { min: 2, ideal: 5 },
      'advanced': { min: 3, ideal: 7 }
    };
    
    const req = levelRequirements[menteeLevel] || levelRequirements.beginner;
    
    if (mentorYears < req.min) return 0.2;
    if (mentorYears >= req.ideal) return 1.0;
    
    return 0.5 + (mentorYears - req.min) / (req.ideal - req.min) * 0.5;
  }

  private generateMatchReasons(
    mentor: Mentor,
    preferences: MenteePreferences,
    expertiseMatch: number,
    availabilityMatch: number,
    experienceMatch: number
  ): string[] {
    const reasons: string[] = [];
    
    if (expertiseMatch > 0.7) {
      reasons.push(`Strong expertise match in ${mentor.expertise.slice(0, 2).join(', ')}`);
    }
    
    if (availabilityMatch > 0.6) {
      reasons.push('Compatible schedules for regular meetings');
    }
    
    if (experienceMatch > 0.8) {
      reasons.push(`${mentor.years_experience}+ years experience ideal for your level`);
    }
    
    if (mentor.rating && mentor.rating > 4.5) {
      reasons.push(`Highly rated mentor (${mentor.rating}/5.0)`);
    }
    
    if (mentor.is_verified) {
      reasons.push('Verified mentor profile');
    }
    
    return reasons;
  }

  // Mentorship relationship management
  async requestMentorship(mentorId: string, goals: string): Promise<MentorshipRelationship> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('mentorship_relationships')
      .insert({
        mentor_id: mentorId,
        mentee_id: user.user.id,
        goals,
        status: 'requested'
      })
      .select()
      .single();

    if (error) throw error;
    return data as MentorshipRelationship;
  }

  async updateRelationshipStatus(
    relationshipId: string, 
    status: MentorshipRelationship['status']
  ): Promise<MentorshipRelationship> {
    const { data, error } = await supabase
      .from('mentorship_relationships')
      .update({ 
        status,
        ...(status === 'active' ? { start_date: new Date().toISOString() } : {}),
        ...(status === 'completed' ? { end_date: new Date().toISOString() } : {})
      })
      .eq('id', relationshipId)
      .select()
      .single();

    if (error) throw error;
    return data as MentorshipRelationship;
  }

  async getUserRelationships(): Promise<MentorshipRelationship[]> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('mentorship_relationships')
      .select(`
        *,
        mentor:mentors(id, user_id, expertise, bio, rating),
        mentee:profiles!mentorship_relationships_mentee_id_fkey(id, full_name, email)
      `)
      .or(`mentee_id.eq.${user.user.id},mentor_id.in.(select id from mentors where user_id='${user.user.id}')`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as MentorshipRelationship[];
  }

  // Session management
  async scheduleSession(sessionData: {
    relationship_id: string;
    scheduled_date: string;
    duration_minutes?: number;
    topic?: string;
    video_call_url?: string;
  }): Promise<MentorshipSession> {
    const { data, error } = await supabase
      .from('mentorship_sessions')
      .insert({
        ...sessionData,
        duration_minutes: sessionData.duration_minutes || 60,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;
    return data as MentorshipSession;
  }

  async updateSession(
    sessionId: string, 
    updates: Partial<MentorshipSession>
  ): Promise<MentorshipSession> {
    const { data, error } = await supabase
      .from('mentorship_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data as MentorshipSession;
  }

  async getSessionsForRelationship(relationshipId: string): Promise<MentorshipSession[]> {
    const { data, error } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return (data || []) as MentorshipSession[];
  }
}

export const mentorshipService = new MentorshipService();
