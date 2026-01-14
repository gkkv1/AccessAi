import shutil
import os
import uuid
from datetime import datetime
from fastapi import UploadFile
from sqlalchemy.orm import Session
import uuid
from app.models.models import Document as DocumentModel  # ORM model, NOT Pydantic schema
# Removed circular import - rag_service will be called via background task instead

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory store for MVP (replace with DB later)
documents_db = []

class DocumentService:
    async def upload_document(self, db: Session, file: UploadFile, user_id: uuid.UUID) -> dict:
        # 1. Save File to Disk
        file_id = str(uuid.uuid4())
        file_ext = file.filename.split(".")[-1]
        file_path = f"{UPLOAD_DIR}/{file_id}.{file_ext}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Save Metadata to DB using RAW SQL (bypass ORM entirely)
        from sqlalchemy import text
        from datetime import datetime
        
        db.execute(text("""
            INSERT INTO documents (id, user_id, title, file_path, file_type, status, created_at)
            VALUES (:id, :user_id, :title, :file_path, :file_type, :status, :created_at)
        """), {
            "id": file_id,
            "user_id": str(user_id),
            "title": file.filename,
            "file_path": file_path,
            "file_type": file_ext,
            "status": "ready",
            "created_at": datetime.now()
        })
        db.commit()
        
        # 3. Trigger RAG Ingestion in Background
        # Import here to avoid circular dependency
        from app.services.rag_service import rag_service
        try:
            await rag_service.ingest_document(db, file_id)
        except Exception as e:
            print(f"RAG Ingestion Error: {e}")
            # Don't fail upload if ingestion fails
        
        # Return dict instead of ORM model
        return {
            "id": str(file_id),  # Convert UUID to string for Pydantic
            "title": file.filename,
            "file_type": file_ext,
            "status": "ready",
            "file_path": file_path,
            "created_at": datetime.now().isoformat()  # Convert to ISO string
        }

    async def get_documents(self, db: Session, user_id: uuid.UUID) -> list[dict]:
        docs = db.query(DocumentModel).filter(DocumentModel.user_id == user_id).order_by(DocumentModel.created_at.desc()).all()
        # Convert ORM objects to dicts
        return [{
            "id": str(doc.id),
            "title": doc.title,
            "file_type": doc.file_type,
            "status": doc.status or "ready",
            "created_at": doc.created_at.isoformat() if doc.created_at else datetime.now().isoformat(),
            "pages": doc.pages,
            "summary": doc.summary,
            "file_path": doc.file_path
        } for doc in docs]

    async def get_document(self, db: Session, doc_id: str, user_id: uuid.UUID) -> dict | None:
        doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id, DocumentModel.user_id == user_id).first()
        if not doc:
            return None
        
        print(f"DEBUG: Fetching doc {doc_id}. Content length: {len(doc.content_text) if doc.content_text else 0}")
        
        return {
            "id": str(doc.id),
            "title": doc.title,
            "file_type": doc.file_type,
            "status": doc.status or "ready",
            "created_at": doc.created_at.isoformat() if doc.created_at else datetime.now().isoformat(),
            "pages": doc.pages,
            "summary": doc.summary,
            "file_path": doc.file_path,
            "content_text": doc.content_text # Added content_text
        }

document_service = DocumentService()
