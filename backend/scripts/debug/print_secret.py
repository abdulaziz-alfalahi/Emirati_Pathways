import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.security_config import SecurityConfig
    print(f"SECRET:{SecurityConfig.JWT_SECRET_KEY}")
except Exception as e:
    print(f"Error: {e}")
    # Fallback: check if we can read it via dotenv
    try:
        from dotenv import load_dotenv
        load_dotenv(r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\backend\.env')
        print(f"DOTENV_SECRET:{os.getenv('JWT_SECRET_KEY')}")
    except:
        pass
