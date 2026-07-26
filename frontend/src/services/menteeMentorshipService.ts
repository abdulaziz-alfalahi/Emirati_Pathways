// Mentee-side mentorship service — request a mentor, track relationships,
// request skill verification, book sessions. restClient (cookie auth + CSRF).
import { restClient } from '@/utils/api';

export interface MyMentor {
  id: string;                 // mentorship_matching id (uuid)
  mentor_user_id: string;
  mentor_name: string;
  professional_title?: string | null;
  match_status: string;       // requested | active | declined
  is_active?: boolean;
}

export const menteeMentorshipService = {
  requestMentor: (mentorUserId: string) =>
    restClient.post('/api/mentor/request', { mentor_user_id: mentorUserId }),
  myMentors: () =>
    restClient.get('/api/mentor/my-mentors').then((r) => (r.data?.data as MyMentor[]) || []),
  requestVerification: (mentorUserId: string, skillName: string) =>
    restClient.post('/api/mentor/verify-request', { mentor_user_id: mentorUserId, skill_name: skillName }),
  bookSession: (body: { mentor_user_id: string; session_title?: string; scheduled_date?: string }) =>
    restClient.post('/api/mentor/sessions', body),
};

export default menteeMentorshipService;
