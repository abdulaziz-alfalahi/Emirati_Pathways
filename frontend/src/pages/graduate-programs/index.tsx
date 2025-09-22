import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { GraduationCap, Users, BookOpen, Award, Target, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const GraduateProgramsPage: React.FC = () => {
  const { t } = useTranslation('graduate-programs');

  const stats = [
    { 
      value: t('stats.graduatePrograms.value'), 
      label: t('stats.graduatePrograms.label'), 
      icon: GraduationCap 
    },
    { 
      value: t('stats.partnerUniversities.value'), 
      label: t('stats.partnerUniversities.label'), 
      icon: Building 
    },
    { 
      value: t('stats.graduateStudents.value'), 
      label: t('stats.graduateStudents.label'), 
      icon: Users 
    },
    { 
      value: t('stats.employmentRate.value'), 
      label: t('stats.employmentRate.label'), 
      icon: Target 
    }
  ];

  const programs = [
    {
      title: t('programs.mba.title'),
      university: t('programs.mba.university'),
      duration: t('programs.mba.duration'),
      type: t('programs.mba.type'),
      specializations: t('programs.mba.specializations', { returnObjects: true }) as string[],
      tuition: t('programs.mba.tuition')
    },
    {
      title: t('programs.dataScience.title'),
      university: t('programs.dataScience.university'),
      duration: t('programs.dataScience.duration'),
      type: t('programs.dataScience.type'),
      specializations: t('programs.dataScience.specializations', { returnObjects: true }) as string[],
      tuition: t('programs.dataScience.tuition')
    },
    {
      title: t('programs.engineeringManagement.title'),
      university: t('programs.engineeringManagement.university'),
      duration: t('programs.engineeringManagement.duration'),
      type: t('programs.engineeringManagement.type'),
      specializations: t('programs.engineeringManagement.specializations', { returnObjects: true }) as string[],
      tuition: t('programs.engineeringManagement.tuition')
    },
    {
      title: t('programs.publicAdministration.title'),
      university: t('programs.publicAdministration.university'),
      duration: t('programs.publicAdministration.duration'),
      type: t('programs.publicAdministration.type'),
      specializations: t('programs.publicAdministration.specializations', { returnObjects: true }) as string[],
      tuition: t('programs.publicAdministration.tuition')
    }
  ];

  const generalRequirements = t('requirements.general.items', { returnObjects: true }) as string[];
  const programSpecificRequirements = t('requirements.programSpecific.items', { returnObjects: true }) as string[];

  const tabs = [
    {
      id: "programs",
      label: t('tabs.programs'),
      icon: <GraduationCap className="h-4 w-4" />,
      content: (
        <div className="grid gap-6 md:grid-cols-2">
          {programs.map((program, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{program.title}</CardTitle>
                  <Badge variant="secondary">{program.type}</Badge>
                </div>
                <p className="text-muted-foreground">{program.university}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{t('labels.duration')}:</span>
                    <span className="font-medium">{program.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('labels.tuition')}:</span>
                    <span className="font-medium text-ehrdc-teal">{program.tuition}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t('labels.specializations')}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {program.specializations.map((spec, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full mt-4">{t('buttons.applyNow')}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: "requirements",
      label: t('tabs.requirements'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                {t('requirements.general.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {generalRequirements.map((requirement, index) => (
                  <li key={index}>• {requirement}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                {t('requirements.programSpecific.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {programSpecificRequirements.map((requirement, index) => (
                  <li key={index}>• {requirement}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: "funding",
      label: t('tabs.funding'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <div className="text-center py-8">
          <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('funding.title')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('funding.description')}
          </p>
          <Button>{t('funding.button')}</Button>
        </div>
      )
    }
  ];

  return (
    <EducationPathwayLayout
      title={t('title')}
      description={t('description')}
      icon={<GraduationCap className="h-12 w-12 text-purple-600" />}
      stats={stats}
      tabs={tabs}
      defaultTab="programs"
      actionButtonText={t('buttons.explorePrograms')}
      actionButtonHref="#programs"
      academicYear={t('academicYear')}
    />
  );
};

export default GraduateProgramsPage;

