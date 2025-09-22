
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityUtils, AdvancedRateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security';

describe('SecurityUtils', () => {
  describe('detectSuspiciousInput', () => {
    it('should detect SQL injection patterns', () => {
      const maliciousInput = "'; DROP TABLE users; --";
      const result = SecurityUtils.detectSuspiciousInput(maliciousInput);
      
      expect(result.suspicious).toBe(true);
      expect(result.reasons).toContain('Potential SQL injection');
    });

    it('should detect XSS patterns', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const result = SecurityUtils.detectSuspiciousInput(maliciousInput);
      
      expect(result.suspicious).toBe(true);
      expect(result.reasons).toContain('Potential XSS attempt');
    });

    it('should detect path traversal patterns', () => {
      const maliciousInput = '../../../etc/passwd';
      const result = SecurityUtils.detectSuspiciousInput(maliciousInput);
      
      expect(result.suspicious).toBe(true);
      expect(result.reasons).toContain('Path traversal attempt');
    });

    it('should allow safe input', () => {
      const safeInput = 'This is a normal message';
      const result = SecurityUtils.detectSuspiciousInput(safeInput);
      
      expect(result.suspicious).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate tokens of specified length', () => {
      const token = SecurityUtils.generateSecureToken(16);
      expect(token).toHaveLength(16);
    });

    it('should generate different tokens each time', () => {
      const token1 = SecurityUtils.generateSecureToken();
      const token2 = SecurityUtils.generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashForLogging', () => {
    it('should hash sensitive data for safe logging', () => {
      const sensitiveData = 'user@example.com';
      const hashed = SecurityUtils.hashForLogging(sensitiveData);
      
      expect(hashed).not.toBe(sensitiveData);
      expect(hashed).toMatch(/^[A-Za-z0-9+/]+\.\.\.$/);
    });
  });
});

describe('AdvancedRateLimiter', () => {
  let rateLimiter: AdvancedRateLimiter;

  beforeEach(() => {
    rateLimiter = new AdvancedRateLimiter({
      windowMs: 60000, // 1 minute
      maxAttempts: 3,
      blockDurationMs: 300000 // 5 minutes
    });
  });

  it('should allow requests within limit', async () => {
    const result = await rateLimiter.checkLimit('test-user', '192.168.1.1');
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.requiresCaptcha).toBe(false);
  });

  it('should block requests exceeding limit', async () => {
    // Make requests up to the limit
    await rateLimiter.checkLimit('test-user', '192.168.1.1');
    await rateLimiter.checkLimit('test-user', '192.168.1.1');
    await rateLimiter.checkLimit('test-user', '192.168.1.1');
    
    // This should be blocked
    const result = await rateLimiter.checkLimit('test-user', '192.168.1.1');
    
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.requiresCaptcha).toBe(true);
  });

  it('should require CAPTCHA near limit', async () => {
    // Make requests near the limit (70% threshold)
    await rateLimiter.checkLimit('test-user', '192.168.1.1');
    await rateLimiter.checkLimit('test-user', '192.168.1.1');
    
    const result = await rateLimiter.checkLimit('test-user', '192.168.1.1');
    
    expect(result.requiresCaptcha).toBe(true);
  });

  it('should reset rate limit', async () => {
    // Exhaust the limit
    await rateLimiter.checkLimit('test-user', '192.168.1.1');
    await rateLimiter.checkLimit('test-user', '192.168.1.1');
    await rateLimiter.checkLimit('test-user', '192.168.1.1');
    await rateLimiter.checkLimit('test-user', '192.168.1.1');
    
    // Reset and try again
    rateLimiter.reset('test-user', '192.168.1.1');
    const result = await rateLimiter.checkLimit('test-user', '192.168.1.1');
    
    expect(result.allowed).toBe(true);
  });
});
