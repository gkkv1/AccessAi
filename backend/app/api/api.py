from fastapi import APIRouter
from app.api import documents, chat, forms, transcribe, auth

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(transcribe.router, prefix="/transcribe", tags=["transcribe"])
api_router.include_router(forms.router, prefix="/forms", tags=["forms"])
