import psycopg2
from datetime import datetime

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="emirati_pathways",
    user="postgres",
    password="POSZamoon@2345"
)

cur = conn.cursor()

# Get all interviews
cur.execute("""
    SELECT 
        interview_id,
        candidate_id,
        recruiter_id,
        interview_type,
        interview_title,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status,
        meeting_link,
        created_at
    FROM interview_schedules
    ORDER BY scheduled_date, scheduled_time
""")

interviews = cur.fetchall()

print("=" * 120)
print("ALL SCHEDULED INTERVIEWS")
print("=" * 120)
print()

if not interviews:
    print("No interviews found in the database.")
else:
    print(f"Total interviews: {len(interviews)}")
    print()
    
    for i, interview in enumerate(interviews, 1):
        interview_id, candidate_id, recruiter_id, interview_type, title, date, time, duration, status, link, created = interview
        
        print(f"{i}. Interview ID: {interview_id}")
        print(f"   Candidate: {candidate_id}")
        print(f"   Recruiter: {recruiter_id}")
        print(f"   Type: {interview_type}")
        print(f"   Title: {title}")
        print(f"   Date: {date}")
        print(f"   Time: {time}")
        print(f"   Duration: {duration} minutes")
        print(f"   Status: {status}")
        print(f"   Meeting Link: {link}")
        print(f"   Created: {created}")
        print("-" * 120)

conn.close()

