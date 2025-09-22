
import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Award, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface Camp {
  title: string;
  description: string;
  duration: string;
  ageGroup: string;
  location: string;
  price: string;
}

interface Stat {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface MemoizedSummerCampsContentProps {
  stats: Stat[];
  camps: Camp[];
  t: (key: string) => string;
  onApplyClick: (campIndex: number) => void;
}

const MemoizedSummerCampsContent: React.FC<MemoizedSummerCampsContentProps> = memo(({
  stats,
  camps,
  t,
  onApplyClick
}) => {
  const { isRTL, language } = useLanguage();

  const memoizedStats = useMemo(() => stats.map((stat, index) => {
    const IconComponent = stat.icon;
    const statId = `stat-${index}`;
    
    return (
      <Card key={statId} className="text-center" role="img" aria-labelledby={`${statId}-label`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center mb-2" aria-hidden="true">
            <IconComponent className="h-8 w-8 text-orange-600" />
          </div>
          <div className={cn(
            "text-2xl font-bold text-gray-900 mb-1",
            isRTL && "rtl:font-arabic"
          )} aria-label={`${stat.value} ${stat.label}`}>
            {stat.value}
          </div>
          <div 
            id={`${statId}-label`}
            className={cn(
              "text-sm text-gray-600",
              isRTL && "rtl:font-arabic"
            )}
          >
            {stat.label}
          </div>
        </CardContent>
      </Card>
    );
  }), [stats, isRTL]);

  const memoizedCamps = useMemo(() => camps.map((camp, index) => {
    const campId = `camp-${index}`;
    const applyButtonId = `apply-button-${index}`;
    
    return (
      <Card 
        key={campId} 
        className={cn(
          "transition-all duration-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-orange-500",
          isRTL && "rtl:text-right"
        )}
        role="article"
        aria-labelledby={`${campId}-title`}
        aria-describedby={`${campId}-description`}
      >
        <CardHeader className={cn(
          isRTL && "rtl:text-right"
        )}>
          <CardTitle 
            id={`${campId}-title`}
            className={cn(
              "text-lg",
              isRTL && "rtl:text-right rtl:font-arabic"
            )}
          >
            {camp.title}
          </CardTitle>
          <p 
            id={`${campId}-description`}
            className={cn(
              "text-muted-foreground",
              isRTL && "rtl:text-right rtl:font-arabic rtl:leading-relaxed"
            )}
          >
            {camp.description}
          </p>
        </CardHeader>
        <CardContent className={cn(
          isRTL && "rtl:text-right"
        )}>
          <div className={cn(
            "space-y-2 mb-4",
            isRTL && "rtl:space-y-2"
          )} role="list" aria-label={language === 'ar' ? 'تفاصيل المخيم' : 'Camp details'}>
            
            <div className={cn(
              "flex justify-between text-sm",
              isRTL && "rtl:flex-row-reverse rtl:text-right"
            )} role="listitem">
              <span className={cn(isRTL && "rtl:font-arabic")} aria-label={t('info.duration')}>
                {t('info.duration')}:
              </span>
              <span className={cn(isRTL && "rtl:font-arabic")} aria-describedby={`${campId}-duration`}>
                <span id={`${campId}-duration`}>{camp.duration}</span>
              </span>
            </div>
            
            <div className={cn(
              "flex justify-between text-sm",
              isRTL && "rtl:flex-row-reverse rtl:text-right"
            )} role="listitem">
              <span className={cn(isRTL && "rtl:font-arabic")} aria-label={t('ui.filters.ageGroup')}>
                {t('ui.filters.ageGroup')}:
              </span>
              <span className={cn(isRTL && "rtl:font-arabic")} aria-describedby={`${campId}-age`}>
                <span id={`${campId}-age`}>{camp.ageGroup}</span>
              </span>
            </div>
            
            <div className={cn(
              "flex justify-between text-sm",
              isRTL && "rtl:flex-row-reverse rtl:text-right"
            )} role="listitem">
              <span className={cn(isRTL && "rtl:font-arabic")} aria-label={t('ui.filters.location')}>
                {t('ui.filters.location')}:
              </span>
              <span className={cn(isRTL && "rtl:font-arabic")} aria-describedby={`${campId}-location`}>
                <span id={`${campId}-location`}>{camp.location}</span>
              </span>
            </div>
            
            <div className={cn(
              "flex justify-between items-center",
              isRTL && "rtl:flex-row-reverse rtl:text-right"
            )} role="listitem">
              <span className={cn(
                "text-sm",
                isRTL && "rtl:font-arabic"
              )} aria-label={t('info.price')}>
                {t('info.price')}:
              </span>
              <Badge 
                variant="secondary" 
                className={cn(isRTL && "rtl:font-arabic")}
                aria-label={`${t('info.price')}: ${camp.price}`}
              >
                {camp.price}
              </Badge>
            </div>
          </div>
          
          <Button 
            id={applyButtonId}
            className={cn(
              "w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
              isRTL && "rtl:font-arabic"
            )}
            onClick={() => onApplyClick(index)}
            aria-describedby={`${campId}-title ${campId}-description`}
            aria-label={`${t('ui.buttons.applyNow')} ${camp.title}`}
          >
            {t('ui.buttons.applyNow')}
          </Button>
        </CardContent>
      </Card>
    );
  }), [camps, t, isRTL, onApplyClick, language]);

  return (
    <div role="main" aria-label={language === 'ar' ? 'محتوى المخيمات الصيفية' : 'Summer camps content'}>
      {/* Stats Grid */}
      <section aria-labelledby="stats-heading" className="mb-8">
        <h2 id="stats-heading" className="sr-only">
          {language === 'ar' ? 'إحصائيات المخيمات الصيفية' : 'Summer camps statistics'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list">
          {memoizedStats}
        </div>
      </section>

      {/* Camps Grid */}
      <section aria-labelledby="camps-heading">
        <h2 id="camps-heading" className="sr-only">
          {language === 'ar' ? 'قائمة المخيمات الصيفية المتاحة' : 'Available summer camps'}
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list">
          {memoizedCamps}
        </div>
      </section>
    </div>
  );
});

MemoizedSummerCampsContent.displayName = 'MemoizedSummerCampsContent';

export default MemoizedSummerCampsContent;
