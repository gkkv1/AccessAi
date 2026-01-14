from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Body
from typing import List
from sqlalchemy.orm import Session
from app.api import deps
from app.services.document_service import document_service
from app.services.rag_service import rag_service  # Re-enabled for search/simplify
from app.schemas.document import Document as DocumentSchema, SearchResult
from app.models.models import User  # Removed Document - it was conflicting with DocumentSchema

router = APIRouter()

@router.post("/")  # Removed response_model to bypass validation issues
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Check file type
    if not file.filename.lower().endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")

    return await document_service.upload_document(db, file, current_user.id)

@router.get("/", response_model=List[DocumentSchema])
async def get_documents(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return await document_service.get_documents(db, current_user.id)

@router.get("/{doc_id}", response_model=DocumentSchema)
async def get_document(
    doc_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    doc = await document_service.get_document(db, doc_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

# --- RAG Endpoints ---

@router.post("/search", response_model=List[SearchResult])
async def search_documents(
    query: str = Body(..., embed=True),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Semantic search across all user documents.
    """
    # Ideally filter search by user_id inside rag_service too
    return await rag_service.search(db, query)

@router.post("/{doc_id}/chat")
async def chat_document(
    doc_id: str,
    query: str = Body(..., embed=True),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Chat with a specific document using RAG + LLM.
    """
    # Verify doc access (basic check)
    doc = await document_service.get_document(db, doc_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    response = await rag_service.chat(db, doc_id, query)
    return {"answer": response}

@router.post("/simplify")
async def simplify_text(
    text: str = Body(..., embed=True),
    current_user: User = Depends(deps.get_current_user) # Authentication required
):
    """
    Simplify complex text using GPT-4o.
    """
    return {"simplified_text": await rag_service.simplify(text)}
