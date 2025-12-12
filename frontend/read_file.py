
try:
    with open('src/pages/cv-builder/AutoFillCVBuilder.tsx', 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            print(f"{i+1}:{line}", end='')
except Exception as e:
    print(f"Error: {e}")
