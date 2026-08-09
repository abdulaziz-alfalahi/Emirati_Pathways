"""The published /api/v1 surface — the mobile app's frozen contract.

WHY THIS EXISTS
    Today changing a route is one motion: edit the handler, edit the caller,
    deploy both. Once an app ships to a store that stops being true — review adds
    days, a meaningful share of users never update, and you cannot roll back what
    is already installed. So every endpoint the app touches becomes a published
    interface with a support obligation. This makes that obligation EXPLICIT and
    BOUNDED instead of implicit and permanent.

HOW
    The v1 rules are ADDITIVE aliases: each one points at the SAME view function
    the unversioned path already uses. The web keeps calling what it calls today;
    the app calls /api/v1/...; both reach identical code. Nothing moves, nothing
    breaks. `/api/v1/foo` is simply a second name for `/api/foo`.

WHY ROUTE-LEVEL AND NOT PER-BLUEPRINT
    A blueprint allowlist is too coarse here (api_versioning_plan.md §3.1a).
    `/api/auth/*` also carries the legacy password login and the dev-login bypass;
    `/api/cv/*` also carries debug endpoints. Publishing whole blueprints would
    put those on the app's contract. So the surface is enumerated rule by rule
    below, and anything not named is simply not published.

    (`candidate_profile_bp` was also split from the CRM in PR #335 for the same
    reason — /api/profile/crm-* must never appear here.)

WHAT IS DELIBERATELY EXCLUDED
    • the handlers retired in PR #334 (they answer 410 — do not publish them)
    • operator / recruiter / admin surfaces, incl. PUT /api/applications/<id>/status
      (a recruiter transition) and /api/interviews/sessions/admin/all
    • /api/auth/login, /register, /setup-mfa (legacy password path)
    • /api/auth/uaepass/dev-login[/users] (auth bypass)
    • /api/cv/debug-* and /api/profile/crm-*

ADDING TO THIS LIST IS A PUBLISHING DECISION. Once a path is here, phones may
call it for as long as the deprecation policy says. The contract test in
tests/test_api_v1_contract.py fails if this set changes without being updated
deliberately.
"""
import logging

logger = logging.getLogger(__name__)

V1_PREFIX = '/api/v1'

# path -> the methods published for it. Methods a rule has but that are NOT
# listed here stay unpublished (e.g. a POST that only an operator should make).
V1_SURFACE = {
    # ── authentication (UAE Pass only) ──────────────────────────────
    '/api/auth/uaepass/login':                    {'GET'},
    '/api/auth/uaepass/callback':                 {'GET'},
    '/api/auth/uaepass/logout':                   {'POST'},
    '/api/auth/uaepass/profile':                  {'GET'},
    '/api/auth/refresh':                          {'POST'},
    # data-subject rights — both stores require a working in-app delete path
    '/api/auth/consents/me':                      {'GET'},
    '/api/auth/dsr/export':                       {'GET'},
    '/api/auth/dsr/erase':                        {'POST'},

    # ── profile ─────────────────────────────────────────────────────
    '/api/v2/profile/':                           {'GET'},
    '/api/v2/profile/readiness':                  {'GET'},
    '/api/v2/profile/identity':                   {'PUT'},
    '/api/v2/profile/education':                  {'POST'},
    '/api/v2/profile/education/<int:edu_id>':     {'PUT', 'DELETE'},
    '/api/v2/profile/experience':                 {'POST'},
    '/api/v2/profile/experience/<int:exp_id>':    {'PUT', 'DELETE'},
    '/api/v2/profile/video/upload':               {'POST'},
    '/api/profile/candidate':                     {'GET', 'POST'},
    '/api/profile/candidate/completion':          {'GET'},
    '/api/profile/candidate/cv':                  {'POST'},
    '/api/profile/candidate/photo':               {'POST'},
    '/api/profile/candidate/preferences':         {'POST'},
    '/api/profile/availability':                  {'GET', 'PUT'},

    # ── jobs & matching ─────────────────────────────────────────────
    '/api/jobs':                                  {'GET'},
    '/api/jobs/<int:job_id>':                     {'GET'},
    '/api/jobs/search':                           {'GET'},
    '/api/candidate/job-matches':                 {'GET'},
    '/api/matching/visible/top-vacancies':        {'GET'},

    # ── saved jobs (migration 037 store) ────────────────────────────
    '/api/candidate/saved-jobs':                  {'GET'},
    '/api/candidate/saved-jobs/<job_id>':         {'POST', 'DELETE'},

    # ── applications ────────────────────────────────────────────────
    '/api/applications/apply':                    {'POST'},
    '/api/applications/my-applications':          {'GET'},
    '/api/applications/<application_id>':         {'GET'},
    '/api/applications/<application_id>/withdraw': {'POST'},
    '/api/applications/job/<job_id>':             {'GET'},

    # ── messages & notifications ────────────────────────────────────
    '/api/communication/conversations':                            {'GET', 'POST'},
    '/api/communication/conversations/<conversation_id>':           {'GET'},
    '/api/communication/conversations/<conversation_id>/messages':  {'GET'},
    '/api/communication/conversations/<conversation_id>/read':      {'POST'},
    '/api/communication/messages':                                  {'POST'},
    '/api/communication/messages/<message_id>/read':                {'POST'},
    '/api/communication/notifications':                             {'GET'},
    '/api/communication/notifications/<notification_id>/read':      {'POST'},
    '/api/communication/notifications/mark-all-read':               {'POST'},
    '/api/communication/notifications/preferences':                 {'GET', 'POST'},

    # ── push device registry (migration 059) ────────────────────────
    # The app registers on launch and on token rotation, and unregisters on
    # sign-out — that sign-out call is what stops a shared phone receiving the
    # previous user's notifications, so it must be on the published surface.
    '/api/devices':                               {'GET', 'POST', 'DELETE'},

    # ── career passport ─────────────────────────────────────────────
    '/api/career-passport/passport':              {'GET'},
    '/api/career-passport/stamps':                {'GET'},

    # ── CV (view/upload; the builder stays on the web) ──────────────
    '/api/cv/list':                               {'GET'},
    '/api/cv/upload':                             {'POST'},

    # ── interviews (join ships when the firewall opens) ─────────────
    '/api/interviews/sessions/my':                {'GET'},
    '/api/interviews/sessions/<session_id>':      {'GET'},
}


# The /api/v2/profile/* island predates any versioning scheme — ten profile
# routes under a "v2" that has no v1 predecessor and never had one (see
# api_versioning_plan.md §1). Left alone, the mechanical rule below would publish
# them as `/api/v1/v2/profile/...`, baking that accident into a contract phones
# hold for months. They are remapped to their natural home instead.
#
# `/api/v2/profile/*` itself is NOT retired here: the web calls it from five
# places today. It stays as the unversioned-equivalent path until those move,
# which is the plan's step 2. Only the PUBLISHED name changes.
_V2_PROFILE = '/api/v2/profile'


def v1_path_for(path):
    """The published /api/v1 path for an internal path."""
    if path.startswith(_V2_PROFILE):
        return V1_PREFIX + '/profile' + path[len(_V2_PROFILE):]
    return V1_PREFIX + path[len('/api'):]


def mount_v1(app):
    """Alias the published surface under /api/v1. Purely additive.

    Must run AFTER every blueprint is registered — it reads the finished url_map
    and re-points each allow-listed rule at the identical view function.
    Returns the list of (v1_path, methods) actually mounted.
    """
    mounted = []
    seen_endpoints = set()

    for rule in list(app.url_map.iter_rules()):
        path = str(rule)
        published = V1_SURFACE.get(path)
        if not published:
            continue

        methods = (rule.methods or set()) - {'HEAD', 'OPTIONS'}
        use = sorted(methods & published)
        if not use:
            continue

        view = app.view_functions.get(rule.endpoint)
        if view is None:                      # pragma: no cover - defensive
            logger.warning("v1 mount: no view for endpoint %s", rule.endpoint)
            continue

        endpoint = f'v1_{rule.endpoint}'
        if endpoint in seen_endpoints:        # two rules sharing an endpoint
            endpoint = f'{endpoint}_{"_".join(use).lower()}'
        seen_endpoints.add(endpoint)

        v1_path = v1_path_for(path)
        try:
            app.add_url_rule(v1_path, endpoint=endpoint, view_func=view, methods=use)
            mounted.append((v1_path, use))
        except Exception as e:                # pragma: no cover - defensive
            logger.warning("v1 mount failed for %s: %s", v1_path, e)

    missing = sorted(set(V1_SURFACE) - {str(r) for r in app.url_map.iter_rules()})
    if missing:
        # Loud on purpose: a path named here that no longer exists means the
        # published contract references something that has been moved or deleted.
        logger.error("v1 surface names %d path(s) that do not exist: %s",
                     len(missing), missing)

    logger.info("✅ /api/v1 surface mounted — %d rules", len(mounted))
    return mounted
