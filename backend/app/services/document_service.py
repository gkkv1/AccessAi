import shutil
import os
import uuid
from datetime import datetime
from fastapi import UploadFile
from app.schemas.document import Document

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory store for MVP (replace with DB later)
documents_db = []

class DocumentService:
    async def upload_document(self, file: UploadFile) -> Document:
        file_id = str(uuid.uuid4())
        file_ext = file.filename.split(".")[-1]
        file_path = f"{UPLOAD_DIR}/{file_id}.{file_ext}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        doc = Document(
            id=file_id,
            name=file.filename,
            type=file_ext,
            status="processing",
            uploaded_at=datetime.now(),
            url=file_path
        )
        documents_db.append(doc)
        
        # TODO: Trigger Async Processing (Vision/OCR) here
        # For now, simulate ready state
        doc.status = "ready"
        doc.pages = 10  # Mock
        
        return doc

    async def get_documents(self) -> list[Document]:
        return documents_db

    async def get_document(self, doc_id: str) -> Document | None:
        for doc in documents_db:
            if doc.id == doc_id:
                return doc
        return None

document_service = DocumentService()
