/**
 * Where to send someone once they finish signing in.
 *
 * WHY THIS IS A MODULE AND NOT TWO CALLS TO STORAGE
 * The venue QR flow already shipped broken in exactly that shape: the check-in
 * page wrote sessionStorage['post_login_redirect'] and *nothing anywhere read
 * it*. Sign-in succeeded, the user landed on a dashboard, and a candidate
 * standing in a queue at the mall never got their number. A key written in one
 * file and read in another is a contract with nobody holding it; this module is
 * the holder.
 *
 * localStorage, not sessionStorage: UAE Pass can hand control to its mobile app
 * and return in a DIFFERENT TAB, which starts with an empty sessionStorage. The
 * one flow this exists for is the one most likely to be completed on a phone.
 *
 * The trade localStorage makes is that a forgotten value outlives its purpose,
 * so every entry carries a timestamp and is ignored once stale. A stored path
 * is a note about what someone was doing minutes ago, not a standing
 * instruction — without the expiry, signing in next week could drop them back
 * at a check-in page for an event that has been and gone.
 */

const KEY = 'post_login_redirect';

/** Long enough to survive a slow UAE Pass round trip on mall wifi; far short of
 *  the next visit. */
const MAX_AGE_MS = 30 * 60 * 1000;

/** Internal absolute paths only. '//evil.example' and 'https://evil.example'
 *  are rejected, so this can never turn our sign-in into an open redirect. */
const isInternalPath = (p: unknown): p is string =>
  typeof p === 'string' && /^\/(?!\/)/.test(p);

export const setPendingRedirect = (path: string): void => {
  if (!isInternalPath(path)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {
    /* Private mode or a full quota. Losing the destination degrades to landing
       on the dashboard — it must never break the sign-in itself. */
  }
};

/** The pending path, or null if there is none, it is stale, or it is unsafe.
 *  Reading does not consume it: the caller clears it once it has navigated. */
export const readPendingRedirect = (): string | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (!isInternalPath(path)) { clearPendingRedirect(); return null; }
    if (typeof at !== 'number' || Date.now() - at > MAX_AGE_MS) {
      clearPendingRedirect();
      return null;
    }
    return path;
  } catch {
    // Unparseable (including anything left by the previous sessionStorage
    // version of this key) — drop it rather than reasoning about it.
    clearPendingRedirect();
    return null;
  }
};

export const clearPendingRedirect = (): void => {
  try { localStorage.removeItem(KEY); } catch { /* nothing we can do */ }
};
