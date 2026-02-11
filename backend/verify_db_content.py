from app.db.session import SessionLocal
from app.models import models
from sqlalchemy import text

from app.core.config import settings

def verify_content():
    print(f"DEBUG: DATABASE_URL={settings.DATABASE_URL.split('@')[-1]}") # Print host only
    db = SessionLocal()
    try:
        print(f"DEBUG: Document Columns: {[c.name for c in models.Document.__table__.columns]}")
        print("--- CHECKING DATABASE CONTENT ---")
        
        # Check Users
        users = db.query(models.User).all()
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f"- User: {u.email} (ID: {u.id})")
            print(f"  Biometric: {u.biometric_registered}")
            print(f"  Face ID Reg: {u.face_id_registered}")
            print(f"  Face Token: {u.face_id_data[:20] if u.face_id_data else 'None'}...")
        
        # Check Documents (If any)
        docs = db.query(models.Document).all()
        print(f"\nTotal Documents: {len(docs)}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_content()
