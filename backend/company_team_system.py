import os
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CompanyTeamSystem:
    def __init__(self):
        """Initialize the Company Team System"""
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            'port': os.getenv('DB_PORT', '5432')
        }

    def get_db_connection(self):
        return psycopg2.connect(**self.db_config)

    def get_team_members(self, company_id: str, exclude_user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all team members for a company, optionally excluding a specific user"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                        SELECT 
                            ctm.id,
                            ctm.user_id,
                            ctm.role,
                            ctm.permissions,
                            ctm.invitation_status,
                            ctm.joined_at,
                            u.full_name,
                            u.email,
                            u.job_title
                        FROM company_team_members ctm
                        JOIN users u ON ctm.user_id = u.id
                        WHERE ctm.company_id = %s
                    """
                    params = [company_id]

                    if exclude_user_id is not None:
                        query += " AND ctm.user_id != %s"
                        params.append(exclude_user_id)

                    query += " ORDER BY ctm.created_at DESC"
                    
                    cur.execute(query, tuple(params))
                    
                    return [dict(row) for row in cur.fetchall()]
        except Exception as e:
            logger.error(f"Error getting team members: {e}")
            return []

    def invite_member(self, company_id: str, email: str, role: str, invited_by_user_id: int) -> Dict[str, Any]:
        """
        Invite a member to the team.
        If user exists, add them directly (or pending). 
        If not, we might need to handle 'invitation only' users? 
        For now, assume user MUST exist in system to be invited (or we create a placeholder).
        Simple MVP: Check if user exists by email.
        """
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    # 1. Find user by email
                    cur.execute("SELECT id, full_name FROM users WHERE email = %s", (email,))
                    user = cur.fetchone()
                    
                    if not user:
                        return {'success': False, 'message': 'User not found. They must register first.'}
                    
                    user_id = user[0]
                    
                    # 2. Check if already in team
                    cur.execute("""
                        SELECT id FROM company_team_members 
                        WHERE company_id = %s AND user_id = %s
                    """, (company_id, user_id))
                    
                    if cur.fetchone():
                        return {'success': False, 'message': 'User already in team.'}
                    
                    # 3. Add to team
                    # Generate UUID for the record ID
                    record_id = str(uuid.uuid4())
                    
                    cur.execute("""
                        INSERT INTO company_team_members 
                        (id, company_id, user_id, role, invited_by, invitation_status, joined_at)
                        VALUES (%s, %s, %s, %s, %s, 'active', NOW())
                        RETURNING id
                    """, (record_id, company_id, user_id, role, invited_by_user_id))
                    
                    conn.commit()
                    return {
                        'success': True, 
                        'message': f'User {user[1]} added to team as {role}',
                        'member': {
                            'id': record_id,
                            'user_id': user_id,
                            'full_name': user[1],
                            'email': email,
                            'role': role,
                            'status': 'active'
                        }
                    }
                    
        except Exception as e:
            logger.error(f"Error inviting member: {e}")
            return {'success': False, 'message': str(e)}

    def remove_member(self, company_id: str, user_id: int) -> bool:
        """Remove a member from the team"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        DELETE FROM company_team_members
                        WHERE company_id = %s AND user_id = %s
                    """, (company_id, user_id))
                    conn.commit()
                    return cur.rowcount > 0
        except Exception as e:
            logger.error(f"Error removing member: {e}")
            return False
