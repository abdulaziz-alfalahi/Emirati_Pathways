
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface MentorProfile {
  id: string;
  user_id: string;
  bio?: string;
  expertise: string[];
  availability: {
    days: string[];
    hours: string[];
    timezone: string;
  };
  is_active: boolean;
  is_verified: boolean;
  rating?: number;
  review_count: number;
  years_experience?: number;
  created_at: string;
  updated_at: string;
}

export interface MentorStats {
  totalMentors: number;
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
}

export const useMentorProfile = () => {
  const { user } = useAuth();
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MentorStats>({
    totalMentors: 0,
    totalSessions: 0,
    completedSessions: 0,
    averageRating: 0
  });

  useEffect(() => {
    if (user) {
      fetchMentorProfile();
      fetchStats();
    }
  }, [user]);

  const fetchMentorProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Map the database response to our interface
        const mappedProfile: MentorProfile = {
          id: data.id,
          user_id: data.user_id,
          bio: data.bio,
          expertise: data.expertise || [],
          availability: (data.availability as any) || { days: [], hours: [], timezone: 'Asia/Dubai' },
          is_active: data.is_active,
          is_verified: data.is_verified,
          rating: data.rating,
          review_count: data.review_count,
          years_experience: data.years_experience,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        setMentorProfile(mappedProfile);
      }
    } catch (error) {
      console.error('Error fetching mentor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total mentors
      const { count: totalMentors } = await supabase
        .from('mentors')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get total sessions from mentorship_sessions
      const { count: totalSessions } = await supabase
        .from('mentorship_sessions')
        .select('*', { count: 'exact', head: true });

      // Get completed sessions
      const { count: completedSessions } = await supabase
        .from('mentorship_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Calculate average rating - using correct column name from the schema
      const { data: ratingData } = await supabase
        .from('mentorship_sessions')
        .select('rating')
        .not('rating', 'is', null);

      const averageRating = ratingData && ratingData.length > 0
        ? ratingData.reduce((sum, session) => sum + (session.rating || 0), 0) / ratingData.length
        : 0;

      setStats({
        totalMentors: totalMentors || 0,
        totalSessions: totalSessions || 0,
        completedSessions: completedSessions || 0,
        averageRating: Math.round(averageRating * 10) / 10
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateMentorProfile = async (profileData: Partial<MentorProfile>) => {
    if (!user) return;

    try {
      if (mentorProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('mentors')
          .update(profileData)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        
        const mappedProfile: MentorProfile = {
          id: data.id,
          user_id: data.user_id,
          bio: data.bio,
          expertise: data.expertise || [],
          availability: (data.availability as any) || { days: [], hours: [], timezone: 'Asia/Dubai' },
          is_active: data.is_active,
          is_verified: data.is_verified,
          rating: data.rating,
          review_count: data.review_count,
          years_experience: data.years_experience,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        setMentorProfile(mappedProfile);
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('mentors')
          .insert({
            user_id: user.id,
            ...profileData
          })
          .select()
          .single();

        if (error) throw error;
        
        const mappedProfile: MentorProfile = {
          id: data.id,
          user_id: data.user_id,
          bio: data.bio,
          expertise: data.expertise || [],
          availability: (data.availability as any) || { days: [], hours: [], timezone: 'Asia/Dubai' },
          is_active: data.is_active,
          is_verified: data.is_verified,
          rating: data.rating,
          review_count: data.review_count,
          years_experience: data.years_experience,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        setMentorProfile(mappedProfile);
      }

      return true;
    } catch (error) {
      console.error('Error updating mentor profile:', error);
      return false;
    }
  };

  return {
    mentorProfile,
    loading,
    stats,
    updateMentorProfile,
    refetch: fetchMentorProfile
  };
};
