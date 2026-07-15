from flask import Blueprint, request, jsonify
from backend.db import get_db_connection

try:
    from backend.auth.access_control import require_roles, ADMIN_ROLES
except ImportError:  # pragma: no cover
    from auth.access_control import require_roles, ADMIN_ROLES

feature_flags_bp = Blueprint('feature_flags', __name__, url_prefix='/api/feature-flags')

def optional_auth(f):
    # A lightweight decorator just for demonstration, or we can assume internal validation.
    # We will use the existing authentication from app if needed, but for flags, we can expose GET publicly.
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@feature_flags_bp.route('', methods=['GET'])
def get_all_flags():
    """
    Returns all feature flags.
    Publicly accessible so the frontend can retrieve them on boot.
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
        
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT key_name, name, description, is_enabled 
                FROM feature_flags 
                ORDER BY name ASC
            """)
            flags = cur.fetchall()
            
            flags_list = [
                {
                    "key_name": row[0],
                    "name": row[1],
                    "description": row[2],
                    "is_enabled": bool(row[3])
                }
                for row in flags
            ]
            
            response = jsonify({"success": True, "data": flags_list})
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            return response, 200
    except Exception as e:
        print(f"Error fetching feature flags: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@feature_flags_bp.route('/<key_name>', methods=['PUT'])
@require_roles(*ADMIN_ROLES)
def toggle_flag(key_name):
    """Toggle a feature flag. Admin-only (was unauthenticated — audit BAC). GET remains
    public so the frontend can read flags on boot."""
    data = request.json
    is_enabled = data.get('is_enabled')
    
    if is_enabled is None:
        return jsonify({"success": False, "message": "is_enabled is required"}), 400
        
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
        
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE feature_flags 
                SET is_enabled = %s, updated_at = CURRENT_TIMESTAMP
                WHERE key_name = %s
                RETURNING key_name, name, is_enabled
            """, (is_enabled, key_name))
            
            updated_flag = cur.fetchone()
            conn.commit()
            
            if not updated_flag:
                return jsonify({"success": False, "message": "Flag not found"}), 404
                
            return jsonify({
                "success": True,
                "message": f"Feature '{updated_flag[1]}' {'enabled' if is_enabled else 'disabled'}.",
                "data": {
                    "key_name": updated_flag[0],
                    "name": updated_flag[1],
                    "is_enabled": bool(updated_flag[2])
                }
            })
    except Exception as e:
        conn.rollback()
        print(f"Error updating feature flag: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()
