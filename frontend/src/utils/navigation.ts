/**
 * Centralized navigation helpers for role-based routing.
 */

/** Dashboard messaging tab paths by role */
const ROLE_MESSAGING_ROUTES: Record<string, string> = {
    administrator: '/admin-dashboard?tab=messaging',
    recruiter: '/recruiter?tab=messages',
    hr_manager: '/hr-dashboard?tab=messages',
    candidate: '/candidate-dashboard?tab=messages',
    job_seeker: '/candidate-dashboard?tab=messages',
    mentor: '/mentor-dashboard?tab=messages',
    educator: '/educator-dashboard?tab=messages',
    assessor: '/assessor-dashboard?tab=messages',
    growth_operator: '/growth-operator?tab=messages',
};

/**
 * Returns the correct dashboard messaging tab URL for a given user role.
 *
 * @param role  - The user's role string (e.g. 'recruiter', 'candidate')
 * @param params - Optional query params to append (e.g. { conversationId: '123' })
 * @returns      A URL string like `/recruiter?tab=messages&conversationId=123`
 */
export function getMessagingPath(role: string, params?: Record<string, string>): string {
    const base = ROLE_MESSAGING_ROUTES[role] || '/candidate-dashboard?tab=messages';
    if (!params || Object.keys(params).length === 0) return base;

    const extra = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
    return `${base}&${extra}`;
}

// ─── Notification‑type → dashboard routes by role ──────────────────────

const ROLE_APPLICATION_ROUTES: Record<string, string> = {
    recruiter: '/recruiter/jobs',
    hr_recruiter: '/recruiter/jobs',
    hr_manager: '/hr-dashboard?tab=positions',
    hr: '/hr-dashboard?tab=positions',
    candidate: '/candidate-dashboard?tab=applications',
    job_seeker: '/candidate-dashboard?tab=applications',
};

const ROLE_INTERVIEW_ROUTES: Record<string, string> = {
    recruiter: '/recruiter/interviews/details',
    hr_recruiter: '/recruiter/interviews/details',
    hr_manager: '/hr-dashboard?tab=interviews',
    hr: '/hr-dashboard?tab=interviews',
    candidate: '/candidate-dashboard?tab=interviews',
    job_seeker: '/candidate-dashboard?tab=interviews',
};

const ROLE_OFFER_ROUTES: Record<string, string> = {
    recruiter: '/recruiter?tab=offers',
    hr_recruiter: '/recruiter?tab=offers',
    hr_manager: '/hr-dashboard?tab=offers',
    hr: '/hr-dashboard?tab=offers',
    candidate: '/candidate-dashboard?tab=applications',
    job_seeker: '/candidate-dashboard?tab=applications',
};

/**
 * Returns the correct route for any notification type + user role.
 * Use this everywhere instead of duplicated if/else chains.
 *
 * @param notificationType  e.g. 'new_message', 'application_update', 'interview_scheduled'
 * @param userRole          e.g. 'recruiter', 'candidate', 'administrator'
 * @param metadata          Optional extra data (e.g. { conversation_id: '...' })
 * @param fallbackLink      Optional link from the notification itself
 */
export function getNotificationRoute(
    notificationType: string | undefined,
    userRole: string,
    metadata?: Record<string, any>,
    fallbackLink?: string
): string | null {
    switch (notificationType) {
        case 'new_message': {
            const convId = metadata?.conversation_id;
            return convId
                ? getMessagingPath(userRole, { conversationId: convId })
                : getMessagingPath(userRole);
        }
        case 'application_update':
            return ROLE_APPLICATION_ROUTES[userRole] || '/dashboard#applications';
        case 'interview_scheduled':
            return ROLE_INTERVIEW_ROUTES[userRole] || '/candidate-dashboard?tab=interviews';
        case 'offer_negotiation':
        case 'offer_accepted':
        case 'offer_declined':
            return ROLE_OFFER_ROUTES[userRole] || '/recruiter?tab=offers';
        default:
            return fallbackLink || null;
    }
}
