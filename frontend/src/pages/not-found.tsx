
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-[65vh] flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-b from-white to-slate-50">
        {/* Animated 404 */}
        <div className="relative mb-6">
          <h1 className="text-[120px] font-dubai-bold text-transparent bg-clip-text bg-gradient-to-br from-teal-500 to-teal-700 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 text-[120px] font-dubai-bold text-teal-200/20 leading-none select-none blur-lg">
            404
          </div>
        </div>

        {/* Content */}
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-dubai-bold text-slate-900 mb-3">
            Page not found
          </h2>
          <p className="text-slate-500 font-dubai-medium mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium shadow-sm px-6">
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="font-dubai-medium border-slate-200 hover:bg-slate-50">
              <Link to="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>

          {/* Helpful Links */}
          <div className="border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-400 font-dubai-medium uppercase tracking-wider mb-3">
              You might be looking for
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { to: '/career-journey', label: 'Career Journey' },
                { to: '/training-programs', label: 'Training' },
                { to: '/job-matching', label: 'Job Matching' },
                { to: '/communities', label: 'Communities' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-1.5 rounded-full text-xs font-dubai-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundPage;
