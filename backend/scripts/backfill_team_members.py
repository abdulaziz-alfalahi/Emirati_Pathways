"""
Backfill company_team_members table from hr_profiles.
This ensures that all HR users are correctly linked to their teams in the new system.
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DB_CONFIG = {
    'host': '127.0.0.1',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password'
}

def backfill_team_members():
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        logger.info("Starting backfill of company_team_members...")
        
        # 1. Fetch all users from hr_profiles with their company_id
        cur.execute("""
            SELECT hp.user_id, hp.company_id, u.role, u.full_name
            FROM hr_profiles hp
            JOIN users u ON hp.user_id = u.id
            WHERE hp.company_id IS NOT NULL
        """)
        hr_users = cur.fetchall()
        logger.info(f"Found {len(hr_users)} HR users in hr_profiles.")
        
        added_count = 0
        skipped_count = 0
        
        for user in hr_users:
            user_id = user['user_id']
            company_id = str(user['company_id'])
            role = user['role'] or 'recruiter'
            name = user['full_name']
            
            # Map user roles to team roles
            team_role = 'recruiter'
            if role in ['employer_admin', 'admin', 'employer_admin']:
                team_role = 'admin'
            elif role == 'hiring_manager':
                team_role = 'hiring_manager'
            
            # 2. Check if already exists in company_team_members
            cur.execute("""
                SELECT id FROM company_team_members 
                WHERE company_id = %s AND user_id = %s
            """, (company_id, user_id))
            
            if cur.fetchone():
                skipped_count += 1
                continue
                
            # 3. Insert into company_team_members
            new_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO company_team_members 
                (id, company_id, user_id, role, invitation_status, joined_at, permissions)
                -- must match workspace_middleware.py:83, which requires 'accepted'
                VALUES (%s, %s, %s, %s, 'accepted', NOW(), '{}')
            """, (new_id, company_id, user_id, team_role))
            
            added_count += 1
            logger.info(f"Added {name} (ID: {user_id}) to company {company_id} as {team_role}")
            
        conn.commit()
        logger.info(f"Backfill complete! Added: {added_count}, Skipped: {skipped_count}")
        return True
        
    except Exception as e:
        logger.error(f"Backfill failed: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    backfill_team_members()
