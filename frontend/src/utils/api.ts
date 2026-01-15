// src/utils/api.ts
import axios, { type AxiosInstance } from 'axios'
import type { CV } from '@/types/cv'

/**
 * Base URLs (configure via Vite env):
 *  - VITE_API_BASE_URL: your main backend (Node, Rails, etc.)
 *  - VITE_FLASK_API_URL: your Python/Flask microservice (for NLP/matching, etc.)
 */
const API_BASE_URL = ''; // Always use relative path to leverage Vite proxy
const FLASK_API_URL = ''; // Use proxy for flask as well
console.log('DEBUG: API_BASE_URL is relative (proxy enabled)');

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  url?: string
}

// --- Shared HTTP clients ---
export const restClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Add request interceptor to inject token
restClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('HR_TOKEN');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const flaskClient: AxiosInstance = axios.create({
  baseURL: FLASK_API_URL,
})

/** Normalizes axios responses to { success, data, url, error } */
const wrap = async <T,>(p: Promise<any>): Promise<ApiResponse<T>> => {
  try {
    const res = await p
    const raw = res?.data ?? res
    const success = raw?.success ?? true
    return {
      success: !!success,
      data: raw?.data ?? raw,
      url: raw?.url ?? raw?.download_url,
    }
  } catch (err: any) {
    const msg = err?.response?.data?.error ?? err?.message ?? 'Request failed'
    return { success: false, error: msg }
  }
}

// ---------- CV Builder API ----------
type TemplateMeta = {
  id: string
  name: string
  display_name?: string
  description?: string
  previewUrl?: string
}

export const cvBuilderApi = {
  create: (payload: { template: string; language: string; title: string }) =>
    wrap<CV>(restClient.post('/api/cv', payload)),

  update: (id: string, updates: Partial<CV>) =>
    wrap<CV>(restClient.patch(`/api/cv/${id}`, updates)),

  delete: (id: string) => wrap(restClient.delete(`/api/cv/${id}`)),

  duplicate: (payload: { id: string; title?: string }) =>
    wrap<CV>(restClient.post(`/api/cv/${payload.id}/duplicate`, { title: payload.title })),

  get: (id: string) => wrap<CV>(restClient.get(`/api/cv/${id}`)),

  list: () => wrap<CV[]>(restClient.get('/api/cv/list')),

  getTemplates: () =>
    wrap<TemplateMeta[]>(restClient.get('/api/cv/templates')),

  export: (payload: { id: string; format: 'pdf' | 'docx' | 'json' }) =>
    wrap<{ url: string }>(
      restClient.post(`/api/cv/${payload.id}/export`, { format: payload.format })
    ),

  getAnalytics: (id: string) =>
    wrap(restClient.get(`/api/cv/${id}/analytics`)),
}

// ---------- Recruiter / Jobs API ----------
export interface JobDescription {
  id: string
  jd_id?: string
  title: string
  description: string
  company: string
  location: string
  employment_type: string
  requirements?: any
  skills?: string[]
  parsing_metadata?: {
    confidence_score?: number
    language_detected?: string
    processing_time?: number
    successful_sections?: number
    total_sections?: number
  }
  metadata?: {
    parsing_metadata?: {
      confidence_score?: number
    }
  }
  responsibilities?: string[]
  benefits?: string[]
  work_mode?: string
  createdAt?: string
  updatedAt?: string
}

export const jobApi = {
  list: () => wrap<{ job_descriptions: JobDescription[] }>(restClient.get('/api/recruiter/jd/list')),
  get: (id: string) => wrap<JobDescription>(restClient.get(`/api/jobs/${id}`)),
  create: (job: Omit<JobDescription, 'id' | 'createdAt' | 'updatedAt'>) =>
    wrap<JobDescription>(restClient.post('/api/jobs', job)),
  update: (id: string, job: Partial<JobDescription>) =>
    wrap<JobDescription>(restClient.patch(`/api/jobs/${id}`, job)),
  remove: (id: string) => wrap(restClient.delete(`/api/jobs/${id}`)),
  delete: (id: string) => wrap<{ success: boolean; message: string }>(restClient.delete(`/api/recruiter/jd/${id}`)),
  parse: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return wrap<{
      completeness_score: number;
      data: JobDescription;
    }>(restClient.post('/api/recruiter/jd/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }));
  },
  parseText: (text: string) => wrap<{
    completeness_score: number;
    data: JobDescription;
  }>(restClient.post('/api/recruiter/jd/parse-text', { text })),
}

// ---------- Shortlist API ----------
export const shortlistApi = {
  add: (data: {
    jd_id: string;
    candidate_id: string;
    recruiter_id: string;
    match_score?: number;
    match_details?: any;
    notes?: string;
  }) => wrap<{ success: boolean; shortlist_id: string; message: string }>(restClient.post('/api/recruiter/jd/shortlist/add', data)),

  get: (jdId: string) => wrap<Array<{
    candidate_id: string;
    status: string;
    match_score: number;
    notes?: string;
  }>>(restClient.get(`/api/recruiter/jd/shortlist/${jdId}`)),
}

// ---------- Health API ----------
export const healthApi = {
  status: () => wrap<{ status: 'ok' | 'error'; message?: string }>(restClient.get('/health')),
  flask: () => wrap<{ status: 'ok' | 'error'; message?: string }>(flaskClient.get('/health')),
  check: () => wrap<{ features: { jd_parsing: boolean } }>(restClient.get('/health')),
}

// Re-exports (handy for consumers)
export type { CV }
