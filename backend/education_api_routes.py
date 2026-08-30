"""
Education API Routes — Unified endpoints for university programs, scholarships, and LMS.
Blueprint prefix: /api/education
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

import psycopg2
import os
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

education_bp = Blueprint('education', __name__, url_prefix='/api/education')

try:
    from backend.auth.access_control import resolve_roles, require_roles, OPERATOR_ROLES, PROFDEV_ROLES, ADMIN_ROLES
except ImportError:
    from auth.access_control import resolve_roles, require_roles, OPERATOR_ROLES, PROFDEV_ROLES, ADMIN_ROLES

# Roles permitted to review scholarship applicants' PII.
# Who may publish a scholarship and decide an application. Built on ADMIN_ROLES
# rather than listing admin names by hand — the hand-written set here missed
# 'administrator' and 'super_user', so two real admin roles were refused.
#
# WHY THIS IS A MODULE CONSTANT AND A DECORATOR, not an `if` inside each handler:
# create_scholarship and update_scholarship_application_status carried
# @jwt_required() and NO role check at all, while their docstrings said
# "(educator / operator)". Verified against staging 2026-08-23 — signed in as a
# plain candidate, it was possible to publish a scholarship (201), apply to it
# (201), and approve one's own application (200). Only the READ endpoint was
# guarded, so the two dangerous verbs were the open ones.
#
# This is the failure mode CLAUDE.md names: a guard that lives in the handler is
# a guard somebody forgets to write. require_roles() is the one that cannot be
# forgotten silently, because its absence is visible at the route.
SCHOLARSHIP_REVIEWER_ROLES = ADMIN_ROLES | {'educator', 'education_operator', 'operator'}


def get_db():
    """Get database connection."""
    from flask import g
    if 'edu_db' not in g.__dict__:
        try:
            g.edu_db = psycopg2.connect(
                host=os.getenv('DB_HOST', '127.0.0.1'),
                port=os.getenv('DB_PORT', '5432'),
                dbname=os.getenv('DB_NAME', 'emirati_journey'),
                user=os.getenv('DB_USER', 'emirati_user'),
                password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            )
        except Exception as e:
            logger.error(f"Education DB connection failed: {e}")
            g.edu_db = None
    return g.edu_db


@education_bp.teardown_app_request
def close_edu_db(exception=None):
    from flask import g
    db = g.__dict__.pop('edu_db', None)
    if db is not None:
        try:
            if exception:
                db.rollback()
            db.close()
        except Exception:
            pass


def query_all(sql, params=None):
    """Execute query and return list of dicts."""
    db = get_db()
    if not db:
        return []
    try:
        cursor = db.cursor()
        cursor.execute(sql, params or ())
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Query failed: {e}")
        db.rollback()
        return []


def query_one(sql, params=None):
    """Execute query and return single dict or None."""
    db = get_db()
    if not db:
        return None
    try:
        cursor = db.cursor()
        cursor.execute(sql, params or ())
        row = cursor.fetchone()
        if not row:
            return None
        cols = [d[0] for d in cursor.description]
        return dict(zip(cols, row))
    except Exception as e:
        logger.error(f"Query failed: {e}")
        db.rollback()
        return None


def execute(sql, params=None):
    """Execute a write statement and COMMIT (query_all/query_one are
    read-only and never commit). Returns rowcount, 0 on failure."""
    db = get_db()
    if not db:
        return 0
    try:
        cursor = db.cursor()
        cursor.execute(sql, params or ())
        db.commit()
        return cursor.rowcount
    except Exception as e:
        logger.error(f"Write failed: {e}")
        db.rollback()
        return 0


def execute_returning(sql, params=None):
    """Execute a write with RETURNING, COMMIT, and return the row as a dict."""
    db = get_db()
    if not db:
        return None
    try:
        cursor = db.cursor()
        cursor.execute(sql, params or ())
        row = cursor.fetchone()
        cols = [d[0] for d in cursor.description] if cursor.description else []
        db.commit()
        return dict(zip(cols, row)) if row else None
    except Exception as e:
        logger.error(f"Write failed: {e}")
        db.rollback()
        return None


# ═══════════════════════════════════════════
# UNIVERSITIES
# ═══════════════════════════════════════════

@education_bp.route('/universities', methods=['GET'])
def get_universities():
    """Get all universities with optional search."""
    search = request.args.get('search', '')
    sql = """
        SELECT id, name, name_ar, location, type, established, ranking,
               students_count, programs_count, website, description, description_ar,
               specialties, logo_url
        FROM universities WHERE active = TRUE
    """
    params = []
    if search:
        sql += " AND (name ILIKE %s OR name_ar ILIKE %s OR location ILIKE %s)"
        params = [f'%{search}%'] * 3
    sql += " ORDER BY ranking ASC NULLS LAST, name ASC"

    universities = query_all(sql, params)
    # Convert specialties from JSON
    for u in universities:
        if isinstance(u.get('specialties'), str):
            try:
                u['specialties'] = json.loads(u['specialties'])
            except:
                u['specialties'] = []
    return jsonify({"universities": universities, "total": len(universities)})


@education_bp.route('/universities/<int:university_id>', methods=['GET'])
def get_university(university_id):
    """Get single university with its programs."""
    uni = query_one("SELECT * FROM universities WHERE id = %s AND active = TRUE", (university_id,))
    if not uni:
        return jsonify({"error": "University not found"}), 404
    programs = query_all(
        "SELECT * FROM university_programs WHERE university_id = %s AND active = TRUE ORDER BY is_popular DESC, title ASC",
        (university_id,)
    )
    for p in programs:
        for field in ['career_outcomes', 'subjects', 'skills_taught', 'accreditation']:
            if isinstance(p.get(field), str):
                try:
                    p[field] = json.loads(p[field])
                except:
                    p[field] = []
    uni['programs'] = programs
    return jsonify(uni)


# ═══════════════════════════════════════════
# UNIVERSITY PROGRAMS
# ═══════════════════════════════════════════

@education_bp.route('/programs', methods=['GET'])
def get_programs():
    """Get university programs with filtering."""
    category = request.args.get('category', '')
    degree = request.args.get('degree', '')
    search = request.args.get('search', '')
    university_id = request.args.get('university_id', '')
    limit = request.args.get('limit', 50, type=int)

    sql = """
        SELECT p.*, u.name as university_name, u.name_ar as university_name_ar,
               u.location as university_location
        FROM university_programs p
        LEFT JOIN universities u ON p.university_id = u.id
        WHERE p.active = TRUE
    """
    params = []
    if category:
        sql += " AND p.category = %s"
        params.append(category)
    if degree:
        sql += " AND p.degree = %s"
        params.append(degree)
    if university_id:
        sql += " AND p.university_id = %s"
        params.append(int(university_id))
    if search:
        sql += " AND (p.title ILIKE %s OR p.title_ar ILIKE %s OR u.name ILIKE %s)"
        params.extend([f'%{search}%'] * 3)
    sql += " ORDER BY p.is_popular DESC, p.rating DESC LIMIT %s"
    params.append(limit)

    programs = query_all(sql, params)
    for p in programs:
        for field in ['career_outcomes', 'subjects', 'skills_taught', 'accreditation']:
            if isinstance(p.get(field), str):
                try:
                    p[field] = json.loads(p[field])
                except:
                    p[field] = []
    return jsonify({"programs": programs, "total": len(programs)})


@education_bp.route('/programs/<int:program_id>', methods=['GET'])
def get_program(program_id):
    """Get single program details."""
    p = query_one("""
        SELECT p.*, u.name as university_name, u.name_ar as university_name_ar,
               u.location as university_location, u.website as university_website
        FROM university_programs p
        LEFT JOIN universities u ON p.university_id = u.id
        WHERE p.id = %s AND p.active = TRUE
    """, (program_id,))
    if not p:
        return jsonify({"error": "Program not found"}), 404
    for field in ['career_outcomes', 'subjects', 'skills_taught', 'accreditation']:
        if isinstance(p.get(field), str):
            try:
                p[field] = json.loads(p[field])
            except:
                p[field] = []
    return jsonify(p)


@education_bp.route('/programs/<int:program_id>/apply', methods=['POST'])
@jwt_required()
def apply_to_program(program_id):
    """Apply to a university program."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500
    try:
        cursor = db.cursor()
        # Check for existing application
        existing = query_one(
            "SELECT id FROM program_applications WHERE user_id = %s AND program_id = %s",
            (user_id, program_id)
        )
        if existing:
            return jsonify({"error": "Already applied", "application_id": existing['id']}), 409
        cursor.execute("""
            INSERT INTO program_applications (user_id, program_id, application_data)
            VALUES (%s, %s, %s) RETURNING id, status, submitted_at
        """, (user_id, program_id, json.dumps(data)))
        db.commit()
        row = cursor.fetchone()
        return jsonify({
            "application_id": row[0], "status": row[1],
            "submitted_at": str(row[2]), "message": "Application submitted successfully"
        }), 201
    except Exception as e:
        db.rollback()
        logger.error(f"Apply failed: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════
# SCHOLARSHIPS
# ═══════════════════════════════════════════

@education_bp.route('/scholarships', methods=['GET'])
def get_scholarships():
    """Get available scholarships with filtering.

    Filters use ONLY live-schema columns (verified 2026-07-24: title,
    provider_name, description, amount, coverage_type, deadline, min_gpa,
    academic_level, eligible_majors, application_link, is_active). The old
    branches filtered phantom columns (category/provider_type/title_ar) and
    500'd whenever exercised. Legacy ?category is accepted as an alias for
    coverage_type; ?provider_type matches provider_name.
    """
    academic_level = request.args.get('academic_level', '')
    coverage_type = request.args.get('coverage_type', '') or request.args.get('category', '')
    provider = request.args.get('provider', '') or request.args.get('provider_type', '')
    search = request.args.get('search', '')

    # Candidates only ever see published entries. The management view is a
    # SEPARATE, guarded endpoint (/scholarships/manage) rather than a flag here:
    # this route has no @jwt_required, so resolve_roles() would find no verified
    # token and return an empty set — the flag could never be true, and mixing a
    # privileged branch into a public handler is how a read guard gets missed.
    sql = "SELECT * FROM scholarships WHERE is_active = TRUE"
    params = []
    if academic_level:
        sql += " AND academic_level ILIKE %s"
        params.append(f'%{academic_level}%')
    if coverage_type:
        sql += " AND coverage_type ILIKE %s"
        params.append(f'%{coverage_type}%')
    if provider:
        sql += " AND provider_name ILIKE %s"
        params.append(f'%{provider}%')
    if search:
        sql += " AND (title ILIKE %s OR provider_name ILIKE %s OR description ILIKE %s)"
        params.extend([f'%{search}%'] * 3)
    sql += " ORDER BY deadline ASC NULLS LAST, created_at DESC"

    scholarships = query_all(sql, params)
    for s in scholarships:
        if isinstance(s.get('eligible_majors'), str):
            try:
                s['eligible_majors'] = json.loads(s['eligible_majors'])
            except Exception:
                s['eligible_majors'] = []
        if s.get('deadline'):
            s['deadline'] = str(s['deadline'])
        if s.get('created_at'):
            s['created_at'] = str(s['created_at'])
        if s.get('min_gpa') is not None:
            s['min_gpa'] = float(s['min_gpa'])
        # SHOWN TO THE CANDIDATE. Verification they cannot see does nothing for
        # the confidence it exists to protect, and this is the smallest piece of
        # the whole feature.
        #
        # Only sent when the last check actually SUCCEEDED. A date attached to a
        # failed or unresolved check would be a claim we cannot support — worse
        # than saying nothing, because "checked on Tuesday" reads as "working on
        # Tuesday". link_status itself is deliberately NOT exposed here: "gone"
        # or "changed" is the operator's business, and a candidate seeing it
        # would be reading an internal review state as advice.
        s['link_checked_at'] = (str(s['link_checked_at'])
                                if s.get('link_status') == 'verified_ok'
                                and s.get('link_checked_at') else None)
        for internal in ('link_status', 'link_status_detail', 'link_fingerprint'):
            s.pop(internal, None)
    return jsonify({"scholarships": scholarships, "total": len(scholarships)})


# EHRDC does not award these. The directory points at programmes run elsewhere —
# KHDA's Hamdan bin Mohammed programme, MoHESR's scholarships, university and
# foundation awards — so an entry's job is to be findable, accurate and to hand
# the candidate off to whoever actually takes the application. That is why
# application_link is required to publish: an entry a candidate cannot act on is
# a dead end wearing the clothes of an opportunity (owner decision, 2026-08-23).
_DIRECTORY_FIELDS = ('title', 'description', 'provider_name', 'amount',
                     'coverage_type', 'deadline', 'min_gpa', 'academic_level',
                     'eligible_majors', 'application_link')


def _clean_directory_payload(data):
    """(values dict, error) for the fields a directory entry carries."""
    out = {}
    for f in _DIRECTORY_FIELDS:
        if f not in data:
            continue
        v = data[f]
        if f == 'eligible_majors' and not isinstance(v, str):
            v = json.dumps(v or [])
        if isinstance(v, str):
            v = v.strip() or None
        out[f] = v
    return out, None


# ═══════════════════════════════════════════
# SCOUTING — drafts, rejections, the allow-list  (Phase 2)
# ═══════════════════════════════════════════

@education_bp.route('/scholarships/drafts', methods=['GET'])
@require_roles(*SCHOLARSHIP_REVIEWER_ROLES)
def list_scholarship_drafts():
    """What the scout proposed and nobody has decided on yet.

    Drafts are never visible to a candidate. This is the review step, and the
    review step is the product: an AI that published directly would be a machine
    for putting unverified claims about money in front of people.
    """
    rows = query_all("""
        SELECT d.*, s.label AS source_label, s.domain AS source_domain
          FROM scholarship_drafts d
          LEFT JOIN scholarship_sources s ON s.id = d.source_id
         WHERE d.status = 'pending'
         ORDER BY d.scouted_at DESC
    """) or []
    for r in rows:
        for k in ('scouted_at', 'reviewed_at', 'deadline'):
            if r.get(k):
                r[k] = str(r[k])
        for k in ('amount', 'min_gpa'):
            if r.get(k) is not None:
                r[k] = float(r[k])
    return jsonify({'drafts': rows, 'total': len(rows)})


@education_bp.route('/scholarships/drafts/<int:draft_id>/approve', methods=['POST'])
@require_roles(*SCHOLARSHIP_REVIEWER_ROLES)
def approve_scholarship_draft(draft_id):
    """Publish a draft, with the operator's corrections applied.

    APPROVAL IS A COPY, NOT A PROMOTION. The draft and its provenance survive the
    decision, so an approved listing can always be traced back to the page it
    came from and to whoever changed what. "Where did this number come from" is
    a question a government directory gets asked.

    The published entry still obeys the directory's own rule: no application
    link, no publishing. A scouted entry is not exempt from it.
    """
    data = request.get_json() or {}
    draft = query_one("SELECT * FROM scholarship_drafts WHERE id = %s", (draft_id,))
    if not draft:
        return jsonify({'error': 'Draft not found'}), 404
    if draft['status'] != 'pending':
        return jsonify({'error': f"This draft was already {draft['status']}"}), 409

    fields = ('title', 'provider_name', 'description', 'amount', 'coverage_type',
              'deadline', 'min_gpa', 'academic_level', 'eligible_majors',
              'application_link', 'link_type')
    values, edits = {}, {}
    for f in fields:
        if f in data:
            v = data[f]
            if isinstance(v, str):
                v = v.strip() or None
            values[f] = v
            if v != draft.get(f):
                # Recorded per field: this is the honest measure of whether the
                # scout is worth running. Drafts that are always rewritten are a
                # cost, not an achievement.
                edits[f] = {'from': str(draft.get(f)), 'to': str(v)}
        else:
            values[f] = draft.get(f)

    if not values.get('title'):
        return jsonify({'error': 'A title is required'}), 400
    if not values.get('application_link'):
        return jsonify({'error': 'A published entry needs an application link — '
                                 'that is where the candidate actually applies.'}), 400

    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 500
    try:
        cur = db.cursor()
        cur.execute("""
            INSERT INTO scholarships
                   (title, provider_name, description, amount, coverage_type,
                    deadline, min_gpa, academic_level, eligible_majors,
                    application_link, link_type, is_active)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,TRUE) RETURNING id
        """, tuple(values[f] for f in fields))
        new_id = cur.fetchone()[0]
        cur.execute("""UPDATE scholarship_drafts
                          SET status = 'approved', reviewed_by = %s, reviewed_at = NOW(),
                              operator_edits = %s::jsonb, published_id = %s
                        WHERE id = %s""",
                    (str(get_jwt_identity()), json.dumps(edits), new_id, draft_id))
        db.commit()
        return jsonify({'id': new_id, 'draft_id': draft_id,
                        'edited_fields': sorted(edits),
                        'message': 'Published'}), 201
    except Exception as e:
        db.rollback()
        logger.error(f'approve draft failed: {e}')
        return jsonify({'error': 'Could not publish the draft'}), 500


@education_bp.route('/scholarships/drafts/<int:draft_id>/reject', methods=['POST'])
@require_roles(*SCHOLARSHIP_REVIEWER_ROLES)
def reject_scholarship_draft(draft_id):
    """Turn a draft down, and REMEMBER it.

    The scout reads the same pages every day. Without this the same item returns
    to the queue every morning and the operator rejects it again — the tool dying
    of repetition rather than of being wrong.

    The memory is keyed on (source_url, fingerprint): the same page with the same
    content gets the same answer, and a materially changed page is re-raised,
    which is intended rather than a leak.
    """
    data = request.get_json() or {}
    reason = (data.get('reason') or '').strip()
    valid = ('not_a_scholarship', 'duplicate', 'out_of_scope',
             'wrong_details', 'expired', 'other')
    if reason not in valid:
        return jsonify({'error': f"reason must be one of: {', '.join(valid)}"}), 400

    draft = query_one("SELECT * FROM scholarship_drafts WHERE id = %s", (draft_id,))
    if not draft:
        return jsonify({'error': 'Draft not found'}), 404
    if draft['status'] != 'pending':
        return jsonify({'error': f"This draft was already {draft['status']}"}), 409

    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 500
    try:
        cur = db.cursor()
        cur.execute("""UPDATE scholarship_drafts
                          SET status = 'rejected', reviewed_by = %s, reviewed_at = NOW()
                        WHERE id = %s""", (str(get_jwt_identity()), draft_id))
        cur.execute("""
            INSERT INTO scholarship_rejections
                   (source_url, fingerprint, title, reason, note, rejected_by)
            VALUES (%s,%s,%s,%s,%s,%s)
            ON CONFLICT (source_url, fingerprint)
              DO UPDATE SET reason = EXCLUDED.reason, note = EXCLUDED.note,
                            rejected_at = NOW()
        """, (draft['source_url'], draft['fingerprint'], draft.get('title'),
              reason, data.get('note'), str(get_jwt_identity())))
        db.commit()
        return jsonify({'draft_id': draft_id, 'message': 'Rejected and remembered'})
    except Exception as e:
        db.rollback()
        logger.error(f'reject draft failed: {e}')
        return jsonify({'error': 'Could not reject the draft'}), 500


@education_bp.route('/scholarships/sources', methods=['GET', 'POST'])
@require_roles(*SCHOLARSHIP_REVIEWER_ROLES)
def scholarship_sources():
    """The allow-list. The operator maintains it alone (owner decision).

    Adding a domain is attributable — added_by and added_at — because that is
    the only control on a list whose whole job is to keep scam sites and paid
    aggregators out of a government directory.
    """
    if request.method == 'GET':
        rows = query_all("SELECT * FROM scholarship_sources ORDER BY is_active DESC, id") or []
        for r in rows:
            for k in ('added_at', 'last_scouted_at'):
                if r.get(k):
                    r[k] = str(r[k])
        return jsonify({'sources': rows, 'total': len(rows)})

    data = request.get_json() or {}
    start_url = (data.get('start_url') or '').strip()
    if not start_url.startswith('http'):
        return jsonify({'error': 'A source needs a full URL to start from'}), 400
    try:
        from urllib.parse import urlparse
        parsed = urlparse(start_url)
        domain = (parsed.hostname or '').lower()
        path = (parsed.path or '').strip('/')
    except Exception:
        domain, path = '', ''
    if not domain:
        return jsonify({'error': 'That URL has no host'}), 400

    # A default label that DISTINGUISHES. Now that one domain can have several
    # pages, falling back to the domain alone would print the same heading
    # against every KHDA page in the list, and the operator could not tell which
    # row is the programme page and which is the homepage.
    label = (data.get('label') or '').strip()
    if not label:
        label = f'{domain}/{path}' if path else domain

    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 500
    try:
        cur = db.cursor()
        # Conflict on the URL, not the domain. One trusted domain can have
        # several pages worth reading — KHDA runs the Hamdan bin Mohammed
        # programme on its own page while the homepage carries none — and the
        # earlier ON CONFLICT (domain) silently MOVED the existing row's URL
        # instead of adding one, with nothing on screen to show it had happened.
        # Re-adding the same page reactivates it, which is what an operator
        # means by adding something already paused.
        cur.execute("""
            INSERT INTO scholarship_sources (domain, label, start_url, added_by, notes)
            VALUES (%s,%s,%s,%s,%s)
            ON CONFLICT (start_url) DO UPDATE
              SET label = EXCLUDED.label, is_active = TRUE
            RETURNING id
        """, (domain, label, start_url, str(get_jwt_identity()), data.get('notes')))
        sid = cur.fetchone()[0]
        db.commit()
        return jsonify({'id': sid, 'domain': domain, 'message': 'Source added'}), 201
    except Exception as e:
        db.rollback()
        logger.error(f'add source failed: {e}')
        return jsonify({'error': 'Could not add the source'}), 500


@education_bp.route('/scholarships/sources/<int:source_id>', methods=['DELETE'])
@require_roles(*SCHOLARSHIP_REVIEWER_ROLES)
def remove_scholarship_source(source_id):
    """Stop scouting a source. Deactivates rather than deletes, so the drafts it
    produced keep their provenance."""
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 500
    try:
        cur = db.cursor()
        cur.execute("UPDATE scholarship_sources SET is_active = FALSE WHERE id = %s",
                    (source_id,))
        db.commit()
        return jsonify({'id': source_id, 'message': 'Source deactivated'})
    except Exception as e:
        db.rollback()
        logger.error(f'remove source failed: {e}')
        return jsonify({'error': 'Could not remove the source'}), 500


@education_bp.route('/scholarships/queue', methods=['GET'])
@require_roles(*SCHOLARSHIP_REVIEWER_ROLES)
def scholarship_link_queue():
    """What the daily link check found that needs a person.

    ONLY 'changed' and 'gone'. 'unreachable' is deliberately excluded: it means
    WE could not fetch the page — a proxy problem, a TLS problem, a timeout —
    and it is not evidence that a programme ended. Putting it here would mean a
    proxy outage presenting as every scholarship in the directory dying at once,
    with the obvious response being to unpublish them all.

    That is not hypothetical. KHDA, which runs the AED 1.1bn Hamdan bin Mohammed
    programme, failed verification from inside our container because their web
    host serves an incomplete certificate chain (see backend/link_verification.py).

    Ordered gone-before-changed: a dead link is actively sending candidates
    somewhere useless, while a changed page is usually just a moved deadline.
    """
    rows = query_all("""
        SELECT id, title, provider_name, application_link, link_type,
               link_status, link_status_detail, link_checked_at, is_active
          FROM scholarships
         WHERE link_status IN ('gone', 'changed')
         ORDER BY CASE link_status WHEN 'gone' THEN 0 ELSE 1 END,
                  link_checked_at DESC NULLS LAST
    """) or []
    for r in rows:
        if r.get('link_checked_at'):
            r['link_checked_at'] = str(r['link_checked_at'])

    # Reported alongside, never mixed in. The operator should be able to see
    # that we are having trouble reading a source without it looking like work
    # they can do.
    unreachable = query_one("""SELECT COUNT(*) AS n FROM scholarships
                                WHERE link_status = 'unreachable'""") or {}
    stale = query_one("""SELECT COUNT(*) AS n FROM scholarships
                          WHERE is_active = TRUE
                            AND (link_checked_at IS NULL
                                 OR link_checked_at < NOW() - INTERVAL '3 days')""") or {}

    return jsonify({
        'queue': rows,
        'total': len(rows),
        'unreachable': int(unreachable.get('n') or 0),
        'not_checked_recently': int(stale.get('n') or 0),
    })


@education_bp.route('/scholarships/manage', methods=['GET'])
@require_roles(*SCHOLARSHIP_REVIEWER_ROLES)
def list_scholarships_for_management():
    """Every entry, published or not — the curator's view.

    Separate from the public list because it needs a verified token to check the
    caller's role, and the public route deliberately has none. It also answers a
    different question: the public list is "what can I apply for", this is "what
    are we maintaining", and most of what is maintained is not currently visible.
    Dubai's Hamdan bin Mohammed programme runs an annual cohort — between cycles
    its entry is dormant, not deleted.
    """
    rows = query_all("SELECT * FROM scholarships "
                     "ORDER BY is_active DESC, deadline ASC NULLS LAST, created_at DESC")
    for s in rows:
        if isinstance(s.get('eligible_majors'), str):
            try:
                s['eligible_majors'] = json.loads(s['eligible_majors'])
            except Exception:
                s['eligible_majors'] = []
        for k in ('deadline', 'created_at'):
            if s.get(k):
                s[k] = str(s[k])
        if s.get('min_gpa') is not None:
            s['min_gpa'] = float(s['min_gpa'])
        if s.get('amount') is not None:
            s['amount'] = float(s['amount'])
    return jsonify({"scholarships": rows, "total": len(rows)})


@education_bp.route('/scholarships/<int:scholarship_id>', methods=['PUT'])
@require_roles(*SCHOLARSHIP_REVIEWER_ROLES)
def update_scholarship(scholarship_id):
    """Edit a directory entry.

    A curated directory is only worth having if it is CURRENT: deadlines move
    every cycle, links rot, and an out-of-date entry sends someone to a closed
    application. Editing is therefore not a nice-to-have here, it is the
    maintenance the whole idea depends on.
    """
    data = request.get_json() or {}
    values, err = _clean_directory_payload(data)
    if err:
        return jsonify({"error": err}), 400

    if 'is_active' in data:
        values['is_active'] = bool(data['is_active'])

    if not values:
        return jsonify({"error": "Nothing to update"}), 400

    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500

    existing = query_one("SELECT * FROM scholarships WHERE id = %s", (scholarship_id,))
    if not existing:
        return jsonify({"error": "Scholarship not found"}), 404

    # Publishing needs somewhere to send people. Checked against the MERGED
    # state, not the payload, so clearing the link on an already-published entry
    # is refused just as surely as publishing without one.
    merged_link = values.get('application_link', existing.get('application_link'))
    merged_active = values.get('is_active', existing.get('is_active'))
    if merged_active and not merged_link:
        return jsonify({"error": "A published entry needs an application link — "
                                 "that is where the candidate actually applies. "
                                 "Save it as unpublished, or add the link."}), 400

    sets = ', '.join(f"{k} = %s" for k in values)
    params = list(values.values()) + [scholarship_id]
    try:
        cursor = db.cursor()
        cursor.execute(f"UPDATE scholarships SET {sets} WHERE id = %s RETURNING id", params)
        row = cursor.fetchone()
        db.commit()
        if not row:
            return jsonify({"error": "Scholarship not found"}), 404
        return jsonify({"id": scholarship_id, "message": "Scholarship updated", "updated": list(values)})
    except Exception as e:
        db.rollback()
        logger.error(f"Update scholarship failed: {e}")
        return jsonify({"error": "Could not update the scholarship"}), 500


@education_bp.route('/scholarships/<int:scholarship_id>', methods=['DELETE'])
@require_roles(*SCHOLARSHIP_REVIEWER_ROLES)
def remove_scholarship(scholarship_id):
    """Take an entry off the directory.

    UNPUBLISH BY DEFAULT, delete only on request. Most removals are a programme
    between cycles rather than one that never existed — Dubai's Hamdan bin
    Mohammed programme opens a new cohort each year — and re-typing an entry
    every June is how a directory stops being maintained. ?hard=true is for the
    entry added in error, and refuses once anyone has applied through it, so a
    delete cannot quietly take applications with it.
    """
    hard = request.args.get('hard', '').lower() == 'true'
    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500

    existing = query_one("SELECT id FROM scholarships WHERE id = %s", (scholarship_id,))
    if not existing:
        return jsonify({"error": "Scholarship not found"}), 404

    try:
        cursor = db.cursor()
        if hard:
            used = query_one("SELECT COUNT(*) AS n FROM scholarship_applications "
                             "WHERE scholarship_id = %s", (scholarship_id,))
            if (used or {}).get('n'):
                return jsonify({"error": "People have applied through this entry, so it "
                                         "cannot be deleted. Unpublish it instead — the "
                                         "record of who applied stays either way."}), 409
            cursor.execute("DELETE FROM scholarships WHERE id = %s", (scholarship_id,))
            db.commit()
            return jsonify({"id": scholarship_id, "message": "Scholarship deleted"})

        cursor.execute("UPDATE scholarships SET is_active = FALSE WHERE id = %s", (scholarship_id,))
        db.commit()
        return jsonify({"id": scholarship_id, "message": "Scholarship unpublished"})
    except Exception as e:
        db.rollback()
        logger.error(f"Remove scholarship failed: {e}")
        return jsonify({"error": "Could not remove the scholarship"}), 500


@education_bp.route('/scholarships/<int:scholarship_id>/apply', methods=['POST'])
@jwt_required()
def apply_to_scholarship(scholarship_id):
    """Apply to a scholarship with AI match scoring."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500
    try:
        cursor = db.cursor()
        # Check existing
        existing = query_one(
            "SELECT id FROM scholarship_applications WHERE user_id = %s AND scholarship_id = %s",
            (user_id, scholarship_id)
        )
        if existing:
            return jsonify({"error": "Already applied"}), 409

        # Verify the scholarship exists and is active (the old code selected a
        # phantom skills_required column here and 500'd on every apply).
        scholarship = query_one(
            "SELECT id FROM scholarships WHERE id = %s AND is_active = TRUE", (scholarship_id,))
        if not scholarship:
            return jsonify({"error": "Scholarship not found"}), 404

        # No fabricated scoring: scholarships carry eligible_majors, not skill
        # requirements, so an honest skill-match score cannot be computed —
        # ai_match_score stays NULL (audit issue #26).
        cursor.execute("""
            INSERT INTO scholarship_applications (user_id, scholarship_id, application_data, ai_match_score)
            VALUES (%s, %s, %s, NULL) RETURNING id, status, ai_match_score, submitted_at
        """, (user_id, scholarship_id, json.dumps(data)))
        db.commit()
        row = cursor.fetchone()
        return jsonify({
            "application_id": row[0], "status": row[1],
            "match_score": row[2], "submitted_at": str(row[3]),
            "message": "Scholarship application submitted"
        }), 201
    except Exception as e:
        db.rollback()
        logger.error(f"Scholarship apply failed: {e}")
        return jsonify({"error": str(e)}), 500


@education_bp.route('/scholarships', methods=['POST'])
@require_roles(*SCHOLARSHIP_REVIEWER_ROLES)
def create_scholarship():
    """Create a new scholarship (educator / operator)."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500

    title = data.get('title', '').strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    # Same publish rule as update_scholarship: a directory entry a candidate
    # cannot act on is a dead end. An entry may be SAVED without a link, it just
    # cannot be visible to candidates until it has one.
    link = (data.get('application_link') or '').strip()
    is_active = bool(data.get('is_active', True))
    if is_active and not link:
        return jsonify({"error": "A published entry needs an application link — "
                                 "that is where the candidate actually applies. "
                                 "Save it as unpublished, or add the link."}), 400

    try:
        cursor = db.cursor()
        # INSERT restricted to columns that actually exist on the live
        # scholarships table (verified 2026-07-24). The old statement wrote
        # phantom columns (title_ar, description_ar, provider_type, eligibility,
        # skills_required, created_by) and 500'd on every create. eligible_majors
        # is jsonb — pass a JSON array string.
        eligible_majors = data.get('eligible_majors')
        if not isinstance(eligible_majors, str):
            eligible_majors = json.dumps(eligible_majors or [])
        cursor.execute("""
            INSERT INTO scholarships (
                title, description, provider_name, amount, coverage_type,
                deadline, min_gpa, academic_level, eligible_majors,
                application_link, is_active
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s
            ) RETURNING id, created_at
        """, (
            title,
            data.get('description', ''),
            data.get('provider', data.get('provider_name', '')),
            data.get('amount'),
            data.get('coverage_type', data.get('currency')),
            data.get('application_deadline', data.get('deadline')),
            data.get('min_gpa'),
            data.get('academic_level'),
            eligible_majors,
            link,
            is_active,
        ))
        db.commit()
        row = cursor.fetchone()
        return jsonify({
            "id": row[0],
            "created_at": str(row[1]),
            "message": "Scholarship created successfully",
        }), 201
    except Exception as e:
        db.rollback()
        logger.error(f"Create scholarship failed: {e}")
        return jsonify({"error": str(e)}), 500


@education_bp.route('/scholarships/<int:scholarship_id>/applications', methods=['GET'])
@require_roles(*SCHOLARSHIP_REVIEWER_ROLES)
def get_scholarship_applications(scholarship_id):
    """Get applications for a specific scholarship (educator / operator view)."""
    applications = query_all("""
        SELECT sa.id, sa.user_id, sa.scholarship_id, sa.status,
               sa.ai_match_score, sa.submitted_at, sa.application_data,
               sa.educator_id, sa.educator_status, sa.educator_notes,
               sa.parent_notified_at,
               u.full_name AS applicant_name, u.email AS applicant_email
        FROM scholarship_applications sa
        LEFT JOIN users u ON u.id = sa.user_id
        WHERE sa.scholarship_id = %s
        ORDER BY sa.submitted_at DESC
    """, (scholarship_id,))

    for a in applications:
        if a.get('submitted_at'):
            a['submitted_at'] = str(a['submitted_at'])
        if a.get('parent_notified_at'):
            a['parent_notified_at'] = str(a['parent_notified_at'])
        if isinstance(a.get('application_data'), str):
            try:
                a['application_data'] = json.loads(a['application_data'])
            except:
                pass

    return jsonify({"applications": applications, "total": len(applications)})


@education_bp.route('/scholarships/applications/<int:application_id>/status', methods=['PUT'])
@require_roles(*SCHOLARSHIP_REVIEWER_ROLES)
def update_scholarship_application_status(application_id):
    """Update a scholarship application status (approved / rejected)."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    new_status = data.get('status', '').strip().lower()

    if new_status not in ('approved', 'rejected'):
        return jsonify({"error": "Status must be 'approved' or 'rejected'"}), 400

    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500

    try:
        cursor = db.cursor()
        # Update status + educator columns if they exist
        try:
            cursor.execute("""
                UPDATE scholarship_applications
                SET status = %s,
                    educator_id = %s,
                    educator_status = %s,
                    educator_notes = %s
                WHERE id = %s
                RETURNING id, status
            """, (
                new_status,
                user_id,
                new_status,
                data.get('notes', ''),
                application_id,
            ))
        except Exception:
            db.rollback()
            # Fallback: table may not have educator columns yet
            cursor.execute("""
                UPDATE scholarship_applications
                SET status = %s
                WHERE id = %s
                RETURNING id, status
            """, (new_status, application_id))
        db.commit()
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Application not found"}), 404
        return jsonify({
            "id": row[0],
            "status": row[1],
            "message": f"Application {new_status}",
        })
    except Exception as e:
        db.rollback()
        logger.error(f"Update scholarship application status failed: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════
# LMS — COURSES & PROGRESS
# ═══════════════════════════════════════════

@education_bp.route('/courses', methods=['GET'])
def get_courses():
    """Get LMS courses."""
    category = request.args.get('category', '')
    level = request.args.get('level', '')
    search = request.args.get('search', '')

    sql = "SELECT * FROM lms_courses WHERE active = TRUE"
    params = []
    if category:
        sql += " AND category = %s"
        params.append(category)
    if level:
        sql += " AND level = %s"
        params.append(level)
    if search:
        sql += " AND (title ILIKE %s OR title_ar ILIKE %s)"
        params.extend([f'%{search}%'] * 2)
    sql += " ORDER BY enrollments DESC"

    courses = query_all(sql, params)
    for c in courses:
        if isinstance(c.get('skills_covered'), str):
            try:
                c['skills_covered'] = json.loads(c['skills_covered'])
            except:
                c['skills_covered'] = []
    return jsonify({"courses": courses, "total": len(courses)})


@education_bp.route('/courses/<int:course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_in_course(course_id):
    """Enroll in an LMS course."""
    user_id = get_jwt_identity()
    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500
    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO lms_enrollments (user_id, course_id) VALUES (%s, %s)
            ON CONFLICT (user_id, course_id) DO NOTHING
            RETURNING id, status, enrolled_at
        """, (user_id, course_id))
        db.commit()
        row = cursor.fetchone()
        if not row:
            return jsonify({"message": "Already enrolled"}), 200
        # Increment enrollment count
        cursor.execute("UPDATE lms_courses SET enrollments = enrollments + 1 WHERE id = %s", (course_id,))
        db.commit()
        return jsonify({
            "enrollment_id": row[0], "status": row[1], "enrolled_at": str(row[2])
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500


@education_bp.route('/courses/<int:course_id>/complete', methods=['POST'])
@jwt_required()
def complete_course(course_id):
    """Mark course as completed and update user skills via intelligence API."""
    user_id = get_jwt_identity()
    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500
    try:
        cursor = db.cursor()
        # Update enrollment
        cursor.execute("""
            UPDATE lms_enrollments SET status = 'completed', progress_pct = 100,
                   completed_at = NOW()
            WHERE user_id = %s AND course_id = %s RETURNING id
        """, (user_id, course_id))
        db.commit()
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Enrollment not found"}), 404

        # Get course skills and update user_skills
        course = query_one("SELECT skills_covered FROM lms_courses WHERE id = %s", (course_id,))
        skills_updated = []
        if course and course.get('skills_covered'):
            skills = course['skills_covered'] if isinstance(course['skills_covered'], list) else []
            for skill in skills:
                skill_id = skill if isinstance(skill, str) else skill.get('skill_id', '')
                if skill_id:
                    try:
                        cursor.execute("""
                            INSERT INTO user_skills (user_id, skill_id, skill_name, proficiency, source, verified, last_assessed, created_at)
                            VALUES (%s, %s, %s, 'beginner', 'course_completion', FALSE, NOW(), NOW())
                            ON CONFLICT (user_id, skill_id) DO UPDATE SET last_assessed = NOW()
                            RETURNING skill_id
                        """, (user_id, skill_id, skill_id))
                        db.commit()
                        skills_updated.append(skill_id)
                    except Exception:
                        db.rollback()

        return jsonify({
            "message": "Course completed",
            "skills_updated": skills_updated,
            "enrollment_id": row[0]
        })
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500


@education_bp.route('/my-progress', methods=['GET'])
@jwt_required()
def get_my_progress():
    """Get current user's education progress across all domains."""
    user_id = get_jwt_identity()

    # LMS enrollments
    enrollments = query_all("""
        SELECT e.*, c.title, c.title_ar, c.category, c.skills_covered
        FROM lms_enrollments e
        JOIN lms_courses c ON e.course_id = c.id
        WHERE e.user_id = %s ORDER BY e.enrolled_at DESC
    """, (user_id,))

    # Program applications
    applications = query_all("""
        SELECT pa.*, p.title, p.title_ar, p.degree, u.name as university_name
        FROM program_applications pa
        JOIN university_programs p ON pa.program_id = p.id
        LEFT JOIN universities u ON p.university_id = u.id
        WHERE pa.user_id = %s ORDER BY pa.submitted_at DESC
    """, (user_id,))

    # Scholarship applications
    # scholarships live columns: title, amount, provider_name (no title_ar/provider)
    scholarships = query_all("""
        SELECT sa.*, s.title, s.amount, s.provider_name AS provider
        FROM scholarship_applications sa
        JOIN scholarships s ON sa.scholarship_id = s.id
        WHERE sa.user_id = %s ORDER BY sa.submitted_at DESC
    """, (user_id,))

    stats = {
        "courses_enrolled": len(enrollments),
        "courses_completed": sum(1 for e in enrollments if e.get('status') == 'completed'),
        "avg_progress": round(sum(e.get('progress_pct', 0) for e in enrollments) / max(len(enrollments), 1)),
        "programs_applied": len(applications),
        "scholarships_applied": len(scholarships),
    }

    return jsonify({
        "stats": stats,
        "enrollments": enrollments,
        "applications": applications,
        "scholarships": scholarships,
    })


# ═══════════════════════════════════════════
# EDUCATION OPERATOR ENDPOINTS
# ═══════════════════════════════════════════

@education_bp.route('/operator/stats', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def education_operator_stats():
    """Aggregate statistics for the Education Operator Dashboard overview."""
    db = get_db()
    stats = {
        "institutions": 0, "active_programs": 0,
        "enrolled_students": 0, "pending_approvals": 0,
        "enrollment_by_type": []
    }
    if not db:
        return jsonify(stats)
    try:
        cursor = db.cursor()
        cursor.execute("SELECT COUNT(*) FROM universities")
        stats["institutions"] = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM university_programs WHERE is_active = TRUE")
        stats["active_programs"] = cursor.fetchone()[0]
        cursor.execute("SELECT COALESCE(SUM(enrolled),0) FROM university_programs")
        stats["enrolled_students"] = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM university_programs WHERE is_active = FALSE")
        stats["pending_approvals"] = cursor.fetchone()[0]
        # Enrollment breakdown
        cursor.execute("""
            SELECT COALESCE(program_type,'Other') AS ptype, COUNT(*) AS cnt,
                   COALESCE(SUM(enrolled),0) AS total_enrolled
            FROM university_programs GROUP BY program_type ORDER BY total_enrolled DESC
        """)
        cols = [d[0] for d in cursor.description]
        stats["enrollment_by_type"] = [dict(zip(cols, r)) for r in cursor.fetchall()]
    except Exception as e:
        logger.error(f"education_operator_stats: {e}")
    return jsonify(stats)


@education_bp.route('/operator/institutions', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def education_operator_institutions():
    """List institutions with program/student counts for the operator."""
    rows = query_all("""
        SELECT u.id, u.name, u.name_ar, u.location, u.type,
               COUNT(p.id) AS program_count,
               COALESCE(SUM(p.enrolled),0) AS student_count,
               u.is_active
        FROM universities u
        LEFT JOIN university_programs p ON p.university_id = u.id
        GROUP BY u.id, u.name, u.name_ar, u.location, u.type, u.is_active
        ORDER BY student_count DESC
    """)
    return jsonify({"institutions": rows, "total": len(rows)})


@education_bp.route('/operator/enrollments/recent', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def education_operator_recent_enrollments():
    """Recent enrollments across all programs (latest 20)."""
    rows = query_all("""
        SELECT p.name AS program, u.name AS institution,
               p.enrolled, p.capacity, p.program_type,
               p.created_at
        FROM university_programs p
        JOIN universities u ON u.id = p.university_id
        ORDER BY p.created_at DESC LIMIT 20
    """)
    for r in rows:
        if r.get('created_at'):
            r['created_at'] = str(r['created_at'])
    return jsonify({"enrollments": rows})


@education_bp.route('/operator/programs/pending', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def education_operator_pending_programs():
    """Programs pending approval."""
    rows = query_all("""
        SELECT p.id, p.name, p.name_ar, p.program_type, p.created_at,
               u.name AS institution
        FROM university_programs p
        JOIN universities u ON u.id = p.university_id
        WHERE p.is_active = FALSE
        ORDER BY p.created_at DESC
    """)
    for r in rows:
        if r.get('created_at'):
            r['created_at'] = str(r['created_at'])
    return jsonify({"programs": rows, "total": len(rows)})


# ═══════════════════════════════════════════
# KNOWLEDGE CAMPS
# ═══════════════════════════════════════════

def ensure_camps_table():
    """Present so callers keep working. It no longer creates or seeds anything.

    It used to CREATE TABLE and then, finding the table empty, insert six camps
    with invented ratings (4.5-4.9), invented enrolment counts (45/60, 52/60)
    and invented prices — which the public page then summed into a "Students
    Enrolled" figure.

    The schema is migration 095's now, and the seeding is gone for good: an
    empty listing is the truth until a provider submits a camp and an operator
    publishes it. Leaving the seed in would have re-inserted all six the moment
    migration 095 deleted them.
    """
    return


@education_bp.route('/camps', methods=['GET'])
def list_camps():
    """List knowledge camps with optional category/age filter."""
    ensure_camps_table()
    category = request.args.get('category')
    age_group = request.args.get('age_group')

    where, params = ["is_active = TRUE"], []
    if category and category != 'All':
        where.append("category = %s")
        params.append(category)
    if age_group:
        where.append("age_group = %s")
        params.append(age_group)

    camps = query_all(f"""
        SELECT * FROM knowledge_camps
        WHERE {' AND '.join(where)}
        ORDER BY featured DESC, rating DESC
    """, tuple(params))

    for c in camps:
        if c.get('created_at'):
            c['created_at'] = str(c['created_at'])
    return jsonify({"camps": camps, "total": len(camps)})


# ═══════════════════════════════════════════
# GRADUATE PROGRAMS
# ═══════════════════════════════════════════

def ensure_grad_programs_table():
    """Create graduate_programs table and seed if needed."""
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS graduate_programs (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                title_ar VARCHAR(255),
                university VARCHAR(255),
                university_ar VARCHAR(255),
                location VARCHAR(255),
                location_ar VARCHAR(255),
                duration VARCHAR(100),
                duration_ar VARCHAR(100),
                program_type VARCHAR(100),
                type_label VARCHAR(100),
                type_label_ar VARCHAR(100),
                tuition VARCHAR(100),
                tuition_ar VARCHAR(100),
                rating NUMERIC(2,1) DEFAULT 0,
                enrolled INT DEFAULT 0,
                capacity INT DEFAULT 0,
                featured BOOLEAN DEFAULT FALSE,
                specializations JSONB DEFAULT '[]',
                specializations_ar JSONB DEFAULT '[]',
                highlights JSONB DEFAULT '[]',
                highlights_ar JSONB DEFAULT '[]',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        db.commit()
        # Seeding removed 2026-08-30 (migration 096). It inserted six graduate
        # programmes whenever the table was empty, with invented tuition,
        # invented enrolment and a rating from a rating system that does not
        # exist — all attributed to six NAMED REAL UNIVERSITIES. A wrong
        # tuition figure is the Council publishing incorrect financial
        # information about a named institution.
    except Exception as e:
        db.rollback()
        logger.error(f"ensure_grad_programs_table: {e}")


@education_bp.route('/graduate-programs', methods=['GET'])
def list_graduate_programs():
    """List graduate programs with optional type filter."""
    ensure_grad_programs_table()
    program_type = request.args.get('type')

    where, params = ["is_active = TRUE"], []
    if program_type and program_type != 'All':
        where.append("program_type = %s")
        params.append(program_type)

    programs = query_all(f"""
        SELECT * FROM graduate_programs
        WHERE {' AND '.join(where)}
        ORDER BY featured DESC, rating DESC
    """, tuple(params))

    for p in programs:
        if p.get('created_at'):
            p['created_at'] = str(p['created_at'])
        # Parse JSONB fields
        for field in ('specializations', 'specializations_ar', 'highlights', 'highlights_ar'):
            if isinstance(p.get(field), str):
                try:
                    p[field] = json.loads(p[field])
                except:
                    pass
    return jsonify({"programs": programs, "total": len(programs)})


# ═══════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════

@education_bp.route('/health', methods=['GET'])
def education_health():
    db = get_db()
    tables = []
    if db:
        try:
            cursor = db.cursor()
            for t in ['universities', 'university_programs', 'scholarships', 'lms_courses']:
                cursor.execute(f"SELECT COUNT(*) FROM {t}")
                count = cursor.fetchone()[0]
                tables.append({"table": t, "rows": count})
        except:
            pass
    return jsonify({
        "status": "ok" if db else "no_db",
        "tables": tables,
    })


# ═══════════════════════════════════════════
# COMMUNITY OPERATOR ENDPOINTS
# ═══════════════════════════════════════════

def ensure_community_tables():
    """Create community tables and seed if needed."""
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS community_groups (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                name_ar TEXT,
                description TEXT,
                category TEXT DEFAULT 'General',
                member_count INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS community_content (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                title_ar TEXT,
                author_name TEXT,
                content_type TEXT DEFAULT 'article',
                status TEXT DEFAULT 'pending',
                likes INTEGER DEFAULT 0,
                flagged BOOLEAN DEFAULT FALSE,
                flag_reason TEXT,
                flag_severity TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS community_events (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                name_ar TEXT,
                event_date DATE,
                location TEXT,
                registrations INTEGER DEFAULT 0,
                status TEXT DEFAULT 'upcoming',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Seed if empty
        cursor.execute("SELECT COUNT(*) FROM community_groups")
        if cursor.fetchone()[0] == 0:
            for g in [
                ("Emirati Youth Network", "شبكة الشباب الإماراتي", "Career development community for young Emiratis", "Career", 2450),
                ("Women in Leadership", "المرأة في القيادة", "Community supporting women in leadership roles", "Leadership", 1800),
                ("Tech Innovators UAE", "مبتكرو التقنية الإمارات", "Technology and AI community", "Technology", 3200),
                ("National Service Alumni", "خريجو الخدمة الوطنية", "Alumni network for national service graduates", "Alumni", 1500),
                ("Retiree Knowledge Circle", "دائرة معرفة المتقاعدين", "Knowledge sharing for retirees", "Knowledge Sharing", 680),
            ]:
                cursor.execute("INSERT INTO community_groups (name, name_ar, description, category, member_count) VALUES (%s,%s,%s,%s,%s)", g)
            for c in [
                ("My Journey from Fresh Graduate to CTO", "رحلتي من خريج جديد إلى مدير تقنية", "Ahmed Al Falasi", "success_story", "pending", 45),
                ("Navigating Career Change in UAE", "التنقل المهني في الإمارات", "Fatima Al Hashmi", "article", "published", 32),
                ("Youth Innovation Summit Recap", "ملخص قمة الابتكار الشبابي", "Omar Al Suwaidi", "event_recap", "published", 28),
                ("Building Community Through Sports", "بناء المجتمع من خلال الرياضة", "Mariam Al Shamsi", "article", "pending", 19),
            ]:
                cursor.execute("INSERT INTO community_content (title, title_ar, author_name, content_type, status, likes) VALUES (%s,%s,%s,%s,%s,%s)", c)
            for e in [
                ("UAE Career Fair 2026", "معرض الوظائف الإماراتي 2026", "2026-03-15", "ADNEC, Abu Dhabi", 2400, "upcoming"),
                ("Youth Innovation Challenge", "تحدي الابتكار الشبابي", "2026-03-22", "Dubai Exhibition Centre", 850, "upcoming"),
                ("Retiree Networking Evening", "أمسية تواصل المتقاعدين", "2026-03-08", "Jumeirah Emirates Towers", 120, "upcoming"),
                ("National Service Alumni Meetup", "لقاء خريجي الخدمة الوطنية", "2026-02-25", "Sharjah Youth Center", 200, "completed"),
            ]:
                cursor.execute("INSERT INTO community_events (name, name_ar, event_date, location, registrations, status) VALUES (%s,%s,%s,%s,%s,%s)", e)
            db.commit()
            logger.info("Community tables seeded with sample data")
        db.commit()
    except Exception as e:
        logger.error(f"Error ensuring community tables: {e}")
        try:
            db.rollback()
        except:
            pass


@education_bp.route('/community/operator/stats', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def community_operator_stats():
    """Community Operator Dashboard — REAL data.

    Reads the communities members actually join (`communities` +
    `community_memberships`, migration 039/042) and real posts
    (`community_posts`). The old version served a parallel set of seeded
    demo tables with invented member counts — governing nothing.
    """
    communities = query_all("""
        SELECT c.id, c.name, c.name_ar, c.description, c.category, c.verified,
               c.is_active, c.posts_count, c.created_at,
               COUNT(cm.id) FILTER (WHERE cm.role IS DISTINCT FROM 'x') AS member_count,
               COUNT(cm.id) FILTER (WHERE cm.role = 'moderator') AS moderator_count
        FROM communities c
        LEFT JOIN community_memberships cm ON cm.community_id = c.id
        GROUP BY c.id ORDER BY member_count DESC, c.name""") or []

    content = query_all("""
        SELECT p.id, p.author_name, p.community_name, p.content, p.status,
               p.flagged, p.likes, p.comments, p.community_id
        FROM community_posts p ORDER BY p.id DESC LIMIT 100""") or []
    pending = [c for c in content if (c.get('status') or '') == 'pending']
    flagged = [c for c in content if c.get('flagged')]
    published = sum(1 for c in content if (c.get('status') or '') == 'published')

    events = query_all("SELECT * FROM community_events ORDER BY event_date DESC LIMIT 100") or []
    upcoming_events = [e for e in events if e.get('status') == 'upcoming']
    for e in events:
        if e.get('event_date'):
            e['event_date'] = str(e['event_date'])
        if e.get('created_at'):
            e['created_at'] = str(e['created_at'])
    for c in communities:
        if c.get('created_at'):
            c['created_at'] = str(c['created_at'])

    return jsonify({
        'stats': {
            'active_communities': sum(1 for c in communities if c.get('is_active')),
            'total_members': sum(int(c.get('member_count') or 0) for c in communities),
            'published_stories': published,
            'flagged_content': len(flagged),
            'upcoming_events': len(upcoming_events),
        },
        'communities': communities,
        'content_queue': pending,
        'flagged_content': flagged,
        'events': events,
    })


def _notify_user(user_id, ntype, title, message, meta=None):
    try:
        try:
            from backend.notification_helper import create_notification
        except ImportError:
            from notification_helper import create_notification
        create_notification(str(user_id), ntype, title, message, meta or {})
    except Exception as e:
        logger.warning(f"community notify failed: {e}")


@education_bp.route('/community/operator/communities', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def community_operator_create():
    """Create a real community (appears immediately on the member-facing
    Communities page, which reads the same table)."""
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'success': False, 'message': 'name is required'}), 400
    dup = query_one("SELECT id FROM communities WHERE LOWER(name) = LOWER(%s)", (name,))
    if dup:
        return jsonify({'success': False, 'message': 'A community with this name already exists'}), 409
    row = execute_returning("""
        INSERT INTO communities (name, name_ar, description, description_ar,
                                 category, category_ar, members, posts_count,
                                 verified, is_active, created_by, created_at)
        VALUES (%s,%s,%s,%s,%s,%s,0,0,%s,TRUE,%s,NOW()) RETURNING id""",
        (name, data.get('name_ar'), data.get('description'), data.get('description_ar'),
         data.get('category'), data.get('category_ar'),
         bool(data.get('verified', True)), str(get_jwt_identity())))
    return jsonify({'success': True, 'data': {'id': row['id'] if row else None},
                    'message': 'Community created'}), 201


@education_bp.route('/community/operator/communities/<int:community_id>', methods=['PUT'])
@require_roles(*OPERATOR_ROLES)
def community_operator_update(community_id):
    """Edit / verify / activate-deactivate a community."""
    data = request.get_json(silent=True) or {}
    fields, params = [], []
    for col in ('name', 'name_ar', 'description', 'description_ar', 'category', 'category_ar'):
        if col in data:
            fields.append(f"{col} = %s")
            params.append(data[col])
    for col in ('verified', 'is_active'):
        if col in data:
            fields.append(f"{col} = %s")
            params.append(bool(data[col]))
    if not fields:
        return jsonify({'success': False, 'message': 'Nothing to update'}), 400
    params.append(community_id)
    execute(f"UPDATE communities SET {', '.join(fields)} WHERE id = %s", tuple(params))
    return jsonify({'success': True, 'message': 'Community updated'})


@education_bp.route('/community/operator/communities/<int:community_id>/members', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def community_operator_members(community_id):
    """Real membership roster with resolved names and roles."""
    rows = query_all("""
        SELECT cm.user_id, cm.role, cm.created_at,
               COALESCE(u.full_name, NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''),
                        u.email, cm.user_id) AS name
        FROM community_memberships cm
        LEFT JOIN users u ON u.id = cm.user_id
        WHERE cm.community_id = %s
        ORDER BY (cm.role = 'moderator') DESC, name""", (community_id,)) or []
    for r in rows:
        if r.get('created_at'):
            r['created_at'] = str(r['created_at'])
    return jsonify({'success': True, 'data': {'members': rows}})


@education_bp.route('/community/operator/communities/<int:community_id>/moderators', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def community_operator_assign_moderator(community_id):
    """Assign a moderator — upserts the membership with role='moderator' and
    tells the person."""
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('user_id') or '').strip()
    if not user_id:
        return jsonify({'success': False, 'message': 'user_id is required'}), 400
    user = query_one("SELECT id FROM users WHERE CAST(id AS TEXT) = %s AND is_active IS NOT FALSE", (user_id,))
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    community = query_one("SELECT id, name FROM communities WHERE id = %s", (community_id,))
    if not community:
        return jsonify({'success': False, 'message': 'Community not found'}), 404
    existing = query_one(
        "SELECT id FROM community_memberships WHERE community_id = %s AND user_id = %s",
        (community_id, user_id))
    if existing:
        execute("UPDATE community_memberships SET role = 'moderator' WHERE id = %s", (existing['id'],))
    else:
        execute("""INSERT INTO community_memberships (user_id, community_id, role, created_at)
                   VALUES (%s, %s, 'moderator', NOW())""", (user_id, community_id))
    _notify_user(user_id, 'moderator_assigned', 'You are now a community moderator',
                 f"You have been assigned as a moderator of '{community['name']}'.",
                 {'community_id': community_id, 'link': '/communities'})
    return jsonify({'success': True, 'message': 'Moderator assigned'}), 201


@education_bp.route('/community/operator/communities/<int:community_id>/moderators/<user_id>', methods=['DELETE'])
@require_roles(*OPERATOR_ROLES)
def community_operator_remove_moderator(community_id, user_id):
    """Demote a moderator back to a regular member (keeps their membership)."""
    execute("""UPDATE community_memberships SET role = 'member'
               WHERE community_id = %s AND user_id = %s AND role = 'moderator'""",
            (community_id, str(user_id)))
    return jsonify({'success': True, 'message': 'Moderator removed'})


@education_bp.route('/community/operator/communities/<int:community_id>/announce', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def community_operator_announce(community_id):
    """Broadcast an announcement to every member of the community
    (notification fan-out through the canonical helper)."""
    data = request.get_json(silent=True) or {}
    title = (data.get('title') or '').strip()
    message = (data.get('message') or '').strip()
    if not title or not message:
        return jsonify({'success': False, 'message': 'title and message are required'}), 400
    community = query_one("SELECT id, name FROM communities WHERE id = %s", (community_id,))
    if not community:
        return jsonify({'success': False, 'message': 'Community not found'}), 404
    members = query_all(
        "SELECT user_id FROM community_memberships WHERE community_id = %s", (community_id,)) or []
    for m in members:
        _notify_user(m['user_id'], 'community_announcement',
                     f"[{community['name']}] {title}", message,
                     {'community_id': community_id, 'link': '/communities'})
    return jsonify({'success': True,
                    'message': f'Announcement sent to {len(members)} members',
                    'data': {'recipients': len(members)}})


@education_bp.route('/community/operator/events', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def community_operator_create_event():
    """Create a real community event."""
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    event_date = (data.get('event_date') or '').strip()
    if not name or not event_date:
        return jsonify({'success': False, 'message': 'name and event_date are required'}), 400
    row = execute_returning("""
        INSERT INTO community_events (name, name_ar, event_date, location, registrations, status)
        VALUES (%s,%s,%s,%s,0,'upcoming') RETURNING id""",
        (name, data.get('name_ar'), event_date, data.get('location')))
    return jsonify({'success': True, 'data': {'id': row['id'] if row else None},
                    'message': 'Event created'}), 201


@education_bp.route('/community/operator/events/<int:event_id>', methods=['PUT'])
@require_roles(*OPERATOR_ROLES)
def community_operator_update_event(event_id):
    """Update event status (e.g. cancel/complete)."""
    data = request.get_json(silent=True) or {}
    status = (data.get('status') or '').strip()
    if status not in ('upcoming', 'completed', 'cancelled'):
        return jsonify({'success': False, 'message': 'status must be upcoming/completed/cancelled'}), 400
    execute("UPDATE community_events SET status = %s WHERE id = %s", (status, event_id))
    return jsonify({'success': True, 'message': f'Event {status}'})


@education_bp.route('/community/operator/content/<int:post_id>', methods=['PUT'])
@require_roles(*OPERATOR_ROLES)
def community_operator_moderate_content(post_id):
    """Approve / reject / unflag a real community post."""
    data = request.get_json(silent=True) or {}
    action = (data.get('action') or '').strip()
    if action == 'approve':
        execute("UPDATE community_posts SET status = 'published', flagged = FALSE WHERE id = %s", (post_id,))
    elif action == 'reject':
        execute("UPDATE community_posts SET status = 'rejected' WHERE id = %s", (post_id,))
    elif action == 'unflag':
        execute("UPDATE community_posts SET flagged = FALSE WHERE id = %s", (post_id,))
    elif action == 'remove':
        execute("UPDATE community_posts SET status = 'removed', flagged = FALSE WHERE id = %s", (post_id,))
    else:
        return jsonify({'success': False, 'message': 'action must be approve/reject/unflag/remove'}), 400
    return jsonify({'success': True, 'message': f'Content {action}d' if not action.endswith('e') else f'Content {action}d'})


# ═══════════════════════════════════════════
# PROFESSIONAL DEVELOPMENT OPERATOR ENDPOINTS
# ═══════════════════════════════════════════

def ensure_profdev_tables():
    """Create professional development tables and seed if needed."""
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS training_courses (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                name_ar TEXT,
                provider TEXT,
                enrolled INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                course_type TEXT DEFAULT 'General',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS certification_bodies (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                certs_issued INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS profdev_settings (
                setting_key TEXT PRIMARY KEY,
                setting_value TEXT NOT NULL,
                description TEXT
            )
        """)
        cursor.execute("SELECT COUNT(*) FROM profdev_settings")
        if cursor.fetchone()[0] == 0:
            for s in [
                ("training_accreditation", "Required", "Require KHDA/ACTVET accreditation for all courses"),
                ("blockchain_credential_issuing", "Beta", "Enable blockchain-based digital credential issuance")
            ]:
                cursor.execute("INSERT INTO profdev_settings (setting_key, setting_value, description) VALUES (%s, %s, %s)", s)
            db.commit()

        cursor.execute("SELECT COUNT(*) FROM training_courses")
        if cursor.fetchone()[0] == 0:
            for c in [
                ("UAE Leadership Excellence", "التميز القيادي الإماراتي", "INSEAD Abu Dhabi", 45, "published", "Leadership"),
                ("Agile Project Management", "إدارة المشاريع المرنة", "PwC Academy", 82, "published", "Management"),
                ("Cybersecurity Fundamentals", "أساسيات الأمن السيبراني", "Etisalat Academy", 120, "published", "Technology"),
                ("Financial Analysis", "التحليل المالي", "CFA Institute", 0, "pending", "Finance"),
                ("AI and Machine Learning", "الذكاء الاصطناعي والتعلم الآلي", "42 Abu Dhabi", 65, "published", "Technology"),
            ]:
                cursor.execute("INSERT INTO training_courses (name, name_ar, provider, enrolled, status, course_type) VALUES (%s,%s,%s,%s,%s,%s)", c)
            for b in [
                ("KHDA", 145, True), ("ACTVET", 89, True), ("ADEK", 67, True),
                ("ILM", 52, True), ("CIPD", 38, False),
            ]:
                cursor.execute("INSERT INTO certification_bodies (name, certs_issued, is_active) VALUES (%s,%s,%s)", b)
            db.commit()
            logger.info("Professional development tables seeded")
        db.commit()
    except Exception as e:
        logger.error(f"Error ensuring profdev tables: {e}")
        try:
            db.rollback()
        except:
            pass


@education_bp.route('/profdev/operator/stats', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def profdev_operator_stats():
    """Aggregate statistics for the Professional Development Operator Dashboard.
    Reads the canonical `training_programs` catalogue (Phase 3)."""
    ensure_profdev_tables()
    courses = query_all("""
        SELECT tp.id, tp.title AS name, tp.title_ar AS name_ar, tp.provider,
               tp.category, tp.level, tp.status, tp.url,
               COALESCE((SELECT COUNT(*) FROM training_program_enrollments e
                         WHERE e.program_id = tp.id), 0) AS enrolled
        FROM training_programs tp
        ORDER BY enrolled DESC, tp.created_at DESC
    """)
    cert_bodies = query_all("SELECT * FROM certification_bodies ORDER BY certs_issued DESC")

    # 'submitted' = awaiting operator review (was 'pending' in the old table).
    published = [c for c in courses if c.get('status') == 'published']
    pending = [c for c in courses if c.get('status') == 'submitted']
    total_enrolled = sum(c.get('enrolled', 0) for c in courses)
    total_certs = sum(b.get('certs_issued', 0) for b in cert_bodies)

    return jsonify({
        'stats': {
            'training_courses': len(courses),
            'published_courses': len(published),
            'pending_courses': len(pending),
            'total_enrolled': total_enrolled,
            'total_certs_issued': total_certs,
            'cert_bodies': len(cert_bodies),
        },
        'courses': courses,
        'certification_bodies': cert_bodies,
    })


@education_bp.route('/profdev/courses', methods=['POST'])
@require_roles(*PROFDEV_ROLES)
def add_profdev_course():
    """Add a new training course to the Professional Development catalog."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        name_ar = data.get('name_ar', '').strip()
        provider = data.get('provider', '').strip()
        course_type = data.get('course_type', 'General').strip()

        if not name or not provider:
            return jsonify({'error': 'Name and provider are required'}), 400

        # Operator-added programs are published (curated by definition) into the
        # canonical catalogue.
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO training_programs (title, title_ar, provider, category, status, "
            "active, created_by, approved_by, created_at) "
            "VALUES (%s, %s, %s, %s, 'published', TRUE, %s, %s, NOW()) RETURNING id",
            (name, name_ar if name_ar else None, provider, course_type,
             get_jwt_identity(), get_jwt_identity())
        )
        course_id = cursor.fetchone()[0]
        db.commit()
        return jsonify({'success': True, 'course_id': course_id, 'message': 'Program added and published'}), 201
    except Exception as e:
        logger.error(f"Error adding profdev course: {e}")
        db.rollback()
        return jsonify({'error': 'Failed to add course'}), 500


@education_bp.route('/profdev/courses/<int:course_id>/approve', methods=['PUT'])
@require_roles(*PROFDEV_ROLES)
def approve_profdev_course(course_id):
    """Approve a pending course and publish it."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        cursor = db.cursor()
        cursor.execute(
            "UPDATE training_programs SET status = 'published', active = TRUE, approved_by = %s "
            "WHERE id = %s", (get_jwt_identity(), course_id))
        db.commit()
        return jsonify({'success': True, 'message': 'Program approved and published'}), 200
    except Exception as e:
        logger.error(f"Error approving course: {e}")
        db.rollback()
        return jsonify({'error': 'Failed to approve course'}), 500


@education_bp.route('/profdev/courses/<int:course_id>/reject', methods=['PUT'])
@require_roles(*PROFDEV_ROLES)
def reject_profdev_course(course_id):
    """Reject or set a course to draft/pending status."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        cursor = db.cursor()
        cursor.execute(
            "UPDATE training_programs SET status = 'rejected', active = FALSE WHERE id = %s",
            (course_id,))
        db.commit()
        return jsonify({'success': True, 'message': 'Program rejected'}), 200
    except Exception as e:
        logger.error(f"Error rejecting course: {e}")
        db.rollback()
        return jsonify({'error': 'Failed to reject course'}), 500


@education_bp.route('/profdev/settings', methods=['GET'])
@require_roles(*PROFDEV_ROLES)
def get_profdev_settings():
    """Retrieve settings for Professional Development."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM profdev_settings")
        rows = cursor.fetchall()
        settings = {r['setting_key']: r['setting_value'] for r in rows}
        return jsonify({'success': True, 'settings': settings}), 200
    except Exception as e:
        logger.error(f"Error getting profdev settings: {e}")
        return jsonify({'error': 'Failed to load settings'}), 500


@education_bp.route('/profdev/settings', methods=['PUT'])
@require_roles(*PROFDEV_ROLES)
def update_profdev_settings():
    """Update settings for Professional Development."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        data = request.get_json() or {}
        cursor = db.cursor()
        for k, v in data.items():
            cursor.execute(
                "INSERT INTO profdev_settings (setting_key, setting_value) VALUES (%s, %s) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value",
                (k, v)
            )
        db.commit()
        return jsonify({'success': True, 'message': 'Settings updated successfully'}), 200
    except Exception as e:
        logger.error(f"Error updating profdev settings: {e}")
        db.rollback()
        return jsonify({'error': 'Failed to save settings'}), 500


@education_bp.route('/profdev/certification-bodies', methods=['POST'])
@require_roles(*PROFDEV_ROLES)
def add_certification_body():
    """Register a new certification body."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        certs_issued = int(data.get('certs_issued', 0))

        if not name:
            return jsonify({'error': 'Name is required'}), 400

        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO certification_bodies (name, certs_issued, is_active) VALUES (%s, %s, TRUE) RETURNING id",
            (name, certs_issued)
        )
        body_id = cursor.fetchone()[0]
        db.commit()
        return jsonify({'success': True, 'body_id': body_id, 'message': 'Certification body registered successfully'}), 201
    except Exception as e:
        logger.error(f"Error adding certification body: {e}")
        db.rollback()
        return jsonify({'error': 'Failed to add certification body'}), 500


@education_bp.route('/profdev/certification-bodies/<int:body_id>/toggle', methods=['PUT'])
@require_roles(*PROFDEV_ROLES)
def toggle_certification_body(body_id):
    """Toggle the active/inactive state of a certification body."""
    ensure_profdev_tables()
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        cursor = db.cursor()
        cursor.execute("UPDATE certification_bodies SET is_active = NOT is_active WHERE id = %s RETURNING is_active", (body_id,))
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Certification body not found'}), 404
        db.commit()
        return jsonify({'success': True, 'is_active': result[0], 'message': 'Status toggled successfully'}), 200
    except Exception as e:
        logger.error(f"Error toggling certification body: {e}")
        db.rollback()
        return jsonify({'error': 'Failed to toggle status'}), 500


# ═══════════════════════════════════════════════════════════════════
# EMPLOYER DASHBOARD – aggregate jobs/applications from existing tables
# ═══════════════════════════════════════════════════════════════════

@education_bp.route('/employer/dashboard', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def employer_dashboard():
    """Aggregate employer dashboard data from job_postings and job_applications tables."""
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        cursor = db.cursor()

        # Job counts
        cursor.execute("SELECT COUNT(*) FROM job_postings WHERE status = 'active'")
        active_jobs = cursor.fetchone()[0] or 0

        cursor.execute("SELECT COUNT(*) FROM job_postings")
        total_jobs = cursor.fetchone()[0] or 0

        # Application counts (table may not exist)
        total_apps = 0
        shortlisted = 0
        hired = 0
        pending_offers = 0
        try:
            cursor.execute("SELECT COUNT(*) FROM job_applications")
            total_apps = cursor.fetchone()[0] or 0
            cursor.execute("SELECT COUNT(*) FROM job_applications WHERE status = 'shortlisted'")
            shortlisted = cursor.fetchone()[0] or 0
            cursor.execute("SELECT COUNT(*) FROM job_applications WHERE status = 'hired'")
            hired = cursor.fetchone()[0] or 0
            cursor.execute("SELECT COUNT(*) FROM job_applications WHERE status = 'offer_pending'")
            pending_offers = cursor.fetchone()[0] or 0
        except Exception:
            db.rollback()

        # Real count of Emirati applicants (authoritative is_uae_national flag).
        emirati_candidates = 0
        try:
            cursor.execute("""
                SELECT COUNT(DISTINCT ja.candidate_id)
                FROM job_applications ja
                JOIN users u ON u.id::text = ja.candidate_id::text
                WHERE u.is_uae_national IS TRUE
            """)
            emirati_candidates = cursor.fetchone()[0] or 0
        except Exception:
            db.rollback()

        # Recent jobs for activity feed
        recent_jobs = query_all(
            "SELECT title, status, created_at FROM job_postings ORDER BY created_at DESC LIMIT 5"
        )

        activity = []
        for j in recent_jobs:
            created = j.get('created_at', '')
            activity.append({
                'type': 'job_post',
                'message': f"Job posted: {j.get('title', 'Untitled')}",
                'time': str(created)[:10] if created else 'recently',
            })

        return jsonify({
            'recruitment': {
                'activeJobs': active_jobs,
                'totalApplications': total_apps,
                'shortlistedCandidates': shortlisted,
                # Was a fabricated shortlisted//2 proxy — null until a real interview count exists.
                'interviewsScheduled': None,
                'hiredCandidates': hired,
                'pendingOffers': pending_offers,
            },
            'analytics': {
                'applicationRate': round(total_apps / max(total_jobs, 1), 1),
                'responseRate': round(min(100, (shortlisted + hired) / max(total_apps, 1) * 100), 1),
                'hireRate': round(hired / max(total_apps, 1) * 100, 1),
                # Not derivable from platform data (no hire-date tracking) — null, not fabricated.
                'timeToHire': None,
            },
            'candidates': {
                'newApplications': max(0, total_apps - shortlisted - hired),
                'qualifiedCandidates': shortlisted,
                # Real Emirati-applicant count; diversityScore isn't derivable -> null.
                'emiratiCandidates': emirati_candidates,
                'diversityScore': None,
            },
            'activity': activity,
        })
    except Exception as e:
        logger.error(f"Employer dashboard error: {e}")
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════════════════════════════
# GOVERNMENT DASHBOARD – aggregate platform-wide stats
# ═══════════════════════════════════════════════════════════════════

@education_bp.route('/government/dashboard', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def government_dashboard():
    """Aggregate government dashboard: emiratization tracker + platform stats."""
    db = get_db()
    if not db:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        cursor = db.cursor()

        # Total jobs / workforce proxy
        cursor.execute("SELECT COUNT(*) FROM job_postings")
        total_jobs = cursor.fetchone()[0] or 0

        # User count as workforce proxy
        total_users = 0
        try:
            cursor.execute("SELECT COUNT(*) FROM users")
            total_users = cursor.fetchone()[0] or 0
        except Exception:
            db.rollback()

        # Training programs count
        training_count = 0
        try:
            cursor.execute("SELECT COUNT(*) FROM training_courses")
            training_count = cursor.fetchone()[0] or 0
        except Exception:
            db.rollback()

        # Education programs
        edu_programs = 0
        try:
            cursor.execute("SELECT COUNT(*) FROM education_programs")
            edu_programs = cursor.fetchone()[0] or 0
        except Exception:
            db.rollback()

        # Real count of registered Emirati users — keyed off the authoritative
        # is_uae_national flag (NOT users.nationality, which defaults to 'UAE').
        emirati_users = 0
        try:
            cursor.execute("SELECT COUNT(*) FROM users WHERE is_uae_national IS TRUE")
            emirati_users = cursor.fetchone()[0] or 0
        except Exception:
            db.rollback()

        # Placement-based Emiratisation rate: share of hired/accepted applications
        # whose candidate is a verified UAE national. A REAL DB figure — or None
        # when there are no placements yet. We never fabricate a number here.
        # (A true per-company workforce ratio is not computable: no headcount data.)
        emiratization_rate = None
        total_placements = 0
        emirati_placements = 0
        try:
            cursor.execute("""
                SELECT
                    COUNT(*) FILTER (WHERE ja.status IN ('hired','accepted'))                              AS total_placements,
                    COUNT(*) FILTER (WHERE ja.status IN ('hired','accepted') AND u.is_uae_national IS TRUE) AS emirati_placements
                FROM job_applications ja
                JOIN users u ON u.id::text = ja.candidate_id::text
            """)
            row = cursor.fetchone()
            total_placements = row[0] or 0
            emirati_placements = row[1] or 0
            if total_placements > 0:
                emiratization_rate = round(emirati_placements / total_placements * 100, 1)
        except Exception:
            db.rollback()

        return jsonify({
            'emiratization': {
                # Real registered-Emirati count (authoritative flag).
                'totalEmiratiEmployees': emirati_users,
                # Real placement-based rate, or null = "not available" (never faked).
                'emiratizationRate': emiratization_rate,
                'emiratizationBasis': 'placements' if emiratization_rate is not None else 'not_available',
                'placements': {'total': total_placements, 'emirati': emirati_placements},
                # Not derivable from current data (no published target / no per-sector
                # workforce data) — null / empty instead of a fabricated figure.
                'targetRate': None,
                'monthlyGrowth': None,
                'sectorBreakdown': [],
            },
            'workforce': {
                'totalWorkforce': total_users,
                'trainingPrograms': training_count + edu_programs,
                # Not derivable from platform data — null, not a fabricated figure.
                'unemploymentRate': None,
                'skillsGapIndex': None,
            },
            'initiatives': {
                'activePrograms': training_count + edu_programs,
                'beneficiaries': total_users,
                'completionRate': None,
            },
            'activity': [
                {'type': 'program', 'message': f'{training_count + edu_programs} training/education programs active on platform'},
                {'type': 'milestone', 'message': f'{total_jobs} job postings tracked across sectors'},
                {'type': 'report', 'message': f'{total_users} registered users on the platform'},
            ],
        })
    except Exception as e:
        logger.error(f"Government dashboard error: {e}")
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════════════════════════════
# CONTENT MANAGEMENT – Youth Programs
# ═══════════════════════════════════════════════════════════════════

def ensure_youth_programs_table():
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS youth_programs (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                title_ar TEXT,
                org TEXT,
                org_ar TEXT,
                duration TEXT,
                duration_ar TEXT,
                age_group TEXT,
                enrolled INT DEFAULT 0,
                capacity INT DEFAULT 100,
                status TEXT DEFAULT 'open',
                tags TEXT DEFAULT '[]',
                icon TEXT DEFAULT '🎓',
                description TEXT,
                description_ar TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        # Seeding removed 2026-08-30 (migration 096). It inserted six youth
        # programmes whenever the table was empty, with invented participation
        # attributed to real federal bodies — including "National Service
        # Career Track, 1200/1200, full" credited to the Ministry of Defence.
        db.commit()
    except Exception as e:
        logger.error(f"ensure_youth_programs_table: {e}")
        db.rollback()


@education_bp.route('/content/youth-programs', methods=['GET'])
def get_youth_programs():
    ensure_youth_programs_table()
    programs = query_all("SELECT * FROM youth_programs ORDER BY enrolled DESC")
    return jsonify({'programs': programs})


# ═══════════════════════════════════════════════════════════════════
# CONTENT MANAGEMENT – Industry Sectors
# ═══════════════════════════════════════════════════════════════════

def ensure_industry_sectors_table():
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS industry_sectors (
                id SERIAL PRIMARY KEY,
                sector_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                name_ar TEXT,
                growth TEXT,
                jobs TEXT,
                avg_salary TEXT,
                avg_salary_ar TEXT,
                top_companies TEXT DEFAULT '[]',
                description TEXT,
                description_ar TEXT,
                skills TEXT DEFAULT '[]',
                locations TEXT DEFAULT '[]',
                trending BOOLEAN DEFAULT FALSE,
                sector_tag TEXT,
                icon TEXT DEFAULT 'Building2',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("SELECT COUNT(*) FROM industry_sectors")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO industry_sectors (sector_id, name, name_ar, growth, jobs, avg_salary, avg_salary_ar, top_companies, description, description_ar, skills, locations, trending, sector_tag, icon) VALUES
                ('technology', 'Technology & Innovation', 'التكنولوجيا والابتكار', '+18%', '2,500+', 'AED 120K–250K', '120–250 ألف د.إ', '["Microsoft","Google","Amazon (AWS)","SAP","Oracle","Cisco"]', 'Leading the digital transformation of the UAE with cutting-edge solutions in AI, cloud, and cybersecurity.', 'قيادة التحول الرقمي في الإمارات بحلول متطورة في الذكاء الاصطناعي والسحابة والأمن السيبراني.', '["Python / JS","AI & ML","Cloud Computing","DevOps","Cybersecurity"]', '["Dubai","Abu Dhabi","Sharjah"]', TRUE, 'Tech', 'Cpu'),
                ('finance', 'Banking & Finance', 'المصارف والتمويل', '+12%', '1,800+', 'AED 100K–200K', '100–200 ألف د.إ', '["HSBC","JPMorgan","Citibank","Goldman Sachs","Standard Chartered","Visa"]', 'Driving financial innovation and world-class banking across the region.', 'قيادة الابتكار المالي والخدمات المصرفية العالمية في المنطقة.', '["Financial Analysis","Risk Management","Fintech","Compliance","Wealth Mgmt"]', '["Dubai","Abu Dhabi"]', FALSE, 'Finance', 'Banknote'),
                ('energy', 'Energy & Sustainability', 'الطاقة والاستدامة', '+20%', '1,200+', 'AED 110K–220K', '110–220 ألف د.إ', '["Shell","Baker Hughes","TotalEnergies","Siemens Energy","Schneider Electric","BP"]', 'Pioneering renewable energy and sustainable development in one of the world''s leading energy hubs.', 'الريادة في الطاقة المتجددة والتنمية المستدامة في أحد أبرز مراكز الطاقة في العالم.', '["Renewable Energy","Project Mgmt","Engineering","Sustainability","HSE"]', '["Abu Dhabi","Dubai"]', TRUE, 'Energy', 'Lightbulb'),
                ('healthcare', 'Healthcare & Life Sciences', 'الرعاية الصحية وعلوم الحياة', '+15%', '1,500+', 'AED 95K–180K', '95–180 ألف د.إ', '["Johnson & Johnson","Pfizer","Abbott","GE Healthcare","Medtronic","Roche"]', 'Advancing healthcare excellence and medical innovation across the Emirates.', 'تعزيز التميز في الرعاية الصحية والابتكار الطبي في الإمارات.', '["MedTech","Healthcare Mgmt","Clinical Research","Health Informatics"]', '["Dubai","Abu Dhabi","Sharjah"]', FALSE, 'Health', 'Heart'),
                ('aerospace', 'Aerospace & Aviation', 'الفضاء والطيران', '+14%', '900+', 'AED 105K–190K', '105–190 ألف د.إ', '["Boeing","Airbus","Honeywell","Rolls-Royce","GE Aviation","Collins Aerospace"]', 'Connecting the world through aviation excellence and space-age aerospace programs.', 'ربط العالم عبر التميز في الطيران وبرامج الفضاء المتقدمة.', '["Aviation Mgmt","Aerospace Eng.","Operations","Safety","Logistics"]', '["Dubai","Abu Dhabi"]', FALSE, 'Aviation', 'Plane'),
                ('tourism', 'Tourism & Hospitality', 'السياحة والضيافة', '+16%', '2,000+', 'AED 75K–150K', '75–150 ألف د.إ', '["Marriott International","Hilton","Hyatt","Accor","IHG","Four Seasons"]', 'Creating world-class hospitality experiences and iconic tourism destinations.', 'خلق تجارب ضيافة عالمية المستوى ووجهات سياحية أيقونية.', '["Hospitality Mgmt","Customer Service","Event Planning","F&B Mgmt"]', '["Dubai","Abu Dhabi","Ras Al Khaimah"]', FALSE, 'Hospitality', 'ShoppingBag');
            """)
        db.commit()
    except Exception as e:
        logger.error(f"ensure_industry_sectors_table: {e}")
        db.rollback()


@education_bp.route('/content/industries', methods=['GET'])
def get_industries():
    ensure_industry_sectors_table()
    sectors = query_all("SELECT * FROM industry_sectors ORDER BY sector_id") or []
    # The seeded `jobs` ('900+'…'2,500+') and `top_companies` (Boeing/Shell/HSBC…
    # global brands) were FABRICATED — they contradicted the real ~8 postings / 13
    # registered companies on the same page. Overlay REAL, live values per sector:
    # open positions = published job_postings whose company is in that sector, and
    # employers = the actual registered companies in that sector (empty if none).
    # Sector taxonomy (name/description/skills/growth) is kept; avg_salary ranges
    # remain illustrative market guidance. Test data (ZZ-*) is excluded.
    import json as _json
    companies = query_all(
        "SELECT id, company_name AS name, industry FROM companies "
        "WHERE COALESCE(company_name, '') NOT ILIKE %s "
        "AND COALESCE(company_name, '') NOT ILIKE %s", ('ZZ-%', 'TestCo%')) or []
    jobrows = query_all(
        "SELECT jp.company_id AS cid, COUNT(*) AS n FROM job_postings jp "
        "JOIN companies c ON c.id = jp.company_id "
        "WHERE jp.status = 'published' "
        "AND COALESCE(c.company_name, '') NOT ILIKE %s "
        "AND COALESCE(c.company_name, '') NOT ILIKE %s "
        "AND COALESCE(jp.title, '') NOT ILIKE %s "
        "GROUP BY jp.company_id", ('ZZ-%', 'TestCo%', 'ZZ-%')) or []
    jobs_by_cid = {str(r['cid']): int(r['n']) for r in jobrows if r.get('cid') is not None}

    def _sector_match(industry, sec):
        i = (industry or '').strip().lower()
        if not i:
            return False
        name = (sec.get('name') or '').lower()
        tag = (sec.get('sector_tag') or '').lower()
        return i == name or i in name or name in i or (bool(tag) and tag in i)

    for sec in sectors:
        emp = [c for c in companies if _sector_match(c.get('industry'), sec)]
        open_positions = sum(jobs_by_cid.get(str(c['id']), 0) for c in emp)
        sec['open_positions'] = open_positions
        sec['jobs'] = str(open_positions)            # was a fabricated '900+' string
        sec['employers'] = [{'id': str(c['id']), 'name': c['name']}
                            for c in emp if c.get('name')]
        sec['top_companies'] = _json.dumps([e['name'] for e in sec['employers']])
        sec['counts_source'] = 'live'                 # real, computed at request time
    return jsonify({'industries': sectors})


# ═══════════════════════════════════════════════════════════════════
# BLOCKCHAIN CREDENTIALS
# ═══════════════════════════════════════════════════════════════════

def ensure_blockchain_tables():
    db = get_db()
    if not db:
        return
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS blockchain_credentials (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                title_ar TEXT,
                issuer TEXT,
                issuer_ar TEXT,
                issue_date TEXT,
                issue_date_ar TEXT,
                tx_hash TEXT,
                network TEXT DEFAULT 'Ethereum',
                status TEXT DEFAULT 'Verified',
                verifications INT DEFAULT 0,
                badge TEXT DEFAULT '🎓',
                is_primary BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS credential_issuers (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                name_ar TEXT,
                credentials_count INT DEFAULT 0,
                total_verified INT DEFAULT 0,
                network TEXT DEFAULT 'Ethereum',
                region TEXT DEFAULT 'UAE',
                region_ar TEXT,
                tier TEXT DEFAULT 'Government',
                tier_label TEXT,
                tier_label_ar TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("SELECT COUNT(*) FROM blockchain_credentials")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO blockchain_credentials (title, title_ar, issuer, issuer_ar, issue_date, issue_date_ar, tx_hash, network, status, verifications, badge, is_primary) VALUES
                ('Bachelor of Computer Science', 'بكالوريوس علوم الحاسوب', 'Ministry of Education (MOE)', 'وزارة التربية والتعليم', 'Feb 2026', 'فبراير 2026', '0x8c4b...f12e', 'Ethereum', 'Verified', 28, '🎓', TRUE),
                ('Higher Education Equivalency Certificate', 'شهادة معادلة التعليم العالي', 'Ministry of Higher Education & Scientific Research', 'وزارة التعليم العالي والبحث العلمي', 'Jan 2026', 'يناير 2026', '0x3e7d...a93c', 'Ethereum', 'Verified', 22, '📜', TRUE),
                ('UAE Teaching License', 'رخصة التدريس الإماراتية', 'Ministry of Education (MOE)', 'وزارة التربية والتعليم', 'Dec 2025', 'ديسمبر 2025', '0x5a1f...b74d', 'Ethereum', 'Verified', 18, '🏛️', TRUE),
                ('AWS Cloud Practitioner', 'ممارس AWS السحابي', 'Amazon Web Services', 'خدمات أمازون السحابية', 'Nov 2025', 'نوفمبر 2025', '0x7f3a...e82d', 'Polygon', 'Verified', 12, '☁️', FALSE),
                ('Google Data Analytics Professional', 'محترف تحليلات البيانات من Google', 'Google', 'Google', 'Oct 2025', 'أكتوبر 2025', '0x4b2c...a91f', 'Polygon', 'Verified', 8, '📊', FALSE),
                ('UAE Government Excellence Award', 'جائزة التميز الحكومي الإماراتية', 'Federal Authority for Gov HR (FAHR)', 'الهيئة الاتحادية للموارد البشرية الحكومية', 'Sep 2025', 'سبتمبر 2025', '0x9d1e...c73b', 'Ethereum', 'Verified', 15, '🏅', FALSE);
            """)
        cursor.execute("SELECT COUNT(*) FROM credential_issuers")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO credential_issuers (name, name_ar, credentials_count, total_verified, network, region, region_ar, tier, tier_label, tier_label_ar) VALUES
                ('Ministry of Education (MOE)', 'وزارة التربية والتعليم', 85, 42000, 'Ethereum', 'UAE', 'الإمارات', 'Primary', 'Primary', 'رئيسي'),
                ('Ministry of Higher Education & Scientific Research', 'وزارة التعليم العالي والبحث العلمي', 62, 31500, 'Ethereum', 'UAE', 'الإمارات', 'Primary', 'Primary', 'رئيسي'),
                ('Federal Authority for Gov HR (FAHR)', 'الهيئة الاتحادية للموارد البشرية الحكومية', 28, 15200, 'Ethereum', 'UAE', 'الإمارات', 'Government', 'Government', 'حكومي'),
                ('Knowledge & Human Development Authority (KHDA)', 'هيئة المعرفة والتنمية البشرية', 22, 9400, 'Ethereum', 'UAE', 'الإمارات', 'Government', 'Government', 'حكومي'),
                ('Dubai Education Council', 'مجلس دبي للتعليم', 34, 12800, 'Ethereum', 'UAE', 'الإمارات', 'Government', 'Government', 'حكومي'),
                ('Amazon Web Services', 'خدمات أمازون السحابية', 45, 12400, 'Polygon', 'Global', 'عالمي', 'Industry', 'Industry', 'قطاعي'),
                ('Google', 'Google', 32, 9800, 'Polygon', 'Global', 'عالمي', 'Industry', 'Industry', 'قطاعي'),
                ('Microsoft', 'Microsoft', 38, 11200, 'Polygon', 'Global', 'عالمي', 'Industry', 'Industry', 'قطاعي');
            """)
        db.commit()
    except Exception as e:
        logger.error(f"ensure_blockchain_tables: {e}")
        db.rollback()


# Issue #26: there is NO real blockchain behind these endpoints — the rows
# are illustrative seed data with fabricated tx hashes / 'Ethereum' network.
# Every response is marked unmistakably as simulated so no caller (and no UI)
# can present it as a genuine on-chain, verified government credential.
_BLOCKCHAIN_DISCLAIMER = (
    "SIMULATED SAMPLE DATA — not a real blockchain record. These credentials "
    "are illustrative and are not cryptographically verified or on-chain."
)


def _mark_simulated(rows):
    for r in rows or []:
        if isinstance(r, dict):
            r['simulated'] = True
            # Never let a stored 'Ethereum'/'Verified' masquerade as real.
            if 'network' in r:
                r['network'] = 'Simulated'
            if r.get('status') == 'Verified':
                r['status'] = 'Sample'
    return rows


@education_bp.route('/blockchain/credentials', methods=['GET'])
def get_blockchain_credentials():
    ensure_blockchain_tables()
    creds = query_all("SELECT * FROM blockchain_credentials ORDER BY is_primary DESC, verifications DESC")
    return jsonify({'credentials': _mark_simulated(creds), 'simulated': True,
                    'disclaimer': _BLOCKCHAIN_DISCLAIMER})


@education_bp.route('/blockchain/issuers', methods=['GET'])
def get_blockchain_issuers():
    ensure_blockchain_tables()
    issuers = query_all("SELECT * FROM credential_issuers ORDER BY total_verified DESC")
    return jsonify({'issuers': _mark_simulated(issuers), 'simulated': True,
                    'disclaimer': _BLOCKCHAIN_DISCLAIMER})
