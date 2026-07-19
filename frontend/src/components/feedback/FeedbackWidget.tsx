import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
    MessageSquare,
    X,
    Send,
    AlertCircle,
    CheckCircle2,
    Bug,
    Lightbulb,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { restClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';

import { useSearchParams } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// Diagnostics capture (module-level, installed once on import). Feeds richer data
// into the feedback report: FAILED network calls, a breadcrumb trail (clicks +
// route changes), redaction of secrets, session hints, and app version.
// Console capture stays in the component (it needs React state).
// ─────────────────────────────────────────────────────────────────────────────
const FB_MAX_NET = 25;
const FB_MAX_CRUMBS = 40;
const fbNetworkLog: Array<Record<string, any>> = [];
const fbBreadcrumbs: Array<Record<string, any>> = [];

const fbNow = () => new Date().toISOString();

// Strip secrets (tokens, Emirates ID) from any captured string before it leaves the browser.
export const fbRedact = (input: any): string => {
    let s = typeof input === 'string'
        ? input
        : (() => { try { return JSON.stringify(input); } catch { return String(input); } })();
    if (!s) return s;
    return s
        .replace(/(Bearer\s+)[A-Za-z0-9._\-]+/gi, '$1<redacted>')
        .replace(/("?(?:authorization|access_token|refresh_token|token|password|csrf[_-]?token|x-csrf-token)"?\s*[:=]\s*"?)[^"'`,}\s]+/gi, '$1<redacted>')
        .replace(/\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b/g, '<redacted-eid>')
        .replace(/\b\d{15}\b/g, '<redacted-15d>');
};

const fbPushNet = (method: string, url: string, status: number, ms: number, body: string) => {
    fbNetworkLog.unshift({ t: fbNow(), method, url: fbRedact(url), status, ms: Math.round(ms), body: fbRedact(body).slice(0, 500) });
    if (fbNetworkLog.length > FB_MAX_NET) fbNetworkLog.length = FB_MAX_NET;
};

const fbPushCrumb = (kind: string, detail: string) => {
    fbBreadcrumbs.unshift({ t: fbNow(), kind, detail: fbRedact(detail).slice(0, 120) });
    if (fbBreadcrumbs.length > FB_MAX_CRUMBS) fbBreadcrumbs.length = FB_MAX_CRUMBS;
};

let fbInstalled = false;
const fbInstallCapture = () => {
    if (fbInstalled || typeof window === 'undefined') return;
    fbInstalled = true;

    // Intercept fetch — record only FAILED calls (non-2xx or network error).
    const origFetch = window.fetch ? window.fetch.bind(window) : null;
    if (origFetch) {
        window.fetch = async (...args: any[]) => {
            const start = performance.now();
            const req = args[0];
            const method = (args[1]?.method || (req && req.method) || 'GET').toString().toUpperCase();
            const url = typeof req === 'string' ? req : (req?.url || String(req));
            try {
                const res = await origFetch(...args);
                if (!res.ok) {
                    let body = '';
                    try { body = await res.clone().text(); } catch { /* opaque/streamed */ }
                    fbPushNet(method, url, res.status, performance.now() - start, body);
                }
                return res;
            } catch (err: any) {
                fbPushNet(method, url, 0, performance.now() - start, err?.message || String(err));
                throw err;
            }
        };
    }

    // Intercept XHR (axios uses XHR) — record only FAILED calls.
    try {
        const XHR = window.XMLHttpRequest;
        const origOpen = XHR.prototype.open;
        const origSend = XHR.prototype.send;
        XHR.prototype.open = function (method: string, url: string, ...rest: any[]) {
            (this as any).__fb = { method: (method || 'GET').toUpperCase(), url: String(url), start: 0 };
            // @ts-ignore
            return origOpen.call(this, method, url, ...rest);
        };
        XHR.prototype.send = function (...sendArgs: any[]) {
            const meta = (this as any).__fb;
            if (meta) {
                meta.start = performance.now();
                this.addEventListener('loadend', () => {
                    if (this.status === 0 || this.status >= 400) {
                        let body = '';
                        try { body = String(this.responseText || ''); } catch { /* non-text */ }
                        fbPushNet(meta.method, meta.url, this.status, performance.now() - meta.start, body);
                    }
                });
            }
            // @ts-ignore
            return origSend.apply(this, sendArgs);
        };
    } catch { /* XHR not patchable */ }

    // Breadcrumbs: user clicks (nearest interactive ancestor).
    document.addEventListener('click', (e) => {
        try {
            const t = e.target as HTMLElement;
            const el = (t?.closest?.('button,a,[role="button"],input,select,[data-testid]') as HTMLElement) || t;
            if (!el) return;
            const tag = el.tagName ? el.tagName.toLowerCase() : '';
            const id = el.id ? `#${el.id}` : '';
            const txt = (el.textContent || (el as HTMLInputElement).value || el.getAttribute?.('aria-label') || '')
                .trim().replace(/\s+/g, ' ').slice(0, 40);
            fbPushCrumb('click', `${tag}${id} ${txt}`.trim());
        } catch { /* ignore */ }
    }, true);

    // Breadcrumbs: SPA route changes (patch history + popstate).
    const recordNav = () => fbPushCrumb('nav', window.location.pathname + window.location.search);
    window.addEventListener('popstate', recordNav);
    (['pushState', 'replaceState'] as const).forEach((fn) => {
        const orig = (history as any)[fn];
        (history as any)[fn] = function (...a: any[]) { const r = orig.apply(this, a); recordNav(); return r; };
    });
    recordNav();
};

// Best-effort client session hints (the httpOnly access cookie can't be read in JS;
// the authoritative token status is computed server-side at submit time).
const fbSessionHints = () => {
    let hasCsrf = false, hasRefreshCsrf = false;
    try {
        hasCsrf = document.cookie.includes('csrf_access_token');
        hasRefreshCsrf = document.cookie.includes('csrf_refresh_token');
    } catch { /* ignore */ }
    const token = (() => { try { return localStorage.getItem('token') || localStorage.getItem('access_token') || ''; } catch { return ''; } })();
    return {
        clientAuthMode: (!token || token === 'cookie_authenticated') ? 'cookie' : 'bearer',
        hasLocalRefreshToken: (() => { try { return !!localStorage.getItem('refresh_token'); } catch { return false; } })(),
        hasCsrfAccessCookie: hasCsrf,
        hasCsrfRefreshCookie: hasRefreshCsrf,
    };
};

const fbAppVersion = () => {
    // VITE_APP_VERSION / VITE_BUILD_TIME are statically replaced by Vite (dev + build);
    // __APP_VERSION__ / __BUILD_TIME__ come from vite.config `define` as a build fallback.
    const v = import.meta.env.VITE_APP_VERSION
        || (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '')
        || 'unknown';
    const built = import.meta.env.VITE_BUILD_TIME
        || (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '')
        || '';
    const mode = import.meta.env.MODE || 'unknown';
    let loadedAt = '';
    try { loadedAt = new Date(performance.timeOrigin).toISOString(); } catch { /* ignore */ }
    return `${v} (${mode}${built ? `, built ${built}` : ''}, page loaded ${loadedAt})`;
};

// Install as soon as this module is imported (the widget mounts app-wide).
fbInstallCapture();

const ClarificationReplyForm = ({ feedbackId, onSuccess }: { feedbackId: string; onSuccess: () => void }) => {
    const [reply, setReply] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSend = async () => {
        if (!reply.trim()) return;
        setIsSubmitting(true);
        try {
            await restClient.post(`/api/feedback/${feedbackId}/clarify`, {
                message: reply
            });
            toast({
                title: "Reply Sent",
                description: "Your response has been sent to our support team.",
            });
            setReply('');
            onSuccess();
        } catch (err) {
            console.error(err);
            toast({
                title: "Failed to Send",
                description: "Unable to submit clarification response.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-2 mt-2">
            <Textarea
                placeholder="Type your response here..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="min-h-[60px] text-xs bg-card border-amber-200 focus-visible:ring-amber-500 focus-visible:border-amber-500"
                disabled={isSubmitting}
            />
            <div className="flex justify-end">
                <Button 
                    size="sm" 
                    className="h-7 text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-medium"
                    onClick={handleSend}
                    disabled={isSubmitting || !reply.trim()}
                >
                    {isSubmitting ? 'Sending...' : 'Send Response'}
                </Button>
            </div>
        </div>
    );
};

export const FeedbackWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('');
    const [type, setType] = useState('bug');
    const [severity, setSeverity] = useState('medium');
    const [reproSteps, setReproSteps] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
    
    // Screenshot States
    const [includeScreenshot, setIncludeScreenshot] = useState(true);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);

    // Deep linking support
    const [searchParams] = useSearchParams();

    // History State
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [activeTab, setActiveTab] = useState('new');

    // Effect to handle deep linking
    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'feedback_history') {
            setIsOpen(true);
            setActiveTab('history');
            // Optional: You could read 'feedback_id' here if you want to highlight a specific item
        }
    }, [searchParams]);

    // Capture console logs and global runtime crashes
    useEffect(() => {
        if (!isAuthenticated) return;

        const originalError = console.error;
        const originalWarn = console.warn;
        const originalLog = console.log;

        const captureLog = (level: string, messageStr: string) => {
            // Redact secrets, timestamp each line, and collapse consecutive duplicates
            // (e.g. repeated "Socket timeout") into a single "(xN)" entry so the noise
            // doesn't evict useful logs from the buffer.
            const core = `[${level}] ${fbRedact(messageStr)}`;
            const ts = new Date().toISOString().slice(11, 19);
            setTimeout(() => {
                setConsoleLogs(prev => {
                    const top = prev[0] || '';
                    const topCore = top.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, '').replace(/\s*\(x\d+\)$/, '');
                    if (topCore === core) {
                        const m = top.match(/\(x(\d+)\)$/);
                        const n = m ? parseInt(m[1], 10) + 1 : 2;
                        return [`[${ts}] ${core} (x${n})`, ...prev.slice(1)];
                    }
                    return [`[${ts}] ${core}`, ...prev].slice(0, 60);
                });
            }, 0);
        };

        console.error = (...args) => {
            try {
                const logMsg = args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ');
                captureLog('ERROR', logMsg);
            } catch (e) {}
            originalError.apply(console, args);
        };
        
        console.warn = (...args) => {
            try {
                const logMsg = args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ');
                captureLog('WARN', logMsg);
            } catch (e) {}
            originalWarn.apply(console, args);
        };

        const handleGlobalError = (event: ErrorEvent) => {
            const errorMsg = `[RUNTIME CRASH] ${event.message || 'Unknown error'} at ${event.filename || 'unknown'}:${event.lineno || 0}:${event.colno || 0}`;
            captureLog('CRASH', errorMsg);
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            let logMsg = '';
            if (reason instanceof Error) {
                logMsg = reason.stack || reason.message;
            } else {
                try {
                    logMsg = typeof reason === 'object' ? JSON.stringify(reason) : String(reason);
                } catch (e) {
                    logMsg = String(reason);
                }
            }
            captureLog('REJECTION', logMsg);
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            console.error = originalError;
            console.warn = originalWarn;
            console.log = originalLog;
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [isAuthenticated]);

    // Capture screenshot function
    const capturePageScreenshot = async () => {
        setIsCapturingScreenshot(true);
        setScreenshot(null);
        
        // Hide the entire feedback UI so the shot shows only the page underneath:
        // the dialog content ([role="dialog"]), its dark/blur overlay, the floating
        // trigger button, and any toasts. The overlay is `fixed inset-0` with a
        // theme-dependent z-index (currently z-[90]); the old selector `.fixed.inset-0.z-50`
        // never matched it, which is why the darkened/blurred backdrop leaked into
        // the screenshot. Match the overlay z-index-agnostically instead.
        const elementsToHide: HTMLElement[] = [];
        [
            '[role="dialog"]',
            '.fixed.inset-0',
            '.feedback-trigger-btn',
            '[data-radix-toast-viewport]',
            '[data-sonner-toaster]',
        ].forEach(sel => {
            document.querySelectorAll(sel).forEach(el => elementsToHide.push(el as HTMLElement));
        });

        const prevVisibility = elementsToHide.map(el => el.style.visibility);
        elementsToHide.forEach(el => {
            el.style.visibility = 'hidden';
        });
        
        try {
            await new Promise(resolve => requestAnimationFrame(resolve));
            await new Promise(resolve => setTimeout(resolve, 100)); // small delay for transition
            
            const canvas = await html2canvas(document.body, {
                useCORS: true,
                allowTaint: true,
                scale: 0.75,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const base64Image = canvas.toDataURL('image/jpeg', 0.6);
            setScreenshot(base64Image);
        } catch (err) {
            console.error('Failed to capture page screenshot', err);
        } finally {
            elementsToHide.forEach((el, i) => {
                el.style.visibility = prevVisibility[i] || '';
            });
            setIsCapturingScreenshot(false);
        }
    };

    // Auto-capture screenshot on open/type changes
    useEffect(() => {
        if (isOpen && type === 'bug' && includeScreenshot) {
            capturePageScreenshot();
        } else if (!isOpen) {
            setScreenshot(null);
        }
    }, [isOpen, type, includeScreenshot]);

    // Fetch history when tab changes to 'history'
    useEffect(() => {
        if (isOpen && activeTab === 'history') {
            fetchHistory();
        }
    }, [isOpen, activeTab]);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const response = await restClient.get('/api/feedback/my-feedback');
            if (response.data.success) {
                setHistory(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch feedback history', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    if (!isAuthenticated) return null;

    const handleSubmit = async () => {
        if (!message.trim() || !title.trim()) return;

        setIsSubmitting(true);
        try {
            // Enhanced Payload
            const metadata = {
                userAgent: navigator.userAgent,
                screenSize: `${window.innerWidth}x${window.innerHeight}`,
                timestamp: new Date().toISOString(),
                path: window.location.pathname,
                title,
                severity,
                reproSteps,
                userEmail: user?.email || 'N/A',
                userId: user?.id || 'N/A',
                userRole: user?.role || 'N/A',
                queryParams: window.location.search,
                isOnline: navigator.onLine ? 'online' : 'offline',
                language: navigator.language,
                referrer: document.referrer || 'direct'
            };

            // Format message for immediate visibility
            let formattedMessage = `[${title}]\n\n${message}`;
            if (type === 'bug') {
                formattedMessage += `\n\n[Severity]: ${severity.toUpperCase()}`;
                if (reproSteps) {
                    formattedMessage += `\n\n[Steps to Reproduce]:\n${reproSteps}`;
                }
            }

            await restClient.post('/api/feedback/submit', {
                message: formattedMessage,
                type,
                pageUrl: window.location.href,
                consoleLogs,
                networkLogs: fbNetworkLog,
                breadcrumbs: fbBreadcrumbs,
                sessionState: fbSessionHints(),
                appVersion: fbAppVersion(),
                metadata,
                screenshot: includeScreenshot ? screenshot : null
            });

            toast({
                title: "Feedback Sent",
                description: "Thank you for your feedback! Our team will review it shortly.",
                variant: "default", // or success if available
            });

            setMessage('');
            setTitle('');
            setReproSteps('');
            setSeverity('medium');
            setType('bug');
            setConsoleLogs([]); // Clear logs after send
            setScreenshot(null);

            // Switch to history tab to show progress
            setActiveTab('history');
            fetchHistory(); // Refresh history

        } catch (error) {
            console.error('Failed to send feedback', error);
            toast({
                title: "Submission Failed",
                description: "Could not send feedback. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
            case 'in_progress':
            case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'pending_clarification': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <>
            {/* Floating trigger — sits in the corner column above the Support-chat FAB
                (a 60px circle at bottom:24 right:24).

                It previously sat at bottom-40 as a ~155px-wide pill, which pushed it into
                the CONTENT column and covered page material (e.g. the Skill Gaps card and
                its "View Full Analysis" link on the candidate dashboard). It is now a
                circular icon button the same size as the chat FAB, so its footprint is
                ~56px instead of ~155px, and it expands to reveal the label on hover/focus.

                The permanent `animate-ping` ring and `animate-bounce-slow` icon were
                removed: unmotivated perpetual motion on every page, and neither honoured
                prefers-reduced-motion. Hover feedback is now a subtle scale, gated behind
                `motion-safe`. */}
            <div className="fixed bottom-24 end-6 z-50 group feedback-trigger-btn">
                <Button
                    onClick={() => setIsOpen(true)}
                    aria-label="Send feedback or report an issue"
                    title="Send feedback or report an issue"
                    className="relative flex items-center justify-center rounded-full h-14 min-w-14 px-4 shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-white/20 transition-transform motion-safe:hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                >
                    <MessageSquare className="h-6 w-6 shrink-0" />
                    <span
                        className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 font-semibold transition-all duration-200 group-hover:max-w-[7rem] group-hover:opacity-100 group-hover:ms-2 group-focus-within:max-w-[7rem] group-focus-within:opacity-100 group-focus-within:ms-2"
                    >
                        Feedback
                    </span>
                </Button>
            </div>

            {/* Feedback Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Feedback & Support</DialogTitle>
                        <DialogDescription>
                            Report issues, suggest features, or track your requests.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="new">New Feedback</TabsTrigger>
                            <TabsTrigger value="history">My History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="new" className="space-y-4 py-4">
                            <div className="grid gap-4">

                                {/* 1. Title Field (New) */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="title" className="text-right">
                                        Subject
                                    </Label>
                                    <input
                                        id="title"
                                        placeholder="Brief summary of the issue"
                                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="type" className="text-right">
                                        Type
                                    </Label>
                                    <div className="col-span-3">
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bug">
                                                    <div className="flex items-center text-red-600">
                                                        <Bug className="mr-2 h-4 w-4" /> Bug Report
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="feature">
                                                    <div className="flex items-center text-amber-600">
                                                        <Lightbulb className="mr-2 h-4 w-4" /> Feature Request
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* 2. Severity (Only for Bugs) */}
                                {type === 'bug' && (
                                    <div className="grid grid-cols-4 items-center gap-4 animate-in slide-in-from-top-1 duration-200">
                                        <Label htmlFor="severity" className="text-right">
                                            Severity
                                        </Label>
                                        <div className="col-span-3">
                                            <Select value={severity} onValueChange={setSeverity}>
                                                <SelectTrigger className={severity === 'critical' ? 'border-red-500 text-red-600' : ''}>
                                                    <SelectValue placeholder="Select severity" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low - Minor cosmetic issue</SelectItem>
                                                    <SelectItem value="medium">Medium - Functional issue but workaround exists</SelectItem>
                                                    <SelectItem value="high">High - Feature is broken</SelectItem>
                                                    <SelectItem value="critical">Critical - System crash or data loss</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="message" className="text-right pt-2">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={type === 'bug' ? "What happened? What did you expect to happen?" : "Describe your idea..."}
                                        className="col-span-3 min-h-[80px]"
                                    />
                                </div>

                                {/* 3. Steps to Reproduce (Only for Bugs) */}
                                {type === 'bug' && (
                                    <div className="grid grid-cols-4 items-start gap-4 animate-in slide-in-from-top-2 duration-300">
                                        <Label htmlFor="steps" className="text-right pt-2 text-xs font-semibold text-muted-foreground uppercase">
                                            Steps to Reproduce
                                        </Label>
                                        <Textarea
                                            id="steps"
                                            value={reproSteps}
                                            onChange={(e) => setReproSteps(e.target.value)}
                                            placeholder="1. Go to page X&#10;2. Click on button Y&#10;3. See error Z"
                                            className="col-span-3 min-h-[100px] font-mono text-sm bg-muted"
                                        />
                                    </div>
                                )}

                                {/* Screenshot Toggle & Preview */}
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="screenshot" className="text-right pt-1 text-xs font-semibold text-muted-foreground uppercase">
                                        Screenshot
                                    </Label>
                                    <div className="col-span-3 space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="include-screenshot"
                                                checked={includeScreenshot}
                                                onChange={(e) => {
                                                    setIncludeScreenshot(e.target.checked);
                                                    if (e.target.checked && !screenshot && !isCapturingScreenshot) {
                                                        capturePageScreenshot();
                                                    }
                                                }}
                                                className="h-4 w-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
                                            />
                                            <label htmlFor="include-screenshot" className="text-xs text-muted-foreground font-medium select-none cursor-pointer">
                                                Include screenshot of the current page
                                            </label>
                                        </div>
                                        
                                        {includeScreenshot && (
                                            <div className="relative border rounded-md overflow-hidden bg-muted h-24 flex items-center justify-center group/screenshot">
                                                {isCapturingScreenshot ? (
                                                    <div className="flex flex-col items-center justify-center text-xs text-muted-foreground gap-1">
                                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                        <span>Capturing page...</span>
                                                    </div>
                                                ) : screenshot ? (
                                                    <>
                                                        <img 
                                                            src={screenshot} 
                                                            alt="Page snapshot" 
                                                            className="h-full w-full object-cover transition-transform duration-200 group-hover/screenshot:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/screenshot:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="secondary"
                                                                className="h-7 text-[10px] px-2 py-0 bg-card hover:bg-muted text-foreground border-none"
                                                                onClick={capturePageScreenshot}
                                                            >
                                                                Retake
                                                            </Button>
                                                            <a
                                                                href={screenshot}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="h-7 text-[10px] px-2 py-1 bg-card text-foreground rounded hover:bg-muted flex items-center justify-center font-medium"
                                                            >
                                                                View
                                                            </a>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-xs text-muted-foreground gap-1 p-2 text-center">
                                                        <span className="text-[10px] text-amber-600">Failed to capture canvas.</span>
                                                        <Button 
                                                            type="button" 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="h-6 text-[10px] mt-1" 
                                                            onClick={capturePageScreenshot}
                                                        >
                                                            Retry Capture
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-xs text-muted-foreground">
                                        Context
                                    </Label>
                                    <div className="col-span-3 text-xs text-muted-foreground bg-muted p-2 rounded flex justify-between items-center">
                                        <span>path: {window.location.pathname}</span>
                                        <span className={consoleLogs.length > 0 ? "text-amber-600 font-bold" : ""}>
                                            logs captured: {consoleLogs.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim() || !message.trim()}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Feedback
                                </Button>
                            </DialogFooter>
                        </TabsContent>

                        <TabsContent value="history" className="py-4">
                            <ScrollArea className="h-[300px] pr-4">
                                {isLoadingHistory ? (
                                    <div className="flex justify-center items-center h-full py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        <p>No feedback submitted yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {history.map((item) => (
                                            <div key={item.id} className="border rounded-lg p-3 space-y-2 bg-card">
                                                <div className="flex justify-between items-start">
                                                    <Badge variant="outline" className={item.type === 'bug' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                                                        {item.type === 'bug' ? <Bug className="h-3 w-3 mr-1" /> : <Lightbulb className="h-3 w-3 mr-1" />}
                                                        {item.type}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(item.created_at), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                                <p className="text-sm line-clamp-3 whitespace-pre-wrap" title={item.message}>{item.message}</p>
                                                {item.status === 'pending_clarification' && item.resolution_notes && (
                                                    <div className="bg-amber-50 border border-amber-200 rounded p-2.5 my-2 text-xs space-y-1">
                                                        <div className="text-amber-800 font-medium">
                                                            <strong>Support Request:</strong> {item.resolution_notes}
                                                        </div>
                                                        <ClarificationReplyForm 
                                                            feedbackId={item.id} 
                                                            onSuccess={fetchHistory} 
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex justify-end">
                                                    <Badge variant="secondary" className={`${getStatusColor(item.status)} uppercase text-[10px]`}>
                                                        {item.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    );
};
