/**
 * Education API Service — connects frontend to /api/education backend
 * Covers: universities, programs, scholarships, LMS courses, user progress
 */
import { getAuthToken } from '@/utils/tokenUtils';

const API_BASE = (import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/education`
    : 'http://127.0.0.1:5005/api/education');

// ── Types ──

export interface University {
    id: number;
    name: string;
    name_ar: string;
    location: string;
    type: string;
    established: number;
    ranking: number;
    students_count: number;
    programs_count: number;
    website: string;
    description: string;
    description_ar: string;
    specialties: string[];
    logo_url: string;
    programs?: UniversityProgram[];
}

export interface UniversityProgram {
    id: number;
    university_id: number;
    title: string;
    title_ar: string;
    degree: string;
    category: string;
    category_ar: string;
    description: string;
    description_ar: string;
    duration: string;
    language: string;
    tuition: string;
    career_outcomes: string[];
    subjects: string[];
    skills_taught: string[];
    accreditation: string[];
    rating: number;
    enrolled: number;
    capacity: number;
    employment_rate: number;
    is_popular: boolean;
    is_new: boolean;
    scholarship_available: boolean;
    university_name?: string;
    university_name_ar?: string;
    university_location?: string;
}

export interface Scholarship {
    id: number;
    title: string;
    title_ar: string;
    provider_name: string;
    provider_type: string;
    amount: number;
    description: string;
    description_ar: string;
    eligibility: string[];
    min_gpa: number;
    available_slots: number;
    category: string;
    skills_required: string[];
}

export interface LMSCourse {
    id: number;
    title: string;
    title_ar: string;
    provider: string;
    category: string;
    duration_hours: number;
    level: string;
    skills_covered: string[];
    rating: number;
    enrollments: number;
    certification_offered: boolean;
}

export interface EducationProgress {
    stats: {
        courses_enrolled: number;
        courses_completed: number;
        avg_progress: number;
        programs_applied: number;
        scholarships_applied: number;
    };
    enrollments: any[];
    applications: any[];
    scholarships: any[];
}

// ── API functions ──

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const resp = await fetch(`${API_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
        },
        ...options,
    });
    if (!resp.ok) {
        const error = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(error.error || `API error ${resp.status}`);
    }
    return resp.json();
}

function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const token = getAuthToken() || '';
    return apiFetch<T>(path, {
        ...options,
        headers: {
            ...(options?.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });
}

// ── University functions ──

export async function getUniversities(search?: string): Promise<University[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await apiFetch<{ universities: University[]; total: number }>(`/universities${params}`);
    return data.universities;
}

export async function getUniversity(id: number): Promise<University> {
    return apiFetch<University>(`/universities/${id}`);
}

// ── Program functions ──

export async function getPrograms(filters?: {
    category?: string;
    degree?: string;
    search?: string;
    university_id?: number;
    limit?: number;
}): Promise<UniversityProgram[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.degree) params.set('degree', filters.degree);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.university_id) params.set('university_id', String(filters.university_id));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    const data = await apiFetch<{ programs: UniversityProgram[]; total: number }>(`/programs${qs}`);
    return data.programs;
}

export async function getProgram(id: number): Promise<UniversityProgram> {
    return apiFetch<UniversityProgram>(`/programs/${id}`);
}

export async function applyToProgram(programId: number, applicationData?: Record<string, any>) {
    return authFetch<{ application_id: number; status: string; message: string }>(
        `/programs/${programId}/apply`,
        { method: 'POST', body: JSON.stringify(applicationData || {}) }
    );
}

// ── Scholarship functions ──

export async function getScholarships(filters?: {
    category?: string;
    provider_type?: string;
    search?: string;
}): Promise<Scholarship[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.provider_type) params.set('provider_type', filters.provider_type);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const data = await apiFetch<{ scholarships: Scholarship[]; total: number }>(`/scholarships${qs}`);
    return data.scholarships;
}

export async function applyToScholarship(scholarshipId: number, applicationData?: Record<string, any>) {
    return authFetch<{ application_id: number; match_score: number; status: string; message: string }>(
        `/scholarships/${scholarshipId}/apply`,
        { method: 'POST', body: JSON.stringify(applicationData || {}) }
    );
}

// ── LMS Course functions ──

export async function getCourses(filters?: {
    category?: string;
    level?: string;
    search?: string;
}): Promise<LMSCourse[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.level) params.set('level', filters.level);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const data = await apiFetch<{ courses: LMSCourse[]; total: number }>(`/courses${qs}`);
    return data.courses;
}

export async function enrollInCourse(courseId: number) {
    return authFetch<{ enrollment_id: number; status: string }>(`/courses/${courseId}/enroll`, { method: 'POST' });
}

export async function completeCourse(courseId: number) {
    return authFetch<{ message: string; skills_updated: string[] }>(`/courses/${courseId}/complete`, { method: 'POST' });
}

// ── User Progress ──

export async function getMyProgress(): Promise<EducationProgress> {
    return authFetch<EducationProgress>('/my-progress');
}

// ── Health check ──

export async function checkEducationHealth() {
    return apiFetch<{ status: string; tables: { table: string; rows: number }[] }>('/health');
}
