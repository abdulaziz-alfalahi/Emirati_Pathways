"""Compare the skills a client holds against a target role's requirements.

WHY THIS IS CAUTIOUS (docs/skill_gap_comparison_scope.md)

The two vocabularies barely intersect. Measured live 2026-08-16 across 7 career
paths, 36 role nodes and 76 distinct held skills:

    required skills found in skill_taxonomy    8 / 135   (6%)
    held skills found in skill_taxonomy       10 /  76  (13%)
    required skills held, by string match     15 / 135  (11%)

`career_paths` says "Accounting Principles"; `user_skills` says "Microsoft
Excel". A string diff would report roughly 120 of 135 required skills as gaps,
including ones the client plainly has under a different name — and a coach
showing that to a client in a session is not just wrong, it is visibly wrong.

SO THIS MODULE NEVER ASSERTS "MISSING" ON ITS OWN.

    held      an exact normalised match, or a coach said so
    missing   a coach said so — never inferred
    unclear   everything else: not yet reviewed

`unclear` is the honest default, not a failure state. With a resolver this weak,
"we could not tell" is the true answer, and saying it is what keeps the feature
usable in front of a client. The coach then works through the list, and each
decision is recorded — which is simultaneously the answer for this client and
the labelled training data a real resolver (Phase 2) will need.

Phase 2 replaces `_matches` and nothing else. That is the whole point of keeping
the matching in one small function.
"""

import logging
import re
from typing import Any, Dict, List, Optional

try:
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover — the app runs under both roots
    from db_utils import execute_query

logger = logging.getLogger(__name__)

HELD = 'held'
MISSING = 'missing'
UNCLEAR = 'unclear'

# Stored statuses. 'unclear' is deliberately absent: it is the absence of a
# review, and storing it would blur "not looked at" with "looked at, could not
# tell". The DB CHECK in migration 070 enforces the same thing.
REVIEWABLE = (HELD, MISSING)

# `+` and `#` are KEPT because they carry meaning in skill names. Stripping all
# punctuation collapsed C, C++ and C# to "c" — and C++ is in the live held-skills
# data, so the module would have told a coach the client holds C++ when they had
# listed C. A false HELD is worse than a false gap here: the coach never works on
# a real deficiency, and nothing surfaces the error.
_PUNCT = re.compile(r'[^a-z0-9+#؀-ۿ]+')


def normalise(name: str) -> str:
    """Casefold and reduce separators so trivial spelling differences match.

    Deliberately conservative. It matches "Project-Management" and
    "project management", or differences of case. It does NOT match
    "Microsoft Excel"/"Excel", "Communication & Negotiation"/"Communication",
    or "Node.js"/"nodejs" — the dot becomes a separator, so that pair stays
    unmatched and lands in `unclear` for the coach to resolve.

    That last one is a deliberate miss, not an oversight. Making this cleverer
    is exactly how false matches get created, and `unclear` costs a coach one
    click while a wrong answer costs them the client's confidence. Phase 2
    improves this with evidence behind it.
    """
    return _PUNCT.sub(' ', (name or '').lower()).strip()


def _matches(required: str, held_names: Dict[str, str]) -> Optional[str]:
    """The held skill this requirement resolves to, or None.

    THE ONLY PLACE MATCHING HAPPENS. Phase 2 swaps this for an LLM or embedding
    resolver and everything above it is unchanged.
    """
    return held_names.get(normalise(required))


# ── Target roles ────────────────────────────────────────────────────────────

def role_key(path_id: str, index: int) -> str:
    """'<career_path_id>:<node_index>'.

    The nodes array has no stable identifier of its own, so position is the only
    handle available. If nodes are ever reordered, existing reviews point at the
    wrong role — worth an id on the node before this gets heavy use.
    """
    return f'{path_id}:{index}'


def list_target_roles() -> List[Dict[str, Any]]:
    """Every role a coach can aim a client at, flattened from career_paths.

    Only nodes that actually declare required_skills are returned: a target with
    nothing to compare against would present as a role whose every requirement
    is met.
    """
    rows = execute_query(
        "SELECT id, title_en, title_ar, sector, nodes FROM career_paths ORDER BY title_en"
    ) or []

    roles = []
    for r in rows:
        nodes = r.get('nodes') or []
        if isinstance(nodes, str):
            import json
            try:
                nodes = json.loads(nodes)
            except ValueError:
                continue
        for i, node in enumerate(nodes):
            if not isinstance(node, dict):
                continue
            required = [s for s in (node.get('required_skills') or []) if s]
            if not required:
                continue
            roles.append({
                'role_key': role_key(str(r['id']), i),
                'path_title': r.get('title_en'),
                'path_title_ar': r.get('title_ar'),
                'sector': r.get('sector'),
                'role': node.get('role'),
                'role_ar': node.get('role_ar'),
                'years_experience': node.get('years_experience'),
                'required_count': len(required),
            })
    return roles


def _role_requirements(key: str) -> Optional[Dict[str, Any]]:
    """The required skills for one role_key, or None if it does not resolve."""
    if not key or ':' not in key:
        return None
    path_id, _, idx = key.rpartition(':')
    try:
        idx = int(idx)
    except ValueError:
        return None

    row = execute_query(
        "SELECT id, title_en, nodes FROM career_paths WHERE id = %s", (path_id,), fetch_one=True
    )
    if not row:
        return None
    nodes = row.get('nodes') or []
    if isinstance(nodes, str):
        import json
        try:
            nodes = json.loads(nodes)
        except ValueError:
            return None
    if idx < 0 or idx >= len(nodes) or not isinstance(nodes[idx], dict):
        return None

    node = nodes[idx]
    return {
        'role_key': key,
        'path_title': row.get('title_en'),
        'role': node.get('role'),
        'role_ar': node.get('role_ar'),
        'years_experience': node.get('years_experience'),
        'certifications': node.get('certifications') or [],
        'required_skills': [s for s in (node.get('required_skills') or []) if s],
    }


# ── The comparison ──────────────────────────────────────────────────────────

def compare(client_id: str, key: str) -> Optional[Dict[str, Any]]:
    """Required vs held for one client against one target role.

    Returns None when the role_key does not resolve, so the caller can 404
    rather than render an empty comparison as though the client met everything.
    """
    role = _role_requirements(key)
    if role is None:
        return None

    held_rows = execute_query(
        """SELECT skill_name, proficiency, source, verified
             FROM user_skills WHERE user_id = %s AND skill_name IS NOT NULL""",
        (client_id,)
    ) or []
    # normalised -> original, so the coach sees the name as the client wrote it.
    held_names = {normalise(r['skill_name']): r['skill_name'] for r in held_rows}

    reviews = {
        r['skill_name']: r for r in (execute_query(
            """SELECT skill_name, status, matched_skill FROM skill_gap_reviews
                WHERE client_id = %s AND role_key = %s""", (client_id, key)) or [])
    }

    skills, counts = [], {HELD: 0, MISSING: 0, UNCLEAR: 0}
    for required in role['required_skills']:
        review = reviews.get(required)
        auto = _matches(required, held_names)

        if review:                       # a coach's judgement always wins
            state = review['status']
            matched = review.get('matched_skill') or auto
            decided_by = 'coach'
        elif auto:
            state = HELD
            matched = auto
            decided_by = 'exact_match'
        else:
            state = UNCLEAR              # never 'missing' without a human
            matched = None
            decided_by = None

        counts[state] += 1
        skills.append({
            'required': required,
            'state': state,
            'matched_skill': matched,
            'decided_by': decided_by,
        })

    return {
        'role': {k: role[k] for k in
                 ('role_key', 'path_title', 'role', 'role_ar', 'years_experience', 'certifications')},
        'summary': {
            'required': len(role['required_skills']),
            'held': counts[HELD],
            'missing': counts[MISSING],
            'unclear': counts[UNCLEAR],
            # Said plainly so a caller cannot present unclear as a finding.
            'note': 'Unclear means not yet reviewed, not a gap. Only a coach marks a skill missing.',
        },
        'skills': skills,
        'client_skills': [
            {'name': r['skill_name'], 'proficiency': r.get('proficiency'),
             'source': r.get('source'), 'verified': r.get('verified')}
            for r in held_rows
        ],
    }


def record_review(client_id: str, coach_id: str, key: str, skill_name: str,
                  status: str, matched_skill: Optional[str] = None) -> bool:
    """Store a coach's judgement. Returns False if the status is not storable."""
    if status not in REVIEWABLE:
        return False
    result = execute_query(
        """INSERT INTO skill_gap_reviews
               (client_id, coach_id, role_key, skill_name, status, matched_skill)
           VALUES (%s, %s, %s, %s, %s, %s)
           ON CONFLICT (client_id, role_key, skill_name) DO UPDATE
               SET status = EXCLUDED.status,
                   matched_skill = EXCLUDED.matched_skill,
                   coach_id = EXCLUDED.coach_id,
                   updated_at = now()
           RETURNING id""",
        (client_id, coach_id, key, skill_name, status, matched_skill), fetch_one=True
    )
    return bool(result)
