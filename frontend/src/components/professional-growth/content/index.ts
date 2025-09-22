
export { ProfessionalDevelopmentCard } from './ProfessionalDevelopmentCard';
export { SkillAssessmentInterface } from './SkillAssessmentInterface';
export { MentorshipInterface } from './MentorshipInterface';
export { InnovationProjectShowcase } from './InnovationProjectShowcase';
export { NetworkingEventDisplay } from './NetworkingEventDisplay';
export { SuccessStoryPresentation } from './SuccessStoryPresentation';
export { LeadershipModuleInterface } from './LeadershipModuleInterface';

// Type exports - using simpler approach without complex type re-exports
export type ProfessionalDevelopmentCardProps = {
  title: string;
  description: string;
  level: string;
  duration: string;
  category: string;
};

export type SkillAssessmentComponent = {
  id: string;
  name: string;
  type: string;
};

export type MentorshipInterfaceProps = {
  mentorId: string;
  status: string;
};

export type AssessmentQuestion = {
  id: string;
  question: string;
  type: string;
};

export type ProgressMetrics = {
  completed: number;
  total: number;
  percentage: number;
};

export type Resource = {
  id: string;
  title: string;
  type: string;
  url: string;
};

export type ActionItem = {
  id: string;
  action: string;
  status: string;
};

export type MentorProfile = {
  id: string;
  name: string;
  expertise: string[];
};

export type MatchingCriteria = {
  skills: string[];
  interests: string[];
};

export type ConnectionStatus = 'pending' | 'connected' | 'disconnected';

export type CommunicationTool = {
  name: string;
  type: string;
};

export type MentorshipProgress = {
  sessions: number;
  goals: number;
};

export type FeedbackInterface = {
  rating: number;
  comments: string;
};

export type InnovationProject = {
  id: string;
  title: string;
  status: string;
};

export type NetworkingEvent = {
  id: string;
  name: string;
  date: string;
};

export type SuccessStory = {
  id: string;
  title: string;
  author: string;
};

export type LeadershipModule = {
  id: string;
  name: string;
  completed: boolean;
};
