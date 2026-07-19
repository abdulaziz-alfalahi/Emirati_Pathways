import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock tokenUtils before importing apiClient so the interceptor picks up the mock
vi.mock('@/utils/tokenUtils', () => ({
  getAuthToken: vi.fn(() => null),
  getAuthHeaders: vi.fn(() => ({})),
  clearAuthTokens: vi.fn(),
  getCookie: vi.fn(() => null),
}));

import apiClient from '@/services/apiClient';
import { getAuthToken } from '@/utils/tokenUtils';

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('is an axios instance with correct baseURL ending in /api', () => {
    // The baseURL is built from VITE_API_BASE_URL (empty in test) + '/api'
    expect(apiClient.defaults.baseURL).toBe('/api');
  });

  test('has Content-Type application/json header by default', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  test('request interceptor attaches Authorization header when token exists', async () => {
    vi.mocked(getAuthToken).mockReturnValue('test-token-123');

    // Run the request interceptor by calling apiClient.interceptors.request handlers
    // We can test the interceptor indirectly by inspecting a request config
    const config = await apiClient.interceptors.request.handlers[0].fulfilled({
      headers: {} as any,
    } as any);

    expect(config.headers.Authorization).toBe('Bearer test-token-123');
  });

  test('request interceptor does NOT attach Authorization header when no token', async () => {
    vi.mocked(getAuthToken).mockReturnValue(null);

    const config = await apiClient.interceptors.request.handlers[0].fulfilled({
      headers: {} as any,
    } as any);

    expect(config.headers.Authorization).toBeUndefined();
  });

  test('response interceptor passes through successful responses', async () => {
    const mockResponse = { data: { success: true }, status: 200 };

    const result = await apiClient.interceptors.response.handlers[0].fulfilled(
      mockResponse as any
    );

    expect(result).toBe(mockResponse);
  });

  test('response interceptor rejects errors', async () => {
    const mockError = {
      response: { status: 500 },
      message: 'Server Error',
    };

    await expect(
      apiClient.interceptors.response.handlers[0].rejected(mockError)
    ).rejects.toBe(mockError);
  });
});
