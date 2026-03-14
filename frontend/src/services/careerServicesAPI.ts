/**
 * Career Services API — Frontend service
 * Typed functions for internships, gigs, career plans, salary benchmarks, portfolio, startups.
 * Uses restClient (axios) which automatically handles proxy and auth token injection.
 */

import { restClient } from '@/utils/api';

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
    const params: Record<string, string> = {};
    if (filters?.sector) params.sector = filters.sector;
    if (filters?.location) params.location = filters.location;
    if (filters?.search) params.search = filters.search;
    const resp = await restClient.get('/api/career-services/internships', { params });
    return resp.data?.internships || [];
}

export async function getInternship(id: number): Promise<Internship> {
    const resp = await restClient.get(`/api/career-services/internships/${id}`);
    return resp.data;
}

export async function applyForInternship(internshipId: number, userId?: number): Promise<{ application_id: number; status: string }> {
    const resp = await restClient.post(`/api/career-services/internships/${internshipId}/apply`, { user_id: userId });
    return resp.data;
}

// ─── Gig Marketplace ────────────────────────────────────

export async function getGigs(filters?: {
    category?: string;
    search?: string;
    featured?: boolean;
}): Promise<Gig[]> {
    const params: Record<string, string> = {};
    if (filters?.category) params.category = filters.category;
    if (filters?.search) params.search = filters.search;
    if (filters?.featured) params.featured = 'true';
    const resp = await restClient.get('/api/career-services/gigs', { params });
    return resp.data?.gigs || [];
}

export async function getGig(id: number): Promise<Gig> {
    const resp = await restClient.get(`/api/career-services/gigs/${id}`);
    return resp.data;
}

export async function applyForGig(gigId: number, userId?: number): Promise<{ application_id: number; status: string }> {
    const resp = await restClient.post(`/api/career-services/gigs/${gigId}/apply`, { user_id: userId });
    return resp.data;
}

// ─── Salary Benchmarks ──────────────────────────────────

export async function getSalaryBenchmarks(filters?: {
    role?: string;
    industry?: string;
    experience?: string;
}): Promise<SalaryBenchmark[]> {
    const params: Record<string, string> = {};
    if (filters?.role) params.role = filters.role;
    if (filters?.industry) params.industry = filters.industry;
    if (filters?.experience) params.experience = filters.experience;
    const resp = await restClient.get('/api/career-services/salary-benchmarks', { params });
    return resp.data?.benchmarks || [];
}

// ─── Portfolio ──────────────────────────────────────────

export async function getPortfolio(userId: number): Promise<PortfolioProject[]> {
    const resp = await restClient.get(`/api/career-services/portfolio/${userId}`);
    return resp.data?.projects || [];
}

export async function addPortfolioProject(project: Partial<PortfolioProject>): Promise<{ project_id: number }> {
    const resp = await restClient.post('/api/career-services/portfolio/projects', project);
    return resp.data;
}

// ─── Startup Launchpad ──────────────────────────────────

export async function getStartupPrograms(): Promise<StartupProgram[]> {
    const resp = await restClient.get('/api/career-services/startups');
    return resp.data?.programs || [];
}
