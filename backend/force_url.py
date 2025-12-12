
import os

file_path = r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\frontend\src\services\cvStorageService.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Try to find the line with VITE_API_BASE_URL
lines = content.split('\n')
target_index = -1
for i, line in enumerate(lines):
    if 'const API_BASE_URL =' in line:
        target_index = i
        break

if target_index != -1:
    print(f"Found line: {lines[target_index]}")
    lines[target_index] = "const API_BASE_URL = ''; // Forced relative path for proxy"
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print("Successfully forced API_BASE_URL.")
else:
    print("Target line not found.")
