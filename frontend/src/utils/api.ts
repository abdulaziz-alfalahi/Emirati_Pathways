// src/utils/api.ts
import axios, { type AxiosInstance } from 'axios'
import type { CV } from '@/types/cv'
import { getAuthToken, clearAuthTokens, getCookie } from '@/utils/tokenUtils'

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

// Add request interceptor to inject token and CSRF token
restClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && token !== 'cookie_authenticated') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Ensure no legacy/inline headers send the placeholder or null/undefined values
  if (config.headers.Authorization) {
    const authHeader = String(config.headers.Authorization);
    if (authHeader.includes('cookie_authenticated') || authHeader.includes('null') || authHeader.includes('undefined')) {
      delete config.headers.Authorization;
    }
  }
  // Add CSRF Token if present in cookies
  const csrfToken = getCookie('csrf_access_token');
  if (csrfToken) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for 401 handling
restClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        // Cookie-based sessions (UAE Pass) have no refresh token. A single 401
        // (often a stray call still using the 'cookie_authenticated' placeholder)
        // must NOT clear auth and bounce to /auth — the httpOnly cookie stays the
        // source of truth. Fail just this request and let the caller handle it.
        if (!refreshToken) {
          // Cookie session (UAE Pass): the refresh token lives in an httpOnly
          // cookie. Refresh via cookie + CSRF header, then retry the request.
          // Never force-logout on failure (the request just fails).
          try {
            const csrf = getCookie('csrf_refresh_token');
            await axios.post(
              `${API_BASE_URL}/api/auth/refresh`,
              {},
              { withCredentials: true, headers: csrf ? { 'X-CSRF-TOKEN': csrf } : {} }
            );
            return restClient(originalRequest);
          } catch (cookieRefreshError) {
            return Promise.reject(error);
          }
        }

        // Perform refresh using a fresh axios instance to avoid interceptors
        // We assume the refresh endpoint is at /api/auth/refresh
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` }
          }
        );

        if (refreshResponse.data?.success && refreshResponse.data?.data?.access_token) {
          const newAccessToken = refreshResponse.data.data.access_token;

          // Update storage
          localStorage.setItem('access_token', newAccessToken);

          // Update header for the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // If we got a new user object, update that too (optional but good)
          if (refreshResponse.data.data.user) {
            localStorage.setItem('user', JSON.stringify(refreshResponse.data.data.user));
          }

          // Return the original request with new token
          return restClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear auth and redirect
        clearAuthTokens();
        localStorage.removeItem('user');

        // Dispatch storage event so other tabs/components know
        window.dispatchEvent(new Event('storage'));

        // Hard redirect to auth if needed, or let the app handle the 401
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

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
