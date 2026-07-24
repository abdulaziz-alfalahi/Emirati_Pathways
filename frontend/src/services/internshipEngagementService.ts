// Internship Engagement service — the 3-way handshake (recruiter ↔ coordinator ↔
// student, + parent consent for minors). All calls go through restClient so cookie
// auth + CSRF work (see the cookie-auth-restclient rule).
import { restClient } from '@/utils/api';

export interface Internship {
  id: number;
  title: string;
  title_ar?: string;
  company?: string;
  sector?: string;
  location?: string;
  duration?: string;
  stipend?: string;
  skills?: any;
  deadline?: string;
  posted_by?: string;
  relevant_to_student?: boolean;
}

export interface Engagement {
  id: number;
  internship_id: number;
  user_id: string;
  internship_title?: string;
  internship_company?: string;
  student_name?: string;
  initiated_by: 'student' | 'coordinator';
  stage: 'proposed' | 'confirmed' | 'active' | 'completed' | 'declined' | 'withdrawn';
  recruiter_status: 'pending' | 'approved' | 'declined';
  student_status: 'pending' | 'accepted' | 'declined';
  coordinator_status: 'pending' | 'approved' | 'declined';
  parent_consent_status: 'not_required' | 'pending' | 'granted' | 'denied';
  decline_reason?: string;
  proposed_at?: string;
  confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
}

const BASE = '/api/internship-engagement';

function data<T>(p: Promise<any>): Promise<T> {
  return p.then((r) => r.data?.data as T);
}

export const internshipEngagementService = {
  // Coordinator
  coordinatorOpportunities: (studentId?: string) =>
    data<Internship[]>(restClient.get(`${BASE}/opportunities`, {
      params: studentId ? { student_id: studentId } : undefined,
    })),
  propose: (internshipId: number, studentId: string) =>
    restClient.post(`${BASE}/propose`, { internship_id: internshipId, student_id: studentId }),
  coordinatorEngagements: () => data<Engagement[]>(restClient.get(`${BASE}/coordinator`)),
  coordinatorDecision: (id: number, decision: 'approve' | 'decline', reason?: string) =>
    restClient.post(`${BASE}/${id}/coordinator-decision`, { decision, reason }),

  // Recruiter
  recruiterEngagements: () => data<Engagement[]>(restClient.get(`${BASE}/recruiter`)),
  recruiterDecision: (id: number, decision: 'approve' | 'decline', reason?: string) =>
    restClient.post(`${BASE}/${id}/recruiter-decision`, { decision, reason }),

  // Student
  relevantInternships: () => data<Internship[]>(restClient.get(`${BASE}/relevant`)),
  apply: (internshipId: number) => restClient.post(`${BASE}/apply`, { internship_id: internshipId }),
  myEngagements: () => data<Engagement[]>(restClient.get(`${BASE}/mine`)),
  studentDecision: (id: number, decision: 'accept' | 'decline', reason?: string) =>
    restClient.post(`${BASE}/${id}/student-decision`, { decision, reason }),

  // Parent
  childrenEngagements: () => data<Engagement[]>(restClient.get(`${BASE}/children`)),
  parentConsent: (id: number, decision: 'grant' | 'deny', reason?: string) =>
    restClient.post(`${BASE}/${id}/parent-consent`, { decision, reason }),

  // Lifecycle
  begin: (id: number) => restClient.post(`${BASE}/${id}/begin`),
  complete: (id: number) => restClient.post(`${BASE}/${id}/complete`),
};

export default internshipEngagementService;

// Small shared helper for status pills.
export function stageLabel(stage: Engagement['stage']): { label: string; ar: string } {
  const m: Record<string, { label: string; ar: string }> = {
    proposed: { label: 'Awaiting approvals', ar: 'بانتظار الموافقات' },
    confirmed: { label: 'Confirmed', ar: 'مؤكَّد' },
    active: { label: 'In progress', ar: 'قيد التنفيذ' },
    completed: { label: 'Completed', ar: 'مكتمل' },
    declined: { label: 'Declined', ar: 'مرفوض' },
    withdrawn: { label: 'Withdrawn', ar: 'مسحوب' },
  };
  return m[stage] || { label: stage, ar: stage };
}
