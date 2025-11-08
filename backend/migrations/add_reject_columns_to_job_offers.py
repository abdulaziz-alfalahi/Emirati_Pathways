"""
Migration: Add reject columns to job_offers table
Date: 2025-01-07
Description: Adds rejected_by, rejection_date, and rejection_reason columns to support offer rejection
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'emirati_pathways'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'postgres'),
        port=os.getenv('DB_PORT', '5432')
    )

def migrate():
    """Add reject columns to job_offers table"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        print("Starting migration: Adding reject columns to job_offers table...")
        
        # Check if columns already exist
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'job_offers' 
            AND column_name IN ('rejected_by', 'rejection_date', 'rejection_reason')
        """)
        
        existing_columns = [row[0] for row in cur.fetchall()]
        
        # Add rejected_by column if it doesn't exist
        if 'rejected_by' not in existing_columns:
            print("Adding rejected_by column...")
            cur.execute("""
                ALTER TABLE job_offers 
                ADD COLUMN rejected_by VARCHAR(50)
            """)
            print("✓ rejected_by column added")
        else:
            print("✓ rejected_by column already exists")
        
        # Add rejection_date column if it doesn't exist
        if 'rejection_date' not in existing_columns:
            print("Adding rejection_date column...")
            cur.execute("""
                ALTER TABLE job_offers 
                ADD COLUMN rejection_date TIMESTAMP
            """)
            print("✓ rejection_date column added")
        else:
            print("✓ rejection_date column already exists")
        
        # Add rejection_reason column if it doesn't exist
        if 'rejection_reason' not in existing_columns:
            print("Adding rejection_reason column...")
            cur.execute("""
                ALTER TABLE job_offers 
                ADD COLUMN rejection_reason TEXT
            """)
            print("✓ rejection_reason column added")
        else:
            print("✓ rejection_reason column already exists")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    migrate()

