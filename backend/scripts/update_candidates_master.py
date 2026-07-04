import os
import re
import json
import numpy as np
import pandas as pd
import psycopg2
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/home/aalfalahi.d/Emirati_Pathways/backend/.env')

import sys
sys.path.append('/home/aalfalahi.d/Emirati_Pathways')
sys.path.append('/home/aalfalahi.d/Emirati_Pathways/backend')

from db import get_db_connection

def clean_eid(val):
    if pd.isna(val):
        return None
    s = str(val).strip()
    if s.endswith('.0'):
        s = s[:-2]
    if 'e+' in s.lower() or 'e-' in s.lower():
        try:
            s = str(int(float(s)))
        except:
            pass
    return s

def clean_phone(val):
    if pd.isna(val):
        return None
    s = str(val).strip()
    if s.endswith('.0'):
        s = s[:-2]
    if 'e+' in s.lower() or 'e-' in s.lower():
        try:
            s = str(int(float(s)))
        except:
            pass
    return s

def parse_remarks_to_fields(remark):
    if not remark:
        return {}
        
    remark_lower = remark.lower()
    fields = {}
    
    # Locations
    locs = []
    if 'dubai' in remark_lower or 'dxb' in remark_lower: locs.append('Dubai')
    if 'abu dhabi' in remark_lower or 'ad' in remark_lower or 'shamkha' in remark_lower or 'ain' in remark_lower: locs.append('Abu Dhabi')
    if 'sharjah' in remark_lower: locs.append('Sharjah')
    if 'hatta' in remark_lower: locs.append('Hatta')
    if locs:
        fields['preferred_locations'] = locs
        
    # Sector
    if 'semi gov' in remark_lower or 'semi-gov' in remark_lower:
        fields['preferred_sector'] = 'Semi-Gov'
    elif 'gov' in remark_lower:
        fields['preferred_sector'] = 'Gov'
    elif 'private' in remark_lower:
        fields['preferred_sector'] = 'Private'
    elif 'school' in remark_lower:
        fields['preferred_sector'] = 'Schools'
        
    # Work Setup
    if 'remote' in remark_lower:
        fields['preferred_work_setup'] = 'Remote'
    elif 'hybrid' in remark_lower:
        fields['preferred_work_setup'] = 'Hybrid'
        
    # Schedule
    if 'part time' in remark_lower or 'part-time' in remark_lower:
        fields['preferred_schedule'] = 'Part-Time'
    elif 'shift' in remark_lower:
        fields['preferred_schedule'] = 'Shift-Based'
    elif 'full time' in remark_lower or 'full-time' in remark_lower:
        fields['preferred_schedule'] = 'Full-Time'
        
    # Phone parsing (e.g. "another number: 97150...")
    phone_match = re.search(r'(?:another|other) (?:number|no)[:\-\s]*([0-9\+\s]+)', remark_lower)
    if phone_match:
        fields['alternative_phone'] = phone_match.group(1).strip()
        
    # Unavailability
    if 'wrong number' in remark_lower or 'incorrect number' in remark_lower:
        fields['unavailability_reason'] = 'Invalid Number'
    elif 'pregnan' in remark_lower or 'surgery' in remark_lower or 'medical' in remark_lower:
        fields['unavailability_reason'] = 'Medical Leave'
    elif 'study' in remark_lower or 'phd' in remark_lower or 'university' in remark_lower:
        fields['unavailability_reason'] = 'Studying'
    elif 'not interested' in remark_lower or 'doesn\'t want' in remark_lower or 'don\'t want' in remark_lower:
        fields['unavailability_reason'] = 'Opt-Out'
        
    # Roles
    roles = []
    if 'admin' in remark_lower: roles.append('Admin')
    if 'back office' in remark_lower or 'back-office' in remark_lower: roles.append('Back-Office')
    if 'hr ' in remark_lower or 'human resources' in remark_lower: roles.append('HR')
    if 'operation' in remark_lower: roles.append('Operations')
    if roles:
        fields['role_preferences'] = ', '.join(roles)
        
    return fields

def run_update():
    excel_path = "/home/aalfalahi.d/Downloads/Main Master File - 30 June'26.xlsx"
    print(f"Reading {excel_path}...")
    df = pd.read_excel(excel_path, sheet_name='Master')
    print(f"Loaded {len(df)} rows from Excel sheet 'Master'.")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    updated_users = 0
    created_users = 0
    updated_profiles = 0
    created_profiles = 0
    
    for idx, row in df.iterrows():
        eid = clean_eid(row.get('EID'))
        if not eid:
            continue
            
        full_name = row.get('Full Name')
        fullname_ar = row.get('Full Name Arabic')
        email = row.get('Email')
        phone = clean_phone(row.get('Ph No'))
        emirate = row.get('Emirate Of Residence')
        education_level = row.get('Education')
        
        # Clean up full name
        if pd.isna(full_name):
            full_name = "Candidate"
        else:
            full_name = str(full_name).strip()
            
        if pd.isna(fullname_ar):
            fullname_ar = None
        else:
            fullname_ar = str(fullname_ar).strip()
            
        if pd.isna(email) or not str(email).strip():
            email = f"{eid}@example.com"
        else:
            email = str(email).strip()
            
        # Parse Date Of Birth
        dob = None
        dob_val = row.get('Date Of Birth')
        if pd.notnull(dob_val):
            try:
                dob = pd.to_datetime(dob_val)
            except:
                pass
                
        call_status = str(row.get('Call Status'))[:50] if pd.notnull(row.get('Call Status')) else None
        work_status = str(row.get('Work Status'))[:50] if pd.notnull(row.get('Work Status')) else None
        job_seeker_type = str(row.get('Job Seeker Type'))[:50] if pd.notnull(row.get('Job Seeker Type')) else None
        remarks = str(row.get('Remarks')) if pd.notnull(row.get('Remarks')) else None
        
        english = str(row.get('English Language Level'))[:50] if pd.notnull(row.get('English Language Level')) else None
        salary = str(row.get('Salary Expectations'))[:50] if pd.notnull(row.get('Salary Expectations')) else None
        
        # Parse remarks to structured fields
        parsed_fields = parse_remarks_to_fields(remarks)
        
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE emirates_id_enc = %s", (eid,))
        user_record = cur.fetchone()
        
        if user_record:
            user_id = user_record[0]
            # Update user details
            cur.execute("""
                UPDATE users 
                SET full_name = %s, fullname_ar = %s, email = %s, phone = %s, 
                    emirate = %s, education_level = %s, updated_at = NOW()
                WHERE id = %s
            """, (full_name, fullname_ar, email, phone, emirate, education_level, user_id))
            updated_users += 1
        else:
            # Create user
            cur.execute("""
                INSERT INTO users (id, full_name, fullname_ar, emirates_id_enc, email, phone, 
                                   emirate, education_level, user_type, role, is_active, is_verified, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'candidate', 'candidate', True, True, NOW(), NOW())
                RETURNING id
            """, (eid, full_name, fullname_ar, eid, email, phone, emirate, education_level))
            user_id = cur.fetchone()[0]
            created_users += 1
            
        # Check if candidate profile exists
        cur.execute("SELECT id FROM candidate_profiles WHERE user_id = %s", (user_id,))
        profile_record = cur.fetchone()
        
        # Build updates for candidate_profiles
        base_cols = {
            'call_status': call_status,
            'work_status': work_status,
            'job_seeker_type': job_seeker_type,
            'counseling_remarks': remarks,
            'dob': dob,
            'english_proficiency': english,
            'expected_salary_range': salary
        }
        
        # Add structured fields from remarks
        for k, v in parsed_fields.items():
            if k == 'preferred_locations':
                base_cols[k] = json.dumps(v)
            else:
                base_cols[k] = v
                
        # Fill missing keys in base_cols with None so they are cleaned if empty in remarks
        all_possible_structured_fields = [
            'preferred_locations', 'preferred_sector', 'preferred_work_setup', 
            'preferred_schedule', 'alternative_phone', 'unavailability_reason', 'role_preferences'
        ]
        for fld in all_possible_structured_fields:
            if fld not in base_cols:
                base_cols[fld] = None
                
        if profile_record:
            # Update candidate profile
            update_clause = ", ".join([f"{k} = %s" for k in base_cols.keys()])
            update_clause += ", updated_at = NOW()"
            values = list(base_cols.values()) + [user_id]
            cur.execute(f"""
                UPDATE candidate_profiles
                SET {update_clause}
                WHERE user_id = %s
            """, values)
            updated_profiles += 1
        else:
            # Create candidate profile
            cols = ['user_id', 'created_at', 'updated_at'] + list(base_cols.keys())
            places = ['%s', 'NOW()', 'NOW()'] + ['%s'] * len(base_cols)
            values = [user_id] + list(base_cols.values())
            cur.execute(f"""
                INSERT INTO candidate_profiles ({", ".join(cols)})
                VALUES ({", ".join(places)})
            """, values)
            created_profiles += 1
            
    conn.commit()
    cur.close()
    conn.close()
    
    print("=== MIGRATION COMPLETE ===")
    print(f"Users: Updated {updated_users}, Created {created_users}")
    print(f"Profiles: Updated {updated_profiles}, Created {created_profiles}")

if __name__ == '__main__':
    run_update()
