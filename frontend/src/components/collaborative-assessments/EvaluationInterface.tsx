import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { CollaborativeAssessment, AssessmentSection, AssessmentCriterion, AssessmentEvaluation } from '@/types/collaborativeAssessments';
import { fetchCollaborativeAssessments, fetchAssessmentCollaborators } from '@/services/collaborativeAssessments/assessmentService';
import { submitEvaluation, fetchAssessmentEvaluations, calculateAssessmentProgress } from '@/services/collaborativeAssessments/evaluationService';
import { EvaluationHeader } from './evaluation/EvaluationHeader';
import { SectionNavigation } from './evaluation/SectionNavigation';
import { CriterionCard } from './evaluation/CriterionCard';
import { NavigationFooter } from './evaluation/NavigationFooter';
import { ErrorState } from './evaluation/ErrorState';
import { CollaboratorManagement } from './CollaboratorManagement';
import { ActivityFeed } from './realtime/ActivityFeed';
import { ActiveCollaborators } from './realtime/ActiveCollaborators';
import { Button } from '@/components/ui/button';
import { Users, Activity } from 'lucide-react';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { CollaborationStatusBar } from './realtime/CollaborationStatusBar';

interface EvaluationInterfaceProps {
  assessmentId: string;
  onBack: () => void;
}

export const EvaluationInterface: React.FC<EvaluationInterfaceProps> = ({ assessmentId, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [evaluations, setEvaluations] = useState<Record<string, { score?: number; comments?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);

  // Real-time collaboration hook
  const {
    activeCollaborators,
    recentActivity,
    isConnected,
    updateActivity,
    logEvaluationSubmitted,
    logSectionStarted,
    logCommentAdded
  } = useRealtimeCollaboration({
    assessmentId,
    enabled: !!user
  });

  // Add real-time notifications hook
  useRealtimeNotifications({
    recentActivity,
    isConnected
  });

  // Fetch assessment details
  const { data: assessments } = useQuery({
    queryKey: ['collaborative-assessments', user?.id],
    queryFn: () => user ? fetchCollaborativeAssessments(user.id) : Promise.resolve([]),
    enabled: !!user
  });

  const assessment = assessments?.find(a => a.id === assessmentId);

  // Fetch existing evaluations
  const { data: existingEvaluations } = useQuery({
    queryKey: ['assessment-evaluations', assessmentId],
    queryFn: () => fetchAssessmentEvaluations(assessmentId)
  });

  // Fetch collaborators to check permissions
  const { data: collaborators } = useQuery({
    queryKey: ['assessment-collaborators', assessmentId],
    queryFn: () => fetchAssessmentCollaborators(assessmentId)
  });

  // Fetch progress
  const { data: progress } = useQuery({
    queryKey: ['assessment-progress', assessmentId],
    queryFn: () => calculateAssessmentProgress(assessmentId)
  });

  const currentCollaborator = collaborators?.find(c => c.user_id === user?.id);
  const canEvaluate = currentCollaborator?.permissions?.can_evaluate;
  const canManageCollaborators = currentCollaborator?.permissions?.can_invite_others;

  // Log section changes
  useEffect(() => {
    if (assessment?.template?.sections && assessment.template.sections[currentSectionIndex]) {
      const currentSection = assessment.template.sections[currentSectionIndex];
      logSectionStarted(currentSection.id, currentSection.title);
    }
  }, [currentSectionIndex, assessment, logSectionStarted]);

  // Load existing evaluations into local state
  useEffect(() => {
    if (existingEvaluations && user) {
      const userEvaluations = existingEvaluations.filter(e => e.evaluator_id === user.id);
      const evaluationMap: Record<string, { score?: number; comments?: string }> = {};
      
      userEvaluations.forEach(evaluation => {
        const key = `${evaluation.section_id}-${evaluation.criterion_id}`;
        evaluationMap[key] = {
          score: evaluation.score || undefined,
          comments: evaluation.comments || undefined
        };
      });
      
      setEvaluations(evaluationMap);
    }
  }, [existingEvaluations, user]);

  const submitEvaluationMutation = useMutation({
    mutationFn: submitEvaluation,
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-evaluations', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessment-progress', assessmentId] });
      
      // Log the evaluation submission
      await logEvaluationSubmitted(variables.section_id, variables.criterion_id);
      
      toast({
        title: "Evaluation saved",
        description: "Your evaluation has been saved successfully."
      });
    },
    onError: (error) => {
      console.error('Error submitting evaluation:', error);
      toast({
        title: "Error",
        description: "Failed to save evaluation. Please try again.",
        variant: "destructive"
      });
    }
  });

  if (!assessment || !user) {
    return (
      <ErrorState
        title="Assessment not found"
        message="The assessment you're looking for doesn't exist or you don't have access to it."
        onBack={onBack}
      />
    );
  }

  if (!canEvaluate) {
    return (
      <ErrorState
        title="Access Denied"
        message="You don't have permission to evaluate this assessment."
        onBack={onBack}
      />
    );
  }

  const template = assessment.template;
  const sections = Array.isArray(template?.sections) ? template.sections : [];
  const currentSection = sections[currentSectionIndex];

  if (sections.length === 0) {
    return (
      <ErrorState
        title="No sections available"
        message="This assessment template doesn't have any sections to evaluate."
        onBack={onBack}
      />
    );
  }

  // If showing collaborators, render the collaborator management interface
  if (showCollaborators) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setShowCollaborators(false)}>
            ← Back to Evaluation
          </Button>
        </div>
        <CollaboratorManagement assessmentId={assessmentId} />
      </div>
    );
  }

  const handleScoreChange = (criterionId: string, score: number) => {
    const key = `${currentSection.id}-${criterionId}`;
    setEvaluations(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        score
      }
    }));
    updateActivity(currentSection.id);
  };

  const handleCommentsChange = async (criterionId: string, comments: string) => {
    const key = `${currentSection.id}-${criterionId}`;
    setEvaluations(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        comments
      }
    }));
    
    if (comments.trim()) {
      await logCommentAdded(currentSection.id, criterionId);
    }
    updateActivity(currentSection.id);
  };

  const handleSaveEvaluation = async (criterionId: string) => {
    const key = `${currentSection.id}-${criterionId}`;
    const evaluation = evaluations[key];
    
    if (!evaluation || (evaluation.score === undefined && !evaluation.comments)) {
      toast({
        title: "Missing data",
        description: "Please provide a score or comments before saving.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await submitEvaluationMutation.mutateAsync({
        assessment_id: assessmentId,
        evaluator_id: user.id,
        section_id: currentSection.id,
        criterion_id: criterionId,
        score: evaluation.score,
        comments: evaluation.comments
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    return progress.progress_percentage;
  };

  const getSectionProgress = () => {
    const evaluatedCriteria = currentSection.criteria?.filter(c => {
      const key = `${currentSection.id}-${c.id}`;
      return evaluations[key]?.score !== undefined || Boolean(evaluations[key]?.comments);
    }).length || 0;
    
    const totalCriteria = currentSection.criteria?.length || 0;
    return totalCriteria > 0 ? (evaluatedCriteria / totalCriteria) * 100 : 0;
  };

  const getEvaluatedCriteriaCount = () => {
    return currentSection.criteria?.filter(c => {
      const key = `${currentSection.id}-${c.id}`;
      return evaluations[key]?.score !== undefined || Boolean(evaluations[key]?.comments);
    }).length || 0;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main evaluation content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <EvaluationHeader
              title={assessment.title}
              onBack={onBack}
              progressPercentage={getProgressPercentage()}
            />
            
            <div className="flex items-center space-x-4">
              {/* Add collaboration status bar */}
              <CollaborationStatusBar
                collaborators={activeCollaborators}
                isConnected={isConnected}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActivityFeed(!showActivityFeed)}
                className="lg:hidden"
              >
                <Activity className="h-4 w-4 me-2" />
                Activity
              </Button>
              
              {canManageCollaborators && (
                <Button
                  variant="outline"
                  onClick={() => setShowCollaborators(true)}
                >
                  <Users className="h-4 w-4 me-2" />
                  Manage Collaborators
                </Button>
              )}
            </div>
          </div>

          <SectionNavigation
            currentSection={currentSection}
            currentSectionIndex={currentSectionIndex}
            totalSections={sections.length}
            sectionProgress={getSectionProgress()}
            evaluatedCriteria={getEvaluatedCriteriaCount()}
            totalCriteria={currentSection.criteria?.length || 0}
            onPreviousSection={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
            onNextSection={() => setCurrentSectionIndex(Math.min(sections.length - 1, currentSectionIndex + 1))}
            canGoPrevious={currentSectionIndex > 0}
            canGoNext={currentSectionIndex < sections.length - 1}
            activeCollaborators={activeCollaborators}
          />

          <div className="space-y-6">
            {currentSection.criteria?.map((criterion) => {
              const key = `${currentSection.id}-${criterion.id}`;
              const evaluation = evaluations[key] || {};
              const hasEvaluation = Boolean(evaluation.score !== undefined || evaluation.comments);

              return (
                <CriterionCard
                  key={criterion.id}
                  criterion={criterion}
                  score={evaluation.score}
                  comments={evaluation.comments}
                  onScoreChange={(score) => handleScoreChange(criterion.id, score)}
                  onCommentsChange={(comments) => handleCommentsChange(criterion.id, comments)}
                  onSave={() => handleSaveEvaluation(criterion.id)}
                  isSubmitting={isSubmitting}
                  hasEvaluation={hasEvaluation}
                  sectionId={currentSection.id}
                  recentActivity={recentActivity}
                />
              );
            })}
          </div>

          <NavigationFooter
            currentSectionIndex={currentSectionIndex}
            totalSections={sections.length}
            onPreviousSection={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
            onNextSection={() => setCurrentSectionIndex(Math.min(sections.length - 1, currentSectionIndex + 1))}
            canGoPrevious={currentSectionIndex > 0}
            canGoNext={currentSectionIndex < sections.length - 1}
          />
        </div>

        {/* Real-time collaboration sidebar */}
        <div className={`lg:col-span-1 space-y-4 ${showActivityFeed ? 'block' : 'hidden lg:block'}`}>
          <ActiveCollaborators collaborators={activeCollaborators} />
          <ActivityFeed activities={recentActivity} />
        </div>
      </div>
    </div>
  );
};
