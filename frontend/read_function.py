
try:
    with open('src/pages/cv-builder/AutoFillCVBuilder.tsx', 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
            
    # Locate handleDeleteCV
    start_idx = content.find('const handleDeleteCV')
    if start_idx == -1:
        print("Could not find handleDeleteCV")
        exit()
        
    end_idx = content.find('};', start_idx)
    print(content[start_idx:end_idx+2])
    
except Exception as e:
    print(f"Error: {e}")
