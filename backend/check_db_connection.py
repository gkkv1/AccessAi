import os
import sys
import asyncio
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Force reload of .env
load_dotenv(override=True)

def check_connection():
    print("--- Database Connection Diagnostic ---")
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found in environment variables.")
        return

    # Redact password for display
    safe_url = database_url
    if ":" in safe_url and "@" in safe_url:
        parts = safe_url.split("@")
        safe_url = f"{parts[0].split(':')[0]}:****@{parts[1]}"
    
    print(f"Testing URL: {safe_url}")
    
    # Check if using pooler (6543) or direct (5432)
    if ":6543" in database_url:
        print("NOTICE: You are using the Supabase Transaction Pooler (port 6543).")
        print("        - This is good for serverless/Lambda.")
        print("        - This might NOT support 'CREATE EXTENSION' statements.")
        print("        - If verification fails, try port 5432 (Session mode).")
    elif ":5432" in database_url:
        print("NOTICE: You are using Direct Connection (port 5432).")
        print("        - This is required for 'CREATE EXTENSION'.")
        print("        - Ensure your IP is allowed in Supabase Dashboard (or IPv6 is working).")
    
    print("\nAttempting connection via SQLAlchemy...")
    
    try:
        engine = create_engine(database_url, connect_args={"connect_timeout": 10})
        with engine.connect() as connection:
            print("SUCCESS: Connected to database!")
            
            # Check version
            result = connection.execute(text("SELECT version();")).fetchone()
            print(f"Database Version: {result[0]}")
            
            # Check for pgvector
            print("\nChecking for 'vector' extension...")
            try:
                # Try to create it if it doesn't exist
                connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                connection.commit()
                print("SUCCESS: 'vector' extension is enabled (or already existed).")
            except Exception as e:
                print(f"WARNING: Could not enable 'vector' extension.")
                print(f"Reason: {e}")
                print("Tip: If using port 6543, switch to port 5432 for this step.")

    except Exception as e:
        print("\nFATAL ERROR: Connection failed.")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {e}")
        
        # Diagnostics
        if "timeout" in str(e).lower():
            print("\nDIAGNOSIS: Connection Timed Out.")
            print("1. Check if Supabase project is Paused.")
            print("2. Check if your IP is whitelisted (Settings > Network).")
            print("3. Potential IPv6 issue. Try using the IPv4-compatible alias if available (unlikely for Supabase unless configured) or ensure your network supports IPv6.")

if __name__ == "__main__":
    check_connection()
