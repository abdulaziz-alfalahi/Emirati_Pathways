"""When a youth-programme registration needs a guardian's confirmation.

Owner decision, 2026-08-30: "go with option 2" — the young person registers, a
parent confirms, and where no guardian is already linked the registrant supplies
an address at registration.

WHY THE PROGRAMME'S AGE RANGE DECIDES, NOT THE REGISTRANT'S BIRTHDAY

The obvious design computes the registrant's age. The platform usually cannot:
`candidate_profiles.dob` is populated for 4,247 of 38,301 people — eleven per
cent. For nine registrants in ten there is no birthday to check, and guessing
"adult" is the wrong way to be wrong about a fifteen-year-old.

What the platform reliably has is the age range the PROVIDER declared on the
programme: "10-16", "14-18", "18-25". Somebody stated that on purpose, and it
answers the question directly.

The functions here are pure so the rule can be tested without a database, a
request or a clock — every branch below is a decision somebody may later have to
defend.
"""
import re
from datetime import date

#: Majority in the UAE. Named rather than inlined because it is a legal
#: threshold that may be argued about, not a magic number.
AGE_OF_MAJORITY = 18

#: Reasons, returned rather than a bare bool: the caller has to tell a
#: registrant WHY they are being asked for a guardian, and "because of the
#: programme's age range" is a different sentence from "because of your date of
#: birth".
CONSENT_NOT_NEEDED = 'not_needed'
CONSENT_ALL_MINORS = 'programme_is_for_minors'
CONSENT_MAY_BE_MINOR = 'programme_may_include_minors'
CONSENT_AGE_UNKNOWN = 'age_range_not_stated'


def parse_age_range(age_group):
    """(min, max) from a provider's age string, or (None, None).

    Providers write these by hand, so the shapes vary: "14-18", "14 - 18",
    "6–9" with an en dash, "18+", "16 and over". Anything unrecognised returns
    (None, None) and the caller treats that as "cannot rule out a minor" — an
    unparseable range must never read as an adult-only programme.
    """
    if not age_group:
        return (None, None)
    text = str(age_group).strip()

    plus = re.match(r'^(\d{1,2})\s*(\+|and over|and above|or older)\s*$', text, re.I)
    if plus:
        return (int(plus.group(1)), None)

    both = re.match(r'^(\d{1,2})\s*[-–—to]+\s*(\d{1,2})$', text, re.I)
    if both:
        low, high = int(both.group(1)), int(both.group(2))
        return (min(low, high), max(low, high))

    single = re.match(r'^(\d{1,2})$', text)
    if single:
        n = int(single.group(1))
        return (n, n)

    return (None, None)


def age_on(dob, today=None):
    """Whole years, or None if there is no date of birth."""
    if not dob:
        return None
    today = today or date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def consent_requirement(age_group, registrant_dob=None, today=None):
    """Does this registration need a guardian? Returns (needed, reason).

    The rule, and the direction it fails in:

        max age below 18      every attendee is a minor    -> needed
        min age below 18      an attendee MAY be a minor   -> needed, UNLESS the
                                                              person's own date
                                                              of birth proves
                                                              they are 18 or over
        min age 18 or over    no minors                    -> not needed
        unparseable / absent  cannot rule it out           -> needed

    Failing towards asking is deliberate. The cost of asking an adult for a
    guardian is an annoyance; the cost of not asking a minor is the thing this
    exists to prevent.
    """
    low, high = parse_age_range(age_group)

    if low is None and high is None:
        return (True, CONSENT_AGE_UNKNOWN)

    if high is not None and high < AGE_OF_MAJORITY:
        # Every attendee is below majority. A date of birth cannot argue with
        # this: if the person really is an adult they are not eligible anyway.
        return (True, CONSENT_ALL_MINORS)

    if low is not None and low >= AGE_OF_MAJORITY:
        return (False, CONSENT_NOT_NEEDED)

    # Mixed range. Only a known birthday can settle it.
    age = age_on(registrant_dob, today=today)
    if age is not None and age >= AGE_OF_MAJORITY:
        return (False, CONSENT_NOT_NEEDED)
    return (True, CONSENT_MAY_BE_MINOR)


def explain(reason, age_group=None):
    """What to tell the registrant. They are being asked for a parent's address;
    the reason should not be a code."""
    return {
        CONSENT_NOT_NEEDED: '',
        CONSENT_ALL_MINORS: (
            f'This programme is for ages {age_group}, so a parent or guardian '
            f'has to confirm the place.'),
        CONSENT_MAY_BE_MINOR: (
            f'This programme accepts ages {age_group}. Because we do not have '
            f'your date of birth on file, a parent or guardian has to confirm '
            f'the place. If you are 18 or over, adding your date of birth to '
            f'your profile will skip this next time.'),
        CONSENT_AGE_UNKNOWN: (
            'The provider has not stated an age range for this programme, so a '
            'parent or guardian has to confirm the place.'),
    }.get(reason, '')


# ── The message a guardian receives ─────────────────────────────────────────
#
# Kept here rather than in the routes so the wording is testable and can be
# rendered for the owner's approval screen without a request or a database.
#
# It has to answer, in the order a parent will ask: who, what, when, and what
# happens if I do nothing. It never says "click to confirm" without saying what
# is being confirmed — a consent nobody understood is not consent.

try:                                                 # pragma: no cover
    from backend.brand import COUNCIL_NAME_EN, COUNCIL_NAME_AR, PLATFORM_NAME_EN, PLATFORM_NAME_AR, BILINGUAL_RULE
except ImportError:                                  # pragma: no cover — dual root
    from brand import COUNCIL_NAME_EN, COUNCIL_NAME_AR, PLATFORM_NAME_EN, PLATFORM_NAME_AR, BILINGUAL_RULE


def guardian_consent_subject(programme):
    return (f'Your confirmation is needed: {programme} / '
            f'مطلوب تأكيدكم: {programme}')


def guardian_consent_body(young_person, programme, organiser, when, link):
    """Arabic leads. The audience is a parent of an Emirati young person, the
    same reasoning that puts Arabic first on the NAFIS candidate invitation."""
    who = young_person or 'the young person'
    org = f' ({organiser})' if organiser else ''
    dates = f'\nDates: {when}' if when else ''
    dates_ar = f'\nالتواريخ: {when}' if when else ''
    return f"""عزيزي ولي الأمر،

سجّل/سجّلت {who} في برنامج "{programme}"{org} عبر {PLATFORM_NAME_AR}.
ولأن البرنامج موجّه لفئة عمرية قد تشمل من هم دون الثامنة عشرة، فإن المقعد
محجوز مؤقتاً ولا يُعتمد إلا بتأكيدكم.{dates_ar}

للتأكيد أو الرفض، افتحوا هذا الرابط:

{link}

الرابط صالح لمدة 14 يوماً. وإذا لم يُستخدم، يُلغى الحجز تلقائياً ولا يشارك
{who} في البرنامج. ولستم بحاجة إلى حساب على المنصة.

وإذا لم تكونوا تتوقعون هذه الرسالة، يمكنكم تجاهلها.

— {COUNCIL_NAME_AR}

{BILINGUAL_RULE}

Dear Parent or Guardian,

{who} has registered for "{programme}"{org} through the {PLATFORM_NAME_EN}.
Because this programme's age range may include people under 18, the place is
held but NOT confirmed until you agree to it.{dates}

To confirm or decline, open this link:

{link}

The link is valid for 14 days. If it is not used the place is released and
{who} will not attend. You do not need an account.

If you were not expecting this message, you can ignore it.

— {COUNCIL_NAME_EN}
"""
