#!/usr/bin/env python3
"""Can we actually read the sources the directory depends on?

    .venv/bin/python backend/scripts/verify_sources.py
    .venv/bin/python backend/scripts/verify_sources.py --json

WHY THIS EXISTS

A scout that cannot reach its sources produces nothing, and producing nothing
looks exactly like "there was nothing new today". The scope calls that out as a
failure mode to design against: silence is not success.

So reachability is checked explicitly, per domain, and is meant to be run at
deploy and on a schedule. It exits non-zero when a source cannot be read, which
makes it usable as a deployment gate rather than something someone remembers to
look at.

This is Phase 0 — it needs no model, no scouting and no scheduler, and it is the
thing that would have caught the KHDA problem before any of the rest was built.
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from link_verification import check_link, VERIFIED_OK, UNREACHABLE  # noqa: E402

# The allow-list, Phase 0 edition. Decision 5 gives the Education Operator the
# ability to add domains, which needs a table and an editor — Phase 2. Until
# then the sources we already know about live here, so the reachability check
# has something concrete to assert.
#
# One URL per domain, chosen to be a page that should always exist rather than a
# specific programme that will close.
SOURCES = [
    ('KHDA (Dubai)', 'https://www.khda.gov.ae/'),
    ('KHDA web portal', 'https://web.khda.gov.ae/ar/'),
    ('MoHESR (federal)', 'https://www.mohesr.gov.ae/'),
    ('UAE government portal', 'https://u.ae/'),
]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--json', action='store_true', help='machine-readable output')
    args = ap.parse_args()

    results = []
    for name, url in SOURCES:
        r = check_link(url)
        results.append({'source': name, 'url': url, **r})

    unreadable = [r for r in results if r['state'] == UNREACHABLE]
    chain_workaround = [r for r in results if r.get('used_extra_cas')]

    if args.json:
        print(json.dumps({'results': results,
                          'unreadable': len(unreadable)}, indent=2))
    else:
        for r in results:
            mark = 'OK  ' if r['state'] == VERIFIED_OK else 'FAIL'
            print(f"  {mark} {r['source']:24} {r['state']:12} {r['detail'] or ''}")
        if chain_workaround:
            print()
            print("  NOTE: these served an INCOMPLETE certificate chain and only "
                  "verified because we\n        carry the intermediate ourselves. "
                  "Any stricter client fails on them:")
            for r in chain_workaround:
                print(f"          - {r['source']} ({r['url']})")
        if unreadable:
            print()
            print("  A source we cannot read produces silence, and silence looks "
                  "like 'nothing new\n  today'. Fix these before trusting the "
                  "directory to be current.")

    return 1 if unreadable else 0


if __name__ == '__main__':
    sys.exit(main())
