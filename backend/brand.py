"""The platform's name and the Council's, in one place.

Mirrors `frontend/src/lib/brand.ts`. Two modules now compose email that names
the platform — NAFIS seeker invitations and company magic links — and a name
copied into a second file is a name that will eventually differ from the first.

THE QUOTES ARE PART OF THE PLATFORM'S NAME. "Emirati" / "إماراتي" is the
product name quoted inside the descriptive title; it is not emphasis, and it
must survive translation, truncation and copy-editing.

Before this was pinned, the landing page and the invitation email carried FIVE
different Arabic names between them. That is not cosmetic when the name is the
first thing a candidate or an employer sees in a message from a government body
they have never heard from.

THE COUNCIL IS A DIFFERENT BODY from the platform it runs, so it carries no
quotes. Its English name was wrong in this codebase until 2026-08-26 — written
"Emirati Human Development Council", dropping "Resources" — and no test could
have caught that, because nothing here knows an organisation's real name. It
surfaced only because a message delivered to an EXTERNAL address renders the
Exchange signature, so our sign-off and theirs appeared one above the other and
disagreed. The Arabic الموارد is plural, which settles the English.
"""

PLATFORM_NAME_EN = '"Emirati" Human Development Platform'
PLATFORM_NAME_AR = 'منصة "إماراتي" للتنمية البشرية'

COUNCIL_NAME_EN = 'Emirati Human Resources Development Council'
COUNCIL_NAME_AR = 'مجلس تنمية الموارد البشرية الإماراتية'

#: Separates the Arabic half of a bilingual message from the English half.
BILINGUAL_RULE = '───────────────────────────────'
