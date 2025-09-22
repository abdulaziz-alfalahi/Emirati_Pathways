
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Award, Clock, Target } from 'lucide-react';

const progressData = {
  overallProgress: 68,
  completedCourses: 12,
  totalCourses: 18,
  skillsAcquired: 25,
  certificates: 8,
  studyHours: 145,
  currentStreak: 7
};

const recentAchievements = [
  { title: 'Python Fundamentals', type: 'Course Completion', date: '2 days ago' },
  { title: 'Data Analysis Expert', type: 'Skill Badge', date: '1 week ago' },
  { title: '100 Hours Milestone', type: 'Study Time', date: '2 weeks ago' }
];

const skillProgress = [
  { skill: 'Python Programming', level: 85, category: 'Programming' },
  { skill: 'Data Analysis', level: 92, category: 'Analytics' },
  { skill: 'Digital Marketing', level: 67, category: 'Marketing' },
  { skill: 'Cloud Computing', level: 45, category: 'Infrastructure' }
];

export const ProgressDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overall Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{progressData.overallProgress}%</p>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{progressData.certificates}</p>
              <p className="text-sm text-muted-foreground">Certificates</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{progressData.studyHours}</p>
              <p className="text-sm text-muted-foreground">Study Hours</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold">{progressData.currentStreak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Skills Progress */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Skills Progress</CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            {skillProgress.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{skill.category}</Badge>
                    <span className="text-sm">{skill.level}%</span>
                  </div>
                </div>
                <Progress value={skill.level} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            {recentAchievements.map((achievement, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{achievement.title}</p>
                  <p className="text-sm text-muted-foreground">{achievement.type}</p>
                </div>
                <span className="text-sm text-muted-foreground">{achievement.date}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Course Progress</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="flex items-center justify-between mb-4">
            <span>Completed: {progressData.completedCourses} of {progressData.totalCourses} courses</span>
            <span className="font-semibold">{Math.round((progressData.completedCourses / progressData.totalCourses) * 100)}%</span>
          </div>
          <Progress value={(progressData.completedCourses / progressData.totalCourses) * 100} className="h-3" />
        </CardContent>
      </Card>
    </div>
  );
};
