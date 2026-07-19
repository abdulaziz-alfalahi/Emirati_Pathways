
import React from 'react';
import DubaiGovHeader from './DubaiGovHeader';
import Navbar from './Navbar';
// DubaiGovStickyBar removed per user request
import { MessageSquare, Zap, ThumbsUp, Phone, Mail, MapPin } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Dubai Government Standard Header */}
      <DubaiGovHeader />

      {/* Enhanced Navigation Bar */}
      <nav id="navigation" className="bg-card border-b border-ehrdc-neutral-light">
        <Navbar />
      </nav>

      <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>

      {/* Dubai Government Standard Footer */}
      <footer className="bg-[#111827] text-white border-t-2 border-primary" role="contentinfo">
        {/* Main Footer Section */}
        <div className="py-12 px-6">
          <div className="dubai-container">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
              {/* EHRDC Information */}
              <div className="lg:col-span-2">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center me-4">
                    <span className="text-white font-bold text-lg">EG</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-white">Emirati Gateway</h3>
                    <p className="text-gray-400 text-sm">EHRDC Digital Platform</p>
                  </div>
                </div>
                <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
                  Supporting UAE citizens throughout their journey from education to retirement,
                  fostering career development, skills enhancement, and professional growth.
                </p>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>Dubai, United Arab Emirates</span>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-6 text-lg text-white">Quick Links</h4>
                <ul className="space-y-3">
                  <li><a href="/about" className="text-white/80 hover:text-white transition-colors text-sm">About EHRDC</a></li>
                  <li><a href="/career-journey" className="text-white/80 hover:text-white transition-colors text-sm">Career Journey</a></li>
                  <li><a href="/training" className="text-white/80 hover:text-white transition-colors text-sm">Training Programs</a></li>
                  <li><a href="/scholarships" className="text-white/80 hover:text-white transition-colors text-sm">Scholarships</a></li>
                  <li><a href="/success-stories" className="text-white/80 hover:text-white transition-colors text-sm">Success Stories</a></li>
                </ul>
              </div>

              {/* Services */}
              <div>
                <h4 className="font-semibold mb-6 text-lg text-white">Services</h4>
                <ul className="space-y-3">
                  <li><a href="/job-matching" className="text-white/80 hover:text-white transition-colors text-sm">Job Matching</a></li>
                  <li><a href="/cv-builder" className="text-white/80 hover:text-white transition-colors text-sm">CV Builder</a></li>
                  <li><a href="/communities" className="text-white/80 hover:text-white transition-colors text-sm">Communities</a></li>
                  <li><a href="/mentorship" className="text-white/80 hover:text-white transition-colors text-sm">Mentorship</a></li>
                  <li><a href="/internships" className="text-white/80 hover:text-white transition-colors text-sm">Internships</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Government Standard Footer Section */}
        <div className="border-t border-white/20 py-6 px-6">
          <div className="dubai-container">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              {/* Government Services Links */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                {/* Dubai AI */}
                <a
                  href="https://www.dubaidigital.ae/en/dubaiAI.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
                >
                  <Zap className="h-4 w-4" />
                  <span>Dubai AI</span>
                </a>

                {/* 04 Suggestions */}
                <a
                  href="tel:04"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
                >
                  <Phone className="h-4 w-4" />
                  <span>04 Suggestions</span>
                </a>

                {/* Suggestions & Complaints */}
                <a
                  href="#complaints"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    // Open complaints modal or redirect
                    console.log('Open complaints form');
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Suggestions & Complaints</span>
                </a>

                {/* Happiness Meter */}
                <a
                  href="#happiness-meter"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    // Open happiness meter
                    console.log('Open happiness meter');
                  }}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Happiness Meter</span>
                </a>
              </div>

              {/* Copyright */}
              <div className="text-center lg:text-end">
                <div className="text-muted-foreground text-sm mb-2">
                  © {new Date().getFullYear()} Emirati Human Resources Development Council
                </div>
                <div className="flex flex-wrap justify-center lg:justify-end gap-4 text-xs text-muted-foreground">
                  <a href="/privacy" className="hover:text-white/80 transition-colors">Privacy Policy</a>
                  <a href="/terms" className="hover:text-white/80 transition-colors">Terms of Service</a>
                  <a href="/accessibility" className="hover:text-white/80 transition-colors">Accessibility</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>


    </div>
  );
};

export default Layout;
