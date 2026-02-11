import sys
import os

# Add current directory to path so 'app' can be imported
sys.path.append(os.getcwd())

from app.db.session import engine
from sqlalchemy import text

def migrate():
    print("Migrating FormSchema...")
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'"))
            conn.commit()
        print("✅ Migration successful: Added 'status' column.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate()
