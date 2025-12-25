
import os

def search_log():
    log_path = r"c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\backend\server.log"
    if not os.path.exists(log_path):
        print("Log file not found")
        return

    found = False
    with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if "DEBUG: Fetching jobs" in line or "CRITICAL ERROR" in line:
                print("FOUND LOG:")
                print(line)
                # Print next few lines for context/traceback
                try:
                    for _ in range(20):
                        print(next(f))
                except StopIteration:
                    pass
                found = True
    
    if not found:
        print("No specific error log found.")

if __name__ == "__main__":
    search_log()
