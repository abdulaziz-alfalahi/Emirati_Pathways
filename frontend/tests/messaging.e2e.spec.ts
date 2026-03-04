import { test, expect } from '@playwright/test';

const API = 'http://localhost:5003';

/**
 * Messaging E2E Tests
 *
 * These tests verify the core messaging flows:
 * 1. Send a message → verify 201 / correct content
 * 2. Notification created for recipient
 * 3. Notification click → opens conversation with message visible
 *
 * Usage:
 *   HR_TOKEN=<recruiter_jwt> CANDIDATE_TOKEN=<candidate_jwt> npx playwright test tests/messaging.e2e.spec.ts
 */

const recruiterToken = () => process.env.HR_TOKEN || '';
const candidateToken = () => process.env.CANDIDATE_TOKEN || '';

test.describe('Messaging flow', () => {
    let conversationId: string;
    let recipientId: string;

    test('1 — send a message and receive 201', async ({ request }) => {
        const token = recruiterToken();
        test.skip(!token, 'HR_TOKEN env var required');

        // Find a candidate to message (first user with candidate role)
        const usersRes = await request.get(`${API}/api/admin/users?per_page=5&role=candidate`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(usersRes.ok()).toBeTruthy();
        const usersJson = await usersRes.json();
        const candidates = usersJson?.data?.users || usersJson?.users || [];
        expect(candidates.length).toBeGreaterThan(0);
        recipientId = String(candidates[0].id);

        // Create conversation
        const convRes = await request.post(`${API}/api/communication/conversations`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            data: {
                participants: [recipientId],
                title: 'E2E Test Conversation',
            },
        });
        expect(convRes.ok()).toBeTruthy();
        const convJson = await convRes.json();
        conversationId = convJson.data?.id || convJson.data?.conversation_id;
        expect(conversationId).toBeTruthy();

        // Send message
        const msgRes = await request.post(`${API}/api/communication/messages`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            data: {
                recipient_id: recipientId,
                conversation_id: conversationId,
                content: 'Hello from E2E test!',
                message_type: 'text',
            },
        });
        expect(msgRes.status()).toBe(201);
        const msgJson = await msgRes.json();
        expect(msgJson.success).toBe(true);
        expect(msgJson.data.content).toBe('Hello from E2E test!');
    });

    test('2 — notification created for recipient', async ({ request }) => {
        const token = candidateToken();
        test.skip(!token || !recipientId, 'CANDIDATE_TOKEN and prior test required');

        const notifRes = await request.get(`${API}/api/communication/notifications?limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(notifRes.ok()).toBeTruthy();
        const notifJson = await notifRes.json();
        const notifications = notifJson.data?.notifications || [];

        // Find a new_message notification for our conversation
        const match = notifications.find(
            (n: any) =>
                n.notification_type === 'new_message' &&
                n.metadata?.conversation_id === conversationId
        );
        expect(match).toBeTruthy();
    });

    test('3 — opening conversation URL shows the message', async ({ page }) => {
        const token = recruiterToken();
        test.skip(!token || !conversationId, 'HR_TOKEN and prior test required');

        // Inject auth token into localStorage
        await page.addInitScript((t) => {
            localStorage.setItem('token', t as string);
            localStorage.setItem('HR_TOKEN', t as string);
        }, token);

        // Navigate to messages with conversationId query param
        await page.goto(`/recruiter?tab=messages&conversationId=${conversationId}`);

        // Wait for the message thread to render and verify our message is visible
        await expect(page.locator('text=Hello from E2E test!')).toBeVisible({ timeout: 15000 });
    });

    test('4 — XSS content is sanitized', async ({ request }) => {
        const token = recruiterToken();
        test.skip(!token || !conversationId, 'HR_TOKEN and prior test required');

        const msgRes = await request.post(`${API}/api/communication/messages`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            data: {
                recipient_id: recipientId,
                conversation_id: conversationId,
                content: '<script>alert("xss")</script>Hello safe text',
                message_type: 'text',
            },
        });
        expect(msgRes.status()).toBe(201);
        const msgJson = await msgRes.json();
        // Script tag should be stripped, leaving only the safe text
        expect(msgJson.data.content).not.toContain('<script>');
        expect(msgJson.data.content).toContain('Hello safe text');
    });

    test('5 — rate limiting returns 429 after 10 rapid messages', async ({ request }) => {
        const token = recruiterToken();
        test.skip(!token || !conversationId, 'HR_TOKEN and prior test required');

        let hitRateLimit = false;
        for (let i = 0; i < 12; i++) {
            const res = await request.post(`${API}/api/communication/messages`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                data: {
                    recipient_id: recipientId,
                    conversation_id: conversationId,
                    content: `Rate limit test ${i}`,
                    message_type: 'text',
                },
            });
            if (res.status() === 429) {
                hitRateLimit = true;
                const body = await res.json();
                expect(body.message).toContain('Too many messages');
                break;
            }
        }
        expect(hitRateLimit).toBe(true);
    });
});
