import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { Monitor, Users, BookOpen, Trophy, Target, Award, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const LMSPage: React.FC = () => {
  const { t } = useTranslation('lms');

  const stats = [
    { 
      value: t('stats.onlineCourses.value'), 
      label: t('stats.onlineCourses.label'), 
      icon: Monitor 
    },
    { 
      value: t('stats.activeLearners.value'), 
      label: t('stats.activeLearners.label'), 
      icon: Users 
    },
    { 
      value: t('stats.subjects.value'), 
      label: t('stats.subjects.label'), 
      icon: BookOpen 
    },
    { 
      value: t('stats.certifications.value'), 
      label: t('stats.certifications.label'), 
      icon: Trophy 
    }
  ];

  const courses = [
    {
      title: t('courses.digitalMarketing.title'),
      instructor: t('courses.digitalMarketing.instructor'),
      description: t('courses.digitalMarketing.description'),
      duration: t('courses.digitalMarketing.duration'),
      level: t('courses.digitalMarketing.level'),
      progress: 75,
      students: 234
    },
    {
      title: t('courses.dataScience.title'),
      instructor: t('courses.dataScience.instructor'),
      description: t('courses.dataScience.description'),
      duration: t('courses.dataScience.duration'),
      level: t('courses.dataScience.level'),
      progress: 45,
      students: 189
    },
    {
      title: t('courses.projectManagement.title'),
      instructor: t('courses.projectManagement.instructor'),
      description: t('courses.projectManagement.description'),
      duration: t('courses.projectManagement.duration'),
      level: t('courses.projectManagement.level'),
      progress: 90,
      students: 156
    }
  ];

  const catalogCourses = [
    {
      title: t('courses.webDevelopment.title'),
      instructor: t('courses.webDevelopment.instructor'),
      description: t('courses.webDevelopment.description'),
      duration: t('courses.webDevelopment.duration'),
      level: t('courses.webDevelopment.level'),
      students: 342,
      rating: 4.8
    },
    {
      title: t('courses.cybersecurity.title'),
      instructor: t('courses.cybersecurity.instructor'),
      description: t('courses.cybersecurity.description'),
      duration: t('courses.cybersecurity.duration'),
      level: t('courses.cybersecurity.level'),
      students: 278,
      rating: 4.9
    },
    {
      title: t('courses.artificialIntelligence.title'),
      instructor: t('courses.artificialIntelligence.instructor'),
      description: t('courses.artificialIntelligence.description'),
      duration: t('courses.artificialIntelligence.duration'),
      level: t('courses.artificialIntelligence.level'),
      students: 195,
      rating: 4.7
    }
  ];

  const achievements = [
    { title: t('achievements.badges.firstCourse'), earned: true },
    { title: t('achievements.badges.fastLearner'), earned: true },
    { title: t('achievements.badges.dedicated'), earned: false },
    { title: t('achievements.badges.expert'), earned: false },
    { title: t('achievements.badges.mentor'), earned: false }
  ];

  const tabs = [
    {
      id: "courses",
      label: t('tabs.myCourses'),
      icon: <Monitor className="h-4 w-4" />,
      content: (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <p className="text-muted-foreground">
                  {t('labels.instructor')}: {course.instructor}
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary">{course.level}</Badge>
                  <Badge variant="outline">{course.duration}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t('labels.progress')}</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{course.students} {t('labels.students')}</span>
                    <span>{course.duration}</span>
                  </div>
                  <Button className="w-full">{t('buttons.continueLearning')}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: "catalog",
      label: t('tabs.catalog'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">{t('catalog.title')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('catalog.searchPlaceholder')}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {catalogCourses.map((course, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <p className="text-muted-foreground">
                    {t('labels.instructor')}: {course.instructor}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{course.level}</Badge>
                    <Badge variant="outline">{course.duration}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{course.description}</p>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{course.students} {t('labels.students')}</span>
                      <span>⭐ {course.rating}</span>
                    </div>
                    <Button className="w-full">{t('buttons.enrollNow')}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "achievements",
      label: t('tabs.achievements'),
      icon: <Trophy className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('achievements.title')}</h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-sm text-muted-foreground">{t('achievements.coursesCompleted')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">2</div>
                <div className="text-sm text-muted-foreground">{t('achievements.certificatesEarned')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">45</div>
                <div className="text-sm text-muted-foreground">{t('achievements.hoursLearned')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">7</div>
                <div className="text-sm text-muted-foreground">{t('achievements.streakDays')}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement, index) => (
              <Card key={index} className={achievement.earned ? "border-green-200 bg-green-50" : "border-gray-200"}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Award className={`h-8 w-8 ${achievement.earned ? "text-green-600" : "text-gray-400"}`} />
                  <div>
                    <div className="font-medium">{achievement.title}</div>
                    <div className={`text-sm ${achievement.earned ? "text-green-600" : "text-gray-500"}`}>
                      {achievement.earned ? t('labels.completed') : t('labels.notStarted')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "progress",
      label: t('tabs.progress'),
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <TrendingUp className="h-16 w-16 mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('progress.title')}</h3>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('progress.overallProgress')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t('progress.completionRate')}</span>
                      <span>68%</span>
                    </div>
                    <Progress value={68} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t('progress.averageScore')}</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('progress.timeSpent')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{t('progress.weeklyGoal')}: 5 {t('achievements.hoursLearned')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{t('progress.monthlyGoal')}: 20 {t('achievements.hoursLearned')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
  ];

  return (
    <EducationPathwayLayout
      title={t('title')}
      description={t('description')}
      icon={<Monitor className="h-12 w-12 text-blue-600" />}
      stats={stats}
      tabs={tabs}
      defaultTab="courses"
      actionButtonText={t('buttons.browseCourses')}
      actionButtonHref="#courses"
      academicYear={t('academicYear')}
    />
  );
};

export default LMSPage;

