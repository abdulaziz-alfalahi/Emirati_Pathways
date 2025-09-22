import { expect } from 'vitest';

// Custom matcher for accessibility
expect.extend({
  toHaveAccessibleName(received: Element, expectedName: string) {
    const accessibleName = received.getAttribute('aria-label') || 
                          received.getAttribute('aria-labelledby') ||
                          received.textContent;
    
    return {
      pass: accessibleName === expectedName,
      message: () => 
        `Expected element to have accessible name "${expectedName}", but got "${accessibleName}"`,
    };
  },

  toBeVisuallyHidden(received: Element) {
    const styles = window.getComputedStyle(received);
    const isHidden = styles.position === 'absolute' && 
                    styles.left === '-10000px' ||
                    styles.clipPath === 'inset(50%)' ||
                    styles.opacity === '0';
    
    return {
      pass: isHidden,
      message: () => 
        `Expected element to be visually hidden, but it's visible`,
    };
  },

  toHaveValidationError(received: Element, errorMessage?: string) {
    const hasAriaInvalid = received.getAttribute('aria-invalid') === 'true';
    const hasErrorMessage = errorMessage ? 
      received.parentElement?.textContent?.includes(errorMessage) : true;
    
    return {
      pass: hasAriaInvalid && hasErrorMessage,
      message: () => 
        `Expected element to have validation error${errorMessage ? ` "${errorMessage}"` : ''}`,
    };
  },

  toBeLoading(received: Element) {
    const hasAriaLabel = received.getAttribute('aria-label')?.includes('loading') ||
                        received.getAttribute('aria-busy') === 'true';
    const hasLoadingClass = received.classList.contains('loading') ||
                           received.classList.contains('animate-spin');
    
    return {
      pass: hasAriaLabel || hasLoadingClass,
      message: () => 
        `Expected element to be in loading state`,
    };
  },
});

// Type declarations for TypeScript
declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveAccessibleName(expectedName: string): T;
    toBeVisuallyHidden(): T;
    toHaveValidationError(errorMessage?: string): T;
    toBeLoading(): T;
  }
}
