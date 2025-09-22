
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Zap, Medal, Gift } from 'lucide-react';

export const GamificationDashboard: React.FC = () => {
  // Mock gamification data
  const userStats = {
    totalPoints: 2450,
    level: 7,
    streak: 12,
    badges: 8,
    completedChallenges: 15,
    nextLevelPoints: 2800
  };

  const badges = [
    { id: 1, name: 'First Course', description: 'Complete your first course', earned: true },
    { id: 2, name: 'Quick Learner', description: 'Complete 3 courses in a week', earned: true },
    { id: 3, name: 'Consistent', description: '7-day learning streak', earned: true },
    { id: 4, name: 'Knowledge Seeker', description: 'Complete 10 courses', earned: false }
  ];

  const leaderboard = [
    { rank: 1, name: 'Ahmed Al-Mansouri', points: 3450, avatar: '👨‍💼' },
    { rank: 2, name: 'Fatima Al-Zahra', points: 3200, avatar: '👩‍💻' },
    { rank: 3, name: 'Mohammed Hassan', points: 2890, avatar: '👨‍🎓' },
    { rank: 4, name: 'You', points: userStats.totalPoints, avatar: '🎯' },
    { rank: 5, name: 'Sara Ahmed', points: 2300, avatar: '👩‍🔬' }
  ];

  const challenges = [
    { id: 1, title: 'Complete 5 Lessons', progress: 3, total: 5, points: 100, deadline: '3 days' },
    { id: 2, title: 'Weekly Quiz Master', progress: 2, total: 3, points: 150, deadline: '5 days' },
    { id: 3, title: 'Certificate Collector', progress: 1, total: 2, points: 200, deadline: '1 week' }
  ];

  const progressToNextLevel = ((userStats.totalPoints / userStats.nextLevelPoints) * 100);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-ehrdc-teal to-ehrdc-light-teal rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-4">Learning Gamification</h1>
        <p className="text-xl opacity-90 mb-6">
          Level up your learning journey with points, badges, and achievements!
        </p>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+120 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <Trophy className="h-4 w-4 text-gold-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {userStats.level}</div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {userStats.nextLevelPoints - userStats.totalPoints} points to next level
              </p>
              <Progress value={progressToNextLevel} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.streak} days</div>
            <p className="text-xs text-muted-foreground">Keep it going!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Medal className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.badges}</div>
            <p className="text-xs text-muted-foreground">4 more available</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              Achievement Badges
            </CardTitle>
            <CardDescription>Unlock badges by completing learning milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge) => (
                <div 
                  key={badge.id} 
                  className={`p-3 rounded-lg border text-center ${
                    badge.earned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`text-2xl mb-2 ${badge.earned ? '' : 'grayscale opacity-50'}`}>
                    {badge.earned ? '🏆' : '🔒'}
                  </div>
                  <h4 className="font-medium text-sm">{badge.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                  {badge.earned && (
                    <Badge className="mt-2 bg-green-100 text-green-800">Earned</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Leaderboard
            </CardTitle>
            <CardDescription>See how you rank among other learners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((user) => (
                <div 
                  key={user.rank} 
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    user.name === 'You' ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold">
                      {user.rank}
                    </div>
                    <span className="text-lg">{user.avatar}</span>
                    <span className={`font-medium ${user.name === 'You' ? 'text-blue-700' : ''}`}>
                      {user.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-bold">{user.points.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Challenges
          </CardTitle>
          <CardDescription>Complete challenges to earn bonus points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{challenge.title}</h4>
                  <div className="flex items-center space-x-1">
                    <Gift className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-bold text-green-600">+{challenge.points}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{challenge.progress}/{challenge.total}</span>
                  </div>
                  <Progress value={(challenge.progress / challenge.total) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">Deadline: {challenge.deadline}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
