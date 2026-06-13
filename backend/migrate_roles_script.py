import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_config = {
    'dbname': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT', '5432')
}

queries = [
    "UPDATE users SET role = 'candidate' WHERE role IN ('candidate', 'candidate', 'candidate');",
    "UPDATE users SET role = 'employer_admin' WHERE role IN ('employer_admin', 'employer_admin', 'employer_admin');",
    "UPDATE users SET role = 'recruiter' WHERE role IN ('recruiter');",
    "UPDATE users SET role = 'training_provider' WHERE role IN ('training_provider', 'training_provider');",
    "UPDATE users SET role = 'parent' WHERE role IN ('parent');",
    "UPDATE users SET role = 'admin' WHERE role IN ('admin');",
    "UPDATE users SET role = 'talent_operator' WHERE role IN ('talent_operator', 'talent_operator');",
    "UPDATE users SET role = 'employer_relations' WHERE role IN ('employer_relations');",
    "UPDATE users SET role = 'education_operator' WHERE role IN ('education_operator');",
    "UPDATE users SET role = 'assessment_operator' WHERE role IN ('assessment_operator');",
    "UPDATE users SET role = 'mentorship_operator' WHERE role IN ('mentorship_operator');",
    "UPDATE users SET role = 'community_operator' WHERE role IN ('community_operator');",
    "UPDATE users SET role = 'platform_operator' WHERE role IN ('platform_operator', 'platform_operator', 'platform_operator');",
    "UPDATE users SET role = 'compliance_auditor' WHERE role IN ('compliance_auditor');"
]

try:
    print(f"Connecting to {db_config['host']}:{db_config['port']} database {db_config['dbname']}...")
    conn = psycopg2.connect(**db_config)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Check if user_type exists
    cursor.execute("SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='user_type'")
    has_user_type = cursor.fetchone() is not None
    
    if has_user_type:
        queries.extend([q.replace("role =", "user_type =").replace("role IN", "user_type IN") for q in queries])
        
    for q in queries:
        cursor.execute(q)
        print(f"Executed: {q[:50]}... -> Rows updated: {cursor.rowcount}")
        
    cursor.close()
    conn.close()
    print("Migration complete!")
    
except Exception as e:
    print(f"Error: {e}")
