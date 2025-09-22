import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { BookOpen, Users, Award, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SchoolProgramsPage: React.FC = () => {
  const { t } = useTranslation('school-programs');

  const stats = [
    { 
      value: t('stats.partnerSchools.value'), 
      label: t('stats.partnerSchools.label'), 
      icon: BookOpen 
    },
    { 
      value: t('stats.studentsEnrolled.value'), 
      label: t('stats.studentsEnrolled.label'), 
      icon: Users 
    },
    { 
      value: t('stats.specializedPrograms.value'), 
      label: t('stats.specializedPrograms.label'), 
      icon: Award 
    },
    { 
      value: t('stats.successRate.value'), 
      label: t('stats.successRate.label'), 
      icon: Target 
    }
  ];

  const programs = [
    {
      title: t('programs.stemProgram.title'),
      description: t('programs.stemProgram.description'),
      grades: t('programs.stemProgram.grades'),
      schools: t('programs.stemProgram.schools')
    },
    {
      title: t('programs.leadershipDevelopment.title'),
      description: t('programs.leadershipDevelopment.description'),
      grades: t('programs.leadershipDevelopment.grades'), 
      schools: t('programs.leadershipDevelopment.schools')
    },
    {
      title: t('programs.innovationLab.title'),
      description: t('programs.innovationLab.description'),
      grades: t('programs.innovationLab.grades'),
      schools: t('programs.innovationLab.schools')
    }
  ];

  const tabs = [
    {
      id: "programs",
      label: t('tabs.programs'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{program.title}</CardTitle>
                <p className="text-muted-foreground">{program.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>{t('labels.target')}:</span>
                    <span>{program.grades}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('labels.availability')}:</span>
                    <span>{program.schools}</span>
                  </div>
                </div>
                <Button className="w-full">{t('buttons.learnMore')}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }
  ];

  return (
    <EducationPathwayLayout
      title={t('title')}
      description={t('description')}
      icon={<BookOpen className="h-12 w-12 text-green-600" />}
      stats={stats}
      tabs={tabs}
      defaultTab="programs"
      actionButtonText={t('buttons.explorePrograms')}
      actionButtonHref="#programs"
      academicYear={t('academicYear')}
    />
  );
};

export default SchoolProgramsPage;

