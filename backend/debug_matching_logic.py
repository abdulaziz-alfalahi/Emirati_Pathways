
import psycopg2
import os
import json
from unified_server import _collect_cv_keywords, _vacancy_keywords, _compute_match_score, STOPWORDS

# Database connection
conn = psycopg2.connect(
    dbname=os.environ.get('DB_NAME', 'emirati_pathways'),
    user=os.environ.get('DB_USER', 'postgres'),
    password=os.environ.get('DB_PASSWORD', 'password'),
    host=os.environ.get('DB_HOST', 'localhost'),
    port=os.environ.get('DB_PORT', '5432')
)
cur = conn.cursor()

def debug_matching():
    # 1. Get the visible CV
    print("\n--- 1. Fetching Visible CV ---")
    cur.execute("SELECT * FROM user_cvs WHERE is_visible = TRUE ORDER BY updated_at DESC, id DESC LIMIT 1")
    cv = cur.fetchone()
    if not cv:
        print("No visible CV found.")
        return
    
    cv_dict = {desc.name: cv[i] for i, desc in enumerate(cur.description)}
    print(f"CV Found: {cv_dict.get('title', 'Untitled')}")
    
    # 2. Extract CV Keywords
    print("\n--- 2. Extracting CV Keywords ---")
    cvk = _collect_cv_keywords(cv_dict)
    print(f"CV Skills ({len(cvk['skills'])}): {sorted(list(cvk['skills']))}")
    print(f"CV Text Tokens ({len(cvk['text'])}): {sorted(list(cvk['text']))[:10]}...") # Show first 10
    print(f"CV Location: {cvk['location']}")

    # 3. Match against "HR Coordinator" specifically
    print("\n--- 3. Matching against HR Coordinator ---")
    cur.execute("SELECT * FROM recruiter_vacancies WHERE title ILIKE '%HR Coordinator%' LIMIT 1")
    v = cur.fetchone()
    
    scored = []
    if not v:
        print("HR Coordinator vacancy not found in DB.")
        return

    col_names = [desc.name for desc in cur.description]
    v_dict = {col_names[i]: val for i, val in enumerate(v)}
    vk = _vacancy_keywords(v_dict)
    score = _compute_match_score(cvk, vk)
    
    top_match = v_dict
    top_match['debug_score'] = score
    top_match['vk'] = vk
    
    # ... (Rest of print logic is same, just indented or reused)
    scored = [top_match]

    # 4. Detailed Breakdown of Top Match
    top_match = scored[0]
    print(f"\n--- TOP MATCH: {top_match['title']} ({top_match['debug_score']}%) ---")
    
    vk = top_match['vk']
    
    # Skills Math
    skill_overlap = cvk['skills'] & vk['skills']
    skill_total = max(1, len(vk['skills']))
    skill_score_raw = (len(skill_overlap) / skill_total) * 60
    
    print(f"\n[SKILLS] (Weight: 60%)")
    print(f"Vacancy Skills: {sorted(list(vk['skills']))}")
    print(f"Matching Skills: {sorted(list(skill_overlap))}")
    print(f"Score: {len(skill_overlap)}/{len(vk['skills'])} * 60 = {skill_score_raw:.2f}")

    # Text Math
    text_overlap = cvk['text'] & vk['text']
    text_total = max(1, len(vk['text']))
    text_score_raw = (len(text_overlap) / text_total) * 30
    
    print(f"\n[TEXT] (Weight: 30%)")
    print(f"Matching Text Tokens: {sorted(list(text_overlap))}")
    print(f"Score: {len(text_overlap)}/{len(vk['text'])} * 30 = {text_score_raw:.2f}")

    # Location Math
    loc_match = (cvk['location'] and cvk['location'] in vk['location'])
    loc_score_raw = 10 if loc_match else 0
    print(f"\n[LOCATION] (Weight: 10%)")
    print(f"CV: {cvk['location']} vs Job: {vk['location']}")
    print(f"Score: {loc_score_raw}")

    print(f"\n[TOTAL]")
    print(f"{skill_score_raw:.2f} + {text_score_raw:.2f} + {loc_score_raw} = {skill_score_raw + text_score_raw + loc_score_raw:.2f} -> Rounded: {top_match['debug_score']}")

if __name__ == "__main__":
    debug_matching()
