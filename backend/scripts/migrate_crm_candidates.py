import pandas as pd
import psycopg2
import os
import json
import numpy as np

def migrate_crm_data():
    master_file = '/app/master_file.xlsx'
    
    print(f"Reading {master_file}...")
    df = pd.read_excel(master_file, sheet_name='Master')
    print(f"Loaded {len(df)} rows.")

    # Convert NaNs to None
    df = df.replace({np.nan: None})

    # Connect to local docker postgres
    # Use standard DB_NAME=emirati_journey
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    print("Adding columns to candidate_profiles if they do not exist...")
    cur.execute('''
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS call_status VARCHAR(50);
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS work_status VARCHAR(50);
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS job_seeker_type VARCHAR(50);
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS counseling_remarks TEXT;
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;
    ''')
    conn.commit()

    print("Migrating records...")
    updated_count = 0
    new_users_count = 0

    for index, row in df.iterrows():
        eid = str(row.get('EID', '')).strip()
        if not eid or eid == 'None':
            continue
            
        full_name = row.get('Full Name')
        call_status = str(row.get('Call Status'))[:50] if row.get('Call Status') else None
        work_status = str(row.get('Work Status'))[:50] if row.get('Work Status') else None
        job_seeker_type = str(row.get('Job Seeker Type'))[:50] if row.get('Job Seeker Type') else None
        remarks = str(row.get('Remarks')) if row.get('Remarks') else None
        
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE emirates_id_enc = %s", (eid,))
        user_record = cur.fetchone()
        
        if user_record:
            user_id = user_record[0]
            
            # Check if profile exists
            cur.execute("SELECT id FROM candidate_profiles WHERE user_id = %s", (user_id,))
            profile_record = cur.fetchone()
            
            if profile_record:
                # Update existing profile
                cur.execute('''
                    UPDATE candidate_profiles
                    SET call_status = %s, work_status = %s, job_seeker_type = %s, counseling_remarks = %s
                    WHERE user_id = %s
                ''', (call_status, work_status, job_seeker_type, remarks, user_id))
            else:
                # Insert new profile
                cur.execute('''
                    INSERT INTO candidate_profiles (user_id, call_status, work_status, job_seeker_type, counseling_remarks)
                    VALUES (%s, %s, %s, %s, %s)
                ''', (user_id, call_status, work_status, job_seeker_type, remarks))
            updated_count += 1
        else:
            # We would normally create a new user, but since the Growth Operator is supposed to 
            # have imported the raw Nafis data, we'll assume they should be created.
            # However, for this one-time migration, let's create a minimal user.
            cur.execute('''
                INSERT INTO users (id, full_name, emirates_id_enc, email, phone, user_type, role)
                VALUES (%s, %s, %s, %s, %s, 'candidate', 'candidate')
                RETURNING id
            ''', (eid, full_name, eid, f"{eid}@example.com", str(row.get('Ph No'))))
            user_id = cur.fetchone()[0]
            
            cur.execute('''
                INSERT INTO candidate_profiles (user_id, call_status, work_status, job_seeker_type, counseling_remarks)
                VALUES (%s, %s, %s, %s, %s)
            ''', (user_id, call_status, work_status, job_seeker_type, remarks))
            new_users_count += 1

    conn.commit()
    print(f"Migration complete! Updated {updated_count} existing candidates, created {new_users_count} new candidate profiles.")
    
    cur.close()
    conn.close()

if __name__ == '__main__':
    migrate_crm_data()
