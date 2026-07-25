// Student enrolment service — institution-scoped enrolment (advisor/operator/admin).
// restClient-based so cookie auth + CSRF work.
import { restClient } from '@/utils/api';

const BASE = '/api/students';

export interface EnrolledStudent {
  user_id: string;
  full_name?: string;
  institution?: string;
  institution_id?: number | null;
  program?: string;
  graduation_date?: string;
  status?: string;
  verified_at?: string;
}

export interface Institution {
  id: number;
  name: string;
  name_ar?: string | null;
  type?: string | null;
  emirate?: string | null;
  staff_role?: string;
}

export interface EnrolRow {
  user_id: string;          // real Emirates ID (15 digits, 784-prefixed)
  full_name?: string;
  program?: string;
  graduation_date?: string;
  date_of_birth?: string;
  student_id?: string;
}

export interface BatchResult {
  institution_id: number;
  institution: string;
  created: number;
  updated: number;
  failed: number;
  results: Array<{ user_id: string; full_name: string | null; student: string; account: string }>;
  errors: Array<{ row: number; user_id?: string; error: string }>;
}

export const studentEnrolmentService = {
  enrol: (body: EnrolRow & { institution_id?: number; institution?: string }) =>
    restClient.post(`${BASE}/enrol`, body),
  enrolBatch: (body: { institution_id?: number; institution?: string; students?: EnrolRow[]; csv?: string }) =>
    restClient.post(`${BASE}/enrol-batch`, body).then((r) => r.data?.data as BatchResult),
  myStudents: () =>
    restClient.get(`${BASE}/my-students`).then((r) => (r.data?.data as EnrolledStudent[]) || []),
  atMyInstitution: () =>
    restClient.get(`${BASE}/at-my-institution`).then((r) => (r.data?.data as EnrolledStudent[]) || []),
  record: (userId: string) => restClient.get(`${BASE}/${userId}`).then((r) => r.data?.data),
  graduate: (userId: string) => restClient.post(`${BASE}/${userId}/graduate`),
  // Institutions
  institutions: () =>
    restClient.get(`${BASE}/institutions`).then((r) => (r.data?.data as Institution[]) || []),
  myInstitutions: () =>
    restClient.get(`${BASE}/my-institutions`).then((r) => (r.data?.data as Institution[]) || []),
  createInstitution: (body: { name: string; name_ar?: string; type?: string; emirate?: string }) =>
    restClient.post(`${BASE}/institutions`, body).then((r) => r.data?.data as Institution),
  addStaff: (institutionId: number, body: { user_id: string; staff_role: 'advisor' | 'coordinator' }) =>
    restClient.post(`${BASE}/institutions/${institutionId}/staff`, body),
  listStaff: (institutionId: number) =>
    restClient.get(`${BASE}/institutions/${institutionId}/staff`).then((r) => (r.data?.data as StaffMember[]) || []),
  removeStaff: (institutionId: number, userId: string, staffRole?: string) =>
    restClient.delete(`${BASE}/institutions/${institutionId}/staff/${userId}${staffRole ? `?staff_role=${staffRole}` : ''}`),
};

export interface StaffMember {
  user_id: string;
  full_name: string;
  staff_role: 'advisor' | 'coordinator';
  status: string;
}

export default studentEnrolmentService;
