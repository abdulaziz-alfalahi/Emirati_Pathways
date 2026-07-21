"""
Company identity resolution (issue #99).

Companies used to be matched by exact name string ("SELECT id FROM companies
WHERE company_name = %s"), so any case or whitespace variation of the same
employer — "ACME LLC" vs "Acme  LLC " — silently forked a shadow company,
splitting recruiters, job postings and metrics across rows the operator
dashboard shows as separate partners.

Every find-or-create path must resolve companies through this module:
  1. trade licence number, when the caller has one — it is the authoritative
     business key issued by the licensing authority;
  2. otherwise the whitespace-collapsed, case-folded company name.

Migration 011 adds unique indexes on exactly these two expressions, so any
code path that bypasses this module now fails loudly instead of forking a
duplicate. NORMALIZED_NAME_SQL must stay textually identical to the
expression in that migration or Postgres will not use the index.
"""

import re

# Column expression matching normalize_company_name(), and the expression
# migration 011 indexes.
NORMALIZED_NAME_SQL = r"lower(regexp_replace(btrim(company_name), '\s+', ' ', 'g'))"


def normalize_company_name(name):
    """Collapse internal whitespace, trim, and case-fold a company name.

    Deliberately conservative: no punctuation stripping and no legal-suffix
    handling ("LLC", "L.L.C"), because merging two genuinely different
    licensees would be worse than leaving a duplicate for the operator to
    spot. Arabic names pass through unchanged apart from whitespace.
    """
    return re.sub(r"\s+", " ", (name or "").strip()).lower()


def display_company_name(name):
    """The form we persist: original casing, single-spaced, trimmed."""
    return re.sub(r"\s+", " ", (name or "").strip())


def clean_trade_license(value):
    """Sanity-clean a trade licence number for storage; None if unusable.

    There is no cross-emirate registry format to validate against, so this
    is deliberately light (issue #98): trim, collapse inner whitespace,
    require 3–64 characters with at least one alphanumeric. Uniqueness is
    enforced by migration 011's partial unique index on btrim().
    """
    cleaned = re.sub(r"\s+", " ", (value or "").strip())
    if len(cleaned) < 3 or len(cleaned) > 64:
        return None
    if not re.search(r"[0-9A-Za-z]", cleaned):
        return None
    return cleaned


def find_company_id(cur, company_name, trade_license=None):
    """Resolve an existing company id by trade licence, then normalised name.

    Returns the company id or None. Works with both tuple and RealDict
    cursors.
    """
    if trade_license and str(trade_license).strip():
        cur.execute(
            "SELECT id FROM public.companies "
            "WHERE trade_license_no IS NOT NULL AND btrim(trade_license_no) = %s",
            (str(trade_license).strip(),),
        )
        row = cur.fetchone()
        if row:
            return row["id"] if isinstance(row, dict) else row[0]

    normalized = normalize_company_name(company_name)
    if not normalized:
        return None
    cur.execute(
        f"SELECT id FROM public.companies WHERE {NORMALIZED_NAME_SQL} = %s",
        (normalized,),
    )
    row = cur.fetchone()
    if row:
        return row["id"] if isinstance(row, dict) else row[0]
    return None
