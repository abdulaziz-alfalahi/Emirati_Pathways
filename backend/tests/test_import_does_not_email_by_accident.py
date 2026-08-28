"""Bringing data in must not write to a hundred and forty-five employers.

WHAT HAPPENED

On 2026-08-27 at 11:15:38, in ONE transaction, 267 verification emails to 145
REAL employers appeared in the approval queue — no test addresses among them —
with no attribution: recruiter_id the literal string '0' and created_by NULL.

Nobody sent them, and nobody decided to compose them. The NAFIS import created a
verification email for every vacancy row as an unavoidable side effect, and the
operator screen uploads the file the moment it is CHOSEN. So picking a CSV to
preview and filter was enough to compose all 267.

Three things then hid it:
  * the screen that ran the import reported companies and vacancies and said
    nothing about mail;
  * the admin import screen showed a tile labelled "Invites Sent" bound to
    report['emails_sent'], a key the backend had stopped returning when it
    stopped pretending to send — so it rendered blank;
  * imports were not in admin_audit_log at all, so "who ran this" had to be
    inferred from timestamps in the data.

Nothing was delivered. The allow-list and per-message approval both held. But
that is luck about configuration, not a design: the same import against an open
allow-list writes to 145 companies.
"""
import os
import sys
import inspect

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from tests.source_utils import code_only, js_code_only  # noqa: E402

FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')


def _routes():
    return code_only(open(os.path.join(BACKEND, 'routes', 'growth_routes.py'),
                          encoding='utf-8').read())


def _js(*parts):
    path = os.path.join(FRONTEND, *parts)
    if not os.path.exists(path):
        pytest.skip('frontend not present')
    return js_code_only(open(path, encoding='utf-8').read())


def test_composing_mail_is_opt_in():
    """The default decides what an accident does."""
    from growth_system import GrowthSystem
    sig = inspect.signature(GrowthSystem.import_vacancies_from_csv)
    assert 'queue_emails' in sig.parameters
    assert sig.parameters['queue_emails'].default is False


def test_the_import_records_who_ran_it():
    from growth_system import GrowthSystem
    sig = inspect.signature(GrowthSystem.import_vacancies_from_csv)
    assert 'imported_by' in sig.parameters

    source = inspect.getsource(GrowthSystem.import_vacancies_from_csv)
    assert 'creator_id = imported_by' in source, "rows still land with no author"
    assert 'invited_by=imported_by' in source, "messages still land with no author"


def test_the_endpoint_takes_the_identity_from_the_token_not_the_body():
    """An attributable action must not let the caller choose the attribution."""
    invite = _routes()
    endpoint = invite[invite.index('def import_vacancies'):]
    endpoint = endpoint[:endpoint.index('def ', 10)]
    assert 'get_jwt_identity()' in endpoint
    assert "request.form.get('imported_by')" not in endpoint


def _routes_raw():
    """Raw, not code_only: the INSERT lives in a triple-quoted SQL string, which
    the comment/docstring stripper removes."""
    return open(os.path.join(BACKEND, 'routes', 'growth_routes.py'),
                encoding='utf-8').read()


def test_the_import_is_audited():
    endpoint = _routes_raw()
    endpoint = endpoint[endpoint.index('def import_vacancies'):]
    assert 'admin_audit_log' in endpoint
    assert 'nafis_vacancy_import' in endpoint


def test_auditing_never_costs_the_import():
    endpoint = _routes_raw()
    endpoint = endpoint[endpoint.index('def import_vacancies'):]
    audit = endpoint.index('admin_audit_log')
    assert 'except Exception' in endpoint[audit:audit + 900]


def test_the_preview_upload_never_asks_for_mail():
    """It fires on file SELECTION. It must be incapable of writing to anyone."""
    source = _js('components', 'growth-operator', 'NafisVacancyImport.tsx')
    sync = source[source.index('syncToPlatform'):]
    sync = sync[:sync.index('handleFile')] if 'handleFile' in sync else sync
    assert 'queue_emails' not in sync, 'the preview upload asks for mail'


def test_the_admin_tile_reports_a_field_the_backend_still_returns():
    """It was bound to emails_sent, which no longer exists — so the one number
    that mattered rendered as nothing."""
    source = _js('components', 'admin', 'GrowthTools.tsx')
    assert 'importReport.emails_sent' not in source
    assert 'messages_queued' in source


def test_the_report_distinguishes_none_from_not_asked():
    """Zero messages because none were wanted must not look like zero messages
    because the mail step broke."""
    from growth_system import GrowthSystem
    source = inspect.getsource(GrowthSystem.import_vacancies_from_csv)
    assert "'messages_not_queued'" in source
    assert "'queued_emails': queue_emails" in source
