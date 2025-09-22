
import React, { useState } from 'react';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent, EmptyTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { SkillsAssessment } from '@/components/digital-skills/SkillsAssessment';
import { LearningPathways } from '@/components/digital-skills/LearningPathways';
import { CourseCatalog } from '@/components/digital-skills/CourseCatalog';
import { PracticeLab } from '@/components/digital-skills/PracticeLab';
import { IndustryProjects } from '@/components/digital-skills/IndustryProjects';
import { MentorMatching } from '@/components/digital-skills/MentorMatching';
import { ProgressDashboard } from '@/components/digital-skills/ProgressDashboard';
import { EmployerConnections } from '@/components/digital-skills/EmployerConnections';
import { Code, BookOpen, Users, TrendingUp, Zap, Target, Activity, Building } from 'lucide-react';

const DigitalSkillsPage: React.FC = () => {
  const statsItems: StatItem[] = [
    {
      value: "300+",
      label: "Available Courses",
      icon: BookOpen
    },
    {
      value: "15,000+",
      label: "Certified Learners",
      icon: Users
    },
    {
      value: "12",
      label: "Skill Tracks",
      icon: TrendingUp
    },
    {
      value: "92%",
      label: "Completion Rate",
      icon: Target
    },
    {
      value: "50+",
      label: "Digital Skills Covered",
      icon: Code
    },
    {
      value: "24/7",
      label: "Practice Lab Access",
      icon: Activity
    }
  ];

  const tabs: TabItem[] = [
    {
      id: "assessment",
      label: "Skills Assessment",
      icon: <Target className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Digital Skills Assessment"
          icon={<Target className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Evaluate your current digital skills and identify areas for improvement"
        >
          <SkillsAssessment />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "pathways",
      label: "Learning Pathways",
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Personalized Learning Pathways"
          icon={<TrendingUp className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Follow structured learning paths tailored to your career goals"
        >
          <LearningPathways />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "catalog",
      label: "Course Catalog",
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Digital Skills Course Catalog"
          icon={<BookOpen className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Browse our comprehensive collection of digital skills courses"
        >
          <CourseCatalog />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "lab",
      label: "Practice Lab",
      icon: <Code className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Hands-On Practice Lab"
          icon={<Code className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Practice your skills in real-world scenarios with interactive exercises"
        >
          <PracticeLab />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "projects",
      label: "Industry Projects",
      icon: <Zap className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Real Industry Projects"
          icon={<Zap className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Work on actual industry projects to build your portfolio"
        >
          <IndustryProjects />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "mentors",
      label: "Expert Mentors",
      icon: <Users className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Connect with Expert Mentors"
          icon={<Users className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Get guidance from industry experts and experienced professionals"
        >
          <MentorMatching />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "progress",
      label: "My Progress",
      icon: <Activity className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Learning Progress Dashboard"
          icon={<Activity className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Track your learning journey and achievements"
        >
          <ProgressDashboard />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "employers",
      label: "Employer Network",
      icon: <Building className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Connect with Employers"
          icon={<Building className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Network with potential employers and showcase your digital skills"
        >
          <EmployerConnections />
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Digital Skills Development"
      description="Build future-ready technology competencies through personalized learning paths, hands-on practice, and expert mentorship. Master the digital skills that matter most in today's economy."
      icon={<Code className="h-8 w-8 text-white" />}
      stats={statsItems}
      tabs={tabs}
      defaultTab="assessment"
      showProgress={true}
      progressStep={1}
      totalSteps={4}
      stepLabel="Skills Assessment & Path Selection"
      ctaTitle="Ready to Advance Your Digital Career?"
      ctaDescription="Complete your skills assessment and unlock personalized learning recommendations"
      ctaActionLabel="Start Professional Certification"
      ctaActionHref="/professional-certifications"
    />
  );
};

export default DigitalSkillsPage;
