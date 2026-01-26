import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Float, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    email_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    disability_type = Column(String, nullable=True)
    accessibility_preferences = Column(JSONB, default={})
    
    # Relationships
    forms = relationship("FormSubmission", back_populates="user")
    
    # Auth & Security
    biometric_registered = Column(Boolean, default=False)
    face_id_registered = Column(Boolean, default=False)
    face_id_data = Column(Text, nullable=True) # Storing face encoding/data (encrypted ideally)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Document(Base):
    """
    Stores uploaded documents and their embeddings for RAG.
    """
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False) # Local path or S3 URL
    file_type = Column(String, nullable=False) # pdf, txt, etc.
    content_text = Column(Text, nullable=True) # Extracted raw text
    
    # RAG Metadata
    status = Column(String, default="processing")
    pages = Column(Integer, nullable=True)
    summary = Column(Text, nullable=True)
    
    # Vector Embedding for Semantic Search (1536 dims for OpenAI text-embedding-3-small)
    embedding = Column(Vector(1536))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AccessDocumentChunk(Base):
    """
    Stores chunks of text from documents and their vector embeddings.
    Used for Semantic Search (RAG).
    """
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"))
    chunk_index = Column(Integer, nullable=False)
    text_content = Column(Text, nullable=False)
    
    # 1536 dimensions for OpenAI text-embedding-3-small
    embedding = Column(Vector(1536)) 
    
    # Metadata for citations (e.g. page number)
    page_number = Column(Integer, nullable=True)

class FormSubmission(Base):
    """
    Stores AI-extracted form data.
    """
    __tablename__ = "form_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    form_name = Column(String, nullable=False)
    
    # The raw document uploaded (if any)
    original_file_path = Column(String, nullable=True)
    
    # structured extraction result
    extracted_data = Column(JSONB, default={}) 
    
    status = Column(String, default="pending")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="forms")

class Transcription(Base):
    """
    Stores audio transcriptions and AI summaries.
    """
    __tablename__ = "transcriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    title = Column(String, nullable=True)  # User-friendly name for the transcription
    audio_file_path = Column(String, nullable=False)
    transcript_text = Column(Text, nullable=False)  # Full raw transcript
    
    # Detailed segment data with timestamps and speakers
    segments = Column(JSONB, default=[])  # [{start: 0.5, end: 2.0, speaker: "A", text: "Hello"}]
    
    # AI Analysis Results
    summary = Column(Text, nullable=True)
    action_items = Column(JSONB, default=[])  # [{assignee: "John", task: "Email report", status: "pending"}]
    key_concepts = Column(JSONB, default=[])  # ["WCAG 2.2", "Accessibility Audit", "Feb 15 Deadline"]
    sentiment_score = Column(Float, nullable=True)  # -1.0 (Negative) to 1.0 (Positive)
    
    # Processing status
    processed = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
