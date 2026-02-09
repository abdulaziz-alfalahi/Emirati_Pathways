import psycopg2
import psycopg2.extras
import os
from datetime import datetime

# Database connection
conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME', 'emirati_journey'),
    user=os.getenv('DB_USER', 'emirati_user'),
    password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    host=os.getenv('DB_HOST', 'localhost'),
    port=os.getenv('DB_PORT', 5432)
)

cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

# Open output file
output_file = 'users_list.txt'

with open(output_file, 'w', encoding='utf-8') as f:
    f.write("=" * 130 + "\n")
    f.write("USERS LIST\n")
    f.write("=" * 130 + "\n\n")
    
    # Get all users
    cur.execute("""
        SELECT 
            id,
            email,
            phone,
            first_name,
            last_name,
            role,
            is_active,
            created_at
        FROM users 
        ORDER BY id
    """)
    
    users = cur.fetchall()
    
    f.write(f"Total Users: {len(users)}\n\n")
    
    # Print header
    f.write(f"{'ID':<5} {'Name':<25} {'Email':<45} {'Phone':<17} {'Role':<12} {'Active':<8} {'Created':<12}\n")
    f.write("-" * 130 + "\n")
    
    # Print each user
    for user in users:
        user_id = str(user['id'])
        name = f"{user['first_name']} {user['last_name']}"
        email = user['email'] or 'N/A'
        phone = user['phone'] or 'N/A'
        role = user['role'] or 'N/A'
        active = '✓' if user.get('is_active', True) else '✗'
        created = user['created_at'].strftime('%Y-%m-%d') if user.get('created_at') else 'N/A'
        
        # Truncate long fields
        if len(name) > 25:
            name = name[:22] + '...'
        if len(email) > 45:
            email = email[:42] + '...'
        
        f.write(f"{user_id:<5} {name:<25} {email:<45} {phone:<17} {role:<12} {active:<8} {created:<12}\n")
    
    f.write("-" * 130 + "\n\n")
    
    # Summary by role
    f.write(f"{'SUMMARY BY ROLE':^130}\n")
    f.write("-" * 130 + "\n")
    
    cur.execute("""
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
        ORDER BY count DESC
    """)
    
    role_summary = cur.fetchall()
    
    for row in role_summary:
        role = row['role'] or 'Unknown'
        count = row['count']
        f.write(f"{role:<20}: {count:>5} users\n")
    
    f.write("\n" + "=" * 130 + "\n")

cur.close()
conn.close()

print(f"✓ Users list saved to: {output_file}")
print(f"✓ Total users: {len(users)}")
print(f"\nTo view the file, run: type {output_file}")
