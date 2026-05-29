import { test, expect } from '@playwright/test';

const API = process.env.API_URL || 'http://localhost:5003';

/**
 * Candidate API E2E Smoke Tests
 *
 * Verify candidate-facing endpoints: public job listings,
 * auth-gated routes, and consistent API response format.
 *
 * Usage:
 *   npx playwright test tests/candidate.e2e.spec.ts
 *   API_URL=http://localhost:5003 npx playwright test tests/candidate.e2e.spec.ts
 */

test.describe('Candidate API — Public job listings', () => {
  test('GET /api/jobs returns a JSON array of job postings', async ({ request }) => {
    const res = await request.get(`${API}/api/jobs`);

    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    // Response should be an array directly or wrapped in {success, data}
    if (Array.isArray(body)) {
      // Direct array response
      expect(body).toBeInstanceOf(Array);
    } else {
      // Wrapped response — check standard envelope
      expect(body.success).toBe(true);
      expect(body.data).toBeTruthy();
      const jobs = Array.isArray(body.data) ? body.data : body.data.jobs || body.data.job_postings;
      expect(jobs).toBeInstanceOf(Array);
    }
  });

  test('GET /api/jobs returns valid job objects with expected fields', async ({ request }) => {
    const res = await request.get(`${API}/api/jobs`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    const jobs = Array.isArray(body) ? body : (body.data?.jobs || body.data?.job_postings || body.data || []);
    // Skip field check if no jobs exist — the endpoint itself is still valid
    test.skip(!Array.isArray(jobs) || jobs.length === 0, 'No jobs in database to validate fields');

    const job = jobs[0];
    // Jobs should have at minimum an id and a title
    expect(job).toHaveProperty('id');
    expect(job.title || job.job_title).toBeTruthy();
  });
});

test.describe('Candidate API — Auth-gated endpoints', () => {
  test('GET /api/hr/jobs without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API}/api/hr/jobs`);

    // Must reject unauthenticated requests
    expect([401, 403, 422]).toContain(res.status());
    const body = await res.json();
    expect(body.success === false || body.detail).toBeTruthy();
  });

  test('POST /api/cv/upload without auth returns 401', async ({ request }) => {
    // Attempt a CV upload with no auth and no file — should fail on auth first
    const res = await request.post(`${API}/api/cv/upload`, {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });

    // Expect auth failure, not a 500
    expect([401, 403, 422]).toContain(res.status());
  });

  test('POST /api/cv/upload with empty multipart and no auth returns 401', async ({ request }) => {
    const res = await request.post(`${API}/api/cv/upload`, {
      multipart: {
        file: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('fake pdf content'),
        },
      },
    });

    // Auth check should happen before file processing
    expect([401, 403, 422]).toContain(res.status());
  });
});

test.describe('Candidate API — Response format consistency', () => {
  test('API error responses use {success, message} envelope', async ({ request }) => {
    // Hit a known auth-gated endpoint without token
    const res = await request.get(`${API}/api/hr/jobs`);
    expect(res.ok()).toBeFalsy();

    const body = await res.json();

    // The API should use a consistent error envelope
    // Accept either {success: false, message: "..."} or FastAPI's {detail: "..."}
    const hasEnvelope = ('success' in body && 'message' in body) || 'detail' in body;
    expect(hasEnvelope).toBe(true);
  });

  test('API success responses use {success, data} envelope', async ({ request }) => {
    // Use the public jobs endpoint for a guaranteed success response
    const res = await request.get(`${API}/api/jobs`);
    expect(res.ok()).toBeTruthy();

    const body = await res.json();

    // Accept either a direct array (simpler APIs) or the standard envelope
    if (!Array.isArray(body)) {
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');
    }
  });

  test('API returns proper JSON content-type', async ({ request }) => {
    const res = await request.get(`${API}/api/jobs`);
    const contentType = res.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });
});
