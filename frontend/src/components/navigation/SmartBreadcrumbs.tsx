/**
 * Dynamic Breadcrumb Navigation with Phase Context
 * Provides hierarchical navigation with cross-phase awareness
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, ArrowLeft, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePhase, Phase } from '@/context/PhaseContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
  phase?: Phase;
  isActive?: boolean;
}

interface SmartBreadcrumbsProps {
  customItems?: BreadcrumbItem[];
  showPhaseContext?: boolean;
  showBackButton?: boolean;
}

export const SmartBreadcrumbs: React.FC<SmartBreadcrumbsProps> = ({
  customItems,
  showPhaseContext = true,
  showBackButton = true
}) => {
  const location = useLocation();
  const { currentPhase, phaseInfo, detectPhaseFromPath } = usePhase();

  // Route to breadcrumb mapping
  const routeMap: Record<string, BreadcrumbItem[]> = {
    '/dashboard': [
      { label: 'Home', href: '/' },
      { label: 'Dashboard', isActive: true }
    ],
    '/career-planning-hub': [
      { label: 'Home', href: '/' },
      { label: 'Career Entry', phase: 'career' },
      { label: 'Career Planning Hub', isActive: true }
    ],
    '/job-matching': [
      { label: 'Home', href: '/' },
      { label: 'Career Entry', phase: 'career' },
      { label: 'Job Matching', isActive: true }
    ],
    '/resume-builder': [
      { label: 'Home', href: '/' },
      { label: 'Career Entry', phase: 'career' },
      { label: 'Resume Builder', isActive: true }
    ],
    '/portfolio': [
      { label: 'Home', href: '/' },
      { label: 'Career Entry', phase: 'career' },
      { label: 'Portfolio', isActive: true }
    ],
    '/interview-preparation': [
      { label: 'Home', href: '/' },
      { label: 'Career Entry', phase: 'career' },
      { label: 'Interview Preparation', isActive: true }
    ],
    '/professional-certifications': [
      { label: 'Home', href: '/' },
      { label: 'Professional Growth', phase: 'professional' },
      { label: 'Professional Certifications', isActive: true }
    ],
    '/digital-skills-development': [
      { label: 'Home', href: '/' },
      { label: 'Professional Growth', phase: 'professional' },
      { label: 'Digital Skills Development', isActive: true }
    ],
    '/mentorship': [
      { label: 'Home', href: '/' },
      { label: 'Professional Growth', phase: 'professional' },
      { label: 'Mentorship', isActive: true }
    ],
    '/communities': [
      { label: 'Home', href: '/' },
      { label: 'Professional Growth', phase: 'professional' },
      { label: 'Communities', isActive: true }
    ],
    '/assessments': [
      { label: 'Home', href: '/' },
      { label: 'Professional Growth', phase: 'professional' },
      { label: 'Assessments', isActive: true }
    ],
    '/knowledge-camps': [
      { label: 'Home', href: '/' },
      { label: 'Education Pathway', phase: 'education' },
      { label: 'Knowledge Camps', isActive: true }
    ],
    '/scholarships': [
      { label: 'Home', href: '/' },
      { label: 'Education Pathway', phase: 'education' },
      { label: 'Scholarships', isActive: true }
    ],
    '/university-programs': [
      { label: 'Home', href: '/' },
      { label: 'Education Pathway', phase: 'education' },
      { label: 'University Programs', isActive: true }
    ],
    '/lms': [
      { label: 'Home', href: '/' },
      { label: 'Education Pathway', phase: 'education' },
      { label: 'Learning Management System', isActive: true }
    ],
    '/share-success-stories': [
      { label: 'Home', href: '/' },
      { label: 'Lifelong Engagement', phase: 'lifelong' },
      { label: 'Success Stories', isActive: true }
    ],
    '/financial-planning': [
      { label: 'Home', href: '/' },
      { label: 'Lifelong Engagement', phase: 'lifelong' },
      { label: 'Financial Planning', isActive: true }
    ],
    '/thought-leadership': [
      { label: 'Home', href: '/' },
      { label: 'Lifelong Engagement', phase: 'lifelong' },
      { label: 'Thought Leadership', isActive: true }
    ],
    '/national-service': [
      { label: 'Home', href: '/' },
      { label: 'Lifelong Engagement', phase: 'lifelong' },
      { label: 'National Service', isActive: true }
    ]
  };

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) return customItems;

    const path = location.pathname;

    // Check exact matches first
    if (routeMap[path]) {
      return routeMap[path];
    }

    // Handle dynamic routes
    const pathSegments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ];

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Detect phase from current path
      const phase = detectPhaseFromPath(currentPath);

      // Format segment label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const isActive = index === pathSegments.length - 1;

      breadcrumbs.push({
        label,
        href: isActive ? undefined : currentPath,
        phase,
        isActive
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const goBack = () => window.history.back();

  const getPhaseColor = (phase: Phase) => {
    return phaseInfo[phase]?.color || '#006E6D';
  };

  const renderPhaseContext = () => {
    if (!showPhaseContext || !currentPhase) return null;

    const phaseData = phaseInfo[currentPhase];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 ms-4 ps-4 border-s border-border">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: phaseData.color }}
              />
              <span className="text-sm font-medium text-muted-foreground">
                {phaseData.name}
              </span>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-medium">{phaseData.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{phaseData.description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderContextualActions = () => {
    // Show relevant actions based on current page
    const path = location.pathname;
    const actions = [];

    if (path.includes('career')) {
      actions.push(
        <Link key="explore-industries" to="/career-planning-hub">
          <Button variant="outline" size="sm">
            Explore Industries
          </Button>
        </Link>
      );
    }

    if (path.includes('professional')) {
      actions.push(
        <Link key="find-mentor" to="/mentorship">
          <Button variant="outline" size="sm">
            Find Mentor
          </Button>
        </Link>
      );
    }

    if (actions.length === 0) return null;

    return (
      <div className="flex items-center gap-2 ms-auto">
        {actions}
      </div>
    );
  };

  return (
    <nav className="flex items-center justify-between py-3 px-4 bg-card border-b border-border">
      <div className="flex items-center flex-1">
        {/* Back Button */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="me-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 me-2" />
            Back
          </Button>
        )}

        {/* Breadcrumb Trail */}
        <ol className="flex items-center space-x-2">
          {breadcrumbs.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              )}

              <div className="flex items-center gap-2">
                {item.href ? (
                  <Link
                    to={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {index === 0 && <Home className="h-4 w-4 me-1" />}
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                )}

                {item.phase && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: getPhaseColor(item.phase),
                      color: getPhaseColor(item.phase)
                    }}
                  >
                    {phaseInfo[item.phase].name}
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ol>

        {/* Phase Context */}
        {renderPhaseContext()}
      </div>

      {/* Contextual Actions */}
      {renderContextualActions()}
    </nav>
  );
};
