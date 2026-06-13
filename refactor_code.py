import os
import re

role_map = {
    r"['\"]job_seeker['\"]": "'candidate'",
    r"['\"]student['\"]": "'candidate'",
    r"['\"]retiree['\"]": "'candidate'",
    r"['\"]hr_manager['\"]": "'employer_admin'",
    r"['\"]hr['\"]": "'employer_admin'",
    r"['\"]employer['\"]": "'employer_admin'",
    r"['\"]hr_recruiter['\"]": "'recruiter'",
    r"['\"]educator['\"]": "'training_provider'",
    r"['\"]training_center_rep['\"]": "'training_provider'",
    r"['\"]guardian['\"]": "'parent'",
    r"['\"]administrator['\"]": "'admin'",
    r"['\"]growth_operator_candidate['\"]": "'talent_operator'",
    r"['\"]nafis_talent_operator['\"]": "'talent_operator'",
    r"['\"]growth_operator_company['\"]": "'employer_relations'",
    r"['\"]growth_operator_education['\"]": "'education_operator'",
    r"['\"]growth_operator_assessment['\"]": "'assessment_operator'",
    r"['\"]growth_operator_mentorship['\"]": "'mentorship_operator'",
    r"['\"]growth_operator_community['\"]": "'community_operator'",
    r"['\"]growth_operator_monitoring['\"]": "'platform_operator'",
    r"['\"]operations_monitor['\"]": "'platform_operator'",
    r"['\"]operations_officer['\"]": "'platform_operator'",
    r"['\"]government['\"]": "'compliance_auditor'"
}

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    for pattern, repl in role_map.items():
        content = re.sub(pattern, repl, content)
        
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

dirs_to_scan = [
    '/home/aalfalahi.d/Emirati_Pathways/backend',
    '/home/aalfalahi.d/Emirati_Pathways/frontend/src'
]

for d in dirs_to_scan:
    for root, dirs, files in os.walk(d):
        if '.venv' in dirs:
            dirs.remove('.venv')
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith('.py') or file.endswith('.ts') or file.endswith('.tsx'):
                process_file(os.path.join(root, file))

print("Codebase refactoring complete.")
