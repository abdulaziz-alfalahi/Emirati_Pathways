
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Trophy, Medal, Award } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/gamification';

export const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    const mockLeaderboard: LeaderboardEntry[] = [
      {
        user_id: '1',
        username: 'sarah_learner',
        full_name: 'Sarah Johnson',
        avatar_url: '',
        points: 2450,
        level: 8,
        rank: 1,
        achievements_count: 15,
        courses_completed: 12
      },
      {
        user_id: '2',
        username: 'tech_ahmed',
        full_name: 'Ahmed Al-Rashid',
        avatar_url: '',
        points: 2380,
        level: 7,
        rank: 2,
        achievements_count: 13,
        courses_completed: 11
      },
      {
        user_id: '3',
        username: 'code_fatima',
        full_name: 'Fatima Hassan',
        avatar_url: '',
        points: 2200,
        level: 7,
        rank: 3,
        achievements_count: 12,
        courses_completed: 10
      },
      {
        user_id: '4',
        username: 'data_omar',
        full_name: 'Omar Mohammed',
        avatar_url: '',
        points: 1950,
        level: 6,
        rank: 4,
        achievements_count: 10,
        courses_completed: 8
      },
      {
        user_id: '5',
        username: 'ai_aisha',
        full_name: 'Aisha Al-Zahra',
        avatar_url: '',
        points: 1820,
        level: 6,
        rank: 5,
        achievements_count: 9,
        courses_completed: 7
      }
    ];

    setLeaderboard(mockLeaderboard);
    setLoading(false);
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <Award className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2: return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3: return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
      default: return 'bg-white border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
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
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
        <CardDescription>
          See how you rank among other learners
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="points" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="points" className="space-y-3">
            {leaderboard.map((entry) => (
              <div 
                key={entry.user_id} 
                className={`p-4 rounded-lg border-2 ${getRankStyle(entry.rank)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getRankIcon(entry.rank)}
                      <span className="font-bold text-lg">#{entry.rank}</span>
                    </div>
                    
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.avatar_url} />
                      <AvatarFallback>
                        {entry.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h4 className="font-medium">{entry.full_name}</h4>
                      <p className="text-sm text-muted-foreground">@{entry.username}</p>
                    </div>
                  </div>
                  
                  <div className="text-end">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Level {entry.level}</Badge>
                    </div>
                    <p className="text-lg font-bold text-primary">{entry.points.toLocaleString()} pts</p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-3">
            {[...leaderboard]
              .sort((a, b) => b.achievements_count - a.achievements_count)
              .map((entry, index) => (
              <div 
                key={entry.user_id} 
                className={`p-4 rounded-lg border-2 ${getRankStyle(index + 1)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getRankIcon(index + 1)}
                      <span className="font-bold text-lg">#{index + 1}</span>
                    </div>
                    
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.avatar_url} />
                      <AvatarFallback>
                        {entry.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h4 className="font-medium">{entry.full_name}</h4>
                      <p className="text-sm text-muted-foreground">@{entry.username}</p>
                    </div>
                  </div>
                  
                  <div className="text-end">
                    <p className="text-lg font-bold text-primary">{entry.achievements_count} badges</p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="courses" className="space-y-3">
            {[...leaderboard]
              .sort((a, b) => b.courses_completed - a.courses_completed)
              .map((entry, index) => (
              <div 
                key={entry.user_id} 
                className={`p-4 rounded-lg border-2 ${getRankStyle(index + 1)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getRankIcon(index + 1)}
                      <span className="font-bold text-lg">#{index + 1}</span>
                    </div>
                    
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.avatar_url} />
                      <AvatarFallback>
                        {entry.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h4 className="font-medium">{entry.full_name}</h4>
                      <p className="text-sm text-muted-foreground">@{entry.username}</p>
                    </div>
                  </div>
                  
                  <div className="text-end">
                    <p className="text-lg font-bold text-primary">{entry.courses_completed} courses</p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
