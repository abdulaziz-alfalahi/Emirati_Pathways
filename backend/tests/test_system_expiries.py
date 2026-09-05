"""The expiry list on the admin System tab (fb_1788410870_12ae53c3)."""
import os
import sys
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend import system_expiries as se  # noqa: E402

TODAY = date(2026, 9, 5)


def test_status_thresholds():
    assert se.status_for(None) == 'unknown'
    assert se.status_for(-1) == 'expired'
    assert se.status_for(0) == 'critical'
    assert se.status_for(14) == 'critical'
    assert se.status_for(15) == 'warning'
    assert se.status_for(90) == 'warning'
    assert se.status_for(91) == 'ok'


def test_live_tls_result_is_used_when_the_probe_works():
    probe = lambda host: {'not_after': date(2026, 11, 21), 'issuer': 'GlobalSign', 'via': 'proxy'}  # noqa: E731
    items = se.collect(today=TODAY, env={'FRONTEND_URL': 'https://stg-emirati.ehrdc.gov.ae'}, tls_probe=probe)
    tls = next(i for i in items if i['key'] == 'tls_certificate')
    assert tls['expires_on'] == '2026-11-21' and tls['days_left'] == 77 and tls['status'] == 'warning'
    assert tls['source'] == 'live (proxy)' and 'stg-emirati' in tls['label']


def test_recorded_date_is_the_fallback_and_says_so():
    def probe(host):
        raise ConnectionError('proxy down')
    items = se.collect(today=TODAY, env={'FRONTEND_URL': 'https://stg-emirati.ehrdc.gov.ae',
                                         'TLS_CERT_EXPIRES_ON': '2026-11-21'}, tls_probe=probe)
    tls = next(i for i in items if i['key'] == 'tls_certificate')
    assert tls['expires_on'] == '2026-11-21' and tls['source'] == 'recorded (live check failed)'


def test_nothing_is_invented():
    """No recorded date -> unknown, never a number."""
    items = se.collect(today=TODAY, env={}, tls_probe=lambda h: (_ for _ in ()).throw(RuntimeError()))
    by = {i['key']: i for i in items}
    assert by['uaepass_client_secret']['status'] == 'unknown' and by['uaepass_client_secret']['days_left'] is None
    assert by['tls_certificate']['status'] == 'unknown'
    assert by['mail_app_secret']['expires_on'] == '2027-08-23'   # the one date that is a known fact


def test_extra_items_and_ordering():
    env = {'EXPIRY_ITEMS': '[{"key":"waf_cert","label":"WAF certificate","expires_on":"2026-09-10"},'
                           ' {"key":"old","label":"Old thing","expires_on":"2026-01-01"}]',
           'MAIL_SECRET_EXPIRES_ON': '2027-08-23'}
    items = se.collect(today=TODAY, env=env, tls_probe=lambda h: (_ for _ in ()).throw(RuntimeError()))
    keys = [i['key'] for i in items]
    assert keys[0] == 'old' and items[0]['status'] == 'expired'
    assert keys[1] == 'waf_cert' and items[1]['status'] == 'critical' and items[1]['days_left'] == 5
    assert keys[-1] == 'mail_app_secret' and items[-1]['status'] == 'ok'


def test_bad_env_json_does_not_break_the_list():
    items = se.collect(today=TODAY, env={'EXPIRY_ITEMS': '{not json'}, tls_probe=lambda h: (_ for _ in ()).throw(RuntimeError()))
    assert {i['key'] for i in items} == {'tls_certificate', 'mail_app_secret', 'uaepass_client_secret'}
