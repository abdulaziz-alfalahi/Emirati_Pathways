import { test, expect } from '@playwright/test';

const API = process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:5003';

test.describe('Recruiter flow', () => {
  test('jobs → publish/match → shortlist → offers', async ({ page, request }) => {
    // Set token in localStorage
    const token = process.env.HR_TOKEN || ''; // pass via env when running
    await page.addInitScript((t) => {
      localStorage.setItem('HR_TOKEN', t as string);
    }, token);

    // Open candidates page and pick a job id via API
    const jobsRes = await request.get(`${API}/api/hr/jobs/?limit=1`, { headers: { Authorization: `Bearer ${token}` } });
    expect(jobsRes.ok()).toBeTruthy();
    const jobsJson = await jobsRes.json();
    const jobId = jobsJson.data.job_postings[0].id;

    // Publish & match via API
    const matchRes = await request.post(`${API}/api/hr/jobs/${jobId}/publish-and-match`, { headers: { Authorization: `Bearer ${token}` } });
    expect(matchRes.ok()).toBeTruthy();
    const matchJson = await matchRes.json();
    const first = matchJson.data.top_matches[0];

    // Shortlist via API
    const slRes = await request.post(`${API}/api/hr/jobs/${jobId}/shortlist`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { candidate_id: first.candidate_id, notes: 'e2e shortlist' },
    });
    expect(slRes.ok()).toBeTruthy();

    // Create offer via API
    const offerRes = await request.post(`${API}/api/hr/offers/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        job_posting_id: jobId,
        candidate_id: first.candidate_id,
        offer_data: { title: 'QA Engineer', salary: 15000, currency: 'AED' },
        send_now: false,
      },
    });
    expect(offerRes.ok()).toBeTruthy();

    // Verify Offers page loads
    await page.goto('/recruiter/offers');
    await expect(page.locator('text=Offers')).toBeVisible();
  });
});
