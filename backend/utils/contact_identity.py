"""
Contact-point canonicalisation for account matching (issue #95).

UAE Pass sign-in resolves accounts through a cascade that includes email
and phone. Before this module, onboarding stored both verbatim while the
lookups normalised differently ("Ali@Company.ae" never matched
"ali@company.ae"; "0501234567" never matched "+971501234567"), so the
same human silently got a second account — or, worse, matched somebody
else's.

Canonical forms (must be applied on BOTH write and read paths):
  email — lowercased, trimmed.
  phone — digits only, UAE country-prefixed: '9715XXXXXXXX'. This matches
          the dominant format already in the live users table.
"""

import re


def canonical_email(email):
    """Lowercased, trimmed email; '' for empty/None."""
    return (email or "").strip().lower()


def canonical_phone(phone):
    """Digits-only, UAE-prefixed phone ('9715XXXXXXXX'); '' if unusable.

    Accepts '+971 50 123 4567', '00971501234567', '0501234567',
    '501234567', '971501234567'. Anything shorter than 9 significant
    digits (e.g. the literal '0' rows in the live table) is junk → ''.
    """
    digits = re.sub(r"\D", "", phone or "")
    if digits.startswith("00971"):
        digits = digits[5:]
    elif digits.startswith("971"):
        digits = digits[3:]
    digits = digits.lstrip("0")
    if len(digits) != 9:
        return ""
    return "971" + digits


def phone_match_variants(phone):
    """All stored spellings a legacy row might carry for this phone.

    The live table predates canonicalisation, so lookups must try the
    canonical form plus the common legacy formats. Returns [] if the
    phone is unusable.
    """
    canonical = canonical_phone(phone)
    if not canonical:
        return []
    national = canonical[3:]  # 5XXXXXXXX
    return list({
        canonical,            # 9715XXXXXXXX
        "+" + canonical,      # +9715XXXXXXXX
        "0" + national,       # 05XXXXXXXX
        national,             # 5XXXXXXXX
        "00" + canonical,     # 009715XXXXXXXX
    })
