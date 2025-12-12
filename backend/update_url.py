
import os

file_path = r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\frontend\src\services\cvStorageService.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_line = "const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5005';"
new_line = "const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';"

if old_line in content:
    content = content.replace(old_line, new_line)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated API_BASE_URL.")
else:
    print("Target line not found.")
    # Debug: print first 10 lines
    print("First 10 lines:")
    print('\n'.join(content.split('\n')[:10]))
