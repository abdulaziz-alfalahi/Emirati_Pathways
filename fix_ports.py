import os

root_dir = r"c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\frontend\src"
count = 0
for subdir, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
            filepath = os.path.join(subdir, file)
            try:
                # Try simple read first
                content = ""
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                except UnicodeDecodeError:
                    # Fallback for weird files
                    with open(filepath, 'r', encoding='latin-1') as f:
                        content = f.read()
                
                if '5003' in content:
                    new_content = content.replace('5003', '5005')
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")
                    count += 1
            except Exception as e:
                print(f"Skipping {filepath}: {e}")
print(f"Total files updated: {count}")
