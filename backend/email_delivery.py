"""Whether the platform can actually send email — and saying so honestly.

WHY THIS EXISTS (found 2026-08-10): the seeker and company invite endpoints both
reported "Sent N invitations" when **nothing had been sent**. No SMTP server is
configured in any environment; `create_seeker_invitations` even documents itself
as "mock-email them". The magic link was written to the container log and
discarded from the API response, so an operator was told delivery had happened,
had no link to work with, and needed shell access to the host to recover it.

That is the failure mode this platform keeps being cleaned of: a message that
claims success for something that did not occur. An invitation that was never
delivered must never read as "Sent".

When SMTP is provisioned (see docs/app_store_accounts_request.md §3A — the
mailbox and the firewall opening are two separate approvals), setting SMTP_HOST
flips this and the wording corrects itself with no further code change.
"""
import os


def email_configured():
    """True only when a real SMTP host is configured.

    Deliberately checks SMTP_HOST rather than any code path being importable:
    the sending code exists and imports fine today, it simply has nowhere to
    connect to. Note that `recruiter/communication_engine.py` defaults this to
    'smtp.gmail.com' internally — a placeholder, not a configured relay — so the
    env var being *set* is the only trustworthy signal.
    """
    return bool((os.getenv('SMTP_HOST') or '').strip())


def invitation_result_message(sent_count, failed_count, noun='invitations'):
    """Wording for an invite response that matches what actually happened."""
    if email_configured():
        return f"Sent {sent_count} {noun} ({failed_count} failed)"
    return (
        f"Created {sent_count} {noun[:-1] if noun.endswith('s') else noun} "
        f"link(s) ({failed_count} failed). Email delivery is NOT configured — "
        f"nothing has been sent. Copy each link below and pass it to the "
        f"recipient manually."
    )
