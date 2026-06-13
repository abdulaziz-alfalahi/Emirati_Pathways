import re

file_path = '/home/aalfalahi.d/Downloads/test_users_guide.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    r"`hr_manager`": "`employer_admin`",
    r"`growth_operator`": "`talent_operator`",
    r"`operations_officer`": "`platform_operator`",
    r"`student`": "`candidate`",
    r"`training_center`": "`training_provider`"
}

for k, v in replacements.items():
    content = re.sub(k, v, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
