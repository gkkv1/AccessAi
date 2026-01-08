from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from app.services.document_service import document_service
from app.schemas.document import Document

router = APIRouter()

@router.post("/", response_model=Document)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    return await document_service.upload_document(file)

@router.get("/", response_model=List[Document])
async def get_documents():
    return await document_service.get_documents()

@router.get("/{doc_id}", response_model=Document)
async def get_document(doc_id: str):
    doc = await document_service.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
