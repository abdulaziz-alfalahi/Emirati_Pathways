import sys
import os

# Add project root to sys.path
sys.path.append(os.getcwd())

from backend.app import create_app
from backend.extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Checking database schema...")
    try:
        # Check if columns exist
        with db.engine.connect() as conn:
            # Check for latitude
            try:
                conn.execute(text("SELECT latitude FROM candidate_profiles LIMIT 1"))
                print("Column 'latitude' already exists.")
            except Exception:
                print("Column 'latitude' missing. Adding...")
                conn.execute(text("ALTER TABLE candidate_profiles ADD COLUMN latitude FLOAT"))
                conn.commit()
                print("Added 'latitude'.")

            # Check for longitude
            try:
                conn.execute(text("SELECT longitude FROM candidate_profiles LIMIT 1"))
                print("Column 'longitude' already exists.")
            except Exception:
                print("Column 'longitude' missing. Adding...")
                conn.execute(text("ALTER TABLE candidate_profiles ADD COLUMN longitude FLOAT"))
                conn.commit()
                print("Added 'longitude'.")
                
        print("Schema update complete.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
