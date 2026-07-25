// Student enrolment service (Phase B) — coordinator/operator verifies enrolment.
// restClient-based so cookie auth + CSRF work.
import { restClient } from '@/utils/api';

export interface EnrolledStudent {
  user_id: string;
  full_name?: string;
  institution?: string;
  program?: string;
  graduation_date?: string;
  status?: string;
  verified_at?: string;
}

const BASE = '/api/students';

export const studentEnrolmentService = {
  enrol: (body: {
    user_id: string; institution: string; program?: string;
    graduation_date?: string; coordinator_id?: string; student_id?: string;
  }) => restClient.post(`${BASE}/enrol`, body),
  myStudents: () =>
    restClient.get(`${BASE}/my-students`).then((r) => (r.data?.data as EnrolledStudent[]) || []),
  record: (userId: string) => restClient.get(`${BASE}/${userId}`).then((r) => r.data?.data),
  graduate: (userId: string) => restClient.post(`${BASE}/${userId}/graduate`),
};

export default studentEnrolmentService;
