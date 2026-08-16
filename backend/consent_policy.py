"""What every platform user agrees to, and which version of it.

WHY THIS MODULE EXISTS

The consent list was a literal inside the registration handler and the policy
version was the string '1.0' typed at each INSERT site. Adding a new consent
meant finding every one of them, and nothing recorded that the terms had
changed. For a government platform that must be able to evidence what a user
agreed to and when, that is the wrong shape.

THE RECORDING CONSENT (owner decision 2026-08-16)

All video sessions on the platform — interviews, board meetings and coaching —
are transcribed and retained, and this is disclosed in the terms every user
accepts. The reason is a records obligation: a government entity asked for a
session record should not have to answer that it does not keep one.

POLICY_VERSION IS BUMPED WITH THE TERMS, AND THAT MATTERS

Users who registered under 1.0 accepted terms that said nothing about recording.
Treating that acceptance as consent to be recorded would produce exactly the
weakness this change exists to remove: asked to evidence consent, we would be
showing agreement to a document that did not mention it.

So `has_current_consent()` compares the version, and the join path records when
a participant lacks a current one. That is deliberately a RECORDED GAP rather
than a refusal — a lookup returning False must not take a session away from
someone, because being wrong in that direction is a broken platform.

NO RE-ACCEPTANCE FLOW IS NEEDED, and this is settled (owner, 2026-08-16). The
users sitting on policy 1.0 are pre-launch: imported CRM records that have
never logged in, plus EHRDC staff testing. There is no real user whose
expectations were set by the 1.0 terms, so there is nobody to re-ask.

The gap therefore closes by itself rather than by a migration or a prompt: UAE
Pass registration writes REQUIRED_CONSENTS at POLICY_VERSION, so every user who
arrives after the 2026-08-16 deploy is on 1.1 with `recording` from their first
login. Do not read the 1.0 row count as a compliance finding — it is a
pre-launch artefact, and it stops growing on its own.

What WOULD need a re-acceptance flow is bumping POLICY_VERSION again after real
users exist. That is the point at which this paragraph stops applying.
"""

import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# Bump when the terms change in a way a user should re-accept. 1.1 adds the
# disclosure that video sessions are transcribed and retained.
POLICY_VERSION = '1.1'

# Recorded at registration. Not a menu: a user cannot decline one and use the
# platform, which is why they are captured together and evidenced together.
REQUIRED_CONSENTS: List[str] = ['terms', 'privacy', 'data_processing', 'recording']

# The consent that covers transcription of video sessions.
RECORDING = 'recording'

# How long a transcript is kept. Deliberately a named constant rather than a
# literal in the purge script: it is a records-retention decision, not a
# technical one, and whoever changes it should see this comment.
#
# 2555 days (7 years), CONFIRMED BY THE OWNER 2026-08-16. It matches
# AUDIT_RETENTION_DAYS, which is the platform's existing answer to "how long do
# we keep something an authority may ask for" — but it is a separate constant on
# purpose, because a transcript of a coaching conversation and an audit log entry
# are not the same class of record and one may need to change without the other.
#
# Shortening this later does not un-record anything already captured: the purge
# deletes by age, so a reduction takes effect on the next run and is not
# retroactive to what a user was told at the time they consented.
TRANSCRIPT_RETENTION_DAYS = 2555


def has_current_consent(user_id: str, consent_type: str = RECORDING,
                        version: str = POLICY_VERSION) -> Optional[bool]:
    """True if the user granted this consent under the current policy version.

    Returns None when the answer cannot be determined — a database problem must
    not read as "the user did not consent", which would be a false record in
    exactly the direction that matters.
    """
    try:
        from backend.db_utils import execute_query
    except ImportError:  # pragma: no cover — the app runs under both roots
        from db_utils import execute_query

    try:
        row = execute_query(
            """SELECT 1 FROM consents
                WHERE user_id = %s AND consent_type = %s
                  AND policy_version = %s AND granted IS TRUE
                  AND withdrawn_at IS NULL
                LIMIT 1""",
            (user_id, consent_type, version), fetch_one=True)
        return row is not None
    except Exception as e:
        logger.warning("consent check failed for %s/%s: %s", user_id, consent_type, e)
        return None
