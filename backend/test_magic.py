import magic
import sys

try:
    print(f"Imported magic: {magic}")
    # Create a dummy PDF header
    pdf_header = b'%PDF-1.4'
    
    try:
        mime = magic.from_buffer(pdf_header, mime=True)
        print(f"Magic from buffer result: {mime}")
    except Exception as e:
        print(f"Magic from buffer FAILED: {e}")

except AttributeError as e:
    print(f"Magic import issue (AttributeError): {e}")
except ImportError as e:
    print(f"Magic import failed: {e}")
except Exception as e:
    print(f"General error: {e}")
