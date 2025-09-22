
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'completion' | 'engagement' | 'streak' | 'social' | 'milestone';
  points: number;
  requirement: {
    type: string;
    value: number;
    description: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked_at?: string;
  progress?: number;
  max_progress?: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  points_awarded: number;
  achievement: Achievement;
}

export interface LearningStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  streak_type: 'daily' | 'weekly' | 'course_completion';
}

export interface UserPoints {
  user_id: string;
  total_points: number;
  weekly_points: number;
  monthly_points: number;
  level: number;
  experience_points: number;
  points_to_next_level: number;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  points: number;
  level: number;
  rank: number;
  achievements_count: number;
  courses_completed: number;
}

export interface GameLevel {
  level: number;
  title: string;
  min_points: number;
  max_points: number;
  badge_icon: string;
  perks: string[];
}
