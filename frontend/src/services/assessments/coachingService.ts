
import { mockCoachingData, MockCoachingData } from './mockCoachingData';

export class CoachingService {
  async getCoachingData(userId: string): Promise<MockCoachingData[]> {
    // Mock implementation - replace with real API calls
    return mockCoachingData.filter(data => data.user_id === userId);
  }

  async createCoachingSession(userId: string, sessionData: Partial<MockCoachingData>): Promise<MockCoachingData> {
    const newSession: MockCoachingData = {
      id: Date.now().toString(),
      user_id: userId,
      session_id: sessionData.session_id || '',
      feedback: sessionData.feedback || '',
      recommendations: sessionData.recommendations || [],
      next_steps: sessionData.next_steps || []
    };

    mockCoachingData.push(newSession);
    return newSession;
  }
}

export const coachingService = new CoachingService();
