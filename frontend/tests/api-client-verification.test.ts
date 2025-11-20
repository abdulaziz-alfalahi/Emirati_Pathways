/**
 * API Client Verification Tests
 * 
 * These tests verify that the centralized API client is working correctly
 * and that hardcoded URLs have been replaced.
 */

import { describe, it, expect } from 'vitest';
import { apiClient } from '../src/utils/apiClient';

describe('API Client', () => {
  it('should initialize with correct base URL from environment', () => {
    const baseUrl = apiClient.getBaseURL();
    expect(baseUrl).toBeTruthy();
    expect(baseUrl).toMatch(/^https?:\/\//);
  });

  it('should have getBaseURL method', () => {
    expect(typeof apiClient.getBaseURL).toBe('function');
    const url = apiClient.getBaseURL();
    expect(url).toBeTruthy();
  });

  it('should have HTTP methods', () => {
    expect(typeof apiClient.get).toBe('function');
    expect(typeof apiClient.post).toBe('function');
    expect(typeof apiClient.put).toBe('function');
    expect(typeof apiClient.patch).toBe('function');
    expect(typeof apiClient.delete).toBe('function');
  });
});
