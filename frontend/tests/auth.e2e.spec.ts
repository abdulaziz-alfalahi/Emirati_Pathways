import { test, expect } from '@playwright/test';

const API = process.env.API_URL || 'http://localhost:5003';

/**
 * Auth API E2E Smoke Tests
 *
 * Verify authentication endpoints respond correctly.
 * These tests hit the backend API directly using Playwright's request fixture.
 *
 * Usage:
 *   npx playwright test tests/auth.e2e.spec.ts
 *   API_URL=http://localhost:5003 npx playwright test tests/auth.e2e.spec.ts
 */

test.describe('Auth API — UAE Pass Login', () => {
  test('GET /api/auth/uaepass/login returns authorization_url or expected error', async ({ request }) => {
    const res = await request.get(`${API}/api/auth/uaepass/login`);

    // If OAuth is configured, we expect a redirect URL; otherwise a 500 with a message
    if (res.ok()) {
      const body = await res.json();
      expect(body).toHaveProperty('authorization_url');
      expect(body.authorization_url).toContain('http');
    } else {
      // Server may return 500 if UAE Pass OAuth is not configured
      expect([500, 503]).toContain(res.status());
    }
  });
});

test.describe('Auth API — Dev Login', () => {
  test('POST /api/auth/uaepass/dev-login with valid EID format returns user data or 404', async ({ request }) => {
    // Valid UAE EID format: 784-YYYY-NNNNNNN-C (15 digits)
    const validEid = '784-1990-1234567-1';

    const res = await request.post(`${API}/api/auth/uaepass/dev-login`, {
      headers: { 'Content-Type': 'application/json' },
      data: { emirates_id: validEid },
    });

    // Either the user exists (200) or doesn't (404) — both are valid responses
    if (res.ok()) {
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeTruthy();
      // Should contain token or user info
      expect(body.data.token || body.data.user).toBeTruthy();
    } else {
      // User not found is acceptable for a smoke test
      expect([404, 403]).toContain(res.status());
    }
  });

  test('POST /api/auth/uaepass/dev-login with invalid EID returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/uaepass/dev-login`, {
      headers: { 'Content-Type': 'application/json' },
      data: { emirates_id: 'not-a-valid-eid' },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBeTruthy();
  });

  test('POST /api/auth/uaepass/dev-login with empty body returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/uaepass/dev-login`, {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});

test.describe('Auth API — Profile (unauthenticated)', () => {
  test('GET /api/auth/profile without token returns 401 or 422', async ({ request }) => {
    const res = await request.get(`${API}/api/auth/profile`);

    // Without a Bearer token the server must reject the request
    expect([401, 422, 403]).toContain(res.status());
    const body = await res.json();
    expect(body.success === false || body.detail).toBeTruthy();
  });
});
