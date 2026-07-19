
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Calendar, Trophy, Target } from 'lucide-react';
import type { LearningStreak } from '@/types/gamification';

export const ProgressStreaks: React.FC = () => {
  const [streaks, setStreaks] = useState<LearningStreak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    const mockStreaks: LearningStreak[] = [
      {
        id: '1',
        user_id: 'user1',
        current_streak: 5,
        longest_streak: 12,
        last_activity_date: new Date().toISOString(),
        streak_type: 'daily'
      },
      {
        id: '2',
        user_id: 'user1',
        current_streak: 2,
        longest_streak: 4,
        last_activity_date: new Date().toISOString(),
        streak_type: 'weekly'
      },
      {
        id: '3',
        user_id: 'user1',
        current_streak: 1,
        longest_streak: 3,
        last_activity_date: new Date().toISOString(),
        streak_type: 'course_completion'
      }
    ];

    setStreaks(mockStreaks);
    setLoading(false);
  }, []);

  const getStreakIcon = (type: string) => {
    switch (type) {
      case 'daily': return Flame;
      case 'weekly': return Calendar;
      case 'course_completion': return Trophy;
      default: return Target;
    }
  };

  const getStreakTitle = (type: string) => {
    switch (type) {
      case 'daily': return 'Daily Learning';
      case 'weekly': return 'Weekly Consistency';
      case 'course_completion': return 'Course Mastery';
      default: return 'Learning Streak';
    }
  };

  const getStreakDescription = (type: string) => {
    switch (type) {
      case 'daily': return 'Study every day to maintain your streak';
      case 'weekly': return 'Complete activities weekly';
      case 'course_completion': return 'Finish courses consecutively';
      default: return 'Keep learning consistently';
    }
  };

  const getStreakColor = (current: number) => {
    if (current >= 30) return 'text-orange-500';
    if (current >= 14) return 'text-red-500';
    if (current >= 7) return 'text-yellow-500';
    return 'text-blue-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Learning Streaks
        </CardTitle>
        <CardDescription>
          Maintain consistent learning habits to build your streaks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {streaks.map((streak) => {
          const Icon = getStreakIcon(streak.streak_type);
          const title = getStreakTitle(streak.streak_type);
          const description = getStreakDescription(streak.streak_type);
          
          return (
            <div key={streak.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${getStreakColor(streak.current_streak)}`} />
                  <div>
                    <h4 className="font-medium">{title}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                <div className="text-end">
                  <p className={`text-2xl font-bold ${getStreakColor(streak.current_streak)}`}>
                    {streak.current_streak}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Best: {streak.longest_streak}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to next milestone</span>
                  <span>{streak.current_streak}/30 days</span>
                </div>
                <Progress value={(streak.current_streak / 30) * 100} className="h-2" />
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <h5 className="font-medium mb-2">Streak Rewards</h5>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 bg-blue-50 rounded">
              <p className="font-medium text-blue-900">7 Days</p>
              <p className="text-blue-700">+50 bonus points</p>
            </div>
            <div className="p-2 bg-yellow-50 rounded">
              <p className="font-medium text-yellow-900">14 Days</p>
              <p className="text-yellow-700">+100 bonus points</p>
            </div>
            <div className="p-2 bg-orange-50 rounded">
              <p className="font-medium text-orange-900">30 Days</p>
              <p className="text-orange-700">+200 bonus points</p>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <p className="font-medium text-red-900">60 Days</p>
              <p className="text-red-700">Special badge</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
