import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { ShieldOff, ArrowLeft, ArrowRight, LayoutDashboard } from 'lucide-react';

/**
 * Shown when a signed-in user opens a page their role cannot access.
 *
 * It replaces `<Navigate to="/" replace />`, which sent people to the home page
 * without a word. Six separate feedback reports described that as a broken
 * button — CV Builder, Demographics Analytics, Profile Management, notifications
 * and two more (#353). Every one of those refusals was CORRECT; the platform
 * simply never said it had refused, and a silent bounce is indistinguishable
 * from a bug.
 *
 * The URL is deliberately left alone. The user can see where they tried to go,
 * and an operator reading a screenshot can see it too — both of which the
 * redirect destroyed.
 */

const prettyRole = (r: string) =>
  r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

interface AccessDeniedProps {
  /** Roles the route accepts, used only to tell the user who may open it. */
  allowedRoles?: string[];
  /** Roles the signed-in user actually holds. */
  userRoles?: string[];
  /** Where "go to my workspace" should lead. */
  dashboardPath?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  allowedRoles = [],
  userRoles = [],
  dashboardPath = '/',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const b = (en: string, ar: string) => (isRTL ? ar : en);

  // De-duplicate: several routes list the same role more than once.
  const allowed = Array.from(new Set(allowedRoles.map((r) => r.toLowerCase())));
  const mine = Array.from(new Set(userRoles.map((r) => r.toLowerCase())));

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-full bg-amber-50 p-3">
            <ShieldOff className="h-6 w-6 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900">
              {b('This page is not available to your role',
                 'هذه الصفحة غير متاحة لدورك')}
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {b('Nothing has gone wrong — the page exists, but it is restricted to other roles, so we did not open it. You were not sent here by mistake.',
                 'لم يحدث أي خطأ — الصفحة موجودة لكنها مقتصرة على أدوار أخرى، لذلك لم نفتحها. لم يتم إرسالك إلى هنا عن طريق الخطأ.')}
            </p>
          </div>
        </div>

        <dl className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <dt className="text-slate-500">{b('Page', 'الصفحة')}:</dt>
            <dd className="font-mono text-xs text-slate-800 break-all self-center">{location.pathname}</dd>
          </div>
          {mine.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="text-slate-500">{b('Your roles', 'أدوارك')}:</dt>
              <dd className="text-slate-800">{mine.map(prettyRole).join('، ')}</dd>
            </div>
          )}
          {allowed.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="text-slate-500">{b('Open to', 'متاحة لـ')}:</dt>
              <dd className="text-slate-800">{allowed.map(prettyRole).join('، ')}</dd>
            </div>
          )}
        </dl>

        <p className="mt-4 text-xs text-slate-500 leading-relaxed">
          {b('If you need this page for your work, ask platform operations to grant the role — access is granted by role, not per page.',
             'إذا كنت بحاجة إلى هذه الصفحة لعملك، اطلب من إدارة المنصة منحك الدور — يُمنح الوصول حسب الدور وليس لكل صفحة.')}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button className="gap-2" onClick={() => navigate(dashboardPath)}>
            <LayoutDashboard className="h-4 w-4" />
            {b('Go to my workspace', 'الذهاب إلى مساحة عملي')}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {b('Back', 'رجوع')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
