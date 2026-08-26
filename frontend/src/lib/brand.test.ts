/**
 * The platform's name must be the same everywhere it is written down.
 *
 * WHY THIS FILE EXISTS
 *
 * On 2026-08-26 the name was corrected in BilingualHomePage.tsx, and the
 * landing page went on rendering the old one. The component reads
 * `translations.whyChoose?.title || '<fallback>'`, the locale JSON supplies a
 * value, and so the fallback — the part that had been corrected — never ran.
 * Two of the three places on the page were still wrong, and the diff looked
 * complete.
 *
 * These tests read the locale files themselves, because that is where the
 * strings the user actually sees come from.
 */
import { describe, it, expect } from 'vitest';

import { PLATFORM_NAME_EN, PLATFORM_NAME_AR, platformName,
         COUNCIL_NAME_EN, COUNCIL_NAME_AR } from './brand';
import enHome from '../locales/en/home-complete.json';
import arHome from '../locales/ar/home-complete.json';

const en = enHome as Record<string, any>;
const ar = arHome as Record<string, any>;

/** Every Arabic name this platform has been called, that it no longer is. */
const SUPERSEDED_AR = [
    'منصة رحلة المورد البشري الإماراتي',
    'منصة تنمية الموارد البشرية الإماراتية',
];

describe('the platform name', () => {
    it('keeps its quotes — they are part of the name, not emphasis', () => {
        expect(PLATFORM_NAME_EN).toBe('"Emirati" Human Development Platform');
        expect(PLATFORM_NAME_AR).toBe('منصة "إماراتي" للتنمية البشرية');
    });

    it('follows the language on screen', () => {
        expect(platformName('ar')).toBe(PLATFORM_NAME_AR);
        expect(platformName('en')).toBe(PLATFORM_NAME_EN);
        // Anything unrecognised falls back to English rather than to nothing.
        expect(platformName('')).toBe(PLATFORM_NAME_EN);
    });
});

describe('the locale files agree with it', () => {
    it('uses the current name in the English landing copy', () => {
        expect(en.whyChoose.title).toContain(PLATFORM_NAME_EN);
        expect(en.footer.copyright).toContain(PLATFORM_NAME_EN);
    });

    it('uses the current name in the Arabic landing copy', () => {
        expect(ar.whyChoose.title).toContain(PLATFORM_NAME_AR);
        expect(ar.footer.copyright).toContain(PLATFORM_NAME_AR);
    });

    it('carries none of the superseded Arabic names', () => {
        const blob = JSON.stringify(ar) + JSON.stringify(en);
        for (const old of SUPERSEDED_AR) {
            expect(blob).not.toContain(old);
        }
    });

    it('does not claim an out-of-date copyright year', () => {
        // A stale year on a government landing page reads as an abandoned site.
        for (const copy of [en.footer.copyright, ar.footer.copyright]) {
            expect(copy).not.toMatch(/©\s*20(1\d|2[0-5])\b/);
        }
    });
});

describe('the Council', () => {
    it('was not renamed along with the platform', () => {
        // A different body from the platform it runs. It has no quotes.
        expect(COUNCIL_NAME_EN).toBe('Emirati Human Development Council');
        expect(COUNCIL_NAME_AR).not.toContain('"');
        expect(COUNCIL_NAME_EN).not.toContain('"');
    });
});
