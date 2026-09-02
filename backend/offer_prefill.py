"""Fill an offer from the vacancy it came from, and say where each value came from.

REQUESTED 2026-09-02 (fb_1788344147, "AI-Powered Offer Creation (Auto-Fill)"):

    "Introduce an AI-powered auto-fill feature for the Offer Creation process,
     similar to the existing AI-assisted Job Description functionality. The
     feature should automatically generate and populate offer details based on
     the approved job vacancy, candidate profile, and predefined company
     templates, minimizing manual data entry and ensuring consistency and
     accuracy across employment offers."

MOST OF THIS IS NOT AN AI PROBLEM, AND SHOULD NOT BE.

An offer is a document with somebody's salary in it. The platform's own AI
instructions already say "never invent specific figures or salaries" — for
advice. For an offer the stakes are higher: a generated number that looks
plausible is worse than an empty box, because an empty box gets filled in and a
plausible number gets sent.

So the title, salary, employment type and location are COPIED from the approved
vacancy. The probation period is a stated default, not a prediction. Nothing is
invented, and where the vacancy is silent the field comes back empty for the
recruiter to complete — which is the honest outcome and still saves them the
typing on everything else.

EVERY FIELD CARRIES ITS SOURCE. The recruiter sees whether a value came from the
vacancy, from a default, or from nothing at all, so they know what to check
before they send it. "Where did this salary come from" is the first question
anybody sensibly asks of a pre-filled offer.
"""
import logging

logger = logging.getLogger(__name__)

try:
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover — the app runs under both roots
    from db_utils import execute_query

#: UAE Labour Law caps probation at six months. Offered as the default because
#: it is the common term, not because we know this employer's policy — hence
#: source='default' rather than source='vacancy'.
DEFAULT_PROBATION_MONTHS = 6

#: What a company template would supply if one existed. There is no per-company
#: offer template on the platform yet, so these are stated as defaults and
#: flagged as such rather than presented as the employer's own terms.
DEFAULT_BENEFITS = {
    'annual_leave_days': 30,        # UAE statutory minimum for full-time
    'health_insurance': True,       # mandatory for employees in the UAE
    'flight_tickets': 0,
}


def _field(value, source, note=None):
    return {'value': value, 'source': source, **({'note': note} if note else {})}


def build(jd_id, candidate_id=None):
    """Return the offer fields derived from the vacancy, each with its source.

    Returns None if the vacancy cannot be read — the dialog then opens empty,
    which is what it did before this existed.
    """
    job = execute_query(
        """SELECT id, jd_id, title, employment_type, job_type, location,
                  emirate, city, remote_option, working_hours,
                  salary_range_min, salary_range_max, currency, benefits,
                  status
             FROM job_postings
            WHERE jd_id = %s OR id::text = %s
            LIMIT 1""", (str(jd_id), str(jd_id)), fetch_one=True)
    if not job:
        return None

    out = {}

    out['position_title'] = _field(job.get('title'), 'vacancy')

    out['employment_type'] = _field(
        job.get('employment_type') or job.get('job_type') or None, 'vacancy')

    # Location: the vacancy's own words first, then emirate/city.
    location = job.get('location') or ', '.join(
        [p for p in (job.get('city'), job.get('emirate')) if p]) or None
    out['work_location'] = _field(location, 'vacancy' if location else 'unknown')

    # SALARY. Copied, never predicted. A range gives no single number, so the
    # lower bound is offered as a STARTING POINT and labelled as one — the
    # recruiter is negotiating, and a midpoint presented without explanation
    # would look like a decision somebody made.
    low, high = job.get('salary_range_min'), job.get('salary_range_max')
    if low and high and low != high:
        out['salary_amount'] = _field(
            float(low), 'vacancy',
            f'The vacancy states a range of {float(low):,.0f}–{float(high):,.0f}. '
            'The lower bound is filled in as a starting point; set the agreed figure.')
    elif low or high:
        out['salary_amount'] = _field(float(low or high), 'vacancy')
    else:
        out['salary_amount'] = _field(
            None, 'unknown',
            'The vacancy does not state a salary, so nothing has been filled in.')

    out['salary_currency'] = _field(job.get('currency') or 'AED',
                                    'vacancy' if job.get('currency') else 'default')
    out['salary_period'] = _field('monthly', 'default')

    out['probation_period_months'] = _field(
        DEFAULT_PROBATION_MONTHS, 'default',
        'UAE Labour Law caps probation at six months. Adjust to your policy.')

    # Benefits stated on the vacancy are the employer's own words and win; the
    # rest are defaults, marked as such.
    stated = job.get('benefits')
    benefits = dict(DEFAULT_BENEFITS)
    note = None
    if isinstance(stated, dict) and stated:
        benefits.update({k: v for k, v in stated.items() if v not in (None, '')})
        note = 'Benefits the vacancy states have been carried over.'
    elif isinstance(stated, list) and stated:
        note = ('The vacancy lists benefits as free text; they are shown below '
                'for you to translate into the fields.')
    out['benefits'] = _field(benefits, 'vacancy' if note else 'default', note)
    if isinstance(stated, list) and stated:
        out['additional_benefits'] = _field(
            '; '.join(str(x) for x in stated if x), 'vacancy')

    out['_vacancy'] = {'id': job.get('id'), 'jd_id': job.get('jd_id'),
                       'status': job.get('status')}

    if candidate_id:
        person = execute_query(
            """SELECT COALESCE(u.full_name,
                        NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''))
                          AS full_name
                 FROM users u WHERE u.id = %s""", (str(candidate_id),), fetch_one=True)
        if person:
            # Name only. Contact details are concealed from the employer side
            # (see candidate_privacy) and an offer form does not need them.
            out['_candidate'] = {'full_name': person.get('full_name')}

    return out
