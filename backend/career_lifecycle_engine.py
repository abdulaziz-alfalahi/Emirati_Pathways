"""
Career Lifecycle Navigator — Stage-based career journey intelligence.
Tracks where each user is in their career journey and orchestrates interventions.

Stages: Discovery → Assessment → Upskilling → Entry → Growth → Leadership → Entrepreneurship → Legacy
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class LifecycleStage(str, Enum):
    DISCOVERY = "discovery"             # Student/exploring specialization
    ASSESSMENT = "assessment"           # Taking assessments, building profile
    UPSKILLING = "upskilling"           # Training, certifications, courses
    ENTRY = "entry"                     # First job search, CV building, interviews
    GROWTH = "growth"                   # Advancing career, deeper expertise
    LEADERSHIP = "leadership"           # Managing teams, thought leadership
    ENTREPRENEURSHIP = "entrepreneurship"  # Starting a business
    LEGACY = "legacy"                   # Retiree, mentoring next generation

    @property
    def order(self) -> int:
        return list(LifecycleStage).index(self)

    @property
    def label_ar(self) -> str:
        return {
            "discovery": "الاكتشاف",
            "assessment": "التقييم",
            "upskilling": "تطوير المهارات",
            "entry": "دخول سوق العمل",
            "growth": "النمو المهني",
            "leadership": "القيادة",
            "entrepreneurship": "ريادة الأعمال",
            "legacy": "الإرث"
        }[self.value]


# Milestones that trigger stage transitions
STAGE_MILESTONES = {
    LifecycleStage.DISCOVERY: [
        {"id": "specialization_quiz", "name": "Complete Specialization Quiz", "name_ar": "إكمال اختبار التخصص"},
        {"id": "explore_industries", "name": "Explore 3+ Industries", "name_ar": "استكشاف 3+ صناعات"},
        {"id": "set_career_goal", "name": "Set Career Goal", "name_ar": "تحديد هدف مهني"},
    ],
    LifecycleStage.ASSESSMENT: [
        {"id": "complete_assessment", "name": "Complete Skills Assessment", "name_ar": "إكمال تقييم المهارات"},
        {"id": "build_cv", "name": "Build CV", "name_ar": "إنشاء السيرة الذاتية"},
        {"id": "profile_complete", "name": "Complete Profile (80%+)", "name_ar": "إكمال الملف الشخصي (80%+)"},
    ],
    LifecycleStage.UPSKILLING: [
        {"id": "complete_course", "name": "Complete 1+ Course", "name_ar": "إكمال دورة واحدة على الأقل"},
        {"id": "earn_cert", "name": "Earn Certification", "name_ar": "الحصول على شهادة"},
        {"id": "get_mentor", "name": "Get Matched with Mentor", "name_ar": "التواصل مع مرشد"},
    ],
    LifecycleStage.ENTRY: [
        {"id": "apply_jobs", "name": "Apply to 5+ Jobs", "name_ar": "التقدم لـ 5+ وظائف"},
        {"id": "complete_interview", "name": "Complete Interview", "name_ar": "إكمال مقابلة"},
        {"id": "get_hired", "name": "Get Hired", "name_ar": "الحصول على وظيفة"},
    ],
    LifecycleStage.GROWTH: [
        {"id": "advanced_cert", "name": "Earn Advanced Certification", "name_ar": "الحصول على شهادة متقدمة"},
        {"id": "promotion", "name": "Get Promotion", "name_ar": "الحصول على ترقية"},
        {"id": "join_community", "name": "Join Professional Community", "name_ar": "الانضمام لمجتمع مهني"},
    ],
    LifecycleStage.LEADERSHIP: [
        {"id": "manage_team", "name": "Manage Team", "name_ar": "إدارة فريق"},
        {"id": "publish_thought_leadership", "name": "Publish Thought Leadership", "name_ar": "نشر محتوى قيادي"},
        {"id": "become_mentor", "name": "Become a Mentor", "name_ar": "أصبح مرشداً"},
    ],
    LifecycleStage.ENTREPRENEURSHIP: [
        {"id": "startup_idea", "name": "Submit Startup Idea", "name_ar": "تقديم فكرة شركة ناشئة"},
        {"id": "get_funding", "name": "Secure Funding", "name_ar": "الحصول على تمويل"},
        {"id": "launch_business", "name": "Launch Business", "name_ar": "إطلاق المشروع"},
    ],
    LifecycleStage.LEGACY: [
        {"id": "mentor_others", "name": "Mentor 5+ Professionals", "name_ar": "إرشاد 5+ محترفين"},
        {"id": "share_story", "name": "Share Success Story", "name_ar": "مشاركة قصة نجاح"},
        {"id": "volunteer", "name": "Volunteer as Advisor", "name_ar": "التطوع كمستشار"},
    ],
}


class CareerLifecycleEngine:
    """
    Tracks and manages user career lifecycle stages.
    Orchestrates stage transitions and recommends stage-appropriate actions.
    """

    def __init__(self, db_connection=None):
        self.db = db_connection
        logger.info("CareerLifecycleEngine initialized")

    def get_user_stage(self, user_id: int) -> Dict[str, Any]:
        """Get the current lifecycle stage for a user."""
        if not self.db:
            return self._default_stage(user_id)
        try:
            cursor = self.db.cursor()
            cursor.execute("""
                SELECT stage, entered_at, milestones_completed, total_milestones, progress_pct
                FROM user_lifecycle_stage WHERE user_id = %s
            """, (user_id,))
            row = cursor.fetchone()
            if row:
                stage = LifecycleStage(row[0])
                return {
                    "user_id": user_id,
                    "current_stage": stage.value,
                    "stage_label": stage.name.replace('_', ' ').title(),
                    "stage_label_ar": stage.label_ar,
                    "stage_order": stage.order,
                    "entered_at": row[1].isoformat() if row[1] else None,
                    "milestones_completed": row[2] or 0,
                    "total_milestones": row[3] or len(STAGE_MILESTONES.get(stage, [])),
                    "progress_pct": row[4] or 0,
                    "milestones": self._get_milestones(user_id, stage),
                    "next_stage": self._get_next_stage(stage),
                    "all_stages": self._get_all_stages()
                }
            return self._infer_and_persist(user_id)
        except Exception as e:
            logger.error(f"Error getting user stage: {e}")
            return self._default_stage(user_id)

    def _infer_signals(self, user_id) -> Dict[str, Any]:
        """Best-effort profile signals for stage inference. Each query is isolated so a
        missing table/column never breaks inference."""
        sig = {'work_status': None, 'job_seeker_type': None, 'has_profile': False,
               'has_cv': False, 'apps': 0, 'assessments': 0}
        if not self.db:
            return sig
        uid = str(user_id)

        def scalar(sql, default=None):
            try:
                cur = self.db.cursor()
                cur.execute(sql, (uid,))
                r = cur.fetchone()
                cur.close()
                return r[0] if r and r[0] is not None else default
            except Exception:
                try:
                    self.db.rollback()
                except Exception:
                    pass
                return default

        sig['work_status'] = scalar("SELECT work_status FROM candidate_profiles WHERE user_id::text = %s")
        sig['job_seeker_type'] = scalar("SELECT job_seeker_type FROM candidate_profiles WHERE user_id::text = %s")
        try:
            cur = self.db.cursor()
            cur.execute("SELECT headline, bio FROM candidate_profiles WHERE user_id::text = %s", (uid,))
            hb = cur.fetchone()
            cur.close()
            if hb:
                sig['has_profile'] = bool((hb[0] and str(hb[0]).strip()) or (hb[1] and str(hb[1]).strip()))
        except Exception:
            try:
                self.db.rollback()
            except Exception:
                pass
        sig['has_cv'] = (scalar("SELECT count(*) FROM user_cvs WHERE user_id::text = %s", 0) or 0) > 0
        sig['apps'] = scalar("SELECT count(*) FROM job_applications WHERE candidate_id::text = %s", 0) or 0
        sig['assessments'] = scalar("SELECT count(*) FROM assessments WHERE candidate_id::text = %s", 0) or 0
        return sig

    def _milestone_done(self, milestone_id: str, sig: Dict[str, Any]) -> bool:
        """Whether a specific milestone is clearly evidenced by the profile signals."""
        ws = (sig.get('work_status') or '').strip().lower()
        m = milestone_id
        if m == 'build_cv':
            return bool(sig.get('has_cv'))
        if m in ('profile_complete', 'set_career_goal', 'explore_industries'):
            return bool(sig.get('has_profile'))
        if m == 'complete_assessment':
            return (sig.get('assessments') or 0) >= 1
        if m == 'apply_jobs':
            return (sig.get('apps') or 0) >= 5
        if m == 'get_hired':
            return ws == 'working'
        return False

    def infer_stage(self, user_id):
        """Infer a user's lifecycle stage from profile signals.
        Returns (LifecycleStage, [completed_milestone_ids])."""
        sig = self._infer_signals(user_id)
        ws = (sig.get('work_status') or '').strip().lower()
        apps = sig.get('apps') or 0
        has_cv = bool(sig.get('has_cv'))
        assess = sig.get('assessments') or 0
        has_profile = bool(sig.get('has_profile'))

        if ws == 'retired':
            stage = LifecycleStage.LEGACY
        elif ws == 'working':
            stage = LifecycleStage.GROWTH
        elif ws == 'not working' or apps >= 1 or has_cv:
            # Explicitly job-seeking, or showing job-search activity -> Career Entry.
            stage = LifecycleStage.ENTRY
        elif assess >= 1:
            stage = LifecycleStage.UPSKILLING
        elif has_profile:
            stage = LifecycleStage.ASSESSMENT
        else:
            stage = LifecycleStage.DISCOVERY

        done_ids = [m['id'] for m in STAGE_MILESTONES.get(stage, []) if self._milestone_done(m['id'], sig)]
        return stage, done_ids

    def _stage_payload(self, user_id, stage, done, total, progress, entered_at=None):
        return {
            "user_id": user_id,
            "current_stage": stage.value,
            "stage_label": stage.name.replace('_', ' ').title(),
            "stage_label_ar": stage.label_ar,
            "stage_order": stage.order,
            "entered_at": entered_at,
            "milestones_completed": done,
            "total_milestones": total,
            "progress_pct": progress,
            "milestones": self._get_milestones(user_id, stage),
            "next_stage": self._get_next_stage(stage),
            "all_stages": self._get_all_stages(),
        }

    def _infer_and_persist(self, user_id):
        """Infer a user's stage from profile data and persist it (used when no lifecycle
        row exists yet). Falls back to the static default if inference/persist fails."""
        try:
            stage, done_ids = self.infer_stage(user_id)
        except Exception as e:
            logger.warning(f"Stage inference failed for user {user_id}: {e}")
            return self._default_stage(user_id)
        total = len(STAGE_MILESTONES.get(stage, []))
        done = len(done_ids)
        progress = round(done / max(total, 1) * 100)
        if self.db:
            try:
                cur = self.db.cursor()
                cur.execute("""
                    INSERT INTO user_lifecycle_stage (user_id, stage, entered_at,
                        milestones_completed, total_milestones, progress_pct)
                    VALUES (%s, %s, NOW(), %s, %s, %s)
                    ON CONFLICT (user_id) DO NOTHING
                """, (str(user_id), stage.value, done, total, progress))
                for mid in done_ids:
                    cur.execute("""
                        INSERT INTO lifecycle_milestones (user_id, milestone_id, completed_at)
                        VALUES (%s, %s, NOW())
                        ON CONFLICT (user_id, milestone_id) DO NOTHING
                    """, (str(user_id), mid))
                self.db.commit()
            except Exception as e:
                logger.warning(f"Stage persist failed for user {user_id}: {e}")
                try:
                    self.db.rollback()
                except Exception:
                    pass
        return self._stage_payload(user_id, stage, done, total, progress)

    def backfill_stages(self, limit=None):
        """One-time backfill: infer + persist a lifecycle stage for every candidate user
        that has no lifecycle row yet. Returns a summary dict."""
        if not self.db:
            return {"error": "no_db"}
        try:
            cur = self.db.cursor()
            sql = ("SELECT u.id FROM users u "
                   "WHERE (u.role = 'candidate' OR u.user_type = 'candidate') "
                   "AND NOT EXISTS (SELECT 1 FROM user_lifecycle_stage l "
                   "WHERE l.user_id::text = u.id::text) ORDER BY u.id")
            if limit:
                sql += " LIMIT %d" % int(limit)
            cur.execute(sql)
            ids = [r[0] for r in cur.fetchall()]
        except Exception as e:
            logger.error(f"Backfill query failed: {e}")
            try:
                self.db.rollback()
            except Exception:
                pass
            return {"error": str(e)}
        by_stage = {}
        processed = 0
        for uid in ids:
            try:
                payload = self._infer_and_persist(uid)
                st = payload.get('current_stage', 'unknown')
                by_stage[st] = by_stage.get(st, 0) + 1
                processed += 1
            except Exception as e:
                logger.warning(f"Backfill failed for user {uid}: {e}")
                try:
                    self.db.rollback()
                except Exception:
                    pass
        return {"processed": processed, "candidates_without_row": len(ids), "by_stage": by_stage}

    def initialize_user_stage(self, user_id: int, role: str = "candidate") -> Dict[str, Any]:
        """Initialize lifecycle stage for a new user based on role."""
        stage_map = {
            'candidate': LifecycleStage.DISCOVERY,
            "candidate": LifecycleStage.ASSESSMENT,
            'candidate': LifecycleStage.ENTRY,
            "mentor": LifecycleStage.LEADERSHIP,
            'employer_admin': LifecycleStage.GROWTH,
            'candidate': LifecycleStage.LEGACY,
        }
        stage = stage_map.get(role, LifecycleStage.DISCOVERY)

        if not self.db:
            return {"user_id": user_id, "stage": stage.value, "status": "no_db"}
        try:
            milestones = STAGE_MILESTONES.get(stage, [])
            cursor = self.db.cursor()
            cursor.execute("""
                INSERT INTO user_lifecycle_stage (user_id, stage, entered_at,
                    milestones_completed, total_milestones, progress_pct)
                VALUES (%s, %s, NOW(), 0, %s, 0)
                ON CONFLICT (user_id) DO UPDATE SET
                    stage = EXCLUDED.stage,
                    entered_at = NOW(),
                    milestones_completed = 0,
                    total_milestones = EXCLUDED.total_milestones,
                    progress_pct = 0
                RETURNING *
            """, (user_id, stage.value, len(milestones)))
            self.db.commit()
            return {"user_id": user_id, "stage": stage.value, "status": "initialized"}
        except Exception as e:
            logger.error(f"Error initializing stage: {e}")
            self.db.rollback()
            return {"error": str(e)}

    def complete_milestone(self, user_id: int, milestone_id: str) -> Dict[str, Any]:
        """Mark a milestone as completed. May trigger stage transition."""
        if not self.db:
            return {"status": "no_db"}
        try:
            cursor = self.db.cursor()

            # Record milestone
            cursor.execute("""
                INSERT INTO lifecycle_milestones (user_id, milestone_id, completed_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (user_id, milestone_id) DO NOTHING
            """, (user_id, milestone_id))

            # Get current stage
            stage_info = self.get_user_stage(user_id)
            current_stage = LifecycleStage(stage_info['current_stage'])

            # Count completed milestones for current stage
            stage_milestones = STAGE_MILESTONES.get(current_stage, [])
            milestone_ids = [m['id'] for m in stage_milestones]
            cursor.execute("""
                SELECT milestone_id FROM lifecycle_milestones
                WHERE user_id = %s AND milestone_id = ANY(%s)
            """, (user_id, milestone_ids))
            completed = cursor.fetchall()
            completed_count = len(completed)
            total = len(stage_milestones)
            progress = round((completed_count / max(total, 1)) * 100)

            # Update progress
            cursor.execute("""
                UPDATE user_lifecycle_stage
                SET milestones_completed = %s, progress_pct = %s
                WHERE user_id = %s
            """, (completed_count, progress, user_id))

            result = {
                "milestone_id": milestone_id,
                "completed_count": completed_count,
                "total": total,
                "progress_pct": progress,
                "stage_transition": None
            }

            # Check for stage transition (if all milestones complete)
            if completed_count >= total and total > 0:
                next_stage = self._get_next_stage(current_stage)
                if next_stage:
                    transition = self.advance_stage(user_id, next_stage['value'])
                    result['stage_transition'] = transition

            self.db.commit()
            return result
        except Exception as e:
            logger.error(f"Error completing milestone: {e}")
            self.db.rollback()
            return {"error": str(e)}

    def advance_stage(self, user_id: int, new_stage: str) -> Dict[str, Any]:
        """Manually advance a user to a new stage."""
        if not self.db:
            return {"status": "no_db"}
        try:
            stage = LifecycleStage(new_stage)
            milestones = STAGE_MILESTONES.get(stage, [])
            cursor = self.db.cursor()

            # Record transition
            cursor.execute("""
                INSERT INTO stage_transitions (user_id, from_stage, to_stage, transitioned_at)
                SELECT %s, stage, %s, NOW()
                FROM user_lifecycle_stage WHERE user_id = %s
            """, (user_id, new_stage, user_id))

            # Update current stage
            cursor.execute("""
                UPDATE user_lifecycle_stage
                SET stage = %s, entered_at = NOW(), milestones_completed = 0,
                    total_milestones = %s, progress_pct = 0
                WHERE user_id = %s
            """, (new_stage, len(milestones), user_id))

            self.db.commit()
            logger.info(f"User {user_id} advanced to stage: {new_stage}")
            return {
                "user_id": user_id,
                "new_stage": new_stage,
                "stage_label": stage.name.replace('_', ' ').title(),
                "stage_label_ar": stage.label_ar,
                "status": "transitioned"
            }
        except Exception as e:
            logger.error(f"Error advancing stage: {e}")
            self.db.rollback()
            return {"error": str(e)}

    def get_stage_recommendations(self, user_id: int) -> List[Dict[str, Any]]:
        """Get stage-appropriate recommendations for the user."""
        stage_info = self.get_user_stage(user_id)
        stage = stage_info.get('current_stage', 'discovery')
        stage_actions = {
            "discovery": [
                {"action": "Take Specialization Quiz", "action_ar": "إجراء اختبار التخصص", "url": "/assessments", "icon": "🎯"},
                {"action": "Explore Industries", "action_ar": "استكشاف الصناعات", "url": "/industry-exploration", "icon": "🔍"},
                {"action": "Browse School Programs", "action_ar": "تصفح البرامج المدرسية", "url": "/school-programs", "icon": "📚"},
            ],
            "assessment": [
                {"action": "Complete Skills Assessment", "action_ar": "إكمال تقييم المهارات", "url": "/assessments", "icon": "📊"},
                {"action": "Build Your CV", "action_ar": "إنشاء سيرتك الذاتية", "url": "/cv-builder", "icon": "📄"},
                {"action": "Complete Your Profile", "action_ar": "أكمل ملفك الشخصي", "url": "/candidate/profile", "icon": "👤"},
            ],
            "upskilling": [
                {"action": "Browse Training Programs", "action_ar": "تصفح البرامج التدريبية", "url": "/training", "icon": "📚"},
                {"action": "Find a Mentor", "action_ar": "ابحث عن مرشد", "url": "/mentorship", "icon": "🤝"},
                {"action": "Pursue Certification", "action_ar": "احصل على شهادة", "url": "/professional-certifications", "icon": "📜"},
            ],
            "entry": [
                {"action": "Browse Job Matches", "action_ar": "تصفح الوظائف المناسبة", "url": "/job-matching", "icon": "💼"},
                {"action": "Prepare for Interviews", "action_ar": "الاستعداد للمقابلات", "url": "/interview-preparation", "icon": "🎤"},
                {"action": "Browse Internships", "action_ar": "تصفح التدريب العملي", "url": "/internships", "icon": "🏢"},
            ],
            "growth": [
                {"action": "Advanced Certifications", "action_ar": "شهادات متقدمة", "url": "/professional-certifications", "icon": "🏆"},
                {"action": "Join Professional Community", "action_ar": "انضم لمجتمع مهني", "url": "/communities", "icon": "👥"},
                {"action": "View Analytics", "action_ar": "عرض التحليلات", "url": "/analytics", "icon": "📈"},
            ],
            "leadership": [
                {"action": "Become a Mentor", "action_ar": "كن مرشداً", "url": "/mentorship", "icon": "🌟"},
                {"action": "Share Thought Leadership", "action_ar": "شارك محتوى قيادي", "url": "/thought-leadership", "icon": "💡"},
                {"action": "Management Training", "action_ar": "تدريب إداري", "url": "/training", "icon": "👔"},
            ],
            "entrepreneurship": [
                {"action": "Launch Your Startup", "action_ar": "أطلق مشروعك", "url": "/startup-launchpad", "icon": "🚀"},
                {"action": "Find Business Mentors", "action_ar": "ابحث عن مرشدين أعمال", "url": "/mentorship", "icon": "🤝"},
                {"action": "Browse Gig Marketplace", "action_ar": "تصفح سوق المشاريع", "url": "/gig-marketplace", "icon": "💰"},
            ],
            "legacy": [
                {"action": "Mentor Young Professionals", "action_ar": "إرشاد المحترفين الشباب", "url": "/mentorship", "icon": "🌱"},
                {"action": "Share Your Success Story", "action_ar": "شارك قصة نجاحك", "url": "/share-success-stories", "icon": "📖"},
                {"action": "Volunteer as Advisor", "action_ar": "تطوع كمستشار", "url": "/career-advisory", "icon": "🎓"},
            ],
        }
        return stage_actions.get(stage, stage_actions['discovery'])

    # ──────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────

    def _default_stage(self, user_id: int) -> Dict[str, Any]:
        stage = LifecycleStage.DISCOVERY
        return {
            "user_id": user_id,
            "current_stage": stage.value,
            "stage_label": "Discovery",
            "stage_label_ar": stage.label_ar,
            "stage_order": 0,
            "entered_at": None,
            "milestones_completed": 0,
            "total_milestones": len(STAGE_MILESTONES[stage]),
            "progress_pct": 0,
            "milestones": [{"id": m["id"], "name": m["name"], "name_ar": m["name_ar"], "completed": False}
                          for m in STAGE_MILESTONES[stage]],
            "next_stage": self._get_next_stage(stage),
            "all_stages": self._get_all_stages()
        }

    def _get_milestones(self, user_id: int, stage: LifecycleStage) -> List[Dict[str, Any]]:
        """Get milestones for a stage with completion status."""
        milestones = STAGE_MILESTONES.get(stage, [])
        completed_ids = set()
        if self.db:
            try:
                cursor = self.db.cursor()
                cursor.execute("""
                    SELECT milestone_id FROM lifecycle_milestones WHERE user_id = %s
                """, (user_id,))
                completed_ids = {row[0] for row in cursor.fetchall()}
            except Exception:
                pass
        return [
            {**m, "completed": m["id"] in completed_ids}
            for m in milestones
        ]

    def _get_next_stage(self, current: LifecycleStage) -> Optional[Dict[str, str]]:
        stages = list(LifecycleStage)
        idx = stages.index(current)
        if idx + 1 < len(stages):
            n = stages[idx + 1]
            return {"value": n.value, "label": n.name.replace('_', ' ').title(), "label_ar": n.label_ar}
        return None

    def _get_all_stages(self) -> List[Dict[str, Any]]:
        return [
            {"value": s.value, "label": s.name.replace('_', ' ').title(),
             "label_ar": s.label_ar, "order": s.order}
            for s in LifecycleStage
        ]
