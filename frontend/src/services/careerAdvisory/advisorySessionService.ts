import { AdvisorySession, ApiKeys } from "@/types/careerAdvisory";

export const getSessions = async (userId: string): Promise<AdvisorySession[]> => {
  try {
    const { data, error } = await supabase
      .from('advisory_sessions')
      .select(`
        *,
        career_advisors:advisor_id (
          specialization,
          user_id,
          user_profiles:profiles (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data as unknown as AdvisorySession[];
  } catch (error) {
    console.error("Error fetching sessions:", error);
    throw error;
  }
};

export const getSessionById = async (id: string): Promise<AdvisorySession | null> => {
  try {
    const { data, error } = await supabase
      .from('advisory_sessions')
      .select(`
        *,
        career_advisors:advisor_id (
          specialization,
          user_id,
          user_profiles:profiles (
            full_name,
            avatar_url
          )
        ),
        candidate_profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as AdvisorySession;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
};

export const getAdvisorSessions = async (advisorId: string): Promise<AdvisorySession[]> => {
  try {
    const { data, error } = await supabase
      .from('advisory_sessions')
      .select(`
        *,
        candidate_profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('advisor_id', advisorId);

    if (error) throw error;
    return data as unknown as AdvisorySession[];
  } catch (error) {
    console.error("Error fetching advisor sessions:", error);
    throw error;
  }
};

export const createSession = async (
  session: Omit<AdvisorySession, "id" | "created_at" | "updated_at">
): Promise<AdvisorySession> => {
  try {
    const { data, error } = await supabase
      .from('advisory_sessions')
      .insert({
        user_id: session.user_id,
        advisor_id: session.advisor_id,
        status: session.status,
        scheduled_date: session.scheduled_date,
        topic: session.topic,
        details: session.details,
        notes: session.notes,
        rating: session.rating,
        feedback: session.feedback,
        video_call_url: session.video_call_url,
        completed_date: session.completed_date,
        is_interview: session.is_interview || false,
        interview_type: session.interview_type || null,
        interview_questions: session.interview_questions || null
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as AdvisorySession;
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
};

export const updateSession = async (
  id: string,
  session: Partial<Omit<AdvisorySession, "id" | "created_at" | "updated_at">>
): Promise<AdvisorySession> => {
  try {
    const { data, error } = await supabase
      .from('advisory_sessions')
      .update(session)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as AdvisorySession;
  } catch (error) {
    console.error("Error updating session:", error);
    throw error;
  }
};

export const deleteSession = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('advisory_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
};

export const createVideoCallLink = async (sessionId: string): Promise<string> => {
  try {
    // Get HireVue API key
    const { data: apiKeysData, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('*')
      .single();
    
    if (apiKeysError || !apiKeysData?.hirevue_api_key) {
      console.error("Error fetching HireVue API key:", apiKeysError);
      throw new Error("HireVue API key not configured");
    }

    // This is a placeholder for actual HireVue API integration
    // In a real implementation, you would make an API call to HireVue to create a meeting
    const hirevueApiKey = apiKeysData.hirevue_api_key;
    const videoCallUrl = `https://hirevue.example.com/meeting/${sessionId}?key=${hirevueApiKey.substring(0, 5)}...`;
    
    // Update the session with the video call link
    await updateSession(sessionId, { video_call_url: videoCallUrl });
    
    return videoCallUrl;
  } catch (error) {
    console.error("Error creating video call link:", error);
    throw error;
  }
};

// Helper function to start an interview session
export const startInterviewSession = async (sessionId: string): Promise<AdvisorySession> => {
  try {
    const videoCallUrl = await createVideoCallLink(sessionId);
    
    const updatedSession = await updateSession(sessionId, {
      status: 'in_progress',
      video_call_url: videoCallUrl
    });
    
    return updatedSession;
  } catch (error) {
    console.error("Error starting interview session:", error);
    throw error;
  }
};

// Function to finish an interview and provide feedback
export const completeInterview = async (
  sessionId: string,
  notes: string,
  rating: number,
  feedback: string
): Promise<AdvisorySession> => {
  try {
    const now = new Date().toISOString();
    
    const updatedSession = await updateSession(sessionId, {
      status: 'completed',
      completed_date: now,
      notes,
      rating,
      feedback
    });
    
    return updatedSession;
  } catch (error) {
    console.error("Error completing interview:", error);
    throw error;
  }
};

// Function to schedule an interview session
export const scheduleInterview = async (
  userId: string,
  advisorId: string,
  scheduledDate: Date,
  topic: string,
  details: string,
  interviewType: "mock" | "practice" | "technical" | "behavioral"
): Promise<AdvisorySession> => {
  return createSession({
    user_id: userId,
    advisor_id: advisorId,
    status: 'scheduled',
    scheduled_date: scheduledDate.toISOString(),
    completed_date: null,
    topic,
    details,
    notes: null,
    rating: null,
    feedback: null,
    video_call_url: null,
    is_interview: true,
    interview_type: interviewType,
    interview_questions: []
  });
};

// Add aliases for component compatibility
export const fetchAdvisorySessions = getSessions;
export const updateAdvisorySession = updateSession;
export const initiateVideoCall = createVideoCallLink;
export const scheduleAdvisorySession = (
  userId: string,
  advisorId: string,
  scheduledDate: Date,
  topic: string,
  details: string
): Promise<AdvisorySession> => {
  return createSession({
    user_id: userId,
    advisor_id: advisorId,
    status: 'scheduled',
    scheduled_date: scheduledDate.toISOString(),
    completed_date: null,
    topic,
    details,
    notes: null,
    rating: null,
    feedback: null,
    video_call_url: null,
    is_interview: false,
    interview_type: null,
    interview_questions: null
  });
};
