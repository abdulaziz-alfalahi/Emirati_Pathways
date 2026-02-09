
import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

from backend.routes.admin_dashboard_api import ensure_feedback_table_exist

print("Running manual feedback table migration...")
try:
    ensure_feedback_table_exist()
    print("✅ Migration function called successfully.")
except Exception as e:
    print(f"❌ Migration failed: {e}")
    import traceback
    traceback.print_exc()

# Verify
from backend.routes.admin_dashboard_api import execute_query
res = execute_query("SELECT COUNT(*) FROM feedback", fetch_one=True)
print(f"Final Count: {res}")
