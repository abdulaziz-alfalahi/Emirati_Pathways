"""
UAE Pass Authentication Routes
==============================
Flask blueprint handling:
  - /api/auth/uaepass/login     → Initiate OAuth redirect
  - /api/auth/uaepass/callback  → Handle OAuth callback, issue JWT
  - /api/auth/uaepass/logout    → Clear session, redirect to UAE Pass logout

Integrates with the existing JWT infrastructure (flask_jwt_extended)
and the users table in PostgreSQL.
"""

import os
import json
import logging
import secrets
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, redirect, session
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
import psycopg2
import psycopg2.extras

from backend.auth.uaepass_oauth import UAEPassOAuth, UAEPassConfig, UAEPassError
from backend.utils.user_id import strip_eid_hyphens, is_valid_eid

logger = logging.getLogger(__name__)

uaepass_bp = Blueprint('uaepass', __name__, url_prefix='/api/auth/uaepass')

# In-memory state store (use Redis in production with >1 worker)
_pending_states: dict = {}


def _get_db():
    """Get a database connection using standard env vars."""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        database=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'emirati_user'),
        password=os.getenv('DB_PASSWORD', 'emirati_secure_password')
    )


def _encrypt_eid(plaintext: str) -> str:
    """
    Encrypt Emirates ID for storage.

    For now, uses a simple reversible encoding.
    TODO: Replace with AES-256-GCM using UAEPASS_EID_KEY when available.
    """
    import base64
    key = os.getenv('UAEPASS_EID_KEY', '')
    if not key:
        # Fallback: base64 encode (NOT production-safe — placeholder)
        logger.warning("UAEPASS_EID_KEY not set — using base64 encoding (NOT SECURE)")
        return base64.b64encode(plaintext.encode('utf-8')).decode('utf-8')

    # When key is available: AES-256-GCM
    try:
        from cryptography.fernet import Fernet
        f = Fernet(key.encode('utf-8') if isinstance(key, str) else key)
        return f.encrypt(plaintext.encode('utf-8')).decode('utf-8')
    except Exception as e:
        logger.error(f"EID encryption failed: {e}")
        return base64.b64encode(plaintext.encode('utf-8')).decode('utf-8')


@uaepass_bp.route('/login', methods=['GET'])
def uaepass_login():
    """
    Initiate UAE Pass OAuth flow.

    Query params:
        - return_url (optional): Frontend URL to redirect to after auth

    Returns:
        JSON with authorization_url for the frontend to redirect to,
        or a direct 302 redirect if called from a browser.
    """
    try:
        oauth = UAEPassOAuth()
        auth_url, state = oauth.get_authorization_url()

        # Store state for CSRF validation on callback
        return_url = request.args.get('return_url', '')
        _pending_states[state] = {
            'created_at': datetime.utcnow(),
            'return_url': return_url
        }

        # Clean up old states (> 10 minutes)
        _cleanup_stale_states()

        # If called via AJAX (frontend), return JSON
        if request.headers.get('Accept', '').startswith('application/json'):
            return jsonify({
                'success': True,
                'data': {
                    'authorization_url': auth_url,
                    'state': state
                }
            }), 200

        # If called directly (browser), redirect
        return redirect(auth_url)

    except Exception as e:
        logger.error(f"UAE Pass login initiation failed: {e}")
        return jsonify({
            'success': False,
            'message': f'Failed to initiate UAE Pass login: {str(e)}'
        }), 500


@uaepass_bp.route('/callback', methods=['GET'])
def uaepass_callback():
    """
    Handle UAE Pass OAuth callback.

    UAE Pass redirects here with:
        ?code=AUTHORIZATION_CODE&state=STATE_TOKEN

    This endpoint:
        1. Validates the state token (CSRF protection)
        2. Exchanges the code for access/ID tokens
        3. Fetches user profile from UAE Pass
        4. Finds or creates the user in our database
        5. Issues our own JWT tokens
        6. Redirects to the frontend with tokens in the URL fragment
    """
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    error_description = request.args.get('error_description', '')

    # Get frontend base URL for redirect
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:8081')

    # Handle OAuth errors (user cancelled, etc.)
    if error:
        logger.warning(f"UAE Pass OAuth error: {error} — {error_description}")
        return redirect(
            f"{frontend_url}/auth?error=uaepass_denied"
            f"&message={error_description or error}"
        )

    if not code or not state:
        logger.warning("UAE Pass callback missing code or state")
        return redirect(f"{frontend_url}/auth?error=missing_params")

    # Validate state (CSRF protection)
    state_data = _pending_states.pop(state, None)
    if not state_data:
        logger.warning(f"Invalid or expired state token: {state[:16]}...")
        return redirect(f"{frontend_url}/auth?error=invalid_state")

    try:
        oauth = UAEPassOAuth()

        # Step 1: Exchange code for tokens
        token_data = oauth.exchange_code_for_tokens(code)
        uaepass_access_token = token_data.get('access_token')

        if not uaepass_access_token:
            raise UAEPassError("No access_token in token response")

        # Step 2: Fetch user profile
        raw_profile = oauth.fetch_user_profile(uaepass_access_token)

        # Step 3: Normalize profile
        profile = UAEPassOAuth.normalize_profile(raw_profile)

        if not profile.get('uaepass_uuid'):
            raise UAEPassError("No UUID in user profile — cannot identify user")

        # Step 4: Find or create user
        user_data, is_new_user = _find_or_create_user(profile)

        if not user_data:
            raise UAEPassError("Failed to find or create user in database")

        # Step 5: Issue our JWT tokens
        user_id = str(user_data['id']).strip()  # Now EID CHAR(15)
        additional_claims = {
            'role': user_data.get('role', 'candidate'),
            'auth_method': 'uaepass'
        }

        access_token = create_access_token(
            identity=user_id,
            expires_delta=timedelta(hours=24),
            additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(
            identity=user_id,
            expires_delta=timedelta(days=30)
        )

        # Step 6: Redirect to frontend with tokens
        # Using URL fragment (#) so tokens are NOT sent to the server in logs
        return_url = state_data.get('return_url', '')
        redirect_path = '/auth/uaepass/callback'

        redirect_params = (
            f"access_token={access_token}"
            f"&refresh_token={refresh_token}"
            f"&is_new_user={str(is_new_user).lower()}"
            f"&user_id={user_id}"
            f"&role={user_data.get('role', 'candidate')}"
        )
        if return_url:
            redirect_params += f"&return_url={return_url}"

        redirect_url = f"{frontend_url}{redirect_path}#{redirect_params}"

        logger.info(
            f"UAE Pass auth successful for user {user_id} "
            f"(new={is_new_user}), redirecting to frontend"
        )

        return redirect(redirect_url)

    except UAEPassError as e:
        logger.error(f"UAE Pass auth error: {e}")
        return redirect(
            f"{frontend_url}/auth?error=uaepass_error"
            f"&message={str(e)[:200]}"
        )
    except Exception as e:
        logger.error(f"UAE Pass callback unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return redirect(
            f"{frontend_url}/auth?error=server_error"
            f"&message=Authentication+failed"
        )


@uaepass_bp.route('/logout', methods=['POST'])
@jwt_required(optional=True)
def uaepass_logout():
    """
    Log out from UAE Pass.

    Returns the UAE Pass logout URL that the frontend should redirect to.
    """
    try:
        oauth = UAEPassOAuth()
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:8081')
        logout_url = oauth.get_logout_url(redirect_url=f"{frontend_url}/auth")

        return jsonify({
            'success': True,
            'data': {
                'logout_url': logout_url
            }
        }), 200

    except Exception as e:
        logger.error(f"UAE Pass logout error: {e}")
        return jsonify({
            'success': False,
            'message': f'Logout failed: {str(e)}'
        }), 500


@uaepass_bp.route('/profile', methods=['GET'])
@jwt_required()
def uaepass_profile():
    """
    Get the user's UAE Pass profile attributes (from our DB).
    Useful for debugging and profile page display.
    """
    try:
        user_id = get_jwt_identity()

        conn = _get_db()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cursor.execute("""
            SELECT uaepass_uuid, fullname_ar, nationality_ar,
                   id_type, uaepass_usertype, title_en,
                   auth_method, uaepass_verified_at
            FROM users WHERE id = %s
        """, (user_id,))

        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        return jsonify({
            'success': True,
            'data': dict(row)
        }), 200

    except Exception as e:
        logger.error(f"UAE Pass profile fetch error: {e}")
        return jsonify({
            'success': False,
            'message': f'Profile fetch failed: {str(e)}'
        }), 500


def _find_or_create_user(profile: dict) -> tuple:
    """
    Find existing user by uaepass_uuid, or create a new one.

    Args:
        profile: Normalized profile dict from UAEPassOAuth.normalize_profile()

    Returns:
        Tuple of (user_dict, is_new_user)
    """
    conn = _get_db()
    conn.autocommit = False

    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # 1. Try to find by uaepass_uuid
        cursor.execute(
            "SELECT * FROM users WHERE uaepass_uuid = %s",
            (profile['uaepass_uuid'],)
        )
        existing = cursor.fetchone()

        if existing:
            # Update profile with latest UAE Pass data
            cursor.execute("""
                UPDATE users SET
                    fullname_ar = COALESCE(%s, fullname_ar),
                    nationality = COALESCE(%s, nationality),
                    nationality_ar = COALESCE(%s, nationality_ar),
                    id_type = COALESCE(%s, id_type),
                    uaepass_usertype = COALESCE(%s, uaepass_usertype),
                    title_en = COALESCE(%s, title_en),
                    auth_method = 'uaepass',
                    uaepass_verified_at = NOW(),
                    last_login = NOW(),
                    updated_at = NOW()
                WHERE id = %s
                RETURNING *
            """, (
                profile.get('fullname_ar'),
                profile.get('nationality'),
                profile.get('nationality_ar'),
                profile.get('id_type'),
                profile.get('uaepass_usertype'),
                profile.get('title_en'),
                existing['id']
            ))

            updated = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()

            logger.info(f"Existing user found and updated: {existing['id']}")
            return dict(updated), False

        # 2. Try to find by email (link existing account)
        if profile.get('email'):
            cursor.execute(
                "SELECT * FROM users WHERE email = %s",
                (profile['email'].lower().strip(),)
            )
            email_match = cursor.fetchone()

            if email_match:
                # Link UAE Pass to existing account
                cursor.execute("""
                    UPDATE users SET
                        uaepass_uuid = %s,
                        fullname_ar = COALESCE(%s, fullname_ar),
                        nationality_ar = COALESCE(%s, nationality_ar),
                        id_type = COALESCE(%s, id_type),
                        uaepass_usertype = COALESCE(%s, uaepass_usertype),
                        title_en = COALESCE(%s, title_en),
                        auth_method = 'uaepass',
                        uaepass_verified_at = NOW(),
                        last_login = NOW(),
                        updated_at = NOW()
                    WHERE id = %s
                    RETURNING *
                """, (
                    profile['uaepass_uuid'],
                    profile.get('fullname_ar'),
                    profile.get('nationality_ar'),
                    profile.get('id_type'),
                    profile.get('uaepass_usertype'),
                    profile.get('title_en'),
                    email_match['id']
                ))

                linked = cursor.fetchone()
                conn.commit()
                cursor.close()
                conn.close()

                logger.info(
                    f"Linked UAE Pass to existing user: "
                    f"{email_match['id']} (email match)"
                )
                return dict(linked), False

        # 3. Try to find by phone (link existing account)
        if profile.get('phone'):
            clean_phone = profile['phone'].replace(' ', '').replace('-', '')
            cursor.execute(
                "SELECT * FROM users WHERE phone = %s",
                (clean_phone,)
            )
            phone_match = cursor.fetchone()

            if phone_match:
                cursor.execute("""
                    UPDATE users SET
                        uaepass_uuid = %s,
                        email = COALESCE(NULLIF(%s, ''), email),
                        fullname_ar = COALESCE(%s, fullname_ar),
                        nationality_ar = COALESCE(%s, nationality_ar),
                        id_type = COALESCE(%s, id_type),
                        uaepass_usertype = COALESCE(%s, uaepass_usertype),
                        title_en = COALESCE(%s, title_en),
                        auth_method = 'uaepass',
                        uaepass_verified_at = NOW(),
                        last_login = NOW(),
                        updated_at = NOW()
                    WHERE id = %s
                    RETURNING *
                """, (
                    profile['uaepass_uuid'],
                    profile.get('email', ''),
                    profile.get('fullname_ar'),
                    profile.get('nationality_ar'),
                    profile.get('id_type'),
                    profile.get('uaepass_usertype'),
                    profile.get('title_en'),
                    phone_match['id']
                ))

                linked = cursor.fetchone()
                conn.commit()
                cursor.close()
                conn.close()

                logger.info(
                    f"Linked UAE Pass to existing user: "
                    f"{phone_match['id']} (phone match)"
                )
                return dict(linked), False

        # 4. Create new user
        # Determine the user's EID for the primary key
        raw_eid = profile.get('emirates_id', '')
        eid_for_pk = ''
        if raw_eid and is_valid_eid(raw_eid):
            eid_for_pk = strip_eid_hyphens(raw_eid)
        else:
            # Generate synthetic EID for users without a real one
            # Use advisory lock to prevent race condition under concurrent registration
            cursor.execute("SELECT pg_advisory_xact_lock(784000)")  # Lock ID for EID generation
            cursor.execute("""
                SELECT MAX(CAST(SUBSTRING(id FROM 8 FOR 7) AS INTEGER))
                FROM users WHERE id LIKE '7840000%'
            """)
            row = cursor.fetchone()
            max_seq = row[0] if row and row[0] else 0
            eid_for_pk = f"784{'0000'}{max_seq + 1:07d}{'0'}"

        # Encrypt EID before storage in the enc column (backward compat)
        eid_encrypted = ''
        if raw_eid:
            eid_encrypted = _encrypt_eid(raw_eid)

        cursor.execute("""
            INSERT INTO users (
                id, email, first_name, last_name, phone, role,
                emirate, nationality, nationality_ar,
                is_active, is_verified,
                uaepass_uuid, emirates_id_enc, fullname_ar,
                id_type, uaepass_usertype, title_en,
                auth_method, uaepass_verified_at,
                last_login, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, 'candidate',
                '', %s, %s,
                TRUE, TRUE,
                %s, %s, %s,
                %s, %s, %s,
                'uaepass', NOW(),
                NOW(), NOW(), NOW()
            )
            RETURNING *
        """, (
            eid_for_pk,
            profile.get('email', '').lower().strip() or f"{profile['uaepass_uuid']}@uaepass.local",
            profile.get('first_name', ''),
            profile.get('last_name', ''),
            profile.get('phone', ''),
            profile.get('nationality', 'UAE'),
            profile.get('nationality_ar', ''),
            profile['uaepass_uuid'],
            eid_encrypted,
            profile.get('fullname_ar', ''),
            profile.get('id_type', ''),
            profile.get('uaepass_usertype', ''),
            profile.get('title_en', ''),
        ))

        new_user = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()

        logger.info(f"New user created via UAE Pass: {new_user['id']}")
        return dict(new_user), True

    except Exception as e:
        conn.rollback()
        conn.close()
        logger.error(f"Find/create user failed: {e}")
        import traceback
        traceback.print_exc()
        return None, False



def _cleanup_stale_states():
    """Remove state tokens older than 10 minutes."""
    cutoff = datetime.utcnow() - timedelta(minutes=10)
    stale_keys = [
        k for k, v in _pending_states.items()
        if v.get('created_at', datetime.min) < cutoff
    ]
    for k in stale_keys:
        del _pending_states[k]


# ────────────────────────────────────────────────────────────────────
# DEV-ONLY: Test login bypass (NOT available in production)
# ────────────────────────────────────────────────────────────────────

@uaepass_bp.route('/dev-login', methods=['POST'])
def dev_login():
    """
    DEV-ONLY: Sign in as any existing user by EID.
    Bypasses UAE Pass OAuth and directly issues JWT tokens.

    POST /api/auth/uaepass/dev-login
    Body: { "user_id": "784000000000200" }

    ⚠️ MUST be removed or disabled before production deployment.
    """
    if os.getenv('FLASK_ENV') == 'production':
        return jsonify({'success': False, 'message': 'Dev login is disabled in production'}), 403

    data = request.get_json() or {}
    user_id = str(data.get('user_id', '')).strip()

    if not user_id or len(user_id) != 15:
        return jsonify({'success': False, 'message': 'user_id (15-digit EID) is required'}), 400

    try:
        conn = _get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, email, first_name, last_name, role, phone, is_active
            FROM users WHERE id = %s
        """, (user_id,))
        user = cur.fetchone()

        if not user:
            conn.close()
            return jsonify({'success': False, 'message': f'User {user_id} not found'}), 404

        if not user['is_active']:
            conn.close()
            return jsonify({'success': False, 'message': 'User account is inactive'}), 403

        # Update last_login
        cur.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user_id,))
        conn.commit()
        conn.close()

        # Issue tokens
        additional_claims = {
            'role': user.get('role', 'candidate'),
            'auth_method': 'dev_bypass'
        }
        access_token = create_access_token(
            identity=user_id,
            expires_delta=timedelta(hours=24),
            additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(
            identity=user_id,
            expires_delta=timedelta(days=30)
        )

        logger.warning(f"⚠️  DEV LOGIN: user {user_id} ({user['email']}) signed in via dev bypass")

        return jsonify({
            'success': True,
            'message': f"Dev login successful for {user['first_name']} {user['last_name']}",
            'data': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'role': user['role'],
                    'phone': user['phone'],
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"Dev login error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@uaepass_bp.route('/dev-login/users', methods=['GET'])
def dev_login_users():
    """
    DEV-ONLY: List all test users available for dev login.
    GET /api/auth/uaepass/dev-login/users
    """
    if os.getenv('FLASK_ENV') == 'production':
        return jsonify({'success': False, 'message': 'Disabled in production'}), 403

    try:
        conn = _get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT
                u.id, u.email, u.first_name, u.last_name, u.role, u.phone,
                u.is_active, u.last_login,
                (SELECT COUNT(*) FROM user_cvs WHERE user_id = u.id) AS cv_count,
                (SELECT COUNT(*) FROM candidate_experience_entries WHERE user_id = u.id) AS exp_count,
                (SELECT COUNT(*) FROM candidate_education_entries WHERE user_id = u.id) AS edu_count
            FROM users u
            WHERE u.is_active = true
            ORDER BY u.role, u.first_name
        """)
        users = []
        for row in cur.fetchall():
            users.append({
                'id': row['id'],
                'name': f"{row['first_name'] or ''} {row['last_name'] or ''}".strip(),
                'email': row['email'],
                'role': row['role'],
                'phone': row['phone'],
                'has_data': row['cv_count'] > 0 or row['exp_count'] > 0,
                'cv_count': row['cv_count'],
                'exp_count': row['exp_count'],
                'edu_count': row['edu_count'],
                'last_login': row['last_login'].isoformat() if row['last_login'] else None,
            })
        conn.close()

        return jsonify({'success': True, 'users': users, 'count': len(users)}), 200

    except Exception as e:
        logger.error(f"Dev login users error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

