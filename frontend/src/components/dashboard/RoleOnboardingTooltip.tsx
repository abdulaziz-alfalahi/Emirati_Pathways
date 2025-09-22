
import React, { useState, useEffect } from 'react';
import { UserRole } from '@/types/auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { X, Info } from 'lucide-react';

interface RoleOnboardingTooltipProps {
  role: UserRole;
  children: React.ReactNode;
}

const roleOnboardingContent: Record<UserRole, { title: string; description: string; features: string[] }> = {
  school_student: {
    title: "Welcome, School Student!",
    description: "Your dashboard is now optimized for your educational journey.",
    features: ["Track academic progress", "Explore career paths", "Find internship opportunities"]
  },
  university_student: {
    title: "Welcome, University Student!",
    description: "Access advanced tools for your higher education journey.",
    features: ["Advanced skill assessments", "Industry connections", "Graduate program guidance"]
  },
  full_time_employee: {
    title: "Welcome, Professional!",
    description: "Your workspace is now configured for career advancement.",
    features: ["Skill development tracking", "Leadership opportunities", "Performance analytics"]
  },
  entrepreneur: {
    title: "Welcome, Entrepreneur!",
    description: "Tools and resources for building your business.",
    features: ["Business plan templates", "Investor connections", "Market analysis tools"]
  },
  educational_institution: {
    title: "Welcome, Educational Institution!",
    description: "Manage your institution's programs and students.",
    features: ["Student management", "Program analytics", "Accreditation tracking"]
  },
  private_sector_recruiter: {
    title: "Welcome, Recruiter!",
    description: "Find and connect with top talent.",
    features: ["Candidate matching", "Interview scheduling", "Hiring analytics"]
  },
  parent: {
    title: "Welcome, Parent!",
    description: "Support your child's educational and career journey.",
    features: ["Track child's progress", "Educational resources", "Career guidance tools"]
  },
  mentor: {
    title: "Welcome, Mentor!",
    description: "Guide and support others in their professional journey.",
    features: ["Mentee management", "Session scheduling", "Progress tracking"]
  },
  career_advisor: {
    title: "Welcome, Career Advisor!",
    description: "Provide expert guidance to career seekers.",
    features: ["Client management", "Assessment tools", "Career path planning"]
  },
  training_center: {
    title: "Welcome, Training Center!",
    description: "Manage training programs and track student progress.",
    features: ["Program management", "Student assessments", "Certification tracking"]
  },
  assessment_center: {
    title: "Welcome, Assessment Center!",
    description: "Create and manage professional assessments.",
    features: ["Assessment creation", "Result analytics", "Certification management"]
  },
  administrator: {
    title: "Welcome, Administrator!",
    description: "Full platform access and management capabilities.",
    features: ["User management", "System analytics", "Platform configuration"]
  },
  // Add defaults for other roles
  national_service_participant: {
    title: "Welcome to National Service!",
    description: "Track your service and career development.",
    features: ["Service tracking", "Skill development", "Future planning"]
  },
  intern: {
    title: "Welcome, Intern!",
    description: "Make the most of your internship experience.",
    features: ["Progress tracking", "Skill building", "Mentor connections"]
  },
  part_time_employee: {
    title: "Welcome, Part-time Professional!",
    description: "Balance work and other commitments effectively.",
    features: ["Flexible scheduling", "Skill development", "Career planning"]
  },
  gig_worker: {
    title: "Welcome, Gig Worker!",
    description: "Manage your freelance career successfully.",
    features: ["Project tracking", "Client management", "Skill marketing"]
  },
  jobseeker: {
    title: "Welcome, Job Seeker!",
    description: "Find your next career opportunity.",
    features: ["Job matching", "Application tracking", "Interview preparation"]
  },
  lifelong_learner: {
    title: "Welcome, Lifelong Learner!",
    description: "Continue your educational journey at any stage.",
    features: ["Course recommendations", "Skill assessments", "Learning paths"]
  },
  retiree: {
    title: "Welcome, Retiree!",
    description: "Explore new opportunities in retirement.",
    features: ["Volunteer opportunities", "Part-time work", "Knowledge sharing"]
  },
  government_representative: {
    title: "Welcome, Government Representative!",
    description: "Access policy tools and citizen services.",
    features: ["Policy analysis", "Citizen engagement", "Program management"]
  },
  retiree_advocate: {
    title: "Welcome, Retiree Advocate!",
    description: "Support and advocate for retiree communities.",
    features: ["Community programs", "Advocacy tools", "Resource sharing"]
  },
  platform_operator: {
    title: "Welcome, Platform Operator!",
    description: "Monitor and maintain platform operations.",
    features: ["System monitoring", "User support", "Performance analytics"]
  },
  super_user: {
    title: "Welcome, Super User!",
    description: "Ultimate platform access and control.",
    features: ["Full system access", "Advanced analytics", "Platform development"]
  }
};

const RoleOnboardingTooltip: React.FC<RoleOnboardingTooltipProps> = ({ role, children }) => {
  const [hasSeenTooltip, setHasSeenTooltip] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Check if user has seen tooltip for this role
    const seenTooltips = JSON.parse(localStorage.getItem('role_onboarding_seen') || '{}');
    const seen = seenTooltips[role] || false;
    setHasSeenTooltip(seen);
    
    // Show tooltip if not seen and after a brief delay
    if (!seen) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [role]);

  const handleDismiss = () => {
    setShowTooltip(false);
    setHasSeenTooltip(true);
    
    // Mark as seen in localStorage
    const seenTooltips = JSON.parse(localStorage.getItem('role_onboarding_seen') || '{}');
    seenTooltips[role] = true;
    localStorage.setItem('role_onboarding_seen', JSON.stringify(seenTooltips));
  };

  const content = roleOnboardingContent[role];
  if (!content) return <>{children}</>;

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip && !hasSeenTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <h4 className="font-medium">{content.title}</h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                onClick={handleDismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {content.description}
            </p>
            
            <div className="space-y-1">
              <p className="text-xs font-medium">New features available:</p>
              <ul className="text-xs space-y-1">
                {content.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <Button size="sm" className="w-full" onClick={handleDismiss}>
              Got it!
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RoleOnboardingTooltip;
