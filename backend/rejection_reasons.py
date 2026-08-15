"""
The standardised reasons an employer may give for rejecting a candidate.

WHY A FIXED LIST (#410, owner decision 2026-08-15: keep it standardised, make
it extensive)

A free-text rejection reason cannot be counted, cannot be compared between
employers, and cannot be shown to a candidate without reading it first. This
list is what makes "why are Emirati candidates not converting at this employer"
an answerable question rather than a reading exercise.

WHAT IS DELIBERATELY ABSENT

No reason here refers to age, gender, marital status, disability or status as a
person of determination, family circumstances, or nationality. Those are
protected characteristics, and a dropdown is not a neutral thing: whatever it
offers, it legitimises and makes easy. An employer who genuinely rejected on one
of those grounds must type it into `other`, where it is visible as a sentence
someone wrote rather than hidden inside a tidy aggregate.

Nationality is doubly out of place: this platform exists to place Emirati
nationals, so "not the right nationality" is not a rejection reason here — it is
a contradiction of the platform.

EMPLOYER-SIDE REASONS ARE MARKED

`employer_side=True` means nothing about the candidate — the role was filled,
withdrawn, or the budget changed. Counting those against a candidate's record,
or into a "rejection rate", would penalise people for an employer's planning.
The CRM and any future analytics must be able to separate the two, so the fact
is carried on the reason itself rather than inferred from its wording later.
"""

# code -> (English, Arabic, group, employer_side)
REJECTION_REASONS = {
    # ── Skills and experience ────────────────────────────────────────────
    'insufficient_experience':   ('Not enough relevant experience', 'خبرة ذات صلة غير كافية', 'experience', False),
    'experience_different_field': ('Experience is in a different field', 'الخبرة في مجال مختلف', 'experience', False),
    'missing_technical_skill':   ('Missing a required technical skill', 'ينقصه مهارة تقنية مطلوبة', 'experience', False),
    'missing_certification':     ('Missing a required certification or licence', 'ينقصه شهادة أو ترخيص مطلوب', 'experience', False),
    'language_requirement':      ('Language proficiency below the requirement', 'مستوى اللغة أقل من المطلوب', 'experience', False),

    # ── Qualifications ──────────────────────────────────────────────────
    'qualification_level':       ('Qualification level below the requirement', 'المؤهل أقل من المستوى المطلوب', 'qualification', False),
    'qualification_discipline':  ('Qualification not in a required discipline', 'المؤهل في تخصص غير مطلوب', 'qualification', False),
    'qualification_not_attested': ('Qualification not attested or not recognised', 'المؤهل غير مصدّق أو غير معترف به', 'qualification', False),

    # ── Assessment and interview ────────────────────────────────────────
    'interview_criteria':        ('Did not meet the interview criteria', 'لم يستوفِ معايير المقابلة', 'assessment', False),
    'assessment_score':          ('Assessment score below the threshold', 'نتيجة التقييم أقل من الحد المطلوب', 'assessment', False),
    'technical_test':            ('Did not pass the technical test', 'لم يجتز الاختبار التقني', 'assessment', False),
    'stronger_candidate':        ('A stronger candidate was selected', 'تم اختيار مرشح أقوى', 'assessment', False),

    # ── Terms and availability ──────────────────────────────────────────
    'salary_expectation':        ('Salary expectation above the range', 'التوقعات المالية أعلى من النطاق', 'terms', False),
    'notice_period':             ('Notice period too long', 'فترة الإشعار طويلة جداً', 'terms', False),
    'schedule_unavailable':      ('Not available for the required schedule or shifts', 'غير متاح للدوام أو الورديات المطلوبة', 'terms', False),
    'location_unworkable':       ('Cannot work at the required location', 'يتعذّر العمل في الموقع المطلوب', 'terms', False),
    'start_date':                ('Cannot start by the required date', 'يتعذّر المباشرة في التاريخ المطلوب', 'terms', False),

    # ── The candidate's own decision or non-response ────────────────────
    'declined_offer':            ('Candidate declined the offer', 'رفض المرشح العرض', 'candidate', False),
    'withdrew':                  ('Candidate withdrew from the process', 'انسحب المرشح من العملية', 'candidate', False),
    'accepted_elsewhere':        ('Candidate accepted another role', 'قبل المرشح وظيفة أخرى', 'candidate', False),
    'no_show_interview':         ('Did not attend the interview', 'لم يحضر المقابلة', 'candidate', False),
    'unreachable':               ('Did not respond to contact attempts', 'لم يرد على محاولات التواصل', 'candidate', False),

    # ── Application completeness ────────────────────────────────────────
    'incomplete_application':    ('Application or documents incomplete', 'الطلب أو المستندات غير مكتملة', 'application', False),
    'cv_not_provided':           ('No CV provided', 'لم يتم تقديم سيرة ذاتية', 'application', False),
    'duplicate_application':     ('Duplicate application', 'طلب مكرر', 'application', False),

    # ── Nothing to do with the candidate ────────────────────────────────
    'role_filled':               ('Role filled by another candidate', 'تم شغل الوظيفة بمرشح آخر', 'employer', True),
    'role_withdrawn':            ('Role withdrawn or put on hold', 'تم سحب الوظيفة أو تعليقها', 'employer', True),
    'budget_changed':            ('Headcount or budget changed', 'تغير عدد الوظائف أو الميزانية', 'employer', True),
    'requirements_changed':      ('Role requirements changed', 'تغيرت متطلبات الوظيفة', 'employer', True),

    # ── Regulatory ──────────────────────────────────────────────────────
    'regulatory_requirement':    ('Does not meet a mandatory regulatory requirement for the role',
                                  'لا يستوفي متطلباً تنظيمياً إلزامياً للوظيفة', 'regulatory', False),

    # ── Escape hatch ────────────────────────────────────────────────────
    # A fixed list with no way out forces a false choice, and a false choice is
    # worse data than a sentence. This one REQUIRES a note.
    'other':                     ('Other (please explain)', 'أخرى (يرجى التوضيح)', 'other', False),
}

REJECTION_REASON_CODES = frozenset(REJECTION_REASONS)

# Reasons that say nothing about the candidate. Excluded from anything that
# reads as a judgement of them.
EMPLOYER_SIDE_REASONS = frozenset(
    code for code, (_en, _ar, _group, employer_side) in REJECTION_REASONS.items() if employer_side
)

REASON_REQUIRING_NOTE = 'other'


def is_valid_reason(code):
    return str(code or '').strip().lower() in REJECTION_REASON_CODES


def validate_rejection(code, note=None):
    """None if acceptable, else a sentence explaining what is wrong.

    Returns the message rather than raising so callers can answer with a 400
    the reporter can act on, instead of a stack trace.
    """
    c = str(code or '').strip().lower()
    if not c:
        return 'A rejection reason is required.'
    if c not in REJECTION_REASON_CODES:
        return f"'{code}' is not a recognised rejection reason."
    if c == REASON_REQUIRING_NOTE and not str(note or '').strip():
        return 'Choose "Other" only with a short explanation of the reason.'
    return None


def reason_options(arabic=False):
    """The list for a dropdown: code, label, group, and whether it is employer-side."""
    return [
        {'code': code, 'label': ar if arabic else en, 'group': group, 'employer_side': employer_side}
        for code, (en, ar, group, employer_side) in REJECTION_REASONS.items()
    ]
