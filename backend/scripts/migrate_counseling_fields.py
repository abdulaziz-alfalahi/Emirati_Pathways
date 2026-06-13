import os
import psycopg2
import re

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

def migrate():
    print("Connecting to DB...")
    # Use the DB config from environment (or default to .env values if running via docker compose)
    db_url = os.environ.get('DATABASE_URL', 'postgresql://dghr_prod:AZS%23%24167%402026@10.228.145.66:5454/dghr_prod')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    print("Adding columns...")
    cur.execute('''
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS preferred_locations JSONB;
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS preferred_sector VARCHAR(50);
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS preferred_work_setup VARCHAR(50);
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS preferred_schedule VARCHAR(50);
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS alternative_phone VARCHAR(50);
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS unavailability_reason VARCHAR(100);
        ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS role_preferences VARCHAR(255);
    ''')
    conn.commit()

    print("Parsing remarks...")
    cur.execute("SELECT id, counseling_remarks FROM candidate_profiles WHERE counseling_remarks IS NOT NULL")
    rows = cur.fetchall()
    
    updated_count = 0
    import json
    
    for row_id, remarks in rows:
        parsed = parse_remarks_to_fields(remarks)
        if not parsed:
            continue
            
        update_cols = []
        update_vals = []
        for k, v in parsed.items():
            update_cols.append(f"{k} = %s")
            if k == 'preferred_locations':
                update_vals.append(json.dumps(v))
            else:
                update_vals.append(v)
                
        if update_cols:
            update_vals.append(row_id)
            query = f"UPDATE candidate_profiles SET {', '.join(update_cols)} WHERE id = %s"
            cur.execute(query, tuple(update_vals))
            updated_count += 1

    conn.commit()
    print(f"Migration complete! Parsed and updated fields for {updated_count} candidates.")

    cur.close()
    conn.close()

if __name__ == '__main__':
    migrate()
