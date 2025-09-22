
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AchievementBadge } from './AchievementBadge';
import { useToast } from '@/hooks/use-toast';
import type { Achievement, UserAchievement } from '@/types/gamification';

export const AchievementsPanel: React.FC = () => {
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        title: 'First Steps',
        description: 'Complete your first lesson',
        icon: 'trophy',
        category: 'completion',
        points: 50,
        requirement: { type: 'lessons_completed', value: 1, description: 'Complete 1 lesson' },
        rarity: 'common',
        progress: 1,
        max_progress: 1
      },
      {
        id: '2',
        title: 'Course Champion',
        description: 'Complete your first course',
        icon: 'trophy',
        category: 'completion',
        points: 200,
        requirement: { type: 'courses_completed', value: 1, description: 'Complete 1 course' },
        rarity: 'rare',
        progress: 0,
        max_progress: 1
      },
      {
        id: '3',
        title: 'Learning Streak',
        description: 'Study for 7 consecutive days',
        icon: 'fire',
        category: 'streak',
        points: 150,
        requirement: { type: 'daily_streak', value: 7, description: 'Study 7 days in a row' },
        rarity: 'rare',
        progress: 3,
        max_progress: 7
      },
      {
        id: '4',
        title: 'Knowledge Seeker',
        description: 'Enroll in 5 different courses',
        icon: 'book',
        category: 'engagement',
        points: 300,
        requirement: { type: 'enrollments', value: 5, description: 'Enroll in 5 courses' },
        rarity: 'epic',
        progress: 2,
        max_progress: 5
      },
      {
        id: '5',
        title: 'Master Learner',
        description: 'Complete 10 courses with 90%+ score',
        icon: 'crown',
        category: 'milestone',
        points: 1000,
        requirement: { type: 'high_score_completions', value: 10, description: 'Complete 10 courses with 90%+ score' },
        rarity: 'legendary',
        progress: 0,
        max_progress: 10
      }
    ];

    const mockUserAchievements: UserAchievement[] = [
      {
        id: '1',
        user_id: 'user1',
        achievement_id: '1',
        unlocked_at: new Date().toISOString(),
        points_awarded: 50,
        achievement: mockAchievements[0]
      }
    ];

    setAchievements(mockAchievements);
    setUserAchievements(mockUserAchievements);
    setLoading(false);
  }, []);

  const filterAchievements = (category?: string) => {
    if (!category) return achievements;
    return achievements.filter(achievement => achievement.category === category);
  };

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getUserAchievement = (achievementId: string) => {
    return userAchievements.find(ua => ua.achievement_id === achievementId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
        <CardTitle>Achievements</CardTitle>
        <CardDescription>
          Unlock badges by completing courses and reaching milestones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="streak">Streaks</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="milestone">Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {achievements.map(achievement => (
                <div key={achievement.id} className="flex flex-col items-center space-y-2">
                  <AchievementBadge
                    achievement={achievement}
                    userAchievement={getUserAchievement(achievement.id)}
                    showProgress={true}
                    size="md"
                  />
                  <div className="text-center">
                    <h4 className="text-sm font-medium">{achievement.title}</h4>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    <p className="text-xs font-semibold text-primary">{achievement.points} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {['completion', 'engagement', 'streak', 'social', 'milestone'].map(category => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filterAchievements(category).map(achievement => (
                  <div key={achievement.id} className="flex flex-col items-center space-y-2">
                    <AchievementBadge
                      achievement={achievement}
                      userAchievement={getUserAchievement(achievement.id)}
                      showProgress={true}
                      size="md"
                    />
                    <div className="text-center">
                      <h4 className="text-sm font-medium">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      <p className="text-xs font-semibold text-primary">{achievement.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
