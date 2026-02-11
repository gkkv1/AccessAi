"""
Migration script to update the transcriptions table with new fields.
Adds: title, segments, key_concepts, processed
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.session import engine


def migrate():
    print("Migrating transcriptions table...")
    
    with engine.begin() as conn:
        # Check if table exists
        check_query = text("SELECT to_regclass('public.transcriptions');")
        result = conn.execute(check_query)
        table_exists = result.scalar()
        
        if not table_exists:
            print("Table 'transcriptions' does not exist. Creating it...")
            create_table_query = text("""
            CREATE TABLE transcriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                title VARCHAR,
                audio_file_path VARCHAR NOT NULL,
                transcript_text TEXT NOT NULL,
                segments JSONB DEFAULT '[]',
                summary TEXT,
                action_items JSONB DEFAULT '[]',
                key_concepts JSONB DEFAULT '[]',
                sentiment_score FLOAT,
                processed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """)
            conn.execute(create_table_query)
            print("✓ Table 'transcriptions' created successfully.")
        else:
            print("Table 'transcriptions' already exists. Adding missing columns...")
            
            # Add title column if missing
            try:
                add_title = text("ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS title VARCHAR;")
                conn.execute(add_title)
                print("✓ Added 'title' column")
            except Exception as e:
                print(f"  'title' column: {e}")
            
            # Add segments column if missing
            try:
                add_segments = text("ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS segments JSONB DEFAULT '[]';")
                conn.execute(add_segments)
                print("✓ Added 'segments' column")
            except Exception as e:
                print(f"  'segments' column: {e}")
            
            # Add key_concepts column if missing
            try:
                add_key_concepts = text("ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS key_concepts JSONB DEFAULT '[]';")
                conn.execute(add_key_concepts)
                print("✓ Added 'key_concepts' column")
            except Exception as e:
                print(f"  'key_concepts' column: {e}")
            
            # Add processed column if missing
            try:
                add_processed = text("ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;")
                conn.execute(add_processed)
                print("✓ Added 'processed' column")
            except Exception as e:
                print(f"  'processed' column: {e}")
            
            print("✓ Migration complete!")


if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
