
export const formatTime = (timestamp: string, locale: 'en' | 'ar' = 'en') => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(locale === 'ar' ? 'ar-AE' : 'en-US', { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (timestamp: string, locale: 'en' | 'ar' = 'en') => {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return locale === 'ar' ? 'اليوم' : 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return locale === 'ar' ? 'أمس' : 'Yesterday';
  } else {
    return date.toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-US');
  }
};
