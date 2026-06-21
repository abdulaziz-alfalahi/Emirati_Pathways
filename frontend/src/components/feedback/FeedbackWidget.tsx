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
            // Use setTimeout to avoid state updates during render
            setTimeout(() => {
                setConsoleLogs(prev => [`[${level}] ${messageStr}`, ...prev].slice(0, 50));
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
        
        const dialogContent = document.querySelector('[role="dialog"]');
        const overlayEl = document.querySelector('.fixed.inset-0.z-50'); 
        
        const elementsToHide: HTMLElement[] = [];
        if (dialogContent) elementsToHide.push(dialogContent as HTMLElement);
        if (overlayEl) elementsToHide.push(overlayEl as HTMLElement);
        
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
            elementsToHide.forEach(el => {
                el.style.visibility = 'visible';
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
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <div className="fixed bottom-24 right-6 z-50 group feedback-trigger-btn">
                {/* Pulse effect ring */}
                <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping opacity-75 group-hover:opacity-100 duration-1000" />

                <Button
                    onClick={() => setIsOpen(true)}
                    className="relative rounded-full h-14 pl-4 pr-6 shadow-xl bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white border-2 border-white/20 transition-all transform hover:scale-105"
                    title="Report an Issue"
                >
                    <MessageSquare className="h-6 w-6 mr-2 animate-bounce-slow" />
                    <span className="font-semibold text-lg">Feedback</span>
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
                                            className="col-span-3 min-h-[100px] font-mono text-sm bg-slate-50"
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
                                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                            />
                                            <label htmlFor="include-screenshot" className="text-xs text-muted-foreground font-medium select-none cursor-pointer">
                                                Include screenshot of the current page
                                            </label>
                                        </div>
                                        
                                        {includeScreenshot && (
                                            <div className="relative border rounded-md overflow-hidden bg-slate-50 h-24 flex items-center justify-center group/screenshot">
                                                {isCapturingScreenshot ? (
                                                    <div className="flex flex-col items-center justify-center text-xs text-muted-foreground gap-1">
                                                        <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
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
                                                                className="h-7 text-[10px] px-2 py-0 bg-white hover:bg-slate-100 text-black border-none"
                                                                onClick={capturePageScreenshot}
                                                            >
                                                                Retake
                                                            </Button>
                                                            <a
                                                                href={screenshot}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="h-7 text-[10px] px-2 py-1 bg-white text-black rounded hover:bg-slate-100 flex items-center justify-center font-medium"
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
                                                <p className="text-sm line-clamp-2" title={item.message}>{item.message}</p>
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
