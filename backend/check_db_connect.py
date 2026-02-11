from app.db.database import SessionLocal
from sqlalchemy import text

try:
    db = SessionLocal()
    db.execute(text("SELECT 1"))
    print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
finally:
    db.close()
