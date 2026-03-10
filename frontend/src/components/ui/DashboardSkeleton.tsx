import React from 'react';

/* ─── Skeleton primitives ─── */
const Pulse: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

/* ─── KPI Card skeleton ─── */
export const CardSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-3">
        <div className="flex items-center justify-between">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-8 w-8 rounded-lg" />
        </div>
        <Pulse className="h-8 w-20" />
        <Pulse className="h-3 w-32" />
    </div>
);

/* ─── Table skeleton ─── */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex gap-4 p-4 border-b border-slate-100 bg-slate-50">
            {Array.from({ length: cols }).map((_, i) => (
                <Pulse key={i} className="h-4 flex-1" />
            ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-4 p-4 border-b border-slate-50">
                {Array.from({ length: cols }).map((_, c) => (
                    <Pulse key={c} className="h-4 flex-1" />
                ))}
            </div>
        ))}
    </div>
);

/* ─── Activity feed skeleton ─── */
const ActivitySkeleton: React.FC = () => (
    <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
        <Pulse className="h-5 w-36" />
        {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3">
                <Pulse className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Pulse className="h-4 w-3/4" />
                    <Pulse className="h-3 w-1/2" />
                </div>
            </div>
        ))}
    </div>
);

/* ─── Full Dashboard skeleton ─── */
const DashboardSkeleton: React.FC = () => (
    <div className="space-y-6 p-6">
        {/* Greeting area */}
        <div className="space-y-2">
            <Pulse className="h-7 w-48" />
            <Pulse className="h-4 w-72" />
        </div>

        {/* KPI cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>

        {/* Tab strip placeholder */}
        <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
                <Pulse key={i} className="h-9 w-24 rounded-lg" />
            ))}
        </div>

        {/* Content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <TableSkeleton rows={4} cols={4} />
            </div>
            <ActivitySkeleton />
        </div>
    </div>
);

export default DashboardSkeleton;
