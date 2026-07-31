
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useLanguage } from '@/context/EnhancedLanguageContext';

const EmptyConversation: React.FC = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">{t('No conversation selected', 'لم يتم اختيار محادثة')}</h3>
        <p className="mt-2 text-muted-foreground">
          {t('Select a conversation from the list to start messaging.', 'اختر محادثة من القائمة لبدء المراسلة.')}
        </p>
      </div>
    </div>
  );
};

export default EmptyConversation;
