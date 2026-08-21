/**
 * Radix primitives must be told the reading direction.
 *
 * fb_1787248956: on the Board Secretariat page in Arabic, "all tabs are aligned
 * to the left". The page was NOT the problem — it sets dir="rtl" on its root
 * (BoardSecretaryDashboard line 452) and the layout flips correctly.
 *
 * Radix components do not read the DOM `dir` attribute. Each takes its own
 * `dir` prop, defaulting to 'ltr' unless a DirectionProvider supplies one. So
 * the page went RTL and the tab strip did not.
 *
 * These assert the provider stays mounted and stays driven by the language,
 * because the failure is silent: nothing errors, the tabs just sit on the wrong
 * side for every Arabic-reading user.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const app = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf-8');

describe('Radix direction', () => {
  it('mounts a DirectionProvider', () => {
    expect(app).toContain('DirectionProvider');
    expect(app).toMatch(/import \{ DirectionProvider \} from '@radix-ui\/react-direction'/);
  });

  it('drives it from the language, not a constant', () => {
    const bridge = app.split('const RadixDirection')[1]?.split('\n\n')[0] ?? '';
    expect(bridge).toContain('useLanguage()');
    expect(bridge).toMatch(/language === 'ar' \? 'rtl' : 'ltr'/);
  });

  it('sits inside LanguageProvider, which it reads from', () => {
    // Outside it, useLanguage() would throw.
    const tree = app.split('<LanguageProvider>')[1]?.split('</LanguageProvider>')[0] ?? '';
    expect(tree).toContain('<RadixDirection>');
  });

  it('wraps the application, not one branch of it', () => {
    // A provider mounted below part of the tree fixes only what is under it.
    const tree = app.split('<RadixDirection>')[1]?.split('</RadixDirection>')[0] ?? '';
    expect(tree).toContain('<AppContent />');
  });
});
