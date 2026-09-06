"""Project an uploaded CV's parsed_data into the CV-builder shape.

user_cvs has two representations of a CV. A CV built in the app is saved
into the structured columns (personal_info, professional_summary,
technical_skills, soft_skills, work_experience, education) in the CV
builder's camelCase shape. A CV uploaded as a file is parsed by cv_parser
into `parsed_data` (snake_case, the parser's own schema) and the structured
columns are left NULL.

The public share page reads only the structured columns, so every uploaded
CV shared with an employer rendered as an empty page with the name "User"
(owner, 2026-09-06). This module turns parsed_data into the builder shape so
both kinds of CV render the same way. It never invents: a missing field is
an empty string or list.
"""
from typing import Any, Dict, List, Optional

#: Contact and direct-identifier keys masked on the public page. The
#: platform's rule is that candidate contact details stay on-platform;
#: an employer messages through the page, not around it.
CONTACT_KEYS = ('email', 'phone', 'emailAddress', 'phoneNumber', 'email_address',
                'phone_number', 'address', 'linkedin')
MASK = '[Hidden - Closed Platform]'


def _s(v: Any) -> str:
    return '' if v is None else str(v)


def _year(v: Any) -> str:
    """'2011-01-01' -> '2011'; None/'None' -> ''."""
    s = _s(v).strip()
    return s[:4] if s and s.lower() != 'none' else ''


def _date(v: Any) -> str:
    s = _s(v).strip()
    return '' if s.lower() == 'none' else s


def personal_info(parsed: Dict[str, Any]) -> Dict[str, Any]:
    pi = parsed.get('personal_info') or {}
    full = _s(pi.get('full_name')).strip()
    first = _s(pi.get('first_name')).strip() or (full.split(' ')[0] if full else '')
    last = _s(pi.get('last_name')).strip() or (' '.join(full.split(' ')[1:]) if full else '')
    return {
        'firstName': first,
        'lastName': last,
        'fullName': full or ' '.join(x for x in (first, last) if x),
        'fullNameAr': _s(pi.get('full_name_ar')),
        'email': _s(pi.get('email')),
        'phone': _s(pi.get('phone')),
        'location': _s(pi.get('location')) or _s(pi.get('address')),
        'nationality': _s(pi.get('nationality')),
        'linkedin': _s(pi.get('linkedin')),
    }


def skills(parsed: Dict[str, Any]) -> Dict[str, List[str]]:
    tech, soft = [], []
    for s in parsed.get('skills') or []:
        name = _s(s.get('name') if isinstance(s, dict) else s).strip()
        if not name:
            continue
        cat = _s(s.get('category') if isinstance(s, dict) else '').lower()
        (soft if cat == 'soft' else tech).append(name)
    return {'technicalSkills': tech, 'softSkills': soft}


def experience(parsed: Dict[str, Any]) -> List[Dict[str, Any]]:
    out = []
    for e in parsed.get('experience') or []:
        if not isinstance(e, dict):
            continue
        desc = _s(e.get('description')).strip()
        achievements = [_s(a).strip() for a in (e.get('achievements') or []) if _s(a).strip()]
        if achievements:
            desc = (desc + '\n' if desc else '') + '\n'.join('• ' + a for a in achievements)
        out.append({
            'jobTitle': _s(e.get('position') or e.get('title') or e.get('job_title')),
            'company': _s(e.get('company')),
            'location': _s(e.get('location')),
            'startDate': _date(e.get('start_date')),
            'endDate': 'Present' if e.get('is_current') in (True, 'True', 'true') else _date(e.get('end_date')),
            'responsibilities': desc,
        })
    return out


def education(parsed: Dict[str, Any]) -> List[Dict[str, Any]]:
    out = []
    for e in parsed.get('education') or []:
        if not isinstance(e, dict):
            continue
        out.append({
            'degree': _s(e.get('degree')),
            'institution': _s(e.get('institution')),
            'field': _s(e.get('field_of_study') or e.get('field')),
            'graduationYear': _year(e.get('end_date') or e.get('graduation_year') or e.get('year')),
            'gpa': _s(e.get('gpa')),
        })
    return out


def builder_shape(parsed: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """The six structured columns, from parsed_data. Empty shells when there is
    no parsed data, so callers can COALESCE without special cases."""
    parsed = parsed if isinstance(parsed, dict) else {}
    sk = skills(parsed)
    return {
        'personal_info': personal_info(parsed) if parsed else {},
        'professional_summary': _s(parsed.get('professional_summary')),
        'technical_skills': sk['technicalSkills'],
        'soft_skills': sk['softSkills'],
        'work_experience': experience(parsed),
        'education': education(parsed),
    }


def fill_from_parsed(row: Dict[str, Any]) -> Dict[str, Any]:
    """Fill the structured columns of a user_cvs row that are empty from its
    parsed_data. Columns that already hold builder data are left alone."""
    projected = builder_shape(row.get('parsed_data'))
    out = dict(row)
    for key, value in projected.items():
        current = out.get(key)
        if current in (None, '', [], {}):
            out[key] = value
    return out


def mask_contacts(personal: Any) -> Any:
    """Hide direct contact details for external viewers."""
    if not isinstance(personal, dict):
        return personal
    masked = dict(personal)
    for key in CONTACT_KEYS:
        if masked.get(key):
            masked[key] = MASK
    return masked


DEFAULT_SHARE_RETIRES_ON = '2026-10-06'


def share_retirement(today, env_value=None):
    """(retired, retires_on) for the public share link.

    The public page is being retired (owner, 2026-09-06): links keep working
    with a banner until the date, then answer 410. A misconfigured date must
    never take the page down early — so an unparseable value keeps the link
    open AND reports no date, rather than handing the banner "Invalid Date".
    """
    from datetime import date as _date
    value = (env_value or DEFAULT_SHARE_RETIRES_ON).strip()
    try:
        retires_on = _date.fromisoformat(value)
    except ValueError:
        return False, None
    return today >= retires_on, retires_on.isoformat()
