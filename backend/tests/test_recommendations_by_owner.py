"""Accountability sits with the owner of the action.

CHAIRMAN'S DECISION, 2026-08-21 (relayed by the owner): the platform must not
generate a board member engagement percentage; what is tracked is to be related
to the owner of the action instead.

That closes the two participation-rate requests (fb_1787140915, fb_1786012027),
which proposed scoring a member by how long they sat in a meeting. It also
rules out the obvious substitute — averaging a member's actions into one figure
— because that rebuilds the same score from different inputs, and a worse one:
the owner of a single hard action would rank below the owner of five easy ones.

So the percentages stay attached to ACTIONS. The grouping says who is
accountable and what is late. These tests exist because that distinction is
easy to erode later, one helpful-looking aggregate at a time.
"""
import os

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


def _summary_body():
    src = _src('routes', 'board_portal_routes.py')
    return src.split('def recommendations_summary')[1].split('\n@board_portal_bp.route')[0]


def _strip_prose(text):
    """Drop the leading docstring and comment lines; keep the code and SQL."""
    stripped = text.lstrip()
    for q in ('"""', "'''"):
        if stripped.startswith(q):
            close = stripped.find(q, 3)
            text = stripped[close + 3:] if close != -1 else ''
            break
    out = []
    for line in text.split('\n'):
        for marker in ('#', '--'):
            i = line.find(marker)
            if i != -1:
                line = line[:i]
        out.append(line)
    return '\n'.join(out)


# ── The constraint ──────────────────────────────────────────────────────────

def test_no_per_person_percentage_is_emitted():
    """The line the chairman drew. A per-owner group carries counts and an
    overdue tally — never a percentage of its own."""
    code = _strip_prose(_summary_body())
    grouping = code.split('by_owner = {}')[1]
    for forbidden in ('completion_percent', 'percent', 'score', 'engagement', 'rate'):
        assert forbidden not in grouping.split("'actions': []")[0], \
            f"per-owner group computes a {forbidden}"


def test_a_group_carries_only_facts_about_the_work():
    code = _strip_prose(_summary_body())
    for key in ("'owner_id'", "'owner_name'", "'owner_entity'", "'counts'", "'overdue'", "'actions'"):
        assert key in code


def test_the_actions_keep_their_own_percentages():
    """Removing the person-level score must not remove the action-level one —
    that figure is what the board actually tracks."""
    code = _strip_prose(_summary_body())
    assert "'completion_percent': pct" in code


# ── One set of rules, not two ───────────────────────────────────────────────

def test_the_per_owner_counts_use_the_same_bucketing_as_the_portfolio():
    """'open' is a real stored status and belongs in 'outstanding'. Keying the
    per-owner counts off the raw status dropped every 'open' action from its
    owner while the portfolio total still counted it — a silent undercount on
    a governance screen."""
    code = _strip_prose(_summary_body())
    assert 'def bucket(' in code
    assert "g['counts'][it['bucket']] += 1" in code
    assert "'bucket': bucket(st)" in code


def test_open_is_bucketed_as_outstanding():
    code = _strip_prose(_summary_body())
    fn = code.split('def bucket(')[1].split('counts = {')[0]
    assert "return 'outstanding'" in fn, 'an unrecognised status must not vanish'


def test_the_grouping_is_built_from_the_same_items_the_portfolio_uses():
    """A second query would be a second set of rules, free to drift."""
    code = _strip_prose(_summary_body())
    assert 'for it in items:' in code


# ── Reading order ───────────────────────────────────────────────────────────

def test_the_most_overdue_owner_comes_first():
    """The order a chairman reads in — what is late, before what is merely
    open."""
    code = _strip_prose(_summary_body())
    assert "-g['overdue']" in code


def test_an_unowned_action_is_still_grouped():
    """An action with no owner must not disappear from an accountability view;
    it groups under its entity, or under 'unassigned'."""
    code = _strip_prose(_summary_body())
    assert 'unassigned' in code


# ── The portfolio figure is untouched ───────────────────────────────────────

def test_the_overall_average_rules_are_unchanged():
    """The existing averaging is deliberate and documented; this change groups
    the same items and must not alter it."""
    code = _strip_prose(_summary_body())
    assert "contributing.append(100 if pct is None else pct)" in code
    assert "contributing.append(0 if pct is None else pct)" in code
    assert "overall = round(sum(contributing) / len(contributing)) if contributing else None" in code


# ── Recorded by whom (GH #460) ──────────────────────────────────────────────

def test_who_recorded_the_percentage_is_returned():
    """Owner ruling 2026-08-21: the secretary MAY record progress on a board
    member's behalf.

    That was already permitted and already happening — every live
    recommendation was last written by the secretary — and
    completion_updated_by has been stored on each change since the feature
    shipped. It was never read back, so a figure typed by the secretariat
    looked exactly like one the owner had stated.

    Harmless while progress was housekeeping; not now. The chairman made action
    progress THE accountability measure the same day, so "60%" means something
    different depending on who said it. Permission to enter it on someone's
    behalf and visibility of having done so are one decision.
    """
    code = _strip_prose(_summary_body())
    assert 'd.completion_updated_by' in code, 'the column is written but not selected'
    assert 'completion_updated_by_name' in code, 'an id is not an attribution'


def test_on_behalf_is_distinguished_from_the_owner_recording_it():
    """A member updating their own action is the normal case and must not be
    labelled as anything else."""
    code = _strip_prose(_summary_body())
    assert "'recorded_on_behalf'" in code
    block = code.split("'recorded_on_behalf'")[1][:400]
    assert 'owner_id' in block, 'on-behalf must be decided against the OWNER'


def test_the_updater_is_resolved_by_a_separate_join():
    """Reusing the owner join would name the owner as the person who recorded
    it — which is precisely the confusion this fixes."""
    code = _strip_prose(_summary_body())
    assert 'LEFT JOIN users w ON w.id = d.completion_updated_by' in code
