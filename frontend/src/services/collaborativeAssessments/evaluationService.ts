import { AssessmentEvaluation, AssessmentComment, AssessmentProgress } from '@/types/collaborativeAssessments';

export const submitEvaluation = async (evaluation: Omit<AssessmentEvaluation, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('assessment_evaluations')
    .upsert([{
      ...evaluation,
      submitted_at: new Date().toISOString()
    }], {
      onConflict: 'assessment_id,evaluator_id,section_id,criterion_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting evaluation:', error);
    throw error;
  }

  return data as AssessmentEvaluation;
};

export const fetchAssessmentEvaluations = async (assessmentId: string) => {
  const { data, error } = await supabase
    .from('assessment_evaluations')
    .select(`
      *,
      evaluator:profiles(*)
    `)
    .eq('assessment_id', assessmentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assessment evaluations:', error);
    throw error;
  }

  return (data || []) as (AssessmentEvaluation & { evaluator?: any })[];
};

export const addComment = async (comment: Omit<AssessmentComment, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('assessment_comments')
    .insert([comment])
    .select(`
      *,
      user:profiles(*)
    `)
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return data as AssessmentComment & { user?: any };
};

export const fetchAssessmentComments = async (assessmentId: string) => {
  const { data, error } = await supabase
    .from('assessment_comments')
    .select(`
      *,
      user:profiles(*),
      replies:assessment_comments(*, user:profiles(*))
    `)
    .eq('assessment_id', assessmentId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching assessment comments:', error);
    throw error;
  }

  return (data || []) as (AssessmentComment & { user?: any; replies?: any[] })[];
};

export const calculateAssessmentProgress = async (assessmentId: string): Promise<AssessmentProgress> => {
  // Fetch assessment with template
  const { data: assessment, error: assessmentError } = await supabase
    .from('collaborative_assessments')
    .select(`
      *,
      template:assessment_templates(*)
    `)
    .eq('id', assessmentId)
    .single();

  if (assessmentError) {
    throw assessmentError;
  }

  const template = assessment.template;
  const sections = Array.isArray(template?.sections) ? template.sections : [];
  const totalSections = sections.length;
  const totalCriteria = sections.reduce((acc: number, section: any) => {
    return acc + (Array.isArray(section.criteria) ? section.criteria.length : 0);
  }, 0);

  // Fetch evaluations
  const { data: evaluations } = await supabase
    .from('assessment_evaluations')
    .select('section_id, criterion_id')
    .eq('assessment_id', assessmentId)
    .not('submitted_at', 'is', null);

  const evaluatedCriteria = evaluations?.length || 0;
  const evaluatedSections = new Set(evaluations?.map(e => e.section_id)).size;

  // Fetch collaborators
  const { data: collaborators } = await supabase
    .from('assessment_collaborators')
    .select('status')
    .eq('assessment_id', assessmentId);

  const collaboratorsCount = collaborators?.length || 0;
  const activeCollaborators = collaborators?.filter(c => c.status === 'accepted').length || 0;

  return {
    assessment_id: assessmentId,
    total_sections: totalSections,
    completed_sections: evaluatedSections,
    total_criteria: totalCriteria,
    evaluated_criteria: evaluatedCriteria,
    progress_percentage: totalCriteria > 0 ? Math.round((evaluatedCriteria / totalCriteria) * 100) : 0,
    collaborators_count: collaboratorsCount,
    active_collaborators: activeCollaborators
  };
};
