import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(
    dbname='emirati_journey',
    user='emirati_user',
    password='emirati_secure_password',
    host='localhost',
    port=5432
)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Find the admin user
cur.execute("SELECT id, email, full_name FROM users WHERE email='admin@emiratijourney.ae'")
admin = cur.fetchone()
print(f"Admin user: {admin}")

# Find user named "New Member"  
cur.execute("SELECT id, email, full_name FROM users WHERE full_name ILIKE '%new member%' LIMIT 5")
new_member = cur.fetchall()
print(f"New Member users: {new_member}")

if admin and new_member:
    admin_id = str(admin['id'])
    member_id = str(new_member[0]['id'])
    print(f"\nAdmin ID: {admin_id} (type: {type(admin['id']).__name__})")
    print(f"Member ID: {member_id} (type: {type(new_member[0]['id']).__name__})")
    
    # Check for existing conversation
    print("\n=== Checking existing conversations ===")
    cur.execute("""
        SELECT c.id 
        FROM conversation_participants cp1
        JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
        JOIN conversations c ON cp1.conversation_id = c.id
        WHERE cp1.user_id = %s AND cp2.user_id = %s
        AND (c.conversation_type = 'direct' OR c.conversation_type IS NULL)
        LIMIT 1
    """, (admin_id, member_id))
    existing = cur.fetchone()
    print(f"Existing conversation: {existing}")
    
    # Check if conversation_type column exists
    print("\n=== Checking conversation_type column ===")
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='conversations' AND column_name='conversation_type'")
    has_conv_type = cur.fetchone()
    print(f"Has conversation_type column: {has_conv_type is not None}")

    # Try the full create flow
    print("\n=== Testing full create flow ===")
    try:
        cur.execute("""
            INSERT INTO conversations (application_id, job_id, title)
            VALUES (%s, %s, %s)
            RETURNING id, created_at
        """, (None, None, f'Admin -> New Member'))
        conv_data = cur.fetchone()
        print(f"Created conversation: {conv_data}")
        
        for p_id in [admin_id, member_id]:
            cur.execute("""
                INSERT INTO conversation_participants (conversation_id, user_id, is_archived, role)
                VALUES (%s, %s, FALSE, %s)
            """, (conv_data['id'], p_id, None))
            print(f"Added participant: {p_id}")
        
        # Now test _get_conversation_by_id equivalent
        print("\n=== Testing conversation retrieval ===")
        cur.execute("""
            SELECT c.*, 
                   m.content as last_message_content,
                   m.created_at as last_message_at
            FROM conversations c
            LEFT JOIN messages m ON c.id = m.conversation_id 
                AND m.created_at = (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id)
            WHERE c.id = %s
        """, (conv_data['id'],))
        conv_row = cur.fetchone()
        print(f"Conv row columns: {list(conv_row.keys())}")
        print(f"is_active present: {'is_active' in conv_row}")
        
        conn.rollback()
        print("\nTest passed! (rolled back)")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()

conn.close()
