import socket
import sys

try:
    print("Checking 127.0.0.1:5003...")
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2)
    result = s.connect_ex(('127.0.0.1', 5003))
    if result == 0:
        print("Port 5003 is OPEN")
    else:
        print(f"Port 5003 is CLOSED (code: {result})")
    s.close()
except Exception as e:
    print(f"Error checking port: {e}")
