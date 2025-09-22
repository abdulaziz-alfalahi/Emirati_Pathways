
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

export const useLifelongEngagementTranslation = (namespace?: string) => {
  const namespaces = namespace ? [namespace, 'common'] : ['lifelong-engagement', 'common'];
  const { t } = useTranslation(namespaces);
  const { language } = useLanguage();

  const getTranslatedTitle = (titleKey: string) => {
    return t(`titles.${titleKey}`, { defaultValue: titleKey });
  };

  const getTranslatedDescription = (descKey: string) => {
    return t(`descriptions.${descKey}`, { defaultValue: descKey });
  };

  const getTranslatedSection = (sectionKey: string) => {
    return {
      title: t(`sections.${sectionKey}.title`, { defaultValue: sectionKey }),
      description: t(`sections.${sectionKey}.description`, { defaultValue: '' }),
      items: t(`sections.${sectionKey}.items`, { returnObjects: true, defaultValue: [] })
    };
  };

  const getTranslatedFeature = (featureKey: string) => {
    return {
      title: t(`features.${featureKey}.title`, { defaultValue: featureKey }),
      description: t(`features.${featureKey}.description`, { defaultValue: '' }),
      benefits: t(`features.${featureKey}.benefits`, { returnObjects: true, defaultValue: [] })
    };
  };

  const getTranslatedContent = (contentKey: string) => {
    return t(`content.${contentKey}`, { defaultValue: contentKey });
  };

  const formatTranslatedText = (text: string, params: Record<string, any> = {}) => {
    return t(text, { ...params, lng: language });
  };

  const isRTL = language === 'ar';

  return {
    t,
    language,
    isRTL,
    getTranslatedTitle,
    getTranslatedDescription,
    getTranslatedSection,
    getTranslatedFeature,
    getTranslatedContent,
    formatTranslatedText,
  };
};
