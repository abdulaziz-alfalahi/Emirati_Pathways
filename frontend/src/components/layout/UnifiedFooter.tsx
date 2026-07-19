import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

export const UnifiedFooter: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;

    return (
        <footer className="bg-[#111827] text-white border-t-2 border-primary mt-12" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* UAE Government Branding */}
                    <div className="col-span-1 md:col-span-2">
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'} mb-4`}>
                            <img
                                src="/dubai-gov-logo.jpg"
                                alt={t('Government of Dubai', 'حكومة دبي')}
                                className="h-9 w-auto opacity-90"
                            />
                            <div className="w-px h-8 bg-gray-700"></div>
                            <img
                                src="/ehrdc-logo.png"
                                alt={t('EHRDC Logo', 'شعار مجلس تنمية الموارد البشرية الإماراتية')}
                                className="h-8 w-auto opacity-90"
                            />
                        </div>
                        <h3 className="text-base font-semibold mb-1">
                            {t('Emirati Human Development Platform', 'منصة الإمارات للتنمية البشرية')}
                        </h3>
                        <p className="text-muted-foreground text-xs mb-3">
                            {t('UAE Nationals Career Development', 'تطوير المسيرة المهنية للمواطنين الإماراتيين')}
                        </p>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                            {t(
                                'Supporting UAE citizens throughout their journey from education to retirement, fostering career development, skills enhancement, and professional growth.',
                                'دعم المواطنين الإماراتيين في رحلتهم من التعليم إلى التقاعد، وتعزيز التطوير المهني وتنمية المهارات والنمو المهني.'
                            )}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-medium uppercase tracking-wider text-gray-400 mb-3">
                            {t('Quick Links', 'روابط سريعة')}
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/career-planning-hub"
                                    className="text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    {t('Career Planning', 'التخطيط المهني')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/job-matching"
                                    className="text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    {t('Job Matching', 'مطابقة الوظائف')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/cv-builder"
                                    className="text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    {t('CV Builder', 'إنشاء السيرة الذاتية')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/mentorship"
                                    className="text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    {t('Mentorship', 'الإرشاد المهني')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-sm font-medium uppercase tracking-wider text-gray-400 mb-3">
                            {t('Contact Us', 'اتصل بنا')}
                        </h4>
                        <div className="space-y-2">
                            <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} text-sm text-gray-400`}>
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p>{t('Dubai, United Arab Emirates', 'دبي، الإمارات العربية المتحدة')}</p>
                            </div>
                            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} text-sm text-gray-400`}>
                                <Phone className="h-4 w-4" />
                                <p>{t('Phone', 'الهاتف')}: 048729292</p>
                            </div>
                            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} text-sm text-gray-400`}>
                                <Mail className="h-4 w-4" />
                                <p>{t('Email', 'البريد الإلكتروني')}: info@emiratijourney.ae</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 pt-6 border-t border-gray-800">
                    <p className="text-center text-xs text-muted-foreground">
                        © {new Date().getFullYear()} {t('Emirati Human Development Platform', 'منصة الإمارات للتنمية البشرية')}. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}
                    </p>
                </div>
            </div>
        </footer>
    );
};
