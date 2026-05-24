"""
Profile Readiness API — Holistic candidate readiness score.

Calculates a comprehensive score across 10 pillars:
  Foundation (15%), CV (15%), Experience (10%), Education (10%),
  Skills (10%), Assessments (10%), Career Direction (10%),
  Interview Readiness (5%), Certifications (5%), Engagement (10%)

This is distinct from the ATS Score (CV-specific quality metric).
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.db import get_db_connection
import psycopg2.extras
import logging
import uuid
import json

profile_readiness_bp = Blueprint('profile_readiness', __name__, url_prefix='/api/v2/profile')
logger = logging.getLogger(__name__)


def _normalize_uid(identity):
    """Normalize JWT identity to a consistent user_id string (EID CHAR(15))."""
    if isinstance(identity, dict):
        identity = identity.get('id')
    return str(identity).strip()


# ── Pillar definitions ──────────────────────────────────────────────
PILLARS = [
    {'key': 'foundation',    'label': 'Foundation',          'label_ar': 'الأساس',              'max': 15},
    {'key': 'cv',            'label': 'CV Uploaded',         'label_ar': 'السيرة الذاتية',       'max': 15},
    {'key': 'experience',    'label': 'Work Experience',     'label_ar': 'الخبرة المهنية',       'max': 10},
    {'key': 'education',     'label': 'Education',           'label_ar': 'التعليم',              'max': 10},
    {'key': 'skills',        'label': 'Skills',              'label_ar': 'المهارات',             'max': 10},
    {'key': 'assessments',   'label': 'Assessments',         'label_ar': 'التقييمات',            'max': 10},
    {'key': 'career',        'label': 'Career Direction',    'label_ar': 'التوجه المهني',        'max': 10},
    {'key': 'interview',     'label': 'Interview Ready',     'label_ar': 'جاهز للمقابلة',        'max': 5},
    {'key': 'certifications','label': 'Certifications',      'label_ar': 'الشهادات',             'max': 5},
    {'key': 'engagement',    'label': 'Engagement',          'label_ar': 'التفاعل',              'max': 10},
]


@profile_readiness_bp.route('/readiness', methods=['GET'])
@jwt_required()
def get_readiness():
    """
    Calculate holistic profile readiness across 10 pillars.

    Returns:
        {
            "success": true,
            "overall": 75,
            "pillars": [
                {"key": "foundation", "label": "Foundation", "score": 15, "max": 15, "complete": true},
                ...
            ],
            "next_action": "Record a 60-second video introduction",
            "next_action_ar": "سجّل مقدمة مرئية مدتها 60 ثانية"
        }
    """
    try:
        user_id = _normalize_uid(get_jwt_identity())
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # ── Fetch all data in one trip ──────────────────────────────
        cur.execute("""
            SELECT
                p.id                    AS profile_id,
                p.full_name,
                p.headline,
                p.bio,
                p.phone,
                p.location,
                p.video_intro_url,
                p.target_roles,
                p.expected_salary_range,
                p.willing_to_relocate,
                p.notice_period,

                -- CV count (user_cvs.user_id is UUID, p.user_id is varchar)
                (SELECT count(*) FROM user_cvs WHERE user_id = p.user_id)
                    AS cv_count,

                -- Experience count
                (SELECT count(*) FROM candidate_experience_entries WHERE user_id = p.user_id)
                    AS exp_count,

                -- Education count
                (SELECT count(*) FROM candidate_education_entries WHERE user_id = p.user_id)
                    AS edu_count,

                -- Skills count + verified count
                (SELECT count(*) FROM candidate_skills WHERE user_id = p.user_id)
                    AS skill_count,
                (SELECT count(*) FROM candidate_skills WHERE user_id = p.user_id AND is_verified = true)
                    AS verified_skill_count,

                -- Assessments completed
                (SELECT count(*) FROM candidate_assessments WHERE user_id = p.user_id AND status = 'completed')
                    AS assessment_count,

                -- Certifications
                (SELECT count(*) FROM candidate_certifications WHERE user_id = p.user_id)
                    AS cert_count,

                -- Job applications
                (SELECT count(*) FROM job_applications WHERE candidate_id = %s)
                    AS application_count

            FROM candidate_profiles p
            WHERE p.user_id = %s
        """, (user_id, user_id))

        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            # No profile at all — return zero with all pillars empty
            pillars = [
                {**p, 'score': 0, 'complete': False}
                for p in PILLARS
            ]
            return jsonify({
                'success': True,
                'overall': 0,
                'pillars': pillars,
                'next_action': 'Create your profile by uploading a CV',
                'next_action_ar': 'أنشئ ملفك الشخصي برفع سيرة ذاتية',
            }), 200

        # ── Score each pillar ───────────────────────────────────────
        scores = {}
        actions = []   # (priority, en, ar)

        # 1. Foundation (15 pts) — name, headline, bio, phone, location
        s = 0
        if row['full_name']:   s += 5
        else: actions.append((1, 'Add your full name', 'أضف اسمك الكامل'))
        if row['headline']:    s += 4
        else: actions.append((2, 'Write a professional headline', 'اكتب عنواناً مهنياً'))
        if row['bio']:         s += 3
        else: actions.append((3, 'Write a short bio about yourself', 'اكتب نبذة مختصرة عن نفسك'))
        if row['phone']:       s += 1.5
        if row['location']:    s += 1.5
        if not row['phone'] and not row['location']:
            actions.append((4, 'Add your contact details (phone & location)', 'أضف بيانات الاتصال'))
        scores['foundation'] = min(s, 15)

        # 2. CV Uploaded (15 pts)
        if row['cv_count'] > 0:
            scores['cv'] = 15
        else:
            scores['cv'] = 0
            actions.append((1, 'Upload your CV to auto-fill your profile', 'ارفع سيرتك الذاتية لملء ملفك تلقائياً'))

        # 3. Experience (10 pts) — having entries + depth
        if row['exp_count'] >= 3:
            scores['experience'] = 10
        elif row['exp_count'] >= 1:
            scores['experience'] = 7
            actions.append((6, f'Add more work experience ({row["exp_count"]} entered, aim for 3+)', f'أضف المزيد من الخبرة المهنية ({row["exp_count"]} مُدخل)'))
        else:
            scores['experience'] = 0
            actions.append((5, 'Add your work experience', 'أضف خبرتك المهنية'))

        # 4. Education (10 pts)
        if row['edu_count'] >= 1:
            scores['education'] = 10
        else:
            scores['education'] = 0
            actions.append((5, 'Add your educational background', 'أضف خلفيتك التعليمية'))

        # 5. Skills (10 pts) — count + verified bonus
        if row['skill_count'] >= 5:
            scores['skills'] = 8 if row['verified_skill_count'] == 0 else 10
            if row['verified_skill_count'] == 0:
                actions.append((8, 'Verify your skills through assessments', 'تحقق من مهاراتك عبر التقييمات'))
        elif row['skill_count'] >= 1:
            scores['skills'] = 5
            actions.append((7, f'Add more skills ({row["skill_count"]} listed, aim for 5+)', f'أضف مزيداً من المهارات ({row["skill_count"]} مدرجة)'))
        else:
            scores['skills'] = 0
            actions.append((5, 'Add your professional skills', 'أضف مهاراتك المهنية'))

        # 6. Assessments (10 pts)
        if row['assessment_count'] >= 2:
            scores['assessments'] = 10
        elif row['assessment_count'] == 1:
            scores['assessments'] = 6
            actions.append((9, 'Complete one more assessment to strengthen your profile', 'أكمل تقييماً إضافياً لتعزيز ملفك'))
        else:
            scores['assessments'] = 0
            actions.append((9, 'Take a skills assessment to stand out to recruiters', 'خذ تقييم مهارات لتتميز أمام مسؤولي التوظيف'))

        # 7. Career Direction (10 pts) — target roles, salary, relocation, notice
        career_s = 0
        target_roles = row['target_roles']
        # target_roles can be JSON list or None
        has_roles = False
        if target_roles:
            if isinstance(target_roles, str):
                try:
                    target_roles = json.loads(target_roles)
                except:
                    target_roles = []
            # Filter out internal __CITY__ tags
            real_roles = [r for r in (target_roles or []) if isinstance(r, str) and not r.startswith('__CITY__:')]
            has_roles = len(real_roles) > 0

        if has_roles: career_s += 4
        if row['expected_salary_range']: career_s += 3
        if row['notice_period']: career_s += 1.5
        if row['willing_to_relocate'] is not None: career_s += 1.5
        scores['career'] = min(career_s, 10)
        if career_s < 4:
            actions.append((7, 'Set your target roles in Career Compass', 'حدد أدوارك المستهدفة في البوصلة المهنية'))

        # 8. Interview Readiness (5 pts) — video intro
        if row['video_intro_url']:
            scores['interview'] = 5
        else:
            scores['interview'] = 0
            actions.append((10, 'Record a 60-second video introduction', 'سجّل مقدمة مرئية مدتها 60 ثانية'))

        # 9. Certifications (5 pts)
        if row['cert_count'] >= 1:
            scores['certifications'] = 5
        else:
            scores['certifications'] = 0
            actions.append((10, 'Add any professional certifications', 'أضف شهاداتك المهنية'))

        # 10. Engagement (10 pts) — job applications
        if row['application_count'] >= 3:
            scores['engagement'] = 10
        elif row['application_count'] >= 1:
            scores['engagement'] = 6
        else:
            scores['engagement'] = 0
            actions.append((8, 'Apply to jobs to show engagement', 'قدّم على وظائف لإظهار تفاعلك'))

        # ── Build response ──────────────────────────────────────────
        overall = sum(scores.values())
        overall = min(int(round(overall)), 100)

        pillars_out = []
        for p in PILLARS:
            s = scores.get(p['key'], 0)
            pillars_out.append({
                'key': p['key'],
                'label': p['label'],
                'label_ar': p['label_ar'],
                'score': round(s, 1),
                'max': p['max'],
                'complete': s >= p['max'],
            })

        # Pick the highest-priority next action
        actions.sort(key=lambda x: x[0])
        next_en = actions[0][1] if actions else 'All-Star Profile! 🌟'
        next_ar = actions[0][2] if actions else 'ملف كامل! 🌟'

        return jsonify({
            'success': True,
            'overall': overall,
            'pillars': pillars_out,
            'next_action': next_en,
            'next_action_ar': next_ar,
        }), 200

    except Exception as e:
        logger.error(f"Profile readiness calculation failed: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
