"""Demographic distributions, read from the database, defined once.

WHY THIS FILE EXISTS

The board's Demographics tab was served from a spreadsheet. `/api/metrics/
demographics` called `demographics_parser.get_cached_demographics()`, which
parsed `/app/master_file.xlsx` — a file baked into the Docker image, last
modified 2026-07-04. It only changed when someone rebuilt the image, so every
chart on that tab was a seven-week-old snapshot while the CRM importer kept
writing to `candidate_profiles` underneath it (measured 2026-08-23).

The size of the gap, not just its age, was the problem:

    people charted from the spreadsheet          4,067
    people recorded in candidate_profiles       38,297

A board member reading "Gender Distribution" was reading 4,067 people and had
no way to know it. That is the same recorded-vs-registered failure
`populations.py` exists to prevent, one tab further along.

So the distributions are computed here, from the live tables, and every one of
them carries its coverage.

COVERAGE IS PART OF THE ANSWER, NOT A FOOTNOTE

These columns are populated very unevenly, because they arrive from different
importers that each filled in what their source file happened to carry
(measured live 2026-08-23, of 38,297 rows):

    gender                  36,670   96%
    age_group               37,611   98%
    education_level         36,431   95%
    marital_status          34,297   90%
    emirate_of_residence     3,632    9%   <-- 91% unknown
    military_status          2,367    6%   <-- 94% unknown

A bar chart of `emirate_of_residence` drawn without that context says "3,191 of
our people live in Dubai" when the honest statement is "of the 9% of records
that name an emirate, most say Dubai". Recharts will happily draw either. So
`distribution()` never returns bare counts: it returns the counts WITH the
number of records that carried the field, and the API refuses to serve a
distribution without it. The UI states coverage on the card.

`is_person_of_determination` is not exposed at all — 38,296 of 38,297 rows are
NULL. There is no distribution there to draw, only an invitation to misread one.
"""

# ── Vocabulary ──────────────────────────────────────────────────────────────
#
# Two importers wrote two spellings of the same categories into one column, so
# the education chart drew duplicate bars (measured 2026-08-23):
#
#     HighSchool       15,949     High School          798
#     BelowHighSchool   4,540     Below High School    131
#     Master's Degree      94     Master                 1
#
# These are the same category typed two ways, and migration 081 collapses them
# in the stored data. The map stays here because the collapse has to happen on
# the WRITE PATH too — the importer runs again next week, and a one-off UPDATE
# that nothing enforces is a cleanup that decays. `import_crm_master_file.py`
# calls normalise_education() so the duplicates cannot come back.
EDUCATION_ALIASES = {
    'highschool': 'High School',
    'belowhighschool': 'Below High School',
    'highdiploma': 'High Diploma',
    'master': "Master's Degree",
    'masters': "Master's Degree",
    'bachelor': "Bachelor's Degree",
    'bachelors': "Bachelor's Degree",
    'phd': 'Doctorate',
}

# DELIBERATELY NOT MERGED: 'University' (12,078) and "Bachelor's Degree" (1,168).
#
# It is tempting — they look like the same duplicate-vocabulary problem, and
# merging would tidy the chart. They are not the same thing. 'University' is the
# NAFIS bulk file's single coarse bucket for everyone with a university
# education; the CRM's spelled-out vocabulary distinguishes Bachelor's from
# Master's from Doctorate. Folding 'University' into "Bachelor's Degree" would
# assert that none of those 12,078 people hold a postgraduate degree, which the
# data does not say and which is certainly false.
#
# Both vocabularies appear within the same `candidates_source` values, so there
# is no importer rule that could split 'University' after the fact either. It
# stays its own bucket, ordered with the university-level entries, and the UI
# labels it as an unspecified level so nobody reads it as "bachelor's".
EDUCATION_UNSPECIFIED_LEVEL = 'University'

# Chart order. Education is ordinal — alphabetical ordering put "Below High
# School" first and Doctorate in the middle, which reads as noise. Anything not
# listed sorts last, by count.
EDUCATION_ORDER = [
    'Below High School',
    'High School',
    'Diploma',
    'High Diploma',
    'University',
    "Bachelor's Degree",
    "Master's Degree",
    'Doctorate',
]

EDUCATION_LABELS_AR = {
    'Below High School': 'أقل من الثانوية',
    'High School': 'الثانوية العامة',
    'Diploma': 'دبلوم',
    'High Diploma': 'دبلوم عالي',
    'University': 'تعليم جامعي (المستوى غير محدد)',
    "Bachelor's Degree": 'بكالوريوس',
    "Master's Degree": 'ماجستير',
    'Doctorate': 'دكتوراه',
}

# Emirate spellings, same problem in a column that is 91% empty to begin with —
# 'DUBAI' (11) sat beside 'Dubai' (3,191), and 'Alain'/'Al ain'/'alain' beside
# 'Al Ain'. Casing and typos only.
#
# NOT normalised: 'Al Ain' -> 'Abu Dhabi' and 'Hatta' -> 'Dubai'. Those are
# cities inside those emirates, and rolling them up is a geographic judgement,
# not a spelling fix. Hatta in particular is a named CRM cohort — the CRM team
# tracks it separately on purpose, and silently dissolving it into Dubai would
# destroy a distinction somebody relies on.
EMIRATE_ALIASES = {
    'dubai': 'Dubai',
    'abu dhabi': 'Abu Dhabi',
    'abu dahbi': 'Abu Dhabi',
    'sharjah': 'Sharjah',
    'ajman': 'Ajman',
    'ras al khaimah': 'Ras Al Khaimah',
    'fujairah': 'Fujairah',
    'al fujairah': 'Fujairah',
    'umm al quwain': 'Umm Al Quwain',
    'al ain': 'Al Ain',
    'alain': 'Al Ain',
    'hatta': 'Hatta',
}


def _normalise(value, aliases):
    if value is None:
        return None
    key = ' '.join(str(value).split()).lower()
    if not key:
        return None
    return aliases.get(key, ' '.join(str(value).split()))


def normalise_education(value):
    """Canonical education label, or None. Safe on already-canonical input."""
    return _normalise(value, EDUCATION_ALIASES)


def normalise_emirate(value):
    """Canonical emirate/city label, or None. Safe on already-canonical input."""
    return _normalise(value, EMIRATE_ALIASES)


# ── Cohorts ─────────────────────────────────────────────────────────────────
#
# The spreadsheet carried one sheet per cohort ("1st Priority JS List", "Hatta
# JS List", …) and the parser read each sheet separately. The same cohorts are
# already in the database as `candidate_profiles.crm_segments` (jsonb), written
# by the CRM importer — so the cuts survive the move off Excel without needing
# the sheets. Verified live 2026-08-23; counts are the segment memberships.
SEGMENTS = {
    'registered':     {'segment': None,                  'label_en': 'All recorded people',      'label_ar': 'جميع المسجّلين في البيانات'},
    'active':         {'segment': 'active',              'label_en': 'Active roster',            'label_ar': 'القائمة النشطة'},
    'priority_1st':   {'segment': 'priority_1',          'label_en': '1st priority',             'label_ar': 'الأولوية الأولى'},
    'priority_2nd':   {'segment': 'priority_2',          'label_en': '2nd priority',             'label_ar': 'الأولوية الثانية'},
    'priority_3rd':   {'segment': 'priority_3',          'label_en': '3rd priority',             'label_ar': 'الأولوية الثالثة'},
    'hatta':          {'segment': 'hatta',               'label_en': 'Hatta',                    'label_ar': 'حتا'},
    'cda':            {'segment': 'cda',                 'label_en': 'CDA',                      'label_ar': 'هيئة تنمية المجتمع'},
    'gdo':            {'segment': 'gdo',                 'label_en': 'GDO',                      'label_ar': 'الإدارة العامة للإقامة'},
    'no_answer':      {'segment': 'no_answer',           'label_en': 'No answer',                'label_ar': 'لم يتم الرد'},
    'special_request': {'segment': 'special_request',    'label_en': 'Special request',          'label_ar': 'طلب خاص'},
    'never_employed_21_24': {'segment': 'never_employed_21_24', 'label_en': 'Never employed, 21–24', 'label_ar': 'لم يسبق لهم العمل، ٢١–٢٤'},
    'prev_employed_21_24':  {'segment': 'prev_employed_21_24',  'label_en': 'Previously employed, 21–24', 'label_ar': 'سبق لهم العمل، ٢١–٢٤'},
}

# The fields the tab draws, and the column each reads. Ordering of the returned
# buckets differs by field: education is ordinal (EDUCATION_ORDER), age sorts by
# its own lower bound, everything else sorts by count.
FIELDS = {
    'gender':          'gender',
    'age':             'age_group',
    'education':       'education_level',
    'marital':         'marital_status',
    'military':        'military_status',
    'emirate':         'emirate_of_residence',
    'employment':      'work_status',
    # call_status is the one field where NULL is a fact rather than a gap: it
    # means the CRM has not called that person yet (32,058 of 38,297). The
    # reachability chart therefore draws total - known as "not yet called"
    # instead of letting the coverage note absorb it — "16% coverage" would
    # hide the operational number the CRM team actually wants.
    'call':            'call_status',
}


def _age_sort_key(name):
    # '18-23' -> 18, '60+' -> 60, anything unparseable sorts last.
    head = ''.join(c for c in str(name).split('-')[0] if c.isdigit())
    return int(head) if head else 9999


def _order_buckets(field, buckets):
    if field == 'education':
        rank = {name: i for i, name in enumerate(EDUCATION_ORDER)}
        return sorted(buckets, key=lambda b: (rank.get(b['name'], len(EDUCATION_ORDER)),
                                              -b['value']))
    if field == 'age':
        return sorted(buckets, key=lambda b: _age_sort_key(b['name']))
    return sorted(buckets, key=lambda b: -b['value'])


def build_cuts(cur):
    """Every cohort cut of every field, in a fixed number of queries.

    The page offers twelve cuts and draws seven charts on each. Asking per cut
    per field would be 84 round trips for one page load, so each field is read
    once grouped by segment and once overall, and the cuts are assembled here —
    16 queries regardless of how many cohorts the CRM invents later.

    NULLs are excluded from the buckets rather than drawn as an "Unknown" bar:
    on emirate_of_residence that bar would be 34,665 against a largest real
    value of 3,191 and the chart would show nothing else. Dropping them
    silently would instead overstate what the data knows, so every cut carries
    a `coverage` block and the UI states it on the card.
    """
    known_cols = ', '.join(
        f"COUNT(NULLIF(TRIM(cp.{col}::text), '')) AS {field}_known"
        for field, col in FIELDS.items())

    cur.execute(f"SELECT COUNT(*) AS total, {known_cols} FROM candidate_profiles cp")
    overall_coverage = cur.fetchone()

    cur.execute(f"""SELECT s.seg AS seg, COUNT(*) AS total, {known_cols}
                      FROM candidate_profiles cp
                      CROSS JOIN LATERAL
                           jsonb_array_elements_text(cp.crm_segments) AS s(seg)
                     GROUP BY 1""")
    segment_coverage = {r['seg']: r for r in cur.fetchall()}

    overall_buckets = {}
    segment_buckets = {}
    for field, col in FIELDS.items():
        cur.execute(f"""SELECT TRIM(cp.{col}::text) AS name, COUNT(*) AS value
                          FROM candidate_profiles cp
                         WHERE cp.{col} IS NOT NULL
                           AND TRIM(cp.{col}::text) <> ''
                         GROUP BY 1""")
        overall_buckets[field] = [{'name': r['name'], 'value': int(r['value'])}
                                  for r in cur.fetchall()]

        cur.execute(f"""SELECT s.seg AS seg, TRIM(cp.{col}::text) AS name,
                               COUNT(*) AS value
                          FROM candidate_profiles cp
                          CROSS JOIN LATERAL
                               jsonb_array_elements_text(cp.crm_segments) AS s(seg)
                         WHERE cp.{col} IS NOT NULL
                           AND TRIM(cp.{col}::text) <> ''
                         GROUP BY 1, 2""")
        by_seg = {}
        for r in cur.fetchall():
            by_seg.setdefault(r['seg'], []).append(
                {'name': r['name'], 'value': int(r['value'])})
        segment_buckets[field] = by_seg

    empty_coverage = dict({'total': 0}, **{f'{f}_known': 0 for f in FIELDS})

    cuts = {}
    for key, meta in SEGMENTS.items():
        seg = meta['segment']
        coverage = (overall_coverage if seg is None
                    else segment_coverage.get(seg, empty_coverage))
        total = int(coverage['total'] or 0)

        cut = {
            'total': total,
            'label_en': meta['label_en'],
            'label_ar': meta['label_ar'],
            'coverage': {},
        }
        for field in FIELDS:
            raw = (overall_buckets[field] if seg is None
                   else segment_buckets[field].get(seg, []))
            known = int(coverage[f'{field}_known'] or 0)
            cut[field] = _order_buckets(field, list(raw))
            cut['coverage'][field] = {
                'known': known,
                'total': total,
                'pct': round(100.0 * known / total, 1) if total else 0.0,
                'note': coverage_note_bilingual(known, total),
            }
        cuts[key] = cut

    return cuts


def coverage_note_bilingual(known, total):
    """The sentence that goes under a chart, in both languages.

    Bilingual for the same reason `populations.scope_note_bilingual` is: an
    Arabic reader given the chart with an English caveat has been given the
    claim without the qualification.
    """
    if not total:
        return {'en': 'No records.', 'ar': 'لا توجد سجلات.'}
    pct = round(100.0 * known / total)
    return {
        'en': f'Based on {known:,} of {total:,} records ({pct}%) that state this field.',
        'ar': f'استناداً إلى {known:,} من {total:,} سجل ({pct}٪) تتضمن هذه البيانات.',
    }
