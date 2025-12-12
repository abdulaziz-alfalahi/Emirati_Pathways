
import re

target_file = r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\frontend\src\pages\cv-builder\AutoFillCVBuilder.tsx'

with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern: t('cvBuilder.someKey'
# We want to replace it with t('someKey'
# We also need to handle cases like t('cvBuilder.startFromScratch', { ... })

# Regex: t\(['"]cvBuilder\.([^'"]+)['"]
# Replacement: t('$1'

new_content = re.sub(r"t\(['\"]cvBuilder\.([^'\"]+)['\"]", r"t('\1'", content)

with open(target_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Replaced {content.count('cvBuilder.') - new_content.count('cvBuilder.')} occurrences.")
