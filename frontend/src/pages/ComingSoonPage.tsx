import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ComingSoon from '@/components/common/ComingSoon';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';

const ComingSoonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const moduleName = searchParams.get('module') || t('This Feature', 'هذه الميزة');
  const description = searchParams.get('desc') || t(
    'This platform feature is currently being upgraded or is temporarily disabled by an Administrator. Please check back later.',
    'يتم حالياً ترقية هذه الميزة في المنصة أو تم تعطيلها مؤقتاً بواسطة مسؤول النظام. يرجى التحقق مرة أخرى لاحقاً.'
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <HybridGovernmentNavFixed />
      <div className="flex-1">
        <ComingSoon 
          title={isRTL ? `${moduleName} قريباً` : `${moduleName} - Coming Soon`}
          description={description}
        />
      </div>
    </div>
  );
};

export default ComingSoonPage;
