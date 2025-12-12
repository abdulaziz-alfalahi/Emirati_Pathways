
import os

debug_dir = r"c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\backend\debug_output"
files = [f for f in os.listdir(debug_dir) if f.endswith('.pdf')]
files.sort(reverse=True)

if not files:
    print("No PDF files found.")
    exit()

latest_file = os.path.join(debug_dir, files[0])
print(f"Inspecting: {latest_file}")
print(f"Size: {os.path.getsize(latest_file)} bytes")

import re

try:
    with open(latest_file, 'rb') as f:
        content = f.read()
        
    # Find all objects
    objects = re.finditer(b'(\d+ \d+ obj)', content)
    
    for match in objects:
        start = match.start()
        # Find end of dictionary (start of stream or endobj)
        end_dict = content.find(b'>>', start)
        if end_dict != -1:
            obj_content = content[start:end_dict+2]
            print("\n--- Object ---")
            print(obj_content.decode('latin-1', errors='replace'))
            
            # Check if it has a stream
            stream_start = content.find(b'stream', end_dict)
            if stream_start != -1 and stream_start < end_dict + 20:
                print("(Has Stream)")
except Exception as e:
    print(f"Error reading file: {e}")
