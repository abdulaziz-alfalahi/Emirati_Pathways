"""User display name helpers for consistent name formatting.

Provides SQL fragments that prefer full_name when available,
falling back to first_name || last_name, then email.
"""


def user_display_name(alias: str, table_alias: str = 'u') -> str:
    """Return a SQL fragment: COALESCE(full_name, first||last, email) AS alias.

    Usage in f-strings:
        f"SELECT {user_display_name('candidate_name', 'u')} FROM users u"
    Produces:
        SELECT COALESCE(
            NULLIF(u.full_name, ''),
            NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''),
            u.email
        ) AS candidate_name FROM users u
    """
    return (
        f"COALESCE("
        f"NULLIF({table_alias}.full_name, ''), "
        f"NULLIF(TRIM(COALESCE({table_alias}.first_name, '') || ' ' || COALESCE({table_alias}.last_name, '')), ''), "
        f"{table_alias}.email"
        f") AS {alias}"
    )
