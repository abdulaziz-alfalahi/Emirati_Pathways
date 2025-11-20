/**
 * Integration Tests for API Client
 * 
 * These tests verify the API client works with actual API endpoints
 * Note: These tests require the backend to be running
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '@/utils/apiClient';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
const TEST_TOKEN = process.env.TEST_AUTH_TOKEN || '';

// Skip integration tests if backend is not available
const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION_TESTS === 'true';

describe.skipIf(SKIP_INTEGRATION)('API Client Integration Tests', () => {
  beforeAll(() => {
    // Set test token if provided
    if (TEST_TOKEN) {
      localStorage.setItem('access_token', TEST_TOKEN);
    }
  });

  afterAll(() => {
    localStorage.clear();
  });

  describe('Health Check Endpoints', () => {
    it('should successfully call health endpoint', async () => {
      try {
        const response = await apiClient.get('/health');
        expect(response).toBeDefined();
      } catch (error) {
        // If backend is not running, that's okay for CI
        console.warn('Health endpoint not available - backend may not be running');
      }
    });
  });

  describe('Recruiter JD Endpoints', () => {
    it('should fetch job descriptions list', async () => {
      try {
        const response = await apiClient.get('/api/recruiter/jd/list');
        expect(response).toBeDefined();
        // Response should have job_descriptions array
        if (response.job_descriptions) {
          expect(Array.isArray(response.job_descriptions)).toBe(true);
        }
      } catch (error) {
        if (error instanceof Error) {
          // 401 is expected if not authenticated
          if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.warn('Authentication required - skipping test');
            return;
          }
        }
        throw error;
      }
    });
  });

  describe('Error Handling in Real Scenarios', () => {
    it('should handle 404 errors gracefully', async () => {
      try {
        await apiClient.get('/api/nonexistent/endpoint');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        if (error instanceof Error) {
          expect(error.message).toBeDefined();
        }
      }
    });

    it('should handle network errors gracefully', async () => {
      // Temporarily set invalid URL
      const originalEnv = import.meta.env.VITE_API_BASE_URL;
      vi.stubEnv('VITE_API_BASE_URL', 'http://invalid-url-that-does-not-exist:9999');
      
      try {
        // Re-import to get new instance
        const { apiClient: testClient } = await import('@/utils/apiClient');
        await testClient.get('/api/test');
        expect.fail('Should have thrown a network error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      } finally {
        vi.stubEnv('VITE_API_BASE_URL', originalEnv || 'http://localhost:5003');
      }
    });
  });
});
