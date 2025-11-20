/**
 * Centralized API Client
 * 
 * Provides a unified interface for making API requests with:
 * - Environment-based URL configuration
 * - Automatic authentication token handling
 * - Consistent error handling
 * - Support for both fetch and axios patterns
 */

// Get base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

// Check if mock tokens are allowed (development only)
const ALLOW_MOCK_TOKENS = import.meta.env.DEV || import.meta.env.VITE_ALLOW_MOCK_TOKENS === 'true';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Check if token is a mock token
 */
function isMockToken(token: string | null): boolean {
  return ALLOW_MOCK_TOKENS && token?.startsWith('mock_token_') === true;
}

/**
 * Handle 401 Unauthorized errors
 */
function handleUnauthorized(): void {
  // Clear all token variations
  localStorage.removeItem('access_token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('auth_token');
  
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/auth';
  }
}

/**
 * Handle API errors
 */
async function handleError(response: Response): Promise<never> {
  let errorData: any = {};
  
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      errorData = await response.json();
    } else {
      errorData = { message: response.statusText };
    }
  } catch {
    errorData = { message: response.statusText };
  }
  
  // Handle 401 - Unauthorized
  if (response.status === 401) {
    handleUnauthorized();
  }
  
  throw new ApiError(
    response.status,
    errorData.message || `API Error: ${response.statusText}`,
    errorData
  );
}

/**
 * Handle network errors
 */
function handleRequestError(error: unknown): Error {
  if (error instanceof ApiError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new Error(`Network error: ${error.message}`);
  }
  
  return new Error('Unknown error occurred');
}

/**
 * API Client Class
 */
class ApiClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = API_BASE_URL;
    
    // Warn if using default URL in production
    if (!import.meta.env.VITE_API_BASE_URL && import.meta.env.PROD) {
      console.warn('⚠️ VITE_API_BASE_URL not set - using default localhost:5003');
    }
  }
  
  /**
   * Get the base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
  
  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }
  
  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  /**
   * Make a PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
  
  /**
   * Core request method
   */
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = getAuthToken();
    const isMock = isMockToken(token);
    
    // Build URL
    const url = `${this.baseURL}${endpoint}`;
    
    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && !isMock ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options?.headers as HeadersInit || {}),
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      if (!response.ok) {
        await handleError(response);
      }
      
      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }
      
      // Parse response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      
      // Return text for non-JSON responses
      return await response.text() as any;
    } catch (error) {
      throw handleRequestError(error);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export default for convenience
export default apiClient;
