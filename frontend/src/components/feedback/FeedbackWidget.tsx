import React, { useState, useEffect } from 'react';
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

    // Capture console logs (simple version)
    useEffect(() => {
        if (!isAuthenticated) return;

        const originalError = console.error;
        const originalWarn = console.warn;
        const originalLog = console.log;

        const captureLog = (level: string, args: any[]) => {
            try {
                const logMsg = args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ');

                // Use setTimeout to avoid state updates during render (if log happens during render)
                setTimeout(() => {
                    setConsoleLogs(prev => [`[${level}] ${logMsg}`, ...prev].slice(0, 50));
                }, 0);
            } catch (e) {
                // ignore circular structure errors etc
            }
        };

        console.error = (...args) => {
            captureLog('ERROR', args);
            originalError.apply(console, args);
        };
        console.warn = (...args) => {
            captureLog('WARN', args);
            originalWarn.apply(console, args);
        };
        // Optional: capture logs too, might be noisy
        // console.log = (...args) => {
        //   captureLog('LOG', args);
        //   originalLog.apply(console, args);
        // };

        return () => {
            console.error = originalError;
            console.warn = originalWarn;
            console.log = originalLog;
        };
    }, [isAuthenticated]);

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
                reproSteps
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
                metadata
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
            <div className="fixed bottom-24 right-6 z-50 group">
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
