/**
 * Education API Service — connects frontend to /api/education backend
 * Covers: universities, programs, scholarships, LMS courses, user progress
 */
import { getAuthToken } from '@/utils/tokenUtils';

const API_BASE = (import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/education`
    : '/api/education');

// The academic directory is its own blueprint, not part of /api/education, so
// it needs the root rather than API_BASE — which already ends in /api/education
// and would otherwise produce /api/education/api/academic-programs.
const ROOT = import.meta.env.VITE_API_BASE_URL || '';

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

// Derived from the programmes actually listed, not from a `universities` table.
// That table existed only for this page and carried an invented ranking of real
// UAE universities, invented student counts and invented graduate employment
// rates of 96-98%. Migration 098 dropped it; what remains is what can be said
// honestly — these institutions have programmes here, this many.
export async function getUniversities(_search?: string): Promise<University[]> {
    const res = await fetch(`${ROOT}/api/academic-programs/institutions`);
    const data = await res.json();
    return (data.institutions || []).map((i: any, idx: number) => ({
        id: idx + 1,
        name: i.university,
        name_ar: i.university_ar || i.university,
        location: i.location || '',
        programs_count: i.program_count,
        website: i.a_link || '',
    })) as University[];
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
    // Undergraduate slice of the ONE academic directory. `/programs` read
    // university_programs, a parallel table to graduate_programs holding the
    // same object; migration 098 folded both into academic_programs with a
    // `level`, so this page and Graduate Programs are two views of one list.
    params.set('level', 'undergraduate');
    const res = await fetch(`${ROOT}/api/academic-programs?${params.toString()}`);
    const data = (await res.json()) as { programs: UniversityProgram[]; total: number };
    return data.programs;
}

export async function getProgram(id: number): Promise<UniversityProgram> {
    return apiFetch<UniversityProgram>(`/programs/${id}`);
}

// applyToProgram() was here. It POSTed to
// /api/education/programs/<id>/apply, which answered "Application submitted
// successfully" while sending nothing to any university. No component ever
// called it. The endpoint and its table are gone (migration 098); use
// /api/academic-programs/<id>/interest, which records that somebody is
// applying without claiming to have applied for them.

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
