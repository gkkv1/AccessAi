from app.db.session import engine
from app.models.models import Base
from sqlalchemy import text

def reset_db():
    print("WARNING: This will DROP ALL TABLES in the public schema.")
    print("Connecting...")
    
    try:
        # 1. Drop all tables
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("Tables dropped.")
        
        # 2. Create all tables
        print("Re-creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully!")
        
        # 3. Verify
        with engine.connect() as conn:
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result]
            print(f"Current tables: {tables}")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    reset_db()
