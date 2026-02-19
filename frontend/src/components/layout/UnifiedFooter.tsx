import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

export const UnifiedFooter: React.FC = () => {
    const { t } = useTranslation();

    return (
        <footer className="bg-[#111827] text-white border-t-2 border-[#006E6D] mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* UAE Government Branding */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-3 mb-4">
                            <img
                                src="/dubai-gov-logo.jpg"
                                alt="Government of Dubai"
                                className="h-9 w-auto opacity-90"
                            />
                            <div className="w-px h-8 bg-gray-700"></div>
                            <img
                                src="/ehrdc-logo.png"
                                alt="EHRDC Logo"
                                className="h-8 w-auto opacity-90"
                            />
                        </div>
                        <h3 className="text-base font-semibold mb-1">
                            {t('footer.platform_name', 'Dubai Human Development Platform')}
                        </h3>
                        <p className="text-gray-500 text-xs mb-3">
                            {t('footer.government_subtitle', 'UAE Nationals Career Development')}
                        </p>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                            {t('footer.description', 'Supporting UAE citizens throughout their journey from education to retirement, fostering career development, skills enhancement, and professional growth.')}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-medium uppercase tracking-wider text-gray-400 mb-3">
                            {t('footer.quick_links', 'Quick Links')}
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/career-planning-hub"
                                    className="text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    {t('navigation.career_planning', 'Career Planning')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/job-matching"
                                    className="text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    {t('navigation.job_matching', 'Job Matching')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/cv-builder"
                                    className="text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    {t('navigation.cv_builder', 'CV Builder')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/mentorship"
                                    className="text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    {t('navigation.mentorship', 'Mentorship')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-sm font-medium uppercase tracking-wider text-gray-400 mb-3">
                            {t('footer.contact', 'Contact Us')}
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-start space-x-2 text-sm text-gray-400">
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p>{t('footer.location', 'Dubai, United Arab Emirates')}</p>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                                <Phone className="h-4 w-4" />
                                <p>{t('footer.phone', 'Phone')}: 048729292</p>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                                <Mail className="h-4 w-4" />
                                <p>{t('footer.email', 'Email')}: info@emiratijourney.ae</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 pt-6 border-t border-gray-800">
                    <p className="text-center text-xs text-gray-500">
                        © {new Date().getFullYear()} {t('footer.platform_name', 'Dubai Human Development Platform')}. {t('footer.rights_reserved', 'All rights reserved.')}
                    </p>
                </div>
            </div>
        </footer>
    );
};
