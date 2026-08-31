import React, { useEffect, useState } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Loader2, Info, Users } from 'lucide-react';
import { roleLabel, langOf } from '@/utils/enumLabels';

/**
 * Who is on the platform — counted, not estimated.
 *
 * WHAT THIS SCREEN USED TO BE
 *
 * Surveyed out of fb_1788181600. It reported 1,247 users when the platform
 * held 38,339, a role split invented to round numbers (45/25/15/10/5), five
 * named articles with view counts that were never written, and a full
 * infrastructure console — CPU, memory, disk, network, error rate, "99.8%
 * uptime" — for infrastructure this platform does not monitor.
 *
 * The worst part was that it MOVED. Those figures came from Math.random() on a
 * thirty-second refresh, so an administrator watching it saw CPU fluctuate and
 * had every reason to believe they were looking at a live system.
 *
 * WHAT IT IS NOW
 *
 * The user analytics the platform can actually answer, from
 * /api/admin/users/statistics: how many people, how they divide by role, how
 * many arrived recently. On 2026-08-31 that is 38,339 people, 38,312 of them
 * candidates.
 *
 * The infrastructure panels are GONE rather than emptied. This platform does
 * not collect CPU, memory or uptime, and a console that reports them from
 * nowhere is worse than a console that does not offer them — an administrator
 * would trust it during an incident. Server health lives with the people who
 * run the servers.
 *
 * Content analytics are likewise absent until there is content: cms_content
 * holds nothing today, and five invented articles were how that was hidden.
 */

interface Stats {
    total_users?: number;
    active_users?: number;
    new_users_today?: number;
    new_users_this_week?: number;
    new_users_this_month?: number;
    users_by_role?: Record<string, number>;
}

const PALETTE = ['#0F766E', '#0891B2', '#CA8A04', '#7C3AED', '#DC2626', '#059669', '#DB2777'];

const InfrastructureNote: React.FC = () => (
    <div className="flex items-start gap-2 rounded-md bg-slate-50 border border-slate-200 p-3">
        <Info className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600 leading-relaxed">
            Server health — processor, memory, uptime, error rates — is not
            collected by this platform and is not shown here. This screen
            previously displayed those figures; they were generated, not
            measured. Infrastructure monitoring sits with the team that runs
            the servers.
        </p>
    </div>
);

const SystemAnalytics: React.FC = () => {
    // Read the direction from the document rather than the language context.
    // This component is embeddable, and a panel that throws without a provider
    // is a panel nobody can drop into a page — the same reason
    // YouthConsentPage reads it this way.
    const lang = langOf((document.documentElement.lang || '').startsWith('ar'));
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await restClient.get('/api/admin/users/statistics');
                if (cancelled) return;
                setStats(res.data?.data || res.data || null);
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
                <Loader2 className="h-4 w-4 animate-spin" /> Counting…
            </div>
        );
    }

    if (failed || !stats) {
        return (
            <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">System Analytics</h2>
                <p className="text-sm text-gray-600 mb-4">
                    The user statistics could not be loaded. Nothing is shown rather than
                    an estimate.
                </p>
                <InfrastructureNote />
            </div>
        );
    }

    const roles = Object.entries(stats.users_by_role || {})
        .sort((a, b) => b[1] - a[1]);
    const total = stats.total_users || 0;

    // The distribution is dominated by one role by design — a platform for job
    // seekers. A pie of everything hides the staff entirely, so the staff roles
    // are charted separately rather than rendered as invisible slivers.
    const [largest, ...rest] = roles;
    const staff = rest.filter(([, n]) => n > 0);

    return (
        <div className="space-y-6 p-1">
            <div>
                <h2 className="text-xl font-bold text-gray-900">System Analytics</h2>
                <p className="text-sm text-gray-500">
                    Counted from the platform's own records.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="People on the platform" value={total.toLocaleString()} />
                <Stat label="Active" value={(stats.active_users ?? 0).toLocaleString()} />
                <Stat label="Joined this week" value={String(stats.new_users_this_week ?? 0)} />
                <Stat label="Joined this month" value={(stats.new_users_this_month ?? 0).toLocaleString()} />
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" /> How the platform divides by role
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {roles.length === 0 ? (
                        <p className="text-sm text-gray-500">No roles are recorded yet.</p>
                    ) : (
                        <>
                            {largest && (
                                <p className="text-sm text-gray-700 mb-4">
                                    <span className="font-semibold">
                                        {roleLabel(largest[0], lang)}
                                    </span>{' '}
                                    accounts for {largest[1].toLocaleString()} of {total.toLocaleString()}
                                    {total > 0 && ` (${Math.round((largest[1] / total) * 100)}%)`}.
                                </p>
                            )}

                            {staff.length > 0 && (
                                <>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Every other role, counted separately so it is visible
                                    </p>
                                    <div style={{ width: '100%', height: Math.max(160, staff.length * 26) }}>
                                        <ResponsiveContainer>
                                            <BarChart layout="vertical"
                                                      data={staff.map(([role, n]) => ({ role: roleLabel(role, lang), n }))}
                                                      margin={{ left: 8, right: 16 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                                <YAxis type="category" dataKey="role" width={190}
                                                       tick={{ fontSize: 11 }} />
                                                <Tooltip />
                                                <Bar dataKey="n" fill="#0F766E" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}

                            <div style={{ width: '100%', height: 220 }} className="mt-4">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={roles.map(([role, n]) => ({ name: roleLabel(role, lang), value: n }))}
                                             dataKey="value" nameKey="name" outerRadius={80} label={false}>
                                            {roles.map((_r, i) => (
                                                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <InfrastructureNote />
        </div>
    );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-md border border-gray-200 p-3">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
);

export default SystemAnalytics;
