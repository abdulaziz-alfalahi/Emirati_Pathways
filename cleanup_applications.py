
from backend.app import app
from backend.extensions import db
from sqlalchemy import text

def clean_applications():
    print("Initializing cleanup using Flask App Context...")
    with app.app_context():
        try:
            # Check counts using SQLAlchemy
            count_before = db.session.execute(text("SELECT COUNT(*) FROM job_applications")).scalar()
            print(f"Applications before cleanup: {count_before}")
            
            # Delete all applications
            db.session.execute(text("DELETE FROM job_applications"))
            db.session.commit()
            
            count_after = db.session.execute(text("SELECT COUNT(*) FROM job_applications")).scalar()
            print(f"Applications after cleanup: {count_after}")
            
            # Check for duplicates (Multiple CVs)
            duplicates = db.session.execute(text("""
                SELECT user_id, COUNT(*) 
                FROM user_cvs 
                GROUP BY user_id 
                HAVING COUNT(*) > 1
            """)).fetchall()
            
            if duplicates:
                print("\nWARNING: Found users with multiple CV entries (Causes duplicates in join):")
                for user_id, count in duplicates:
                    print(f"User {user_id}: {count} CVs")
                    
        except Exception as e:
            print(f"Error during cleanup: {e}")
            db.session.rollback()

if __name__ == "__main__":
    clean_applications()
