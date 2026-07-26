// Assessment-operator service — enrol assessment centers + certified assessors.
// restClient-based (cookie auth + CSRF).
import { restClient } from '@/utils/api';

const BASE = '/api/assessor/operator';

export interface AssessmentCenter {
  id: string;
  name: string;
  industry?: string | null;
  emirate?: string | null;
  website?: string | null;
  is_verified?: boolean;
}

export interface CenterAssessor {
  user_id: string;
  full_name: string;
  invitation_status: string;
  certification_level?: string | null;
  specialization?: string | null;
  nqf_authorization_level?: string | null;
  is_active?: boolean;
}

export const assessmentOperatorService = {
  centers: () =>
    restClient.get(`${BASE}/centers`).then((r) => (r.data?.data as AssessmentCenter[]) || []),
  createCenter: (body: { name: string; industry?: string; emirate?: string; website?: string }) =>
    restClient.post(`${BASE}/centers`, body).then((r) => r.data?.data as AssessmentCenter),
  assessors: (centerId: string) =>
    restClient.get(`${BASE}/centers/${centerId}/assessors`).then((r) => (r.data?.data as CenterAssessor[]) || []),
  enrolAssessor: (centerId: string, body: {
    user_id: string; certification_level?: string; specialization?: string;
    nqf_authorization_level?: string; years_experience?: number;
  }) => restClient.post(`${BASE}/centers/${centerId}/assessors`, body),
  removeAssessor: (centerId: string, userId: string) =>
    restClient.delete(`${BASE}/centers/${centerId}/assessors/${userId}`),
};

export default assessmentOperatorService;
