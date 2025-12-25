
from unified_server import execute_query, app

with app.app_context():
    query = "SELECT user_id, COUNT(*), MIN(title) as sample_title FROM user_cvs GROUP BY user_id"
    rows = execute_query(query)
    print("CV Counts by User ID:")
    for row in rows:
        print(row)
