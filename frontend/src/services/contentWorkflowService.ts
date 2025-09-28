// Content Workflow Service
// Implementation of the 25-day KHDA approval workflow system

import { 
  SchoolProgram, 
  WorkflowStage, 
  ProgramStatus, 
  ApprovalRecord, 
  RevisionRequest,
  UserRole,
  WorkflowUser,
  Permission,
  ProgramSubmissionResponse,
  ValidationError,
  QualityRubric,
  QualityAssessment
} from '../types/schoolPrograms';

// Workflow configuration based on documented 25-day process
export interface WorkflowConfig {
  stages: {
    [key in WorkflowStage]: {
      name: { en: string; ar: string };
      description: { en: string; ar: string };
      duration: number; // days
      requiredRoles: UserRole[];
      autoAdvance: boolean;
      qualityChecks: string[];
    };
  };
}

const workflowConfig: WorkflowConfig = {
  stages: {
    content_creation: {
      name: { 
        en: 'Content Creation', 
        ar: 'إنشاء المحتوى' 
      },
      description: { 
        en: 'Program identification and content development by schools',
        ar: 'تحديد البرنامج وتطوير المحتوى من قبل المدارس'
      },
      duration: 5,
      requiredRoles: ['content_creator'],
      autoAdvance: false,
      qualityChecks: ['completeness', 'format_validation']
    },
    submission: {
      name: { 
        en: 'Digital Submission', 
        ar: 'التقديم الرقمي' 
      },
      description: { 
        en: 'Automated validation and content categorization',
        ar: 'التحقق التلقائي وتصنيف المحتوى'
      },
      duration: 3,
      requiredRoles: ['system_admin'],
      autoAdvance: true,
      qualityChecks: ['automated_validation', 'categorization']
    },
    technical_review: {
      name: { 
        en: 'Technical Review', 
        ar: 'المراجعة التقنية' 
      },
      description: { 
        en: 'Platform compatibility and technical standards validation',
        ar: 'التحقق من التوافق مع المنصة والمعايير التقنية'
      },
      duration: 3,
      requiredRoles: ['technical_reviewer'],
      autoAdvance: false,
      qualityChecks: ['technical_compliance', 'accessibility', 'performance']
    },
    educational_review: {
      name: { 
        en: 'Educational Review', 
        ar: 'المراجعة التعليمية' 
      },
      description: { 
        en: 'Curriculum alignment and educational standards assessment',
        ar: 'تقييم توافق المناهج والمعايير التعليمية'
      },
      duration: 4,
      requiredRoles: ['educational_reviewer'],
      autoAdvance: false,
      qualityChecks: ['curriculum_alignment', 'learning_outcomes', 'assessment_methods']
    },
    policy_review: {
      name: { 
        en: 'Policy Review', 
        ar: 'مراجعة السياسات' 
      },
      description: { 
        en: 'KHDA policy compliance and Education 33 alignment verification',
        ar: 'التحقق من الامتثال لسياسات هيئة المعرفة وتوافق التعليم 33'
      },
      duration: 3,
      requiredRoles: ['policy_reviewer'],
      autoAdvance: false,
      qualityChecks: ['policy_compliance', 'education33_alignment', 'cultural_sensitivity']
    },
    final_approval: {
      name: { 
        en: 'Final Approval', 
        ar: 'الموافقة النهائية' 
      },
      description: { 
        en: 'KHDA director final approval and publication authorization',
        ar: 'الموافقة النهائية من مدير هيئة المعرفة وتفويض النشر'
      },
      duration: 1,
      requiredRoles: ['khda_director', 'steering_committee'],
      autoAdvance: false,
      qualityChecks: ['final_quality_check', 'strategic_alignment']
    },
    staging: {
      name: { 
        en: 'Content Staging', 
        ar: 'تجهيز المحتوى' 
      },
      description: { 
        en: 'Content preparation for live publication',
        ar: 'إعداد المحتوى للنشر المباشر'
      },
      duration: 3,
      requiredRoles: ['content_manager'],
      autoAdvance: true,
      qualityChecks: ['staging_validation', 'final_formatting']
    },
    publication: {
      name: { 
        en: 'Live Publication', 
        ar: 'النشر المباشر' 
      },
      description: { 
        en: 'Content goes live on the platform',
        ar: 'نشر المحتوى مباشرة على المنصة'
      },
      duration: 2,
      requiredRoles: ['content_manager'],
      autoAdvance: true,
      qualityChecks: ['publication_verification', 'user_notification']
    },
    maintenance: {
      name: { 
        en: 'Ongoing Maintenance', 
        ar: 'الصيانة المستمرة' 
      },
      description: { 
        en: 'Performance monitoring and content updates',
        ar: 'مراقبة الأداء وتحديثات المحتوى'
      },
      duration: 0, // ongoing
      requiredRoles: ['content_manager', 'content_creator'],
      autoAdvance: false,
      qualityChecks: ['performance_monitoring', 'user_feedback']
    }
  }
};

// Mock users for different roles in the workflow
const mockWorkflowUsers: WorkflowUser[] = [
  {
    id: 'user-001',
    name: { en: 'Dr. Amina Al Zahra', ar: 'د. آمنة الزهراء' },
    email: 'amina.alzahra@khda.gov.ae',
    role: 'khda_director',
    department: 'KHDA Leadership',
    permissions: ['approve_final', 'view_analytics', 'manage_users'],
    isActive: true
  },
  {
    id: 'user-002',
    name: { en: 'Ahmed Al Mansoori', ar: 'أحمد المنصوري' },
    email: 'ahmed.almansoori@khda.gov.ae',
    role: 'content_manager',
    department: 'Content Management Office',
    permissions: ['edit_program', 'publish_program', 'view_analytics'],
    isActive: true
  },
  {
    id: 'user-003',
    name: { en: 'Fatima Al Rashid', ar: 'فاطمة الراشد' },
    email: 'fatima.alrashid@khda.gov.ae',
    role: 'educational_reviewer',
    department: 'Educational Standards',
    permissions: ['review_educational'],
    isActive: true
  },
  {
    id: 'user-004',
    name: { en: 'Omar Al Zahra', ar: 'عمر الزهراء' },
    email: 'omar.alzahra@khda.gov.ae',
    role: 'technical_reviewer',
    department: 'Technical Standards',
    permissions: ['review_technical'],
    isActive: true
  },
  {
    id: 'user-005',
    name: { en: 'Sara Al Mansoori', ar: 'سارة المنصوري' },
    email: 'sara.almansoori@khda.gov.ae',
    role: 'policy_reviewer',
    department: 'Policy Compliance',
    permissions: ['review_policy'],
    isActive: true
  }
];

// Quality rubrics for different review stages
const qualityRubrics: QualityRubric[] = [
  {
    id: 'rubric-technical',
    name: { 
      en: 'Technical Standards Rubric', 
      ar: 'معايير المراجعة التقنية' 
    },
    criteria: [
      {
        id: 'tech-001',
        name: { en: 'Platform Compatibility', ar: 'التوافق مع المنصة' },
        description: { en: 'Content displays correctly across all devices', ar: 'يعرض المحتوى بشكل صحيح عبر جميع الأجهزة' },
        weight: 0.3,
        scoreRange: { min: 1, max: 5 },
        guidelines: { 
          en: ['Responsive design', 'Cross-browser compatibility', 'Mobile optimization'],
          ar: ['تصميم متجاوب', 'التوافق مع المتصفحات', 'تحسين الهاتف المحمول']
        }
      },
      {
        id: 'tech-002',
        name: { en: 'Accessibility Standards', ar: 'معايير إمكانية الوصول' },
        description: { en: 'Content meets WCAG 2.1 AA standards', ar: 'يلبي المحتوى معايير WCAG 2.1 AA' },
        weight: 0.4,
        scoreRange: { min: 1, max: 5 },
        guidelines: { 
          en: ['Alt text for images', 'Keyboard navigation', 'Screen reader compatibility'],
          ar: ['نص بديل للصور', 'التنقل بلوحة المفاتيح', 'التوافق مع قارئ الشاشة']
        }
      },
      {
        id: 'tech-003',
        name: { en: 'Performance Standards', ar: 'معايير الأداء' },
        description: { en: 'Fast loading times and optimized media', ar: 'أوقات تحميل سريعة ووسائط محسنة' },
        weight: 0.3,
        scoreRange: { min: 1, max: 5 },
        guidelines: { 
          en: ['Image optimization', 'Video compression', 'CDN usage'],
          ar: ['تحسين الصور', 'ضغط الفيديو', 'استخدام شبكة التوصيل']
        }
      }
    ],
    minimumScore: 3.5,
    weight: 1.0
  },
  {
    id: 'rubric-educational',
    name: { 
      en: 'Educational Standards Rubric', 
      ar: 'معايير المراجعة التعليمية' 
    },
    criteria: [
      {
        id: 'edu-001',
        name: { en: 'Curriculum Alignment', ar: 'توافق المناهج' },
        description: { en: 'Program aligns with KHDA curriculum standards', ar: 'يتوافق البرنامج مع معايير مناهج هيئة المعرفة' },
        weight: 0.4,
        scoreRange: { min: 1, max: 5 },
        guidelines: { 
          en: ['Learning objectives clarity', 'Age-appropriate content', 'Skill progression'],
          ar: ['وضوح أهداف التعلم', 'محتوى مناسب للعمر', 'تطور المهارات']
        }
      },
      {
        id: 'edu-002',
        name: { en: 'Learning Outcomes', ar: 'نتائج التعلم' },
        description: { en: 'Clear, measurable learning outcomes defined', ar: 'نتائج تعلم واضحة وقابلة للقياس محددة' },
        weight: 0.3,
        scoreRange: { min: 1, max: 5 },
        guidelines: { 
          en: ['SMART objectives', 'Assessment criteria', 'Competency mapping'],
          ar: ['أهداف ذكية', 'معايير التقييم', 'خريطة الكفاءات']
        }
      },
      {
        id: 'edu-003',
        name: { en: 'Assessment Methods', ar: 'طرق التقييم' },
        description: { en: 'Appropriate assessment and evaluation methods', ar: 'طرق تقييم وتقويم مناسبة' },
        weight: 0.3,
        scoreRange: { min: 1, max: 5 },
        guidelines: { 
          en: ['Formative assessment', 'Summative evaluation', 'Feedback mechanisms'],
          ar: ['التقييم التكويني', 'التقويم الختامي', 'آليات التغذية الراجعة']
        }
      }
    ],
    minimumScore: 4.0,
    weight: 1.0
  }
];

export class ContentWorkflowService {
  private static instance: ContentWorkflowService;
  private workflowInstances: Map<string, WorkflowInstance> = new Map();
  private users: WorkflowUser[] = mockWorkflowUsers;
  private rubrics: QualityRubric[] = qualityRubrics;

  public static getInstance(): ContentWorkflowService {
    if (!ContentWorkflowService.instance) {
      ContentWorkflowService.instance = new ContentWorkflowService();
    }
    return ContentWorkflowService.instance;
  }

  // Submit a new program for workflow processing
  async submitProgram(program: Partial<SchoolProgram>, submitterId: string): Promise<ProgramSubmissionResponse> {
    try {
      // Validate required fields
      const validationErrors = this.validateProgramSubmission(program);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: { 
            en: 'Validation errors found. Please correct and resubmit.',
            ar: 'تم العثور على أخطاء في التحقق. يرجى التصحيح وإعادة التقديم.'
          },
          errors: validationErrors
        };
      }

      // Create workflow instance
      const workflowId = `workflow-${Date.now()}`;
      const programId = program.id || `prog-${Date.now()}`;
      
      const workflowInstance: WorkflowInstance = {
        id: workflowId,
        programId,
        currentStage: 'content_creation',
        status: 'submitted',
        submitterId,
        submissionDate: new Date().toISOString(),
        stageHistory: [{
          stage: 'content_creation',
          startDate: new Date().toISOString(),
          status: 'completed'
        }],
        approvalRecords: [],
        revisionRequests: [],
        qualityAssessments: [],
        notifications: []
      };

      this.workflowInstances.set(workflowId, workflowInstance);

      // Auto-advance to submission stage
      await this.advanceWorkflow(workflowId, 'system_admin', 'system-auto');

      return {
        success: true,
        programId,
        workflowId,
        message: {
          en: 'Program submitted successfully. You will receive updates on the review progress.',
          ar: 'تم تقديم البرنامج بنجاح. ستتلقى تحديثات حول تقدم المراجعة.'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: {
          en: 'An error occurred during submission. Please try again.',
          ar: 'حدث خطأ أثناء التقديم. يرجى المحاولة مرة أخرى.'
        }
      };
    }
  }

  // Advance workflow to next stage
  async advanceWorkflow(workflowId: string, reviewerId: string, decision: 'approved' | 'rejected' | 'revision_required', comments?: { en: string; ar: string }): Promise<boolean> {
    const workflow = this.workflowInstances.get(workflowId);
    if (!workflow) return false;

    const currentStageConfig = workflowConfig.stages[workflow.currentStage];
    const reviewer = this.users.find(u => u.id === reviewerId);
    
    if (!reviewer) return false;

    // Record approval decision
    const approvalRecord: ApprovalRecord = {
      id: `approval-${Date.now()}`,
      stage: workflow.currentStage,
      reviewerRole: reviewer.role,
      reviewerId,
      reviewerName: reviewer.name.en,
      decision,
      comments: comments || { en: '', ar: '' },
      timestamp: new Date().toISOString()
    };

    workflow.approvalRecords.push(approvalRecord);

    if (decision === 'approved') {
      // Move to next stage
      const nextStage = this.getNextStage(workflow.currentStage);
      if (nextStage) {
        workflow.currentStage = nextStage;
        workflow.stageHistory.push({
          stage: nextStage,
          startDate: new Date().toISOString(),
          status: 'in_progress'
        });

        // Auto-advance if configured
        if (workflowConfig.stages[nextStage].autoAdvance) {
          setTimeout(() => {
            this.advanceWorkflow(workflowId, 'system-auto', 'approved');
          }, 1000);
        }
      } else {
        // Workflow complete
        workflow.status = 'completed';
        workflow.completionDate = new Date().toISOString();
      }
    } else if (decision === 'rejected') {
      workflow.status = 'rejected';
    } else {
      workflow.status = 'revision_required';
    }

    return true;
  }

  // Get workflow status for a program
  async getWorkflowStatus(programId: string): Promise<WorkflowInstance | null> {
    for (const workflow of this.workflowInstances.values()) {
      if (workflow.programId === programId) {
        return workflow;
      }
    }
    return null;
  }

  // Get pending reviews for a user
  async getPendingReviews(userId: string): Promise<WorkflowInstance[]> {
    const user = this.users.find(u => u.id === userId);
    if (!user) return [];

    const pendingReviews: WorkflowInstance[] = [];
    
    for (const workflow of this.workflowInstances.values()) {
      if (workflow.status === 'submitted' || workflow.status === 'revision_required') {
        const stageConfig = workflowConfig.stages[workflow.currentStage];
        if (stageConfig.requiredRoles.includes(user.role)) {
          pendingReviews.push(workflow);
        }
      }
    }

    return pendingReviews;
  }

  // Conduct quality assessment
  async conductQualityAssessment(workflowId: string, rubricId: string, assessorId: string, scores: Record<string, number>): Promise<QualityAssessment> {
    const rubric = this.rubrics.find(r => r.id === rubricId);
    if (!rubric) throw new Error('Rubric not found');

    // Calculate total score
    let totalScore = 0;
    let totalWeight = 0;

    for (const criterion of rubric.criteria) {
      const score = scores[criterion.id] || 0;
      totalScore += score * criterion.weight;
      totalWeight += criterion.weight;
    }

    const finalScore = totalScore / totalWeight;
    const passed = finalScore >= rubric.minimumScore;

    const assessment: QualityAssessment = {
      programId: this.workflowInstances.get(workflowId)?.programId || '',
      rubricId,
      assessorId,
      scores,
      totalScore: finalScore,
      passed,
      feedback: {
        en: passed ? 'Quality standards met successfully.' : 'Quality standards not met. Revision required.',
        ar: passed ? 'تم استيفاء معايير الجودة بنجاح.' : 'لم يتم استيفاء معايير الجودة. مطلوب مراجعة.'
      },
      timestamp: new Date().toISOString()
    };

    // Add to workflow
    const workflow = this.workflowInstances.get(workflowId);
    if (workflow) {
      workflow.qualityAssessments.push(assessment);
    }

    return assessment;
  }

  // Get workflow configuration
  getWorkflowConfig(): WorkflowConfig {
    return workflowConfig;
  }

  // Get quality rubrics
  getQualityRubrics(): QualityRubric[] {
    return this.rubrics;
  }

  // Private helper methods
  private validateProgramSubmission(program: Partial<SchoolProgram>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!program.title?.en || !program.title?.ar) {
      errors.push({
        field: 'title',
        message: {
          en: 'Program title is required in both English and Arabic',
          ar: 'عنوان البرنامج مطلوب باللغتين الإنجليزية والعربية'
        },
        code: 'REQUIRED_FIELD'
      });
    }

    if (!program.description?.en || !program.description?.ar) {
      errors.push({
        field: 'description',
        message: {
          en: 'Program description is required in both English and Arabic',
          ar: 'وصف البرنامج مطلوب باللغتين الإنجليزية والعربية'
        },
        code: 'REQUIRED_FIELD'
      });
    }

    if (!program.school?.name?.en || !program.school?.name?.ar) {
      errors.push({
        field: 'school',
        message: {
          en: 'School information is required',
          ar: 'معلومات المدرسة مطلوبة'
        },
        code: 'REQUIRED_FIELD'
      });
    }

    if (!program.category) {
      errors.push({
        field: 'category',
        message: {
          en: 'Program category is required',
          ar: 'فئة البرنامج مطلوبة'
        },
        code: 'REQUIRED_FIELD'
      });
    }

    return errors;
  }

  private getNextStage(currentStage: WorkflowStage): WorkflowStage | null {
    const stages: WorkflowStage[] = [
      'content_creation',
      'submission',
      'technical_review',
      'educational_review',
      'policy_review',
      'final_approval',
      'staging',
      'publication',
      'maintenance'
    ];

    const currentIndex = stages.indexOf(currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  }
}

// Workflow instance interface
interface WorkflowInstance {
  id: string;
  programId: string;
  currentStage: WorkflowStage;
  status: 'submitted' | 'in_progress' | 'completed' | 'rejected' | 'revision_required';
  submitterId: string;
  submissionDate: string;
  completionDate?: string;
  stageHistory: {
    stage: WorkflowStage;
    startDate: string;
    endDate?: string;
    status: 'in_progress' | 'completed' | 'skipped';
  }[];
  approvalRecords: ApprovalRecord[];
  revisionRequests: RevisionRequest[];
  qualityAssessments: QualityAssessment[];
  notifications: {
    id: string;
    type: 'stage_change' | 'approval' | 'rejection' | 'revision_request';
    message: { en: string; ar: string };
    timestamp: string;
    read: boolean;
  }[];
}

export const contentWorkflowService = ContentWorkflowService.getInstance();
