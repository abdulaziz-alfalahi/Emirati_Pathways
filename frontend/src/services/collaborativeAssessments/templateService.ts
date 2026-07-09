import { AssessmentTemplate, AssessmentTemplateStatus } from '@/types/collaborativeAssessments';

export const createAssessmentTemplate = async (template: Omit<AssessmentTemplate, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('assessment_templates')
    .insert([{
      ...template,
      sections: template.sections as any,
      scoring_criteria: template.scoring_criteria as any
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating assessment template:', error);
    throw error;
  }

  return {
    ...data,
    sections: data.sections as unknown as AssessmentTemplate['sections'],
    scoring_criteria: data.scoring_criteria as AssessmentTemplate['scoring_criteria'],
    status: data.status as AssessmentTemplateStatus
  } as AssessmentTemplate;
};

export const fetchAssessmentTemplates = async (createdBy?: string, status?: AssessmentTemplateStatus) => {
  let query = supabase
    .from('assessment_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (createdBy) {
    query = query.eq('created_by', createdBy);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching assessment templates:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    sections: item.sections as unknown as AssessmentTemplate['sections'],
    scoring_criteria: item.scoring_criteria as AssessmentTemplate['scoring_criteria'],
    status: item.status as AssessmentTemplateStatus
  })) as AssessmentTemplate[];
};

export const updateAssessmentTemplate = async (id: string, updates: Partial<AssessmentTemplate>) => {
  const { data, error } = await supabase
    .from('assessment_templates')
    .update({
      ...updates,
      sections: updates.sections as any,
      scoring_criteria: updates.scoring_criteria as any
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating assessment template:', error);
    throw error;
  }

  return {
    ...data,
    sections: data.sections as unknown as AssessmentTemplate['sections'],
    scoring_criteria: data.scoring_criteria as AssessmentTemplate['scoring_criteria'],
    status: data.status as AssessmentTemplateStatus
  } as AssessmentTemplate;
};

export const deleteAssessmentTemplate = async (id: string) => {
  const { error } = await supabase
    .from('assessment_templates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting assessment template:', error);
    throw error;
  }

  return true;
};

export const duplicateAssessmentTemplate = async (templateId: string, newTitle: string, userId: string) => {
  const { data: originalTemplate, error: fetchError } = await supabase
    .from('assessment_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (fetchError) {
    console.error('Error fetching original template:', fetchError);
    throw fetchError;
  }

  const duplicatedTemplate = {
    title: newTitle,
    description: originalTemplate.description,
    category: originalTemplate.category,
    sections: originalTemplate.sections as unknown as AssessmentTemplate['sections'],
    scoring_criteria: originalTemplate.scoring_criteria as AssessmentTemplate['scoring_criteria'],
    estimated_duration_minutes: originalTemplate.estimated_duration_minutes,
    is_public: originalTemplate.is_public,
    tags: originalTemplate.tags,
    status: 'draft' as AssessmentTemplateStatus,
    created_by: userId
  };

  return createAssessmentTemplate(duplicatedTemplate);
};
