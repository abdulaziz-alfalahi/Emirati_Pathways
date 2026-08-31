import React, { useEffect, useState } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Loader2, Info } from 'lucide-react';

/**
 * How an educator's students are actually doing.
 *
 * Surveyed out of fb_1788181600, with three sibling screens. This one charted
 * literal arrays and fetched nothing at all — 720 lines of numbers nobody
 * measured, about students who do not exist.
 *
 * The backend was already honest, and had been since #26:
 *
 *     # placement_success_rate has no source query — leave null
 *     # ("not available") rather than assert a fabricated 85. (#26)
 *
 * So /api/educator/analytics/performance returns real counts and an explicit
 * null for what it cannot answer. This screen now reads it.
 *
 * TODAY IT IS EMPTY, AND THAT IS THE CORRECT OUTPUT. The platform holds zero
 * students; the tables exist and are waiting for the first enrolment. An empty
 * screen that says so is worth more than a full one that is invented — and it
 * fills itself the day real enrolments arrive, with no further work.
 */

interface Overview {
    total_students?: number;
    average_gpa?: number;
    attendance_rate?: number;
    career_sessions_conducted?: number;
    placement_success_rate?: number | null;
}

interface Analytics {
    overview?: Overview;
    performance_distribution?: Record<string, number>;
    subject_performance?: { subject?: string; average?: number }[];
    emiratization_metrics?: Record<string, unknown>;
}

const PerformanceAnalytics: React.FC = () => {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await restClient.get('/api/educator/analytics/performance');
                if (!cancelled) setAnalytics(res.data?.analytics || null);
            } catch {
                if (!cancelled) setFailed(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 p-6 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading student performance…
            </div>
        );
    }

    if (failed) {
        return (
            <div className="p-6 text-sm text-gray-600">
                Student performance could not be loaded. Nothing is shown rather than
                an estimate.
            </div>
        );
    }

    const o = analytics?.overview || {};
    const dist = analytics?.performance_distribution || {};
    const distRows = Object.entries(dist)
        .filter(([, n]) => typeof n === 'number')
        .map(([band, n]) => ({ band: band.replace(/_/g, ' '), n: n as number }));
    const hasAnything = (o.total_students || 0) > 0;

    return (
        <div className="space-y-5 p-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Students" value={String(o.total_students ?? 0)} />
                <Stat label="Average GPA" value={o.average_gpa ? String(o.average_gpa) : '—'} />
                <Stat label="Attendance" value={o.attendance_rate ? `${o.attendance_rate}%` : '—'} />
                <Stat label="Career sessions" value={String(o.career_sessions_conducted ?? 0)} />
            </div>

            {/* The backend returns null here on purpose. Showing "—" keeps that
                distinction: not zero placements, but no way to know yet. */}
            <p className="text-xs text-gray-500">
                Placement success rate:{' '}
                {o.placement_success_rate === null || o.placement_success_rate === undefined
                    ? <span className="font-medium">not tracked yet</span>
                    : `${o.placement_success_rate}%`}
            </p>

            {!hasAnything ? (
                <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <Info className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-600">
                        No students are enrolled yet, so there is nothing to chart. This
                        fills in as enrolments are recorded — nothing here is estimated
                        in the meantime.
                    </p>
                </div>
            ) : (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Performance distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                                <BarChart data={distRows}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="band" tick={{ fontSize: 11 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="n" fill="#0F766E" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-md border border-gray-200 p-3">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
);

export default PerformanceAnalytics;
