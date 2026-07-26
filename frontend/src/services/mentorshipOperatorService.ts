// Mentorship enrollment-operator service — enrol mentors + coaches, manage programs.
import { restClient } from '@/utils/api';

const BASE = '/api/mentor/operator';

export interface OperatorMentor {
  user_id: string;
  full_name: string;
  professional_title?: string | null;
  industry?: string | null;
  is_available?: boolean;
  is_verified?: boolean;
}
export interface OperatorCoach { user_id: string; full_name: string; }
export interface MentorshipProgram {
  id: number; program_name: string; program_type?: string | null;
  target_audience?: string | null; duration_weeks?: number | null; is_published?: boolean;
}

export const mentorshipOperatorService = {
  mentors: () => restClient.get(`${BASE}/mentors`).then((r) => (r.data?.data as OperatorMentor[]) || []),
  enrolMentor: (body: { user_id: string; professional_title?: string; industry?: string; years_of_experience?: number; expertise_areas?: string[] }) =>
    restClient.post(`${BASE}/mentors`, body),
  removeMentor: (userId: string) => restClient.delete(`${BASE}/mentors/${userId}`),
  coaches: () => restClient.get(`${BASE}/coaches`).then((r) => (r.data?.data as OperatorCoach[]) || []),
  enrolCoach: (userId: string) => restClient.post(`${BASE}/coaches`, { user_id: userId }),
  programs: () => restClient.get(`${BASE}/programs`).then((r) => (r.data?.data as MentorshipProgram[]) || []),
  createProgram: (body: { program_name: string; program_type?: string; target_audience?: string; duration_weeks?: number }) =>
    restClient.post(`${BASE}/programs`, body),
};

export default mentorshipOperatorService;
