
export interface CareerStage {
  id: string;
  title: string;
  description: string;
  category: 'education' | 'career' | 'personal' | 'retirement';
  ageRange: string;
  completed: boolean;
  current: boolean;
  recommended: boolean;
  icon: React.ComponentType<any>;
  requirements?: string[];
  benefits?: string[];
  duration?: string;
}

export interface CareerPath {
  id: string;
  title: string;
  industry: string;
  stages: CareerStage[];
  totalProgress: number;
}
