"""Add status pages summary columns to documents

Direct SQL migration to add missing columns to documents table
"""
from sqlalchemy import text
from app.db.session import engine

def migrate():
    with engine.connect() as conn:
        print("Adding missing columns to documents table...")
        
        # Check if columns exist first
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'documents' AND column_name IN ('status', 'pages', 'summary')
        """))
        existing = {row[0] for row in result}
        
        if 'status' not in existing:
            print("  Adding status column...")
            conn.execute(text("ALTER TABLE documents ADD COLUMN status VARCHAR DEFAULT 'processing'"))
            conn.commit()
        else:
            print("  status column already exists")
            
        if 'pages' not in existing:
            print("  Adding pages column...")
            conn.execute(text("ALTER TABLE documents ADD COLUMN pages INTEGER"))
            conn.commit()
        else:
            print("  pages column already exists")
            
        if 'summary' not in existing:
            print("  Adding summary column...")
            conn.execute(text("ALTER TABLE documents ADD COLUMN summary TEXT"))
            conn.commit()
        else:
            print("  summary column already exists")
        
        print("✅ Migration complete!")

if __name__ == "__main__":
    migrate()
