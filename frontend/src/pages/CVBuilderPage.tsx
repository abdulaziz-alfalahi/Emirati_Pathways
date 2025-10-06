// src/pages/CVBuilderPage.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { CareerPageLayout } from '@/components/career/CareerPageLayout';
import {
  FileText,
  Upload,
  User,
  BarChart3,
  Bot,
  Target,
  Sparkles,
  Eye,
  CheckCircle,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import CVUploadParser from '@/components/cv-builder/CVUploadParser';
import CVBuilderWizard from '@/components/cv-builder/CVBuilderWizard';
import { CVProvider } from '@/context/CVContext';
import { CVData } from '@/integrations/groq';

const CVBuilderPage: React.FC = () => {
  const { t } = useTranslation('cv-builder');
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  // 🎯 ADD STATE FOR PARSED CV DATA
  const [parsedCVData, setParsedCVData] = useState<CVData | null>(null);

  // 🎯 ADD CALLBACK TO HANDLE PARSED DATA
  const handleParsedData = (data: CVData) => {
    console.log('📥 CVBuilderPage: Received parsed data from CVUploadParser:', data);
    console.log('📊 Data summary:', {
      name: data.personalInfo?.fullName || 'Unknown',
      email: data.personalInfo?.email || 'No email',
      phone: data.personalInfo?.phone || 'No phone',
      experienceCount: data.experience?.length || 0,
      educationCount: data.education?.length || 0,
      technicalSkills: data.skills?.technical?.length || 0,
      softSkills: data.skills?.soft?.length || 0
    });

    setParsedCVData(data);
    console.log('✅ CVBuilderPage: State updated, CVBuilderWizard should receive data');
  };

  const stats = [
    {
      value: t('stats.steps'),
      label: t('labels.stepWizard')
    },
    {
      value: t('stats.templates'),
      label: t('labels.professionalTemplates')
    },
    {
      value: t('stats.compliance'),
      label: t('labels.uaeCompliant')
    },
    {
      value: t('stats.powered'),
      label: t('labels.aiPowered')
    }
  ];

  const templates = [
    {
      name: t('templates.government.name'),
      description: t('templates.government.description'),
      icon: <Target className="h-8 w-8 text-blue-600" />,
      badge: t('labels.government'),
      color: 'blue'
    },
    {
      name: t('templates.corporate.name'),
      description: t('templates.corporate.description'),
      icon: <FileText className="h-8 w-8 text-purple-600" />,
      badge: t('labels.corporate'),
      color: 'purple'
    },
    {
      name: t('templates.creative.name'),
      description: t('templates.creative.description'),
      icon: <Sparkles className="h-8 w-8 text-pink-600" />,
      badge: t('labels.creative'),
      color: 'pink'
    },
    {
      name: t('templates.technical.name'),
      description: t('templates.technical.description'),
      icon: <Bot className="h-8 w-8 text-green-600" />,
      badge: t('labels.technical'),
      color: 'green'
    },
    {
      name: t('templates.academic.name'),
      description: t('templates.academic.description'),
      icon: <User className="h-8 w-8 text-orange-600" />,
      badge: t('labels.academic'),
      color: 'orange'
    },
    {
      name: t('templates.modern.name'),
      description: t('templates.modern.description'),
      icon: <Zap className="h-8 w-8 text-red-600" />,
      badge: t('labels.modern'),
      color: 'red'
    }
  ];

  const uaeTips = [
    {
      category: t('tips.personal.title'),
      tips: [
        t('tips.personal.photo'),
        t('tips.personal.visa'),
        t('tips.personal.nationality'),
        t('tips.personal.contacts')
      ],
      icon: <User className="h-6 w-6 text-blue-600" />
    },
    {
      category: t('tips.experience.title'),
      tips: [
        t('tips.experience.uae'),
        t('tips.experience.context'),
        t('tips.experience.metrics'),
        t('tips.experience.government')
      ],
      icon: <FileText className="h-6 w-6 text-green-600" />
    },
    {
      category: t('tips.education.title'),
      tips: [
        t('tips.education.equivalency'),
        t('tips.education.uae'),
        t('tips.education.certifications'),
        t('tips.education.continuing')
      ],
      icon: <Target className="h-6 w-6 text-purple-600" />
    },
    {
      category: t('tips.cultural.title'),
      tips: [
        t('tips.cultural.arabic'),
        t('tips.cultural.awareness'),
        t('tips.cultural.business'),
        t('tips.cultural.customs')
      ],
      icon: <Sparkles className="h-6 w-6 text-orange-600" />
    }
  ];

  const tabs = [
    {
      id: 'builder',
      label: t('tabs.builder.label'),
      icon: <FileText className="h-4 w-4" />,
      content: (
        <div
          className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="text-center">
            <FileText className="h-16 w-16 mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('tabs.builder.label')}</h3>
            <p className="text-muted-foreground mb-4">{t('tabs.builder.description')}</p>
          </div>

          {/* CV Upload Parser Section - WITH CALLBACK */}
          <Card>
            <CardHeader>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Upload className="h-6 w-6 text-blue-600" />
                <CardTitle>{t('upload.title')}</CardTitle>
                {parsedCVData && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    ✅ Data Loaded
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CVUploadParser onParsedData={handleParsedData} />
            </CardContent>
          </Card>

          {/* CV Builder Wizard Section - NOW WRAPPED IN CVProvider */}
          <Card>
            <CardHeader>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Bot className="h-6 w-6 text-green-600" />
                <CardTitle>{t('wizard.title')}</CardTitle>
                {parsedCVData && (
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    📊 {parsedCVData.experience?.length || 0} Experience,{' '}
                    {parsedCVData.education?.length || 0} Education
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* ✅ Fix: Provide CV context only where needed */}
              <CVProvider>
                <CVBuilderWizard initialData={parsedCVData} />
              </CVProvider>

              {/* Debug info for development */}
              {parsedCVData && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="font-medium text-gray-700 mb-2">📊 Parsed Data Summary:</div>
                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    <div>Name: {parsedCVData.personalInfo?.fullName || 'N/A'}</div>
                    <div>Email: {parsedCVData.personalInfo?.email || 'N/A'}</div>
                    <div>Experience: {parsedCVData.experience?.length || 0} entries</div>
                    <div>Education: {parsedCVData.education?.length || 0} entries</div>
                    <div>Technical Skills: {parsedCVData.skills?.technical?.length || 0}</div>
                    <div>Soft Skills: {parsedCVData.skills?.soft?.length || 0}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'templates',
      label: t('tabs.templates.label'),
      icon: <Eye className="h-4 w-4" />,
      content: (
        <div
          className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="text-center">
            <Eye className="h-16 w-16 mx-auto text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('tabs.templates.label')}</h3>
            <p className="text-muted-foreground mb-4">{t('tabs.templates.description')}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div
                    className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {template.icon}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`bg-${template.color}-100 text-${template.color}-700`}
                    >
                      {template.badge}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <Button className="w-full">{t('templates.actions.preview')}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'tips',
      label: t('tabs.tips.label'),
      icon: <Target className="h-4 w-4" />,
      content: (
        <div
          className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="text-center">
            <Target className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('tabs.tips.label')}</h3>
            <p className="text-muted-foreground mb-4">{t('tabs.tips.description')}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {uaeTips.map((tipCategory, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {tipCategory.icon}
                    <CardTitle className="text-lg">{tipCategory.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tipCategory.tips.map((tip, tipIndex) => (
                      <div
                        key={tipIndex}
                        className={`flex items-start gap-3 ${
                          isRTL ? 'flex-row-reverse text-right' : ''
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      label: t('tabs.analytics.label'),
      icon: <BarChart3 className="h-4 w-4" />,
      content: (
        <div
          className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="text-center">
            <BarChart3 className="h-16 w-16 mx-auto text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('tabs.analytics.label')}</h3>
            <p className="text-muted-foreground mb-4">{t('tabs.analytics.description')}</p>
          </div>

          {/* Coming Soon Section */}
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    {t('analytics.comingSoon.badge')}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold">{t('analytics.comingSoon.title')}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t('analytics.comingSoon.description')}
                </p>

                {/* Preview Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-400">--</div>
                    <div className="text-sm text-gray-500">{t('analytics.metrics.views')}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-400">--</div>
                    <div className="text-sm text-gray-500">{t('analytics.metrics.downloads')}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-400">--</div>
                    <div className="text-sm text-gray-500">{t('analytics.metrics.score')}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-400">--</div>
                    <div className="text-sm text-gray-500">{t('analytics.metrics.ranking')}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ];

  return (
    <CareerPageLayout
      title={t('title')}
      description={t('description')}
      heroIcon={<FileText className="h-12 w-12" />}
      primaryActionLabel={t('actions.primary')}
      primaryActionIcon={<FileText className="h-4 w-4" />}
      secondaryActionLabel={t('actions.secondary')}
      secondaryActionIcon={<Eye className="h-4 w-4" />}
      stats={stats}
      quote={t('quote')}
      attribution={t('attribution')}
      quoteIcon={<FileText className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="builder"
    />
  );
};

export default CVBuilderPage;
