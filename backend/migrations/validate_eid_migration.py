"""
EID Migration Validator
=======================
Run AFTER executing 001_eid_refactor.sql to verify the migration succeeded.
"""

import psycopg2
import psycopg2.extras
import sys


def connect():
    return psycopg2.connect(
        host='10.228.145.66', port=5454,
        dbname='dghr_prod', user='dghr_prod', password='AZS#$167@2026'
    )


def validate():
    conn = connect()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    passed = 0
    failed = 0

    def check(name, query, expected_count=0):
        nonlocal passed, failed
        cur.execute(query)
        rows = cur.fetchall()
        count = len(rows)
        status = "✅ PASS" if count == expected_count else "❌ FAIL"
        if count != expected_count:
            failed += 1
            print(f"  {status}: {name} — got {count} rows, expected {expected_count}")
            for r in rows[:5]:
                print(f"         {dict(r)}")
        else:
            passed += 1
            print(f"  {status}: {name}")

    print("\n" + "=" * 70)
    print("  EID MIGRATION VALIDATION")
    print("=" * 70)

    # 1. Users PK type
    print("\n── 1. Users PK Type ──")
    check("users.id is CHAR(15)", """
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name='users' AND column_name='id'
          AND data_type != 'character'
    """)

    # 2. No integer/uuid user columns remain
    print("\n── 2. No Legacy Types ──")
    user_cols = [
        'user_id', 'candidate_id', 'recruiter_id', 'mentee_user_id',
        'student_user_id', 'educator_id', 'interviewer_id',
        'created_by', 'updated_by', 'uploaded_by', 'assigned_to',
        'assigned_by', 'approved_by', 'approver_id', 'requested_by',
        'changed_by', 'provided_by', 'reviewer_id', 'marked_by',
        'reported_by', 'actor_id', 'recipient_id', 'sender_id',
        'hr_user_id', 'added_by', 'invited_by', 'posted_by',
        'created_user_id'
    ]
    cols_str = ",".join(f"'{c}'" for c in user_cols)
    check("No INTEGER user columns remain", f"""
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name IN ({cols_str})
          AND data_type = 'integer'
    """)
    check("No UUID user columns remain", f"""
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name IN ({cols_str})
          AND data_type = 'uuid'
    """)
    check("No TEXT user columns remain", f"""
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name IN ({cols_str})
          AND data_type = 'text'
    """)

    # 3. EID format
    print("\n── 3. EID Format ──")
    check("All users.id match EID format", """
        SELECT id FROM users WHERE id !~ '^[0-9]{15}$'
    """)

    # 4. FK constraints exist
    print("\n── 4. FK Constraints ──")
    cur.execute("""
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users'
        ORDER BY tc.table_name
    """)
    fk_count = len(cur.fetchall())
    status = "✅ PASS" if fk_count >= 15 else "❌ FAIL"
    if fk_count >= 15:
        passed += 1
    else:
        failed += 1
    print(f"  {status}: FK constraints to users: {fk_count} (expected ≥15)")

    # 5. No orphaned profile_id columns
    print("\n── 5. profile_id Elimination ──")
    check("No profile_id columns in candidate tables", """
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name = 'profile_id'
          AND table_name LIKE 'candidate_%'
    """)

    # 6. Referential integrity spot checks
    print("\n── 6. Referential Integrity ──")
    for table, col in [
        ('candidate_profiles', 'user_id'),
        ('user_cvs', 'user_id'),
        ('notifications', 'user_id'),
    ]:
        check(f"{table}.{col} → users.id", f"""
            SELECT {col} FROM {table}
            WHERE {col} IS NOT NULL
              AND {col}::text NOT IN (SELECT id::text FROM users)
        """)

    # Summary
    print("\n" + "=" * 70)
    total = passed + failed
    print(f"  RESULTS: {passed}/{total} passed, {failed} failed")
    print("=" * 70 + "\n")

    conn.close()
    return failed == 0


if __name__ == '__main__':
    success = validate()
    sys.exit(0 if success else 1)
