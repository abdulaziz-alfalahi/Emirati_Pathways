import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Zap, ThumbsUp, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopMenu } from './DesktopMenu';
import MobileMenu from './MobileMenu';
import { navigationGroups } from '@/components/navigation/navigationConfig';

interface EHRDCLayoutProps {
  children: React.ReactNode;
}

const EHRDCLayout: React.FC<EHRDCLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFC]">
      {/* ─── Clean Header ─── */}
      <header className="bg-card border-b border-[#E2E5E9] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Government Logos */}
            <div className="flex items-center space-x-5">
              <div className="flex items-center space-x-3">
                <img
                  src="/dubai-gov-logo.jpg"
                  alt="Government of Dubai"
                  className="h-10 w-auto"
                />
                <div className="w-px h-8 bg-[#E2E5E9]"></div>
                <img
                  src="/ehrdc-logo.png"
                  alt="EHRDC Logo"
                  className="h-9 w-auto"
                />
              </div>
              <div className="hidden md:block">
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-base font-semibold text-[#1A1A1A]">Emirati Human Development Platform</h1>
                  <p className="text-xs text-[#6B7280]">UAE Nationals Career Development</p>
                </Link>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span className="text-sm text-[#6B7280] capitalize">{user.role}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">U</span>
                    </div>
                    <span className="hidden sm:block text-sm text-[#374151]">UAE National</span>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="text-[#374151] hover:text-[#1A1A1A] font-medium text-sm transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth"
                    className="bg-primary hover:bg-[var(--ehrdc-teal-700)] text-white px-5 py-2 rounded-full font-medium text-sm transition-colors flex items-center"
                  >
                    Get Started
                    <ArrowRight className="w-3.5 h-3.5 ms-1.5" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Navigation Bar ─── */}
      <nav className="bg-card border-b border-[#E2E5E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center">
            {isMobile ? (
              <MobileMenu />
            ) : (
              <DesktopMenu navGroups={navigationGroups} />
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1" tabIndex={-1}>{children}</main>

      {/* ─── Footer ─── */}
      <footer className="bg-[#111827] text-white border-t-2 border-primary" role="contentinfo">
        {/* Main Footer */}
        <div className="py-10 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
              {/* Logo & Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center mb-5">
                  <div className="flex items-center space-x-3">
                    <img
                      src="/dubai-gov-logo.jpg"
                      alt="Government of Dubai"
                      className="h-10 w-auto opacity-90"
                    />
                    <div className="w-px h-8 bg-white/20"></div>
                    <img
                      src="/ehrdc-logo.png"
                      alt="EHRDC Logo"
                      className="h-9 w-auto opacity-90"
                    />
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-white mb-1">Emirati Human Development Platform</h3>
                <p className="text-gray-400 text-sm mb-4">UAE Nationals Career Development</p>
                <p className="text-gray-300 text-sm mb-5 leading-relaxed max-w-md">
                  Supporting UAE citizens throughout their journey from education to retirement,
                  fostering career development, skills enhancement, and professional growth.
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Dubai, United Arab Emirates</span>
                </div>
              </div>

              {/* Platform Links */}
              <div>
                <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-gray-300">Platform</h4>
                <ul className="space-y-2.5">
                  <li><Link to="/job-seekers" className="text-gray-400 hover:text-white transition-colors text-sm">Job Seekers</Link></li>
                  <li><Link to="/hr-recruiters" className="text-gray-400 hover:text-white transition-colors text-sm">HR & Recruiters</Link></li>
                  <li><Link to="/educators" className="text-gray-400 hover:text-white transition-colors text-sm">Educators</Link></li>
                  <li><Link to="/mentors" className="text-gray-400 hover:text-white transition-colors text-sm">Mentors</Link></li>
                  <li><Link to="/assessors" className="text-gray-400 hover:text-white transition-colors text-sm">Assessors</Link></li>
                </ul>
              </div>

              {/* Support Links */}
              <div>
                <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-gray-300">Support</h4>
                <ul className="space-y-2.5">
                  <li><Link to="/help" className="text-gray-400 hover:text-white transition-colors text-sm">Help Center</Link></li>
                  <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">Contact Us</Link></li>
                  <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Government Bottom Bar */}
        <div className="border-t border-white/10 py-5 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              {/* Government Links */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-5">
                <a
                  href="https://www.dubaidigital.ae/en/dubaiAI.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Dubai AI</span>
                </a>

                <a
                  href="tel:04"
                  className="flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>04 Suggestions</span>
                </a>

                <a
                  href="#complaints"
                  className="flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Suggestions & Complaints</span>
                </a>

                <a
                  href="#happiness-meter"
                  className="flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>Happiness Meter</span>
                </a>
              </div>

              {/* Copyright */}
              <div className="text-center lg:text-end">
                <div className="text-muted-foreground text-xs mb-1">
                  © 2025 Emirati Human Resources Development Council
                </div>
                <div className="flex flex-wrap justify-center lg:justify-end gap-3 text-xs text-muted-foreground">
                  <Link to="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
                  <Link to="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
                  <Link to="/accessibility" className="hover:text-gray-300 transition-colors">Accessibility</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EHRDCLayout;
