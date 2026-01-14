from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.models import Document
import sys

def verify_document_content(doc_id):
    db: Session = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            print(f"Document {doc_id} NOT FOUND")
            return

        print(f"Document Found: {doc.title}")
        print(f"Status: {doc.status}")
        print(f"Pages: {doc.pages}")
        
        if doc.content_text:
            print(f"--- CONTENT START ---")
            print(f"Content Length: {len(doc.content_text)} chars")
            print(f"Preview: {doc.content_text[:50]}...")
            print(f"--- CONTENT END ---")
        else:
            print("--- CONTENT IS NULL ---")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Use the ID from user request
    verify_document_content("b887d4f5-dfae-4eea-bf6c-438a5c3b9ce9")
