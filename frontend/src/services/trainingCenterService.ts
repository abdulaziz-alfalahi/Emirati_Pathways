// Training-center service — operator onboarding (create center + bind reps) and
// the provider's own center lookup. restClient-based (cookie auth + CSRF).
import { restClient } from '@/utils/api';

const BASE = '/api/training-center';

export interface TrainingCenter {
  id: number;
  name: string;
  name_ar?: string | null;
  website?: string | null;
  emirate?: string | null;
  status?: string;
}

export interface CenterStaff {
  user_id: string;
  full_name: string;
  staff_role: string;
  status: string;
}

export const trainingCenterService = {
  // Operator (professional_dev_operator / admin)
  centers: () =>
    restClient.get(`${BASE}/centers`).then((r) => (r.data?.data as TrainingCenter[]) || []),
  createCenter: (body: { name: string; name_ar?: string; website?: string; emirate?: string }) =>
    restClient.post(`${BASE}/centers`, body).then((r) => r.data?.data as TrainingCenter),
  listStaff: (centerId: number) =>
    restClient.get(`${BASE}/centers/${centerId}/staff`).then((r) => (r.data?.data as CenterStaff[]) || []),
  addStaff: (centerId: number, userId: string) =>
    restClient.post(`${BASE}/centers/${centerId}/staff`, { user_id: userId }),
  removeStaff: (centerId: number, userId: string) =>
    restClient.delete(`${BASE}/centers/${centerId}/staff/${userId}`),
  // Provider representative
  myCenters: () =>
    restClient.get(`${BASE}/my-centers`).then((r) => (r.data?.data as TrainingCenter[]) || []),
  programs: () =>
    restClient.get(`${BASE}/programs`).then((r) => (r.data?.programs as any[]) || []),
  createProgram: (body: {
    title: string; title_ar?: string; category?: string; level?: string;
    duration?: string; url?: string; description?: string; skills_covered?: string[];
    certification_offered?: boolean;
  }) => restClient.post(`${BASE}/programs`, body),
};

export default trainingCenterService;
