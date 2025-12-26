/**
 * Recruiter Components Index
 * Central export file for all recruiter dashboard components
 */

// Main dashboard components
export { default as EnhancedRecruiterDashboard } from './EnhancedRecruiterDashboard';
export { default as CandidateMatching } from './CandidateMatching';
export { default as JobDescriptionsList } from './JobDescriptionsList';
export { default as EnhancedJobPosting } from './EnhancedJobPosting';
export { default as JDAnalyticsDashboard } from './JDAnalyticsDashboard';

// Communication components
export { default as Messages } from './Messages';
export { default as Interviews } from './Interviews';

// Utility components
export { default as RecruiterErrorBoundary } from './RecruiterErrorBoundary';
export { default as RecruiterLoadingSkeleton } from './RecruiterLoadingSkeleton';

// Message sub-components
export { default as ConversationList } from './messages/ConversationList';
export { default as MessageThread } from './messages/MessageThread';
export { default as EmptyConversation } from './messages/EmptyConversation';

// Re-export types from recruiter service
export type {
  Candidate,
  JobDescription,
  Interview,
  Conversation,
  Message,
  DashboardStats,
  CandidateStatus,
  VisaStatus,
  ArabicProficiency,
  Availability,
  JobType,
  WorkMode,
  JobStatus,
  InterviewType,
  InterviewStatus,
  InterviewResult,
} from '@/services/recruiterService';
