"""
Test what happens when career_level is None
"""
raw_level = None

lvl_map = {
    'Entry_Level': 'junior',
    'Mid_Level': 'mid', 
    'Senior_Level': 'senior',
    'Executive': 'executive',
    'Director': 'executive',
    'Manager': 'senior'
}

try:
    candidate_level = lvl_map.get(raw_level, raw_level.lower() if raw_level else 'mid')
    print(f"career_level: {candidate_level}")
    is_senior = str(candidate_level).lower() in ['senior', 'executive', 'senior_level', 'manager', 'director']
    print(f"is_senior: {is_senior}")
except Exception as e:
    print(f"Error: {e}")

# The current code:
try:
    candidate_level = lvl_map.get(raw_level, raw_level.lower())
    print(f"Current code result: {candidate_level}")
except Exception as e:
    print(f"Current code error: {e}")
