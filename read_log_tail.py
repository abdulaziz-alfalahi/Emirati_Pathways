
import os

log_file = 'server_5005_fixed.log'
try:
    with open(log_file, 'rb') as f:
        # Move to end of file
        f.seek(0, 2)
        end_pos = f.tell()
        
        # Back up a bit to read tail (approx last 4KB)
        read_len = min(4096, end_pos)
        f.seek(-read_len, 2)
        
        lines = f.readlines()
        
        # Decode and print last 30 lines
        print(f"--- Last 30 lines of {log_file} ---")
        for line in lines[-30:]:
            print(line.decode('utf-8', errors='replace').strip())
            
except Exception as e:
    print(f"Error reading log: {e}")
