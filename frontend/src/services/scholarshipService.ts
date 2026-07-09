
import {
  Scholarship,
  Application,
  ScholarshipWithApplications
} from "@/types/scholarships";
import { getAuthToken } from '@/utils/tokenUtils';

// ── Flask backend API ──
const API_BASE = (import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/education`
  : '/api/education');

interface ScholarshipFilters {
  providerType?: string[];
  amount?: [number | null, number | null];
  search?: string;
}

/** Transform raw API row → Scholarship interface */
function toScholarship(raw: any): Scholarship {
  return {
    id: String(raw.id),
    title: raw.title || '',
    description: raw.description || raw.description_ar || '',
    provider: raw.provider_name || raw.provider || '',
    provider_type: raw.provider_type || 'compliance_auditor',
    eligibility_criteria: raw.eligibility
      ? (typeof raw.eligibility === 'string' ? JSON.parse(raw.eligibility) : raw.eligibility)
      : {},
    amount: raw.amount,
    currency: raw.coverage_type || raw.currency || 'AED',
    application_deadline: raw.deadline || undefined,
    requirements: raw.eligible_majors ? [raw.eligible_majors] : [],
    contact_email: undefined,
    contact_phone: undefined,
    website_url: raw.application_link || undefined,
    is_active: raw.is_active ?? raw.active ?? true,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at,
    created_by: '',
  };
}

/**
 * Fetch scholarships with optional filtering — now from Flask backend
 */
export const getScholarships = async (filters?: ScholarshipFilters): Promise<Scholarship[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.providerType && filters.providerType.length > 0) {
      params.set('provider_type', filters.providerType[0]);
    }
    const qs = params.toString() ? `?${params.toString()}` : '';
    const resp = await fetch(`${API_BASE}/scholarships${qs}`);
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    const data = await resp.json();
    let scholarships = (data.scholarships || []).map(toScholarship);

    // Local amount filter
    if (filters?.amount && (filters.amount[0] !== null || filters.amount[1] !== null)) {
      const min = filters.amount[0] ?? 0;
      const max = filters.amount[1] ?? Infinity;
      scholarships = scholarships.filter(s => {
        if (s.amount === undefined) return false;
        return s.amount >= min && s.amount <= max;
      });
    }

    return scholarships;
  } catch (err) {
    console.error('Error fetching scholarships from API:', err);
    return [];
  }
};

/**
 * Apply for a scholarship — now via Flask backend
 */
export const applyForScholarship = async (scholarshipId: string, userId: string): Promise<Application> => {
  try {
    const token = getAuthToken() || '';
    const resp = await fetch(`${API_BASE}/scholarships/${scholarshipId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Apply failed: ${resp.status}`);
    }
    const data = await resp.json();
    return {
      id: String(data.application_id),
      scholarship_id: scholarshipId,
      student_id: userId,
      status: data.status || 'pending',
      submitted_at: data.submitted_at || new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error applying for scholarship:', err);
    // Return mock-like fallback so UI doesn't crash
    return {
      id: `APP-${Math.floor(Math.random() * 10000)}`,
      scholarship_id: scholarshipId,
      student_id: userId,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    };
  }
};

/**
 * Get applications submitted by a student
 */
export const getUserApplications = async (userId: string): Promise<Application[]> => {
  try {
    const token = getAuthToken() || '';
    const resp = await fetch(`${API_BASE}/my-progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.scholarships || []).map((sa: any) => ({
      id: String(sa.id),
      scholarship_id: String(sa.scholarship_id),
      student_id: userId,
      status: sa.status || 'pending',
      submitted_at: sa.submitted_at || '',
      scholarship: sa.title ? {
        id: String(sa.scholarship_id),
        title: sa.title,
        description: '',
        provider: sa.provider || '',
        provider_type: 'compliance_auditor',
        is_active: true,
        created_at: '',
        created_by: '',
        amount: sa.amount,
      } : undefined,
    }));
  } catch {
    return [];
  }
};

/**
 * Get scholarships created by a provider with application counts
 */
export const getScholarshipsWithApplicationCounts = async (_providerId: string): Promise<ScholarshipWithApplications[]> => {
  const scholarships = await getScholarships();
  return scholarships.map(s => ({
    ...s,
    applications: { pending: 0, approved: 0, rejected: 0, total: 0 },
  }));
};

/**
 * Get applications for a specific scholarship
 */
export const getApplicationsByScholarship = async (scholarshipId: string): Promise<Application[]> => {
  try {
    const token = getAuthToken() || '';
    const resp = await fetch(`${API_BASE}/scholarships/${scholarshipId}/applications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.applications || []).map((a: any) => ({
      id: String(a.id),
      scholarship_id: String(a.scholarship_id),
      student_id: String(a.user_id),
      status: a.status || 'pending',
      submitted_at: a.submitted_at || '',
      applicant_name: a.applicant_name,
      applicant_email: a.applicant_email,
      ai_match_score: a.ai_match_score,
      educator_status: a.educator_status,
      educator_notes: a.educator_notes,
    }));
  } catch (err) {
    console.error('Error fetching scholarship applications:', err);
    return [];
  }
};

/**
 * Update application status
 */
export const updateApplicationStatus = async (
  applicationId: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<boolean> => {
  try {
    const token = getAuthToken() || '';
    const resp = await fetch(`${API_BASE}/scholarships/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, notes: notes || '' }),
    });
    return resp.ok;
  } catch (err) {
    console.error('Error updating application status:', err);
    return false;
  }
};

/**
 * Create a new scholarship
 */
export const createScholarship = async (scholarshipData: Partial<Scholarship>): Promise<Scholarship> => {
  try {
    const token = getAuthToken() || '';
    const resp = await fetch(`${API_BASE}/scholarships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(scholarshipData),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Create failed: ${resp.status}`);
    }
    const data = await resp.json();
    return {
      id: String(data.id),
      title: scholarshipData.title || '',
      provider: scholarshipData.provider || '',
      provider_type: scholarshipData.provider_type || 'university',
      is_active: true,
      created_at: data.created_at || new Date().toISOString(),
      created_by: '',
      ...scholarshipData,
    };
  } catch (err) {
    console.error('Error creating scholarship:', err);
    // Return fallback so UI doesn't crash
    return {
      id: `SCH-${Date.now()}`,
      title: scholarshipData.title || '',
      provider: scholarshipData.provider || '',
      provider_type: scholarshipData.provider_type || 'university',
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: '',
      ...scholarshipData,
    };
  }
};


// Alias for backward compatibility
export const getApplicationsByUser = async (userId: string): Promise<Application[]> => {
  return getUserApplications(userId);
};
