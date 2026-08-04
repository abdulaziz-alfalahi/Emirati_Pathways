/**
 * Canonical auth token accessor.
 * Reads from 'access_token' (primary) with legacy fallbacks.
 */
export function getAuthToken(): string | null {
    return localStorage.getItem('access_token')
        || localStorage.getItem('accessToken')
        || localStorage.getItem('auth_token')
        || localStorage.getItem('token');
}

/** True when the browser holds a cookie session (the CSRF cookie is set
 *  alongside the auth cookies). */
export function hasCookieSession(): boolean {
    try {
        return typeof document !== 'undefined'
            && document.cookie.split('; ').some(c => c.startsWith('csrf_access_token='));
    } catch {
        return false;
    }
}

export function getAuthHeaders(): Record<string, string> {
    // A cookie session is authoritative. Sending a stale localStorage bearer
    // alongside it made the backend reject the request as 'Invalid token'
    // WITHOUT falling back to the valid cookie — which knocked users out of
    // job details, privacy settings and the interview join button
    // (fb_1785825540, fb_1785828743, fb_1785829470, fb_1785830436).
    const token = hasCookieSession() ? null : getAuthToken();
    return token
        ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };
}

export function clearAuthTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
}

export function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}
