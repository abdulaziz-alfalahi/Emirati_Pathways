
import os

def read_log():
    log_path = r"c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\backend\server.log"
    if not os.path.exists(log_path):
        print("Log file not found")
        return

    with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        print("".join(lines[-200:]))

if __name__ == "__main__":
    read_log()
