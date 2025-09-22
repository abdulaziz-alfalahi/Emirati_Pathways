
export interface Program {
  id: number;
  title: string;
  trainees: number;
  startDate: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  description?: string;
  documents?: ProgramDocument[];
  progress?: number;
  category?: string;
  instructor?: string;
  location?: string;
}

export interface ProgramDocument {
  id: number;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
}

export interface Assessment {
  id: number;
  title: string;
  candidates: number;
  date: string;
  type: string;
  passingScore?: number;
  duration?: number;
}

export interface NewProgram {
  title: string;
  description: string;
  startDate: string;
  status: string;
  category?: string;
  instructor?: string;
  location?: string;
}

export interface Trainee {
  id: number;
  name: string;
  email: string;
  enrollDate: string;
  programs: string[];
  progress: number;
  status: 'active' | 'graduated' | 'withdrawn';
  profileImage?: string;
}

export interface TrainingMetrics {
  totalTrainees: number;
  activePrograms: number;
  completionRate: number;
  satisfactionScore: number;
  employmentRate?: number;
}
