import { Assessment } from '@/types/assessments';

/**
 * Assessment reads used to go straight to Supabase tables ('assessments',
 * 'assessment_sessions'). Supabase was removed from the platform and no Flask
 * endpoint exposes that shape yet, so these cannot return real data.
 *
 * Until this is wired up, every method below referenced a `supabase` global
 * that does not exist. That threw a ReferenceError on the first line, the catch
 * swallowed it, and callers received [] / null — an empty assessment list is
 * indistinguishable from "this user has no assessments", so the UI showed an
 * empty state as if it were the truth.
 *
 * The return values are unchanged, so no caller's behaviour changes, but the
 * reason is now stated explicitly instead of masquerading as a lookup that ran.
 * Wiring these to the real API is a feature, not a cleanup: the live
 * /api/skills/assessments endpoint returns a skill taxonomy and catalogue whose
 * shape does not match the Assessment type used here, so it needs a deliberate
 * mapping rather than a silent substitution.
 */
const NOT_WIRED = 'not implemented against the Flask API (Supabase was removed)';

export class AssessmentCore {
  async getAssessments(): Promise<Assessment[]> {
    console.warn(`AssessmentCore.getAssessments: ${NOT_WIRED} — returning no assessments`);
    return [];
  }

  async getAssessmentById(id: string): Promise<Assessment | null> {
    console.warn(`AssessmentCore.getAssessmentById(${id}): ${NOT_WIRED}`);
    return null;
  }

  async createAssessmentSession(assessmentId: string, userId: string) {
    console.warn(
      `AssessmentCore.createAssessmentSession(${assessmentId}, ${userId}): ${NOT_WIRED} — no session was created`
    );
    return null;
  }
}

export const assessmentCore = new AssessmentCore();
