
import { ResumeData } from "@/components/resume/types";
import { AssessmentSession } from "./assessments";
import { AdvisorySession } from "./careerAdvisory";

export type Certificate = {
  id: string;
  user_id: string;
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string | null;
};

export type Training = {
  id: string;
  user_id: string;
  title: string;
  provider: string;
  start_date: string;
  end_date: string | null;
  is_completed: boolean;
  skills_gained: string[];
  description: string | null;
  created_at: string;
  updated_at: string | null;
};

export type PortfolioHighlight = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: "project" | "achievement" | "publication" | "other";
  date: string | null;
  url: string | null;
  created_at: string;
  updated_at: string | null;
};

export type Portfolio = {
  userId: string;
  resumeData?: ResumeData | null;
  assessments?: AssessmentSession[];
  interviews?: AdvisorySession[];
  certificates?: Certificate[];
  trainings?: Training[];
  highlights?: PortfolioHighlight[];
};
