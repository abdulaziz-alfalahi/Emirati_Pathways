import React, { useEffect, useState } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Info } from 'lucide-react';

/**
 * Competency validation — and an honest account of why it is empty.
 *
 * Surveyed out of fb_1788181600. This screen charted 12 literal rows and
 * fetched nothing: competency scores ({ subject: 'Technical Skills', A: 85 })
 * for candidates who do not exist, on a radar chart that looked like the
 * output of a real validation.
 *
 * WHY IT IS NOT SIMPLY WIRED UP LIKE ITS SIBLINGS
 *
 * There is no competency endpoint to call, and `competency_models` holds zero
 * rows. Nothing defines what a competency IS on this platform yet, so there is
 * nothing to validate against and nothing to score. Inventing a framework in
 * the frontend is how the original numbers came to exist.
 *
 * So this screen reads the assessor's real assessments — the raw material any
 * competency judgement would be built from — and states plainly that the
 * framework itself is not yet defined. It becomes a real validation screen
 * when somebody defines the competencies, and not before.
 */

interface Assessment {
    id?: string | number;
    assessment_title?: string;
    status?: string;
    candidate_name?: string;
    assessment_mode?: string;
    percentage_score?: number | null;
}

const CompetencyValidation: React.FC = () => {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await restClient.get('/api/assessor/applications');
                if (cancelled) return;
                const list = res.data?.applications || res.data?.data || [];
                setAssessments(Array.isArray(list) ? list : []);
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
                <Loader2 className="h-4 w-4 animate-spin" /> Loading assessments…
            </div>
        );
    }

    return (
        <div className="space-y-4 p-1">
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                <Info className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-900 leading-relaxed">
                    <span className="font-semibold">No competency framework is defined yet.</span>{' '}
                    Competency scores need a set of competencies to score against, and none
                    have been recorded on the platform. Until they are, this screen shows
                    the assessments themselves rather than scores derived from a framework
                    that does not exist.
                </p>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                        Assessments available to validate
                        {assessments.length > 0 && ` (${assessments.length})`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {failed ? (
                        <p className="text-sm text-gray-600">
                            The assessment list could not be loaded.
                        </p>
                    ) : assessments.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No assessments have been recorded yet. This list fills in as
                            assessments are scheduled and completed.
                        </p>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {assessments.map((a, i) => (
                                <div key={a.id ?? i} className="flex items-center justify-between py-2.5">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {a.assessment_title || 'Assessment'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {[a.candidate_name, a.assessment_mode]
                                                .filter(Boolean).join(' · ') || '—'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {/* Absent is absent. A missing score is not a zero. */}
                                        <p className="text-sm font-semibold text-gray-800">
                                            {a.percentage_score === null || a.percentage_score === undefined
                                                ? '—' : `${a.percentage_score}%`}
                                        </p>
                                        <p className="text-[11px] text-gray-400">{a.status || ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CompetencyValidation;
