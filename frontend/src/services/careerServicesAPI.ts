/**
 * Career Services API — Frontend service
 * Typed functions for internships, gigs, career plans, salary benchmarks, portfolio, startups.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/career-services`
    : 'http://127.0.0.1:5005/api/career-services');

// ─── Types ───────────────────────────────────────────────

export interface Internship {
    id: number;
    title: string;
    title_ar?: string;
    company: string;
    company_ar?: string;
    location?: string;
    location_ar?: string;
    sector?: string;
    sector_ar?: string;
    duration?: string;
    duration_ar?: string;
    type?: string;
    stipend?: string;
    stipend_ar?: string;
    description?: string;
    description_ar?: string;
    skills: string[];
    deadline?: string;
    company_logo?: string;
    is_active?: boolean;
}

export interface Gig {
    id: number;
    title: string;
    title_ar?: string;
    company: string;
    company_ar?: string;
    company_rating?: number;
    company_reviews?: number;
    location?: string;
    location_ar?: string;
    budget?: string;
    budget_ar?: string;
    duration?: string;
    duration_ar?: string;
    description?: string;
    description_ar?: string;
    category?: string;
    category_ar?: string;
    skills: string[];
    is_featured?: boolean;
    posted_at?: string;
}

export interface SalaryBenchmark {
    id: number;
    role_title: string;
    role_title_ar?: string;
    industry?: string;
    industry_ar?: string;
    experience_level?: string;
    min_salary?: number;
    median_salary?: number;
    max_salary?: number;
    currency?: string;
}

export interface PortfolioProject {
    id: number;
    user_id: number;
    title: string;
    title_ar?: string;
    description?: string;
    description_ar?: string;
    project_url?: string;
    image_url?: string;
    skills_demonstrated: string[];
    category?: string;
    completion_date?: string;
}

export interface StartupProgram {
    id: number;
    name: string;
    name_ar?: string;
    location?: string;
    location_ar?: string;
    description?: string;
    description_ar?: string;
    website?: string;
    type?: string;
    focus?: string[];
}

// ─── Internships ─────────────────────────────────────────

export async function getInternships(filters?: {
    sector?: string;
    location?: string;
    search?: string;
}): Promise<Internship[]> {
    const params = new URLSearchParams();
    if (filters?.sector) params.set('sector', filters.sector);
    if (filters?.location) params.set('location', filters.location);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const resp = await fetch(`${API_BASE}/internships${qs}`);
    if (!resp.ok) throw new Error(`Failed to fetch internships: ${resp.status}`);
    const data = await resp.json();
    return data.internships || [];
}

export async function getInternship(id: number): Promise<Internship> {
    const resp = await fetch(`${API_BASE}/internships/${id}`);
    if (!resp.ok) throw new Error(`Failed to fetch internship: ${resp.status}`);
    return resp.json();
}

export async function applyForInternship(internshipId: number, userId?: number): Promise<{ application_id: number; status: string }> {
    const token = localStorage.getItem('token') || '';
    const resp = await fetch(`${API_BASE}/internships/${internshipId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId }),
    });
    if (!resp.ok) throw new Error(`Failed to apply: ${resp.status}`);
    return resp.json();
}

// ─── Gig Marketplace ────────────────────────────────────

export async function getGigs(filters?: {
    category?: string;
    search?: string;
    featured?: boolean;
}): Promise<Gig[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.featured) params.set('featured', 'true');
    const qs = params.toString() ? `?${params.toString()}` : '';
    const resp = await fetch(`${API_BASE}/gigs${qs}`);
    if (!resp.ok) throw new Error(`Failed to fetch gigs: ${resp.status}`);
    const data = await resp.json();
    return data.gigs || [];
}

export async function getGig(id: number): Promise<Gig> {
    const resp = await fetch(`${API_BASE}/gigs/${id}`);
    if (!resp.ok) throw new Error(`Failed to fetch gig: ${resp.status}`);
    return resp.json();
}

export async function applyForGig(gigId: number, userId?: number): Promise<{ application_id: number; status: string }> {
    const token = localStorage.getItem('token') || '';
    const resp = await fetch(`${API_BASE}/gigs/${gigId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId }),
    });
    if (!resp.ok) throw new Error(`Failed to apply: ${resp.status}`);
    return resp.json();
}

// ─── Salary Benchmarks ──────────────────────────────────

export async function getSalaryBenchmarks(filters?: {
    role?: string;
    industry?: string;
    experience?: string;
}): Promise<SalaryBenchmark[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.set('role', filters.role);
    if (filters?.industry) params.set('industry', filters.industry);
    if (filters?.experience) params.set('experience', filters.experience);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const resp = await fetch(`${API_BASE}/salary-benchmarks${qs}`);
    if (!resp.ok) throw new Error(`Failed to fetch benchmarks: ${resp.status}`);
    const data = await resp.json();
    return data.benchmarks || [];
}

// ─── Portfolio ──────────────────────────────────────────

export async function getPortfolio(userId: number): Promise<PortfolioProject[]> {
    const resp = await fetch(`${API_BASE}/portfolio/${userId}`);
    if (!resp.ok) throw new Error(`Failed to fetch portfolio: ${resp.status}`);
    const data = await resp.json();
    return data.projects || [];
}

export async function addPortfolioProject(project: Partial<PortfolioProject>): Promise<{ project_id: number }> {
    const token = localStorage.getItem('token') || '';
    const resp = await fetch(`${API_BASE}/portfolio/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(project),
    });
    if (!resp.ok) throw new Error(`Failed to add project: ${resp.status}`);
    return resp.json();
}

// ─── Startup Launchpad ──────────────────────────────────

export async function getStartupPrograms(): Promise<StartupProgram[]> {
    const resp = await fetch(`${API_BASE}/startups`);
    if (!resp.ok) throw new Error(`Failed to fetch startups: ${resp.status}`);
    const data = await resp.json();
    return data.programs || [];
}
