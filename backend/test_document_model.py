from app.db.session import SessionLocal
from app.models.models import Document
import uuid

db = SessionLocal()

print("Testing Document Model...")
print(f"Document columns: {[c.name for c in Document.__table__.columns]}")

try:
    test_doc = Document(
        id=str(uuid.uuid4()),
        user_id="12345678-1234-1234-1234-123456789012",  # Dummy UUID
        title="Test Document",
        file_path="/tmp/test.pdf",
        file_type="pdf",
        status="processing"
    )
    print("✅ Document instance created successfully")
    print(f"   Status: {test_doc.status}")
except Exception as e:
    print(f"❌ Failed to create Document: {e}")

db.close()
