"""One chip per job, not per role id.

REPORTED BY THE OWNER 2026-09-01: his row in the Operators console showed
"Administrator" twice.

He holds both `admin` and `administrator`. They are two distinct role ids that
are aliases for the same job, and role_labels.py gives them the same label — so
a list that dedupes on the ID renders two identical chips, which reads as two
different things rather than one.

Three labels are shared by more than one id today:

    Administrator  <- admin, administrator, platform_administrator,
                      super_admin, super_user
    HR Manager     <- employer_admin, hr_manager
    Job Seeker     <- candidate, seeker

The filter chips at the top of the same screen ALREADY collapse by label — the
`grouped` helper, whose comment describes this exact problem. It was fixed there
and not in the rows, which is the recurring shape of this bug class: one fact,
several places that render it. See the role-name registry work (migration 092).
"""
import json
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(BACKEND)
for path in (BACKEND, REPO):
    if path not in sys.path:
        sys.path.insert(0, path)

from collections import defaultdict  # noqa: E402

from role_labels import ROLE_LABELS  # noqa: E402

COMPONENT = os.path.join(REPO, 'frontend', 'src', 'components', 'admin',
                         'StaffDirectory.tsx')
SOURCE = open(COMPONENT, encoding='utf-8').read()


def labels_to_ids():
    out = defaultdict(set)
    for role_id, (label_en, _label_ar) in ROLE_LABELS.items():
        out[label_en].add(role_id)
    return out


def test_aliases_exist_so_the_collapse_is_load_bearing():
    """If this ever becomes empty, the collapse below is dead code and can go.
    Until then it is the only thing preventing duplicate chips."""
    shared = {label: ids for label, ids in labels_to_ids().items() if len(ids) > 1}
    assert shared, 'no label is shared by two ids — did the registry change?'
    assert 'Administrator' in shared
    assert {'admin', 'administrator'} <= shared['Administrator']


def test_english_and_arabic_aliases_agree():
    """A pair that collapses in English but not Arabic would show one chip to
    an English reader and two to an Arabic one."""
    by_en = defaultdict(set)
    for role_id, (en, _ar) in ROLE_LABELS.items():
        by_en[en].add(role_id)
    for en, ids in by_en.items():
        arabic = {ROLE_LABELS[i][1] for i in ids}
        assert len(arabic) == 1, (
            f'ids {sorted(ids)} share the English label "{en}" but differ in '
            f'Arabic: {sorted(arabic)}')


def test_the_row_chips_collapse_by_label():
    assert 'chipsFor' in SOURCE, 'the per-row chips no longer collapse aliases'
    assert 'p.roles.filter(r => r.is_staff_role).map(roleChip)' not in SOURCE, \
        'the row renders one chip per role id again — aliases will duplicate'


def test_the_secondary_role_list_collapses_too():
    """`candidate` and `seeker` both read "Job Seeker" in the quiet "also:"
    line, which had the same defect.

    Scoped to the block that renders it. `new Set` wraps the filter, so it sits
    BEFORE the `!r.is_staff_role` it deduplicates — splitting on that lands on
    the wrong side of it, which is how the first version of this test failed
    against code that was already correct.
    """
    start = SOURCE.index("b('also'")
    block = SOURCE[start:SOURCE.index(".join(', ')", start)]
    assert 'new Set' in block, 'the "also" list no longer dedupes labels'
    assert '!r.is_staff_role' in block


def test_primary_wins_when_an_alias_is_secondary():
    """Collapsing must not demote a primary role to secondary styling just
    because an alias of it happens to be listed as additional."""
    block = SOURCE[SOURCE.index('const chipsFor'):]
    block = block[:block.index('const roleChip')]
    assert "source !== 'primary'" in block and "r.source === 'primary'" in block, \
        'chipsFor does not prefer the primary entry when aliases collide'
