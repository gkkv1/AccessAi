from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, List, Any
from pydantic import BaseModel

from app.services.form_service import form_service
from app.api.deps import get_db, get_current_user
from app.models.models import User

router = APIRouter()

# --- Request Schemas ---

class AutoFillRequest(BaseModel):
    form_id: str
    fields: List[Dict[str, Any]] # Pass the field definitions so AI knows what to fill

class SubmitFormRequest(BaseModel):
    form_id: str
    data: Dict[str, Any]

class ChatSessionRequest(BaseModel):
    form_id: str
    fields: List[Dict[str, Any]]
    user_message: str
    history: List[Dict[str, str]] = []

# --- Endpoints ---

@router.post("/chat-session")
async def chat_session(
    request: ChatSessionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Handles conversational form filling logic.
    """
    return await form_service.interactive_chat(
        form_id=request.form_id,
        fields=request.fields,
        user_message=request.user_message,
        history=request.history
    )

@router.post("/autofill")
async def autofill_form(
    request: AutoFillRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Intelligently auto-fills a form based on the user's profile and context using AI.
    """
    return await form_service.autofill_form(
        form_id=request.form_id,
        fields=request.fields,
        user_id=str(current_user.id),
        db=db
    )

@router.post("/submit")
async def submit_form(
    request: SubmitFormRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Saves the form submission to the database.
    """
    return await form_service.submit_form(
        form_id=request.form_id,
        data=request.data,
        user_id=str(current_user.id),
        db=db
    )

