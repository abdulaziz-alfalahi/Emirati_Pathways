"""Who is on the platform, defined once.

Three questions get asked constantly and were being answered inconsistently:
how many Emiratis are EMPLOYED, how many are SEEKING work, and how many have
actually ONBOARDED and used the platform. Each had several plausible answers
already living in different queries.

WHY THIS FILE EXISTS

"Job seeker" had four candidate definitions in the database, differing by 2.7x
(measured 2026-08-21):

    work_status = 'Not Working'            3,091
    looking_status = 'Looking For Work'    1,969
    job_seeker_type IS NOT NULL            5,034   (set by the NAFIS import)
    rows in nafis_job_seekers              3,969

They are not variants of one number — they measure different things. Working and
looking are independent:

    Not Working  + Looking For Work        1,834    <- the classic job seeker
    Not Working  + Not Looking               363    <- not working, not seeking
    Working      + Looking For Work          108    <- employed, wants to move
    Working      + Not Looking               523
    neither field set                      1,106    <- genuinely unknown

A board paper quoting 5,034 and a CRM screen showing 1,834 would both be
defensible and would destroy confidence in each other. So the definitions live
here, once, and every surface reads them from here.

THE MEMBERSHIP QUESTION

Most people on this platform have never used it. Of 5,309 candidate records,
37 have ever signed in and 13 arrived through UAE Pass; the rest were loaded in
bulk from NAFIS and the CRM master file. That is expected before launch — but it
means a recruiter searching candidates is mostly searching people who cannot
answer, and an employer told "37,000 candidates" would be misled.

MEMBERSHIP IS DERIVED, NOT FLAGGED. Someone is a member once they have
authenticated. That is self-maintaining: the moment a person completes UAE Pass
onboarding they become a member, with no backfill and no column to keep in sync.
A boolean somebody has to remember to set is the same shape as the two bugs
found on 2026-08-21 — one store honouring a role removal while another did not,
and a cached role list outliving the database.

RECORDED IS NOT REGISTERED. Both numbers are true and they answer different
questions. Reporting only the larger one is the failure this module exists to
prevent.
"""

# ── Membership ──────────────────────────────────────────────────────────────
#
# uaepass_uuid is the stronger signal (a UAE-Pass-proven identity); last_login
# also admits anyone who reached the platform another way. Either means a real
# person has been here.
MEMBER_PREDICATE = "(u.last_login IS NOT NULL OR u.uaepass_uuid IS NOT NULL)"

# For queries that alias the users table differently.
def member_predicate(alias: str = 'u') -> str:
    return f"({alias}.last_login IS NOT NULL OR {alias}.uaepass_uuid IS NOT NULL)"


# ── The three populations ───────────────────────────────────────────────────
#
# Each carries the SQL that defines it and a sentence stating what it does NOT
# mean, because every one of these has been misread at least once.

POPULATIONS = {
    'employed': {
        'label_en': 'Employed',
        'label_ar': 'موظفون',
        'sql': "cp.work_status = 'Working'",
        'means': 'Recorded as working. Says nothing about whether they are also '
                 'looking to move — 108 of them are.',
    },
    'not_working': {
        'label_en': 'Not working',
        'label_ar': 'غير موظفين',
        'sql': "cp.work_status = 'Not Working'",
        'means': 'Recorded as not working. NOT the same as seeking: 363 of them '
                 'are not looking for work.',
    },
    'seeking': {
        'label_en': 'Actively seeking work',
        'label_ar': 'يبحثون عن عمل',
        'sql': "cp.looking_status = 'Looking For Work'",
        'means': 'Stated that they are looking, whether or not they currently '
                 'have a job. This is the number that answers "who wants a job".',
    },
    'employment_unknown': {
        'label_en': 'Employment status unknown',
        'label_ar': 'الحالة الوظيفية غير معروفة',
        'sql': "cp.work_status IS NULL AND cp.looking_status IS NULL",
        'means': 'Neither field was ever populated. Reported as unknown rather '
                 'than folded into a bucket, so no total silently invents them.',
    },
}


# ── Who may see what ────────────────────────────────────────────────────────
#
# The same three numbers serve different readers, and the difference is about
# DETAIL, not about giving anyone a different total.
#
#   board      counts and distributions only. Both registered and recorded, side
#              by side — a board paper that says "37,000 candidates" when 37
#              people have signed in is a false statement, however true the row
#              count is.
#   crm        the full roster including people who have never signed in. That is
#              the entire purpose of the CRM: to see who has not joined yet and
#              call them.
#   recruiter  MEMBERS ONLY. An employer must not be shown, or be able to
#              approach, someone who has never used the platform and cannot
#              answer.
#
AUDIENCE_MEMBERS_ONLY = {'recruiter', 'employer_admin', 'hr', 'hr_manager'}


def scope_note(audience: str) -> str:
    """One line explaining what the caller is looking at, for the UI to show."""
    if audience in AUDIENCE_MEMBERS_ONLY:
        return ('Showing people who have signed in to the platform. Records '
                'imported from NAFIS and employer data are not included.')
    return ('Showing all recorded people, including those who have not yet '
            'signed in.')


# ── Company onboarding ──────────────────────────────────────────────────────
#
# The same recorded-vs-registered trap as above, and it caught me: the employer
# panel labelled a company "On platform" whenever a row existed in `companies`.
# Rows are created by the NAFIS vacancy import as leads, so 257 companies had a
# row and 4 had anyone from the company actually join. Five household names were
# shown to an operator as onboarded when none of them were (owner, 2026-08-22).
#
# THE ACL IS THE AUTHORITY, not the presence of a row: company_team_members with
# invitation_status = 'accepted' is what workspace_middleware.get_company_context
# reads to decide whether someone may act for a company. If that query would let
# nobody in, the company is not on the platform in any sense that matters.
#
# is_verified is NOT the test either. It records that an operator checked the
# trade licence, which can happen before anyone from the company has joined —
# 11 verified against 4 with an accepted member.
COMPANY_ONBOARDED_SQL = """EXISTS (SELECT 1 FROM company_team_members m
                                    WHERE m.company_id = {alias}.id
                                      AND m.invitation_status = 'accepted')"""


def company_onboarded_sql(alias: str = 'co') -> str:
    return COMPANY_ONBOARDED_SQL.format(alias=alias)


# Three states, because "not onboarded" covers two situations an operator needs
# to tell apart: a company nobody has contacted, and one that was verified but
# whose people never joined.
COMPANY_STATES = {
    'onboarded': {
        'label_en': 'Onboarded',
        'label_ar': 'مُلحقة',
        'means': 'Someone from this company has joined and can act for it.',
    },
    'verified_not_joined': {
        'label_en': 'Verified, not joined',
        'label_ar': 'موثّقة، لم تنضم',
        'means': 'Trade licence checked by an operator, but nobody from the '
                 'company has an accepted account yet.',
    },
    'record_only': {
        'label_en': 'Record only',
        'label_ar': 'سجل فقط',
        'means': 'A row exists because an import created one — usually from a '
                 'NAFIS vacancy. No relationship with the company.',
    },
}
