import React, { useEffect, useState } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Info, AlertTriangle } from 'lucide-react';

/**
 * Assessment quality monitoring — what is actually recorded.
 *
 * Surveyed out of fb_1788181600. This screen charted 29 literal rows and
 * fetched nothing: invented reliability coefficients, consistency scores and
 * quality trends over months that never happened. On a service that decides
 * whether a person passes an assessment, an invented reliability figure is the
 * most dangerous number on the platform — it is precisely the number somebody
 * would cite to defend a decision.
 *
 * WHAT BACKS IT, AND THE LIMIT OF THAT
 *
 * /api/assessment-analytics-qa/dashboard/quality is real, but it reads an
 * IN-MEMORY store rather than the database: metrics are recorded through
 * /performance/record during a process's lifetime and are gone when the
 * backend restarts. So the screen reports what monitoring currently holds, and
 * says plainly that it is not a historical record. Presenting a fresh, empty
 * store as "no quality problems" would be its own kind of lie.
 */

interface Dashboard {
    summary?: Record<string, number | string>;
    recent_alerts?: { message?: string; severity?: string; assessment_id?: string }[];
    quality_trends?: Record<string, unknown>;
    performance_statistics?: Record<string, unknown>;
    improvement_recommendations?: string[];
}

const QualityAssuranceDashboard: React.FC = () => {
    const [data, setData] = useState<Dashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await restClient.get('/api/assessment-analytics-qa/dashboard/quality');
                if (!cancelled) setData(res.data?.dashboard || null);
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
                <Loader2 className="h-4 w-4 animate-spin" /> Reading quality monitoring…
            </div>
        );
    }

    if (failed) {
        // The caveat belongs here too: an unreadable monitor is even less of a
        // clean bill of health than an empty one.
        return (
            <div className="p-6 space-y-3">
                <p className="text-sm text-gray-600">
                    Quality monitoring could not be read. No figures are shown, because an
                    invented reliability score is worse than none.
                </p>
                <p className="text-sm text-slate-600">
                    Open quality alerts are unavailable. This is not a clean bill of
                    health — nothing could be read.
                </p>
            </div>
        );
    }

    const summary = data?.summary || {};
    const alerts = data?.recent_alerts || [];
    const recommendations = data?.improvement_recommendations || [];
    const monitored = Number(summary.total_assessments_monitored ?? 0);

    return (
        <div className="space-y-5 p-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(summary).length === 0 ? (
                    <Stat label="Assessments monitored" value="0" />
                ) : Object.entries(summary).slice(0, 6).map(([k, v]) => (
                    <Stat key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
                ))}
            </div>

            {monitored === 0 && (
                <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <Info className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-600">
                        No assessments are being monitored yet. This is an empty monitor,
                        not a clean bill of health — quality figures appear here once
                        assessments are recorded.
                    </p>
                </div>
            )}

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Open quality alerts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {alerts.length === 0 ? (
                        <p className="text-sm text-gray-500">No open alerts.</p>
                    ) : (
                        <ul className="space-y-2">
                            {alerts.map((a, i) => (
                                <li key={i} className="text-sm text-gray-700">
                                    <span className="font-medium">{a.severity || 'alert'}</span>
                                    {' — '}{a.message || 'No detail recorded'}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {recommendations.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc ps-5 space-y-1 text-sm text-gray-700">
                            {recommendations.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <p className="text-xs text-slate-500 leading-relaxed">
                Quality monitoring is held in memory for the lifetime of the service and
                is not a historical record — figures reset when the backend restarts.
                Anything shown here describes what has been recorded since then.
            </p>
        </div>
    );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-md border border-gray-200 p-3">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
);

export default QualityAssuranceDashboard;
