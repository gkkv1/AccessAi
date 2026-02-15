"""
Database initialization script.
Enables pgvector extension and creates all tables.
"""
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.db.base import Base
from app.models import models  # Import models to register them with Base
import sys

def init_database():
    """Initialize the database with pgvector extension and create all tables."""
    try:
        print("🔄 Connecting to database...")
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        
        # Enable pgvector extension
        print("🔄 Enabling pgvector extension...")
        with engine.connect() as connection:
            # Must commit immediately for extension
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            connection.commit()
            print("✅ pgvector extension enabled successfully")
        
        # Create all tables
        print("🔄 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully")
        
        print("\n✨ Database initialization complete!")
        return True
        
    except Exception as e:
        print(f"\n❌ Database initialization failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
