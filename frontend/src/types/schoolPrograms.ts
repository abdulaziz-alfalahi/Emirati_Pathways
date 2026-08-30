// School Programs Data Models and Types
// Based on KHDA governance structure and content workflow documentation

export interface SchoolProgram {
  id: string;
  title: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  school: {
    id: string;
    name: {
      en: string;
      ar: string;
    };
    logo: string;
    location: string;
    type: 'public' | 'private' | 'charter';
    accreditation: string[];
    /** The school's own contact details, where it has given them.
     *  Applications are handled by the school directly; without these the
     *  apply button ran a Google search for the school and programme name. */
    website?: string;
    email?: string;
    phone?: string;
  };
  category: ProgramCategory;
  subcategory: string;
  targetAge: {
    min: number;
    max: number;
  };
  duration: {
    value: number;
    unit: 'weeks' | 'months' | 'years';
  };
  schedule: {
    type: 'full-time' | 'part-time' | 'weekend' | 'evening';
    hoursPerWeek: number;
    startDate: string;
    endDate: string;
  };
  curriculum: {
    overview: {
      en: string;
      ar: string;
    };
    subjects: Subject[];
    learningOutcomes: {
      en: string[];
      ar: string[];
    };
    assessmentMethods: {
      en: string[];
      ar: string[];
    };
  };
  faculty: Faculty[];
  facilities: Facility[];
  prerequisites: {
    en: string[];
    ar: string[];
  };
  fees: {
    amount: number;
    currency: 'AED';
    scholarshipAvailable: boolean;
    paymentPlans: string[];
  };
  capacity: {
    total: number;
    available: number;
    waitingList: number;
  };
  successMetrics: {
    graduationRate: number;
    employmentRate: number;
    satisfactionScore: number;
    industryPartnerships: number;
  };
  testimonials: Testimonial[];
  media: {
    images: string[];
    videos: string[];
    virtualTour?: string;
    brochure?: string;
  };
  applicationProcess: {
    steps: {
      en: string[];
      ar: string[];
    };
    deadline: string;
    requirements: {
      en: string[];
      ar: string[];
    };
    contactInfo: ContactInfo;
  };
  status: ProgramStatus;
  workflowStage: WorkflowStage;
  approvalHistory: ApprovalRecord[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy: string;
  lastModifiedBy: string;
  
  // Legacy fields for backward compatibility
  institution?: string;
  gradeLevel?: string[];
  subjectArea?: string[];
  programType?: string[];
  ageRange?: string;
  location?: string;
  startDate?: string;
  enrollmentStatus?: string;
  spotsAvailable?: number;
  image?: string;
}

export type ProgramCategory = 
  | 'stem'
  | 'arts'
  | 'sports'
  | 'language'
  | 'vocational'
  | 'leadership'
  | 'entrepreneurship'
  | 'cultural';

export interface Subject {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  credits: number;
  description: {
    en: string;
    ar: string;
  };
  prerequisites?: string[];
}

export interface Faculty {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  title: {
    en: string;
    ar: string;
  };
  qualifications: {
    en: string[];
    ar: string[];
  };
  experience: number;
  specialization: {
    en: string[];
    ar: string[];
  };
  photo?: string;
  bio: {
    en: string;
    ar: string;
  };
}

export interface Facility {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  type: 'laboratory' | 'studio' | 'workshop' | 'library' | 'sports' | 'technology';
  description: {
    en: string;
    ar: string;
  };
  capacity: number;
  equipment: {
    en: string[];
    ar: string[];
  };
  images: string[];
}

export interface Testimonial {
  id: string;
  studentName: {
    en: string;
    ar: string;
  };
  graduationYear: number;
  currentPosition: {
    en: string;
    ar: string;
  };
  testimonial: {
    en: string;
    ar: string;
  };
  photo?: string;
  rating: number;
}

export interface ContactInfo {
  email: string;
  phone: string;
  whatsapp?: string;
  address: {
    en: string;
    ar: string;
  };
  website?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

// Workflow and Governance Types
export type ProgramStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'published'
  | 'archived'
  | 'rejected';

export type WorkflowStage = 
  | 'content_creation'
  | 'submission'
  | 'technical_review'
  | 'educational_review'
  | 'policy_review'
  | 'final_approval'
  | 'staging'
  | 'publication'
  | 'maintenance';

export interface ApprovalRecord {
  id: string;
  stage: WorkflowStage;
  reviewerRole: UserRole;
  reviewerId: string;
  reviewerName: string;
  decision: 'approved' | 'rejected' | 'revision_required';
  comments: {
    en: string;
    ar: string;
  };
  timestamp: string;
  revisionRequests?: RevisionRequest[];
}

export interface RevisionRequest {
  id: string;
  section: string;
  issue: {
    en: string;
    ar: string;
  };
  suggestion: {
    en: string;
    ar: string;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

// User and Role Management
export type UserRole = 
  | 'content_creator'
  | 'technical_reviewer'
  | 'educational_reviewer'
  | 'policy_reviewer'
  | 'content_manager'
  | 'khda_director'
  | 'steering_committee'
  | 'system_admin';

export interface WorkflowUser {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  email: string;
  role: UserRole;
  department: string;
  permissions: Permission[];
  isActive: boolean;
}

export type Permission = 
  | 'create_program'
  | 'edit_program'
  | 'review_technical'
  | 'review_educational'
  | 'review_policy'
  | 'approve_final'
  | 'publish_program'
  | 'archive_program'
  | 'manage_users'
  | 'view_analytics';

// Search and Filtering
export interface ProgramFilters {
  category?: ProgramCategory[];
  schoolType?: ('public' | 'private' | 'charter')[];
  ageRange?: {
    min: number;
    max: number;
  };
  duration?: {
    min: number;
    max: number;
    unit: 'weeks' | 'months' | 'years';
  };
  schedule?: ('full-time' | 'part-time' | 'weekend' | 'evening')[];
  fees?: {
    min: number;
    max: number;
  };
  location?: string[];
  availability?: boolean;
  scholarshipAvailable?: boolean;
  
  // Legacy filter fields for backward compatibility
  gradeLevel?: string[];
  subjectArea?: string[];
  programType?: string[];
}

/**
 * Parameters accepted by schoolProgramsAPIService.getPrograms.
 *
 * This previously declared a nested { query, filters } shape with a different
 * sortBy union, which no caller and no service ever used — the service reads a
 * flat shape and sorts by title/school/category/date/popularity. It is written
 * here to match what the code actually does; changing the service to the old
 * shape instead would have broken the two live callers, which pass
 * `{ status: 'published' }` and `{}`.
 */
export interface SearchParams {
  search?: string;
  /** 'all' is accepted and means "no category filter". */
  category?: ProgramCategory | 'all';
  status?: SchoolProgram['status'] | 'all';
  featured?: boolean;
  ageRange?: { min: number; max: number };
  sortBy?: 'title' | 'school' | 'category' | 'date' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/** A selectable category returned by schoolProgramsAPIService.getCategories(). */
export interface ProgramCategoryOption {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
}

/**
 * Aggregate counts for the school-programs admin dashboard.
 *
 * Distinct from ProgramAnalytics below, which describes ONE program. The
 * service returns these aggregates, so it was never assignable to
 * ProgramAnalytics.
 */
export interface ProgramsDashboardStats {
  totalPrograms: number;
  publishedPrograms: number;
  draftPrograms: number;
  underReviewPrograms: number;
  categoryDistribution: Record<string, number>;
}

// Analytics and Performance
export interface ProgramAnalytics {
  programId: string;
  views: number;
  applications: number;
  enrollments: number;
  completions: number;
  userRatings: {
    average: number;
    count: number;
    distribution: Record<number, number>;
  };
  engagementMetrics: {
    timeOnPage: number;
    bounceRate: number;
    conversionRate: number;
  };
  demographicData: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
    locationDistribution: Record<string, number>;
  };
  periodStart: string;
  periodEnd: string;
}

// API Response Types
export interface ProgramsResponse {
  programs: SchoolProgram[];
  total: number;
  page: number;
  limit: number;
  // The service returns these; it never returned the previously declared
  // `hasMore`/`filters`. Both live consumers read only `.programs`.
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProgramSubmissionResponse {
  success: boolean;
  programId?: string;
  workflowId?: string;
  message: {
    en: string;
    ar: string;
  };
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: {
    en: string;
    ar: string;
  };
  code: string;
}

// Content Quality and Standards
export interface QualityRubric {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  criteria: QualityCriterion[];
  minimumScore: number;
  weight: number;
}

export interface QualityCriterion {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  weight: number;
  scoreRange: {
    min: number;
    max: number;
  };
  guidelines: {
    en: string[];
    ar: string[];
  };
}

export interface QualityAssessment {
  programId: string;
  rubricId: string;
  assessorId: string;
  scores: Record<string, number>;
  totalScore: number;
  passed: boolean;
  feedback: {
    en: string;
    ar: string;
  };
  timestamp: string;
}
