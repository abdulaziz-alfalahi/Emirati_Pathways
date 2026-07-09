import { AssessmentReport, SectionScore, CriterionScore, CollaboratorInsight, CollaboratorRole } from '@/types/collaborativeAssessments';

export const generateAssessmentReport = async (assessmentId: string): Promise<AssessmentReport> => {
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

  // Fetch all evaluations without joining profiles first
  const { data: evaluations, error: evaluationsError } = await supabase
    .from('assessment_evaluations')
    .select('*')
    .eq('assessment_id', assessmentId)
    .not('submitted_at', 'is', null);

  if (evaluationsError) {
    throw evaluationsError;
  }

  // Fetch evaluator profiles separately
  const evaluatorIds = [...new Set(evaluations?.map(e => e.evaluator_id) || [])];
  const { data: evaluatorProfiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', evaluatorIds);

  // Create a map of evaluator profiles for easy lookup
  const evaluatorProfilesMap = (evaluatorProfiles || []).reduce((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {} as Record<string, any>);

  // Fetch collaborators without joining profiles first
  const { data: collaborators, error: collaboratorsError } = await supabase
    .from('assessment_collaborators')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('status', 'accepted');

  if (collaboratorsError) {
    throw collaboratorsError;
  }

  // Fetch collaborator profiles separately
  const collaboratorIds = [...new Set(collaborators?.map(c => c.user_id) || [])];
  const { data: collaboratorProfiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', collaboratorIds);

  // Create a map of collaborator profiles for easy lookup
  const collaboratorProfilesMap = (collaboratorProfiles || []).reduce((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {} as Record<string, any>);

  const template = assessment.template;
  const sections = Array.isArray(template?.sections) ? template.sections : [];

  // Calculate section scores
  const sectionScores: SectionScore[] = sections.map((section: any) => {
    const sectionEvaluations = evaluations?.filter(e => e.section_id === section.id) || [];
    const criteria = Array.isArray(section.criteria) ? section.criteria : [];
    
    const criteriaScores: CriterionScore[] = criteria.map((criterion: any) => {
      const criterionEvaluations = sectionEvaluations.filter(e => e.criterion_id === criterion.id);
      
      const evaluatorScores = criterionEvaluations.map(evaluation => {
        const evaluatorProfile = evaluatorProfilesMap[evaluation.evaluator_id];
        return {
          evaluator_id: evaluation.evaluator_id,
          evaluator_name: evaluatorProfile?.email || evaluatorProfile?.full_name || 'Unknown',
          score: evaluation.score || 0,
          comments: evaluation.comments
        };
      });

      const avgScore = evaluatorScores.length > 0 
        ? evaluatorScores.reduce((sum, es) => sum + es.score, 0) / evaluatorScores.length 
        : 0;

      // Calculate consensus level (how much evaluators agree)
      const scores = evaluatorScores.map(es => es.score);
      const variance = scores.length > 1 
        ? scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length
        : 0;
      const consensusLevel = Math.max(0, 100 - Math.sqrt(variance) * 10); // Simple consensus metric

      return {
        criterion_id: criterion.id,
        criterion_title: criterion.title,
        score: avgScore,
        max_score: criterion.max_score,
        evaluator_scores: evaluatorScores,
        consensus_level: consensusLevel
      };
    });

    const sectionScore = criteriaScores.reduce((sum, cs) => sum + cs.score, 0);
    const maxSectionScore = criteriaScores.reduce((sum, cs) => sum + cs.max_score, 0);

    return {
      section_id: section.id,
      section_title: section.title,
      score: sectionScore,
      max_score: maxSectionScore,
      percentage: maxSectionScore > 0 ? (sectionScore / maxSectionScore) * 100 : 0,
      criteria_scores: criteriaScores
    };
  });

  // Calculate overall scores
  const overallScore = sectionScores.reduce((sum, ss) => sum + ss.score, 0);
  const maxPossibleScore = sectionScores.reduce((sum, ss) => sum + ss.max_score, 0);
  const percentageScore = maxPossibleScore > 0 ? (overallScore / maxPossibleScore) * 100 : 0;

  // Generate collaborator insights
  const collaboratorInsights: CollaboratorInsight[] = collaborators?.map(collaborator => {
    const userEvaluations = evaluations?.filter(e => e.evaluator_id === collaborator.user_id) || [];
    const sectionsEvaluated = new Set(userEvaluations.map(e => e.section_id)).size;
    const avgScoreGiven = userEvaluations.length > 0 
      ? userEvaluations.reduce((sum, e) => sum + (e.score || 0), 0) / userEvaluations.length 
      : 0;
    
    const keyComments = userEvaluations
      .filter(e => e.comments && e.comments.length > 10)
      .map(e => e.comments!)
      .slice(0, 3);

    const collaboratorProfile = collaboratorProfilesMap[collaborator.user_id];

    return {
      collaborator_id: collaborator.user_id,
      collaborator_name: collaboratorProfile?.email || collaboratorProfile?.full_name || 'Unknown',
      role: collaborator.role as CollaboratorRole,
      sections_evaluated: sectionsEvaluated,
      average_score_given: avgScoreGiven,
      key_comments: keyComments
    };
  }) || [];

  // Generate recommendations based on scores
  const recommendations: string[] = [];
  
  if (percentageScore >= 90) {
    recommendations.push("Exceptional performance across all assessment criteria.");
  } else if (percentageScore >= 75) {
    recommendations.push("Strong performance with some areas for improvement.");
  } else if (percentageScore >= 60) {
    recommendations.push("Satisfactory performance with notable areas needing development.");
  } else {
    recommendations.push("Significant improvement needed across multiple assessment areas.");
  }

  // Add specific recommendations based on low-scoring sections
  sectionScores
    .filter(ss => ss.percentage < 70)
    .forEach(ss => {
      recommendations.push(`Focus on improving "${ss.section_title}" (${ss.percentage.toFixed(1)}% score).`);
    });

  return {
    assessment_id: assessmentId,
    candidate_id: assessment.candidate_id,
    template_title: template.title,
    overall_score: overallScore,
    max_possible_score: maxPossibleScore,
    percentage_score: percentageScore,
    section_scores: sectionScores,
    collaborator_insights: collaboratorInsights,
    recommendations,
    generated_at: new Date().toISOString()
  };
};

export const exportAssessmentReport = async (assessmentId: string, format: 'pdf' | 'excel' = 'pdf') => {
  const report = await generateAssessmentReport(assessmentId);
  
  // This would integrate with a PDF/Excel generation service
  // For now, return the report data that can be used by a frontend component
  return {
    report,
    downloadUrl: `/api/reports/${assessmentId}/export?format=${format}`,
    filename: `assessment-report-${assessmentId}-${Date.now()}.${format}`
  };
};
