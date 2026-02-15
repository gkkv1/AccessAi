from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.models.models import Transcription, User
from app.services.transcription_service import TranscriptionService

router = APIRouter()
transcription_service = TranscriptionService()


# Response Models
class TranscriptionResponse(BaseModel):
    id: str
    title: str
    audio_file_path: str
    transcript_text: str
    segments: list
    summary: str | None
    action_items: list
    key_concepts: list
    sentiment_score: float | None
    processed: bool
    created_at: str
    
    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    id: str
    message: str
    status: str


# Background task for processing transcription
def process_transcription_task(
    transcription_id: str,
    user_id: str,
    audio_file_path: str,
    title: str,
    db: Session
):
    """Background task to process transcription asynchronously."""
    try:
        print(f"Starting background processing for transcription {transcription_id}")
        
        # Process the transcription (UPDATE existing record)
        result = transcription_service.process_transcription(
            user_id=user_id,
            audio_file_path=audio_file_path,
            title=title,
            db=db,
            transcription_id=transcription_id  # Pass ID to update existing record
        )
        
        print(f"Background processing complete for {transcription_id}")
    except Exception as e:
        print(f"Background processing failed: {str(e)}")
        # Mark transcription as failed
        transcription = db.query(Transcription).filter(Transcription.id == transcription_id).first()
        if transcription:
            transcription.processed = False
            transcription.summary = f"Processing failed: {str(e)}"
            db.commit()


@router.post("/upload", response_model=UploadResponse)
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload an audio file for transcription.
    
    - Accepts: MP3, WAV, MP4, M4A, WebM, MPEG, MPGA
    - Max size: 25MB (OpenAI Whisper limit)
    - Processing happens in background
    """
    try:
        # Validate file type
        allowed_extensions = [".mp3", ".wav", ".mp4", ".m4a", ".webm", ".mpeg", ".mpga"]
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Create uploads/audio directory if it doesn't exist
        upload_dir = "uploads/audio"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_path = os.path.join(upload_dir, f"{file_id}{file_ext}")
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Use filename as title if not provided
        if not title:
            title = file.filename
        
        # Create initial database record
        transcription_id = str(uuid.uuid4())
        transcription = Transcription(
            id=transcription_id,
            user_id=current_user.id,
            title=title,
            audio_file_path=file_path,
            transcript_text="Processing...",
            segments=[],
            summary=None,
            action_items=[],
            key_concepts=[],
            sentiment_score=None,
            processed=False
        )
        
        db.add(transcription)
        db.commit()
        
        # Trigger background processing
        background_tasks.add_task(
            process_transcription_task,
            transcription_id,
            str(current_user.id),
            file_path,
            title,
            db
        )
        
        return UploadResponse(
            id=transcription_id,
            message="File uploaded successfully. Processing in background.",
            status="processing"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{transcription_id}", response_model=TranscriptionResponse)
async def get_transcription(
    transcription_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a specific transcription by ID."""
    transcription = db.query(Transcription).filter(
        Transcription.id == transcription_id,
        Transcription.user_id == current_user.id
    ).first()
    
    if not transcription:
        raise HTTPException(status_code=404, detail="Transcription not found")
    
    return TranscriptionResponse(
        id=str(transcription.id),
        title=transcription.title or "",
        audio_file_path=transcription.audio_file_path,
        transcript_text=transcription.transcript_text or "",
        segments=transcription.segments or [],
        summary=transcription.summary,
        action_items=transcription.action_items or [],
        key_concepts=transcription.key_concepts or [],
        sentiment_score=transcription.sentiment_score,
        processed=transcription.processed or False,
        created_at=transcription.created_at.isoformat() if transcription.created_at else ""
    )


@router.get("/list", response_model=List[TranscriptionResponse])
async def list_transcriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all transcriptions for the current user."""
    transcriptions = db.query(Transcription).filter(
        Transcription.user_id == current_user.id
    ).order_by(Transcription.created_at.desc()).all()
    
    return [
        TranscriptionResponse(
            id=str(t.id),
            title=t.title or "",
            audio_file_path=t.audio_file_path,
            transcript_text=t.transcript_text or "",
            segments=t.segments or [],
            summary=t.summary,
            action_items=t.action_items or [],
            key_concepts=t.key_concepts or [],
            sentiment_score=t.sentiment_score,
            processed=t.processed or False,
            created_at=t.created_at.isoformat() if t.created_at else ""
        )
        for t in transcriptions
    ]


@router.post("/analyze-text", response_model=TranscriptionResponse)
async def analyze_text(
    text: str,
    title: str = "Browser Transcription",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze already-transcribed text (from browser Web Speech API).
    This endpoint bypasses Whisper and only does GPT analysis.
    
    Use this when the frontend has already transcribed audio using Web Speech API.
    """
    try:
        # Create simple segments by splitting text into sentences
        sentences = text.split('. ')
        segments = []
        current_time = 0.0
        
        for i, sentence in enumerate(sentences):
            if sentence.strip():
                word_count = len(sentence.split())
                duration = max(2.0, word_count / 2.0)
                
                segments.append({
                    "id": str(i),
                    "start": current_time,
                    "end": current_time + duration,
                    "speaker": f"Speaker {(i % 3) + 1}",
                    "text": sentence.strip()
                })
                
                current_time += duration
        
        # Run AI analysis
        analysis = transcription_service.analyze_transcript(text, segments)
        
        # Create and save transcription record
        transcription = Transcription(
            user_id=current_user.id,
            title=title,
            audio_file_path="browser://web-speech-api",  # No actual file
            transcript_text=text,
            segments=segments,
            summary=analysis["summary"],
            action_items=analysis["action_items"],
            key_concepts=analysis["key_concepts"],
            sentiment_score=analysis["sentiment_score"],
            processed=True
        )
        
        db.add(transcription)
        db.commit()
        db.refresh(transcription)
        
        return TranscriptionResponse(
            id=str(transcription.id),
            title=transcription.title or "",
            audio_file_path=transcription.audio_file_path,
            transcript_text=transcription.transcript_text or "",
            segments=transcription.segments or [],
            summary=transcription.summary,
            action_items=transcription.action_items or [],
            key_concepts=transcription.key_concepts or [],
            sentiment_score=transcription.sentiment_score,
            processed=transcription.processed or False,
            created_at=transcription.created_at.isoformat() if transcription.created_at else ""
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.delete("/{transcription_id}")
async def delete_transcription(
    transcription_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a transcription and its associated audio file."""
    transcription = db.query(Transcription).filter(
        Transcription.id == transcription_id,
        Transcription.user_id == current_user.id
    ).first()
    
    if not transcription:
        raise HTTPException(status_code=404, detail="Transcription not found")
    
    # Delete audio file if it exists (and is not browser-based)
    if os.path.exists(transcription.audio_file_path) and not transcription.audio_file_path.startswith("browser://"):
        try:
            os.remove(transcription.audio_file_path)
        except Exception as e:
            print(f"Warning: Could not delete audio file: {str(e)}")
    
    # Delete database record
    db.delete(transcription)
    db.commit()
    
    return {"message": "Transcription deleted successfully"}
