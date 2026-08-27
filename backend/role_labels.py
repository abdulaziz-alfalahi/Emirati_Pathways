"""What each role is CALLED — one registry, read by every screen that shows one.

WHY THIS EXISTS

Reported 2026-08-27: "The role is showing in one place but not the other. It is
confusing." Three screenshots, one person, three different answers.

Unifying the role IDS was only half of it. The names were kept in two lists that
had drifted apart, so the same id still read differently depending on which
screen you were on:

    id                    Users tab                     staff invitation
    talent_operator       Candidate Onboarding Operator Talent Operator
    employer_relations    Company Onboarding Operator   Employer Relations
    platform_operator     Monitoring Center Operator    Platform Operator
    compliance_auditor    Government Official           Compliance Auditor

Somebody granted "Company Onboarding Operator" therefore received an invitation
appointing them "Employer Relations", and appeared under a third name again on
the operators screen. Nothing was wrong with the data; three lists simply
disagreed about English.

WHICH NAME WON

The Users tab's. It is the screen an administrator actually grants roles on, and
its names are the ones in use in conversation — "Company Onboarding Operator"
says what the job is, where "Employer Relations" names a department.

Arabic comes from the invitation registry, which is the only list that ever had
any; the four names that changed above needed new Arabic and are marked below.

ADDING A ROLE: add it HERE. A screen that needs a label imports one of the
helpers rather than keeping its own copy — which is how there came to be three.
"""

#: role id -> (English, Arabic).
#:
#: The English side is authoritative for the Users tab, the staff invitation
#: email, the operators screen and the staff directory alike.
ROLE_LABELS = {
    # --- administration -------------------------------------------------
    'admin': ('Administrator', 'مسؤول النظام'),
    'super_admin': ('Administrator', 'مسؤول النظام'),
    'super_user': ('Administrator', 'مسؤول النظام'),
    'administrator': ('Administrator', 'مسؤول النظام'),
    'platform_administrator': ('Administrator', 'مسؤول النظام'),

    # --- the seven growth domains --------------------------------------
    # Each of these is what a domain assignment grants; see
    # GROWTH_OPERATOR_DOMAIN_ROLES in auth/access_control.py.
    'talent_operator': ('Candidate Onboarding Operator',
                        'مشغّل انضمام المرشحين'),          # Arabic: new 2026-08-27
    'employer_relations': ('Company Onboarding Operator',
                           'مشغّل انضمام الشركات'),        # Arabic: new 2026-08-27
    'education_operator': ('Education Operator', 'مشغّل قطاع التعليم'),
    'assessment_operator': ('Assessment Operator', 'مشغّل التقييم'),
    'mentorship_operator': ('Mentorship Operator', 'مشغّل الإرشاد'),
    'community_operator': ('Community Operator', 'مشغّل المجتمعات'),
    'platform_operator': ('Monitoring Center Operator',
                          'مشغّل مركز المتابعة'),          # Arabic: new 2026-08-27

    # --- other operators ------------------------------------------------
    'career_services_operator': ('Career Services Operator',
                                 'مشغّل خدمات المسار المهني'),
    'professional_dev_operator': ('Professional Development Operator',
                                  'مشغّل التطوير المهني'),
    'call_center_agent': ('Call Center Agent', 'موظف مركز الاتصال'),
    'compliance_auditor': ('Government Official',
                           'مسؤول حكومي'),                 # Arabic: new 2026-08-27
    'growth_operator': ('Growth Operator', 'مشغّل النمو'),
    'operator': ('Operator (legacy)', 'مشغّل (قديم)'),

    # --- education ------------------------------------------------------
    'advisor': ('Academic Advisor', 'المرشد الأكاديمي'),
    'internship_coordinator': ('Internship Coordinator', 'منسّق التدريب العملي'),
    'training_provider': ('Educator', 'مزوّد تدريب'),
    'training_center_rep': ('Training Center Representative', 'ممثل مركز تدريب'),

    # --- support roles --------------------------------------------------
    'assessor': ('Assessor', 'المُقيِّم'),
    'coach': ('Career Coach', 'المدرّب المهني'),
    'mentor': ('Mentor', 'الموجّه'),

    # --- board ----------------------------------------------------------
    'board_member': ('EHRDC Board Member', 'عضو مجلس الموارد البشرية'),
    'board_operator': ('Board Secretary', 'أمين سر المجلس'),
    'board_chairman': ('Board Chairman', 'رئيس المجلس'),

    # --- employer side --------------------------------------------------
    'recruiter': ('Recruiter', 'أخصائي توظيف'),
    'employer_admin': ('HR Manager', 'مدير الموارد البشرية'),
    'hr': ('HR', 'الموارد البشرية'),
    'hr_manager': ('HR Manager', 'مدير الموارد البشرية'),

    # --- the people the platform is for ---------------------------------
    'candidate': ('Job Seeker', 'باحث عن عمل'),
    'seeker': ('Job Seeker', 'باحث عن عمل'),
    'student': ('Student', 'طالب'),
    'parent': ('Parent / Guardian', 'ولي الأمر'),
    'employee': ('Employee', 'موظف'),
    'entrepreneur': ('Entrepreneur', 'رائد أعمال'),
}


def label_for(role, arabic=False):
    """A readable name for a role — never a raw identifier.

    An unregistered role becomes "Professional Dev Operator" rather than
    "professional_dev_operator": somebody deciding whether a person should hold
    a role should not have to read a database value to know what it is.
    """
    key = (role or '').strip().lower()
    pair = ROLE_LABELS.get(key)
    if pair:
        return pair[1] if arabic else pair[0]
    return key.replace('_', ' ').title()


def labels_for(role):
    """Both languages at once, as ``(english, arabic)``."""
    return label_for(role), label_for(role, arabic=True)
