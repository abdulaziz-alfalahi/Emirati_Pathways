import React, { useEffect, useState } from 'react';
import { restClient } from '@/utils/api';
import {
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { Loader2, Info, AlertTriangle } from 'lucide-react';

/**
 * What the platform can actually say about a finished interview.
 *
 * REPORTED 2026-08-31, minutes after a real interview (fb_1788181600):
 * "I clicked on analytics after the interview and saw mock data in the tabs."
 *
 * Every figure on this screen was a hardcoded constant — the same for every
 * candidate and every interview:
 *
 *     overall score 88 · Culture Fit 92 · Leadership 80 · Technical 90
 *     sentiment "Positive" over ten invented time points
 *     keywords Leadership, React, System Design, Scalability
 *     duration 45:20        (the interview had run 14:21)
 *     speaking ratio 65/35  (which happened to be RIGHT, and that is the
 *                            reason nobody caught any of the rest)
 *
 * Those were judgements about a named person, in a government hiring process,
 * invented by nobody. The backend had never agreed to any of it: its report
 * endpoint has always refused to score without a real transcript and returns
 * `analysis_pending`. The truth was available and this screen discarded it.
 *
 * WHAT IT SHOWS NOW
 *
 * Measured facts, from the interview that happened: how long it ran, how the
 * talking was shared, how much was transcribed.
 *
 * And the AI assessment, computed from the platform's own transcript —
 * owner's decision 2026-08-31: "the final say will be with the recruiter and
 * the HR Manager. The AI analysis are to expedite the decision making
 * process." So it is shown, and it is labelled as what it is, every time,
 * where the reader cannot miss it. A score that gets mistaken for a verdict is
 * the failure mode this screen already had once.
 *
 * WHEN THERE IS NOTHING TO SAY, IT SAYS THAT. A withheld analysis names its
 * reason. A poor transcript is reported as a poor TRANSCRIPT — never as a
 * poor candidate.
 */

interface AnalyticsProps {
    interviewId: string;
}

interface Analysis {
    speech_quality?: number;
    engagement?: number;
    confidence?: number;
    sentiment?: string;
    speaking_pace?: string;
    filler_word_count?: number;
    topics?: string[];
    key_phrases?: string[];
    overall_impression?: string;
    transcript_quality?: number;
    analysed_at?: string;
}

interface Segment { name?: string; text?: string; }

const fmtDuration = (startedAt?: string, endedAt?: string): string | null => {
    if (!startedAt || !endedAt) return null;
    const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
    if (!Number.isFinite(ms) || ms <= 0) return null;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
};

const InterviewAnalytics: React.FC<AnalyticsProps> = ({ interviewId }) => {
    const [loading, setLoading] = useState(true);
    const [duration, setDuration] = useState<string | null>(null);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [withheld, setWithheld] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const [sess, tr] = await Promise.allSettled([
                    restClient.get(`/api/video-interview/sessions/${interviewId}`),
                    restClient.get(`/api/video-interview/sessions/${interviewId}/transcript`),
                ]);
                if (cancelled) return;

                if (sess.status === 'fulfilled') {
                    const d = sess.value.data?.data || {};
                    setDuration(fmtDuration(d.started_at, d.ended_at));
                }
                if (tr.status === 'fulfilled') {
                    setSegments(tr.value.data?.data?.segments || []);
                }

                // No body: the server analyses the transcript it holds, and
                // returns the stored assessment if one already exists.
                const res = await restClient.post(
                    `/api/video-interview/sessions/${interviewId}/analyze-transcript`, {});
                if (cancelled) return;
                const body = res.data || {};
                if (body.analysis_withheld) setWithheld(body.withheld_reason || 'analysis_unavailable');
                else if (body.analysis) setAnalysis(body.analysis);
                else setWithheld('analysis_unavailable');
            } catch {
                if (!cancelled) setWithheld('analysis_unavailable');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [interviewId]);

    // Measured, not modelled: who did the talking, by words actually recorded.
    const words: Record<string, number> = {};
    segments.forEach(s => {
        const who = s.name || 'Unknown';
        words[who] = (words[who] || 0) + (s.text || '').trim().split(/\s+/).filter(Boolean).length;
    });
    const totalWords = Object.values(words).reduce((a, b) => a + b, 0);

    if (loading) {
        return (
            <div className="flex items-center gap-2 p-6 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading the interview record…
            </div>
        );
    }

    const radar = analysis ? [
        { subject: 'Speech clarity', A: analysis.speech_quality ?? 0, fullMark: 100 },
        { subject: 'Engagement', A: analysis.engagement ?? 0, fullMark: 100 },
        { subject: 'Confidence', A: analysis.confidence ?? 0, fullMark: 100 },
    ] : [];

    return (
        <div className="space-y-5 p-1">
            {/* ── measured facts ─────────────────────────────────────────── */}
            <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">What was recorded</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Fact label="Duration" value={duration ?? 'Not recorded'} />
                    <Fact label="Transcribed segments"
                          value={segments.length ? String(segments.length) : 'None'} />
                    <Fact label="Words transcribed"
                          value={totalWords ? totalWords.toLocaleString() : '—'} />
                </div>

                {totalWords > 0 && (
                    <div className="mt-3">
                        <p className="text-xs text-slate-500 mb-1.5">Share of the talking, by words recorded</p>
                        <div className="flex h-6 rounded-md overflow-hidden border border-slate-200">
                            {Object.entries(words).sort((a, b) => b[1] - a[1]).map(([who, n], i) => (
                                <div key={who}
                                     title={`${who}: ${n} words`}
                                     style={{ width: `${(n / totalWords) * 100}%` }}
                                     className={`${i === 0 ? 'bg-teal-500' : 'bg-slate-400'} text-white text-[11px] flex items-center justify-center`}>
                                    {(n / totalWords) * 100 >= 12
                                        ? `${who} ${Math.round((n / totalWords) * 100)}%` : ''}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── the AI assessment, labelled ────────────────────────────── */}
            <div>
                <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5 mb-3">
                    <Info className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-900 leading-relaxed">
                        <span className="font-semibold">AI-generated assessment.</span>{' '}
                        Produced automatically from the interview transcript to speed up
                        review. It is advisory only — the hiring decision rests with the
                        recruiter and the HR Manager.
                    </p>
                </div>

                {withheld ? (
                    <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                        <AlertTriangle className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-slate-600">
                            {withheld === 'no_transcript' && (
                                <>No transcript was recorded for this interview, so there is
                                   nothing to assess.</>
                            )}
                            {withheld === 'transcript_quality' && (
                                <>The transcript was not a clear enough record of speech to
                                   assess. <span className="font-medium">This is a judgement
                                   about the recording, not about the candidate.</span></>
                            )}
                            {!['no_transcript', 'transcript_quality'].includes(withheld) && (
                                <>The assessment could not be produced for this interview.</>
                            )}
                        </div>
                    </div>
                ) : analysis ? (
                    <div className="space-y-4">
                        {analysis.overall_impression && (
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {analysis.overall_impression}
                            </p>
                        )}

                        {radar.some(r => r.A > 0) && (
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer>
                                    <RadarChart data={radar}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                        <Radar dataKey="A" stroke="#0F766E" fill="#0F766E" fillOpacity={0.35} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {analysis.sentiment && <Fact label="Tone" value={analysis.sentiment} />}
                            {analysis.speaking_pace && <Fact label="Pace" value={analysis.speaking_pace} />}
                            {typeof analysis.filler_word_count === 'number' && (
                                <Fact label="Filler words" value={String(analysis.filler_word_count)} />
                            )}
                        </div>

                        {!!analysis.topics?.length && (
                            <div>
                                <p className="text-xs text-slate-500 mb-1.5">Topics detected in the conversation</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {analysis.topics.map(t => (
                                        <span key={t} className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">{t}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {analysis.analysed_at && (
                            <p className="text-[11px] text-slate-400">
                                Assessed {new Date(analysis.analysed_at).toLocaleString()}
                            </p>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const Fact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-md border border-slate-200 p-2.5">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
    </div>
);

export default InterviewAnalytics;
