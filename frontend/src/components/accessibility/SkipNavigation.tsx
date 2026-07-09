import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * WCAG 2.4.1 (Bypass Blocks): keyboard/screen-reader users can jump past
 * repeated navigation. The links are visually hidden until focused, then
 * become visible (see .skip-link in styles/accessibility.css). Target anchors
 * (#main-content, #navigation) are provided by the page layouts.
 *
 * Bilingual via i18next with English defaults so the mechanism works even
 * before/without translation keys.
 */
export const SkipNavigation: React.FC = () => {
  const { t } = useTranslation();
  return (
    <nav className="skip-links" aria-label={t('a11y.skipLinks', { defaultValue: 'Skip links' })}>
      <a
        href="#main-content"
        className="skip-link"
        onFocus={(e) => e.currentTarget.scrollIntoView()}
      >
        {t('a11y.skipToMain', { defaultValue: 'Skip to main content' })}
      </a>
      <a
        href="#navigation"
        className="skip-link"
        onFocus={(e) => e.currentTarget.scrollIntoView()}
      >
        {t('a11y.skipToNav', { defaultValue: 'Skip to navigation' })}
      </a>
    </nav>
  );
};

export default SkipNavigation;
