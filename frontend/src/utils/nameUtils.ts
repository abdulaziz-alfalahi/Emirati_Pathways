/**
 * Unified display name utility for consistent user name rendering.
 *
 * Prefers `display_name` (from backend), falls back to
 * `full_name`, then `first_name`/`last_name` concatenation,
 * then `name`, then `email`, then a fallback string.
 */

interface NameSource {
  display_name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  username?: string;
  // Prefixed variants (e.g. candidate_first_name)
  [key: string]: unknown;
}

/**
 * Extract a display name from any user-like object.
 *
 * @param obj    - An object containing name fields
 * @param fallback - Fallback string when no name can be derived (default: "User")
 * @returns The best available display name
 *
 * @example
 *   getDisplayName({ display_name: "Ahmed Al Maktoum" })         // "Ahmed Al Maktoum"
 *   getDisplayName({ first_name: "Ahmed", last_name: "Al Maktoum" }) // "Ahmed Al Maktoum"
 *   getDisplayName({ email: "ahmed@example.com" })                // "ahmed@example.com"
 *   getDisplayName(null)                                          // "User"
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDisplayName(obj: Record<string, any> | null | undefined, fallback = 'User'): string {
  if (!obj) return fallback;

  // 1. Prefer explicit display_name / displayName from backend
  if (obj.display_name && typeof obj.display_name === 'string' && obj.display_name.trim()) {
    return obj.display_name.trim();
  }
  if (obj.displayName && typeof obj.displayName === 'string' && obj.displayName.trim()) {
    return obj.displayName.trim();
  }

  // 2. full_name / fullName
  if (obj.full_name && typeof obj.full_name === 'string' && obj.full_name.trim()) {
    return obj.full_name.trim();
  }
  if (obj.fullName && typeof obj.fullName === 'string' && obj.fullName.trim()) {
    return obj.fullName.trim();
  }

  // 3. first_name + last_name (snake_case) concatenation
  const first = (obj.first_name && typeof obj.first_name === 'string') ? obj.first_name.trim() : '';
  const last = (obj.last_name && typeof obj.last_name === 'string') ? obj.last_name.trim() : '';
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;

  // 4. firstName + lastName (camelCase) concatenation
  const firstCamel = (obj.firstName && typeof obj.firstName === 'string') ? obj.firstName.trim() : '';
  const lastCamel = (obj.lastName && typeof obj.lastName === 'string') ? obj.lastName.trim() : '';
  const combinedCamel = `${firstCamel} ${lastCamel}`.trim();
  if (combinedCamel) return combinedCamel;

  // 5. Generic name field
  if (obj.name && typeof obj.name === 'string' && obj.name.trim()) {
    return obj.name.trim();
  }

  // 6. username
  if (obj.username && typeof obj.username === 'string' && obj.username.trim()) {
    return obj.username.trim();
  }

  // 7. email
  if (obj.email && typeof obj.email === 'string' && obj.email.trim()) {
    return obj.email.trim();
  }

  return fallback;
}

/**
 * Extract a prefixed display name (e.g. candidate_display_name, recruiter_first_name).
 *
 * @param obj    - Object with prefixed name fields
 * @param prefix - Prefix string, e.g. "candidate_" or "recruiter_"
 * @param fallback - Fallback string
 *
 * @example
 *   getPrefixedDisplayName(offer, 'candidate_')
 *   // checks: candidate_display_name → candidate_first_name + candidate_last_name → candidate_name
 */
export function getPrefixedDisplayName(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<string, any> | null | undefined,
  prefix: string,
  fallback = 'User'
): string {
  if (!obj) return fallback;

  // 1. Prefixed display_name
  const dn = obj[`${prefix}display_name`];
  if (dn && typeof dn === 'string' && dn.trim()) return dn.trim();

  // 2. Prefixed full_name
  const fn = obj[`${prefix}full_name`];
  if (fn && typeof fn === 'string' && fn.trim()) return fn.trim();

  // 3. Prefixed first_name + last_name
  const first = obj[`${prefix}first_name`];
  const last = obj[`${prefix}last_name`];
  const f = (first && typeof first === 'string') ? first.trim() : '';
  const l = (last && typeof last === 'string') ? last.trim() : '';
  const combined = `${f} ${l}`.trim();
  if (combined) return combined;

  // 4. Prefixed name (e.g. candidate_name, recruiter_name)
  const name = obj[`${prefix}name`] || obj[`${prefix.replace(/_$/, '')}_name`];
  if (name && typeof name === 'string' && name.trim()) return name.trim();

  // 5. Prefixed email
  const email = obj[`${prefix}email`];
  if (email && typeof email === 'string' && email.trim()) return email.trim();

  return fallback;
}
