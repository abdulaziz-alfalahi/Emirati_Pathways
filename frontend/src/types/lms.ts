
export type CourseStatus = 'draft' | 'published' | 'archived';
export type LessonType = 'video' | 'text' | 'quiz' | 'assignment' | 'interactive';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'suspended';
export type CertificateStatus = 'pending' | 'issued' | 'revoked';

export interface Course {
  id: string;
  title: string;
  description?: string;
  instructor_id: string;
  category: string;
  difficulty_level: string;
  duration_hours?: number;
  price: number;
  currency: string;
  thumbnail_url?: string;
  status: CourseStatus;
  is_featured: boolean;
  prerequisites: string[];
  learning_objectives: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content?: string;
  lesson_type: LessonType;
  video_url?: string;
  duration_minutes?: number;
  order_index: number;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  lesson_id?: string;
  course_id?: string;
  title: string;
  description?: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
  is_randomized: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  options: Record<string, any>;
  correct_answer: Record<string, any>;
  points: number;
  explanation?: string;
  order_index: number;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  status: EnrollmentStatus;
  progress_percentage: number;
  completed_at?: string;
  certificate_issued_at?: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  enrollment_id: string;
  started_at: string;
  completed_at?: string;
  time_spent_minutes: number;
  is_completed: boolean;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  enrollment_id: string;
  score: number;
  max_score: number;
  percentage: number;
  answers: Record<string, any>;
  started_at: string;
  completed_at: string;
  attempt_number: number;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string;
  certificate_number: string;
  issued_at: string;
  status: CertificateStatus;
  template_data: Record<string, any>;
  pdf_url?: string;
  created_at: string;
}

export interface CreateCourseData {
  title: string;
  description?: string;
  category: string;
  difficulty_level: string;
  duration_hours?: number;
  price?: number;
  currency?: string;
  thumbnail_url?: string;
  prerequisites?: string[];
  learning_objectives?: string[];
  tags?: string[];
}

export interface CreateModuleData {
  title: string;
  description?: string;
  order_index: number;
}

export interface CreateLessonData {
  title: string;
  content?: string;
  lesson_type: LessonType;
  video_url?: string;
  duration_minutes?: number;
  order_index: number;
  is_mandatory?: boolean;
}

export interface CreateQuizData {
  title: string;
  description?: string;
  passing_score?: number;
  max_attempts?: number;
  time_limit_minutes?: number;
  is_randomized?: boolean;
}

export interface QuizQuestionData {
  question_text: string;
  question_type: string;
  options: Record<string, any>;
  correct_answer: Record<string, any>;
  points?: number;
  explanation?: string;
}
