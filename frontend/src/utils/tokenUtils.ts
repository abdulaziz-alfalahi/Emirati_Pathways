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

export function getAuthHeaders(): Record<string, string> {
    const token = getAuthToken();
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
