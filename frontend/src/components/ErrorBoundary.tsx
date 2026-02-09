import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        // Could send to logging service here
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-semibold mb-4">Something went wrong.</h2>
                    <p className="text-muted-foreground">Please try refreshing the page or contact support.</p>
                </div>
            );
        }
        return this.props.children;
    }
}
