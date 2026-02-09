import psycopg2
import psycopg2.extras
import os
import json

# Database connection
conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME', 'emirati_journey'),
    user=os.getenv('DB_USER', 'emirati_user'),
    password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    host=os.getenv('DB_HOST', 'localhost'),
    port=os.getenv('DB_PORT', 5432)
)

cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

user_id = 62
output_file = f'user_{user_id}_complete_info.txt'

with open(output_file, 'w', encoding='utf-8') as f:
    f.write("=" * 100 + "\n")
    f.write(f"COMPLETE INFORMATION FOR USER ID {user_id}\n")
    f.write("=" * 100 + "\n")
    
    # 1. Basic user information
    f.write("\n=== BASIC USER INFORMATION ===\n")
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    
    if not user:
        f.write(f"✗ User ID {user_id} not found!\n")
        print(f"✗ User ID {user_id} not found!")
        cur.close()
        conn.close()
        exit()
    
    for key, value in user.items():
        f.write(f"{key:.<30} {value}\n")
    
    # 1.1 Candidate Profile
    f.write("\n=== CANDIDATE PROFILE ===\n")
    # Cast user_id to text if needed, or integer depending on schema. Users.id is usually int, but sometimes referenced as string.
    # Profile table usually uses user_id as foreign key.
    try:
        cur.execute("SELECT * FROM candidate_profiles WHERE user_id = %s", (str(user_id),))
        profile = cur.fetchone()
        if profile:
            for key, value in profile.items():
                if isinstance(value, dict) or isinstance(value, list):
                    f.write(f"{key:.<30} {json.dumps(value, indent=4)}\n")
                else:
                    f.write(f"{key:.<30} {value}\n")
        else:
            f.write("No candidate profile found.\n")
    except Exception as e:
        f.write(f"Error checking candidate_profiles: {e}\n")

    # 2. Job Applications
    f.write("\n=== JOB APPLICATIONS ===\n")
    try:
        cur.execute("""
            SELECT * FROM job_applications 
            WHERE candidate_id = %s OR candidate_id::text = %s
            ORDER BY submitted_at DESC
        """, (str(user_id), str(user_id)))
        applications = cur.fetchall()
        f.write(f"Total Applications: {len(applications)}\n")
        for app in applications:
            f.write(f"\n  Application ID: {app.get('id')}\n")
            f.write(f"  Job ID: {app.get('job_id')}\n")
            f.write(f"  Status: {app.get('status')}\n")
            f.write(f"  Submitted: {app.get('submitted_at')}\n")
    except Exception as e:
        f.write(f"Error checking job_applications: {e}\n")
    
    # 3. CVs (Postgres user_cvs table)
    f.write("\n=== CV RECORDS (Postgres) ===\n")
    try:
        cur.execute("SELECT * FROM user_cvs WHERE user_id::text = %s", (str(user_id),))
        cvs = cur.fetchall()
        f.write(f"Total CVs: {len(cvs)}\n")
        for cv in cvs:
            f.write(f"\n  CV Entry:\n")
            f.write(f"  User ID: {cv.get('user_id')}\n")
            f.write(f"  Professional Summary: {cv.get('professional_summary', 'N/A')}\n")
            if cv.get('personal_info'):
                f.write(f"  Personal Info: {json.dumps(cv.get('personal_info'), indent=4)}\n")
            f.write(f"  Technical Skills: {cv.get('technical_skills')}\n")
            f.write(f"  Soft Skills: {cv.get('soft_skills')}\n")
            f.write(f"  Created: {cv.get('created_at')}\n")
    except Exception as e:
        f.write(f"Error checking user_cvs: {e}\n")
    
    # 4. Conversations
    f.write("\n=== CONVERSATIONS ===\n")
    try:
        cur.execute("""
            SELECT c.* FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = %s
        """, (str(user_id),))
        conversations = cur.fetchall()
        f.write(f"Total Conversations: {len(conversations)}\n")
        for conv in conversations:
            f.write(f"\n  Conversation ID: {conv.get('id')}\n")
            f.write(f"  Title: {conv.get('title')}\n")
            f.write(f"  Created: {conv.get('created_at')}\n")
    except Exception as e:
        f.write(f"Error checking conversations: {e}\n")
    
    # 5. Messages
    f.write("\n=== MESSAGES ===\n")
    try:
        cur.execute("""
            SELECT * FROM messages 
            WHERE sender_id = %s
            ORDER BY created_at DESC
            LIMIT 20
        """, (str(user_id),))
        messages = cur.fetchall()
        f.write(f"Total Recent Messages: {len(messages)}\n")
        for msg in messages:
            f.write(f"\n  Message ID: {msg.get('id')}\n")
            content = msg.get('content', '')
            f.write(f"  Content: {content[:200]}{'...' if len(content) > 200 else ''}\n")
            f.write(f"  Created: {msg.get('created_at')}\n")
    except Exception as e:
         f.write(f"Error checking messages: {e}\n")
    
    # 6. Notifications
    f.write("\n=== NOTIFICATIONS ===\n")
    try:
        cur.execute("""
            SELECT * FROM notifications 
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 20
        """, (str(user_id),))
        notifications = cur.fetchall()
        f.write(f"Total Recent Notifications: {len(notifications)}\n")
        for notif in notifications:
            f.write(f"\n  Type: {notif.get('type')}\n")
            f.write(f"  Title: {notif.get('title')}\n")
            f.write(f"  Content: {notif.get('content')}\n")
            f.write(f"  Read: {'Yes' if notif.get('is_read') else 'No'}\n")
            f.write(f"  Created: {notif.get('created_at')}\n")
    except Exception as e:
        f.write(f"Error checking notifications: {e}\n")
    
    f.write("\n" + "=" * 100 + "\n")

cur.close()
conn.close()

print(f"✓ Complete information for user {user_id} saved to: {output_file}")
print(f"Quick Summary:")
print(f"  Name: {user['first_name']} {user['last_name']}")
