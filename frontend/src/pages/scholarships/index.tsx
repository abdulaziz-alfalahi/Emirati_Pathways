import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { Award, Users, DollarSign, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ScholarshipsPage: React.FC = () => {
  const { t } = useTranslation('scholarships');

  const stats = [
    { 
      value: t('stats.availableScholarships.value'), 
      label: t('stats.availableScholarships.label'), 
      icon: Award 
    },
    { 
      value: t('stats.recipientsAnnually.value'), 
      label: t('stats.recipientsAnnually.label'), 
      icon: Users 
    },
    { 
      value: t('stats.totalAwards.value'), 
      label: t('stats.totalAwards.label'), 
      icon: DollarSign 
    },
    { 
      value: t('stats.partnerUniversities.value'), 
      label: t('stats.partnerUniversities.label'), 
      icon: GraduationCap 
    }
  ];

  const scholarships = [
    {
      title: t('scholarships.excellenceMerit.title'),
      description: t('scholarships.excellenceMerit.description'),
      amount: t('scholarships.excellenceMerit.amount'),
      eligibility: t('scholarships.excellenceMerit.eligibility'),
      deadline: t('scholarships.excellenceMerit.deadline')
    },
    {
      title: t('scholarships.stemInnovation.title'),
      description: t('scholarships.stemInnovation.description'),
      amount: t('scholarships.stemInnovation.amount'),
      eligibility: t('scholarships.stemInnovation.eligibility'),
      deadline: t('scholarships.stemInnovation.deadline')
    },
    {
      title: t('scholarships.communityLeadership.title'),
      description: t('scholarships.communityLeadership.description'),
      amount: t('scholarships.communityLeadership.amount'),
      eligibility: t('scholarships.communityLeadership.eligibility'),
      deadline: t('scholarships.communityLeadership.deadline')
    }
  ];

  const tabs = [
    {
      id: "available",
      label: t('tabs.available'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scholarships.map((scholarship, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{scholarship.title}</CardTitle>
                <p className="text-muted-foreground">{scholarship.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('labels.awardAmount')}:</span>
                    <Badge variant="default">{scholarship.amount}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('labels.eligibility')}:</span>
                    <span>{scholarship.eligibility}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('labels.deadline')}:</span>
                    <span className="text-red-600">{scholarship.deadline}</span>
                  </div>
                </div>
                <Button className="w-full">{t('buttons.applyNow')}</Button>
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
      icon={<Award className="h-12 w-12 text-yellow-600" />}
      stats={stats}
      tabs={tabs}
      defaultTab="available"
      actionButtonText={t('buttons.browseScholarships')}
      actionButtonHref="#available"
      academicYear={t('academicYear')}
    />
  );
};

export default ScholarshipsPage;

