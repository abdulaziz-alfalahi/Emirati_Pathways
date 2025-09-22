
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Zap, Users, Target, Lock } from 'lucide-react';
import type { Achievement, UserAchievement } from '@/types/gamification';

interface AchievementBadgeProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  userAchievement,
  showProgress = false,
  size = 'md'
}) => {
  const isUnlocked = !!userAchievement;
  
  const getIcon = () => {
    switch (achievement.category) {
      case 'completion': return Trophy;
      case 'engagement': return Star;
      case 'streak': return Zap;
      case 'social': return Users;
      case 'milestone': return Target;
      default: return Trophy;
    }
  };

  const Icon = getIcon();

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <Card className={`relative ${sizeClasses[size]} ${isUnlocked ? '' : 'opacity-50'}`}>
      <CardContent className="p-2 h-full flex flex-col items-center justify-center">
        <div className={`rounded-full border-2 p-2 mb-1 ${getRarityColor()}`}>
          {isUnlocked ? (
            <Icon className={`${iconSizes[size]} text-current`} />
          ) : (
            <Lock className={`${iconSizes[size]} text-gray-400`} />
          )}
        </div>
        
        <Badge variant={achievement.rarity === 'legendary' ? 'default' : 'secondary'} className="text-xs">
          {achievement.rarity}
        </Badge>

        {showProgress && achievement.progress !== undefined && achievement.max_progress && (
          <div className="mt-2 w-full">
            <Progress 
              value={(achievement.progress / achievement.max_progress) * 100} 
              className="h-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {achievement.progress}/{achievement.max_progress}
            </p>
          </div>
        )}

        {isUnlocked && (
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
