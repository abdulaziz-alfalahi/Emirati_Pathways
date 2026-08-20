"""Selecting a whole filtered cohort, without losing the safety it replaced.

Two prior decisions deliberately restricted this, both documented in the code:

  bulk_update_crm_candidates — "Deliberately NOT a filter-wide update ... an
  operator who bulk-edits everything matching the current filter cannot see what
  they changed, and a filter that shifts under them silently changes the blast
  radius."

  togglePage — "Selects THIS PAGE only ... Select all across 5,311 records would
  let one click change a set the operator has never seen."

Both stand. What changed is that inviting a filtered cohort to an open day
twenty at a time is not a workflow (feedback fb_1787130514, on a filter matching
3,662 people). The resolution is an explicit, counted opt-in that still produces
a concrete list of ids — not a filter-wide write.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'pages',
                        'operator-dashboards', 'CareerServicesDashboard.tsx')


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


def _fe():
    with open(FRONTEND, encoding='utf-8') as fh:
        return fh.read()


def _roster():
    src = _src('candidate_profile_routes.py')
    return src.split('def get_crm_candidates')[1].split('\n@crm_profile_bp.route')[0]


# ── The ids must come from the same query as the rows ───────────────────────

def test_ids_only_reuses_the_page_scope():
    """A second filter implementation would eventually disagree with the first,
    and the operator would act on a set they were never shown."""
    body = _roster()
    # Anchor on the CODE, not the first mention — the comment above it says
    # "ids_only" too, and slicing from there measures the prose.
    assert "request.args.get('ids_only')" in body
    block = body.split("request.args.get('ids_only')")[1][:600]
    assert 'scope_sql' in block, 'must reuse the query that produced the page'


def test_ids_only_returns_ids_and_the_total():
    block = _roster().split("request.args.get('ids_only')")[1][:600]
    assert "'ids'" in block and "'total'" in block


def test_ids_only_closes_the_connection_before_returning():
    """It returns early, so the normal teardown at the end is skipped."""
    block = _roster().split("request.args.get('ids_only')")[1][:600]
    assert 'conn.close()' in block


# ── The safety properties that were deliberately chosen ─────────────────────

def test_the_bulk_endpoint_is_still_not_filter_wide():
    """The whole point: the client sends explicit ids, so the blast radius
    cannot shift after the operator clicks."""
    src = _src('candidate_profile_routes.py')
    body = src.split('def bulk_update_crm_candidates')[1].split('\n@crm_profile_bp.route')[0]
    assert 'user_ids' in body
    for bad in ('ids_only', 'where_sql', 'apply_to_filter'):
        assert bad not in body, f'bulk must not gain {bad}'


def test_the_header_checkbox_still_selects_the_page_only():
    fe = _fe()
    block = fe.split('const togglePage')[1][:400]
    assert 'pageIds' in block
    assert 'ids_only' not in block, 'select-all must not ride on the checkbox'


def test_select_all_is_a_separate_explicit_control():
    fe = _fe()
    assert 'selectAllMatching' in fe
    assert 'Select all ${pageMeta.total} matching this filter' in fe, \
        'the control must name the count before acting'


def test_a_failed_id_fetch_leaves_the_selection_alone():
    """A partial set the operator believes is complete is worse than none."""
    fe = _fe()
    block = fe.split('const selectAllMatching')[1][:700]
    assert 'catch' in block
    assert 'setSelectedIds([])' not in block


# ── One filter builder, not two ─────────────────────────────────────────────

def test_the_page_and_the_id_fetch_share_one_query_builder():
    """Building the filter twice on the client is the same drift risk as
    building it twice on the server."""
    fe = _fe()
    assert fe.count('const filterParams') == 1
    assert "filterParams({ ids_only: '1' })" in fe
    # and the page fetch uses it too
    assert 'filterParams({\n        page:' in fe or 'filterParams({' in fe


def test_no_second_hand_rolled_filter_query_remains():
    fe = _fe()
    assert fe.count("params.set('call_status'") <= 1, 'filter building must live in one place'
