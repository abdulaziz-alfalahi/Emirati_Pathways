import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface GovernmentHeaderProps {
  showAuthButtons?: boolean;
  currentPage?: string;
  userRole?: string;
}

const GovernmentHeader: React.FC<GovernmentHeaderProps> = ({
  showAuthButtons = true,
  currentPage = '',
  userRole = ''
}) => {
  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
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
                <h1 className="text-xl font-bold text-slate-900">Emirati Human Development Platform</h1>
                <p className="text-sm text-slate-600">UAE Nationals Career Development</p>
              </Link>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-4">
            {showAuthButtons ? (
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
            ) : (
              <div className="flex items-center space-x-4">
                {userRole && (
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 capitalize">{userRole}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">U</span>
                  </div>
                  <span className="hidden sm:block text-sm text-slate-700">UAE National</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default GovernmentHeader;
