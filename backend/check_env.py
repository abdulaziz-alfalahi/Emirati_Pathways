
import os
import sys
from dotenv import load_dotenv

script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '.env')
loaded = load_dotenv(env_path)

print(f"Checking .env at: {env_path}")
print(f"load_dotenv returned: {loaded}")

api_key = os.getenv('GEMINI_API_KEY')
if api_key:
    # Print first/last few chars only for security
    masked = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "***"
    print(f"GEMINI_API_KEY: FOUND ({masked})")
else:
    print("GEMINI_API_KEY: NOT FOUND")

print(f"Current CWD: {os.getcwd()}")
