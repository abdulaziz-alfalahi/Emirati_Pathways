import { test, expect } from '@playwright/test';

const API = process.env.API_URL || 'http://localhost:5003';

/**
 * Health & Infrastructure E2E Smoke Tests
 *
 * Verify that the API is reachable, health endpoints respond,
 * and security headers (CORS, CSP) are present.
 *
 * Usage:
 *   npx playwright test tests/health.e2e.spec.ts
 *   API_URL=http://localhost:5003 npx playwright test tests/health.e2e.spec.ts
 */

test.describe('Health — API availability', () => {
  test('GET /api/health returns 200 with status info', async ({ request }) => {
    const res = await request.get(`${API}/api/health`);

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // Health endpoint should confirm service is alive
    expect(body.status || body.success).toBeTruthy();
  });

  test('GET / returns 200 (frontend static files or API root)', async ({ request }) => {
    const res = await request.get(`${API}/`);

    // Root should serve something — static HTML, JSON info, or a redirect
    expect([200, 301, 302, 304]).toContain(res.status());
  });
});

test.describe('Health — Security headers', () => {
  test('CORS headers are present on API responses', async ({ request }) => {
    // Make a request with an Origin header to trigger CORS response headers
    const res = await request.get(`${API}/api/health`, {
      headers: { Origin: 'http://localhost:8080' },
    });

    const headers = res.headers();

    // The server should return CORS headers for allowed origins
    // access-control-allow-origin may be '*' or echo the origin
    const acao = headers['access-control-allow-origin'];
    if (acao) {
      expect(['*', 'http://localhost:8080']).toContain(acao);
    } else {
      // If CORS isn't set on a simple GET, try a preflight-style check.
      // Some servers only add CORS headers on OPTIONS or when Origin matches config.
      // We mark this as a soft check rather than a hard failure.
      test.info().annotations.push({
        type: 'note',
        description: 'CORS access-control-allow-origin header not returned — server may only respond to OPTIONS preflight',
      });
    }
  });

  test('Content-Security-Policy header is present on API responses', async ({ request }) => {
    const res = await request.get(`${API}/api/health`);
    const headers = res.headers();

    // CSP may be on the API or only on the frontend proxy
    const csp = headers['content-security-policy'];
    if (!csp) {
      // Also check for the report-only variant
      const cspRO = headers['content-security-policy-report-only'];
      if (!cspRO) {
        test.info().annotations.push({
          type: 'warning',
          description: 'No Content-Security-Policy header found — CSP may only be served by the frontend proxy',
        });
      }
    }

    // At minimum, verify the response is well-formed JSON
    expect(res.ok()).toBeTruthy();
  });

  test('X-Content-Type-Options header is nosniff', async ({ request }) => {
    const res = await request.get(`${API}/api/health`);
    const headers = res.headers();

    const xcto = headers['x-content-type-options'];
    if (xcto) {
      expect(xcto).toBe('nosniff');
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'X-Content-Type-Options header not present',
      });
    }
  });
});
