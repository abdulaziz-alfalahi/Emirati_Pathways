/**
 * The dev server must forward client identity to the backend.
 *
 * Staging does not serve through the nginx container — it runs the Vite dev
 * server, whose proxy forwarded no headers at all. The backend therefore saw
 * the Docker bridge address for every request, and the PII read audit trail
 * recorded `172.18.0.1` as the actor on every row: a trail that identifies
 * nobody.
 *
 * That is a silent failure. Nothing errors, the rows are written, and the
 * problem only surfaces when someone tries to use the trail — which is the
 * moment it is least recoverable. It was caught within a day only because
 * pii_access_log records WHICH header the address came from.
 *
 * These tests read the config as text rather than importing it: vite.config.ts
 * pulls in plugins that are not resolvable in the test environment, and the
 * question here is what the file declares, not what Vite does with it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const config = readFileSync(resolve(__dirname, '../../vite.config.ts'), 'utf-8');

/** Each `'/path': { ... }` proxy entry, as raw text. */
function proxyEntries(): { path: string; body: string }[] {
  const proxyBlock = config.split('proxy: {')[1];
  const matches = [...proxyBlock.matchAll(/'(\/[a-z.]+)':\s*\{([^}]*)\}/g)];
  return matches.map(m => ({ path: m[1], body: m[2] }));
}

describe('vite dev proxy forwarding', () => {
  it('has proxy entries to inspect', () => {
    expect(proxyEntries().length).toBeGreaterThan(0);
  });

  it('forwards client headers on every route that reaches the backend', () => {
    const backend = proxyEntries().filter(e => e.body.includes('5005'));
    expect(backend.length).toBeGreaterThan(0);
    for (const entry of backend) {
      expect(entry.body, `${entry.path} must set xfwd so the backend sees the real client`)
        .toMatch(/xfwd:\s*true/);
    }
  });

  it('does not bother forwarding to the media server', () => {
    // LiveKit signalling carries no audited action and no actor to attribute,
    // so forwarding there would be noise rather than a fix.
    const media = proxyEntries().filter(e => e.body.includes('7880'));
    expect(media.length).toBeGreaterThan(0);
    for (const entry of media) {
      expect(entry.body).not.toMatch(/xfwd:\s*true/);
    }
  });

  it('explains why, so the option is not tidied away as redundant', () => {
    // `changeOrigin` already looks like it deals with proxy headers, which is
    // exactly the misreading that would make someone delete this.
    expect(config).toMatch(/X-Forwarded-For/);
  });
});
