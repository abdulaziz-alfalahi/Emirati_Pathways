
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';

const EmptyConversation: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
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
