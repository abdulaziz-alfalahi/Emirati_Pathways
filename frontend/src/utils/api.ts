// src/utils/api.ts
import axios, { type AxiosInstance } from 'axios'
import type { CV } from '@/types/cv'

/**
 * Base URLs (configure via Vite env):
 *  - VITE_API_BASE_URL: your main backend (Node, Rails, etc.)
 *  - VITE_FLASK_API_URL: your Python/Flask microservice (for NLP/matching, etc.)
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003'
const FLASK_API_URL =
  import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5003'

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
} )

export const flaskClient: AxiosInstance = axios.create({
  baseURL: FLASK_API_URL,
})

/** Normalizes axios responses to { success, data, url, error } */
const wrap = async <T>(p: Promise<any>): Promise<ApiResponse<T>> => {
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
  title: string
  description: string
  skills?: string[]
  createdAt?: string
  updatedAt?: string
}

export const jobApi = {
  list: () => wrap<JobDescription[]>(restClient.get('/api/jobs')),
  get: (id: string) => wrap<JobDescription>(restClient.get(`/api/jobs/${id}`)),
  create: (job: Omit<JobDescription, 'id' | 'createdAt' | 'updatedAt'>) =>
    wrap<JobDescription>(restClient.post('/api/jobs', job)),
  update: (id: string, job: Partial<JobDescription>) =>
    wrap<JobDescription>(restClient.patch(`/api/jobs/${id}`, job)),
  remove: (id: string) => wrap(restClient.delete(`/api/jobs/${id}`)),
}

// ---------- Health API ----------
export const healthApi = {
  status: () => wrap<{ status: 'ok' | 'error'; message?: string }>(restClient.get('/health')),
  flask: () => wrap<{ status: 'ok' | 'error'; message?: string }>(flaskClient.get('/health')),
}

// Re-exports (handy for consumers)
export type { CV }
