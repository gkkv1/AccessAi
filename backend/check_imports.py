import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    print("1. Testing config import...")
    from app.core.config import get_settings
    print("   SUCCESS: get_settings imported.")

    print("2. Testing rag_service import...")
    from app.services.rag_service import rag_service
    print("   SUCCESS: rag_service imported.")

    print("3. Testing auth import...")
    from app.api import auth
    print("   SUCCESS: auth imported.")
    
    print("\nALL IMPORTS PASSED.")

except Exception as e:
    print(f"\nIMPORT FAILED: {e}")
    sys.exit(1)
