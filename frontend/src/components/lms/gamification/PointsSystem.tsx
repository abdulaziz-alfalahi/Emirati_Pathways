
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Award, Zap } from 'lucide-react';
import type { UserPoints, GameLevel } from '@/types/gamification';

export const PointsSystem: React.FC = () => {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [gameLevels, setGameLevels] = useState<GameLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    const mockUserPoints: UserPoints = {
      user_id: 'user1',
      total_points: 1850,
      weekly_points: 320,
      monthly_points: 1240,
      level: 6,
      experience_points: 350,
      points_to_next_level: 150
    };

    const mockGameLevels: GameLevel[] = [
      { level: 1, title: 'Beginner', min_points: 0, max_points: 99, badge_icon: '🌱', perks: ['Access to basic courses'] },
      { level: 2, title: 'Explorer', min_points: 100, max_points: 249, badge_icon: '🔍', perks: ['10% bonus points', 'Course recommendations'] },
      { level: 3, title: 'Learner', min_points: 250, max_points: 499, badge_icon: '📚', perks: ['15% bonus points', 'Early course access'] },
      { level: 4, title: 'Scholar', min_points: 500, max_points: 999, badge_icon: '🎓', perks: ['20% bonus points', 'Certificate templates'] },
      { level: 5, title: 'Expert', min_points: 1000, max_points: 1999, badge_icon: '⭐', perks: ['25% bonus points', 'Priority support'] },
      { level: 6, title: 'Master', min_points: 2000, max_points: 3999, badge_icon: '🏆', perks: ['30% bonus points', 'Exclusive content'] },
      { level: 7, title: 'Guru', min_points: 4000, max_points: 7999, badge_icon: '💎', perks: ['35% bonus points', 'Personal mentoring'] },
      { level: 8, title: 'Legend', min_points: 8000, max_points: 15999, badge_icon: '👑', perks: ['40% bonus points', 'Course creation tools'] },
      { level: 9, title: 'Mythic', min_points: 16000, max_points: 31999, badge_icon: '🌟', perks: ['45% bonus points', 'Special recognition'] },
      { level: 10, title: 'Transcendent', min_points: 32000, max_points: 999999, badge_icon: '🚀', perks: ['50% bonus points', 'Hall of Fame'] }
    ];

    setUserPoints(mockUserPoints);
    setGameLevels(mockGameLevels);
    setLoading(false);
  }, []);

  const getCurrentLevel = () => {
    if (!userPoints) return null;
    return gameLevels.find(level => level.level === userPoints.level);
  };

  const getNextLevel = () => {
    if (!userPoints) return null;
    return gameLevels.find(level => level.level === userPoints.level + 1);
  };

  if (loading || !userPoints) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const progressPercentage = nextLevel 
    ? ((userPoints.total_points - currentLevel!.min_points) / (nextLevel.min_points - currentLevel!.min_points)) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Main Points Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Points & Level
          </CardTitle>
          <CardDescription>
            Earn points by completing courses and activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Level Display */}
          <div className="text-center space-y-2">
            <div className="text-4xl">{currentLevel?.badge_icon}</div>
            <h3 className="text-2xl font-bold">{currentLevel?.title}</h3>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Level {userPoints.level}
            </Badge>
            <p className="text-3xl font-bold text-primary">
              {userPoints.total_points.toLocaleString()} points
            </p>
          </div>

          {/* Progress to Next Level */}
          {nextLevel && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progress to {nextLevel.title}</span>
                <span>{userPoints.points_to_next_level} points needed</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="text-center text-sm text-muted-foreground">
                {Math.round(progressPercentage)}% complete
              </div>
            </div>
          )}

          {/* Current Level Perks */}
          {currentLevel && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Award className="h-4 w-4" />
                Your Perks
              </h4>
              <ul className="space-y-1">
                {currentLevel.perks.map((perk, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full"></span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Points Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold text-blue-600">{userPoints.weekly_points}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-green-600">{userPoints.monthly_points}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ways to Earn Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Earn More Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm">Complete a lesson</span>
              <Badge variant="outline">+25 pts</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm">Finish a course</span>
              <Badge variant="outline">+200 pts</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm">Daily learning streak</span>
              <Badge variant="outline">+50 pts</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm">Perfect quiz score</span>
              <Badge variant="outline">+100 pts</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm">Unlock achievement</span>
              <Badge variant="outline">+Varies</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
