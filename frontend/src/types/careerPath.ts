
export type CareerPath = {
  id: string;
  title: string;
  description: string;
  industry: string;
  created_at: string;
  updated_at?: string | null;
  // Additional UI properties for compatibility
  current_stage?: CareerPathStage;
  stages?: CareerPathStage[];
};

export type CareerPathStage = {
  id: string;
  career_path_id: string;
  title: string;
  description?: string | null;
  stage_type: 'education' | 'career';
  skills?: string[] | null;
  duration?: string | null;
  requirements?: string[] | null;
  order_index: number;
  icon?: string | null;
  created_at: string;
  updated_at: string | null;
};

export type UserCareerPath = {
  id: string;
  user_id: string;
  career_path_id: string;
  current_stage_id: string | null;
  started_at: string;
  updated_at: string | null;
  // Joined data
  career_path?: CareerPath;
  current_stage?: CareerPathStage;
  // Additional fields for UI functionality
  steps?: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
  }[];
  duration?: string;
  difficulty?: string;
  completionPercentage?: number;
  isEnrolled?: boolean;
};

export type CareerPathWithStages = CareerPath & {
  stages: CareerPathStage[];
};

export type UserCareerPathWithDetails = UserCareerPath & {
  career_path: CareerPath;
  current_stage: CareerPathStage | null;
  stages: CareerPathStage[];
};
