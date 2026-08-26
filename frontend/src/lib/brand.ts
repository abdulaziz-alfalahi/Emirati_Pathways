/**
 * The platform's name, in one place.
 *
 * WHY THIS FILE EXISTS
 *
 * The name was written out by hand wherever it appeared, and it drifted. On
 * 2026-08-26 the landing page alone carried three different Arabic names:
 *
 *   منصة رحلة المورد البشري الإماراتي     (the footer)
 *   منصة تنمية الموارد البشرية الإماراتية  (the invitation email)
 *   منصة "إماراتي" للتنمية البشرية        (the correct one)
 *
 * A platform that cannot spell its own name consistently is not a cosmetic
 * problem when the name is the first thing a candidate sees in an email from a
 * government body they have never heard from before.
 *
 * THE QUOTES ARE PART OF THE NAME. "Emirati" / "إماراتي" is the product name
 * being quoted inside the descriptive title — it is not emphasis and not a
 * typo, and it must survive translation, truncation and copy-editing.
 */

/** English: "Emirati" Human Development Platform */
export const PLATFORM_NAME_EN = '"Emirati" Human Development Platform';

/** Arabic: منصة "إماراتي" للتنمية البشرية */
export const PLATFORM_NAME_AR = 'منصة "إماراتي" للتنمية البشرية';

/** Pick the name for the language currently on screen. */
export const platformName = (language: string): string =>
    language === 'ar' ? PLATFORM_NAME_AR : PLATFORM_NAME_EN;

/**
 * The Council is a different body from the platform it runs, and its name is
 * NOT being renamed here — only the platform's was. Kept alongside so the two
 * are not confused again by someone updating one of them.
 */
export const COUNCIL_NAME_EN = 'Emirati Human Development Council';
export const COUNCIL_NAME_AR = 'مجلس تنمية الموارد البشرية الإماراتية';
