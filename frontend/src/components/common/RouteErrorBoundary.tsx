import React from 'react';

/**
 * Catches a render or chunk-load failure so one broken route does not blank
 * the whole platform.
 *
 * WHY THIS EXISTS
 *
 * Reported 2026-08-27 as "Request New Role – Blank Page". Reproduced signed in
 * as an operator: the page rendered ZERO characters — not an error, not a
 * header, nothing. React's own console message said what was missing:
 *
 *     Consider adding an error boundary to your tree
 *
 * There was none, anywhere in the app. Every route is lazily loaded, so ANY
 * failure to fetch a chunk unmounts the entire tree and leaves a white page
 * with no way back other than the browser's reload button — and nothing on
 * screen to suggest it.
 *
 * THE FAILURE THAT ACTUALLY HAPPENED, and why it will happen again
 *
 *     504 (Outdated Optimize Dep) /node_modules/.vite/deps/jspdf.js
 *     Failed to fetch dynamically imported module: ProfileStudioPage.tsx
 *
 * Staging serves the frontend from a Vite dev server. Every deploy re-optimises
 * dependencies and invalidates the chunk URLs a already-open browser is holding.
 * The next lazy route that user visits 404s or 504s, and the app disappears.
 * The reporter hit this minutes after a deploy.
 *
 * A reload fixes it, which is exactly why the failure is worth catching: the
 * remedy is trivial and the user has no way to know it.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It does not reload automatically. A component that crashes on every render
 * would reload forever, and an auto-reloading page cannot be read, reported, or
 * escaped. The user is told what happened and given a button.
 */

interface Props {
    children: React.ReactNode;
    isRTL?: boolean;
}

interface State {
    error: Error | null;
}

/**
 * A stale-chunk failure reads differently from a genuine bug, and the two
 * deserve different words: one is "we just updated, reload", the other is
 * "this page is broken, tell us".
 */
const isChunkLoadFailure = (error: Error | null): boolean => {
    if (!error) return false;
    const text = `${error.name} ${error.message}`;
    return /dynamically imported module|Loading chunk|Importing a module script failed|Outdated Optimize Dep/i
        .test(text);
};

export class RouteErrorBoundary extends React.Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Logged rather than swallowed: the feedback widget captures console
        // output, so this is what makes a report diagnosable instead of
        // "the page was blank".
        console.error('Route failed to render:', error, info?.componentStack);
    }

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        const rtl = this.props.isRTL;
        const stale = isChunkLoadFailure(error);
        const t = (en: string, ar: string) => (rtl ? ar : en);

        return (
            <div dir={rtl ? 'rtl' : 'ltr'}
                 style={{ minHeight: '60vh', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', padding: 24 }}>
                <div style={{ maxWidth: 460, textAlign: 'center' }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1E1B4B' }}>
                        {stale
                            ? t('The platform was updated', 'تم تحديث المنصة')
                            : t('This page could not be opened', 'تعذّر فتح هذه الصفحة')}
                    </h1>
                    <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
                        {stale
                            ? t('A new version was released while this tab was open, so this page could not load. Reloading will fix it — nothing you were doing has been lost.',
                                'صدرت نسخة جديدة أثناء فتح هذه الصفحة، لذا تعذّر تحميلها. سيؤدي إعادة التحميل إلى حل المشكلة، ولم يُفقد أي عمل.')
                            : t('Something went wrong opening this page. Reloading may help. If it keeps happening, please send feedback — the details are already recorded.',
                                'حدث خطأ أثناء فتح هذه الصفحة. قد تساعد إعادة التحميل. وإذا تكرّر الأمر، يُرجى إرسال ملاحظة — فالتفاصيل مسجّلة بالفعل.')}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: 18, background: '#0F766E', color: '#fff',
                                 border: 'none', borderRadius: 8, padding: '10px 20px',
                                 fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                        {t('Reload the page', 'إعادة تحميل الصفحة')}
                    </button>
                    {/* The message, not a stack trace. It is what somebody
                        quotes into a feedback report, and a stack would make
                        the report harder to read rather than easier. */}
                    <p style={{ marginTop: 14, fontSize: 11.5, color: '#9CA3AF',
                                direction: 'ltr', unicodeBidi: 'embed' }}>
                        {error.message?.slice(0, 160)}
                    </p>
                </div>
            </div>
        );
    }
}

export default RouteErrorBoundary;
