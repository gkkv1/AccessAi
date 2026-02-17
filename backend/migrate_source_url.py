"""
Migration script to add source_url to the transcriptions table.
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.session import engine


def migrate():
    print("Migrating transcriptions table to add source_url...")
    
    with engine.begin() as conn:
        # Add source_url column if missing
        try:
            add_source_url = text("ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS source_url VARCHAR;")
            conn.execute(add_source_url)
            print("✓ Added 'source_url' column")
        except Exception as e:
            print(f"  'source_url' column: {e}")
        
        print("✓ Migration complete!")


if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
