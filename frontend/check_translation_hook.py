
try:
    with open('src/pages/cv-builder/AutoFillCVBuilder.tsx', 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
            
    # Locate useTranslation
    start_idx = content.find('useTranslation')
    if start_idx == -1:
        print("Could not find useTranslation")
    else:
        # Print context around useTranslation
        print(content[start_idx:start_idx+100])
    
except Exception as e:
    print(f"Error: {e}")
