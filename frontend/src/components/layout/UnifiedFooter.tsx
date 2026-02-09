import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

export const UnifiedFooter: React.FC = () => {
    const { t } = useTranslation();

    return (
        <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* UAE Government Branding */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-3 mb-4">
                            <img
                                src="/api/placeholder/40/40"
                                alt="UAE Government"
                                className="h-10 w-10"
                            />
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t('footer.platform_name', 'Emirati Journey Platform')}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {t('footer.government_subtitle', 'UAE Nationals Career Development')}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {t('footer.description', 'Supporting UAE citizens throughout their journey from education to retirement, fostering career development, skills enhancement, and professional growth.')}
                        </p>
                        <div className="flex items-center space-x-4">
                            <img
                                src="/api/placeholder/80/40"
                                alt="Dubai Government"
                                className="h-8"
                            />
                            <img
                                src="/api/placeholder/80/40"
                                alt="EHRDC"
                                className="h-8"
                            />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                            {t('footer.quick_links', 'Quick Links')}
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/career-planning-hub"
                                    className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
                                >
                                    {t('navigation.career_planning', 'Career Planning')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/job-matching"
                                    className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
                                >
                                    {t('navigation.job_matching', 'Job Matching')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/cv-builder"
                                    className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
                                >
                                    {t('navigation.cv_builder', 'CV Builder')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/mentorship"
                                    className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
                                >
                                    {t('navigation.mentorship', 'Mentorship')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                            {t('footer.contact', 'Contact Us')}
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-start space-x-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p>{t('footer.location', 'Dubai, United Arab Emirates')}</p>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <p>{t('footer.phone', 'Phone')}: 048729292</p>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4" />
                                <p>{t('footer.email', 'Email')}: info@emiratijourney.ae</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-500">
                        © {new Date().getFullYear()} {t('footer.platform_name', 'Emirati Journey Platform')}. {t('footer.rights_reserved', 'All rights reserved.')}
                    </p>
                </div>
            </div>
        </footer>
    );
};
