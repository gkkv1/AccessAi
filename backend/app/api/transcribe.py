from fastapi import APIRouter, UploadFile, File
from app.services.speech_service import speech_service

router = APIRouter()

@router.post("/", response_model=dict)
async def transcribe_audio(file: UploadFile = File(...)):
    return await speech_service.transcribe_audio(file)
