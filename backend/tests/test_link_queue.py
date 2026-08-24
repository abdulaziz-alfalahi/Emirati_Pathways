"""The operator's queue must contain only what a person can act on.

WHY THIS FILE EXISTS

The daily link check produces four states. Two of them are directory work and
two are not, and mixing them would break the feature in a way that looks like it
is working:

    changed / gone   the operator's problem — the page moved or died
    verified_ok      nothing to do
    unreachable      OUR problem — proxy, TLS, timeout

`unreachable` is the dangerous one. If it reached the queue, a proxy outage
would present as every scholarship in the directory dying at once, and the
obvious response — unpublishing them — would be catastrophic and undone by hand.

That is not hypothetical. On 2026-08-23 the very first source we checked, KHDA,
failed verification from inside our container because their web host serves an
incomplete certificate chain. KHDA runs the AED 1.1bn Hamdan bin Mohammed
programme. A queue that could not tell "we cannot read this" from "this ended"
would have invited an operator to archive it.

The candidate-facing half has the mirror-image rule: a check date is shown ONLY
when the check succeeded, and the internal status is never exposed. "Checked on
Tuesday" reads as "working on Tuesday", so attaching that date to a failed check
would be a claim we cannot support.
"""
import os
import re

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROUTES = os.path.join(BACKEND, 'education_api_routes.py')


def _src():
    with open(ROUTES, encoding='utf-8') as fh:
        return fh.read()


def _function(name):
    src = _src()
    start = src.index(f'def {name}(')
    nxt = src.find('\n@education_bp', start)
    return src[start:nxt if nxt > 0 else len(src)]


# ── The queue ───────────────────────────────────────────────────────────────

def test_the_queue_excludes_unreachable():
    """A proxy outage must not look like every programme dying at once."""
    body = _function('scholarship_link_queue')
    where = body[body.index('WHERE'):body.index('ORDER BY')]
    assert 'unreachable' not in where, (
        "the queue selects 'unreachable' entries, so an outage on our side "
        "would present to the operator as dead scholarships"
    )
    assert "'gone'" in where and "'changed'" in where


def test_the_queue_is_privileged():
    src = _src()
    deco = src[:src.index('def scholarship_link_queue(')]
    assert 'require_roles' in deco.rsplit('@education_bp.route', 1)[1], (
        'the queue exposes which programmes we are struggling to read; it needs '
        'a role check like every other management endpoint'
    )


def test_unreachable_is_still_reported_just_not_as_work():
    """The operator should see we are having trouble — separately."""
    body = _function('scholarship_link_queue')
    assert "'unreachable'" in body, (
        'unreachable is not surfaced at all, so a source we cannot read is '
        'invisible — silence is not success'
    )
    assert 'unreachable' in body.split('return jsonify')[1]


def test_dead_links_are_ranked_above_changed_ones():
    """A dead link is actively sending candidates nowhere; a changed page is
    usually a moved deadline."""
    body = _function('scholarship_link_queue')
    order = body[body.index('ORDER BY'):]
    assert "WHEN 'gone' THEN 0" in order


# ── What the candidate sees ─────────────────────────────────────────────────

def test_the_public_list_shows_a_check_date_only_when_the_check_passed():
    body = _function('get_scholarships')
    assert "link_status') == 'verified_ok'" in body.replace('"', "'"), (
        "the check date is not conditioned on the check having succeeded — "
        '"checked on Tuesday" reads as "working on Tuesday"'
    )


def test_the_public_list_hides_the_internal_link_state():
    """'gone' or 'changed' is a review state, not advice for a candidate."""
    body = _function('get_scholarships')
    for internal in ('link_status', 'link_status_detail', 'link_fingerprint'):
        assert f"'{internal}'" in body, f'{internal} is not explicitly removed'
    assert 'pop(' in body, 'internal fields are not stripped from the response'
