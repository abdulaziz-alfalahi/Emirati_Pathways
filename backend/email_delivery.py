"""Whether the platform can actually send email — and saying so honestly.

WHY THIS EXISTS (found 2026-08-10): the seeker and company invite endpoints both
reported "Sent N invitations" when **nothing had been sent**. No SMTP server is
configured in any environment; `create_seeker_invitations` even documented itself
as "mock-email them". The magic link was written to the container log and
discarded from the API response, so an operator was told delivery had happened,
had no link to work with, and needed shell access to the host to recover it.

That is the failure mode this platform keeps being cleaned of: a message that
claims success for something that did not occur. An invitation that was never
delivered must never read as "Sent".

UPDATED 2026-08-26. Seeker invitations now QUEUE a real email (migration 088),
so there is a third state and it is the one that matters most:

    not configured    no transport at all — links must be passed by hand
    queued            a real message exists and is WAITING FOR APPROVAL
    sent              it actually left

"Queued" is not a softer way of saying sent. The whole point of per-message
approval is that a message can sit unapproved indefinitely, and an operator who
reads "Sent" will not go and approve it. Migrations 086/087 exist because 46
board emails and 131 invitation links sat exactly like that, unnoticed, aimed at
real employers — so the wording here has to push a person towards the queue
rather than let them assume the job is done.

Note that `SMTP_HOST` still controls the legacy wording and NOTHING ELSE: there
is no SMTP transport, and setting it would make this lie again. The real sender
is Microsoft Graph, configured through GRAPH_* and MAIL_SENDING_ENABLED.
"""
import os


def email_configured():
    """True only when a real SMTP host is configured.

    Deliberately checks SMTP_HOST rather than any code path being importable.
    Note that `recruiter/communication_engine.py` defaults this to
    'smtp.gmail.com' internally — a placeholder, not a configured relay — so the
    env var being *set* is the only trustworthy signal.

    DO NOT SET SMTP_HOST to switch on the Graph sender. It would only change
    wording, while delivery still depends on MAIL_SENDING_ENABLED, the
    recipient allow-list, and a per-message approval.
    """
    return bool((os.getenv('SMTP_HOST') or '').strip())


def invitation_result_message(sent_count, failed_count, noun='invitations',
                              queued_count=None):
    """Wording for an invite response that matches what actually happened.

    `queued_count` is the number of real messages now waiting for approval.
    Pass it wherever invitations queue mail, so the operator is told there is
    something to go and approve rather than something to copy by hand.
    """
    singular = noun[:-1] if noun.endswith('s') else noun

    if queued_count:
        return (
            f"Created {sent_count} {singular} link(s) ({failed_count} failed), "
            f"and queued {queued_count} email(s). NOTHING HAS BEEN SENT YET — "
            f"each message is waiting for approval under Admin → Outbound Mail, "
            f"and is delivered only once approved."
        )

    if email_configured():
        return f"Sent {sent_count} {noun} ({failed_count} failed)"

    return (
        f"Created {sent_count} {singular} "
        f"link(s) ({failed_count} failed). Email delivery is NOT configured — "
        f"nothing has been sent. Copy each link below and pass it to the "
        f"recipient manually."
    )
