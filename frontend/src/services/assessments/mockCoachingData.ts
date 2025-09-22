
export interface MockCoachingData {
  id: string;
  user_id: string;
  session_id: string;
  feedback: string;
  recommendations: string[];
  next_steps: string[];
}

export const mockCoachingData: MockCoachingData[] = [
  {
    id: '1',
    user_id: 'user1',
    session_id: 'session1',
    feedback: 'Great technical skills, focus on communication',
    recommendations: ['Practice public speaking', 'Join a professional group'],
    next_steps: ['Schedule follow-up', 'Complete recommended courses']
  }
];
