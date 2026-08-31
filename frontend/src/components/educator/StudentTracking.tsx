import React, { useEffect, useState } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Info, Search } from 'lucide-react';

/**
 * The educator's own students — read, not invented.
 *
 * Surveyed out of fb_1788181600. This screen declared students and their
 * grades as literal arrays ({ subject: 'Mathematics', currentGrade: 88 }) and
 * fetched nothing. Those were academic records for people who do not exist.
 *
 * /api/educator/students has always returned the real roster, with a summary
 * and pagination. It was never called.
 *
 * TODAY THE ROSTER IS EMPTY — the platform holds zero students — and the
 * screen says so. That is the correct output before launch, and it becomes a
 * real roster the day an advisor enrols somebody, with no further work.
 */

interface Student {
    id?: string | number;
    student_id?: string;
    full_name?: string;
    name?: string;
    email?: string;
    status?: string;
    program?: string;
    gpa?: number | null;
}

const StudentTracking: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [query, setQuery] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await restClient.get('/api/educator/students');
                if (cancelled) return;
                setStudents(res.data?.students || []);
                setSummary(res.data?.summary || null);
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
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your students…
            </div>
        );
    }

    if (failed) {
        return (
            <div className="p-6 text-sm text-gray-600">
                The student list could not be loaded. Nothing is shown rather than a
                placeholder roster.
            </div>
        );
    }

    const q = query.trim().toLowerCase();
    const shown = q
        ? students.filter(s => [s.full_name, s.name, s.email, s.program, s.student_id]
            .some(v => (v || '').toString().toLowerCase().includes(q)))
        : students;

    return (
        <div className="space-y-4 p-1">
            <h2 className="text-xl font-bold text-gray-900">Student Tracking</h2>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                        Students {students.length > 0 && `(${students.length})`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* The search stays mounted even with an empty roster: it keeps
                        its label for assistive technology, and a control that appears
                        and disappears with the data is harder to use than one that
                        does not. */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search by name, email or programme"
                            aria-label="Search Students"
                            className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none"
                        />
                    </div>

                    {students.length === 0 ? (
                        <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                            <Info className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-slate-600">
                                No students are enrolled with you yet. Enrolment is recorded
                                by an Academic Advisor at the institution; this list fills in
                                as that happens. Nothing here is estimated in the meantime.
                            </p>
                        </div>
                    ) : (
                        <>
                            {shown.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    No student matches “{query}”.
                                </p>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {shown.map((s, i) => (
                                        <div key={s.id ?? s.student_id ?? i}
                                             className="flex items-center justify-between py-2.5">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {s.full_name || s.name || 'Name not recorded'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {[s.program, s.email].filter(Boolean).join(' · ') || '—'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {/* A missing GPA is shown as missing. It is not zero. */}
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {s.gpa === null || s.gpa === undefined ? '—' : s.gpa}
                                                </p>
                                                <p className="text-[11px] text-gray-400">{s.status || ''}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {summary && Object.keys(summary).length > 0 && (
                <p className="text-xs text-gray-500">
                    {Object.entries(summary)
                        .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
                        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                        .join(' · ')}
                </p>
            )}
        </div>
    );
};

export default StudentTracking;
