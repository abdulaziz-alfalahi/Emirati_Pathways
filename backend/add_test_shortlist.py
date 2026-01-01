"""
Script to add test candidates to the shortlist for interview scheduling testing
"""

import psycopg2
import psycopg2.extras
from datetime import datetime
import uuid
import os

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)

def add_test_shortlist():
    """Add test candidates to shortlist"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # First, get the job IDs
        cur.execute("""
            SELECT id, title FROM job_postings 
            WHERE status = 'active' 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        jobs = cur.fetchall()
        print(f"Found {len(jobs)} active jobs:")
        for job in jobs:
            print(f"  - {job['id']}: {job['title']}")
        
        if not jobs:
            print("No active jobs found. Creating a test job...")
            return
        
        # Get some users to use as candidates
        cur.execute("""
            SELECT id, first_name, last_name, email 
            FROM users 
            WHERE role IN ('job_seeker', 'candidate') OR role IS NULL
            LIMIT 5
        """)
        users = cur.fetchall()
        print(f"\nFound {len(users)} potential candidates:")
        for user in users:
            print(f"  - {user['id']}: {user['first_name']} {user['last_name']} ({user['email']})")
        
        if not users:
            print("No candidate users found. Creating test users...")
            # Create test users
            test_users = [
                ('Ahmed', 'Al Maktoum', 'ahmed.maktoum@test.ae'),
                ('Fatima', 'Al Nahyan', 'fatima.nahyan@test.ae'),
                ('Mohammed', 'Al Falasi', 'mohammed.falasi@test.ae'),
            ]
            
            for first_name, last_name, email in test_users:
                user_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO users (id, first_name, last_name, email, role, created_at)
                    VALUES (%s, %s, %s, %s, 'job_seeker', NOW())
                    ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
                    RETURNING id, first_name, last_name, email
                """, (user_id, first_name, last_name, email))
                user = cur.fetchone()
                users.append(user)
                print(f"  Created: {user['id']}: {user['first_name']} {user['last_name']}")
            
            conn.commit()
        
        # Create shortlist table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS candidate_shortlist (
                id SERIAL PRIMARY KEY,
                shortlist_id VARCHAR(100) UNIQUE NOT NULL,
                jd_id VARCHAR(100) NOT NULL,
                candidate_id VARCHAR(100) NOT NULL,
                recruiter_id VARCHAR(100) NOT NULL,
                match_score DECIMAL(5,2),
                match_details JSONB,
                status VARCHAR(50) DEFAULT 'shortlisted',
                notes TEXT,
                tags JSONB DEFAULT '[]',
                contacted_at TIMESTAMP,
                interview_scheduled_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(jd_id, candidate_id)
            )
        """)
        conn.commit()
        
        # Add candidates to shortlist for the first job
        job_id = str(jobs[0]['id'])
        recruiter_id = "recruiter_001"
        
        print(f"\nAdding candidates to shortlist for job: {jobs[0]['title']} ({job_id})")
        
        for i, user in enumerate(users[:3]):  # Add up to 3 candidates
            shortlist_id = f"sl_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
            match_score = 85.0 - (i * 5)  # 85, 80, 75
            
            try:
                cur.execute("""
                    INSERT INTO candidate_shortlist (
                        shortlist_id, jd_id, candidate_id, recruiter_id,
                        match_score, status, notes, created_at
                    ) VALUES (%s, %s, %s, %s, %s, 'shortlisted', %s, NOW())
                    ON CONFLICT (jd_id, candidate_id) DO UPDATE 
                    SET status = 'shortlisted', updated_at = NOW()
                    RETURNING shortlist_id
                """, (
                    shortlist_id, job_id, str(user['id']), recruiter_id,
                    match_score, f"Test candidate {i+1} for interview scheduling"
                ))
                result = cur.fetchone()
                print(f"  Added: {user['first_name']} {user['last_name']} (score: {match_score})")
            except Exception as e:
                print(f"  Error adding {user['first_name']}: {e}")
        
        conn.commit()
        
        # Verify shortlist
        cur.execute("""
            SELECT cs.shortlist_id, cs.jd_id, cs.candidate_id, cs.match_score, cs.status,
                   u.first_name, u.last_name, u.email
            FROM candidate_shortlist cs
            LEFT JOIN users u ON cs.candidate_id = u.id::text
            WHERE cs.jd_id = %s
            ORDER BY cs.match_score DESC
        """, (job_id,))
        shortlist = cur.fetchall()
        
        print(f"\nShortlist for job {job_id}:")
        for entry in shortlist:
            print(f"  - {entry['shortlist_id']}: {entry['first_name']} {entry['last_name']} (score: {entry['match_score']})")
        
        print(f"\nTotal candidates in shortlist: {len(shortlist)}")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    add_test_shortlist()
