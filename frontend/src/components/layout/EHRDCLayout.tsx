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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-teal-50">
      {/* Enhanced Government Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Government Logos Section */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <img 
                  src="/dubai-gov-logo.jpg" 
                  alt="Government of Dubai" 
                  className="h-14 w-auto"
                />
                <div className="w-px h-12 bg-slate-300"></div>
                <img 
                  src="/ehrdc-logo.png" 
                  alt="EHRDC Logo" 
                  className="h-12 w-auto"
                />
              </div>
              <div className="hidden md:block">
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-xl font-bold text-slate-900">Emirati Journey Platform</h1>
                  <p className="text-sm text-slate-600">UAE Nationals Career Development</p>
                </Link>
              </div>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 capitalize">{user.role}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">U</span>
                    </div>
                    <span className="hidden sm:block text-sm text-slate-700">UAE National</span>
                  </div>
                </div>
              ) : (
                <>
                  <Link 
                    to="/auth" 
                    className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/auth" 
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg flex items-center"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Enhanced Navigation Bar with EHRDC Theme */}
      <nav className="bg-white border-b border-teal-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            {isMobile ? (
              <MobileMenu />
            ) : (
              <DesktopMenu navGroups={navigationGroups} />
            )}
          </div>
        </div>
      </nav>
      
      <main className="flex-1" tabIndex={-1}>{children}</main>
      
      {/* Enhanced Footer with EHRDC Theme */}
      <footer className="bg-gradient-to-r from-slate-900 to-teal-900 text-white" role="contentinfo">
        {/* Main Footer Section */}
        <div className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
              {/* Government Logos and Information */}
              <div className="lg:col-span-2">
                <div className="flex items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <img 
                      src="/dubai-gov-logo.jpg" 
                      alt="Government of Dubai" 
                      className="h-12 w-auto opacity-90"
                    />
                    <div className="w-px h-10 bg-white/30"></div>
                    <img 
                      src="/ehrdc-logo.png" 
                      alt="EHRDC Logo" 
                      className="h-10 w-auto opacity-90"
                    />
                  </div>
                </div>
                <h3 className="font-bold text-xl text-white mb-2">Emirati Journey Platform</h3>
                <p className="text-slate-300 text-sm mb-4">UAE Nationals Career Development</p>
                <p className="text-white/90 mb-6 leading-relaxed max-w-md">
                  Supporting UAE citizens throughout their journey from education to retirement, 
                  fostering career development, skills enhancement, and professional growth.
                </p>
                <div className="flex items-center space-x-3 text-sm text-white/80">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>Dubai, United Arab Emirates</span>
                </div>
              </div>

              {/* Platform Navigation */}
              <div>
                <h4 className="font-semibold mb-6 text-lg text-white">Platform</h4>
                <ul className="space-y-3">
                  <li><Link to="/job-seekers" className="text-white/80 hover:text-white transition-colors text-sm">Job Seekers</Link></li>
                  <li><Link to="/hr-recruiters" className="text-white/80 hover:text-white transition-colors text-sm">HR & Recruiters</Link></li>
                  <li><Link to="/educators" className="text-white/80 hover:text-white transition-colors text-sm">Educators</Link></li>
                  <li><Link to="/mentors" className="text-white/80 hover:text-white transition-colors text-sm">Mentors</Link></li>
                  <li><Link to="/assessors" className="text-white/80 hover:text-white transition-colors text-sm">Assessors</Link></li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="font-semibold mb-6 text-lg text-white">Support</h4>
                <ul className="space-y-3">
                  <li><Link to="/help" className="text-white/80 hover:text-white transition-colors text-sm">Help Center</Link></li>
                  <li><Link to="/contact" className="text-white/80 hover:text-white transition-colors text-sm">Contact Us</Link></li>
                  <li><Link to="/privacy" className="text-white/80 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="text-white/80 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Government Standard Footer Section */}
        <div className="border-t border-white/20 py-6 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              {/* Government Services Links */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                <a 
                  href="https://www.dubaidigital.ae/en/dubaiAI.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
                >
                  <Zap className="h-4 w-4" />
                  <span>Dubai AI</span>
                </a>
                
                <a 
                  href="tel:04" 
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
                >
                  <Phone className="h-4 w-4" />
                  <span>04 Suggestions</span>
                </a>
                
                <a 
                  href="#complaints" 
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Suggestions & Complaints</span>
                </a>
                
                <a 
                  href="#happiness-meter" 
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Happiness Meter</span>
                </a>
              </div>
              
              {/* Copyright */}
              <div className="text-center lg:text-right">
                <div className="text-white/70 text-sm mb-2">
                  © 2025 Emirati Human Resources Development Council
                </div>
                <div className="flex flex-wrap justify-center lg:justify-end gap-4 text-xs text-white/60">
                  <Link to="/privacy" className="hover:text-white/80 transition-colors">Privacy Policy</Link>
                  <Link to="/terms" className="hover:text-white/80 transition-colors">Terms of Service</Link>
                  <Link to="/accessibility" className="hover:text-white/80 transition-colors">Accessibility</Link>
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
