import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * A live call takes the whole screen.
 *
 * REPORTED BY A CANDIDATE, mid-interview, 2026-08-31 (fb_1788181301):
 * "Whenever I click on Dashboard tabs it's taking me out of the interview."
 *
 * She was right, and the first fix was only half of it: leaving no longer ENDS
 * the interview, so she could come back to it. But the call was still a frame
 * inside the dashboard — rendered into `h-[calc(100vh-100px)]`, with the
 * navigation and its tabs sitting above it the entire time.
 *
 * Owner, 2026-09-01: "That is a distraction for the candidate, I think we could
 * fix this by making the video interview full screen."
 *
 * That is the better fix, and not only for distraction. A candidate in a job
 * interview should not be one stray click from leaving it, and no warning
 * dialog makes a tab bar less tempting than simply not showing it. Nobody puts
 * a navigation menu above a video call.
 *
 * WHY A PORTAL RATHER THAN `position: fixed` WHERE IT SITS
 *
 * `fixed` is relative to the nearest ancestor with a transform, filter or
 * containment — and dashboard layouts are full of them. The call would be
 * clipped by a panel it happens to live inside, on some screens and not
 * others. Rendering into `document.body` means the stage covers the viewport
 * wherever it is used from.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * There is no Escape-to-close and no click-outside-to-dismiss. Both are normal
 * for a modal and wrong here: a stray keypress must not drop somebody out of
 * an interview. The only way out is the call's own Leave control, which is the
 * one action that means it on purpose.
 */

interface Props {
    children: React.ReactNode;
    /** Announced to assistive technology as the name of the stage. */
    label?: string;
}

const CallStage: React.FC<Props> = ({ children, label = 'Video interview' }) => {
    useEffect(() => {
        // Stop the dashboard scrolling behind the call. Restored exactly as
        // found, so a page that was already locked stays locked.
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, []);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            style={{
                position: 'fixed',
                inset: 0,
                // Above the platform's sticky header and any panel chrome.
                zIndex: 1000,
                background: '#0F172A',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* VideoRoom sizes itself with h-full, so it needs a child that
                actually fills the stage. minHeight:0 lets it shrink inside the
                flex column instead of overflowing the viewport on short
                screens. */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
                {children}
            </div>
        </div>,
        document.body,
    );
};

export default CallStage;
