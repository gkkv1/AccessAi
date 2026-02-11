import asyncio
import asyncpg
from sqlalchemy import text
from app.db.session import engine
from app.core.config import settings

def init_vector_db():
    print(f"Connecting to database at: {settings.DATABASE_URL.split('@')[1]}") # Hiding credentials
    
    # Simple check for port 6543 (transaction pooler) which often fails EXTENSION creation
    if ":6543" in settings.DATABASE_URL:
        print("\n[WARNING] You appear to be using Port 6543 (Transaction Pooler).")
        print("          'CREATE EXTENSION' commands often require the Direct Connection (Port 5432).")
        print("          If this fails, please switch DATABASE_URL to use Port 5432 temporarily.\n")

    try:
        with engine.connect() as connection:
            print("1. Connection Successful!")
            
            print("2. Attempting to enable 'vector' extension...")
            # Using text() for raw SQL execution
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            connection.commit()
            print("SUCCESS: 'vector' extension is enabled.")
            
    except Exception as e:
        import traceback
        error_msg = str(e)
        
        with open("db_error.txt", "w") as f:
            traceback.print_exc(file=f)
            f.write(f"\nSimple Error: {error_msg}")
        
        print(f"\n[ERROR] Database initialization failed. Details logged to db_error.txt")
        print(f"Error Summary: {error_msg}")
        
        print("\nTroubleshooting Steps:")
        print("1. CONNECTION TIMEOUT: Check if your IP is whitelisted in Supabase (Network Settings).")
        print("2. PORT ISSUE: If using port 6543, change to 5432 (Direct Connection) in .env for this setup.")
        print("3. PASSWORD: Check if your password contains special characters that need URL encoding.")
        print("4. VPN/PROXY: Disable VPNs as they might block the connection.")

if __name__ == "__main__":
    init_vector_db()
