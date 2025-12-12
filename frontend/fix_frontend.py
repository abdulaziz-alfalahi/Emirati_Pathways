
import os

file_path = 'src/pages/cv-builder/AutoFillCVBuilder.tsx'
try:
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    # Fix 1: Add namespace to useTranslation using simple replacement of the line
    # Locate line containing useTranslation but NOT 'cv-builder'
    lines = content.splitlines()
    new_lines = []
    fixed = False
    
    for line in lines:
        if "useTranslation(" in line and "cv-builder" not in line and "useTranslation()" in line.replace(" ", ""):
            new_lines.append(line.replace("useTranslation()", "useTranslation('cv-builder')"))
            fixed = True
            print(f"Fixed line: {line.strip()}")
        else:
            new_lines.append(line)
            
    if fixed:
        content = "\n".join(new_lines)
    else:
        print("No matching useTranslation() call found to fix.")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        print("File saved successfully.")

except Exception as e:
    print(f"Error patching file: {e}")
