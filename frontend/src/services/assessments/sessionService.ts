
import { supabase } from '@/integrations/supabase/client';
import { AssessmentSession } from '@/types/assessments';
import { mockAssessmentSessions, getMockUserAssessmentSessions } from './mockSessionData';

// Flag to determine whether to use mock data
const USE_MOCK_DATA = true;

export const fetchAssessmentSessions = async (assessmentId?: string) => {
  if (USE_MOCK_DATA) {
    if (assessmentId) {
      return mockAssessmentSessions.filter(session => session.assessment_id === assessmentId);
    }
    return mockAssessmentSessions;
  }
  
  let query = supabase
    .from('assessment_sessions')
    .select('*, assessments(title, assessment_type)')
    .order('created_at', { ascending: false });
    
  if (assessmentId) {
    query = query.eq('assessment_id', assessmentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching assessment sessions:', error);
    throw error;
  }

  return data as AssessmentSession[];
};

export const fetchUserAssessmentSessions = async (userId: string) => {
  if (USE_MOCK_DATA) {
    return getMockUserAssessmentSessions(userId);
  }

  const { data, error } = await supabase
    .from('assessment_sessions')
    .select('*, assessments(title, assessment_type)')
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching user assessment sessions:', error);
    throw error;
  }

  return data as AssessmentSession[];
};

export const scheduleAssessment = async (assessmentId: string, userId: string, scheduledDate: Date) => {
  if (USE_MOCK_DATA) {
    const lastId = mockAssessmentSessions.length + 1;
    const newSession: AssessmentSession = {
      id: `SESSION${String(lastId).padStart(3, '0')}`,
      assessment_id: assessmentId,
      user_id: userId,
      status: 'scheduled',
      score: null,
      feedback: null,
      results: null,
      scheduled_date: scheduledDate.toISOString(),
      completed_date: null,
      created_at: new Date().toISOString(),
      updated_at: null,
      coaching_recommended: false,
      coaching_notes: null
    };
    
    // In a real implementation, we would add to the mock data
    // mockAssessmentSessions.push(newSession);
    
    return newSession;
  }

  const { data, error } = await supabase
    .from('assessment_sessions')
    .insert([{
      assessment_id: assessmentId,
      user_id: userId,
      status: 'scheduled',
      scheduled_date: scheduledDate.toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error scheduling assessment:', error);
    throw error;
  }

  return data as AssessmentSession;
};

export const updateAssessmentSession = async (sessionId: string, sessionData: Partial<AssessmentSession>) => {
  if (USE_MOCK_DATA) {
    const index = mockAssessmentSessions.findIndex(session => session.id === sessionId);
    if (index === -1) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    const updatedSession = {
      ...mockAssessmentSessions[index],
      ...sessionData,
      updated_at: new Date().toISOString()
    };
    
    // In a real implementation, we would update the mock data
    // mockAssessmentSessions[index] = updatedSession;
    
    return updatedSession;
  }

  const { data, error } = await supabase
    .from('assessment_sessions')
    .update(sessionData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating assessment session:', error);
    throw error;
  }

  return data as AssessmentSession;
};
