import { useState, useEffect, useCallback, useRef } from 'react';
import { restClient } from '@/utils/api';

export interface OpsData {
    platform_health: {
        total_users: number;
        registrations_today: number;
        registrations_week: number;
        uptime: string;
        response_time: string;
    };
    talent_pipeline: {
        total_candidates: number;
        total_cvs: number;
        total_applications: number;
        applications_week: number;
        placements: number;
    };
    employer_activity: {
        total_companies: number;
        active_vacancies: number;
        total_jobs: number;
        new_jobs_week: number;
        total_offers: number;
        offers_week: number;
    };
    interview_tracker: {
        conducted_today: number;
        conducted_week: number;
        ongoing: number;
        upcoming_today: number;
        upcoming_week: number;
        total: number;
    };
    shortlist_stats: {
        shortlisted_week: number;
        rejected_week: number;
        shortlisted_total: number;
        rejected_total: number;
    };
    emiratization: {
        sectors: { name: string; total_jobs: number; target: number }[];
    };
    role_distribution: Record<string, number>;
    live_feed: { text: string; time: string; type: string; relative: string }[];
}

export interface FunnelData {
    signups?: number;
    profile_completion?: number;
    job_applications?: number;
}

/** How the feed is doing. Drives the wall display's stale-data banner.
 *  A frozen dashboard looks identical to a calm one — so this must be explicit. */
export type FeedStatus = 'live' | 'stale' | 'down';

const REFRESH_MS = 30_000;
/** Two missed refreshes — the data is behind but the feed may recover. */
const STALE_AFTER_MS = 90_000;
/** Five missed refreshes — treat the feed as down; do not present numbers as current. */
const DOWN_AFTER_MS = 180_000;

export interface UseOperationsDataResult {
    data: OpsData | null;
    funnelData: FunnelData | null;
    loading: boolean;
    error: string;
    /** Wall-clock of the last SUCCESSFUL fetch — null until the first one lands. */
    lastUpdatedAt: Date | null;
    /** Seconds since the last successful fetch; ticks every second. */
    secondsSinceUpdate: number;
    feedStatus: FeedStatus;
    refresh: () => void;
}

/**
 * Shared data source for BOTH Operations Center surfaces:
 *   /operations-center          — at-desk, light, interactive
 *   /operations-center/display  — command-room wall display
 *
 * The two routes are different designs, not different data. Keeping the fetch,
 * the refresh cadence and the staleness rules here means the wall can never
 * silently disagree with the desk.
 *
 * Staleness is tracked against the last SUCCESSFUL fetch, not the last attempt:
 * an unattended wall display that keeps failing to refresh must look broken,
 * because a frozen dashboard is indistinguishable from a quiet one.
 */
export function useOperationsData(): UseOperationsDataResult {
    const [data, setData] = useState<OpsData | null>(null);
    const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
    const [now, setNow] = useState(() => Date.now());
    // Ref mirror so the ticking clock never re-subscribes the fetch loop.
    const lastUpdatedRef = useRef<number | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const [res, liveRes] = await Promise.all([
                restClient.get('/api/operations/stats'),
                restClient.get('/api/metrics/operations-live'),
            ]);

            let gotSomething = false;
            if (res.data?.success && res.data?.data) {
                setData(res.data.data);
                gotSomething = true;
            }
            if (liveRes.data?.success && liveRes.data?.data) {
                setFunnelData(liveRes.data.data.funnel_analytics ?? null);
                gotSomething = true;
            }

            if (gotSomething) {
                const stamp = Date.now();
                lastUpdatedRef.current = stamp;
                setLastUpdatedAt(new Date(stamp));
                setError('');
            }
        } catch (e: any) {
            console.error('Operations stats error:', e);
            // Keep the last good payload on screen; staleness is what signals trouble.
            setError(e?.message || 'Failed to load operations data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, REFRESH_MS);
        return () => clearInterval(interval);
    }, [fetchStats]);

    // One-second tick so "time since update" and the feed status stay honest
    // on a display nobody is touching.
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const sinceMs = lastUpdatedRef.current === null ? 0 : now - lastUpdatedRef.current;
    const secondsSinceUpdate = Math.max(0, Math.floor(sinceMs / 1000));

    let feedStatus: FeedStatus = 'live';
    if (lastUpdatedRef.current !== null) {
        if (sinceMs >= DOWN_AFTER_MS) feedStatus = 'down';
        else if (sinceMs >= STALE_AFTER_MS) feedStatus = 'stale';
    } else if (!loading && error) {
        // Never landed a payload at all.
        feedStatus = 'down';
    }

    return {
        data,
        funnelData,
        loading,
        error,
        lastUpdatedAt,
        secondsSinceUpdate,
        feedStatus,
        refresh: fetchStats,
    };
}
